/**
 * Utility functions for cleaning and processing CV text content
 * Handles LaTeX formatting and problematic characters
 */

export function cleanCVText(text: string): string {
  return text
    // Remove null characters and control characters
    .replace(/\u0000/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    
    // Clean up PDF artifacts and encoding issues
    .replace(/\\[0-9]{3}/g, '') // Remove octal escapes
    .replace(/\\x[0-9a-fA-F]{2}/g, '') // Remove hex escapes
    .replace(/\\u[0-9a-fA-F]{4}/g, '') // Remove unicode escapes
    
    // Clean up LaTeX commands (basic cleaning)
    .replace(/\\[a-zA-Z]+(\{[^}]*\})?/g, '') // Remove LaTeX commands like \textbf{}, \section{}, etc.
    .replace(/\$\$[^$]*\$\$/g, '') // Remove display math
    .replace(/\$[^$]*\$/g, '') // Remove inline math
    
    // Clean up special characters
    .replace(/[{}]/g, '') // Remove LaTeX braces
    .replace(/\\/g, '') // Remove remaining backslashes
    
    // Clean up PDF-specific artifacts
    .replace(/BT\s+ET/g, '') // Remove PDF text operators
    .replace(/Tj\s*\([^)]*\)/g, '') // Remove PDF text objects
    .replace(/TJ\s*\[[^\]]*\]/g, '') // Remove PDF text arrays
    .replace(/[0-9]+\s+[0-9]+\s+obj/g, '') // Remove PDF object references
    .replace(/endobj/g, '') // Remove PDF object endings
    
    // Clean up encoding artifacts
    .replace(/[^\x20-\x7E\n]/g, ' ') // Keep only printable ASCII and newlines
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\n\s*\n/g, '\n') // Remove empty lines
    .trim()
}

export function extractReadableText(text: string): string {
  const cleaned = cleanCVText(text)
  
  // Remove lines that are mostly LaTeX commands or formatting
  const lines = cleaned.split('\n')
  const readableLines = lines.filter(line => {
    const trimmed = line.trim()
    if (!trimmed) return false
    
    // Skip lines that are mostly special characters or commands
    const specialCharRatio = (trimmed.match(/[^a-zA-Z0-9\s.,!?;:()\-]/g) || []).length / trimmed.length
    return specialCharRatio < 0.5 // Keep lines with less than 50% special characters
  })
  
  return readableLines.join('\n').trim()
}

export function truncateText(text: string, maxLength: number = 10000): string {
  if (text.length <= maxLength) return text
  
  // Try to truncate at a sentence boundary
  const truncated = text.substring(0, maxLength)
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?'),
    truncated.lastIndexOf('\n')
  )
  
  if (lastSentenceEnd > maxLength * 0.8) {
    return truncated.substring(0, lastSentenceEnd + 1)
  }
  
  return truncated
} 