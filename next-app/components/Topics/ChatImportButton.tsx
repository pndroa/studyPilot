'use client'

import { useRef, useState } from 'react'
import {
  IconButton,
  Tooltip,
  LinearProgress,
  Box,
  Typography,
} from '@mui/material'
import UploadFileIcon from '@mui/icons-material/UploadFile'

const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15 MB
const ALLOWED_TYPES = ['application/pdf', 'text/plain']

interface ChatImportButtonProps {
  onUploaded?: (data: { fileName: string; path?: string }) => void
}

export default function ChatImportButton({ onUploaded }: ChatImportButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = () => {
    setError(null)
    inputRef.current?.click()
  }

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Nur PDF oder TXT erlaubt.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Datei zu groß (max. 15 MB).')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)
    setError(null)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json?.message ?? 'Upload fehlgeschlagen.')
      } else {
        onUploaded?.(json)
      }
    } catch (err) {
      setError('Fehler beim Upload.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="flex-end" gap={0.5}>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept=".pdf,.txt"
        onChange={handleSelect}
      />
      <Tooltip title="Lernmaterial importieren">
        <span>
          <IconButton onClick={handleClick} disabled={uploading} size="small">
            <UploadFileIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      {uploading ? <LinearProgress sx={{ width: 120 }} /> : null}
      {error ? (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      ) : null}
    </Box>
  )
}
