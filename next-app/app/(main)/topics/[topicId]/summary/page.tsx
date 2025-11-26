'use client'

import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material'
import { useParams } from 'next/navigation'
import type { DocumentSummaryResult } from '@/types/analysis'
import { loadLlmConfig } from '@/lib/llm/config'
import type { LlmProvider } from '@/types/llm'
import type { DocumentAnalysisResponse } from '@/types/analysis'

const STORAGE_KEY = (topicId: string) => `summary:${topicId}`
const DOCS_KEY = (topicId: string) => `documents:${topicId}`

export default function SummaryPage() {
  const params = useParams<{ topicId: string }>()
  const topicId = params.topicId

  const [summary, setSummary] = useState<DocumentSummaryResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [provider, setProvider] = useState<LlmProvider>('ollama')
  const [model, setModel] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState<string | undefined>(undefined)
  const [contextDoc, setContextDoc] = useState<DocumentAnalysisResponse | null>(
    null
  )

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
    setContextDoc(loadDoc(topicId))
    setSummary(loadStored(topicId))
  }, [topicId])

  const handleGenerate = async () => {
    if (provider !== 'ollama' && !apiKey?.trim()) {
      setError('Bitte einen API Key im LLM-Tab hinterlegen.')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const hasDoc = contextDoc?.documentId
      const endpoint = hasDoc
        ? `/api/documents/${encodeURIComponent(contextDoc.documentId)}/summary`
        : `/api/topics/${topicId}/summary`
      const body = hasDoc
        ? {
            provider,
            model: model || undefined,
            baseUrl: provider === 'ollama' ? baseUrl || undefined : undefined,
            apiKey: provider !== 'ollama' ? apiKey || undefined : undefined,
          }
        : {
            provider,
            model: model || undefined,
            baseUrl: provider === 'ollama' ? baseUrl || undefined : undefined,
            apiKey: provider !== 'ollama' ? apiKey || undefined : undefined,
            text: contextDoc?.textPreview,
          }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      if (!response.ok || !data.summary) {
        throw new Error(data?.message || 'Zusammenfassung fehlgeschlagen.')
      }
      setSummary(data.summary as DocumentSummaryResult)
      persist(topicId, data.summary as DocumentSummaryResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Zusammenfassung fehlgeschlagen.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box>
      <Typography variant='h5' fontWeight='bold' mb={2}>
        Zusammenfassung
      </Typography>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction='row' spacing={1}>
              <Button variant='contained' onClick={handleGenerate} disabled={isLoading}>
                {isLoading ? 'LLM fasst zusammen...' : 'Zusammenfassung generieren'}
              </Button>
              {summary && (
                <Button variant='outlined' onClick={handleGenerate} disabled={isLoading}>
                  Neu generieren
                </Button>
              )}
            </Stack>

            {error && <Alert severity='error'>{error}</Alert>}

            {summary ? (
              <Box>
                <Typography variant='subtitle2' color='text.secondary' mb={1}>
                  Ergebnis von {summary.model} ({summary.provider})
                  {summary.usedEndpoint ? ` - Endpoint: ${summary.usedEndpoint}` : ''}
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
                    {summary.summary}
                  </Typography>
                </Box>
                <Typography variant='body2' color='text.secondary' mt={1}>
                  Generiert am {new Date(summary.generatedAt).toLocaleString()}
                </Typography>
              </Box>
            ) : (
              <Alert severity='info'>
                Noch keine Zusammenfassung vorhanden. Starte mit dem Button oben.
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}

function loadStored(topicId: string): DocumentSummaryResult | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY(topicId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed as DocumentSummaryResult
  } catch {
    return null
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

function persist(topicId: string, summary: DocumentSummaryResult) {
  try {
    localStorage.setItem(STORAGE_KEY(topicId), JSON.stringify(summary))
  } catch {
    // ignore
  }
}
