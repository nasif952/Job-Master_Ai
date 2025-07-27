'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useJobsStore } from '@/store/jobs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Plus, 
  Import, 
  Filter,
  BarChart3,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { LinkedinJobFound, UserJob } from '@/lib/jobs'

export function JobDashboard() {
  const { user } = useAuth()
  const {
    userJobs,
    linkedinJobs,
    userJobsLoading,
    linkedinJobsLoading,
    searchQuery,
    jobStats,
    setSearchQuery,
    fetchUserJobs,
    fetchLinkedinJobs,
    searchJobs,
    importJob,
    fetchJobStats,
  } = useJobsStore()

  const [activeTab, setActiveTab] = useState<'my-jobs' | 'browse'>('my-jobs')
  const [searchInput, setSearchInput] = useState(searchQuery || '')

  // Load data on component mount
  useEffect(() => {
    if (user) {
      fetchUserJobs(user.id)
      fetchJobStats(user.id)
    }
    if (activeTab === 'browse' && linkedinJobs.length === 0) {
      fetchLinkedinJobs()
    }
  }, [user, activeTab])

  const handleSearch = () => {
    setSearchQuery(searchInput)
    if (activeTab === 'browse') {
      searchJobs(searchInput)
    }
  }

  const handleImportJob = async (linkedinJob: LinkedinJobFound) => {
    if (!user) return
    try {
      const success = await importJob(linkedinJob, user.id)
      if (success) {
        // Refresh user jobs to show imported job
        fetchUserJobs(user.id)
        alert('Job imported successfully!')
      } else {
        alert('Failed to import job. Please try again.')
      }
    } catch (error) {
      console.error('Error importing job:', error)
      alert('Error importing job. Please try again.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-blue-600 bg-blue-100'
      case 'applied': return 'text-yellow-600 bg-yellow-100'
      case 'interviewing': return 'text-purple-600 bg-purple-100'
      case 'rejected': return 'text-red-600 bg-red-100'
      case 'offer': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="h-4 w-4" />
      case 'applied': return <CheckCircle className="h-4 w-4" />
      case 'interviewing': return <AlertCircle className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      case 'offer': return <CheckCircle className="h-4 w-4" />
      default: return <Briefcase className="h-4 w-4" />
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Please sign in to access the job dashboard.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Job Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your job applications and discover new opportunities</p>
        </div>
        <Button className="mt-4 sm:mt-0">
          <Plus className="h-4 w-4 mr-2" />
          Add Manual Job
        </Button>
      </div>

      {/* Stats Cards */}
      {jobStats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold">{jobStats.total}</p>
              </div>
              <Briefcase className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-blue-600">{jobStats.active}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Applied</p>
                <p className="text-2xl font-bold text-yellow-600">{jobStats.applied}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Interviewing</p>
                <p className="text-2xl font-bold text-purple-600">{jobStats.interviewing}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{jobStats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Offers</p>
                <p className="text-2xl font-bold text-green-600">{jobStats.offers}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('my-jobs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'my-jobs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Jobs ({userJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('browse')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'browse'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Browse LinkedIn Jobs ({linkedinJobs.length})
          </button>
        </nav>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={activeTab === 'my-jobs' ? 'Search your jobs...' : 'Search LinkedIn jobs...'}
            value={searchInput || ''}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border">
        {activeTab === 'my-jobs' ? (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">My Job Applications</h2>
            
            {userJobsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading your jobs...</p>
              </div>
            ) : userJobs.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs yet</h3>
                <p className="text-gray-500 mb-4">Start by browsing LinkedIn jobs or adding a manual entry</p>
                <Button onClick={() => setActiveTab('browse')}>
                  Browse Jobs
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {userJobs.map((job) => (
                  <div key={job.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        <p className="text-gray-600">{job.company_name}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          {job.country && <span>{job.country}</span>}
                          {job.job_type && <span>• {job.job_type}</span>}
                          {job.rating && <span>• ⭐ {job.rating}/5</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                          {getStatusIcon(job.status)}
                          {job.status}
                        </span>
                      </div>
                    </div>
                    {job.job_description && (
                      <p className="text-gray-600 mt-2 text-sm line-clamp-2">
                        {job.job_description.substring(0, 200)}...
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Browse LinkedIn Jobs</h2>
            
            {linkedinJobsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading LinkedIn jobs...</p>
              </div>
            ) : linkedinJobs.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No LinkedIn jobs available</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery 
                    ? `No jobs found matching "${searchQuery}". Try different keywords.`
                    : 'No LinkedIn jobs found. Add some jobs to your LinkedIn_JobFound table or try searching.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {linkedinJobs.map((job) => (
                  <div key={job.ID} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{job.Title || 'Untitled Job'}</h3>
                        <p className="text-gray-600">{job['Company Name']}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          {job.Country && <span>{job.Country}</span>}
                          {job['Job-Type'] && <span>• {job['Job-Type']}</span>}
                          {job.Rating && <span>• ⭐ {job.Rating}/5</span>}
                          {job.Date && <span>• {job.Date}</span>}
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleImportJob(job)}
                        variant="outline" 
                        size="sm"
                      >
                        <Import className="h-4 w-4 mr-2" />
                        Import
                      </Button>
                    </div>
                    {job['Job Description'] && (
                      <p className="text-gray-600 mt-2 text-sm line-clamp-2">
                        {job['Job Description'].substring(0, 200)}...
                      </p>
                    )}
                    {job.Benefits && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {job.Benefits}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 