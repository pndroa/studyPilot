import { NextRequest, NextResponse } from 'next/server'
import { addQuizResult } from '@/lib/dashboard/progressRepository'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const topicId =
      typeof body.topicId === 'string' && body.topicId.trim()
        ? body.topicId.trim()
        : 'allgemein'
    const correct = toNumber(body.correct)
    const total = toNumber(body.total)
    const createdAt =
      typeof body.createdAt === 'string' && body.createdAt.trim()
        ? body.createdAt
        : undefined

    if (!Number.isFinite(correct) || !Number.isFinite(total)) {
      return NextResponse.json(
        { message: 'Bitte gueltige Zahlen fuer richtig/gesamt senden.' },
        { status: 400 }
      )
    }

    if (total <= 0) {
      return NextResponse.json(
        { message: 'Die Gesamtzahl der Fragen muss groesser als 0 sein.' },
        { status: 400 }
      )
    }

    const record = await addQuizResult({
      topicId,
      correct: Math.max(0, Math.min(correct, total)),
      total,
      createdAt,
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('[Dashboard] Quiz-Resultat konnte nicht gespeichert werden', error)
    const message =
      error instanceof Error
        ? error.message
        : 'Quiz-Resultat konnte nicht gespeichert werden.'
    return NextResponse.json({ message }, { status: 500 })
  }
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)
    if (Number.isFinite(parsed)) return parsed
  }
  return Number.NaN
}
