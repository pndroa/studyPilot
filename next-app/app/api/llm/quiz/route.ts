import { NextRequest, NextResponse } from 'next/server'
import { generateQuiz } from '@/lib/llm/service'
import { normalizeProvider } from '@/lib/llm/providerClient'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const provider = normalizeProvider(body.provider)
    const topic = typeof body.topic === 'string' ? body.topic.trim() : ''
    const text =
      typeof body.text === 'string' && body.text.trim()
        ? body.text.trim()
        : undefined
    const model =
      typeof body.model === 'string' && body.model.trim()
        ? body.model.trim()
        : undefined
    const apiKey =
      typeof body.apiKey === 'string' && body.apiKey.trim()
        ? body.apiKey.trim()
        : undefined
    const baseUrl =
      typeof body.baseUrl === 'string' && body.baseUrl.trim()
        ? body.baseUrl.trim()
        : undefined
    const questionCount =
      typeof body.questionCount === 'number' && Number.isFinite(body.questionCount)
        ? body.questionCount
        : undefined

    if (!topic) {
      return NextResponse.json(
        { message: 'Bitte ein Thema fuer die Quizfragen angeben.' },
        { status: 400 }
      )
    }

    const result = await generateQuiz({
      provider,
      topic,
      text,
      model,
      baseUrl,
      apiKey,
      questionCount,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('LLM Quiz-Generierung fehlgeschlagen', error)
    const message =
      error instanceof Error
        ? error.message
        : 'Die Generierung der Quizfragen ist fehlgeschlagen.'
    return NextResponse.json({ message }, { status: 500 })
  }
}
