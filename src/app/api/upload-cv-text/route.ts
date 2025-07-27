import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { openai, DEFAULT_MODEL } from '@/lib/openai'
import { cleanCVText, extractReadableText, truncateText } from '@/lib/cv-text-cleaner'

export async function POST(request: NextRequest) {
  try {
    console.log('📝 CV Text Upload API called')

    // Get the authorization token from headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Create authenticated Supabase client
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
    
    // Verify the token is valid
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (!user || authError) {
      console.error('❌ Authentication failed:', authError)
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    console.log('✅ User authenticated:', { userId: user.id, email: user.email })

    // Parse JSON body
    const body = await request.json()
    const { cvText, jobId } = body

    if (!cvText || typeof cvText !== 'string') {
      return NextResponse.json({ error: 'CV text is required' }, { status: 400 })
    }

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }

    console.log('📝 CV text details:', {
      textLength: cvText.length,
      jobId
    })

    // Validate text length (50KB limit)
    const maxLength = 50 * 1024 // 50KB
    if (cvText.length > maxLength) {
      return NextResponse.json({ 
        error: 'CV text too long. Please keep it under 50KB.' 
      }, { status: 400 })
    }

    // Clean and process the CV text
    console.log('📝 Raw CV text (first 500 chars):', cvText.substring(0, 500))
    
    const cleanedText = cleanCVText(cvText)
    console.log('🧹 After cleaning (first 500 chars):', cleanedText.substring(0, 500))
    
    const readableText = extractReadableText(cleanedText)
    console.log('📖 Readable text (first 500 chars):', readableText.substring(0, 500))
    
    const finalText = truncateText(readableText, 10000) // Limit to 10KB for database

    console.log('📝 Text processed:', cvText.length, 'characters')
    console.log('🧹 Final text:', finalText.length, 'characters')

    // Generate unique filename with user folder structure for RLS
    const timestamp = Date.now()
    const fileName = `${user.id}/cv_${timestamp}.txt`

    // Convert text to buffer for storage
    const fileBuffer = Buffer.from(finalText, 'utf-8')

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cvs')
      .upload(fileName, fileBuffer, {
        contentType: 'text/plain',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ File upload error:', uploadError)
      return NextResponse.json({ 
        error: 'Failed to upload CV text',
        details: uploadError.message 
      }, { status: 500 })
    }

    console.log('✅ CV text uploaded:', uploadData.path)

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('cvs')
      .getPublicUrl(fileName)

    // Analyze CV with AI
    console.log('🤖 Analyzing CV with AI...')
    
    const analysisPrompt = `Analyze this CV/resume and extract key information. The content has been provided as text.

CV Content:
${finalText.substring(0, 4000)} // Limit to avoid token limits

Please provide a JSON response with the following structure:
{
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "company": "Company Name",
      "position": "Job Title",
      "duration": "Start - End",
      "description": "Brief description"
    }
  ],
  "education": [
    {
      "institution": "School/University",
      "degree": "Degree Type",
      "field": "Field of Study",
      "year": "Graduation Year"
    }
  ],
  "summary": "Brief professional summary",
  "strengths": ["strength1", "strength2", ...],
  "recommendations": ["improvement1", "improvement2", ...]
}

Important: 
- Extract skills, experience, and education from the provided text
- Focus on technical terms, programming languages, frameworks, tools, company names, university names
- If you find any patterns that look like dates, names, or technical skills, include them
- If the content is very limited, provide general recommendations for CV improvement
- Always return valid JSON even if extraction is limited
- Look for patterns like "Python", "JavaScript", "React", "Node.js", "AWS", "Docker", etc.`

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a professional CV analyzer. Extract and analyze CV information, providing structured data and recommendations.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    })

    const aiAnalysisText = completion.choices[0]?.message?.content
    let aiAnalysis = {}
    
    try {
      aiAnalysis = JSON.parse(aiAnalysisText || '{}')
    } catch (parseError) {
      console.error('❌ Failed to parse AI analysis:', parseError)
      aiAnalysis = { error: 'Failed to parse CV analysis' }
    }

    console.log('✅ AI analysis completed')

    // First, set all existing CVs as non-primary
    await supabase
      .from('cvs')
      .update({ is_primary: false })
      .eq('user_id', user.id)
      .eq('is_primary', true)

    // Save CV data to database
    const { data: cvData, error: dbError } = await supabase
      .from('cvs')
      .insert({
        user_id: user.id,
        name: 'CV from Text Input',
        filename: fileName,
        file_url: publicUrl,
        mime_type: 'text/plain',
        file_size: fileBuffer.length,
        extracted_text: finalText,
        ai_analysis: aiAnalysis,
        skills: (aiAnalysis as any).skills || [],
        experience: (aiAnalysis as any).experience || [],
        education: (aiAnalysis as any).education || [],
        is_primary: true,
        is_active: true
      })
      .select()
      .single()

    if (dbError) {
      console.error('❌ Database error:', dbError)
      return NextResponse.json({ 
        error: 'Failed to save CV data',
        details: dbError.message 
      }, { status: 500 })
    }

    console.log('✅ CV saved to database:', cvData.id)

    return NextResponse.json({
      success: true,
      cv: {
        id: cvData.id,
        name: cvData.name,
        fileUrl: cvData.file_url,
        analysis: aiAnalysis,
        uploadedAt: cvData.created_at
      }
    })

  } catch (error: any) {
    console.error('❌ CV Text Upload API error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return NextResponse.json(
      { 
        error: 'Failed to process CV text upload',
        details: error.message
      },
      { status: 500 }
    )
  }
} 