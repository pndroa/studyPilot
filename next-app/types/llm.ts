export const LLM_PROVIDERS = ['ollama', 'openai', 'gemini'] as const

export type LlmProvider = (typeof LLM_PROVIDERS)[number]

export interface LlmSummaryRequest {
  provider: LlmProvider
  text: string
  topic?: string
  model?: string
  baseUrl?: string
  apiKey?: string
}

export interface LlmSummaryResponse {
  summary: string
  provider: LlmProvider
  model: string
  usedEndpoint?: string
}

export interface LlmQuizRequest {
  provider: LlmProvider
  topic: string
  text?: string
  questionCount?: number
  model?: string
  baseUrl?: string
  apiKey?: string
}

export interface LlmQuizQuestion {
  question: string
  options: string[]
  answerIndex: number
  explanation?: string
}

export interface LlmQuizResponse {
  questions: LlmQuizQuestion[]
  provider: LlmProvider
  model: string
  usedEndpoint?: string
}

export interface LlmChatRequest {
  provider: LlmProvider
  message: string
  context?: string
  documentId?: string
  model?: string
  baseUrl?: string
  apiKey?: string
}

export interface LlmChatResponse {
  reply: string
  provider: LlmProvider
  model: string
  usedEndpoint?: string
}

export interface LlmFlashcardRequest {
  provider: LlmProvider
  text: string
  topic?: string
  cardCount?: number
  model?: string
  baseUrl?: string
  apiKey?: string
}

export interface LlmFlashcardItem {
  question: string
  answer: string
}

export interface LlmFlashcardResponse {
  cards: LlmFlashcardItem[]
  provider: LlmProvider
  model: string
  usedEndpoint?: string
}

export interface LlmConfig {
  provider: LlmProvider
  model?: string
  baseUrl?: string
  openaiApiKey?: string
  geminiApiKey?: string
}
