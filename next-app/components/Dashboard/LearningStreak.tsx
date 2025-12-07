'use client'

import { Card, CardContent, LinearProgress, Skeleton, Typography } from '@mui/material'

interface LearningStreakProps {
  streak: number
  loading?: boolean
}

export default function LearningStreak({ streak, loading }: LearningStreakProps) {
  const progressValue = Math.min(streak * 10, 100)

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 2, height: '100%' }}>
      <CardContent>
        <Typography variant='h6' mb={1}>
          Lernstreak
        </Typography>
        {loading ? (
          <Skeleton variant='text' width={220} />
        ) : (
          <Typography variant='body2' color='text.secondary'>
            Du lernst seit {streak} Tagen ohne Pause 🎯
          </Typography>
        )}
        <LinearProgress
          variant='determinate'
          value={loading ? 0 : progressValue}
          sx={{ mt: 2, height: 10, borderRadius: 5 }}
        />
      </CardContent>
    </Card>
  )
}
