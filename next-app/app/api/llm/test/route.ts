import { NextRequest, NextResponse } from 'next/server'
import { normalizeProvider } from '@/lib/llm/providerClient'
import { testOllamaConnection } from '@/lib/ollama/client'

export const runtime = 'nodejs'

const TEST_TIMEOUT_MS = 12_000

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const provider = normalizeProvider(body.provider)

    if (provider === 'ollama') {
      const baseUrl =
        typeof body.baseUrl === 'string' && body.baseUrl.trim()
          ? body.baseUrl
          : undefined
      const result = await testOllamaConnection(baseUrl)
      return NextResponse.json({
        ok: true,
        provider,
        message:
          result.supportedModels.length > 0
            ? `Verbindung steht. Gefundene Modelle: ${result.supportedModels.join(', ')}`
            : 'Verbindung steht. Keine bevorzugten Modelle gefunden.',
        ...result,
      })
    }

    if (provider === 'openai') {
      const apiKey =
        typeof body.apiKey === 'string' && body.apiKey.trim()
          ? body.apiKey.trim()
          : ''
      if (!apiKey) {
        return NextResponse.json(
          { ok: false, message: 'Bitte OPENAI_API_KEY angeben.' },
          { status: 400 }
        )
      }

      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(TEST_TIMEOUT_MS),
      })

      if (!response.ok) {
        const payload = await safeReadBody(response)
        throw new Error(
          `OpenAI antwortet mit Status ${response.status}: ${
            payload || response.statusText
          }`
        )
      }

      const data = (await response.json()) as { data?: { id?: string }[] }
      const models =
        data.data
          ?.map((item) => item.id)
          .filter(Boolean)
          .slice(0, 6)
          .map((name) => ({ name: name as string })) ?? []

      return NextResponse.json({
        ok: true,
        provider,
        endpoint: 'OpenAI API',
        message: `OpenAI erreichbar${models.length ? ` (${models.length} Modelle sichtbar)` : ''}.`,
        models,
      })
    }

    if (provider === 'gemini') {
      const apiKey =
        typeof body.apiKey === 'string' && body.apiKey.trim()
          ? body.apiKey.trim()
          : ''
      if (!apiKey) {
        return NextResponse.json(
          { ok: false, message: 'Bitte GEMINI_API_KEY angeben.' },
          { status: 400 }
        )
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
          signal: AbortSignal.timeout(TEST_TIMEOUT_MS),
        }
      )

      if (!response.ok) {
        const payload = await safeReadBody(response)
        throw new Error(
          `Gemini antwortet mit Status ${response.status}: ${
            payload || response.statusText
          }`
        )
      }

      const data = (await response.json()) as { models?: { name?: string }[] }
      const models =
        data.models
          ?.map((item) => normalizeGeminiModel(item.name))
          .filter(Boolean)
          .slice(0, 6)
          .map((name) => ({ name: name as string })) ?? []

      return NextResponse.json({
        ok: true,
        provider,
        endpoint: 'Gemini API',
        message: `Gemini erreichbar${models.length ? ` (${models.length} Modelle sichtbar)` : ''}.`,
        models,
      })
    }

    return NextResponse.json(
      { ok: false, message: `Unbekannter Provider: ${provider}` },
      { status: 400 }
    )
  } catch (error) {
    console.error('LLM Verbindungstest fehlgeschlagen', error)
    const message =
      error instanceof Error
        ? error.message
        : 'Verbindungstest fehlgeschlagen.'
    return NextResponse.json({ ok: false, message }, { status: 500 })
  }
}

async function safeReadBody(response: Response): Promise<string> {
  try {
    const text = await response.text()
    return text.slice(0, 200)
  } catch {
    return ''
  }
}

function normalizeGeminiModel(model?: string): string | undefined {
  if (!model) return undefined
  let trimmed = model.trim()
  if (!trimmed) return undefined
  if (trimmed.startsWith('models/')) {
    trimmed = trimmed.slice('models/'.length)
  }
  if (trimmed.endsWith('-latest')) {
    trimmed = trimmed.slice(0, -'-latest'.length)
  }
  if (trimmed === 'gemini-1.5-flash') return 'gemini-1.5-flash-002'
  if (trimmed === 'gemini-1.5-pro') return 'gemini-1.5-pro-002'
  if (trimmed === 'gemini-pro') return 'gemini-1.5-pro-002'
  return trimmed || undefined
}
