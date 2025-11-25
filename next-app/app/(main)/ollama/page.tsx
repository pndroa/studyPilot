'use client'

import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import type {
  OllamaGenerateResponse,
  OllamaTestResponse,
} from '@/types/ollama'

const DEFAULT_BASE_URL = 'http://127.0.0.1:11434'
const MODEL_FALLBACKS: string[] = []

export default function OllamaPage() {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL)
  const [model, setModel] = useState<string>('')
  const [testResult, setTestResult] = useState<OllamaTestResponse | null>(null)
  const [testError, setTestError] = useState<string | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  const [prompt, setPrompt] = useState(
    'Erkläre in zwei Sätzen, wie Retrieval-Augmented Generation funktioniert.'
  )
  const [llmResult, setLlmResult] = useState<OllamaGenerateResponse | null>(null)
  const [llmError, setLlmError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    // Versuch, direkt beim Laden die Verbindung zu testen
    void handleTestConnection()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestError(null)
    setTestResult(null)
    try {
      const response = await fetch('/api/ollama/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl }),
      })
      const data = (await response.json()) as OllamaTestResponse
      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? 'Verbindungstest fehlgeschlagen.')
      }
      setTestResult(data)
      const firstSupported = data.supportedModels[0]
      const firstAny = data.models?.[0]?.name
      if (firstSupported) {
        setModel(firstSupported)
      } else if (firstAny) {
        setModel(firstAny)
      }
    } catch (error) {
      console.error(error)
      setTestError(
        error instanceof Error
          ? error.message
          : 'Ollama Verbindungstest fehlgeschlagen.'
      )
    } finally {
      setIsTesting(false)
    }
  }

  const handleGenerate = async () => {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) {
      setLlmError('Bitte gib einen Prompt ein.')
      return
    }
    if (!model) {
      setLlmError('Bitte wähle ein installiertes Modell aus.')
      return
    }
    setIsGenerating(true)
    setLlmError(null)
    setLlmResult(null)

    try {
      const response = await fetch('/api/ollama/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmedPrompt, model, baseUrl }),
      })
      const data = (await response.json()) as
        | OllamaGenerateResponse
        | { message?: string }

      if (!response.ok) {
        const message =
          'message' in data && data.message
            ? data.message
            : 'LLM-Antwort konnte nicht abgeholt werden.'
        setLlmError(message)
        return
      }

      setLlmResult(data as OllamaGenerateResponse)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.name === 'AbortError'
            ? 'Timeout: Der Ollama-Server hat innerhalb des Limits nicht geantwortet.'
            : error.message
          : 'Ollama Anfrage fehlgeschlagen.'
      console.warn('Ollama Anfrage fehlgeschlagen', error)
      setLlmError(message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Box>
      <Typography variant='h4' fontWeight='bold' mb={1}>
        Lokaler LLM mit Ollama
      </Typography>
      <Typography variant='body1' color='text.secondary' mb={3}>
        Verbinde StudyPilot mit einem lokalen Ollama-Server, teste die Erreichbarkeit
        und führe einen Prompt direkt gegen Modelle wie Llama&nbsp;3 oder Mistral aus.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant='h6'>Verbindung prüfen</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Stelle die URL deines Ollama-Servers ein und prüfe die Erreichbarkeit
                    sowie installierte Modelle.
                  </Typography>
                </Box>

                <Stack spacing={2}>
                  <TextField
                    label='Ollama Base URL'
                    value={baseUrl}
                    onChange={(event) => setBaseUrl(event.target.value)}
                    fullWidth
                    placeholder='http://127.0.0.1:11434'
                  />
                  <TextField
                    select
                    label='Bevorzugtes Modell'
                    value={model}
                    onChange={(event) => setModel(event.target.value)}
                    helperText='Modelle werden aus "ollama list" geladen.'
                    SelectProps={{ displayEmpty: true }}
                  >
                    {(
                      testResult?.models?.map((item) => item.name) ??
                      MODEL_FALLBACKS
                    ).map((name) => (
                      <MenuItem key={name} value={name}>
                        {name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Button
                    variant='contained'
                    onClick={handleTestConnection}
                    disabled={isTesting}
                  >
                    {isTesting ? 'Verbindung wird geprüft…' : 'Verbindung testen'}
                  </Button>
                </Stack>

                {testResult && (
                  <Alert severity='success'>
                    {testResult.message} (Server: {testResult.baseUrl})
                  </Alert>
                )}

                {testError && <Alert severity='error'>{testError}</Alert>}

                {testResult && !testResult.models?.length && (
                  <Alert severity='warning'>
                    Verbindung steht, aber keine Modelle gefunden. Bitte installiere ein
                    Modell mit <code>ollama pull &lt;modellname&gt;</code>.
                  </Alert>
                )}

                {testResult?.models && testResult.models.length > 0 && (
                  <Box>
                    <Typography variant='subtitle2' color='text.secondary' mb={1}>
                      Gefundene Modelle
                    </Typography>
                    <Stack direction='row' gap={1} flexWrap='wrap'>
                      {testResult.models.map((item) => {
                        return (
                          <Chip
                            key={item.name}
                            label={item.name}
                            color='primary'
                            variant='filled'
                          />
                        )
                      })}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant='h6'>Prompt ausprobieren</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Schicke einen kurzen Prompt an den ausgewählten Ollama-Endpoint und
                    erhalte direkt die Antwort.
                  </Typography>
                </Box>

                <TextField
                  label='Eingabetext'
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  multiline
                  minRows={4}
                  placeholder='Frag den lokalen LLM nach einer Zusammenfassung oder Erklärung.'
                />

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button
                    variant='contained'
                    onClick={handleGenerate}
                    disabled={isGenerating || !model}
                  >
                    {isGenerating ? 'LLM antwortet…' : 'Antwort abrufen'}
                  </Button>
                  <Button
                    variant='outlined'
                    onClick={() => setPrompt('')}
                    disabled={isGenerating}
                  >
                    Prompt leeren
                  </Button>
                </Stack>

                {llmError && <Alert severity='error'>{llmError}</Alert>}

                {llmResult && (
                  <Box>
                    <Typography variant='subtitle2' color='text.secondary' mb={1}>
                      Antwort von {llmResult.model} ({llmResult.durationMs} ms)
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
                        {llmResult.response}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1.5 }} />
                    <Typography variant='body2' color='text.secondary'>
                      Angefragter Server: {llmResult.baseUrl}
                    </Typography>
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
