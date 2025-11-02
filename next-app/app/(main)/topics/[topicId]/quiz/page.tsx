'use client'

import { Box, Typography } from '@mui/material'
import QuizCard from '@/components/Topics/QuizCard'
import { useParams } from 'next/navigation'
import { mockQuizzesByTopic } from '@/utils/mockData'

export default function QuizPage() {
  const params = useParams<{ topicId: string }>()
  const topicId = params.topicId

  const questions = mockQuizzesByTopic[topicId] ?? []

  return (
    <Box>
      <Typography variant='h5' fontWeight='bold' mb={2}>
        Quizfragen zu diesem Thema
      </Typography>

      {questions.length === 0 ? (
        <Typography variant='body1'>
          Für dieses Thema gibt es noch keine Quizfragen.
        </Typography>
      ) : (
        questions.map((q) => (
          <QuizCard
            key={q.id}
            question={q.question}
            options={q.options}
            answer={q.options[q.answerIndex]}
          />
        ))
      )}
    </Box>
  )
}
