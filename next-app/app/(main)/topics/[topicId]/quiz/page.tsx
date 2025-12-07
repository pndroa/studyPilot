'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useParams } from 'next/navigation'
import type { QuizQuestion } from '@/types/topics'
import type { LlmQuizResponse } from '@/types/llm'
import { loadLlmConfig } from '@/lib/llm/config'
import type { DocumentAnalysisResponse } from '@/types/analysis'
const STORAGE_PREFIX = 'quizzes:'
const DOCS_KEY = (topicId: string) => `documents:${topicId}`
const PROGRESS_KEY = (topicId: string) => `quizzes:progress:${topicId}`
const MAX_CONTEXT_CHARS = 4000

export default function QuizPage() {
  const params = useParams<{ topicId: string }>()
  const topicId = params.topicId

  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([])
  const [provider, setProvider] = useState<string>('ollama')
  const [model, setModel] = useState('')
  const [baseUrl, setBaseUrl] = useState<string | undefined>(undefined)
  const [apiKey, setApiKey] = useState<string | undefined>(undefined)
  const [context, setContext] = useState(
    'Erstelle Fragen zu Kernthemen, definiere saubere Distraktoren und gib die richtige Antwort an.'
  )
  const [questionCount, setQuestionCount] = useState(4)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [contextDoc, setContextDoc] = useState<DocumentAnalysisResponse | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [finished, setFinished] = useState(false)
  const [isSavingResult, setIsSavingResult] = useState(false)
  const [saveStatus, setSaveStatus] = useState<{
    message: string
    severity: 'info' | 'success' | 'error'
  } | null>(null)

  useEffect(() => {
    const cfg = loadLlmConfig()
    setProvider(cfg.provider)
    setModel(cfg.model ?? '')
    setBaseUrl(cfg.baseUrl)
    setApiKey(
      cfg.provider === 'openai'
        ? cfg.openaiApiKey
        : cfg.provider === 'gemini'
          ? cfg.geminiApiKey
          : undefined
    )
    setContextDoc(loadDoc(topicId))
    const stored = loadStored(topicId)
    const progress = loadProgress(topicId)
    if (stored.length) {
      setQuizzes(stored)
      const nextAnswers =
        progress && progress.answers.length === stored.length
          ? progress.answers
          : Array(stored.length).fill(-1)
      setAnswers(nextAnswers)
      setCurrentIndex(clampIndex(progress?.index ?? 0, stored.length))
      setFinished(Boolean(progress?.finished))
    }
  }, [topicId])

  const hasConfig = useMemo(() => !!provider, [provider])

  const persist = (items: QuizQuestion[]) => {
    setQuizzes(items)
    try {
      localStorage.setItem(
        `${STORAGE_PREFIX}${topicId}`,
        JSON.stringify(items)
      )
    } catch {
      // ignore storage failures in browser sandbox
    }
  }

  useEffect(() => {
    if (quizzes.length === 0) return
    persistProgress(topicId, {
      index: clampIndex(currentIndex, quizzes.length),
      answers,
      finished,
    })
  }, [topicId, quizzes.length, currentIndex, answers, finished])

  const handleDelete = (id: string) => {
    const idx = quizzes.findIndex((q) => q.id === id)
    if (idx === -1) return
    const nextQuizzes = quizzes.filter((q) => q.id !== id)
    const nextAnswers = answers.filter((_, i) => i !== idx)
    setQuizzes(nextQuizzes)
    setAnswers(nextAnswers)
    setFinished(false)
    const nextIndex =
      nextQuizzes.length === 0 ? 0 : Math.min(currentIndex, nextQuizzes.length - 1)
    setCurrentIndex(nextIndex)
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${topicId}`, JSON.stringify(nextQuizzes))
    } catch {
      // ignore storage failures
    }
    if (nextQuizzes.length === 0) {
      clearProgress(topicId)
    }
  }

  const handleGenerate = async () => {
    if (!topicId) return
    setError(null)
    setIsLoading(true)
    const docContext = contextDoc?.textPreview
      ? contextDoc.textPreview.slice(0, MAX_CONTEXT_CHARS)
      : undefined
    try {
      const response = await fetch('/api/llm/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          topic: topicId,
          text: docContext || context,
          questionCount,
          model: model || undefined,
          baseUrl: provider === 'ollama' ? baseUrl || undefined : undefined,
          apiKey: provider !== 'ollama' ? apiKey || undefined : undefined,
        }),
      })

      const data = (await response.json()) as LlmQuizResponse | { message?: string }

      if (!response.ok) {
        throw new Error(
          'message' in data && data.message
            ? data.message
            : 'Quiz konnte nicht generiert werden.'
        )
      }

      const mapped = mapQuestions(topicId, data as LlmQuizResponse)
      persist(mapped)
      const emptyAnswers = Array(mapped.length).fill(-1)
      setAnswers(emptyAnswers)
      setCurrentIndex(0)
      setFinished(false)
      setSaveStatus(null)
      persistProgress(topicId, { index: 0, answers: emptyAnswers, finished: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler bei der Quiz-Generierung.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFinish = async () => {
    if (finished || quizzes.length === 0) return
    const correctCount = answers.filter(
      (ans, idx) => ans === quizzes[idx]?.answerIndex
    ).length
    setFinished(true)
    setIsSavingResult(true)
    setSaveStatus({ message: 'Speichere Ergebnis ...', severity: 'info' })
    try {
      const response = await fetch('/api/progress/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId,
          correct: correctCount,
          total: quizzes.length,
        }),
      })
      const payload = (await response.json().catch(() => ({}))) as { message?: string }
      if (!response.ok) {
        throw new Error(
          payload?.message || 'Quiz-Ergebnis konnte nicht gespeichert werden.'
        )
      }
      setSaveStatus({ message: 'Quiz-Ergebnis gespeichert.', severity: 'success' })
    } catch (err) {
      setSaveStatus({
        message:
          err instanceof Error
            ? err.message
            : 'Quiz-Ergebnis konnte nicht gespeichert werden.',
        severity: 'error',
      })
    } finally {
      setIsSavingResult(false)
    }
  }

  return (
    <Box>
      <Typography variant='h5' fontWeight='bold' mb={2}>
        Quizfragen zu diesem Thema
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant='subtitle1' fontWeight={600}>
              Fragen generieren
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Nutzt das zentrale LLM-Setup aus dem LLM-Tab und speichert die generierten Fragen lokal.
            </Typography>

            {!hasConfig && (
              <Alert severity='warning'>
                Bitte LLM im Tab &quot;LLM&quot; konfigurieren. Aktuell kein Provider gesetzt.
              </Alert>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label='Anzahl Fragen'
                type='number'
                inputProps={{ min: 2, max: 8 }}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value) || 3)}
                fullWidth
              />
              <TextField
                label='Kontext (optional)'
                value={context}
                onChange={(e) => setContext(e.target.value)}
                multiline
                minRows={3}
                fullWidth
                helperText={
                  contextDoc
                    ? `Verwendet automatisch das hochgeladene Dokument (${contextDoc.fileName}) als Kontext.`
                    : 'Ohne hochgeladenes Dokument wird dieser Text als Kontext genutzt.'
                }
              />
            </Stack>

            <Button
              variant='contained'
              onClick={handleGenerate}
              disabled={isLoading || !hasConfig}
            >
              {isLoading ? 'Quiz wird erstellt...' : 'Quizfragen generieren'}
            </Button>

            {error && <Alert severity='error'>{error}</Alert>}
          </Stack>
        </CardContent>
      </Card>

      {quizzes.length === 0 ? (
        <Typography>Keine Quizfragen vorhanden.</Typography>
      ) : (
        <Card>
          <CardContent>
            <Stack spacing={2}>
              {quizzes[currentIndex] ? (
                <>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent='space-between'
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    spacing={1}
                  >
                    <Typography variant='subtitle1' fontWeight={600}>
                      Frage {currentIndex + 1}/{quizzes.length}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Noch nicht beantwortet:{' '}
                      {answers.filter((ans) => ans === -1).length}/{quizzes.length}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant='determinate'
                    value={0}
                    sx={{ height: 0, p: 0, m: 0, border: 'none' }}
                  />
                  <ProgressBar segments={quizzes} answers={answers} finished={finished} />

                  <QuestionView
                    question={quizzes[currentIndex]}
                    selected={answers[currentIndex]}
                    onSelect={(idx) => {
                      setAnswers((prev) => {
                        const next = [...prev]
                        next[currentIndex] = idx
                        return next
                      })
                    }}
                    showSolution={finished}
                  />

                  <Stack direction='row' spacing={1}>
                    <Button
                      variant='outlined'
                      onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                      disabled={currentIndex === 0}
                    >
                      Vorherige
                    </Button>
                    <Button
                      variant='outlined'
                      onClick={() =>
                        setCurrentIndex((i) => Math.min(quizzes.length - 1, i + 1))
                      }
                      disabled={currentIndex === quizzes.length - 1}
                    >
                      Nächste
                    </Button>
                  <Button
                    variant='contained'
                    color='primary'
                    onClick={handleFinish}
                    disabled={
                      finished || answers.some((a) => a === -1) || quizzes.length === 0 || isSavingResult
                    }
                  >
                    {isSavingResult ? 'Speichere Ergebnis...' : 'Auswertung'}
                  </Button>
                  {finished && (
                    <Button
                      variant='outlined'
                      color='secondary'
                      onClick={() => {
                        setAnswers(Array(quizzes.length).fill(-1))
                        setCurrentIndex(0)
                        setFinished(false)
                        setSaveStatus(null)
                      }}
                    >
                      Quiz wiederholen
                    </Button>
                  )}
                  </Stack>

                  {finished && (
                    <Evaluation
                      correct={answers.filter(
                        (ans, idx) => ans === quizzes[idx]?.answerIndex
                      ).length}
                      total={quizzes.length}
                    />
                  )}
                  {saveStatus && <Alert severity={saveStatus.severity}>{saveStatus.message}</Alert>}

                  <Button
                    variant='text'
                    color='error'
                    onClick={() => handleDelete(quizzes[currentIndex].id)}
                  >
                    Aktuelle Frage löschen
                  </Button>
                </>
              ) : (
                <Alert severity='info'>Keine Frage an dieser Position.</Alert>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

function loadStored(topicId: string): QuizQuestion[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${topicId}`)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isQuizQuestion)
  } catch {
    return []
  }
}

