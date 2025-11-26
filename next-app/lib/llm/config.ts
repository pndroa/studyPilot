import type { LlmConfig, LlmProvider } from '@/types/llm'

const STORAGE_KEY = 'llm:config'

const DEFAULTS: LlmConfig = {
  provider: 'ollama',
  model: '',
  baseUrl: 'http://127.0.0.1:11434',
  openaiApiKey: '',
  geminiApiKey: '',
}

export function loadLlmConfig(): LlmConfig {
  if (typeof window === 'undefined') return DEFAULTS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as LlmConfig
    return {
      provider: normalizeProvider(parsed.provider),
      model: parsed.model ?? '',
      baseUrl: parsed.baseUrl ?? DEFAULTS.baseUrl,
      openaiApiKey: parsed.openaiApiKey ?? '',
      geminiApiKey: parsed.geminiApiKey ?? '',
    }
  } catch {
    return DEFAULTS
  }
}

export function saveLlmConfig(config: Partial<LlmConfig>) {
  if (typeof window === 'undefined') return
  const current = loadLlmConfig()
  const next: LlmConfig = {
    provider: normalizeProvider(config.provider ?? current.provider),
    model: config.model ?? current.model ?? '',
    baseUrl: config.baseUrl ?? current.baseUrl ?? DEFAULTS.baseUrl,
    openaiApiKey: config.openaiApiKey ?? current.openaiApiKey ?? '',
    geminiApiKey: config.geminiApiKey ?? current.geminiApiKey ?? '',
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}

function normalizeProvider(provider?: LlmProvider | string): LlmProvider {
  if (provider === 'openai' || provider === 'gemini' || provider === 'ollama') {
    return provider
  }
  return 'ollama'
}
