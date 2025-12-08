export const DEFAULT_OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL
const LIST_TIMEOUT_MS = 10_000
const GENERATE_TIMEOUT_MS = 120_000

export const SUPPORTED_OLLAMA_MODELS = listOllamaModels(DEFAULT_OLLAMA_BASE_URL)

export interface OllamaModelInfo {
  name: string
  size?: number
  digest?: string
  modified_at?: string
}

export interface OllamaConnectionResult {
  baseUrl: string
  models: OllamaModelInfo[]
  supportedModels: string[]
}

export interface OllamaGenerateResult {
  response: string
  model: string
  baseUrl: string
  durationMs: number
}

export function normalizeBaseUrl(baseUrl?: string): string {
  const value = baseUrl?.trim() || DEFAULT_OLLAMA_BASE_URL
  return value?.endsWith('/') ? value.slice(0, -1) : (value as string)
}

export async function listOllamaModels(
  baseUrl?: string
): Promise<OllamaModelInfo[]> {
  const targetBaseUrl = normalizeBaseUrl(baseUrl)
  const response = await fetch(`${targetBaseUrl}/api/tags`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(LIST_TIMEOUT_MS),
  })

  if (!response.ok) {
    const payload = await safeReadBody(response)
    throw new Error(
      `Ollama antwortet mit Status ${response.status}: ${
        payload || response.statusText
      }`
    )
  }

  const data = (await response.json()) as { models?: OllamaModelInfo[] }
  return data.models ?? []
}

export async function testOllamaConnection(
  baseUrl?: string
): Promise<OllamaConnectionResult> {
  const models = await listOllamaModels(baseUrl)
  const supportedModelsList = await SUPPORTED_OLLAMA_MODELS
  const supportedModels = models
    .filter((model) =>
      supportedModelsList.some((supported: OllamaModelInfo) =>
        model.name.toLowerCase().includes(supported.name)
      )
    )
    .map((model) => model.name)

  return {
    baseUrl: normalizeBaseUrl(baseUrl),
    models,
    supportedModels,
  }
}

export async function generateWithOllama(input: {
  prompt: string
  model?: string
  baseUrl?: string
  timeoutMs?: number
}): Promise<OllamaGenerateResult> {
  const { prompt, model, baseUrl, timeoutMs } = input
  const trimmedPrompt = prompt.trim()
  if (!trimmedPrompt) {
    throw new Error('Ein Prompt für die LLM-Anfrage fehlt.')
  }

  const targetBaseUrl = normalizeBaseUrl(baseUrl)
  const supportedModels = await SUPPORTED_OLLAMA_MODELS
  const targetModel = model?.trim() || supportedModels[0]?.name
  const started = Date.now()

  const response = await fetch(`${targetBaseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({
      model: targetModel,
      prompt: trimmedPrompt,
      stream: false,
    }),
    signal: AbortSignal.timeout(
      Number.isFinite(timeoutMs) && timeoutMs !== undefined
        ? Number(timeoutMs)
        : GENERATE_TIMEOUT_MS
    ),
  })

  if (!response.ok) {
    const payload = await safeReadBody(response)
    throw new Error(
      `Ollama Anfrage fehlgeschlagen (Status ${response.status}): ${
        payload || response.statusText
      }`
    )
  }

  const data = (await response.json()) as {
    response?: string
    model?: string
  }

  if (!data.response) {
    throw new Error('Ollama hat keine Antwort zurückgegeben.')
  }

  return {
    response: data.response,
    model: data.model || targetModel,
    baseUrl: targetBaseUrl,
    durationMs: Date.now() - started,
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
