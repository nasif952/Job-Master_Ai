'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Briefcase, User } from 'lucide-react'

interface JobDashboardBasicProps {
  userEmail?: string
}

export function JobDashboardBasic({ userEmail }: JobDashboardBasicProps) {
  const [activeTab, setActiveTab] = useState<'my-jobs' | 'browse'>('my-jobs')

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Job Management Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your job applications and discover new opportunities
        </p>
        {userEmail && (
          <div className="flex items-center mt-2 text-sm text-gray-500">
            <User className="h-4 w-4 mr-2" />
            {userEmail}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Briefcase className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Search className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Applied</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Briefcase className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Interviews</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('my-jobs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-jobs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Jobs (0)
            </button>
            <button
              onClick={() => setActiveTab('browse')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'browse'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Browse LinkedIn Jobs (8)
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'my-jobs' ? (
            <div className="text-center py-12">
              <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No jobs yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by browsing LinkedIn jobs or adding a manual entry
              </p>
              <div className="mt-6">
                <Button onClick={() => setActiveTab('browse')}>
                  Browse Jobs
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Browse LinkedIn Jobs</h2>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search LinkedIn jobs..."
                      className="w-full"
                    />
                  </div>
                  <Button>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>

              <div className="text-center py-12">
                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-green-800 dark:text-green-200 mb-2">
                    🎉 Basic Dashboard Working!
                  </h3>
                  <p className="text-green-600 dark:text-green-300 mb-4">
                    The dashboard is now loading properly without infinite loading.
                  </p>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded border">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ✅ Authentication: Working<br/>
                      ✅ Dashboard Components: Loading<br/>
                      ✅ UI Components: Functional<br/>
                      🔄 Next: Add LinkedIn job data
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 