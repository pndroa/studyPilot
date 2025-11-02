'use client'

import { useState } from 'react'
import { Card, CardContent, Typography, Button, Stack } from '@mui/material'

interface QuizCardProps {
  question: string
  options: string[]
  answer: string
}

export default function QuizCard({ question, options, answer }: QuizCardProps) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant='subtitle1' fontWeight='bold' mb={1}>
          {question}
        </Typography>
        <Stack spacing={1}>
          {options.map((opt) => (
            <Button
              key={opt}
              variant={selected === opt ? 'contained' : 'outlined'}
              color={
                selected
                  ? opt === answer
                    ? 'success'
                    : opt === selected
                    ? 'error'
                    : 'primary'
                  : 'primary'
              }
              onClick={() => setSelected(opt)}
            >
              {opt}
            </Button>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}
