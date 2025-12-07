'use client'

import { useCallback, useEffect, useState } from 'react'
import RefreshIcon from '@mui/icons-material/Refresh'
import { Alert, Box, Button, Stack, Typography } from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import StatsCard from '@/components/Dashboard/StatsCard'
import LearningStreak from '@/components/Dashboard/LearningStreak'
import QuizPerformance from '@/components/Dashboard/QuizPerformance'
import StudyFrequency from '@/components/Dashboard/StudyFrequency'
import RecentResults from '@/components/Dashboard/RecentResults'
import type { DashboardResponse, DashboardStats } from '@/types/dashboard'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/dashboard', { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.message || 'Dashboard konnte nicht geladen werden.')
      }
      setData(payload as DashboardResponse)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Dashboard konnte nicht geladen werden.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const stats = data?.stats ?? createEmptyStats()

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1.5}
        mb={2}
      >
        <Box>
          <Typography variant='h4' fontWeight='bold'>
            Dein Lern-Dashboard
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Behalte Quiz-Ergebnisse, Sessions und Streak im Blick.
          </Typography>
        </Box>
        <Button
          variant='outlined'
          startIcon={<RefreshIcon />}
          onClick={() => loadDashboard()}
          disabled={isLoading}
        >
          {isLoading ? 'Aktualisiere...' : 'Aktualisieren'}
        </Button>
      </Stack>

      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <StatsCard
            title='Gesamt Lernsessions'
            value={stats.totalSessions}
            loading={isLoading && !data}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatsCard
            title='Durchschnittlicher Quizscore'
            value={`${stats.avgScore}%`}
            loading={isLoading && !data}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatsCard
            title='Aktuelle Lernstreak'
            value={`${stats.streak} Tage`}
            loading={isLoading && !data}
          />
        </Grid>

        <Grid item xs={12} md={7}>
          <QuizPerformance data={data?.quizTrend ?? []} isLoading={isLoading && !data} />
        </Grid>
        <Grid item xs={12} md={5}>
          <StudyFrequency
            data={stats.studyDays}
            isLoading={isLoading && !data}
          />
        </Grid>

        <Grid item xs={12} md={5}>
          <LearningStreak streak={stats.streak} loading={isLoading && !data} />
        </Grid>
        <Grid item xs={12} md={7}>
          <RecentResults results={data?.recentResults ?? []} isLoading={isLoading && !data} />
        </Grid>
      </Grid>
    </Box>
  )
}

function createEmptyStats(): DashboardStats {
  const today = new Date()
  const labels = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
  const days = []
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    days.push({ day: labels[d.getDay()], sessions: 0 })
  }
  return {
    totalSessions: 0,
    avgScore: 0,
    streak: 0,
    studyDays: days,
  }
}
