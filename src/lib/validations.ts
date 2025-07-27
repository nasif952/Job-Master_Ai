import { z } from 'zod'

// Auth validation schemas
export const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Profile validation schemas
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  title: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  skills: z.array(z.string()).optional(),
})

// Job validation schemas
export const jobSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company name is required'),
  description: z.string().optional(),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  salary: z.string().optional(),
  location: z.string().optional(),
  remote: z.boolean().default(false),
  jobType: z.string().optional(),
  url: z.string().url('Invalid URL').optional().or(z.literal('')),
  source: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  tags: z.array(z.string()).default([]),
  customNotes: z.string().optional(),
})

export const updateJobStatusSchema = z.object({
  status: z.enum(['not_applied', 'applied', 'interview', 'rejected', 'offer']),
  applicationDate: z.string().optional(),
})

// Chat validation schemas
export const chatMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty'),
  sessionId: z.string().optional(),
  jobId: z.string().optional(),
  type: z.enum(['job_analysis', 'cv_review', 'interview_prep', 'career_coaching']).default('job_analysis'),
})

export const createChatSessionSchema = z.object({
  title: z.string().optional(),
  type: z.enum(['job_analysis', 'cv_review', 'interview_prep', 'career_coaching']).default('job_analysis'),
  jobId: z.string().optional(),
  context: z.record(z.any()).optional(),
})

// Email validation schemas
export const emailTemplateSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Email body is required'),
  recipient: z.string().email('Invalid recipient email'),
  ccRecipients: z.array(z.string().email()).default([]),
  jobId: z.string().optional(),
  emailType: z.enum(['application', 'follow_up', 'thank_you', 'networking']).default('application'),
})

// CV validation schemas
export const cvUploadSchema = z.object({
  name: z.string().min(1, 'CV name is required'),
  file: z.any().refine((file) => file instanceof File, 'File is required')
    .refine((file) => file.size <= 10 * 1024 * 1024, 'File size must be less than 10MB')
    .refine(
      (file) => ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type),
      'File must be PDF, DOC, or DOCX'
    ),
})

// Assessment validation schemas
export const assessmentSubmissionSchema = z.object({
  assessmentId: z.string(),
  answers: z.record(z.any()),
})

export const createAssessmentSchema = z.object({
  title: z.string().min(1, 'Assessment title is required'),
  description: z.string().optional(),
  assessmentType: z.enum(['technical_skills', 'soft_skills', 'career_readiness', 'personality']),
  questions: z.array(z.object({
    id: z.string(),
    question: z.string(),
    type: z.enum(['multiple_choice', 'text', 'rating', 'boolean']),
    options: z.array(z.string()).optional(),
    required: z.boolean().default(true),
  })),
})

// Learning plan validation schemas
export const createLearningPlanSchema = z.object({
  title: z.string().min(1, 'Learning plan title is required'),
  description: z.string().optional(),
  category: z.enum(['technical', 'soft_skills', 'career_development', 'certification']),
  modules: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    duration: z.number().optional(),
    resources: z.array(z.object({
      title: z.string(),
      type: z.enum(['article', 'video', 'course', 'book', 'practice']),
      url: z.string().url().optional(),
      description: z.string().optional(),
    })).default([]),
  })),
})

// Search and filter schemas
export const jobFilterSchema = z.object({
  status: z.enum(['all', 'not_applied', 'applied', 'interview', 'rejected', 'offer']).default('all'),
  priority: z.enum(['all', 'low', 'medium', 'high']).default('all'),
  search: z.string().default(''),
  tags: z.array(z.string()).default([]),
  dateRange: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
  }).optional(),
})

// API response schemas
export const apiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().optional(),
})

export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Type exports
export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type JobInput = z.infer<typeof jobSchema>
export type ChatMessageInput = z.infer<typeof chatMessageSchema>
export type EmailTemplateInput = z.infer<typeof emailTemplateSchema>
export type JobFilterInput = z.infer<typeof jobFilterSchema>
export type PaginationInput = z.infer<typeof paginationSchema> 