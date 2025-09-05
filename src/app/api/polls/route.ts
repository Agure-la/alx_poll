import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import { createPollSchema, voteSchema, multipleVoteSchema } from '@/lib/validations'
import { generateQRCode } from '@/lib/supabase/client'

/**
 * API endpoint for creating a new poll.
 * @param request The incoming request object.
 * @returns A response object with the created poll or an error message.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // First, we get the authenticated user.
    // This is necessary to associate the poll with a creator.
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // We parse and validate the request body using a Zod schema.
    // This ensures that the data is in the correct format before we process it.
    const body = await request.json()
    const validatedData = createPollSchema.parse(body)

    // Once the data is validated, we create the poll in the database.
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

    // Next, we create the poll options in the database.
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

    // We also generate a QR code for the poll.
    // This can be used to easily share the poll with others.
    try {
      await generateQRCode(poll.id, poll.share_token)
    } catch (qrError) {
      console.error('QR code generation error:', qrError)
      // We don't want to fail the request if QR code generation fails,
      // so we just log the error and continue.
    }

    return NextResponse.json({
      success: true,
      data: poll
    })

  } catch (error: any) {
    console.error('Create poll error:', error)
    
    // If the error is a Zod validation error, we return a 400 response
    // with the validation error details.
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
 * API endpoint for fetching a list of polls.
 * @param request The incoming request object.
 * @returns A response object with the list of polls or an error message.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    
    // We get the query parameters from the request URL.
    // These parameters are used to filter and paginate the results.
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status') || 'all'
    const query = searchParams.get('query') || ''

    let pollsQuery = supabase
      .from('poll_results')
      .select('*, created_by')

    // We apply the filters to the query based on the query parameters.
    if (status === 'active') {
      pollsQuery = pollsQuery.eq('is_active', true)
    } else if (status === 'expired') {
      pollsQuery = pollsQuery.lt('expires_at', new Date().toISOString())
    }

    if (query) {
      pollsQuery = pollsQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    }

    // We execute the query and return the results.
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