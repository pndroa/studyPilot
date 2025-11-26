'use client'

import { useEffect, useState } from 'react'
import { Box, Typography } from '@mui/material'
import FlashCard from '@/components/Topics/FlashCard'
import { useParams } from 'next/navigation'
import type { FlashCardData } from '@/types/topics'

const STORAGE_KEY = (topicId: string) => `flashcards:${topicId}`

export default function FlashCardPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const [cards, setCards] = useState<FlashCardData[]>([])

  useEffect(() => {
    setCards(loadStored(topicId))
  }, [topicId])

  const handleDelete = (id: string) => {
    const next = cards.filter((c) => c.id !== id)
    setCards(next)
    try {
      localStorage.setItem(STORAGE_KEY(topicId), JSON.stringify(next))
    } catch {
      // ignore
    }
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

function loadStored(topicId: string): FlashCardData[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY(topicId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
