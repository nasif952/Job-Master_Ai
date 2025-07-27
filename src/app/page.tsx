'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useAuth } from '@/hooks/useAuth'
import { 
  BrainCircuit, 
  Bot, 
  MessageSquare, 
  FileText, 
  Mail, 
  Target,
  Loader2 
} from 'lucide-react'

export default function HomePage() {
  const { user, loading, initialized } = useAuth()
  const router = useRouter()

  // Remove automatic redirect - let users see the landing page
  // useEffect(() => {
  //   if (initialized && user) {
  //     router.push('/dashboard')
  //   }
  // }, [initialized, user, router])

  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BrainCircuit className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
             JobMaster AI
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {user ? (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Welcome, {user.email}
                </span>
                <Link href="/dashboard">
                  <Button>Go to Dashboard</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Automate Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Job Search
            </span>{' '}
            with AI
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 leading-relaxed">
            Transform your career with our AI-powered platform. Get personalized job matching, 
            automated applications, intelligent chat assistance, and career coaching—all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8 py-4">
                  Open Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/signup">
                  <Button size="lg" className="text-lg px-8 py-4">
                    Start Your Journey
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Target className="h-8 w-8 text-blue-600" />}
            title="Smart Job Matching"
            description="AI analyzes your skills and preferences to find the perfect job opportunities tailored just for you."
          />
          <FeatureCard
            icon={<Bot className="h-8 w-8 text-green-600" />}
            title="Automated Applications"
            description="Let our AI handle job applications, cover letters, and follow-ups while you focus on what matters."
          />
          <FeatureCard
            icon={<MessageSquare className="h-8 w-8 text-purple-600" />}
            title="AI Career Coach"
            description="Get personalized career advice, interview prep, and skill development recommendations."
          />
          <FeatureCard
            icon={<FileText className="h-8 w-8 text-orange-600" />}
            title="CV Optimization"
            description="AI-powered resume analysis and optimization to beat ATS systems and impress recruiters."
          />
          <FeatureCard
            icon={<Mail className="h-8 w-8 text-red-600" />}
            title="Email Automation"
            description="Generate and send professional networking emails, follow-ups, and thank-you notes automatically."
          />
          <FeatureCard
            icon={<BrainCircuit className="h-8 w-8 text-indigo-600" />}
            title="Learning Plans"
            description="Receive personalized skill development plans and learning resources to advance your career."
          />
        </div>
      </main>
    </div>
  )
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode
  title: string
  description: string 
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300">
        {description}
      </p>
    </div>
  )
}
