'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import QuizCard from '@/components/Topics/QuizCard'
import { useParams } from 'next/navigation'
import type { QuizQuestion } from '@/types/topics'
import type { LlmQuizResponse } from '@/types/llm'
import { loadLlmConfig } from '@/lib/llm/config'
import type { DocumentAnalysisResponse } from '@/types/analysis'
const STORAGE_PREFIX = 'quizzes:'
const DOCS_KEY = (topicId: string) => `documents:${topicId}`
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
    if (stored.length) {
      setQuizzes(stored)
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

  const handleDelete = (id: string) => {
    const next = quizzes.filter((q) => q.id !== id)
    persist(next)
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler bei der Quiz-Generierung.')
    } finally {
      setIsLoading(false)
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
                Bitte LLM im Tab "LLM" konfigurieren. Aktuell kein Provider gesetzt.
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
        quizzes.map((q) => (
          <QuizCard
            key={q.id}
            id={q.id}
            question={q.question}
            options={q.options}
            answerIndex={q.answerIndex}
            onDelete={handleDelete}
          />
        ))
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
