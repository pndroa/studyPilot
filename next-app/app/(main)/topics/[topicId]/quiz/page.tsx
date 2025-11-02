'use client'

import { Box, Typography } from '@mui/material'
import QuizCard from '@/components/Topics/QuizCard'
import { useState } from 'react'
import { mockQuizzesByTopic } from '@/utils/mockData'
import { useParams } from 'next/navigation'

export default function QuizPage() {
  const params = useParams<{ topicId: string }>()
  const topicId = params.topicId
  const [quizzes, setQuizzes] = useState(mockQuizzesByTopic[topicId] ?? [])

  const handleDelete = (id: string) => {
    setQuizzes((prev) => prev.filter((q) => q.id !== id))
  }

  return (
    <Box>
      <Typography variant='h5' fontWeight='bold' mb={2}>
        Quizfragen zu diesem Thema
      </Typography>

      {quizzes.length === 0 ? (
        <Typography>Keine Quizfragen vorhanden.</Typography>
      ) : (
        quizzes.map((q) => (
          <QuizCard
            key={q.id}
            id={q.id}
            question={q.question}
            options={q.options}
            answerIndex={q.answerIndex}
            onDelete={handleDelete}
          />
        ))
      )}
    </Box>
  )
}
