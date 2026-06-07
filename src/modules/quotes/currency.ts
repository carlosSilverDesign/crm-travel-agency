import { redis } from '@/lib/upstash/redis'

const FALLBACK_RATES: Record<string, number> = {
  'USD_EUR': 0.92,
  'EUR_USD': 1.09,
  'USD_USD': 1.0,
  'EUR_EUR': 1.0,
  'USD_MXN': 17.5,
  'MXN_USD': 0.057,
}

/**
 * Convierte un monto de una moneda a otra con caching en Upstash Redis
 */
export async function convertCurrency(amount: number, from: string, to: string): Promise<number> {
  const fromUpper = from.toUpperCase()
  const toUpper = to.toUpperCase()

  if (fromUpper === toUpper) return amount

  const cacheKey = `rate:${fromUpper}:${toUpper}`
  let rate: number | null = null

  // 1. Intentar leer de la caché de Redis
  if (redis) {
    try {
      const cached = await redis.get<string | number>(cacheKey)
      if (cached) {
        rate = typeof cached === 'string' ? parseFloat(cached) : cached
      }
    } catch (e) {
      console.error('Error al leer de Upstash Redis:', e)
    }
  }

  // 2. Si no hay en caché, intentar obtener de ExchangeRate-API
  if (!rate) {
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${fromUpper}`)
      if (res.ok) {
        const data = await res.json()
        if (data?.rates?.[toUpper]) {
          rate = data.rates[toUpper]

          // Guardar en caché por 24 horas (86400 segundos)
          if (redis && rate) {
            await redis.set(cacheKey, rate, { ex: 86400 })
          }
        }
      }
    } catch (e) {
      console.warn('Error al conectar con ExchangeRate-API, usando fallback:', e)
    }
  }

  // 3. Fallback estático de seguridad si todo lo demás falla
  if (!rate) {
    const fallbackKey = `${fromUpper}_${toUpper}`
    rate = FALLBACK_RATES[fallbackKey] || 1.0
  }

  return amount * rate
}
