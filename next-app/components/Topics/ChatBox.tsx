'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
} from '@mui/material'
import type { ChatMessage, Sender } from '@/types/topics'

interface ChatBoxProps {
  topicId: string
  initialMessages?: ChatMessage[]
  onNewMessage?: (m: ChatMessage) => void // optional callback, falls du später persistieren willst
}

export default function ChatBox({
  topicId,
  initialMessages = [],
  onNewMessage,
}: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')

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

    // Mock KI-Antwort
    setTimeout(() => {
      const aiMsg = makeMessage(
        'ai',
        'Verstanden! Ich generiere dir eine prägnante Zusammenfassung 💡'
      )
      setMessages((prev) => [...prev, aiMsg])
      onNewMessage?.(aiMsg)
    }, 700)
  }

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    [messages]
  )

  return (
    <Box>
      <Card sx={{ mb: 2, height: 420, overflowY: 'auto', p: 2 }}>
        {sortedMessages.map((m) => (
          <CardContent
            key={m.id}
            sx={{
              bgcolor: m.sender === 'ai' ? '#e3f2fd' : '#fff',
              mb: 1,
              borderRadius: 2,
            }}
          >
            <Typography
              variant='body2'
              fontWeight={m.sender === 'ai' ? 'bold' : 'normal'}
            >
              {m.sender === 'ai' ? 'StudyPilot KI:' : 'Du:'}
            </Typography>
            <Typography>{m.text}</Typography>
          </CardContent>
        ))}
      </Card>

      <Box display='flex' gap={1}>
        <TextField
          fullWidth
          placeholder='Frage stellen oder Zusammenfassung anfordern...'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
        />
        <Button variant='contained' onClick={handleSend}>
          Senden
        </Button>
      </Box>
    </Box>
  )
}
