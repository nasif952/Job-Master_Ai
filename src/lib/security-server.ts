// Server-side security utilities
// These utilities can ONLY be used in Server Components and API routes
import { headers } from 'next/headers'
import { RateLimitConfig } from './security'

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Check if a request should be rate limited
 * This function can only be used in Server Components or API routes
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ success: boolean; remaining: number; resetTime: number }> {
  const now = Date.now()
  const key = identifier
  
  // Get or create rate limit entry
  let entry = rateLimitStore.get(key)
  
  // Clean up expired entries
  if (entry && now > entry.resetTime) {
    rateLimitStore.delete(key)
    entry = undefined
  }
  
  // Create new entry if needed
  if (!entry) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    }
  }
  
  // Increment count
  entry.count++
  rateLimitStore.set(key, entry)
  
  // Check if limit exceeded
  const success = entry.count <= config.maxAttempts
  const remaining = Math.max(0, config.maxAttempts - entry.count)
  
  return {
    success,
    remaining,
    resetTime: entry.resetTime,
  }
}

/**
 * Get client IP address for rate limiting
 * This function can only be used in Server Components or API routes
 */
export function getClientIP(): string {
  const headersList = headers()
  
  // Check various IP headers in order of preference
  const ipHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'cf-connecting-ip', // Cloudflare
    'x-forwarded',
    'forwarded-for',
    'forwarded',
  ]
  
  for (const header of ipHeaders) {
    const ip = headersList.get(header)
    if (ip) {
      // Take first IP if comma-separated
      return ip.split(',')[0].trim()
    }
  }
  
  return 'unknown'
} 