import { NextRequest, NextResponse } from 'next/server'
import { generateSummary } from '@/lib/llm/service'
import { normalizeProvider } from '@/lib/llm/providerClient'

export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await context.params
    const body = await req.json().catch(() => ({}))
    const provider = normalizeProvider(body.provider)
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
    const contextText =
      typeof body.text === 'string' && body.text.trim()
        ? body.text.trim()
        : 'Erstelle eine kompakte Zusammenfassung zum Thema.'

    const result = await generateSummary({
      provider,
      text: contextText,
      topic: topicId,
      model,
      baseUrl,
      apiKey,
    })

    const summary = {
      summary: result.summary,
      provider: result.provider,
      model: result.model,
      usedEndpoint: result.usedEndpoint,
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Topic Zusammenfassung fehlgeschlagen', error)
    const message =
      error instanceof Error
        ? error.message
        : 'Die Zusammenfassung ist fehlgeschlagen.'
    return NextResponse.json({ message }, { status: 500 })
  }
}
