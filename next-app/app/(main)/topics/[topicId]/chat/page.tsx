'use client'

import { Box, Typography } from '@mui/material'
import ChatBox from '@/components/Topics/ChatBox'
import { useParams } from 'next/navigation'
import { mockChatByTopic } from '@/utils/mockData'

export default function ChatPage() {
  const params = useParams<{ topicId: string }>()
  const topicId = params.topicId

  const initial = mockChatByTopic[topicId] ?? []

  return (
    <Box>
      <Typography variant='h5' fontWeight='bold' mb={2}>
        KI Chat – Zusammenfassung & Fragen
      </Typography>
      <ChatBox topicId={topicId} initialMessages={initial} />
    </Box>
  )
}
