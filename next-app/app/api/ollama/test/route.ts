/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { testOllamaConnection } from '@/lib/ollama/client'

export const runtime = 'nodejs'

export async function GET() {
  const baseUrl = process.env.OLLAMA_BASE_URL

  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Ollama Error: ${response.statusText}`)
    }

    const data = await response.json()
    const modelNames: string[] = data.models.map((m: any) => m.name)

    return NextResponse.json(modelNames)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Fehler beim Laden der Modelle', details: error.message },
      { status: 500 }
    )
  }
}

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
          ? `Verbindung steht. Gefundene Modelle: ${result.supportedModels.join(
              ', '
            )}`
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
