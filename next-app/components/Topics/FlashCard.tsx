'use client'

import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  useTheme,
} from '@mui/material'
import { useEffect, useState } from 'react'
import type { FlashCardData } from '@/types/topics'

interface FlashCardProps {
  cards: FlashCardData[]
  onDelete?: (id: string) => void
}

export default function FlashCard({
  cards: initialCards,
  onDelete,
}: FlashCardProps) {
  const theme = useTheme()
  const [cards, setCards] = useState<FlashCardData[]>(initialCards)
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    setCards(initialCards)
    setCurrent(0)
    setFlipped(false)
  }, [initialCards])

  const handleFlip = () => setFlipped((f) => !f)

  const handleNext = () => {
    setFlipped(false)
    setCurrent((prev) => (prev + 1) % cards.length)
  }

  const handleDelete = (id: string) => {
    const updated = cards.filter((c) => c.id !== id)
    onDelete?.(id)
    setCards(updated)
    setCurrent(0)
    setFlipped(false)
  }

  if (cards.length === 0) {
    return (
      <Typography textAlign='center' mt={2}>
        Keine Karteikarten vorhanden.
      </Typography>
    )
  }

  const currentCard = cards[current]

  return (
    <Box display='flex' flexDirection='column' alignItems='center'>
      <Box
        sx={{
          width: 400,
          height: 250,
          perspective: '1000px',
          mb: 3,
          cursor: 'pointer',
        }}
        onClick={handleFlip}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.6s ease',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Vorderseite */}
          <Card
            sx={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              backfaceVisibility: 'hidden',
              bgcolor: theme.palette.background.paper,
              boxShadow:
                theme.palette.mode === 'dark'
                  ? '0 4px 12px rgba(0,0,0,0.4)'
                  : '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <CardContent
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
              }}
            >
              <Typography variant='h6'>{currentCard.question}</Typography>
            </CardContent>
          </Card>

          {/* Rückseite */}
          <Card
            sx={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              transform: 'rotateY(180deg)',
              backfaceVisibility: 'hidden',
              bgcolor: theme.palette.background.paper,
              boxShadow:
                theme.palette.mode === 'dark'
                  ? '0 4px 12px rgba(0,0,0,0.4)'
                  : '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <CardContent
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
              }}
            >
              <Typography variant='h6'>{currentCard.answer}</Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box display='flex' gap={2}>
        <Button
          variant='contained'
          onClick={handleNext}
          disabled={cards.length <= 1}
        >
          Nächste
        </Button>
        <Button
          variant='outlined'
          color='error'
          onClick={() => handleDelete(currentCard.id)}
        >
          Löschen
        </Button>
      </Box>
    </Box>
  )
}
