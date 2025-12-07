'use client'

import { Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material'
import type { QuizResultRecord } from '@/types/dashboard'

interface RecentResultsProps {
  results: QuizResultRecord[]
  isLoading?: boolean
}

export default function RecentResults({ results, isLoading }: RecentResultsProps) {
  const latest = results.slice(0, 6)

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 2, height: '100%' }}>
      <CardContent>
        <Typography variant='h6' mb={2}>
          Letzte Quiz-Ergebnisse
        </Typography>

        {isLoading ? (
          <Typography color='text.secondary'>Lade Ergebnisse ...</Typography>
        ) : latest.length === 0 ? (
          <Typography color='text.secondary'>
            Noch keine gespeicherten Quiz-Ergebnisse.
          </Typography>
        ) : (
          <Stack divider={<Divider />} spacing={1.5}>
            {latest.map((item) => (
              <ResultRow key={item.id} record={item} />
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}

function ResultRow({ record }: { record: QuizResultRecord }) {
  const color: 'success' | 'primary' | 'warning' | 'error' =
    record.score >= 80
      ? 'success'
      : record.score >= 60
        ? 'primary'
        : record.score >= 40
          ? 'warning'
          : 'error'

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent='space-between'
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      spacing={0.5}
    >
      <Stack spacing={0.25}>
        <Typography fontWeight={600}>{record.topicId}</Typography>
        <Typography variant='body2' color='text.secondary'>
          {formatDate(record.createdAt)} · {record.correct}/{record.total} korrekt
        </Typography>
      </Stack>
      <Chip label={`${record.score}%`} color={color} />
    </Stack>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
