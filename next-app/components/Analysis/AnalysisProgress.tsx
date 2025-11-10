import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Box,
  Chip,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom'
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline'
import ErrorIcon from '@mui/icons-material/Error'
import type { AnalysisStep } from '@/types/analysis'

interface AnalysisProgressProps {
  steps: AnalysisStep[]
  isAnalyzing: boolean
}

const statusIcon = {
  completed: <CheckCircleIcon color='success' />,
  in_progress: <HourglassBottomIcon color='warning' />,
  pending: <PauseCircleOutlineIcon color='disabled' />,
  failed: <ErrorIcon color='error' />,
}

const statusLabel: Record<AnalysisStep['status'], string> = {
  completed: 'Abgeschlossen',
  in_progress: 'Läuft',
  pending: 'Wartet',
  failed: 'Fehlgeschlagen',
}

export default function AnalysisProgress({
  steps,
  isAnalyzing,
}: AnalysisProgressProps) {
  const activeIndex = steps.findIndex((step) => step.status === 'in_progress')
  const percent =
    activeIndex === -1
      ? (steps.filter((step) => step.status === 'completed').length /
          steps.length) *
        100
      : ((activeIndex + 0.5) / steps.length) * 100

  return (
    <Card>
      <CardContent>
        <Typography variant='h6' mb={2}>
          Analysefortschritt
        </Typography>
        <Box mb={2}>
          <LinearProgress
            variant='determinate'
            value={Math.min(100, percent)}
          />
        </Box>
        <List dense disablePadding>
          {steps.map((step) => (
            <ListItem key={step.id} disableGutters sx={{ mb: 1 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                {statusIcon[step.status]}
              </ListItemIcon>
              <ListItemText
                primary={step.label}
                secondary={
                  step.meta
                    ? Object.entries(step.meta)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(' · ')
                    : undefined
                }
              />
              <Chip
                label={
                  step.status === 'in_progress' && isAnalyzing
                    ? 'wird verarbeitet...'
                    : statusLabel[step.status]
                }
                size='small'
                color={chipColor(step.status)}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  )
}

function chipColor(status: AnalysisStep['status']) {
  switch (status) {
    case 'completed':
      return 'success'
    case 'in_progress':
      return 'warning'
    case 'failed':
      return 'error'
    default:
      return 'default'
  }
}
