import { randomUUID } from 'node:crypto'
import { parseDocument } from './parsers'
import { chunkTokens } from './chunking'
import { tokenizeText } from './tokenizer'
import type {
  AnalysisStep,
  AnalysisStepStatus,
  DocumentAnalysisResponse,
} from '../../types/analysis'
import { LangChainRedisHarness } from '../langchain/redisHarness'
import { saveDocumentRecord } from './documentRepository'

export interface AnalyzeDocumentInput {
  buffer: Buffer
  fileName: string
  mimeType: string
}

const redisHarness = new LangChainRedisHarness()

const STEP_TITLES: Record<AnalysisStep['id'], string> = {
  upload: 'Upload',
  parse: 'Analyse des Dokuments',
  tokenize: 'Tokenisierung',
  chunk: 'Chunking',
  embed: 'LangChain + Redis Embeddings',
}

export async function analyzeDocument(
  input: AnalyzeDocumentInput
): Promise<DocumentAnalysisResponse> {
  const { buffer, fileName, mimeType } = input
  const documentId = randomUUID()
  const createdAt = new Date().toISOString()

  const steps = initSteps()

  markStep(steps, 'parse', 'in_progress')
  const parseTimer = startTimer()
  const parseResult = await parseDocument(buffer, mimeType)
  markStep(steps, 'parse', 'completed', parseTimer(), {
    numPages: parseResult.meta.numPages ?? null,
    detectedMimeType: parseResult.meta.detectedMimeType,
    fileSize: parseResult.meta.fileSize,
  })

  markStep(steps, 'tokenize', 'in_progress')
  const tokenizeTimer = startTimer()
  const tokens = tokenizeText(parseResult.text)
  markStep(steps, 'tokenize', 'completed', tokenizeTimer(), {
    tokens: tokens.length,
  })

  markStep(steps, 'chunk', 'in_progress')
  const chunkTimer = startTimer()
  const chunks = chunkTokens(tokens)
  markStep(steps, 'chunk', 'completed', chunkTimer(), {
    chunkCount: chunks.length,
    avgChunkTokens:
      chunks.length > 0
        ? Math.round(
            chunks.reduce((acc, chunk) => acc + chunk.tokenCount, 0) /
              chunks.length
          )
        : 0,
  })

  markStep(steps, 'embed', 'in_progress')
  await redisHarness.resetDocument(documentId)
  const embedTimer = startTimer()
  const redisSummary = await redisHarness.indexChunks(
    documentId,
    chunks.map((chunk) => chunk.text)
  )
  const neighbors = await redisHarness.similaritySearch(
    documentId,
    chunks[0]?.text ?? 'Dokument'
  )
  markStep(steps, 'embed', 'completed', embedTimer(), {
    ...redisSummary,
  })

  const textPreview = parseResult.text

  const response: DocumentAnalysisResponse = {
    documentId,
    createdAt,
    fileName,
    mimeType,
    textPreview,
    totalTokens: tokens.length,
    chunkCount: chunks.length,
    chunks,
    steps,
    embeddingsSummary: redisSummary,
    redisInfo: {
      indexKey: redisHarness.getIndexKey(documentId),
      nearestNeighbors: neighbors,
    },
  }

  await saveDocumentRecord(response)

  return response
}

function initSteps(): AnalysisStep[] {
  return (Object.keys(STEP_TITLES) as AnalysisStep['id'][]).map(
    (stepId, index) => ({
      id: stepId,
      label: STEP_TITLES[stepId],
      status: index === 0 ? 'completed' : 'pending',
    })
  )
}

function markStep(
  steps: AnalysisStep[],
  id: AnalysisStep['id'],
  status: AnalysisStepStatus,
  durationMs?: number,
  meta?: Record<string, unknown>
) {
  const target = steps.find((step) => step.id === id)
  if (!target) return

  target.status = status
  if (durationMs !== undefined) {
    target.durationMs = durationMs
  }
  if (meta) {
    target.meta = meta
  }
}

function startTimer() {
  const start = Date.now()
  return () => Date.now() - start
}
