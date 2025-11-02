'use client'

import { Card, CardContent, Typography, useTheme } from '@mui/material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import type { StudyDayData } from '@/types/dashboard'
import { getChartTheme } from '@/utils/chartTheme'

interface StudyFrequencyProps {
  data: StudyDayData[]
}

export default function StudyFrequency({ data }: StudyFrequencyProps) {
  const theme = useTheme()
  const chart = getChartTheme(theme)

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow:
          theme.palette.mode === 'dark'
            ? '0 2px 8px rgba(0,0,0,0.5)'
            : '0 2px 10px rgba(0,0,0,0.1)',
        bgcolor: theme.palette.background.paper,
      }}
    >
      <CardContent>
        <Typography variant='h6' mb={2}>
          Lernhäufigkeit
        </Typography>

        <ResponsiveContainer width='100%' height={250}>
          <BarChart data={data}>
            <CartesianGrid stroke={chart.gridColor} />
            <XAxis
              dataKey='day'
              stroke={chart.axisColor}
              tick={{ fill: chart.axisColor }}
            />
            <YAxis stroke={chart.axisColor} tick={{ fill: chart.axisColor }} />
            <Tooltip
              cursor={{ fill: chart.tooltip.cursorFill }}
              contentStyle={{
                backgroundColor: chart.tooltip.background,
                border: chart.tooltip.border,
                borderRadius: 8,
              }}
              labelStyle={{ color: chart.tooltip.labelColor }}
              itemStyle={{ color: chart.tooltip.textColor }}
            />
            <Bar
              dataKey='sessions'
              fill={chart.primaryColor}
              radius={[6, 6, 0, 0]}
              activeBar={{ fill: chart.activeColor }}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
