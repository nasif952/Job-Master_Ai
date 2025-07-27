import { NextRequest, NextResponse } from 'next/server'
import { openai, DEFAULT_MODEL } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { title, company, description, requirements, jobType, location } = await request.json()
    
    if (!title || !description) {
      return NextResponse.json({ error: 'Job title and description are required' }, { status: 400 })
    }
    
    const prompt = `Analyze this job posting and provide brief insights in JSON format:

Job Title: ${title}
Company: ${company || 'Not specified'}
Type: ${jobType || 'Not specified'}
Location: ${location || 'Not specified'}
Description: ${description.substring(0, 1000)}
Requirements: ${requirements || 'Not specified'}

Provide analysis in this exact JSON structure:
{
  "keySkills": ["skill1", "skill2", "skill3"],
  "experienceLevel": "Entry/Mid/Senior",
  "matchScore": 85,
  "pros": ["pro1", "pro2"],
  "concerns": ["concern1", "concern2"],
  "summary": "Brief 2-sentence summary"
}`

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a career advisor analyzing job postings. Provide concise, actionable insights in valid JSON format only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    })

    const analysisText = completion.choices[0]?.message?.content
    if (!analysisText) {
      throw new Error('No analysis generated')
    }

    // Parse JSON response
    const analysis = JSON.parse(analysisText)
    
    return NextResponse.json(analysis)
    
  } catch (error: any) {
    console.error('Job analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze job' },
      { status: 500 }
    )
  }
} 