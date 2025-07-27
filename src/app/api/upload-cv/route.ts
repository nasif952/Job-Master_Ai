import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { openai, DEFAULT_MODEL } from '@/lib/openai'
import { cleanCVText, extractReadableText, truncateText } from '@/lib/cv-text-cleaner'
import { extractTextFromPDF } from '@/lib/pdf-extractor'

export async function POST(request: NextRequest) {
  try {
    console.log('📄 CV Upload API called')

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

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const jobId = formData.get('jobId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }

    console.log('📁 File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      jobId
    })

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload PDF, DOC, DOCX, or TXT files only.' 
      }, { status: 400 })
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Please upload files smaller than 5MB.' 
      }, { status: 400 })
    }

    // Extract text from file
    let extractedText = ''
    
    if (file.type === 'text/plain') {
      extractedText = await file.text()
    } else if (file.type === 'application/pdf') {
      // For PDF files, use the dedicated PDF extractor
      try {
        extractedText = await extractTextFromPDF(file)
        console.log('📄 PDF text extracted successfully:', {
          textLength: extractedText.length
        })
      } catch (pdfError) {
        console.error('❌ PDF extraction failed:', pdfError)
        extractedText = 'PDF text extraction failed. Please ensure the PDF contains selectable text.'
      }
    } else {
      // For DOC/DOCX files, simplified text extraction
      extractedText = await file.text() // Simplified for now
    }

    // Clean and process the extracted text for LaTeX content
    console.log('📝 Raw extracted text (first 500 chars):', extractedText.substring(0, 500))
    
    const cleanedText = cleanCVText(extractedText)
    console.log('🧹 After cleaning (first 500 chars):', cleanedText.substring(0, 500))
    
    const readableText = extractReadableText(cleanedText)
    console.log('📖 Readable text (first 500 chars):', readableText.substring(0, 500))
    
    const finalText = truncateText(readableText, 10000) // Limit to 10KB for database

    console.log('📝 Text extracted:', extractedText.length, 'characters')
    console.log('🧹 Cleaned text:', finalText.length, 'characters')

    // Generate unique filename with user folder structure for RLS
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${user.id}/cv_${timestamp}.${fileExtension}`

    // Convert file to buffer for storage
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cvs')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('❌ File upload error:', uploadError)
      return NextResponse.json({ 
        error: 'Failed to upload file',
        details: uploadError.message 
      }, { status: 500 })
    }

    console.log('✅ File uploaded:', uploadData.path)

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('cvs')
      .getPublicUrl(fileName)

    // Analyze CV with AI
    console.log('🤖 Analyzing CV with AI...')
    
    const analysisPrompt = `Analyze this CV/resume and extract key information. The content has been extracted from a PDF and cleaned to remove formatting artifacts.

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
- The text has been cleaned to remove PDF artifacts and encoding issues
- Look for any readable text fragments that might indicate skills, experience, or education
- Focus on technical terms, programming languages, frameworks, tools, company names, university names
- If you find any patterns that look like dates, names, or technical skills, include them
- If the content is very limited, provide general recommendations for CV improvement
- Always return valid JSON even if extraction is limited
- Look for patterns like "Python", "JavaScript", "React", "Node.js", "AWS", "Docker", etc.
- If you see any readable text, try to extract meaningful information from it`

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
        name: file.name,
        filename: fileName,
        file_url: publicUrl,
        mime_type: file.type,
        file_size: file.size,
        extracted_text: finalText, // Use cleaned and processed text
        ai_analysis: aiAnalysis,
        skills: (aiAnalysis as any).skills || [],
        experience: (aiAnalysis as any).experience || [],
        education: (aiAnalysis as any).education || [],
        is_primary: true, // Set as primary CV for now
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
    console.error('❌ CV Upload API error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return NextResponse.json(
      { 
        error: 'Failed to process CV upload',
        details: error.message
      },
      { status: 500 }
    )
  }
} 