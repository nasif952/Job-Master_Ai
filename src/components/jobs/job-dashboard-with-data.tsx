'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Briefcase, User, MapPin, Building, Star, ExternalLink, Import, Loader2, ChevronDown, Trash2, Brain, MessageSquare } from 'lucide-react'
import { createAnonymousClient, createSupabaseClient } from '@/lib/supabase-clean'
import { JobChatInterface } from './job-chat-interface'

interface LinkedinJob {
  ID: number
  Title: string | null
  'Job Description': string
  Link: string | null
  'Job-Type': string | null
  Rating: string | null
  'Company Name': string | null
  Benefits: string | null
  Country: string | null
  Date: string | null
}

interface JobDashboardWithDataProps {
  userEmail?: string
}

// Job status options
const JOB_STATUSES = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-800' },
  { value: 'interviewing', label: 'Interviewing', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'offer', label: 'Offer Received', color: 'bg-purple-100 text-purple-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
]

export function JobDashboardWithData({ userEmail }: JobDashboardWithDataProps) {
  const [activeTab, setActiveTab] = useState<'my-jobs' | 'browse'>('my-jobs')
  const [linkedinJobs, setLinkedinJobs] = useState<LinkedinJob[]>([])
  const [userJobs, setUserJobs] = useState<any[]>([])
  const [filteredUserJobs, setFilteredUserJobs] = useState<any[]>([])
  const [filteredLinkedinJobs, setFilteredLinkedinJobs] = useState<LinkedinJob[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [userJobsLoading, setUserJobsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set())
  const [statusDropdowns, setStatusDropdowns] = useState<Set<string>>(new Set())
  const [jobAnalyses, setJobAnalyses] = useState<Record<string, any>>({})
  const [analyzingJobs, setAnalyzingJobs] = useState<Set<string>>(new Set())
  const [selectedJobForChat, setSelectedJobForChat] = useState<any>(null)

  // Toggle job expansion
  const toggleJobExpansion = (jobId: string) => {
    const newExpanded = new Set(expandedJobs)
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId)
    } else {
      newExpanded.add(jobId)
    }
    setExpandedJobs(newExpanded)
  }

  // Toggle status dropdown
  const toggleStatusDropdown = (jobId: string) => {
    const newDropdowns = new Set(statusDropdowns)
    if (newDropdowns.has(jobId)) {
      newDropdowns.delete(jobId)
    } else {
      newDropdowns.add(jobId)
    }
    setStatusDropdowns(newDropdowns)
  }

  // Update job status
  const updateJobStatus = async (jobId: string, newStatus: string) => {
    try {
      console.log(`🔄 Updating job ${jobId} to status: ${newStatus}`)
      
      const authClient = createSupabaseClient()
      const { data: { user } } = await authClient.auth.getUser()
      
      if (!user) {
        alert('Authentication required to update job status')
        return
      }

      const { error } = await authClient
        .from('jobs')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', jobId)
        .eq('user_id', user.id) // Ensure user can only update their own jobs

      if (error) {
        console.error('❌ Status update failed:', error)
        alert(`Failed to update job status: ${error.message}`)
        return
      }

      console.log('✅ Job status updated successfully')
      
      // Update local state
      setUserJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === jobId 
            ? { ...job, status: newStatus, updated_at: new Date().toISOString() }
            : job
        )
      )

      // Close dropdown
      setStatusDropdowns(prev => {
        const newSet = new Set(prev)
        newSet.delete(jobId)
        return newSet
      })

      const statusLabel = JOB_STATUSES.find(s => s.value === newStatus)?.label || newStatus
      alert(`✅ Job status updated to "${statusLabel}"`)

    } catch (error: any) {
      console.error('❌ Status update error:', error)
      alert(`Error updating job status: ${error.message}`)
    }
  }

  // Fetch LinkedIn jobs when browse tab is active
  useEffect(() => {
    if (activeTab === 'browse' && linkedinJobs.length === 0) {
      fetchLinkedinJobs()
    }
    if (activeTab === 'my-jobs' && userJobs.length === 0) {
      fetchUserJobs()
    }
  }, [activeTab])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.status-dropdown')) {
        setStatusDropdowns(new Set())
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchLinkedinJobs = async () => {
    console.log('🔍 Fetching LinkedIn jobs...')
    setLoading(true)
    setError(null)
    
    try {
      // Use anonymous client for public LinkedIn job browsing
      const supabase = createAnonymousClient()
      console.log('📡 Anonymous Supabase client created, making query...')
      
      const { data, error } = await supabase
        .from('Linkedin_JobFound')
        .select('*')
        .order('ID', { ascending: false })
        .limit(500)

      console.log('📊 Query result:', { data: data?.length, error })

      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }

      if (!data) {
        console.warn('⚠️ No data returned from query')
        setLinkedinJobs([])
      } else {
        console.log('✅ Successfully fetched jobs:', data.length)
        setLinkedinJobs(data)
        setFilteredLinkedinJobs(data)
      }
    } catch (err: any) {
      console.error('❌ Error fetching LinkedIn jobs:', err)
      setError(`Failed to load jobs: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Search function
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredUserJobs(userJobs)
      setFilteredLinkedinJobs(linkedinJobs)
      return
    }
    
    const searchLower = query.toLowerCase()
    
    // Filter user jobs
    const filteredUser = userJobs.filter(job => 
      job.title?.toLowerCase().includes(searchLower) ||
      job.company_name?.toLowerCase().includes(searchLower) ||
      job.job_description?.toLowerCase().includes(searchLower) ||
      job.country?.toLowerCase().includes(searchLower)
    )
    
    // Filter LinkedIn jobs
    const filteredLinkedin = linkedinJobs.filter(job =>
      job.Title?.toLowerCase().includes(searchLower) ||
      job['Company Name']?.toLowerCase().includes(searchLower) ||
      job['Job Description']?.toLowerCase().includes(searchLower) ||
      job.Country?.toLowerCase().includes(searchLower)
    )
    
    setFilteredUserJobs(filteredUser)
    setFilteredLinkedinJobs(filteredLinkedin)
  }

  // Delete job function
  const deleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return
    
    try {
      const authClient = createSupabaseClient()
      const { data: { user } } = await authClient.auth.getUser()
      
      if (!user) {
        alert('Authentication required')
        return
      }

      const { error } = await authClient
        .from('jobs')
        .delete()
        .eq('id', jobId)
        .eq('user_id', user.id)

      if (error) throw error

      // Update local state
      const updatedJobs = userJobs.filter(job => job.id !== jobId)
      setUserJobs(updatedJobs)
      setFilteredUserJobs(updatedJobs.filter(job => 
        !searchQuery || 
        job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
      ))
      
      alert('✅ Job deleted successfully')
    } catch (error: any) {
      console.error('❌ Delete error:', error)
      alert(`Error deleting job: ${error.message}`)
    }
  }

  // AI Job Analysis function
  const analyzeJob = async (job: any) => {
    const jobId = job.id
    setAnalyzingJobs(prev => new Set([...prev, jobId]))
    
    try {
      const response = await fetch('/api/analyze-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: job.title,
          company: job.company_name,
          description: job.job_description,
          requirements: job.requirements,
          jobType: job.job_type,
          location: job.country
        })
      })

      if (!response.ok) throw new Error('Analysis failed')
      
      const analysis = await response.json()
      setJobAnalyses(prev => ({ ...prev, [jobId]: analysis }))
      
    } catch (error) {
      console.error('AI Analysis error:', error)
      alert('AI analysis failed. Please try again.')
    } finally {
      setAnalyzingJobs(prev => {
        const newSet = new Set(prev)
        newSet.delete(jobId)
        return newSet
      })
    }
  }

  // Calculate job statistics
  const jobStats = {
    totalJobs: userJobs.length,
    appliedJobs: userJobs.filter(job => job.status === 'applied').length,
    interviewingJobs: userJobs.filter(job => job.status === 'interviewing').length,
    activeJobs: userJobs.filter(job => job.status === 'active').length,
    offerJobs: userJobs.filter(job => job.status === 'offer').length,
    rejectedJobs: userJobs.filter(job => job.status === 'rejected').length,
  }

  // Fetch user's personal jobs
  const fetchUserJobs = async () => {
    console.log('🔍 Fetching user jobs...')
    setUserJobsLoading(true)
    
    try {
      const authClient = createSupabaseClient()
      const { data: { user } } = await authClient.auth.getUser()
      
      if (!user) {
        console.warn('⚠️ No authenticated user found')
        setUserJobs([])
        return
      }

      console.log('📡 Fetching jobs for user:', user.id)
      
      const { data, error } = await authClient
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      console.log('📊 User jobs result:', { data: data?.length, error })

      if (error) {
        console.error('❌ Error fetching user jobs:', error)
        throw error
      }

      setUserJobs(data || [])
      setFilteredUserJobs(data || [])
      console.log('✅ Successfully fetched user jobs:', data?.length || 0)
      
    } catch (err: any) {
      console.error('❌ Error fetching user jobs:', err)
      setError(`Failed to load your jobs: ${err.message}`)
    } finally {
      setUserJobsLoading(false)
    }
  }

  const handleImportJob = async (job: LinkedinJob) => {
    if (!userEmail) {
      alert('Please sign in to import jobs')
      return
    }

    try {
      // Import using the jobs utility function
      const { importLinkedinJob } = await import('@/lib/jobs')
      
      console.log('🔄 Importing job:', job.Title)
      
      // Get user ID from authenticated client
      const authClient = createSupabaseClient()
      const { data: { user } } = await authClient.auth.getUser()
      
      if (!user) {
        alert('Authentication required to import jobs')
        return
      }

      const result = await importLinkedinJob(job, user.id)
      
      if (result.error) {
        console.error('❌ Import failed:', result.error)
        alert(`Failed to import job: ${result.error}`)
      } else {
        console.log('✅ Job imported successfully:', result.data)
        alert(`✅ Successfully imported "${job.Title}" to your job list!`)
        
        // Refresh user jobs to show the newly imported job
        fetchUserJobs()
        
        // Switch to My Jobs tab to show the imported job
        setActiveTab('my-jobs')
      }
    } catch (error: any) {
      console.error('❌ Import error:', error)
      alert(`Error importing job: ${error.message}`)
    }
  }

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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{jobStats.totalJobs}</p>
              <p className="text-xs text-gray-500 mt-1">
                {jobStats.activeJobs} active, {jobStats.rejectedJobs} rejected
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Search className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Applied</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{jobStats.appliedJobs}</p>
              <p className="text-xs text-gray-500 mt-1">
                {jobStats.interviewingJobs} interviewing
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Star className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Offers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{jobStats.offerJobs}</p>
              <p className="text-xs text-gray-500 mt-1">
                {jobStats.interviewingJobs} in progress
              </p>
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
              My Jobs ({filteredUserJobs.length})
            </button>
            <button
              onClick={() => setActiveTab('browse')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'browse'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Browse LinkedIn Jobs ({filteredLinkedinJobs.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'my-jobs' ? (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">My Jobs</h2>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search your jobs..."
                      className="w-full"
                      value={searchQuery || ''}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                  </div>
                  <Button>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                  <Button 
                    onClick={fetchUserJobs}
                    variant="outline"
                  >
                    Refresh
                  </Button>
                </div>
              </div>

              {userJobsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-gray-500 ml-2">Loading your jobs...</p>
                </div>
              ) : userJobs.length === 0 ? (
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
                <div className="space-y-4">
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                      ✅ You have {userJobs.length} job{userJobs.length !== 1 ? 's' : ''} in your pipeline
                    </p>
                  </div>
                  
                  {filteredUserJobs.map((job) => {
                    const isExpanded = expandedJobs.has(job.id)
                    return (
                      <div key={job.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {job.title || 'Untitled Position'}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <div className="flex items-center">
                                <Building className="h-4 w-4 mr-1" />
                                {job.company_name || 'Unknown Company'}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {job.country || job.location || 'Location not specified'}
                              </div>
                              <div className="flex items-center">
                                <Briefcase className="h-4 w-4 mr-1" />
                                {job.job_type || 'Type not specified'}
                              </div>
                              {job.rating && (
                                <div className="flex items-center">
                                  <Star className="h-4 w-4 mr-1 text-yellow-500" />
                                  {job.rating}/5
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                JOB_STATUSES.find(s => s.value === job.status)?.color || 'bg-gray-100 text-gray-800'
                              }`}>
                                {JOB_STATUSES.find(s => s.value === job.status)?.label || job.status?.toUpperCase() || 'ACTIVE'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {job.source === 'linkedin' ? '📎 Imported from LinkedIn' : '✏️ Manual entry'}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {job.job_link && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(job.job_link, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            )}
                            
                            {/* Status Update Dropdown */}
                            <div className="relative status-dropdown">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleStatusDropdown(job.id)}
                                className="flex items-center gap-1"
                              >
                                Update Status
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                              
                              {statusDropdowns.has(job.id) && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                                  <div className="py-1">
                                    {JOB_STATUSES.map((status) => (
                                      <button
                                        key={status.value}
                                        onClick={() => updateJobStatus(job.id, status.value)}
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
                                          job.status === status.value ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                        }`}
                                      >
                                        <span className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                                          {status.label}
                                        </span>
                                        {job.status === status.value && (
                                          <span className="text-blue-600 text-xs">Current</span>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleJobExpansion(job.id)}
                            >
                              {isExpanded ? 'Collapse' : 'Expand'}
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => analyzeJob(job)}
                              disabled={analyzingJobs.has(job.id)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              {analyzingJobs.has(job.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Brain className="h-4 w-4" />
                              )}
                              {analyzingJobs.has(job.id) ? 'Analyzing...' : 'AI Analysis'}
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedJobForChat(job)}
                              className="text-purple-600 hover:text-purple-700"
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Chat with AI
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteJob(job.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* AI Analysis Section */}
                        {jobAnalyses[job.id] && (
                          <div className="mb-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center">
                                <Brain className="h-4 w-4 mr-2" />
                                AI Analysis
                              </h4>
                              <div className="space-y-3 text-sm">
                                <div>
                                  <span className="font-medium text-blue-800 dark:text-blue-200">Summary:</span>
                                  <p className="text-blue-700 dark:text-blue-300 mt-1">{jobAnalyses[job.id].summary}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <span className="font-medium text-blue-800 dark:text-blue-200">Key Skills:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {jobAnalyses[job.id].keySkills?.map((skill: string, idx: number) => (
                                        <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs">
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-medium text-blue-800 dark:text-blue-200">Experience Level:</span>
                                    <p className="text-blue-700 dark:text-blue-300">{jobAnalyses[job.id].experienceLevel}</p>
                                  </div>
                                </div>
                                {jobAnalyses[job.id].pros && (
                                  <div>
                                    <span className="font-medium text-green-700 dark:text-green-300">Pros:</span>
                                    <ul className="text-green-600 dark:text-green-400 mt-1 ml-4">
                                      {jobAnalyses[job.id].pros.map((pro: string, idx: number) => (
                                        <li key={idx} className="list-disc">{pro}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {jobAnalyses[job.id].concerns && (
                                  <div>
                                    <span className="font-medium text-orange-700 dark:text-orange-300">Concerns:</span>
                                    <ul className="text-orange-600 dark:text-orange-400 mt-1 ml-4">
                                      {jobAnalyses[job.id].concerns.map((concern: string, idx: number) => (
                                        <li key={idx} className="list-disc">{concern}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Job Description - Always show full text */}
                        {job.job_description && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Job Description:</h4>
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                              <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                                {isExpanded ? job.job_description : `${job.job_description.substring(0, 300)}${job.job_description.length > 300 ? '...' : ''}`}
                              </p>
                              {job.job_description.length > 300 && (
                                <button
                                  onClick={() => toggleJobExpansion(job.id)}
                                  className="text-blue-600 hover:text-blue-800 text-sm mt-2 font-medium"
                                >
                                  {isExpanded ? 'Show Less' : 'Show More'}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Benefits - Always show full text */}
                        {job.benefits && job.benefits.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Benefits:</h4>
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                              <p className="text-green-800 dark:text-green-200 text-sm whitespace-pre-wrap leading-relaxed">
                                {Array.isArray(job.benefits) ? job.benefits.join(', ') : job.benefits}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Requirements - if available */}
                        {job.requirements && job.requirements.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Requirements:</h4>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                              <ul className="text-blue-800 dark:text-blue-200 text-sm space-y-1">
                                {Array.isArray(job.requirements) ? 
                                  job.requirements.map((req: string, index: number) => (
                                    <li key={index} className="flex items-start">
                                      <span className="text-blue-600 mr-2">•</span>
                                      {req}
                                    </li>
                                  )) :
                                  <li className="flex items-start">
                                    <span className="text-blue-600 mr-2">•</span>
                                    {job.requirements}
                                  </li>
                                }
                              </ul>
                            </div>
                          </div>
                        )}

                        {/* Salary Range - if available */}
                        {job.salary_range && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Salary Range:</h4>
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                              <p className="text-purple-800 dark:text-purple-200 text-sm font-medium">
                                {job.salary_range}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Dates and metadata */}
                        <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
                          <div className="flex gap-4">
                            <span>
                              Added: {new Date(job.created_at).toLocaleDateString()}
                            </span>
                            {job.date_posted && (
                              <span>
                                Posted: {new Date(job.date_posted).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {job.linkedin_job_id && (
                            <span>
                              LinkedIn ID: {job.linkedin_job_id}
                            </span>
                          )}
                              </div>
      
      {/* Job Chat Interface Modal */}
      {selectedJobForChat && (
        <JobChatInterface
          job={selectedJobForChat}
          userEmail={userEmail || ''}
          onClose={() => setSelectedJobForChat(null)}
        />
      )}
    </div>
  )
})}
                </div>
              )}
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
                  <Button 
                    onClick={fetchLinkedinJobs}
                    variant="outline"
                  >
                    Refresh
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-gray-500 ml-2">Loading LinkedIn jobs...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
                    <p className="text-red-800 dark:text-red-200 font-medium mb-2">
                      ❌ Error loading jobs
                    </p>
                    <p className="text-red-600 dark:text-red-300 text-sm mb-4">
                      {error}
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      Check browser console (F12) for detailed error information.
                    </p>
                    <Button 
                      onClick={fetchLinkedinJobs}
                      variant="outline"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : linkedinJobs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
                    <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                      📭 No LinkedIn jobs found
                    </p>
                    <p className="text-yellow-600 dark:text-yellow-300 text-sm mb-4">
                      The query returned no results. This might be due to:
                    </p>
                    <ul className="text-left text-sm text-yellow-600 dark:text-yellow-300 mb-4">
                      <li>• Row Level Security blocking access</li>
                      <li>• Network connectivity issues</li>
                      <li>• Database configuration problems</li>
                    </ul>
                    <Button 
                      onClick={fetchLinkedinJobs}
                      variant="outline"
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-green-800 dark:text-green-200 text-sm">
                      ✅ Successfully loaded {linkedinJobs.length} LinkedIn jobs
                    </p>
                  </div>
                  
                  {filteredLinkedinJobs.map((job) => (
                    <div key={job.ID} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {job.Title || 'Untitled Position'}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <div className="flex items-center">
                              <Building className="h-4 w-4 mr-1" />
                              {job['Company Name'] || 'Unknown Company'}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {job.Country || 'Location not specified'}
                            </div>
                            <div className="flex items-center">
                              <Briefcase className="h-4 w-4 mr-1" />
                              {job['Job-Type'] || 'Type not specified'}
                            </div>
                            {job.Rating && (
                              <div className="flex items-center">
                                <Star className="h-4 w-4 mr-1 text-yellow-500" />
                                {job.Rating}/5
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {job.Link && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(job.Link!, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handleImportJob(job)}
                          >
                            <Import className="h-4 w-4 mr-1" />
                            Import
                          </Button>
                        </div>
                      </div>
                      
                      {job['Job Description'] && (
                        <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 line-clamp-3">
                          {job['Job Description'].substring(0, 200)}
                          {job['Job Description'].length > 200 && '...'}
                        </p>
                      )}
                      
                      {job.Benefits && (
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                          <p className="text-green-800 dark:text-green-200 text-sm">
                            <strong>Benefits:</strong> {job.Benefits.substring(0, 150)}
                            {job.Benefits.length > 150 && '...'}
                          </p>
                        </div>
                      )}
                      
                      {job.Date && (
                        <p className="text-xs text-gray-500 mt-2">
                          Posted: {new Date(job.Date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 