'use client'

import { useEffect, useRef, useState } from 'react'
import Grid from '@mui/material/GridLegacy'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Alert,
} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import ReplayIcon from '@mui/icons-material/Replay'
import AnalysisProgress from '@/components/Analysis/AnalysisProgress'
import ExtractedTextCard from '@/components/Analysis/ExtractedTextCard'
import ChunkOverview from '@/components/Analysis/ChunkOverview'
import RedisEmbeddingsCard from '@/components/Analysis/RedisEmbeddingsCard'
import DocumentHistory from '@/components/Analysis/DocumentHistory'
import { loadLlmConfig } from '@/lib/llm/config'
import type { LlmProvider } from '@/types/llm'
import type {
  AnalysisStep,
  DocumentSummary,
  DocumentAnalysisResponse,
  DocumentSummaryResult,
} from '@/types/analysis'

const allowedTypes = ['application/pdf', 'text/plain']

export default function AnalysisPage() {
  const [steps, setSteps] = useState<AnalysisStep[]>(createInitialSteps())
  const [analysis, setAnalysis] = useState<DocumentAnalysisResponse | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [documents, setDocuments] = useState<DocumentSummary[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [loadingDocumentId, setLoadingDocumentId] = useState<string | null>(
    null
  )
  const [summaryResult, setSummaryResult] = useState<DocumentSummaryResult | null>(
    null
  )
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [provider, setProvider] = useState<LlmProvider>('ollama')
  const [model, setModel] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState<string | undefined>(undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const cfg = loadLlmConfig()
    setProvider(cfg.provider)
    setModel(cfg.model ?? '')
    setBaseUrl(cfg.baseUrl ?? '')
    setApiKey(
      cfg.provider === 'openai'
        ? cfg.openaiApiKey
        : cfg.provider === 'gemini'
          ? cfg.geminiApiKey
          : undefined
    )
    void fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    setDocumentsLoading(true)
    try {
      const response = await fetch('/api/documents')
      if (!response.ok) {
        throw new Error('Dokumentenliste konnte nicht geladen werden.')
      }
      const data = await response.json()
      setDocuments(data.documents ?? [])
    } catch (err) {
      console.error(err)
      setError(
        err instanceof Error
          ? err.message
          : 'Fehler beim Laden der Dokumente.'
      )
    } finally {
      setDocumentsLoading(false)
    }
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      await runAnalysis(file)
      event.target.value = ''
    }
  }

  const runAnalysis = async (file: File) => {
    if (!allowedTypes.includes(file.type)) {
      setError('Bitte eine PDF- oder Textdatei auswählen.')
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setAnalysis(null)
    setSteps(
      createInitialSteps().map((step) => {
        if (step.id === 'upload') {
          return { ...step, status: 'completed' }
        }
        if (step.id === 'parse') {
          return { ...step, status: 'in_progress' }
        }
        return step
      })
    )

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.message ?? 'Analyse fehlgeschlagen.')
      }

      const data = (await response.json()) as DocumentAnalysisResponse
      setAnalysis(data)
      setSteps(mergeSteps(data.steps))
      setSummaryResult(data.summary ?? null)
      await fetchDocuments()
    } catch (err) {
      console.error(err)
      setError(
        err instanceof Error ? err.message : 'Unbekannter Analysefehler.'
      )
      setSteps((prev) =>
        prev.map((step) =>
          step.status === 'in_progress' ? { ...step, status: 'failed' } : step
        )
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSelectDocument = async (documentId: string) => {
    setLoadingDocumentId(documentId)
    setError(null)
    try {
      const response = await fetch(`/api/documents/${documentId}`)
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.message ?? 'Dokument konnte nicht geladen werden.')
      }
      const data = (await response.json()) as DocumentAnalysisResponse
      setAnalysis(data)
      setSteps(mergeSteps(data.steps))
      setSummaryResult(data.summary ?? null)
    } catch (err) {
      console.error(err)
      setError(
        err instanceof Error ? err.message : 'Dokument konnte nicht geladen werden.'
      )
    } finally {
      setLoadingDocumentId(null)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    const confirmed = window.confirm(
      'Möchtest du dieses Dokument dauerhaft löschen?'
    )
    if (!confirmed) return

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.message ?? 'Löschen fehlgeschlagen.')
      }
      if (analysis?.documentId === documentId) {
        setAnalysis(null)
        setSteps(createInitialSteps())
        setSummaryResult(null)
      }
      await fetchDocuments()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen.')
    }
  }

  const handleGenerateSummary = async () => {
    if (!analysis?.documentId) {
      setSummaryError('Bitte zuerst ein Dokument hochladen und analysieren.')
      return
    }
    if (provider !== 'ollama' && !apiKey?.trim()) {
      setSummaryError('Bitte einen API Key im LLM-Tab hinterlegen.')
      return
    }

    setSummaryError(null)
    setIsSummarizing(true)
    try {
      const response = await fetch(
        `/api/documents/${encodeURIComponent(analysis.documentId)}/summary`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider,
            model: model || undefined,
            baseUrl: provider === 'ollama' ? baseUrl || undefined : undefined,
            apiKey: provider !== 'ollama' ? apiKey || undefined : undefined,
          }),
        }
      )
      const data = await response.json()
      if (!response.ok || !data.summary) {
        throw new Error(data?.message || 'Zusammenfassung fehlgeschlagen.')
      }
      setSummaryResult(data.summary as DocumentSummaryResult)
      setAnalysis((prev) =>
        prev ? { ...prev, summary: data.summary as DocumentSummaryResult } : prev
      )
    } catch (err) {
      setSummaryError(
        err instanceof Error ? err.message : 'Zusammenfassung fehlgeschlagen.'
      )
    } finally {
      setIsSummarizing(false)
    }
  }

  return (
    <Box>
      <Typography variant='h4' fontWeight='bold' mb={1}>
        Dokumentenanalyse
      </Typography>
      <Typography variant='body1' color='text.secondary' mb={3}>
        Lade deine Lernunterlagen hoch und lass sie automatisch analysieren,
        tokenisieren und für Embeddings vorbereiten.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems='center'
            justifyContent='space-between'
          >
            <Box>
              <Typography variant='h6'>
                Datei hochladen (PDF oder TXT)
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Maximale Größe: 15MB · Fortschritt wird live aktualisiert
              </Typography>
            </Box>
            <Stack direction='row' spacing={2}>
              <input
                type='file'
                hidden
                ref={fileInputRef}
                accept='.pdf,.txt'
                onChange={handleFileChange}
              />
              <Button
                variant='contained'
                startIcon={<CloudUploadIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
              >
                Datei auswählen
              </Button>
              <Button
                variant='outlined'
                startIcon={<ReplayIcon />}
                onClick={() => {
                  setAnalysis(null)
                  setSteps(createInitialSteps())
                  setError(null)
                  setSummaryResult(null)
                  setSummaryError(null)
                }}
                disabled={isAnalyzing}
              >
                Zurücksetzen
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <AnalysisProgress steps={steps} isAnalyzing={isAnalyzing} />
        </Grid>
        <Grid item xs={12} md={8}>
          <ExtractedTextCard
            text={analysis?.textPreview ?? ''}
            totalTokens={analysis?.totalTokens ?? 0}
            fileName={analysis?.fileName ?? 'Keine Datei ausgewählt'}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <ChunkOverview chunks={analysis?.chunks ?? []} />
        </Grid>
        <Grid item xs={12} md={6}>
          <RedisEmbeddingsCard
            embeddingsSummary={
              analysis?.embeddingsSummary ?? { vectorCount: 0, dimensions: 0 }
            }
            neighbors={analysis?.redisInfo?.nearestNeighbors ?? []}
          />
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={2}
                  justifyContent='space-between'
                  alignItems={{ xs: 'flex-start', md: 'center' }}
                >
                  <Box>
                    <Typography variant='h6'>Zusammenfassung generieren</Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Erstellt eine kompakte Zusammenfassung des analysierten Dokuments
                      ueber das konfigurierte LLM.
                    </Typography>
                  </Box>
                  <Stack direction='row' spacing={1}>
                    <Button
                      variant='contained'
                      onClick={handleGenerateSummary}
                      disabled={isSummarizing || isAnalyzing || !analysis}
                    >
                      {isSummarizing ? 'LLM fasst zusammen...' : 'Zusammenfassung generieren'}
                    </Button>
                    {summaryResult && (
                      <Button
                        variant='outlined'
                        onClick={handleGenerateSummary}
                        disabled={isSummarizing || isAnalyzing}
                      >
                        Neu generieren
                      </Button>
                    )}
                  </Stack>
                </Stack>

                {summaryError && <Alert severity='error'>{summaryError}</Alert>}

                {summaryResult ? (
                  <Box>
                    <Typography variant='subtitle2' color='text.secondary' mb={1}>
                      Ergebnis von {summaryResult.model} ({summaryResult.provider})
                      {summaryResult.usedEndpoint ? ` - Endpoint: ${summaryResult.usedEndpoint}` : ''}
                    </Typography>
                    <Box
                      sx={{
                        bgcolor: 'background.default',
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        p: 2,
                      }}
                    >
                      <Typography
                        component='pre'
                        sx={{ m: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}
                      >
                        {summaryResult.summary}
                      </Typography>
                    </Box>
                    <Typography variant='body2' color='text.secondary' mt={1}>
                      Generiert am {new Date(summaryResult.generatedAt).toLocaleString()}
                    </Typography>
                  </Box>
                ) : (
                  <Alert severity='info'>
                    Noch keine Zusammenfassung erstellt. Starte mit dem Button oben.
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <DocumentHistory
            documents={documents}
            isLoading={documentsLoading}
            loadingDocumentId={loadingDocumentId}
            onSelect={handleSelectDocument}
            onDelete={handleDeleteDocument}
          />
        </Grid>
      </Grid>
    </Box>
  )
}

function createInitialSteps(): AnalysisStep[] {
  return [
    { id: 'upload', label: 'Upload', status: 'pending' },
    { id: 'parse', label: 'Analyse des Dokuments', status: 'pending' },
    { id: 'tokenize', label: 'Tokenisierung', status: 'pending' },
    { id: 'chunk', label: 'Chunking', status: 'pending' },
    { id: 'embed', label: 'LangChain + Redis Embeddings', status: 'pending' },
  ]
}

function mergeSteps(nextSteps: AnalysisStep[]): AnalysisStep[] {
  const defaults = createInitialSteps()
  return defaults.map(
    (step) => nextSteps.find((s) => s.id === step.id) ?? step
  )
}
