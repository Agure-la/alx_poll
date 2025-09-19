import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUser } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const pollId = params.id;

    const { data: comments, error } = await supabase
      .from('poll_comments')
      .select(`
        id,
        content,
        created_at,
        likes,
        parent_id,
        author:profiles(id, name, avatar_url),
        replies:poll_comments(id, content, created_at, author:profiles(id, name, avatar_url))
      `)
      .eq('poll_id', pollId)
      .is('parent_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: comments });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    const pollId = params.id;
    const { content, parent_id } = await request.json();

    const { data: comment, error } = await supabase
      .from('poll_comments')
      .insert({
        poll_id: pollId,
        content,
        author_id: user.id,
        parent_id: parent_id || null
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: comment });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}