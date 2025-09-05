import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import { createPollSchema, voteSchema, multipleVoteSchema } from '@/lib/validations'

/**
 * API endpoint for fetching a single poll by its ID.
 * @param request The incoming request object.
 * @param context The context object, which contains the poll ID.
 * @returns A response object with the poll or an error message.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const pollId = params.id

    // We fetch the poll from the database using its ID.
    const { data: poll, error } = await supabase
      .from('polls')
      .select(`
        *,
        poll_options (*)
      `)
      .eq('id', pollId)
      .single()

    if (error || !poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: poll })
  } catch (error) {
    console.error('Get poll error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * API endpoint for updating a poll.
 * @param request The incoming request object.
 * @param context The context object, which contains the poll ID.
 * @returns A response object with the updated poll or an error message.
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const pollId = params.id

    // First, we get the authenticated user.
    // Only the poll creator can update the poll.
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // We fetch the poll from the database to check if the user is the creator.
    const { data: existingPoll, error: fetchError } = await supabase
      .from('polls')
      .select('created_by')
      .eq('id', pollId)
      .single()

    if (fetchError || !existingPoll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    if (existingPoll.created_by !== user.id) {
      return NextResponse.json({ error: 'You are not authorized to update this poll' }, { status: 403 })
    }

    // We parse and validate the request body.
    const body = await request.json()
    const validatedData = createPollSchema.parse(body)

    // We update the poll in the database.
    const { data: updatedPoll, error: updateError } = await supabase
      .from('polls')
      .update({
        title: validatedData.title,
        description: validatedData.description,
        allow_multiple_votes: validatedData.allow_multiple_votes,
        require_authentication: validatedData.require_authentication,
        expires_at: validatedData.expires_at
      })
      .eq('id', pollId)
      .select()
      .single()

    if (updateError) {
      console.error('Poll update error:', updateError)
      return NextResponse.json({ error: 'Failed to update poll' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: updatedPoll })
  } catch (error: any) {
    console.error('Update poll error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * API endpoint for deleting a poll.
 * @param request The incoming request object.
 * @param context The context object, which contains the poll ID.
 * @returns A response object indicating success or failure.
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const pollId = params.id

    // First, we get the authenticated user.
    // Only the poll creator can delete the poll.
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // We fetch the poll from the database to check if the user is the creator.
    const { data: existingPoll, error: fetchError } = await supabase
      .from('polls')
      .select('created_by')
      .eq('id', pollId)
      .single()

    if (fetchError || !existingPoll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    if (existingPoll.created_by !== user.id) {
      return NextResponse.json({ error: 'You are not authorized to delete this poll' }, { status: 403 })
    }

    // We delete the poll from the database.
    const { error: deleteError } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId)

    if (deleteError) {
      console.error('Poll delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete poll' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete poll error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}