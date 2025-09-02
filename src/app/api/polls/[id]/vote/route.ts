import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import { voteSchema, multipleVoteSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = voteSchema.parse(body)

    // Get user IP and user agent
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Check if poll exists and is active
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', validatedData.poll_id)
      .eq('is_active', true)
      .single()

    if (pollError || !poll) {
      return NextResponse.json(
        { error: 'Poll not found or inactive' },
        { status: 404 }
      )
    }

    // Check if poll has expired
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Poll has expired' },
        { status: 400 }
      )
    }

    // Check authentication requirement
    if (poll.require_authentication) {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Authentication required for this poll' },
          { status: 401 }
        )
      }
      validatedData.voter_id = user.id
    }

    // Check if user has already voted
    let existingVote
    if (validatedData.voter_id) {
      const { data: vote } = await supabase
        .from('votes')
        .select('id')
        .eq('poll_id', validatedData.poll_id)
        .eq('voter_id', validatedData.voter_id)
        .single()
      existingVote = vote
    } else if (validatedData.voter_email) {
      const { data: vote } = await supabase
        .from('votes')
        .select('id')
        .eq('poll_id', validatedData.poll_id)
        .eq('voter_email', validatedData.voter_email)
        .single()
      existingVote = vote
    } else if (validatedData.voter_phone) {
      const { data: vote } = await supabase
        .from('votes')
        .select('id')
        .eq('poll_id', validatedData.poll_id)
        .eq('voter_phone', validatedData.voter_phone)
        .single()
      existingVote = vote
    }

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted on this poll' },
        { status: 400 }
      )
    }

    // Verify option exists and belongs to poll
    const { data: option, error: optionError } = await supabase
      .from('poll_options')
      .select('id')
      .eq('id', validatedData.option_id)
      .eq('poll_id', validatedData.poll_id)
      .single()

    if (optionError || !option) {
      return NextResponse.json(
        { error: 'Invalid option selected' },
        { status: 400 }
      )
    }

    // Submit vote
    const { data: vote, error: voteError } = await supabase
      .from('votes')
      .insert({
        poll_id: validatedData.poll_id,
        option_id: validatedData.option_id,
        voter_id: validatedData.voter_id,
        voter_email: validatedData.voter_email,
        voter_phone: validatedData.voter_phone,
        ip_address: ip,
        user_agent: userAgent
      })
      .select()
      .single()

    if (voteError) {
      console.error('Vote submission error:', voteError)
      return NextResponse.json(
        { error: 'Failed to submit vote' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: vote
    })

  } catch (error: any) {
    console.error('Vote error:', error)
    
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

// Multiple votes API (for polls with allow_multiple_votes = true)
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = multipleVoteSchema.parse(body)

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required for multiple votes' },
        { status: 401 }
      )
    }

    // Check if poll exists and allows multiple votes
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', validatedData.poll_id)
      .eq('is_active', true)
      .eq('allow_multiple_votes', true)
      .single()

    if (pollError || !poll) {
      return NextResponse.json(
        { error: 'Poll not found or does not allow multiple votes' },
        { status: 404 }
      )
    }

    // Check if poll has expired
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Poll has expired' },
        { status: 400 }
      )
    }

    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('poll_id', validatedData.poll_id)
      .eq('voter_id', user.id)
      .single()

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted on this poll' },
        { status: 400 }
      )
    }

    // Verify all options exist and belong to poll
    const { data: options, error: optionsError } = await supabase
      .from('poll_options')
      .select('id')
      .eq('poll_id', validatedData.poll_id)
      .in('id', validatedData.option_ids)

    if (optionsError || options.length !== validatedData.option_ids.length) {
      return NextResponse.json(
        { error: 'One or more invalid options selected' },
        { status: 400 }
      )
    }

    // Get user IP and user agent
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Submit multiple votes
    const votesData = validatedData.option_ids.map(optionId => ({
      poll_id: validatedData.poll_id,
      option_id: optionId,
      voter_id: user.id,
      ip_address: ip,
      user_agent: userAgent
    }))

    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .insert(votesData)
      .select()

    if (votesError) {
      console.error('Multiple votes submission error:', votesError)
      return NextResponse.json(
        { error: 'Failed to submit votes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: votes
    })

  } catch (error: any) {
    console.error('Multiple votes error:', error)
    
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
