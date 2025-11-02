'use client'

import { Box, Typography } from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import StatsCard from '@/components/Dashboard/StatsCard'
import LearningStreak from '@/components/Dashboard/LearningStreak'
import QuizPerformance from '@/components/Dashboard/QuizPerformance'
import StudyFrequency from '@/components/Dashboard/StudyFrequency'
import { mockStats } from '@/utils/mockData'

export default function DashboardPage() {
  const { totalSessions, avgScore, streak, studyDays } = mockStats

  return (
    <Box>
      <Typography variant='h4' fontWeight='bold' mb={3}>
        Dein Lern-Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Stat Cards */}
        <Grid item xs={12} md={4}>
          <StatsCard title='Gesamt Lernsessions' value={totalSessions} />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatsCard
            title='Durchschnittlicher Quizscore'
            value={`${avgScore}%`}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatsCard title='Aktuelle Lernstreak' value={`${streak} Tage`} />
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={6}>
          <QuizPerformance />
        </Grid>
        <Grid item xs={12} md={6}>
          <StudyFrequency data={studyDays} />
        </Grid>

        {/* Streak Progress */}
        <Grid item xs={12}>
          <LearningStreak streak={streak} />
        </Grid>
      </Grid>
    </Box>
  )
}
