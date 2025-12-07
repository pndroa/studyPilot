'use client'

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import type { DocumentAnalysisResponse } from '@/types/analysis'

interface DocumentDetailsProps {
  document: DocumentAnalysisResponse | null
  isLoading?: boolean
  onUse?: (document: DocumentAnalysisResponse) => void
  actionLabel?: string
}

export default function DocumentDetails({
  document,
  isLoading,
  onUse,
  actionLabel = 'Als Kontext verwenden',
}: DocumentDetailsProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent='space-between'
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={1}
          >
            <Box>
              <Typography variant='h6'>Dokumentdetails</Typography>
              <Typography variant='body2' color='text.secondary'>
                Vorschau, Embeddings und Kontextinformationen
              </Typography>
            </Box>
            {document && onUse ? (
              <Button
                variant='contained'
                onClick={() => onUse(document)}
                disabled={isLoading}
              >
                {actionLabel}
              </Button>
            ) : null}
          </Stack>

          {isLoading ? <LinearProgress /> : null}

          {!document && !isLoading ? (
            <Alert severity='info'>
              Waehle links ein Dokument, um Details und Kontext zu sehen.
            </Alert>
          ) : null}

          {document ? (
            <Stack spacing={2}>
              <Stack direction='row' spacing={1} alignItems='center'>
                <Typography variant='subtitle1' fontWeight={600}>
                  {document.fileName}
                </Typography>
                <Chip
                  size='small'
                  label={document.mimeType.replace('application/', '').toUpperCase()}
                />
              </Stack>
              <Typography variant='body2' color='text.secondary'>
                Erstellt am {new Date(document.createdAt).toLocaleString()} ·{' '}
                {document.totalTokens} Tokens · {document.chunkCount} Chunks
              </Typography>

              <Divider />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <InfoPill label='Embeddings' value={`${document.embeddingsSummary.vectorCount} Vektoren`} />
                <InfoPill
                  label='Dimensionen'
                  value={
                    document.embeddingsSummary.dimensions > 0
                      ? `${document.embeddingsSummary.dimensions}D`
                      : 'unbekannt'
                  }
                />
                <InfoPill
                  label='Redis Index'
                  value={document.redisInfo?.indexKey ?? 'nicht gesetzt'}
                />
              </Stack>

              {document.summary ? (
                <Stack spacing={1}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Zusammenfassung
                  </Typography>
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: 'background.default',
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
                      {document.summary.summary}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {document.summary.provider} · {document.summary.model} ·{' '}
                      {new Date(document.summary.generatedAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Stack>
              ) : null}

              <Stack spacing={1}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Textvorschau
                </Typography>
                <Box
                  sx={{
                    maxHeight: 220,
                    overflow: 'auto',
                    p: 1.5,
                    bgcolor: 'background.default',
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    component='pre'
                    variant='body2'
                    sx={{ m: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}
                  >
                    {truncate(document.textPreview, 1800)}
                  </Typography>
                </Box>
              </Stack>

              {document.redisInfo?.nearestNeighbors?.length ? (
                <Stack spacing={1}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Naechste Nachbarn (Similarity Search)
                  </Typography>
                  <Stack spacing={1}>
                    {document.redisInfo.nearestNeighbors.map((item, idx) => (
                      <Box
                        key={item.id}
                        sx={{
                          p: 1,
                          border: (theme) => `1px solid ${theme.palette.divider}`,
                          borderRadius: 1.5,
                          bgcolor: 'background.default',
                        }}
                      >
                        <Typography variant='caption' color='text.secondary'>
                          #{idx + 1} · Score {item.score.toFixed(3)}
                        </Typography>
                        <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
                          {truncate(item.text, 400)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              ) : null}
            </Stack>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  )
}

function truncate(text: string, limit: number) {
  if (!text) return ''
  if (text.length <= limit) return text
  return `${text.slice(0, limit)}…`
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        p: 1,
        borderRadius: 1.5,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        minWidth: 0,
      }}
    >
      <Typography variant='caption' color='text.secondary' display='block'>
        {label}
      </Typography>
      <Typography variant='body2' fontWeight={600} noWrap>
        {value}
      </Typography>
    </Box>
  )
}
