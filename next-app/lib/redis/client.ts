import Redis from 'ioredis'

let client: Redis | null = null

export function getRedisClient() {
  if (client) {
    return client
  }

  const redisUrl = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379'
  client = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: null,
  })

  client.on('error', (error) => {
    console.error('[Redis] connection error:', error)
  })

  return client
}
