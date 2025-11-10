'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  useTheme,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import type { ChatMessage, Sender } from '@/types/topics'
import ChatImportButton from '@/components/Topics/ChatImportButton'

interface ChatBoxProps {
  topicId: string
  initialMessages?: ChatMessage[]
  onNewMessage?: (m: ChatMessage) => void
}

export default function ChatBox({
  topicId,
  initialMessages = [],
  onNewMessage,
}: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const theme = useTheme()

  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  const makeMessage = (sender: Sender, text: string): ChatMessage => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    topicId,
    sender,
    text,
    timestamp: new Date().toISOString(),
  })

  const handleSend = () => {
    const text = input.trim()
    if (!text) return

    const userMsg = makeMessage('user', text)
    const next = [...messages, userMsg]
    setMessages(next)
    onNewMessage?.(userMsg)
    setInput('')

    // Fake-Antwort
    setTimeout(() => {
      const aiMsg = makeMessage(
        'ai',
        'Verstanden! Ich generiere dir eine prägnante Zusammenfassung 💡'
      )
      setMessages((prev) => [...prev, aiMsg])
      onNewMessage?.(aiMsg)
    }, 700)
  }

  // WICHTIG: wenn Datei hochgeladen wurde
  const handleImported = (fileInfo: {
    fileName: string
    documentId: string
    createdAt: string
  }) => {
    const userMsg = makeMessage(
      'user',
      `📄 Datei analysiert: ${fileInfo.fileName}`
    )
    const aiMsg = makeMessage(
      'ai',
      'Cool, ich habe das Dokument eingebettet. Schau dir die Analyse an oder stelle Fragen dazu!'
    )

    setMessages((prev) => [...prev, userMsg, aiMsg])
    onNewMessage?.(userMsg)
    onNewMessage?.(aiMsg)
  }

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    [messages]
  )

  const aiBg =
    theme.palette.mode === 'dark'
      ? theme.palette.primary.dark
      : theme.palette.primary.light

  const userBg =
    theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff'

  return (
    <Box>
      {/* Header über dem Chat */}
      <Box
        mb={1.5}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Chat
        </Typography>
        <ChatImportButton onUploaded={handleImported} />
      </Box>

      <Card
        sx={{
          mb: 2,
          height: 420,
          overflowY: 'auto',
          p: 2,
          bgcolor: theme.palette.background.paper,
          transition: 'background-color 0.4s ease, color 0.4s ease',
        }}
      >
        <AnimatePresence initial={false}>
          {sortedMessages.map((m) => (
            <motion.div
              key={m.id}
              initial={{
                opacity: 0,
                x: m.sender === 'ai' ? -50 : 50,
              }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: m.sender === 'ai' ? -30 : 30 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <CardContent
                sx={{
                  bgcolor: m.sender === 'ai' ? aiBg : userBg,
                  color: theme.palette.text.primary,
                  mb: 1,
                  borderRadius: 2,
                  transition: 'background-color 0.4s ease, color 0.4s ease',
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={m.sender === 'ai' ? 'bold' : 'normal'}
                  sx={{ opacity: 0.8 }}
                >
                  {m.sender === 'ai' ? 'StudyPilot KI:' : 'Du:'}
                </Typography>
                <Typography variant="body2">{m.text}</Typography>
              </CardContent>
            </motion.div>
          ))}
        </AnimatePresence>
      </Card>

      <Box display="flex" gap={1}>
        <TextField
          fullWidth
          placeholder="Frage stellen oder Zusammenfassung anfordern..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
        />
        <Button variant="contained" onClick={handleSend}>
          Senden
        </Button>
      </Box>
    </Box>
  )
}
