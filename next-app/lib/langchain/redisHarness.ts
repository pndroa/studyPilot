import type Redis from 'ioredis'
import type { Embeddings } from '@langchain/core/embeddings'
import { LocalEmbeddings } from './localEmbeddings'
import { getRedisClient } from '../redis/client'

interface StoredVector {
  text: string
  vector: number[]
}

export interface SimilarityResult {
  id: string
  text: string
  score: number
}

export interface IndexSummary {
  vectorCount: number
  dimensions: number
}

interface HarnessOptions {
  indexKey?: string
  redisClient?: Redis
  embeddings?: Embeddings
}

export const DEFAULT_REDIS_INDEX_KEY = 'analysis:vectors'

export class LangChainRedisHarness {
  private readonly redis: Redis
  private readonly embeddings: Embeddings
  private readonly indexKey: string

  constructor(options: HarnessOptions = {}) {
    this.indexKey = options.indexKey ?? DEFAULT_REDIS_INDEX_KEY
    this.redis = options.redisClient ?? getRedisClient()
    this.embeddings = options.embeddings ?? new LocalEmbeddings()
  }

  private getVectorKey(documentId: string) {
    return `${this.indexKey}:${documentId}`
  }

  async resetDocument(documentId: string) {
    await this.redis.del(this.getVectorKey(documentId))
  }

  getIndexKey(documentId?: string) {
    return documentId ? this.getVectorKey(documentId) : this.indexKey
  }

  /**
   * Returns cached vector stats without re-embedding the document.
   */
  async getCachedIndexSummary(documentId: string): Promise<IndexSummary> {
    const vectorKey = this.getVectorKey(documentId)
    const [vectorCount, firstEntry] = await Promise.all([
      this.redis.hlen(vectorKey),
      this.redis.hget(vectorKey, 'chunk:0'),
    ])

    if (!vectorCount || vectorCount <= 0) {
      return { vectorCount: 0, dimensions: 0 }
    }

    try {
      const parsed = firstEntry ? (JSON.parse(firstEntry) as StoredVector) : null
      return {
        vectorCount,
        dimensions: parsed?.vector.length ?? 0,
      }
    } catch (error) {
      console.warn('Konnte Cached Embeddings nicht lesen', error)
      return { vectorCount, dimensions: 0 }
    }
  }

  /**
   * Ensures embeddings for a document are present. If missing, chunks get indexed.
   */
  async ensureDocumentIndexed(
    documentId: string,
    chunks: string[]
  ): Promise<IndexSummary> {
    const cached = await this.getCachedIndexSummary(documentId)
    if (cached.vectorCount > 0) {
      return cached
    }
    return this.indexChunks(documentId, chunks)
  }

  async indexChunks(
    documentId: string,
    chunks: string[]
  ): Promise<IndexSummary> {
    if (chunks.length === 0) {
      return { vectorCount: 0, dimensions: 0 }
    }

    const vectors = (await this.embeddings.embedDocuments(
      chunks
    )) as number[][]
    const pipeline = this.redis.pipeline()
    const vectorKey = this.getVectorKey(documentId)

    vectors.forEach((vector, idx) => {
      const payload: StoredVector = { text: chunks[idx], vector }
      pipeline.hset(vectorKey, `chunk:${idx}`, JSON.stringify(payload))
    })

    await pipeline.exec()

    return {
      vectorCount: vectors.length,
      dimensions: vectors[0].length,
    }
  }

  async similaritySearch(
    documentId: string,
    query: string,
    limit = 3
  ): Promise<SimilarityResult[]> {
    const [entries, queryVector] = await Promise.all([
      this.redis.hgetall(
        this.getVectorKey(documentId)
      ) as Promise<Record<string, string>>,
      this.embeddings.embedQuery(query),
    ])

    const results: SimilarityResult[] = Object.entries(entries).map(
      ([id, value]) => {
        const parsed = JSON.parse(value) as StoredVector
        return {
          id,
          text: parsed.text,
          score: cosineSimilarity(queryVector, parsed.vector),
        }
      }
    )

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .filter((item) => Number.isFinite(item.score))
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length)
  let dot = 0
  let magA = 0
  let magB = 0

  for (let i = 0; i < length; i += 1) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }

  if (magA === 0 || magB === 0) {
    return 0
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}
