// Job management utilities
// Handles integration between existing Linkedin_JobFound table and user-specific jobs

import { createSupabaseClient, createAnonymousClient } from './supabase-clean'
import { User } from '@supabase/supabase-js'

// Type for existing Linkedin_JobFound table
export interface LinkedinJobFound {
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

// Type for our user-specific jobs (matches Prisma schema)
export interface UserJob {
  id: string
  user_id: string
  title: string
  company_name: string | null
  job_type: string | null
  location: string | null
  country: string | null
  job_link: string | null
  salary_range: string | null
  benefits: string[] | null
  job_description: string | null
  requirements: string[] | null
  rating: number | null
  status: 'active' | 'applied' | 'interviewing' | 'rejected' | 'offer'
  date_posted: string | null
  created_at: string
  updated_at: string
  // Source tracking
  source: 'linkedin' | 'manual' | 'imported'
  linkedin_job_id: number | null // Reference to original Linkedin_JobFound
}

// Job status types
export type JobStatus = 'active' | 'applied' | 'interviewing' | 'rejected' | 'offer'

// Job filters
export interface JobFilters {
  status?: JobStatus[]
  job_type?: string[]
  country?: string[]
  rating?: number | string
  search?: string
  date_from?: string
  date_to?: string
}

/**
 * Get all available jobs from Linkedin_JobFound table (public data)
 */
export async function getLinkedinJobs(limit = 50, offset = 0) {
  try {
    const { data, error } = await createSupabaseClient()
      .from('Linkedin_JobFound')
      .select('*')
      .order('ID', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return { data: data as LinkedinJobFound[], error: null }
  } catch (error: any) {
    console.error('Error fetching LinkedIn jobs:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Search jobs in Linkedin_JobFound table
 */
export async function searchLinkedinJobs(query: string, filters?: Partial<JobFilters>) {
  try {
    let queryBuilder = createSupabaseClient()
      .from('Linkedin_JobFound')
      .select('*')

    // Search in title, description, and company
    if (query) {
      queryBuilder = queryBuilder.or(
        `Title.ilike.%${query}%,Job Description.ilike.%${query}%,Company Name.ilike.%${query}%`
      )
    }

    // Apply filters
    if (filters?.job_type?.length) {
      queryBuilder = queryBuilder.in('Job-Type', filters.job_type)
    }

    if (filters?.country?.length) {
      queryBuilder = queryBuilder.in('Country', filters.country)
    }

    if (filters?.rating) {
      // Convert string rating to number for comparison, or use 0 if invalid
      const ratingValue = typeof filters.rating === 'string' ? parseFloat(filters.rating) || 0 : filters.rating
      queryBuilder = queryBuilder.gte('Rating', ratingValue.toString())
    }

    const { data, error } = await queryBuilder
      .order('ID', { ascending: false })
      .limit(100)

    if (error) throw error
    return { data: data as LinkedinJobFound[], error: null }
  } catch (error: any) {
    console.error('Error searching LinkedIn jobs:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Import a LinkedIn job to user's personal job list
 */
export async function importLinkedinJob(linkedinJob: LinkedinJobFound, userId: string) {
  try {
    // Convert LinkedIn job format to our user job format
    const userJob = {
      user_id: userId,
      title: linkedinJob.Title || 'Untitled Job',
      company_name: linkedinJob['Company Name'],
      job_type: linkedinJob['Job-Type'],
      location: null, // LinkedIn data doesn't have separate location
      country: linkedinJob.Country,
      job_link: linkedinJob.Link,
      salary_range: null, // Not in LinkedIn data
      benefits: linkedinJob.Benefits ? [linkedinJob.Benefits] : null,
      job_description: linkedinJob['Job Description'],
      requirements: null, // Would need to parse from description
      rating: linkedinJob.Rating ? parseFloat(linkedinJob.Rating) || null : null,
      status: 'active' as JobStatus,
      date_posted: linkedinJob.Date,
      source: 'linkedin' as const,
      linkedin_job_id: linkedinJob.ID,
    }

    const { data, error } = await createSupabaseClient()
      .from('jobs')
      .insert(userJob)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    console.error('Error importing LinkedIn job:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Get user's personal jobs
 */
export async function getUserJobs(userId: string, filters?: JobFilters) {
  try {
    let queryBuilder = createSupabaseClient()
      .from('jobs')
      .select('*')
      .eq('user_id', userId)

    // Apply filters
    if (filters?.status?.length) {
      queryBuilder = queryBuilder.in('status', filters.status)
    }

    if (filters?.job_type?.length) {
      queryBuilder = queryBuilder.in('job_type', filters.job_type)
    }

    if (filters?.country?.length) {
      queryBuilder = queryBuilder.in('country', filters.country)
    }

    if (filters?.rating) {
      // Convert string rating to number for comparison, or use 0 if invalid
      const ratingValue = typeof filters.rating === 'string' ? parseFloat(filters.rating) || 0 : filters.rating
      queryBuilder = queryBuilder.gte('rating', ratingValue)
    }

    if (filters?.search) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${filters.search}%,job_description.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`
      )
    }

    const { data, error } = await queryBuilder
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data as UserJob[], error: null }
  } catch (error: any) {
    console.error('Error fetching user jobs:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Update job status
 */
export async function updateJobStatus(jobId: string, status: JobStatus, userId: string) {
  try {
    const { data, error } = await createSupabaseClient()
      .from('jobs')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', jobId)
      .eq('user_id', userId) // Ensure user can only update their own jobs
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    console.error('Error updating job status:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Create a new manual job entry
 */
export async function createManualJob(jobData: Partial<UserJob>, userId: string) {
  try {
    const newJob = {
      ...jobData,
      user_id: userId,
      status: jobData.status || 'active',
      source: 'manual' as const,
      linkedin_job_id: null,
    }

    const { data, error } = await createSupabaseClient()
      .from('jobs')
      .insert(newJob)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    console.error('Error creating manual job:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Delete a user's job
 */
export async function deleteUserJob(jobId: string, userId: string) {
  try {
    const { error } = await createSupabaseClient()
      .from('jobs')
      .delete()
      .eq('id', jobId)
      .eq('user_id', userId) // Ensure user can only delete their own jobs

    if (error) throw error
    return { error: null }
  } catch (error: any) {
    console.error('Error deleting job:', error)
    return { error: error.message }
  }
}

/**
 * Get job statistics for user
 */
export async function getJobStats(userId: string) {
  try {
    const { data, error } = await createSupabaseClient()
      .from('jobs')
      .select('status')
      .eq('user_id', userId)

    if (error) throw error

    const stats = {
      total: data.length,
      active: data.filter(job => job.status === 'active').length,
      applied: data.filter(job => job.status === 'applied').length,
      interviewing: data.filter(job => job.status === 'interviewing').length,
      rejected: data.filter(job => job.status === 'rejected').length,
      offers: data.filter(job => job.status === 'offer').length,
    }

    return { data: stats, error: null }
  } catch (error: any) {
    console.error('Error getting job stats:', error)
    return { data: null, error: error.message }
  }
} 