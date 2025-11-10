import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Tooltip,
  Box,
  Stack,
  Chip,
  useTheme,
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { useState } from 'react'

interface ExtractedTextCardProps {
  text: string
  totalTokens: number
  fileName: string
}

export default function ExtractedTextCard({
  text,
  totalTokens,
  fileName,
}: ExtractedTextCardProps) {
  const [copied, setCopied] = useState(false)
  const theme = useTheme()
  const textBg =
    theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100]
  const textColor =
    theme.palette.mode === 'dark'
      ? theme.palette.grey[100]
      : theme.palette.text.primary

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Stack
          direction='row'
          justifyContent='space-between'
          alignItems='center'
        >
          <Box>
            <Typography variant='h6'>Extrahierter Text</Typography>
            <Typography variant='body2' color='text.secondary'>
              {fileName} · {totalTokens} Tokens
            </Typography>
          </Box>
          <Tooltip title={copied ? 'Kopiert!' : 'In Zwischenablage kopieren'}>
            <span>
              <IconButton onClick={handleCopy} disabled={!text}>
                <ContentCopyIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
        <Box
          component='pre'
          sx={{
            flexGrow: 1,
            bgcolor: textBg,
            color: textColor,
            p: 2,
            borderRadius: 2,
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: 420,
            overflow: 'auto',
          }}
        >
          {text || 'Noch kein Text extrahiert.'}
        </Box>
        <Stack direction='row' spacing={1}>
          <Chip label={`Tokens: ${totalTokens}`} size='small' />
          <Chip
            label={`Zeichen: ${text.length}`}
            size='small'
            color='secondary'
            variant='outlined'
          />
        </Stack>
      </CardContent>
    </Card>
  )
}
