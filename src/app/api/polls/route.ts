import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import { createPollSchema, voteSchema, multipleVoteSchema } from '@/lib/validations'
import { generateQRCode } from '@/lib/supabase/client'

// Create poll API
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createPollSchema.parse(body)

    // Create poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title: validatedData.title,
        description: validatedData.description,
        created_by: user.id,
        allow_multiple_votes: validatedData.allow_multiple_votes,
        require_authentication: validatedData.require_authentication,
        expires_at: validatedData.expires_at
      })
      .select()
      .single()

    if (pollError) {
      console.error('Poll creation error:', pollError)
      return NextResponse.json(
        { error: 'Failed to create poll' },
        { status: 500 }
      )
    }

    // Create poll options
    const optionsData = validatedData.options.map((text, index) => ({
      poll_id: poll.id,
      text,
      order_index: index
    }))

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionsData)

    if (optionsError) {
      console.error('Options creation error:', optionsError)
      return NextResponse.json(
        { error: 'Failed to create poll options' },
        { status: 500 }
      )
    }

    // Generate QR code
    try {
      await generateQRCode(poll.id, poll.share_token)
    } catch (qrError) {
      console.error('QR code generation error:', qrError)
      // Don't fail the request if QR generation fails
    }

    return NextResponse.json({
      success: true,
      data: poll
    })

  } catch (error: any) {
    console.error('Create poll error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get polls API
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status') || 'all'
    const query = searchParams.get('query') || ''

    let pollsQuery = supabase
      .from('poll_results')
      .select('*')

    // Apply filters
    if (status === 'active') {
      pollsQuery = pollsQuery.eq('is_active', true)
    } else if (status === 'expired') {
      pollsQuery = pollsQuery.lt('expires_at', new Date().toISOString())
    }

    if (query) {
      pollsQuery = pollsQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    }

    const { data: polls, error } = await pollsQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Get polls error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch polls' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: polls
    })

  } catch (error) {
    console.error('Get polls error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
