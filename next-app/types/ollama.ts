export interface OllamaTestPayload {
  baseUrl?: string
}

export interface OllamaTestResponse {
  ok: boolean
  message: string
  baseUrl: string
  models: OllamaModel[]
  supportedModels: string[]
}

export interface OllamaModel {
  name: string
  size?: number
  digest?: string
  modified_at?: string
}

export interface OllamaGeneratePayload {
  prompt: string
  model?: string
  baseUrl?: string
}

export interface OllamaGenerateResponse {
  response: string
  model: string
  baseUrl: string
  durationMs: number
}
