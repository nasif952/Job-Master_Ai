import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { SignUpInput, SignInInput } from '@/lib/validations'

export function useAuth() {
  const router = useRouter()
  const { user, loading, initialized, setUser, setLoading, setInitialized, logout } = useAuthStore()

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        setLoading(true)
        
        // Check if Supabase is configured
        if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co') {
          console.warn('⚠️  Supabase not configured. Running in demo mode.')
          if (mounted) {
            setUser(null)
            setInitialized(true)
            setLoading(false)
          }
          return
        }
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth initialization error:', error)
        }

        if (mounted) {
          setUser(session?.user ?? null)
          setInitialized(true)
          setLoading(false)
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)
        if (mounted) {
          setUser(null)
          setInitialized(true)
          setLoading(false)
        }
      }
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('Auth state changed:', event, session?.user?.email)
        
        setUser(session?.user ?? null)
        setLoading(false)

        // Handle auth events
        if (event === 'SIGNED_IN') {
          router.push('/dashboard')
        } else if (event === 'SIGNED_OUT') {
          router.push('/auth/signin')
        }
      }
    )

    initializeAuth()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [setUser, setLoading, setInitialized, router])

  // Sign up function
  const signUp = async (data: SignUpInput) => {
    try {
      setLoading(true)
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
          },
        },
      })

      if (error) throw error

      // User profile is automatically managed by Supabase Auth
      // No need to create a separate users table entry

      return { success: true, data: authData }
    } catch (error: any) {
      console.error('Sign up error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to create account' 
      }
    } finally {
      setLoading(false)
    }
  }

  // Sign in function
  const signIn = async (data: SignInInput) => {
    try {
      setLoading(true)
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) throw error

      // Last login is automatically tracked by Supabase Auth
      // No need to manually update

      return { success: true, data: authData }
    } catch (error: any) {
      console.error('Sign in error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to sign in' 
      }
    } finally {
      setLoading(false)
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      logout()
      return { success: true }
    } catch (error: any) {
      console.error('Sign out error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to sign out' 
      }
    } finally {
      setLoading(false)
    }
  }

  // Reset password function
  const resetPassword = async (email: string) => {
    try {
      setLoading(true)
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('Reset password error:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to send reset email' 
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    initialized,
    signUp,
    signIn,
    signOut,
    resetPassword,
    isAuthenticated: !!user,
  }
} 