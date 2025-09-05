import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { createPollSchema } from '@/lib/validations';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const pollId = params.id;

    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('created_by')
      .eq('id', pollId)
      .single();

    if (pollError) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    if (poll.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId);

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete poll' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete poll error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const pollId = params.id;
    const body = await request.json();
    const validatedData = createPollSchema.parse(body);

    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('created_by')
      .eq('id', pollId)
      .single();

    if (pollError) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    if (poll.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: updatedPoll, error: updateError } = await supabase
      .from('polls')
      .update({
        title: validatedData.title,
        description: validatedData.description,
        expires_at: validatedData.expires_at,
        allow_multiple_votes: validatedData.allow_multiple_votes,
        require_authentication: validatedData.require_authentication,
      })
      .eq('id', pollId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update poll' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updatedPoll });
  } catch (error) {
    console.error('Update poll error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
