import {
  Card,
  CardContent,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  Box,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import type { TextChunk } from '@/lib/document/chunking'

interface ChunkOverviewProps {
  chunks: TextChunk[]
}

export default function ChunkOverview({ chunks }: ChunkOverviewProps) {
  const avgTokens =
    chunks.length === 0
      ? 0
      : Math.round(
          chunks.reduce((acc, chunk) => acc + chunk.tokenCount, 0) /
            chunks.length
        )

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant='h6' mb={2}>
          Chunking & Tokenisierung
        </Typography>

        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} sm={4}>
            <Statistic label='Chunks' value={chunks.length.toString()} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Statistic label='Ø Tokens/Chunk' value={avgTokens.toString()} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Statistic
              label='Tokens gesamt'
              value={chunks
                .reduce((acc, chunk) => acc + chunk.tokenCount, 0)
                .toString()}
            />
          </Grid>
        </Grid>

        <Typography variant='subtitle2' color='text.secondary'>
          Alle Chunks
        </Typography>
        <Box
          sx={{
            maxHeight: 320,
            overflow: 'auto',
            pr: 1,
          }}
        >
          <List dense disablePadding>
            {chunks.map((chunk) => (
              <ListItem key={chunk.id} disableGutters sx={{ mb: 1 }}>
                <ListItemText
                  primary={chunk.text || '[leer]'}
                  secondary={`Tokens: ${chunk.tokenCount}`}
                />
                <Chip label={`#${chunk.id.split('-')[1]}`} size='small' />
              </ListItem>
            ))}
            {chunks.length === 0 && (
              <Typography color='text.secondary'>
                Noch keine Chunks erstellt.
              </Typography>
            )}
          </List>
        </Box>
      </CardContent>
    </Card>
  )
}

function Statistic({ label, value }: { label: string; value: string }) {
  return (
    <Card
      variant='outlined'
      sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Typography variant='body2' color='text.secondary'>
        {label}
      </Typography>
      <Typography variant='h5' fontWeight='bold'>
        {value}
      </Typography>
    </Card>
  )
}