function loadDoc(topicId: string): DocumentAnalysisResponse | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(DOCS_KEY(topicId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null
  } catch {
    return null
  }
}

function isQuizQuestion(item: unknown): item is QuizQuestion {
  const q = item as QuizQuestion
  return (
    typeof q?.id === 'string' &&
    typeof q?.question === 'string' &&
    Array.isArray(q?.options) &&
    typeof q?.answerIndex === 'number'
  )
}

function mapQuestions(topicId: string, response: LlmQuizResponse): QuizQuestion[] {
  return response.questions.map((q, index) => ({
    id: `${topicId}-${Date.now()}-${index}`,
    topicId,
    question: q.question,
    options: q.options,
    answerIndex: q.answerIndex,
  }))
}

function clampIndex(index: number, length: number) {
  if (length <= 0) return 0
  return Math.min(Math.max(index, 0), length - 1)
}

function loadProgress(topicId: string): {
  index: number
  answers: number[]
  finished: boolean
} | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(PROGRESS_KEY(topicId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as {
      index?: number
      answers?: number[]
      finished?: boolean
    }
    if (typeof parsed?.index !== 'number' || !Array.isArray(parsed.answers)) {
      return null
    }
    return {
      index: parsed.index,
      answers: parsed.answers,
      finished: Boolean(parsed.finished),
    }
  } catch {
    return null
  }
}

