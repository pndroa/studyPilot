'use client'

import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Stack,
  useTheme,
  IconButton,
} from '@mui/material'
import { Delete } from '@mui/icons-material'
import { useState } from 'react'

interface QuizCardProps {
  id: string
  question: string
  options: string[]
  answerIndex: number
  onDelete?: (id: string) => void
}

export default function QuizCard({
  id,
  question,
  options,
  answerIndex,
  onDelete,
}: QuizCardProps) {
  const theme = useTheme()

  const [selected, setSelected] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)

  const handleSelect = (index: number) => {
    if (isAnswered) return
    setSelected(index)
    setIsAnswered(true)
  }

  const handleReset = () => {
    setSelected(null)
    setIsAnswered(false)
  }

  const isCorrect = selected === answerIndex

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow:
          theme.palette.mode === 'dark'
            ? '0 2px 8px rgba(0,0,0,0.5)'
            : '0 2px 10px rgba(0,0,0,0.1)',
        bgcolor: theme.palette.background.paper,
        mb: 3,
        position: 'relative',
      }}
    >
      <IconButton
        onClick={() => onDelete?.(id)}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          color: theme.palette.error.main,
          opacity: 0.7,
          '&:hover': { opacity: 1 },
        }}
      >
        <Delete />
      </IconButton>

      <CardContent>
        <Typography variant='h6' mb={2}>
          {question}
        </Typography>

        <Stack spacing={1.5}>
          {options.map((opt, index) => {
            const selectedColor = (() => {
              if (!isAnswered) return theme.palette.background.paper
              if (index === selected) {
                return isCorrect
                  ? theme.palette.success.light
                  : theme.palette.error.light
              }
              if (index === answerIndex && !isCorrect) {
                return theme.palette.success.light
              }
              return theme.palette.background.paper
            })()

            const borderColor =
              isAnswered && index === selected
                ? isCorrect
                  ? theme.palette.success.main
                  : theme.palette.error.main
                : theme.palette.divider

            return (
              <Button
                key={index}
                variant='outlined'
                onClick={() => handleSelect(index)}
                sx={{
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  fontWeight: 500,
                  borderColor,
                  bgcolor: selectedColor,
                  color: theme.palette.text.primary,
                  '&:hover': {
                    bgcolor:
                      theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(0,0,0,0.03)',
                  },
                }}
                fullWidth
              >
                {opt}
              </Button>
            )
          })}
        </Stack>

        {isAnswered && (
          <Box mt={2}>
            <Typography
              variant='body1'
              fontWeight='bold'
              color={isCorrect ? 'success.main' : 'error.main'}
            >
              {isCorrect ? '✅ Richtig!' : '❌ Falsch!'}
            </Typography>
            <Button
              onClick={handleReset}
              sx={{ mt: 1 }}
              variant='outlined'
              color='secondary'
            >
              Reset
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
