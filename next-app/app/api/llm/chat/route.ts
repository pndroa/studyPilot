import { NextRequest, NextResponse } from 'next/server'
import { chatWithLlm } from '@/lib/llm/service'
import { normalizeProvider } from '@/lib/llm/providerClient'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const provider = normalizeProvider(body.provider)
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    const context =
      typeof body.context === 'string' && body.context.trim()
        ? body.context.trim()
        : undefined
    const documentId =
      typeof body.documentId === 'string' && body.documentId.trim()
        ? body.documentId.trim()
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

    if (!message) {
      return NextResponse.json(
        { message: 'Bitte eine Nachricht fuer den Chat senden.' },
        { status: 400 }
      )
    }

    const result = await chatWithLlm({
      provider,
      message,
      context,
      documentId,
      model,
      baseUrl,
      apiKey,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('LLM Chat fehlgeschlagen', error)
    const message =
      error instanceof Error ? error.message : 'Die Chat-Anfrage ist fehlgeschlagen.'
    return NextResponse.json({ message }, { status: 500 })
  }
}
