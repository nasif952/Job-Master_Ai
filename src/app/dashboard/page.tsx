'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { JobDashboardWithData } from '@/components/jobs/job-dashboard-with-data'
import { BrainCircuit, LogOut, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, loading, initialized, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (initialized && !user) {
      router.push('/auth/signin')
    }
  }, [initialized, user, router])

  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Loading dashboard...</p>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to sign-in
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
                  <BrainCircuit className="h-8 w-8 text-blue-600" />
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                   JobMaster AI
                  </span>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  Home
                </Button>
              </Link>
              <ThemeToggle />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, {user.user_metadata?.name || user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="bg-gray-50 dark:bg-gray-900">
        <JobDashboardWithData userEmail={user.email} />
      </main>
    </div>
  )
} 