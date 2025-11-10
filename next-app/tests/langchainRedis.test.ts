import test, { describe } from 'node:test'
import assert from 'node:assert/strict'
import type Redis from 'ioredis'
import { LangChainRedisHarness } from '../lib/langchain/redisHarness'
import { LocalEmbeddings } from '../lib/langchain/localEmbeddings'

class InMemoryRedis {
  private store = new Map<string, Map<string, string>>()

  pipeline() {
    const operations: Array<() => void> = []
    const api = {
      hset: (key: string, field: string, value: string) => {
        operations.push(() => {
          const bucket = this.store.get(key) ?? new Map<string, string>()
          bucket.set(field, value)
          this.store.set(key, bucket)
        })
        return api
      },
      exec: async () => {
        operations.forEach((op) => op())
        return []
      },
    }
    return api
  }

  async del(key: string) {
    this.store.delete(key)
    return 1
  }

  async hdel(key: string, field: string) {
    const bucket = this.store.get(key)
    if (!bucket) return 0
    const result = bucket.delete(field)
    return result ? 1 : 0
  }

  async hgetall(key: string) {
    const bucket = this.store.get(key)
    if (!bucket) {
      return {}
    }
    return Object.fromEntries(bucket.entries())
  }
}

describe('LangChain + Redis Harness', () => {
  test('indexes chunks and reports vector count', async () => {
    const harness = new LangChainRedisHarness({
      redisClient: new InMemoryRedis() as unknown as Redis,
      embeddings: new LocalEmbeddings(32),
    })
    const docId = 'doc-test'
    await harness.resetDocument(docId)
    const summary = await harness.indexChunks(docId, [
      'Hallo Welt',
      'Test Chunk',
    ])

    assert.equal(summary.vectorCount, 2)
    assert.equal(summary.dimensions, 32)
  })

  test('returns sorted similarity results', async () => {
    const harness = new LangChainRedisHarness({
      redisClient: new InMemoryRedis() as unknown as Redis,
      embeddings: new LocalEmbeddings(32),
    })
    const docId = 'doc-sim'
    await harness.resetDocument(docId)
    await harness.indexChunks(docId, [
      'Lineare Algebra Grundlagen',
      'Psychologie Lernstrategien',
      'Programmieren mit TypeScript',
    ])

    const results = await harness.similaritySearch(docId, 'Lernstrategien', 2)
    assert.equal(results.length, 2)
    assert.ok(results[0].score >= results[1].score)
  })
})
