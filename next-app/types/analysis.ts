import type { TextChunk } from '../lib/document/chunking'
import type { LlmProvider } from './llm'

export type AnalysisStepStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'

export interface AnalysisStep {
  id: 'upload' | 'parse' | 'tokenize' | 'chunk' | 'embed'
  label: string
  status: AnalysisStepStatus
  durationMs?: number
  meta?: Record<string, unknown>
}

export interface EmbeddingSummary {
  vectorCount: number
  dimensions: number
}

export interface DocumentSummary {
  documentId: string
  fileName: string
  mimeType: string
  createdAt: string
  totalTokens: number
  chunkCount: number
}

export interface DocumentSummaryResult {
  summary: string
  provider: LlmProvider
  model: string
  usedEndpoint?: string
  generatedAt: string
}

export interface DocumentAnalysisResponse {
  documentId: string
  createdAt: string
  fileName: string
  mimeType: string
  textPreview: string
  totalTokens: number
  chunkCount: number
  chunks: TextChunk[]
  steps: AnalysisStep[]
  embeddingsSummary: EmbeddingSummary
  redisInfo: {
    indexKey: string
    nearestNeighbors: Array<{
      id: string
      text: string
      score: number
    }>
  }
  summary?: DocumentSummaryResult
}
