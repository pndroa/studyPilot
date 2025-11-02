export interface StudyDayData {
  day: string
  sessions: number
}

export interface QuizDataPoint {
  date: string
  score: number
}

export interface DashboardStats {
  totalSessions: number
  avgScore: number
  streak: number
  studyDays: StudyDayData[]
}
