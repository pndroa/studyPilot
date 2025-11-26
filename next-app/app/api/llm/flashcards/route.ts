import { NextRequest, NextResponse } from 'next/server'
import { generateFlashcards } from '@/lib/llm/service'
import { normalizeProvider } from '@/lib/llm/providerClient'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const provider = normalizeProvider(body.provider)
    const text = typeof body.text === 'string' ? body.text.trim() : ''
    const topic =
      typeof body.topic === 'string' && body.topic.trim()
        ? body.topic.trim()
        : undefined
    const cardCount =
      typeof body.cardCount === 'number' && Number.isFinite(body.cardCount)
        ? body.cardCount
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

    if (!text) {
      return NextResponse.json(
        { message: 'Bitte einen Text fuer die Lernkarten angeben.' },
        { status: 400 }
      )
    }

    const result = await generateFlashcards({
      provider,
      text,
      topic,
      cardCount,
      model,
      baseUrl,
      apiKey,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('LLM Flashcards fehlgeschlagen', error)
    const message =
      error instanceof Error
        ? error.message
        : 'Die Generierung der Lernkarten ist fehlgeschlagen.'
    return NextResponse.json({ message }, { status: 500 })
  }
}
