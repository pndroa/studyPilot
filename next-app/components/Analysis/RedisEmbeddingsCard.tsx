import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack,
  Box,
} from '@mui/material'
import type { DocumentAnalysisResponse } from '@/types/analysis'

interface RedisEmbeddingsCardProps {
  embeddingsSummary: DocumentAnalysisResponse['embeddingsSummary']
  neighbors: DocumentAnalysisResponse['redisInfo']['nearestNeighbors']
}

export default function RedisEmbeddingsCard({
  embeddingsSummary,
  neighbors,
}: RedisEmbeddingsCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant='h6' mb={2}>
          LangChain + Redis Ergebnisse
        </Typography>
        <Stack direction='row' spacing={2} mb={2}>
          <Chip
            label={`Vektoren: ${embeddingsSummary.vectorCount}`}
            color='primary'
          />
          <Chip
            label={`Dimensionen: ${embeddingsSummary.dimensions}`}
            color='secondary'
          />
        </Stack>
        <Typography variant='subtitle2' color='text.secondary'>
          Ähnlichste Chunks
        </Typography>
        <Box sx={{ maxHeight: 320, overflow: 'auto', pr: 1 }}>
          <List dense disablePadding>
            {neighbors.map((neighbor) => (
              <ListItem key={neighbor.id} disableGutters sx={{ mb: 1 }}>
                <ListItemText
                  primary={neighbor.text}
                  secondary={`Score: ${neighbor.score.toFixed(3)}`}
                />
                <Chip label={neighbor.id} size='small' variant='outlined' />
              </ListItem>
            ))}
            {neighbors.length === 0 && (
              <Typography color='text.secondary'>
                Noch keine Embeddings vorhanden.
              </Typography>
            )}
          </List>
        </Box>
      </CardContent>
    </Card>
  )
}