function persistProgress(
  topicId: string,
  progress: { index: number; answers: number[]; finished: boolean }
) {
  try {
    localStorage.setItem(PROGRESS_KEY(topicId), JSON.stringify(progress))
  } catch {
    // ignore
  }
}

function clearProgress(topicId: string) {
  try {
    localStorage.removeItem(PROGRESS_KEY(topicId))
  } catch {
    // ignore
  }
}

function QuestionView({
  question,
  selected,
  onSelect,
  showSolution,
}: {
  question: QuizQuestion
  selected: number
  onSelect: (index: number) => void
  showSolution: boolean
}) {
  return (
    <Stack spacing={1.5}>
      <Typography variant='h6'>{question.question}</Typography>
      {question.options.map((opt, idx) => {
      const isSelected = selected === idx
      const isCorrect = question.answerIndex === idx
      const color: 'success' | 'error' | 'primary' =
        showSolution && isCorrect
          ? 'success'
          : showSolution && isSelected && !isCorrect
            ? 'error'
            : 'primary'

        return (
        <Button
          key={idx}
          variant={isSelected ? 'contained' : 'outlined'}
          color={color}
          onClick={() => onSelect(idx)}
          sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
        >
            {opt}
          </Button>
        )
      })}
      {showSolution && (
        <Alert severity='info'>
          Richtige Antwort: {String.fromCharCode(65 + question.answerIndex)}.{' '}
          {question.options[question.answerIndex]}
        </Alert>
      )}
    </Stack>
  )
}

function ProgressBar({
  segments,
  answers,
  finished,
}: {
  segments: QuizQuestion[]
  answers: number[]
  finished: boolean
}) {
  const colors = segments.map((q, idx) => {
    const answer = answers[idx] ?? -1
    if (answer === -1) return '#9e9e9e' // grau für unbeantwortet
    if (finished) {
      return answer === q.answerIndex ? '#2e7d32' : '#c62828' // grün oder rot
    }
    return '#1976d2' // blau für beantwortet, aber noch nicht ausgewertet
  })

  const width = segments.length > 0 ? 100 / segments.length : 0

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
        border: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      {segments.map((_, idx) => (
        <Box
          key={idx}
          sx={{
            width: `${width}%`,
            bgcolor: colors[idx],
            transition: 'background-color 0.2s ease',
          }}
        />
      ))}
    </Box>
  )
}

function Evaluation({
  correct,
  total,
}: {
  correct: number
  total: number
}) {
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0
  let message = 'Gut gemacht!'
  let severity: 'success' | 'warning' | 'info' = 'success'

  if (percent === 100) {
    message = 'Perfekt! 100% – stark gemacht!'
    severity = 'success'
  } else if (percent >= 70) {
    message = `${percent}% richtig. Sehr ordentlich, weiter so!`
    severity = 'success'
  } else if (percent >= 40) {
    message = `${percent}% richtig. Da geht noch was – weiter üben.`
    severity = 'warning'
  } else {
    message = `${percent}% richtig. Dranbleiben und Inhalte noch einmal wiederholen.`
    severity = 'info'
  }

  return (
    <Alert severity={severity}>
      Du hast {correct} von {total} Fragen richtig beantwortet. {message}
    </Alert>
  )
}
