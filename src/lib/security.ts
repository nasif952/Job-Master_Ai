// Client-side security utilities
// These utilities can be used in both client and server components

export interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
  blockDurationMs?: number
}

// Rate limiting configurations
export const authRateLimit: RateLimitConfig = {
  maxAttempts: 5,           // 5 attempts per window
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDurationMs: 30 * 60 * 1000, // Block for 30 minutes after limit
}

export const apiRateLimit: RateLimitConfig = {
  maxAttempts: 100,         // 100 requests per window
  windowMs: 15 * 60 * 1000, // 15 minutes
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

/**
 * Validate password strength beyond basic requirements
 */
export function validatePasswordStrength(password: string): {
  isStrong: boolean
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0
  
  // Length check
  if (password.length >= 8) score += 1
  else feedback.push('Use at least 8 characters')
  
  if (password.length >= 12) score += 1
  else feedback.push('Consider using 12+ characters for better security')
  
  // Character variety
  if (/[a-z]/.test(password)) score += 1
  else feedback.push('Include lowercase letters')
  
  if (/[A-Z]/.test(password)) score += 1
  else feedback.push('Include uppercase letters')
  
  if (/\d/.test(password)) score += 1
  else feedback.push('Include numbers')
  
  if (/[@$!%*?&]/.test(password)) score += 1
  else feedback.push('Include special characters (@$!%*?&)')
  
  // Common patterns to avoid
  if (!/(.)\1{2,}/.test(password)) score += 1
  else feedback.push('Avoid repeating characters')
  
  if (!/123|abc|qwe|password|admin/i.test(password)) score += 1
  else feedback.push('Avoid common patterns or words')
  
  const isStrong = score >= 6
  
  if (isStrong) {
    feedback.length = 0 // Clear feedback if strong
    feedback.push('Strong password!')
  }
  
  return { isStrong, score, feedback }
}

/**
 * Security headers for API responses
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
} as const 