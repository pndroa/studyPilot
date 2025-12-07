import { getRedisClient } from '../redis/client'
import type {
  DashboardResponse,
  DashboardStats,
  QuizDataPoint,
  QuizResultRecord,
  StudyDayData,
} from '@/types/dashboard'

const QUIZ_RESULTS_KEY = 'dashboard:quizResults'
const MAX_STORED_RESULTS = 500

export async function addQuizResult(input: {
  topicId: string
  correct: number
  total: number
  createdAt?: string
}): Promise<QuizResultRecord> {
  const record = normalizeRecord({
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  })
  if (!record) {
    throw new Error('Ungueltige Quiz-Daten. Score konnte nicht gespeichert werden.')
  }

  const redis = getRedisClient()
  await redis.lpush(QUIZ_RESULTS_KEY, JSON.stringify(record))
  await redis.ltrim(QUIZ_RESULTS_KEY, 0, MAX_STORED_RESULTS - 1)

  return record
}

export async function fetchQuizResults(): Promise<QuizResultRecord[]> {
  try {
    const redis = getRedisClient()
    const raw = await redis.lrange(QUIZ_RESULTS_KEY, 0, -1)
    const parsed = raw
      .map((entry) => {
        try {
          return normalizeRecord(JSON.parse(entry))
        } catch {
          return null
        }
      })
      .filter(Boolean) as QuizResultRecord[]

    return parsed.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  } catch (error) {
    console.error('[Dashboard] Fehler beim Laden der Quiz-Ergebnisse', error)
    return []
  }
}

export async function loadDashboard(): Promise<DashboardResponse> {
  const results = await fetchQuizResults()
  const stats = computeStats(results)
  const quizTrend = buildQuizTrend(results)
  const recentResults = [...results].reverse().slice(0, 8)

  return { stats, quizTrend, recentResults }
}

function computeStats(results: QuizResultRecord[]): DashboardStats {
  const totalSessions = results.length
  const avgScore =
    results.length === 0
      ? 0
      : Math.round(
          results.reduce((sum, item) => sum + item.score, 0) / results.length
        )

  const studyDays = buildStudyDays(results)
  const streak = calculateStreak(results)

  return { totalSessions, avgScore, streak, studyDays }
}

function buildStudyDays(results: QuizResultRecord[]): StudyDayData[] {
  const countsByDate = results.reduce<Record<string, number>>((acc, item) => {
    const key = dayKey(item.createdAt)
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  const today = startOfDay(new Date())
  const days: StudyDayData[] = []
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const key = dayKey(date)
    const label = DAY_LABELS[date.getDay()]
    days.push({ day: label, sessions: countsByDate[key] ?? 0 })
  }
  return days
}

function calculateStreak(results: QuizResultRecord[]): number {
  const dates = new Set(results.map((r) => dayKey(r.createdAt)))
  let streak = 0
  const cursor = startOfDay(new Date())

  while (dates.has(dayKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

function buildQuizTrend(results: QuizResultRecord[]): QuizDataPoint[] {
  return results.slice(-12).map((item) => ({
    date: formatShortDate(item.createdAt),
    score: item.score,
  }))
}

function normalizeRecord(input: unknown): QuizResultRecord | null {
  const raw = input as Record<string, unknown>
  const topicId =
    typeof raw?.topicId === 'string' && raw.topicId.trim()
      ? raw.topicId.trim()
      : 'unbekanntes Thema'
  const correct = toSafeNumber(raw?.correct)
  const total = toSafeNumber(raw?.total)
  const createdAt =
    typeof raw?.createdAt === 'string' &&
    !Number.isNaN(new Date(raw.createdAt as string).getTime())
      ? new Date(raw.createdAt as string)
      : new Date()
  const id =
    typeof raw?.id === 'string' && raw.id.trim()
      ? raw.id.trim()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  if (!Number.isFinite(correct) || !Number.isFinite(total) || total <= 0) {
    return null
  }

  const clampedCorrect = clamp(correct, 0, total)
  const score = Math.max(0, Math.min(100, Math.round((clampedCorrect / total) * 100)))

  return {
    id,
    topicId,
    correct: clampedCorrect,
    total,
    score,
    createdAt: createdAt.toISOString(),
  }
}

function toSafeNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)
    if (Number.isFinite(parsed)) return parsed
  }
  return NaN
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function dayKey(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatShortDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  return `${day}.${month}`
}

const DAY_LABELS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
