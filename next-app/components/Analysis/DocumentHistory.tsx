import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Stack,
  Chip,
  Tooltip,
  CircularProgress,
  Box,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DeleteIcon from '@mui/icons-material/Delete'
import type { DocumentSummary } from '@/types/analysis'
import { styled } from '@mui/material/styles'

interface DocumentHistoryProps {
  documents: DocumentSummary[]
  isLoading: boolean
  loadingDocumentId: string | null
  onSelect: (documentId: string) => void
  onDelete: (documentId: string) => void
}

export default function DocumentHistory({
  documents,
  isLoading,
  loadingDocumentId,
  onSelect,
  onDelete,
}: DocumentHistoryProps) {
  return (
    <Card>
      <CardContent>
        <Stack
          direction='row'
          justifyContent='space-between'
          alignItems='center'
          mb={2}
        >
          <Typography variant='h6'>Vergangene Analysen</Typography>
          {isLoading && <CircularProgress size={20} />}
        </Stack>
        {documents.length === 0 ? (
          <Typography color='text.secondary'>
            Noch keine Dokumente gespeichert.
          </Typography>
        ) : (
          <List disablePadding>
            {documents.map((doc) => (
              <ListItem
                key={doc.documentId}
                divider
                secondaryAction={
                  <Stack direction='row' spacing={4.75}>
                    <Tooltip title='Ansehen'>
                      <span>
                        <IconButton
                          onClick={() => onSelect(doc.documentId)}
                          disabled={loadingDocumentId === doc.documentId}
                        >
                          {loadingDocumentId === doc.documentId ? (
                            <CircularProgress size={20} />
                          ) : (
                            <VisibilityIcon fontSize='small' />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title='Löschen'>
                      <IconButton
                        color='error'
                        onClick={() => onDelete(doc.documentId)}
                      >
                        <DeleteIcon fontSize='small' />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                }
              >
                <Row>
                  <Box flex='1 1 auto' minWidth={0}>
                    <ListItemText
                      primary={doc.fileName}
                      secondary={`${formatDate(doc.createdAt)} · ${
                        doc.totalTokens
                      } Tokens · ${doc.chunkCount} Chunks`}
                    />
                  </Box>
                  <Chip
                    size='small'
                    label={doc.mimeType
                      .replace('application/', '')
                      .toUpperCase()}
                    sx={{ flexShrink: 0 }}
                  />
                </Row>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
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

const Row = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  width: '100%',
}))
