import { NextRequest } from 'next/server';
import { createApiResponse, handleApiError } from '@/lib/api-response';
import { createPollSchema } from '@/lib/validations';
import { AuthenticationError, ValidationError, ConflictError } from '@/lib/errors';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const supabase = createServerComponentClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      throw new AuthenticationError('Authentication required to create polls');
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createPollSchema.parse(body);

    // Check for duplicate poll titles by the same user
    const { data: existingPoll } = await supabase
      .from('polls')
      .select('id')
      .eq('title', validatedData.title)
      .eq('created_by', session.user.id)
      .single();

    if (existingPoll) {
      throw new ConflictError('A poll with this title already exists');
    }

    // Create the poll
    const { data: poll, error: createError } = await supabase
      .from('polls')
      .insert({
        title: validatedData.title,
        description: validatedData.description,
        options: validatedData.options.map((text, index) => ({
          id: crypto.randomUUID(),
          text,
          votes: 0,
          order: index
        })),
        created_by: session.user.id,
        allow_multiple_votes: validatedData.allow_multiple_votes,
        require_authentication: validatedData.require_authentication,
        expires_at: validatedData.expires_at
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Database error: ${createError.message}`);
    }

    return createApiResponse(
      poll,
      201,
      'Poll created successfully'
    );

  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/polls',
      method: 'POST',
      timestamp: new Date().toISOString()
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search');
    
    let query = supabase
      .from('polls')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (status !== 'all') {
      if (status === 'active') {
        query = query.eq('is_active', true);
      } else if (status === 'expired') {
        query = query.lt('expires_at', new Date().toISOString());
      }
    }

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: polls, error, count } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return createApiResponse(
      polls || [],
      200,
      'Polls retrieved successfully',
      {
        total: count || 0,
        page,
        limit,
        hasMore: count ? (page * limit) < count : false
      }
    );

  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/polls',
      method: 'GET',
      timestamp: new Date().toISOString()
    });
  }
}