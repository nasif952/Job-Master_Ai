import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export { openai }

// Default model configuration
export const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

// Token limits for different models
export const TOKEN_LIMITS = {
  'gpt-4o-mini': 128_000,
  'gpt-4o': 128_000,
  'gpt-4-turbo': 128_000,
  'gpt-3.5-turbo': 16_385,
} as const

// Utility function to count tokens (approximate)
export function estimateTokens(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4)
}

// Utility function to truncate text to fit token limit
export function truncateToTokenLimit(
  text: string, 
  maxTokens: number = 4000
): string {
  const estimatedTokens = estimateTokens(text)
  if (estimatedTokens <= maxTokens) {
    return text
  }
  
  const maxChars = maxTokens * 4
  return text.substring(0, maxChars - 100) + '...[truncated]'
}

// System prompts for different AI features
export const SYSTEM_PROMPTS = {
  JOB_ANALYSIS: `You are an expert career coach and job market analyst. Analyze job postings and provide detailed insights about requirements, skills match, company culture, and application strategies. Be specific and actionable in your advice.`,
  
  CV_ANALYSIS: `You are a professional resume expert. Analyze CVs/resumes and provide constructive feedback on structure, content, keywords, and ATS optimization. Suggest specific improvements and highlight strengths.`,
  
  INTERVIEW_PREP: `You are an experienced interview coach. Help candidates prepare for interviews by providing relevant questions, answer frameworks, and specific advice based on the job and company. Focus on both technical and behavioral aspects.`,
  
  CAREER_COACHING: `You are a senior career counselor with expertise in career development, skill assessment, and professional growth. Provide personalized guidance on career paths, skill development, and professional advancement strategies.`,
  
  EMAIL_GENERATION: `You are a professional communication expert. Generate well-crafted, professional emails for job applications, follow-ups, networking, and other career-related communications. Ensure proper tone, structure, and persuasive content.`,
}

// Error handling for OpenAI API calls
export function handleOpenAIError(error: any): string {
  if (error?.error?.code === 'rate_limit_exceeded') {
    return 'Rate limit exceeded. Please try again in a moment.'
  }
  if (error?.error?.code === 'insufficient_quota') {
    return 'API quota exceeded. Please check your OpenAI account.'
  }
  if (error?.error?.code === 'model_not_found') {
    return 'AI model not available. Please try again later.'
  }
  return 'AI service temporarily unavailable. Please try again.'
} 