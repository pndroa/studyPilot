'use client'

import { Card, CardContent, Typography } from '@mui/material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { StudyDayData } from '@/types/dashboard'

interface StudyFrequencyProps {
  data: StudyDayData[]
}

export default function StudyFrequency({ data }: StudyFrequencyProps) {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
      <CardContent>
        <Typography variant='h6' mb={2}>
          Lernhäufigkeit
        </Typography>
        <ResponsiveContainer width='100%' height={250}>
          <BarChart data={data}>
            <XAxis dataKey='day' />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey='sessions' fill='#2196f3' radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
