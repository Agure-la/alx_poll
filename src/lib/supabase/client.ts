import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Server-side client with service role for admin operations
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Client-side client for user operations
export function createClientSupabaseClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Auth helpers
export const getAuthUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

// Poll helpers
export const getPollWithOptions = async (pollId: string) => {
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select(`
      *,
      poll_options (*),
      poll_analytics (*)
    `)
    .eq('id', pollId)
    .single()

  if (pollError) throw pollError
  return poll
}

export const getPollsWithResults = async (limit = 10, offset = 0) => {
  const { data: polls, error } = await supabase
    .from('poll_results')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return polls
}

// Vote helpers
export const submitVote = async (
  pollId: string, 
  optionId: string, 
  voterInfo: {
    voterId?: string
    voterEmail?: string
    voterPhone?: string
    ipAddress?: string
    userAgent?: string
  }
) => {
  // Create the vote data object
  const voteData = {
    poll_id: pollId,
    option_id: optionId,
    voter_id: voterInfo.voterId,
    voter_email: voterInfo.voterEmail,
    voter_phone: voterInfo.voterPhone,
    ip_address: voterInfo.ipAddress,
    user_agent: voterInfo.userAgent
  }

  // Use type assertion to bypass TypeScript's type checking
  const { data, error } = await supabase
    .from('votes')
    .insert(voteData as any)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getUserVote = async (pollId: string, userId: string) => {
  const { data, error } = await supabase
    .from('votes')
    .select('option_id')
    .eq('poll_id', pollId)
    .eq('voter_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
  return data?.option_id
}

// QR Code helpers
export const generateQRCode = async (pollId: string, shareToken: string) => {
  const pollUrl = `${process.env.NEXT_PUBLIC_APP_URL}/polls/${pollId}?token=${shareToken}`
  
  // Generate QR code using qrcode library
  const QRCode = require('qrcode')
  const qrCodeDataUrl = await QRCode.toDataURL(pollUrl, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  })

  // Upload to Supabase Storage
  const fileName = `qr-codes/${pollId}.png`
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('poll-assets')
    .upload(fileName, qrCodeDataUrl, {
      contentType: 'image/png',
      upsert: true
    })

  if (uploadError) throw uploadError

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('poll-assets')
    .getPublicUrl(fileName)

  // Update poll with QR code URL
  const updateData = { 
    qr_code_url: publicUrl 
  }
  
  const { error: updateError } = await supabase
    .from('polls')
    .update(updateData as any)
    .eq('id', pollId)

  if (updateError) throw updateError

  return publicUrl
}

// Real-time subscriptions
export const subscribeToPollVotes = (pollId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`poll-votes-${pollId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'votes',
        filter: `poll_id=eq.${pollId}`
      },
      callback
    )
    .subscribe()
}

export const subscribeToPollUpdates = (pollId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`poll-updates-${pollId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'polls',
        filter: `id=eq.${pollId}`
      },
      callback
    )
    .subscribe()
}

// Analytics helpers
export const getPollAnalytics = async (pollId: string) => {
  const { data, error } = await supabase
    .from('poll_analytics')
    .select('*')
    .eq('poll_id', pollId)
    .single()

  if (error) throw error
  return data
}

export const getVoteHistory = async (pollId: string, limit = 50) => {
  const { data, error } = await supabase
    .from('votes')
    .insert(voteData)  // Try without array wrapping
    .select()
    .single()
    .select(`
      *,
      poll_options (text),
      users (username, email)
    `)
    .eq('poll_id', pollId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}
