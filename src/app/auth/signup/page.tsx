import { Metadata } from 'next'
import { SignUpForm } from '@/components/auth/signup-form'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export const metadata: Metadata = {
  title: 'Sign Up | Job Automation Platform',
  description: 'Create your account to start automating your job search with AI.',
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-end mb-4">
            <ThemeToggle />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🚀 JobMaster AI
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your AI-powered career automation platform
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
          <SignUpForm />
        </div>
      </div>
    </div>
  )
} 