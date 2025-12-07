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

export interface QuizResultRecord {
  id: string
  topicId: string
  correct: number
  total: number
  score: number
  createdAt: string
}

export interface DashboardResponse {
  stats: DashboardStats
  quizTrend: QuizDataPoint[]
  recentResults: QuizResultRecord[]
}
