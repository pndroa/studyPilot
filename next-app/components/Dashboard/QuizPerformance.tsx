'use client'

import { Card, CardContent, Typography } from '@mui/material'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { mockQuizTrend } from '@/utils/mockData'
import type { QuizDataPoint } from '@/types/dashboard'

export default function QuizPerformance() {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
      <CardContent>
        <Typography variant='h6' mb={2}>
          Quiz Performance
        </Typography>
        <ResponsiveContainer width='100%' height={250}>
          <LineChart data={mockQuizTrend as QuizDataPoint[]}>
            <XAxis dataKey='date' />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line
              type='monotone'
              dataKey='score'
              stroke='#1976d2'
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
