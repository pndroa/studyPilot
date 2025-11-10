import { getRedisClient } from '../redis/client'
import type {
  DocumentAnalysisResponse,
  DocumentSummary,
} from '@/types/analysis'

const DOCUMENTS_KEY = 'analysis:documents'

const redis = getRedisClient()

export async function saveDocumentRecord(
  record: DocumentAnalysisResponse
): Promise<void> {
  await redis.hset(DOCUMENTS_KEY, record.documentId, JSON.stringify(record))
}

export async function listDocumentSummaries(): Promise<DocumentSummary[]> {
  const entries = await redis.hgetall(DOCUMENTS_KEY)
  return Object.values(entries)
    .map((value) => JSON.parse(value) as DocumentAnalysisResponse)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .map((doc) => ({
      documentId: doc.documentId,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      createdAt: doc.createdAt,
      totalTokens: doc.totalTokens,
      chunkCount: doc.chunkCount,
    }))
}

export async function getDocumentRecord(
  documentId: string
): Promise<DocumentAnalysisResponse | null> {
  const raw = await redis.hget(DOCUMENTS_KEY, documentId)
  return raw ? (JSON.parse(raw) as DocumentAnalysisResponse) : null
}

export async function deleteDocumentRecord(documentId: string): Promise<void> {
  await redis.hdel(DOCUMENTS_KEY, documentId)
}
