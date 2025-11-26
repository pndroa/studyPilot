import { NextRequest, NextResponse } from 'next/server'
import { generateSummary } from '@/lib/llm/service'
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
        { message: 'Bitte einen Text fuer die Zusammenfassung angeben.' },
        { status: 400 }
      )
    }

    const result = await generateSummary({
      provider,
      text,
      topic,
      model,
      baseUrl,
      apiKey,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('LLM Zusammenfassung fehlgeschlagen', error)
    const message =
      error instanceof Error
        ? error.message
        : 'Die Zusammenfassung ist fehlgeschlagen.'
    return NextResponse.json({ message }, { status: 500 })
  }
}
