import { NextRequest, NextResponse } from 'next/server'
import { testOllamaConnection } from '@/lib/ollama/client'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const baseUrl =
      typeof body.baseUrl === 'string' && body.baseUrl.trim()
        ? body.baseUrl
        : undefined

    const result = await testOllamaConnection(baseUrl)

    return NextResponse.json({
      ok: true,
      message:
        result.supportedModels.length > 0
          ? `Verbindung steht. Gefundene Modelle: ${result.supportedModels.join(', ')}`
          : 'Verbindung steht. Keine bevorzugten Modelle gefunden.',
      ...result,
    })
  } catch (error) {
    console.error('Ollama Verbindungstest fehlgeschlagen', error)
    const message =
      error instanceof Error
        ? error.name === 'AbortError'
          ? 'Zeitüberschreitung: Kein Kontakt zum Ollama-Server.'
          : error.message
        : 'Verbindung zum Ollama-Server fehlgeschlagen.'

    return NextResponse.json({ ok: false, message }, { status: 500 })
  }
}
