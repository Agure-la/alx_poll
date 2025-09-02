import { z } from 'zod'

// User validation schemas
export const userProfileSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username can only contain letters, numbers, underscores, and hyphens'
  }),
  full_name: z.string().min(1).max(100).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, {
    message: 'Please enter a valid phone number'
  }).optional(),
  avatar_url: z.string().url().optional()
})

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  full_name: z.string().min(1).max(100).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

// Poll validation schemas
export const createPollSchema = z.object({
  title: z.string().min(1, 'Poll title is required').max(200),
  description: z.string().max(1000).optional(),
  options: z.array(z.string().min(1, 'Option text is required').max(200))
    .min(2, 'At least 2 options are required')
    .max(10, 'Maximum 10 options allowed'),
  allow_multiple_votes: z.boolean().default(false),
  require_authentication: z.boolean().default(false),
  expires_at: z.string().datetime().optional()
    .refine((date) => !date || new Date(date) > new Date(), {
      message: 'Expiration date must be in the future'
    })
})

export const updatePollSchema = createPollSchema.partial().extend({
  is_active: z.boolean().optional()
})

// Vote validation schemas
export const voteSchema = z.object({
  poll_id: z.string().uuid('Invalid poll ID'),
  option_id: z.string().uuid('Invalid option ID'),
  voter_email: z.string().email().optional(),
  voter_phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional()
}).refine((data) => data.voter_email || data.voter_phone, {
  message: 'Either email or phone is required for anonymous voting',
  path: ['voter_email']
})

export const multipleVoteSchema = z.object({
  poll_id: z.string().uuid('Invalid poll ID'),
  option_ids: z.array(z.string().uuid('Invalid option ID'))
    .min(1, 'At least one option must be selected')
    .max(10, 'Maximum 10 options allowed')
})

// QR Code validation
export const qrCodeSchema = z.object({
  poll_id: z.string().uuid('Invalid poll ID'),
  size: z.number().min(100).max(1000).default(300),
  format: z.enum(['png', 'svg', 'pdf']).default('png')
})

// Search and filter schemas
export const pollSearchSchema = z.object({
  query: z.string().max(100).optional(),
  status: z.enum(['all', 'active', 'expired', 'inactive']).default('all'),
  created_by: z.string().uuid().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0)
})

// Analytics schemas
export const analyticsSchema = z.object({
  poll_id: z.string().uuid('Invalid poll ID'),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  group_by: z.enum(['hour', 'day', 'week', 'month']).default('day')
})

// Share schemas
export const sharePollSchema = z.object({
  poll_id: z.string().uuid('Invalid poll ID'),
  share_method: z.enum(['qr', 'link', 'social']),
  platform: z.enum(['twitter', 'facebook', 'linkedin', 'whatsapp']).optional()
})

// Type exports
export type UserProfile = z.infer<typeof userProfileSchema>
export type LoginCredentials = z.infer<typeof loginSchema>
export type RegisterCredentials = z.infer<typeof registerSchema>
export type CreatePollData = z.infer<typeof createPollSchema>
export type UpdatePollData = z.infer<typeof updatePollSchema>
export type VoteData = z.infer<typeof voteSchema>
export type MultipleVoteData = z.infer<typeof multipleVoteSchema>
export type QRCodeData = z.infer<typeof qrCodeSchema>
export type PollSearch = z.infer<typeof pollSearchSchema>
export type AnalyticsData = z.infer<typeof analyticsSchema>
export type SharePollData = z.infer<typeof sharePollSchema>

// Validation helpers
export const validateEmail = (email: string): boolean => {
  return loginSchema.shape.email.safeParse(email).success
}

export const validatePhone = (phone: string): boolean => {
  return userProfileSchema.shape.phone.safeParse(phone).success
}

export const validateUsername = (username: string): boolean => {
  return userProfileSchema.shape.username.safeParse(username).success
}

// Error message helpers
export const getValidationError = (error: z.ZodError): string => {
  return error.errors.map(e => e.message).join(', ')
}

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '')
}
