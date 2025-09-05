import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import { voteSchema, multipleVoteSchema } from '@/lib/validations'

/**
 * API endpoint for submitting a single vote on a poll.
 * @param request The incoming request object.
 * @returns A response object with the new vote or an error message.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // We parse and validate the request body using a Zod schema.
    const body = await request.json()
    const validatedData = voteSchema.parse(body)

    // We get the user's IP address and user agent from the request headers.
    // This information can be used for analytics or to prevent duplicate votes.
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // We check if the poll exists and is currently active.
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

    // We check if the poll has expired.
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Poll has expired' },
        { status: 400 }
      )
    }

    // If the poll requires authentication, we check if the user is logged in.
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

    // We check if the user has already voted on this poll.
    // This is to prevent users from voting multiple times.
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

    // We verify that the selected option exists and belongs to the poll.
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

    // Once all the checks have passed, we submit the vote to the database.
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

/**
 * API endpoint for submitting multiple votes on a poll.
 * This is only for polls that have `allow_multiple_votes` set to `true`.
 * @param request The incoming request object.
 * @returns A response object with the new votes or an error message.
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // We parse and validate the request body using a Zod schema.
    const body = await request.json()
    const validatedData = multipleVoteSchema.parse(body)

    // We get the authenticated user.
    // Multiple votes can only be submitted by authenticated users.
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required for multiple votes' },
        { status: 401 }
      )
    }

    // We check if the poll exists, is active, and allows multiple votes.
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

    // We check if the poll has expired.
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Poll has expired' },
        { status: 400 }
      )
    }

    // We check if the user has already voted on this poll.
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

    // We verify that all the selected options exist and belong to the poll.
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

    // We get the user's IP address and user agent.
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // We submit the multiple votes to the database.
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