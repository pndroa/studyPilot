'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import type { OllamaTestResponse } from '@/types/ollama'
import type {
  LlmProvider,
  LlmQuizResponse,
  LlmSummaryResponse,
} from '@/types/llm'
import { loadLlmConfig, saveLlmConfig } from '@/lib/llm/config'

interface ProviderTestResult {
  ok: boolean
  provider: LlmProvider
  message: string
  baseUrl?: string
  endpoint?: string
  models?: { name: string }[]
  supportedModels?: string[]
}

const PROVIDER_OPTIONS: { value: LlmProvider; label: string; helper: string }[] = [
  { value: 'ollama', label: 'Ollama (lokal)', helper: 'Greift auf einen lokalen Ollama-Dienst zu.' },
  { value: 'openai', label: 'OpenAI', helper: 'Nutzt die OpenAI Chat Completions API (Server env: OPENAI_API_KEY).' },
  { value: 'gemini', label: 'Gemini', helper: 'Nutzt die Gemini API (Server env: GEMINI_API_KEY).' },
]

const DEFAULT_BASE_URL = 'http://127.0.0.1:11434'
const DEFAULT_SUMMARY =
  'Retrieval-Augmented Generation kombiniert eine Vektorsuche mit einem Sprachmodell. Der Nutzer stellt eine Frage, relevante Textpassagen werden per Similarity Search gesucht und als Kontext an das Modell gegeben, damit die Antwort faktenbasiert bleibt.'

