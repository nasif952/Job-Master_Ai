/**
 * PDF Text Extraction Utility
 * Handles various PDF formats including LaTeX-generated PDFs
 * Uses pure JavaScript methods without external dependencies
 */

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Method 1: Try to extract text from buffer patterns
    const extractedText = extractTextFromBuffer(buffer)
    if (extractedText.trim().length > 0) {
      console.log('✅ Text extracted using buffer patterns')
      return extractedText
    }
    
    // Method 2: Try different encoding methods
    const encodedText = tryDifferentEncodings(buffer)
    if (encodedText.trim().length > 0) {
      console.log('✅ Text extracted using encoding methods')
      return encodedText
    }
    
    // Method 3: Try to find text in PDF structure
    const structuredText = extractFromPDFStructure(buffer)
    if (structuredText.trim().length > 0) {
      console.log('✅ Text extracted from PDF structure')
      return structuredText
    }
    
    throw new Error('Could not extract text from PDF using any method')
    
  } catch (error) {
    console.error('❌ PDF extraction failed:', error)
    throw error
  }
}

function extractTextFromBuffer(buffer: Buffer): string {
  // Try to extract text by looking for readable patterns in the buffer
  const bufferString = buffer.toString('utf8', 0, Math.min(buffer.length, 50000))
  
  // Look for common CV patterns and extract readable text
  const textPatterns = [
    /[A-Za-z\s]{10,}/g,  // Words and spaces
    /[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g,  // Proper nouns (names, companies)
    /[A-Za-z]+(?:\s+[A-Za-z]+)*\s*[0-9]{4}/g,  // Text with years
    /[A-Za-z]+(?:\s+[A-Za-z]+)*\s*[A-Z]{2,}/g,  // Text with abbreviations
    /[A-Za-z]+(?:\s+[A-Za-z]+)*\s*[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4}/g,  // Dates
  ]
  
  let extractedTextParts: string[] = []
  textPatterns.forEach(pattern => {
    const matches = bufferString.match(pattern)
    if (matches) {
      extractedTextParts.push(...matches.filter(match => match.length > 3))
    }
  })
  
  // Also try to extract from the end of the buffer (sometimes text is there)
  const endBufferString = buffer.toString('utf8', Math.max(0, buffer.length - 20000))
  textPatterns.forEach(pattern => {
    const matches = endBufferString.match(pattern)
    if (matches) {
      extractedTextParts.push(...matches.filter(match => match.length > 3))
    }
  })
  
  // Remove duplicates and join
  const uniqueParts = [...new Set(extractedTextParts)]
  return uniqueParts.join(' ')
}

function tryDifferentEncodings(buffer: Buffer): string {
  const encodings = ['utf8', 'latin1', 'ascii', 'utf16le']
  
  for (const encoding of encodings) {
    try {
      const text = buffer.toString(encoding)
      // Look for readable content
      const readablePattern = /[A-Za-z\s]{20,}/g
      const matches = text.match(readablePattern)
      
      if (matches && matches.length > 0) {
        return matches.join(' ')
      }
    } catch (error) {
      continue
    }
  }
  
  return ''
}

function extractFromPDFStructure(buffer: Buffer): string {
  try {
    // Convert buffer to string to look for PDF text objects
    const bufferString = buffer.toString('utf8', 0, Math.min(buffer.length, 100000))
    
    // Look for PDF text objects (Tj, TJ operators)
    const textMatches = bufferString.match(/\(([^)]+)\)/g)
    if (textMatches) {
      const extractedTexts = textMatches
        .map(match => match.replace(/[()]/g, '')) // Remove parentheses
        .filter(text => text.length > 2) // Filter out very short strings
        .filter(text => /[A-Za-z]/.test(text)) // Must contain letters
      
      if (extractedTexts.length > 0) {
        return extractedTexts.join(' ')
      }
    }
    
    // Look for text streams
    const streamMatches = bufferString.match(/stream\s*([\s\S]*?)\s*endstream/g)
    if (streamMatches) {
      for (const stream of streamMatches) {
        const streamContent = stream.replace(/stream\s*/, '').replace(/\s*endstream/, '')
        const textInStream = streamContent.match(/[A-Za-z\s]{10,}/g)
        if (textInStream && textInStream.length > 0) {
          return textInStream.join(' ')
        }
      }
    }
    
    // Look for text in object definitions
    const objectMatches = bufferString.match(/\d+\s+\d+\s+obj\s*([\s\S]*?)\s*endobj/g)
    if (objectMatches) {
      for (const obj of objectMatches) {
        const objContent = obj.replace(/\d+\s+\d+\s+obj\s*/, '').replace(/\s*endobj/, '')
        const textInObj = objContent.match(/[A-Za-z\s]{10,}/g)
        if (textInObj && textInObj.length > 0) {
          return textInObj.join(' ')
        }
      }
    }
    
    return ''
  } catch (error) {
    console.error('Error extracting from PDF structure:', error)
    return ''
  }
} 