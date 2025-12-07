'use client'

import { Card, CardContent, Typography, useTheme } from '@mui/material'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import type { QuizDataPoint } from '@/types/dashboard'
import { getChartTheme } from '@/utils/chartTheme'

interface QuizPerformanceProps {
  data: QuizDataPoint[]
  isLoading?: boolean
}

export default function QuizPerformance({ data, isLoading }: QuizPerformanceProps) {
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
          Quiz Performance
        </Typography>

        {isLoading ? (
          <Typography color='text.secondary'>Lade Quiz-Verlauf ...</Typography>
        ) : data.length === 0 ? (
          <Typography color='text.secondary'>
            Noch keine Quiz-Ergebnisse gespeichert.
          </Typography>
        ) : (
          <ResponsiveContainer width='100%' height={250}>
            <LineChart data={data}>
              <CartesianGrid stroke={chart.gridColor} />
              <XAxis
                dataKey='date'
                stroke={chart.axisColor}
                tick={{ fill: chart.axisColor }}
              />
              <YAxis stroke={chart.axisColor} tick={{ fill: chart.axisColor }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: chart.tooltip.background,
                  border: chart.tooltip.border,
                  borderRadius: 8,
                }}
                labelStyle={{ color: chart.tooltip.labelColor }}
                itemStyle={{ color: chart.tooltip.textColor }}
                cursor={{ fill: chart.tooltip.cursorFill }}
              />
              <Line
                type='monotone'
                dataKey='score'
                stroke={chart.primaryColor}
                strokeWidth={2}
                dot={{
                  r: 4,
                  fill: chart.activeColor,
                  stroke: theme.palette.background.paper,
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: chart.activeColor,
                  stroke: theme.palette.background.paper,
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
