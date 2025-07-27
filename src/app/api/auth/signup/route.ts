import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { signUpSchema } from '@/lib/validations'
import { authRateLimit, sanitizeInput, securityHeaders } from '@/lib/security'
import { checkRateLimit, getClientIP } from '@/lib/security-server'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    // Apply security headers
    const headers = new Headers(securityHeaders)
    headers.set('Content-Type', 'application/json')

    // Get client IP for rate limiting
    const clientIP = getClientIP()
    
    // Check rate limit
    const rateLimitResult = await checkRateLimit(
      `signup:${clientIP}`,
      authRateLimit
    )
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many signup attempts. Please try again later.',
          retryAfter: rateLimitResult.resetTime
        },
        { 
          status: 429,
          headers 
        }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    
    // Sanitize inputs
    const sanitizedData = {
      name: sanitizeInput(body.name || ''),
      email: sanitizeInput(body.email || '').toLowerCase(),
      password: body.password || '',
      confirmPassword: body.confirmPassword || '',
    }

    // Validate with Zod schema
    const validationResult = signUpSchema.safeParse(sanitizedData)
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { 
          status: 400,
          headers 
        }
      )
    }

    const { name, email, password } = validationResult.data

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        name,
      },
      email_confirm: false, // Require email confirmation
    })

    if (authError) {
      console.error('Supabase auth error:', authError)
      
      // Handle specific error types
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists.' },
          { 
            status: 409,
            headers 
          }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { 
          status: 500,
          headers 
        }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account.' },
        { 
          status: 500,
          headers 
        }
      )
    }

    // User profile is automatically managed by Supabase Auth
    // The auth.users table contains all necessary user information

    // Send confirmation email
    const { error: emailError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
    })

    if (emailError) {
      console.error('Email confirmation error:', emailError)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully. Please check your email to confirm your account.',
      },
      { 
        status: 201,
        headers 
      }
    )

  } catch (error) {
    console.error('Signup API error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { 
        status: 500,
        headers: new Headers(securityHeaders)
      }
    )
  }
} 