'use client'

import {
  Box,
  Chip,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import type { DocumentSummary } from '@/types/analysis'

interface DocumentListProps {
  documents: DocumentSummary[]
  selectedId?: string | null
  isLoading?: boolean
  onSelect?: (documentId: string) => void
  emptyHint?: string
}

export default function DocumentList({
  documents,
  selectedId,
  isLoading,
  onSelect,
  emptyHint = 'Keine Dokumente gefunden.',
}: DocumentListProps) {
  if (isLoading) {
    return (
      <Box display='flex' justifyContent='center' py={3}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  if (documents.length === 0) {
    return (
      <Box py={4}>
        <Typography variant='body2' color='text.secondary' textAlign='center'>
          {emptyHint}
        </Typography>
      </Box>
    )
  }

  return (
    <List disablePadding>
      {documents.map((doc) => (
        <ListItemButton
          key={doc.documentId}
          selected={doc.documentId === selectedId}
          onClick={() => onSelect?.(doc.documentId)}
          sx={{
            borderRadius: 2,
            mb: 1,
          }}
        >
          <Stack direction='row' spacing={2} alignItems='center' width='100%'>
            <DescriptionOutlinedIcon color='action' fontSize='small' />
            <Box flex='1 1 auto' minWidth={0}>
              <ListItemText
                primary={doc.fileName}
                secondary={`${formatDate(doc.createdAt)} · ${doc.totalTokens} Tokens · ${doc.chunkCount} Chunks`}
                primaryTypographyProps={{ noWrap: true }}
                secondaryTypographyProps={{ noWrap: true }}
              />
            </Box>
            <Chip
              size='small'
              label={doc.mimeType.replace('application/', '').toUpperCase()}
              color='default'
              sx={{ flexShrink: 0 }}
            />
          </Stack>
        </ListItemButton>
      ))}
    </List>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('de-DE', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
}
