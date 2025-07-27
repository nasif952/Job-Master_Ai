import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  UserJob, 
  LinkedinJobFound, 
  JobFilters as JobFiltersType, 
  JobStatus,
  getUserJobs,
  getLinkedinJobs,
  searchLinkedinJobs,
  importLinkedinJob,
  updateJobStatus,
  createManualJob,
  deleteUserJob,
  getJobStats
} from '@/lib/jobs'

interface JobsState {
  // User's personal jobs
  userJobs: UserJob[]
  userJobsLoading: boolean
  
  // Available LinkedIn jobs to browse/import
  linkedinJobs: LinkedinJobFound[]
  linkedinJobsLoading: boolean
  
  // UI state
  selectedJob: UserJob | null
  selectedLinkedinJob: LinkedinJobFound | null
  filters: JobFiltersType
  searchQuery: string
  
  // Stats
  jobStats: {
    total: number
    active: number
    applied: number
    interviewing: number
    rejected: number
    offers: number
  } | null
  
  // Actions for user jobs
  setUserJobs: (jobs: UserJob[]) => void
  addUserJob: (job: UserJob) => void
  updateUserJob: (id: string, updates: Partial<UserJob>) => void
  removeUserJob: (id: string) => void
  setUserJobsLoading: (loading: boolean) => void
  
  // Actions for LinkedIn jobs
  setLinkedinJobs: (jobs: LinkedinJobFound[]) => void
  setLinkedinJobsLoading: (loading: boolean) => void
  
  // UI actions
  setSelectedJob: (job: UserJob | null) => void
  setSelectedLinkedinJob: (job: LinkedinJobFound | null) => void
  setFilters: (filters: JobFiltersType) => void
  clearFilters: () => void
  setSearchQuery: (query: string) => void
  
  // Stats
  setJobStats: (stats: JobsState['jobStats']) => void
  
  // Async actions
  fetchUserJobs: (userId: string, filters?: JobFiltersType) => Promise<void>
  fetchLinkedinJobs: (limit?: number, offset?: number) => Promise<void>
  searchJobs: (query: string, filters?: Partial<JobFiltersType>) => Promise<void>
  importJob: (linkedinJob: LinkedinJobFound, userId: string) => Promise<boolean>
  updateJobStatusAction: (jobId: string, status: JobStatus, userId: string) => Promise<boolean>
  createJob: (jobData: Partial<UserJob>, userId: string) => Promise<boolean>
  deleteJob: (jobId: string, userId: string) => Promise<boolean>
  fetchJobStats: (userId: string) => Promise<void>
}

export const useJobsStore = create<JobsState>()(
  persist(
    (set, get) => ({
      // Initial state
      userJobs: [],
      userJobsLoading: false,
      linkedinJobs: [],
      linkedinJobsLoading: false,
      selectedJob: null,
      selectedLinkedinJob: null,
      filters: {},
      searchQuery: '',
      jobStats: null,

      // User jobs actions
      setUserJobs: (jobs) => set({ userJobs: jobs }),
      
      addUserJob: (job) => set((state) => ({ 
        userJobs: [job, ...state.userJobs] 
      })),
      
      updateUserJob: (id, updates) => set((state) => ({
        userJobs: state.userJobs.map(job => 
          job.id === id ? { ...job, ...updates } : job
        )
      })),
      
      removeUserJob: (id) => set((state) => ({
        userJobs: state.userJobs.filter(job => job.id !== id),
        selectedJob: state.selectedJob?.id === id ? null : state.selectedJob
      })),

      setUserJobsLoading: (loading) => set({ userJobsLoading: loading }),
      
      // LinkedIn jobs actions
      setLinkedinJobs: (jobs) => set({ linkedinJobs: jobs }),
      setLinkedinJobsLoading: (loading) => set({ linkedinJobsLoading: loading }),
      
      // UI actions
      setSelectedJob: (job) => set({ selectedJob: job }),
      setSelectedLinkedinJob: (job) => set({ selectedLinkedinJob: job }),
      setFilters: (filters) => set({ filters }),
      clearFilters: () => set({ filters: {} }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      // Stats
      setJobStats: (stats) => set({ jobStats: stats }),
      
      // Async actions
      fetchUserJobs: async (userId, filters) => {
        set({ userJobsLoading: true })
        try {
          const { data, error } = await getUserJobs(userId, filters)
          if (error) throw new Error(error)
          if (data) {
            set({ userJobs: data, userJobsLoading: false })
          }
        } catch (error) {
          console.error('Failed to fetch user jobs:', error)
          set({ userJobsLoading: false })
        }
      },

      fetchLinkedinJobs: async (limit = 50, offset = 0) => {
        set({ linkedinJobsLoading: true })
        try {
          const { data, error } = await getLinkedinJobs(limit, offset)
          if (error) throw new Error(error)
          if (data) {
            set({ linkedinJobs: data, linkedinJobsLoading: false })
          }
        } catch (error) {
          console.error('Failed to fetch LinkedIn jobs:', error)
          set({ linkedinJobsLoading: false })
        }
      },

      searchJobs: async (query, filters) => {
        set({ linkedinJobsLoading: true, searchQuery: query })
        try {
          const { data, error } = await searchLinkedinJobs(query, filters)
          if (error) throw new Error(error)
          if (data) {
            set({ linkedinJobs: data, linkedinJobsLoading: false })
          }
        } catch (error) {
          console.error('Failed to search jobs:', error)
          set({ linkedinJobsLoading: false })
        }
      },

      importJob: async (linkedinJob, userId) => {
        try {
          const { data, error } = await importLinkedinJob(linkedinJob, userId)
          if (error) throw new Error(error)
          if (data) {
            // Add to user jobs and refresh stats
            get().addUserJob(data)
            get().fetchJobStats(userId)
            return true
          }
          return false
        } catch (error) {
          console.error('Failed to import job:', error)
          return false
        }
      },

      updateJobStatusAction: async (jobId, status, userId) => {
        try {
          const { data, error } = await updateJobStatus(jobId, status, userId)
          if (error) throw new Error(error)
          if (data) {
            // Update in local state and refresh stats
            get().updateUserJob(jobId, { status })
            get().fetchJobStats(userId)
            return true
          }
          return false
        } catch (error) {
          console.error('Failed to update job status:', error)
          return false
        }
      },

      createJob: async (jobData, userId) => {
        try {
          const { data, error } = await createManualJob(jobData, userId)
          if (error) throw new Error(error)
          if (data) {
            // Add to user jobs and refresh stats
            get().addUserJob(data)
            get().fetchJobStats(userId)
            return true
          }
          return false
        } catch (error) {
          console.error('Failed to create job:', error)
          return false
        }
      },

      deleteJob: async (jobId, userId) => {
        try {
          const { error } = await deleteUserJob(jobId, userId)
          if (error) throw new Error(error)
          
          // Remove from local state and refresh stats
          get().removeUserJob(jobId)
          get().fetchJobStats(userId)
          return true
        } catch (error) {
          console.error('Failed to delete job:', error)
          return false
        }
      },

      fetchJobStats: async (userId) => {
        try {
          const { data, error } = await getJobStats(userId)
          if (error) throw new Error(error)
          if (data) {
            set({ jobStats: data })
          }
        } catch (error) {
          console.error('Failed to fetch job stats:', error)
        }
      },
    }),
    {
      name: 'jobs-storage',
      // Only persist UI state, not data
      partialize: (state) => ({
        filters: state.filters,
        searchQuery: state.searchQuery,
        selectedJob: state.selectedJob,
        selectedLinkedinJob: state.selectedLinkedinJob,
      }),
    }
  )
) 