import { NextRequest, NextResponse } from 'next/server'
import { generateWithOllama } from '@/lib/ollama/client'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const prompt =
      typeof body.prompt === 'string' && body.prompt.trim() ? body.prompt : ''
    const model =
      typeof body.model === 'string' && body.model.trim() ? body.model : undefined
    const baseUrl =
      typeof body.baseUrl === 'string' && body.baseUrl.trim()
        ? body.baseUrl
        : undefined

    if (!prompt) {
      return NextResponse.json(
        { message: 'Bitte einen Prompt angeben.' },
        { status: 400 }
      )
    }

    const result = await generateWithOllama({
      prompt,
      model,
      baseUrl,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Ollama Generierung fehlgeschlagen', error)
    const message =
      error instanceof Error
        ? error.name === 'AbortError'
          ? 'Zeitüberschreitung: Ollama hat nicht geantwortet.'
          : error.message
        : 'Die Anfrage an den Ollama-Server ist fehlgeschlagen.'

    return NextResponse.json({ message }, { status: 500 })
  }
}
