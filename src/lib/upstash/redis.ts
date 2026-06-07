import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

const url = process.env.UPSTASH_REDIS_REST_URL || ''
const token = process.env.UPSTASH_REDIS_REST_TOKEN || ''

// We handle fallback gracefully if URL or token is missing for development
export const redis = url && token
  ? new Redis({ url, token })
  : null

export const ratelimit = redis
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(20, '10 s'),
      analytics: true,
      prefix: '@upstash/ratelimit',
    })
  : null