export default function LlmPage() {
  const [provider, setProvider] = useState<LlmProvider>('ollama')
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL)
  const [model, setModel] = useState<string>('')
  const [apiKey, setApiKey] = useState<string>('')
  const [configLoaded, setConfigLoaded] = useState(false)
  const [testResult, setTestResult] = useState<ProviderTestResult | null>(null)
  const [testError, setTestError] = useState<string | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  const [summaryTopic, setSummaryTopic] = useState('RAG Grundlagen')
  const [summaryInput, setSummaryInput] = useState(DEFAULT_SUMMARY)
  const [summaryResult, setSummaryResult] = useState<LlmSummaryResponse | null>(
    null
  )
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [isSummarizing, setIsSummarizing] = useState(false)

  const [quizTopic, setQuizTopic] = useState('Neuronale Netze')
  const [quizContext, setQuizContext] = useState(
    'Stelle Fragen zu Aktivierungsfunktionen, Backpropagation und Ueberanpassung.'
  )
  const [quizCount, setQuizCount] = useState(3)
  const [quizResult, setQuizResult] = useState<LlmQuizResponse | null>(null)
  const [quizError, setQuizError] = useState<string | null>(null)
  const [isQuizLoading, setIsQuizLoading] = useState(false)

  useEffect(() => {
    const cfg = loadLlmConfig()
    setProvider(cfg.provider)
    setModel(cfg.model ?? '')
    setBaseUrl(cfg.baseUrl ?? DEFAULT_BASE_URL)
    setApiKey(
      cfg.provider === 'openai'
        ? cfg.openaiApiKey ?? ''
        : cfg.provider === 'gemini'
          ? cfg.geminiApiKey ?? ''
          : ''
    )
    setConfigLoaded(true)
  }, [])

  useEffect(() => {
    if (!configLoaded) return
    const keyPayload =
      provider === 'openai'
        ? { openaiApiKey: apiKey }
        : provider === 'gemini'
          ? { geminiApiKey: apiKey }
          : {}
    saveLlmConfig({ provider, model, baseUrl, ...keyPayload })
    // apiKey included, damit Provider-/Key-Wechsel persistent bleiben
  }, [provider, model, baseUrl, apiKey, configLoaded])

  useEffect(() => {
    if (!configLoaded) return
    if (provider === 'ollama') {
      void handleTestConnection()
    } else {
      setTestResult(null)
      setTestError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, configLoaded])

  const currentProvider = useMemo(
    () => PROVIDER_OPTIONS.find((item) => item.value === provider),
    [provider]
  )

  const handleTestConnection = async () => {
    if (!configLoaded) return
    if (provider !== 'ollama' && !apiKey.trim()) {
      setTestError('Bitte API Key fuer den gewaehlten Provider eingeben.')
      return
    }
    setIsTesting(true)
    setTestError(null)
    setTestResult(null)
    try {
      const isOllama = provider === 'ollama'
      const endpoint = isOllama ? '/api/ollama/test' : '/api/llm/test'
      const payload = isOllama
        ? { baseUrl }
        : { provider, apiKey: apiKey.trim() }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = (await response.json()) as ProviderTestResult | OllamaTestResponse
      if (!response.ok || !(data as ProviderTestResult)?.ok) {
        throw new Error(
          (data as ProviderTestResult)?.message ?? 'Verbindungstest fehlgeschlagen.'
        )
      }

      setTestResult({ ...(data as ProviderTestResult), provider })

      if (isOllama) {
        const ollamaData = data as OllamaTestResponse
        const firstSupported = ollamaData.supportedModels[0]
        const firstAny = ollamaData.models?.[0]?.name
        if (firstSupported) {
          setModel(firstSupported)
        } else if (firstAny) {
          setModel(firstAny)
        }
      }
    } catch (error) {
      console.error(error)
      setTestError(
        error instanceof Error
          ? error.message
          : 'Verbindungstest fehlgeschlagen.'
      )
    } finally {
      setIsTesting(false)
    }
  }

  const handleSummary = async () => {
    const text = summaryInput.trim()
    if (!text) {
      setSummaryError('Bitte Text fuer die Zusammenfassung angeben.')
      return
    }

    setSummaryError(null)
    setSummaryResult(null)
    setIsSummarizing(true)

    try {
      const response = await fetch('/api/llm/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          text,
          topic: summaryTopic,
          model: model || undefined,
          baseUrl: provider === 'ollama' ? baseUrl : undefined,
          apiKey: provider !== 'ollama' ? apiKey || undefined : undefined,
        }),
      })

      const data = (await response.json()) as
        | LlmSummaryResponse
        | { message?: string }

      if (!response.ok) {
        throw new Error(
          'message' in data && data.message
            ? data.message
            : 'Zusammenfassung fehlgeschlagen.'
        )
      }

      setSummaryResult(data as LlmSummaryResponse)
    } catch (error) {
      setSummaryError(
        error instanceof Error ? error.message : 'Zusammenfassung fehlgeschlagen.'
      )
    } finally {
      setIsSummarizing(false)
    }
  }

  const handleQuiz = async () => {
    const topic = quizTopic.trim()
    if (!topic) {
      setQuizError('Bitte ein Thema fuer die Quizfragen angeben.')
      return
    }

    setQuizError(null)
    setQuizResult(null)
    setIsQuizLoading(true)

    try {
      const response = await fetch('/api/llm/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          topic,
          text: quizContext,
          questionCount: quizCount,
          model: model || undefined,
          baseUrl: provider === 'ollama' ? baseUrl : undefined,
          apiKey: provider !== 'ollama' ? apiKey || undefined : undefined,
        }),
      })

      const data = (await response.json()) as
        | LlmQuizResponse
        | { message?: string }

      if (!response.ok) {
        throw new Error(
          'message' in data && data.message
            ? data.message
            : 'Quiz-Generierung fehlgeschlagen.'
        )
      }

      setQuizResult(data as LlmQuizResponse)
    } catch (error) {
      setQuizError(
        error instanceof Error ? error.message : 'Quiz-Generierung fehlgeschlagen.'
      )
    } finally {
      setIsQuizLoading(false)
    }
  }

  const gridItemProps = { xs: 12, md: 6 } as const

  return (
    <Box>
      <Typography variant='h4' fontWeight='bold' mb={1}>
        Cloud-LLMs & Ollama
      </Typography>
      <Typography variant='body1' color='text.secondary' mb={3}>
        Waehle einen Provider (Ollama, OpenAI oder Gemini), setze das Modell und fordere
        Zusammenfassungen oder Quizfragen ueber ein einheitliches Interface an.
      </Typography>

      <Grid container spacing={3}>
        <Grid item {...gridItemProps}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant='h6'>LLM-Anbieter</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Steuere, ob lokal (Ollama) oder via Cloud (OpenAI / Gemini) generiert
                    wird. Modellnamen koennen optional uebersteuert werden.
                  </Typography>
                </Box>

                <TextField
                  select
                  label='Provider'
                  value={provider}
                  onChange={(event) =>
                    setProvider(event.target.value as LlmProvider)
                  }
                >
                  {PROVIDER_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>

                {currentProvider && (
                  <Alert severity='info'>{currentProvider.helper}</Alert>
                )}

                <TextField
                  label='Modell (optional)'
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  placeholder={
                    provider === 'openai'
                      ? 'z.B. gpt-4o-mini'
                      : provider === 'gemini'
                        ? 'z.B. gemini-1.5-flash'
                        : 'z.B. llama3'
                  }
                  helperText='Leer lassen, um die Provider-Defaults zu nutzen.'
                />

                {(provider === 'openai' || provider === 'gemini') && (
                  <TextField
                    label='API Key'
                    type='password'
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder={
                      provider === 'openai'
                        ? 'sk-...'
                        : 'AI... (Gemini API Key)'
                    }
                    helperText='Nur lokal gespeichert und pro Request gesendet.'
                    fullWidth
                  />
                )}

                {provider === 'ollama' ? (
                  <Stack spacing={2}>
                    <TextField
                      label='Ollama Base URL'
                      value={baseUrl}
                      onChange={(event) => setBaseUrl(event.target.value)}
                      fullWidth
                      placeholder='http://127.0.0.1:11434'
                    />
                    <Button
                      variant='contained'
                      onClick={handleTestConnection}
                      disabled={isTesting}
                    >
                      {isTesting ? 'Verbindung pruefen...' : 'Verbindung testen'}
                    </Button>
                    {testResult && (
                      <Alert severity='success'>
                        {testResult.message} (Server: {testResult.baseUrl})
                      </Alert>
                    )}
                    {testError && <Alert severity='error'>{testError}</Alert>}
                    {testResult?.models && testResult.models.length > 0 && (
                      <Box>
                        <Typography variant='subtitle2' color='text.secondary' mb={1}>
                          Gefundene Modelle
                        </Typography>
                        <Stack direction='row' gap={1} flexWrap='wrap'>
                          {testResult.models.map((item) => (
                            <Chip
                              key={item.name}
                              label={item.name}
                              color='primary'
                              variant='filled'
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Stack>
                ) : (
                  <Stack spacing={2}>
                    <Button
                      variant='contained'
                      onClick={handleTestConnection}
                      disabled={isTesting}
                    >
                      {isTesting ? 'Verbindung pruefen...' : 'Verbindung testen'}
                    </Button>
                    {testResult && (
                      <Alert severity='success'>
                        {testResult.message}
                        {testResult.endpoint
                          ? ` (Endpoint: ${testResult.endpoint})`
                          : ''}
                      </Alert>
                    )}
                    {testError && <Alert severity='error'>{testError}</Alert>}
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item {...gridItemProps}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant='h6'>Zusammenfassung erzeugen</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Reicht denselben Prompt an Ollama, OpenAI oder Gemini ueber
                    generateSummary() durch.
                  </Typography>
                </Box>

                <TextField
                  label='Thema'
                  value={summaryTopic}
                  onChange={(event) => setSummaryTopic(event.target.value)}
                />
                <TextField
                  label='Text'
                  value={summaryInput}
                  onChange={(event) => setSummaryInput(event.target.value)}
                  multiline
                  minRows={4}
                  placeholder='Text fuer die Zusammenfassung'
                />
                <Button
                  variant='contained'
                  onClick={handleSummary}
                  disabled={isSummarizing}
                >
                  {isSummarizing ? 'LLM fasst zusammen...' : 'Zusammenfassung anfordern'}
                </Button>

                {summaryError && <Alert severity='error'>{summaryError}</Alert>}

                {summaryResult && (
                  <Box>
                    <Typography variant='subtitle2' color='text.secondary' mb={1}>
                      Antwort von {summaryResult.model} ({summaryResult.provider})
                    </Typography>
                    <Box
                      sx={{
                        bgcolor: 'background.default',
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        p: 2,
                        minHeight: '120px',
                      }}
                    >
                      <Typography
                        component='pre'
                        sx={{
                          m: 0,
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'inherit',
                        }}
                      >
                        {summaryResult.summary}
                      </Typography>
                    </Box>
                    {summaryResult.usedEndpoint && (
                      <Typography variant='body2' color='text.secondary' mt={1}>
                        Endpoint: {summaryResult.usedEndpoint}
                      </Typography>
                    )}
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant='h6'>Quizfragen generieren</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Nutzt generateQuiz(), das das gewaehlte LLM dynamisch ansteuert und
                    ein JSON mit Fragen zurueckgibt.
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label='Thema'
                      value={quizTopic}
                      onChange={(event) => setQuizTopic(event.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label='Anzahl Fragen'
                      type='number'
                      inputProps={{ min: 2, max: 8 }}
                      value={quizCount}
                      onChange={(event) =>
                        setQuizCount(Number(event.target.value) || 3)
                      }
                      fullWidth
                    />
                  </Grid>
                </Grid>

                <TextField
                  label='Kontext (optional)'
                  value={quizContext}
                  onChange={(event) => setQuizContext(event.target.value)}
                  multiline
                  minRows={3}
                  placeholder='Optionaler Kontext fuer die Fragen'
                />

                <Button
                  variant='contained'
                  onClick={handleQuiz}
                  disabled={isQuizLoading}
                >
                  {isQuizLoading ? 'Quiz wird erstellt...' : 'Quizfragen anfordern'}
                </Button>

                {quizError && <Alert severity='error'>{quizError}</Alert>}

                {quizResult && (
                  <Box>
                    <Typography variant='subtitle2' color='text.secondary' mb={1}>
                      {quizResult.questions.length} Fragen von {quizResult.model} (
                      {quizResult.provider})
                    </Typography>
                    <Stack spacing={2}>
                      {quizResult.questions.map((question, index) => (
                        <Card key={`${question.question}-${index}`} variant='outlined'>
                          <CardContent>
                            <Typography fontWeight='bold'>
                              {index + 1}. {question.question}
                            </Typography>
                            <Stack spacing={0.5} mt={1}>
                              {question.options.map((option, optIndex) => (
                                <Typography
                                  key={optIndex}
                                  color={
                                    optIndex === question.answerIndex
                                      ? 'primary'
                                      : 'text.primary'
                                  }
                                >
                                  {String.fromCharCode(65 + optIndex)}. {option}
                                </Typography>
                              ))}
                            </Stack>
                            {question.explanation && (
                              <Typography variant='body2' color='text.secondary' mt={1}>
                                Hinweis: {question.explanation}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                    {quizResult.usedEndpoint && (
                      <Typography variant='body2' color='text.secondary' mt={1}>
                        Endpoint: {quizResult.usedEndpoint}
                      </Typography>
                    )}
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
