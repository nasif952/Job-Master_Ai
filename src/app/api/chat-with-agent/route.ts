import { NextRequest, NextResponse } from 'next/server'
import { openai, DEFAULT_MODEL } from '@/lib/openai'
import { createClient } from '@supabase/supabase-js'

const AGENT_PROMPTS = {
  cv_optimization: `You are a professional CV optimization expert. Help users tailor their CV/resume for specific job positions. Provide specific, actionable advice on:
- ATS optimization and keyword matching
- Skills highlighting and positioning
- Experience formatting and presentation
- Achievement quantification
- Industry-specific customization
Always reference the specific job requirements and provide concrete examples.`,

  email_drafting: `You are a professional email writing assistant specializing in job applications. Help users craft compelling, professional emails including:
- Application cover letters
- Follow-up emails
- Thank you notes after interviews
- Salary negotiation emails
- Networking emails
Focus on personalization, professional tone, and clear value proposition. Always customize for the specific job and company.`,

  interview_prep: `You are an experienced interview coach. Help users prepare for job interviews by:
- Generating relevant technical and behavioral questions
- Providing sample answers and frameworks (STAR method)
- Company research and culture insights
- Common interview pitfalls and how to avoid them
- Confidence building and presentation tips
Tailor all advice to the specific role and company.`,

  job_analysis: `You are a career advisor and job market analyst. Provide comprehensive job analysis including:
- Key requirements and must-have skills
- Market competitiveness and salary insights
- Company culture and growth opportunities
- Career progression potential
- Red flags or concerns to consider
- Application strategy and timing
Always provide actionable insights specific to the user's career goals.`
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Chat API called')
    const { message, sessionId, agentType, jobData } = await request.json()
    console.log('📨 Request data:', { 
      message: message?.substring(0, 50), 
      sessionId, 
      agentType, 
      jobId: jobData?.id,
      fullJobData: jobData 
    })
    
    if (!message || !sessionId || !agentType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get the authorization token from headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Create authenticated Supabase client for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        },
        global: {
          headers: { Authorization: `Bearer ${token}` }
        }
      }
    )
    
    // Verify the token is valid by getting user info
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (!user || authError) {
      console.error('❌ Authentication failed:', {
        error: authError,
        hasToken: !!token,
        tokenLength: token?.length
      })
      return NextResponse.json({ 
        error: 'Authentication required',
        details: authError?.message || 'No user found'
      }, { status: 401 })
    }

    console.log('✅ User authenticated:', { userId: user.id, email: user.email })

    // Additional security: Verify user owns the job
    if (jobData.id) {
      console.log('🔍 Checking job ownership:', { jobId: jobData.id, userId: user.id })
      
      // First, let's check if the job exists at all (without user filter)
      const { data: jobExists, error: jobExistsError } = await supabase
        .from('jobs')
        .select('id, user_id')
        .eq('id', jobData.id)
        .maybeSingle()

      console.log('🔎 Job existence check:', { jobExists, jobExistsError })
      
      const { data: jobOwnership, error: jobError } = await supabase
        .from('jobs')
        .select('user_id')
        .eq('id', jobData.id)
        .maybeSingle()

      console.log('📊 Job ownership result:', { jobOwnership, jobError })

      if (jobError) {
        console.error('❌ Database error checking job ownership:', jobError)
        return NextResponse.json({ error: 'Database error', details: jobError.message }, { status: 500 })
      }

      if (!jobOwnership) {
        console.error('❌ Job not found:', { 
          jobId: jobData.id,
          userId: user.id
        })
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      }

      if (jobOwnership.user_id !== user.id) {
        console.error('❌ Job ownership validation failed:', { 
          jobOwnership, 
          expectedUserId: user.id,
          actualUserId: jobOwnership.user_id 
        })
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      console.log('✅ Job ownership verified')
    }

    // Get conversation history for context
    const { data: messageHistory } = await supabase
      .from('messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(20) // Last 20 messages for context

    // Get user's CV data for personalized advice (get the most recent primary CV)
    const { data: userCV, error: cvError } = await supabase
      .from('cvs')
      .select('skills, experience, education, ai_analysis, extracted_text, is_primary, is_active')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    console.log('📄 CV retrieval result:', { 
      userCV: userCV ? 'Found' : 'Not found',
      cvError,
      userId: user.id,
      cvData: userCV ? {
        hasSkills: !!userCV.skills?.length,
        hasExperience: !!userCV.experience?.length,
        hasEducation: !!userCV.education?.length,
        hasAiAnalysis: !!userCV.ai_analysis,
        skillsCount: userCV.skills?.length || 0,
        experienceCount: userCV.experience?.length || 0,
        educationCount: userCV.education?.length || 0,
        aiAnalysisKeys: userCV.ai_analysis ? Object.keys(userCV.ai_analysis) : []
      } : null
    })

    // Debug: Check all CVs for this user
    const { data: allCVs, error: allCVsError } = await supabase
      .from('cvs')
      .select('id, name, is_primary, is_active, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    console.log('📋 All user CVs:', { 
      count: allCVs?.length || 0,
      cvs: allCVs,
      error: allCVsError
    })

    // Build context from job data, CV data, and message history
    const jobContext = `
Job Title: ${jobData.title}
Company: ${jobData.company}
Job Description: ${jobData.description?.substring(0, 1000) || 'Not provided'}
Requirements: ${jobData.requirements || 'Not specified'}
`

    const cvContext = userCV ? `
USER'S CV INFORMATION:
Skills: ${userCV.ai_analysis?.skills?.join(', ') || userCV.skills?.join(', ') || 'Not specified'}
Experience: ${userCV.ai_analysis?.experience?.map((exp: any) => `${exp.position} at ${exp.company}`).join(', ') || userCV.experience?.map((exp: any) => `${exp.position} at ${exp.company}`).join(', ') || 'Not specified'}
Education: ${userCV.ai_analysis?.education?.map((edu: any) => `${edu.degree} in ${edu.field} from ${edu.institution}`).join(', ') || userCV.education?.map((edu: any) => `${edu.degree} in ${edu.field} from ${edu.institution}`).join(', ') || 'Not specified'}
Professional Summary: ${userCV.ai_analysis?.summary || 'Not available'}
Key Strengths: ${userCV.ai_analysis?.strengths?.join(', ') || 'Not specified'}
Recommendations: ${userCV.ai_analysis?.recommendations?.join(', ') || 'Not specified'}
` : 'USER CV: Not uploaded - provide general advice.'

    console.log('📝 CV Context being sent to AI:', cvContext)
    console.log('🔍 Raw AI Analysis data:', userCV?.ai_analysis)

    const systemPrompt = `${AGENT_PROMPTS[agentType as keyof typeof AGENT_PROMPTS]}

CURRENT JOB CONTEXT:
${jobContext}

${cvContext}

CONVERSATION CONTEXT:
${messageHistory?.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n') || 'No previous conversation'}

Provide helpful, specific advice tailored to this job and conversation context.`

    // Generate AI response
    console.log('🤖 Calling OpenAI with model:', DEFAULT_MODEL)
    console.log('🔑 API Key present:', !!process.env.OPENAI_API_KEY)
    console.log('🔑 API Key prefix:', process.env.OPENAI_API_KEY?.substring(0, 20) + '...')
    
    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 800,
      temperature: 0.7
    })

    console.log('✅ OpenAI response received')
    
    const aiResponse = completion.choices[0]?.message?.content
    if (!aiResponse) {
      throw new Error('No response generated')
    }

    // Save user message to database
    await supabase.from('messages').insert({
      session_id: sessionId,
      user_id: user.id,
      job_id: jobData.id,
      role: 'user',
      content: message,
      agent_type: agentType
    })

    // Save AI response to database
    await supabase.from('messages').insert({
      session_id: sessionId,
      user_id: user.id,
      job_id: jobData.id,
      role: 'assistant',
      content: aiResponse,
      agent_type: agentType
    })

    return NextResponse.json({ content: aiResponse })

  } catch (error: any) {
    console.error('❌ Chat API error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return NextResponse.json(
      { 
        error: 'Failed to process chat message',
        details: error.message
      },
      { status: 500 }
    )
  }
} 