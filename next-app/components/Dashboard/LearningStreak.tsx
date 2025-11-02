'use client'

import { Card, CardContent, Typography, LinearProgress } from '@mui/material'

interface LearningStreakProps {
  streak: number
}

export default function LearningStreak({ streak }: LearningStreakProps) {
  const progressValue = Math.min(streak * 10, 100)

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
      <CardContent>
        <Typography variant='h6' mb={1}>
          Lernstreak
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Du lernst seit {streak} Tagen ohne Pause 🎯
        </Typography>
        <LinearProgress
          variant='determinate'
          value={progressValue}
          sx={{ mt: 2, height: 10, borderRadius: 5 }}
        />
      </CardContent>
    </Card>
  )
}
