import { GoogleGenAI } from '@google/genai'
import { generateWithOllama, normalizeBaseUrl, SUPPORTED_OLLAMA_MODELS } from '@/lib/ollama/client'
import type { LlmProvider } from '@/types/llm'

const DEFAULT_MODELS: Record<LlmProvider, string> = {
  ollama: SUPPORTED_OLLAMA_MODELS[0] ?? 'llama3',
  openai: 'gpt-4o-mini',
  gemini: 'gemini-2.0-flash',
}

export function normalizeProvider(value: unknown): LlmProvider {
  if (typeof value !== 'string') return 'ollama'
  const lower = value.toLowerCase()
  if (lower === 'openai' || lower === 'gemini' || lower === 'ollama') {
    return lower
  }
  return 'ollama'
}

interface ProviderPromptInput {
  provider: LlmProvider
  prompt: string
  model?: string
  baseUrl?: string
  timeoutMs?: number
  apiKey?: string
}

interface ProviderPromptResult {
  content: string
  model: string
  endpoint?: string
}

export async function runProviderPrompt(
  input: ProviderPromptInput
): Promise<ProviderPromptResult> {
  const { provider, prompt } = input

  if (provider === 'ollama') {
    const model = input.model?.trim() || DEFAULT_MODELS.ollama
    const result = await generateWithOllama({
      prompt,
      model,
      baseUrl: input.baseUrl,
      timeoutMs: input.timeoutMs ?? 120_000,
    })

    return {
      content: result.response.trim(),
      model: result.model,
      endpoint: normalizeBaseUrl(input.baseUrl),
    }
  }

  if (provider === 'openai') {
    const apiKey = input.apiKey?.trim() || process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY ist nicht gesetzt. Bitte im LLM-Tab hinterlegen.')
    }

    const model = input.model?.trim() || DEFAULT_MODELS.openai
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.25,
        messages: [
          {
            role: 'system',
            content:
              'Du bist ein Tutor, der sachliche, kompakte Antworten auf Deutsch liefert. Halte dich an das angeforderte Format.',
          },
          { role: 'user', content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(input.timeoutMs ?? 60_000),
    })

    if (!response.ok) {
      const payload = await safeReadBody(response)
      throw new Error(
        `OpenAI antwortet mit Status ${response.status}: ${
          payload || response.statusText
        }`
      )
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const content = data.choices?.[0]?.message?.content?.trim()
    if (!content) {
      throw new Error('OpenAI hat keine Antwort geliefert.')
    }

    return { content, model, endpoint: 'OpenAI API' }
  }

  if (provider === 'gemini') {
    const apiKey = input.apiKey?.trim() || process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY ist nicht gesetzt. Bitte im LLM-Tab hinterlegen.')
    }

    const model = normalizeGeminiModel(input.model) || DEFAULT_MODELS.gemini
    const genAI = new GoogleGenAI({ apiKey })

    const exec = async (targetModel: string) => {
      const response = await genAI.models.generateContent({
        model: targetModel,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { temperature: 0.35 },
      })
      const content = response.text?.trim()
      if (!content) {
        throw new Error('Gemini hat keine Antwort geliefert.')
      }
      return { content, model: targetModel }
    }

    try {
      const { content, model: usedModel } = await exec(model)
      return { content, model: usedModel, endpoint: 'Gemini API (genai SDK)' }
    } catch (error) {
      const message =
        error instanceof Error ? error.message.toLowerCase() : ''
      const isNotFound = message.includes('not found') || message.includes('404')
      const isLegacy =
        model.includes('1.5-flash') || model.includes('1.5-pro') || model.includes('gemini-pro')

      if (isNotFound && isLegacy) {
        const fallbackModel = 'gemini-2.0-flash'
        const { content, model: usedModel } = await exec(fallbackModel)
        return { content, model: usedModel, endpoint: 'Gemini API (genai SDK, fallback)' }
      }

      throw error
    }
  }

  throw new Error(`Unbekannter Provider: ${String(provider)}`)
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
  // Map bekannte Kurzformen auf aktuelle Modellnamen
  if (trimmed === 'gemini-1.5-flash') return 'gemini-1.5-flash-002'
  if (trimmed === 'gemini-1.5-pro') return 'gemini-1.5-pro-002'
  if (trimmed === 'gemini-pro') return 'gemini-1.5-pro-002'
  return trimmed || undefined
}
