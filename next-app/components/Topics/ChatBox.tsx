'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import type { ChatMessage, Sender, FlashCardData } from '@/types/topics'
import ChatImportButton from '@/components/Topics/ChatImportButton'
import type { LlmProvider } from '@/types/llm'
import type { DocumentAnalysisResponse, DocumentSummaryResult } from '@/types/analysis'
import { loadLlmConfig } from '@/lib/llm/config'

interface ChatBoxProps {
  topicId: string
}

const STORAGE_KEYS = {
  chat: (topicId: string) => `chat:${topicId}`,
  docs: (topicId: string) => `documents:${topicId}`,
  quizzes: (topicId: string) => `quizzes:${topicId}`,
  flashcards: (topicId: string) => `flashcards:${topicId}`,
  summary: (topicId: string) => `summary:${topicId}`,
}
const MAX_CONTEXT_CHARS = 4000

export default function ChatBox({ topicId }: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [provider, setProvider] = useState<LlmProvider>('ollama')
  const [model, setModel] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState<string | undefined>(undefined)
  const [contextDoc, setContextDoc] = useState<DocumentAnalysisResponse | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quizStatus, setQuizStatus] = useState<string | null>(null)
  const [flashStatus, setFlashStatus] = useState<string | null>(null)
  const [summaryStatus, setSummaryStatus] = useState<string | null>(null)
  const [isClearing, setIsClearing] = useState(false)

  useEffect(() => {
    const storedCfg = loadLlmConfig()
    setProvider(storedCfg.provider)
    setModel(storedCfg.model ?? '')
    setBaseUrl(storedCfg.baseUrl ?? '')
    setApiKey(
      storedCfg.provider === 'openai'
        ? storedCfg.openaiApiKey
        : storedCfg.provider === 'gemini'
          ? storedCfg.geminiApiKey
          : undefined
    )
    setMessages(loadChat(topicId))
    const docs = loadDocs(topicId)
    if (docs.length > 0) {
      setContextDoc(docs[0])
    }
  }, [topicId])

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    [messages]
  )

  const makeMessage = (sender: Sender, text: string): ChatMessage => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    topicId,
    sender,
    text,
    timestamp: new Date().toISOString(),
  })

  const persistMessages = (next: ChatMessage[]) => {
    setMessages(next)
    try {
      localStorage.setItem(STORAGE_KEYS.chat(topicId), JSON.stringify(next))
    } catch {
      // ignore
    }
  }

  const persistDocs = (doc: DocumentAnalysisResponse) => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.docs(topicId),
        JSON.stringify([doc])
      )
    } catch {
      // ignore
    }
  }

  const persistSummary = (summary: DocumentSummaryResult) => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.summary(topicId),
        JSON.stringify(summary)
      )
    } catch {
      // ignore
    }
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return
    setError(null)
    setIsSending(true)

    const userMsg = makeMessage('user', text)
    const nextMessages = [...messages, userMsg]
    persistMessages(nextMessages)
    setInput('')

    try {
      const response = await fetch('/api/llm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          documentId: contextDoc?.documentId,
          message: text,
          context: contextDoc?.textPreview
            ? contextDoc.textPreview.slice(0, MAX_CONTEXT_CHARS)
            : undefined,
          model: model || undefined,
          baseUrl: provider === 'ollama' ? baseUrl || undefined : undefined,
          apiKey: provider !== 'ollama' ? apiKey || undefined : undefined,
        }),
      })

      const data = (await response.json()) as { reply?: string; message?: string }
      if (!response.ok || !data.reply) {
        throw new Error(data.message || 'Antwort konnte nicht generiert werden.')
      }

      const aiMsg = makeMessage('ai', data.reply)
      persistMessages([...nextMessages, aiMsg])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler im Chat.')
    } finally {
      setIsSending(false)
    }
  }

  const handleClear = () => {
    setIsClearing(true)
    try {
      localStorage.removeItem(STORAGE_KEYS.chat(topicId))
    } catch {
      // ignore
    } finally {
      setMessages([])
      setIsClearing(false)
    }
  }

  const handleImported = (doc: DocumentAnalysisResponse) => {
    setContextDoc(doc)
    persistDocs(doc)

    const userMsg = makeMessage('user', `📄 Datei analysiert: ${doc.fileName}`)
    const aiMsg = makeMessage(
      'ai',
      'Dokument gespeichert. Du kannst jetzt Fragen dazu stellen oder Quiz/Flashcards generieren.'
    )
    persistMessages([...messages, userMsg, aiMsg])
  }

  const handleGenerateQuiz = async () => {
    if (!contextDoc?.textPreview) {
      setQuizStatus('Kein Dokument im Kontext. Bitte PDF hochladen.')
      return
    }
    setQuizStatus('Erzeuge Quiz ...')
    try {
      const response = await fetch('/api/llm/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          topic: topicId,
          text: contextDoc.textPreview.slice(0, MAX_CONTEXT_CHARS),
          questionCount: 5,
          model: model || undefined,
          baseUrl: provider === 'ollama' ? baseUrl || undefined : undefined,
          apiKey: provider !== 'ollama' ? apiKey || undefined : undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.questions) {
        throw new Error(data?.message || 'Quiz konnte nicht generiert werden.')
      }

      localStorage.setItem(
        STORAGE_KEYS.quizzes(topicId),
        JSON.stringify(
          data.questions.map((q: any, index: number) => ({
            id: `${topicId}-${Date.now()}-${index}`,
            topicId,
            question: q.question,
            options: q.options,
            answerIndex: q.answerIndex,
          }))
        )
      )
      setQuizStatus('Quiz gespeichert. Im Tab "Quiz" verfügbar.')
    } catch (err) {
      setQuizStatus(
        err instanceof Error ? err.message : 'Fehler bei der Quiz-Generierung.'
      )
    }
  }

  const handleGenerateFlashcards = async () => {
    if (!contextDoc?.textPreview) {
      setFlashStatus('Kein Dokument im Kontext. Bitte PDF hochladen.')
      return
    }
    setFlashStatus('Erzeuge Flashcards ...')
    try {
      const response = await fetch('/api/llm/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          topic: topicId,
          text: contextDoc.textPreview.slice(0, MAX_CONTEXT_CHARS),
          cardCount: 6,
          model: model || undefined,
          baseUrl: provider === 'ollama' ? baseUrl || undefined : undefined,
          apiKey: provider !== 'ollama' ? apiKey || undefined : undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.cards) {
        throw new Error(data?.message || 'Flashcards konnten nicht generiert werden.')
      }

      const cards: FlashCardData[] = data.cards.map((c: any, index: number) => ({
        id: `${topicId}-${Date.now()}-${index}`,
        question: c.question,
        answer: c.answer,
        topicId,
      }))
      localStorage.setItem(
        STORAGE_KEYS.flashcards(topicId),
        JSON.stringify(cards)
      )
      setFlashStatus('Flashcards gespeichert. Im Tab "FlashCard" verfügbar.')
    } catch (err) {
      setFlashStatus(
        err instanceof Error
          ? err.message
          : 'Fehler bei der Flashcard-Generierung.'
      )
    }
  }

  const handleGenerateSummary = async () => {
    if (!contextDoc?.textPreview) {
      setSummaryStatus('Kein Dokument im Kontext. Bitte PDF hochladen.')
      return
    }
    setSummaryStatus('Erzeuge Zusammenfassung ...')
    try {
      const response = await fetch(
        contextDoc.documentId
          ? `/api/documents/${encodeURIComponent(contextDoc.documentId)}/summary`
          : `/api/topics/${topicId}/summary`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider,
            text: contextDoc.textPreview.slice(0, MAX_CONTEXT_CHARS),
            model: model || undefined,
            baseUrl: provider === 'ollama' ? baseUrl || undefined : undefined,
            apiKey: provider !== 'ollama' ? apiKey || undefined : undefined,
          }),
        }
      )

      const data = await response.json()
      if (!response.ok || !data.summary) {
        throw new Error(data?.message || 'Zusammenfassung konnte nicht erstellt werden.')
      }
      const rawSummary = (data as { summary: any }).summary
      const summaryResult: DocumentSummaryResult =
        typeof rawSummary === 'string'
          ? {
              summary: rawSummary,
              provider,
              model: model || 'unknown',
              generatedAt: new Date().toISOString(),
            }
          : {
              summary: rawSummary?.summary ?? '',
              provider: rawSummary?.provider ?? provider,
              model: rawSummary?.model ?? (model || 'unknown'),
              usedEndpoint: rawSummary?.usedEndpoint,
              generatedAt: rawSummary?.generatedAt ?? new Date().toISOString(),
            }
      persistSummary(summaryResult)
      setSummaryStatus(
        summaryResult.summary
          ? `Zusammenfassung gespeichert. Im Tab "Zusammenfassung" einsehbar.`
          : 'Zusammenfassung gespeichert. Im Tab "Zusammenfassung" einsehbar.'
      )
    } catch (err) {
      setSummaryStatus(
        err instanceof Error ? err.message : 'Fehler bei der Zusammenfassung.'
      )
    }
  }

  return (
    <Box>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant='subtitle1' fontWeight={600}>
              Kontext-Dokument
            </Typography>
            <Box display='flex' alignItems='center' justifyContent='space-between' gap={1}>
              <Box display='flex' alignItems='center' gap={1}>
                <Typography variant='body2'>Dokument:</Typography>
                {contextDoc ? (
                  <Chip label={contextDoc.fileName} size='small' color='primary' />
                ) : (
                  <Chip label='Kein Dokument' size='small' variant='outlined' />
                )}
              </Box>
              <ChatImportButton onUploaded={handleImported} />
            </Box>
            {!provider && (
              <Alert severity='warning'>Bitte LLM-Konfiguration im LLM-Tab setzen.</Alert>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card
        sx={{
          mb: 2,
          height: 420,
          overflowY: 'auto',
          p: 2,
        }}
      >
        <AnimatePresence initial={false}>
          {sortedMessages.map((m) => (
            <motion.div
              key={m.id}
              initial={{
                opacity: 0,
                x: m.sender === 'ai' ? -50 : 50,
              }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: m.sender === 'ai' ? -30 : 30 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <CardContent
                sx={{
                  bgcolor: m.sender === 'ai' ? 'primary.light' : 'background.paper',
                  color: 'text.primary',
                  mb: 1,
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant='body2'
                  fontWeight={m.sender === 'ai' ? 'bold' : 'normal'}
                  sx={{ opacity: 0.8 }}
                >
                  {m.sender === 'ai' ? 'StudyPilot KI:' : 'Du:'}
                </Typography>
                <Typography variant='body2'>{m.text}</Typography>
              </CardContent>
            </motion.div>
          ))}
        </AnimatePresence>
      </Card>

      <Stack spacing={1.5}>
        <TextField
          fullWidth
          placeholder='Frage stellen oder Zusammenfassung anfordern...'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button variant='contained' onClick={handleSend} disabled={isSending}>
            {isSending ? 'LLM antwortet...' : 'Senden'}
          </Button>
          <Button variant='outlined' onClick={handleGenerateQuiz}>
            Quiz aus PDF erzeugen
          </Button>
          <Button variant='outlined' onClick={handleGenerateFlashcards}>
            Flashcards aus PDF erzeugen
          </Button>
          <Button variant='outlined' onClick={handleGenerateSummary}>
            Zusammenfassung aus PDF
          </Button>
          <Button variant='text' color='error' onClick={handleClear} disabled={isSending || isClearing}>
            {isClearing ? 'Leeren...' : 'Chat leeren'}
          </Button>
        </Stack>
        {error && <Alert severity='error'>{error}</Alert>}
        {quizStatus && <Alert severity='info'>{quizStatus}</Alert>}
        {flashStatus && <Alert severity='info'>{flashStatus}</Alert>}
        {summaryStatus && <Alert severity='info'>{summaryStatus}</Alert>}
      </Stack>
    </Box>
  )
}

function loadChat(topicId: string): ChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.chat(topicId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function loadDocs(topicId: string): DocumentAnalysisResponse[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.docs(topicId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
