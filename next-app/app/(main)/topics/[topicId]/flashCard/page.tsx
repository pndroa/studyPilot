'use client'

import { Box, Typography } from '@mui/material'
import FlashCard from '@/components/Topics/FlashCard'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { mockFlashCardsByTopic } from '@/utils/mockData'

export default function FlashCardPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const [cards, setCards] = useState(mockFlashCardsByTopic[topicId] ?? [])

  const handleDelete = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <Box>
      <Typography variant='h5' fontWeight='bold' mb={2}>
        Karteikarten
      </Typography>
      <FlashCard cards={cards} onDelete={handleDelete} />
    </Box>
  )
}
