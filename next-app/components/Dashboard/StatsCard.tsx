'use client'

import { Card, CardContent, Typography } from '@mui/material'

interface StatsCardProps {
  title: string
  value: string | number
}

export default function StatsCard({ title, value }: StatsCardProps) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <CardContent>
        <Typography variant='subtitle2' color='text.secondary'>
          {title}
        </Typography>
        <Typography variant='h5' fontWeight='bold'>
          {value}
        </Typography>
      </CardContent>
    </Card>
  )
}
