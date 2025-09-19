import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { 
  calculateEngagementRate, 
  getVotingTrends, 
  analyzeOptions, 
  generateInsights,
  calculateEngagementMetrics 
} from '@/lib/analytics';
import { AnalyticsData, TimeFrame } from '@/types/analytics';
import { ApiResponse } from '@/lib/api-response';
import { AppError } from '@/lib/errors';

/**
 * API endpoint for fetching poll analytics data.
 * Only accessible by the poll creator.
 */
export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const supabase = createServerSupabaseClient();
    const pollId = params.id;
    const { searchParams } = new URL(request.url);
    const timeFrame = (searchParams.get('timeFrame') as TimeFrame) || 'day';
    const includeAnonymous = searchParams.get('includeAnonymous') === 'true';

    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new AppError('Authentication required', 'UNAUTHORIZED', 401);
    }

    // Fetch poll and verify ownership
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select(`
        *,
        poll_options (*)
      `)
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      throw new AppError('Poll not found', 'POLL_NOT_FOUND', 404);
    }

    // Verify user is the poll creator
    if ((poll as any).created_by !== user.id) {
      throw new AppError('You are not authorized to view analytics for this poll', 'FORBIDDEN', 403);
    }

    // Fetch votes with optional anonymous filtering
    let votesQuery = supabase
      .from('votes')
      .select(`
        *,
        poll_options!inner(*)
      `)
      .eq('poll_id', pollId)
      .order('created_at', { ascending: true });

    if (!includeAnonymous) {
      votesQuery = votesQuery.not('user_id', 'is', null);
    }

    const { data: votes, error: votesError } = await votesQuery;

    if (votesError) {
      console.error('Votes fetch error:', votesError);
      throw new AppError('Failed to fetch vote data', 'DATABASE_ERROR', 500);
    }

    // Calculate analytics data
    const totalVotes = votes?.length || 0;
    const uniqueVoters = new Set(
      votes?.map((vote: { user_id?: string; session_id?: string }) => vote.user_id || vote.session_id) || []
    ).size;
    
    const engagementRate = calculateEngagementRate(poll, votes || []);
    const votingTrends = getVotingTrends(votes || [], timeFrame);
    const optionBreakdown = analyzeOptions(poll, votes || []);
    const engagementMetrics = calculateEngagementMetrics(poll, votes || []);

    // Build analytics data object
    const analyticsData: AnalyticsData = {
      pollId,
      totalVotes,
      uniqueVoters,
      engagementRate,
      votingTrends,
      optionBreakdown,
      timeSeriesData: votes?.map(vote => ({
        timestamp: new Date((vote as any).created_at),
        votes: 1,
        optionId: (vote as any).poll_options.id
      })) || [],
      insights: [],
      lastUpdated: new Date()
    };

    // Generate insights
    analyticsData.insights = generateInsights(poll, analyticsData);

    // Cache the response for 5 minutes
    const response = ApiResponse.success(analyticsData, 'Analytics data retrieved successfully');
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    
    return response;

  } catch (error) {
    console.error('Analytics API error:', error);
    
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.code);
    }
    
    return ApiResponse.error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}

/**
 * API endpoint for exporting analytics data.
 * Supports CSV and JSON formats.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const supabase = createServerSupabaseClient();
    const pollId = params.id;
    const body = await request.json();
    const { format = 'json', includeRawData = false } = body;

    // Authentication and authorization (same as GET)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new AppError('Authentication required', 'UNAUTHORIZED', 401);
    }

    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      throw new AppError('Poll not found', 'POLL_NOT_FOUND', 404);
    }

    if ((poll as any).created_by !== user.id) {
      throw new AppError('You are not authorized to export analytics for this poll', 'FORBIDDEN', 403);
    }

    // Get analytics data (reuse GET logic)
    const getResponse = await GET(request, { params });
    const analyticsData = await getResponse.json();

    if (!analyticsData.success) {
      return getResponse;
    }

    const data = analyticsData.data;

    if (format === 'csv') {
      const csvData = generateCSVExport(data, includeRawData);
      
      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="poll-${pollId}-analytics.csv"`
        }
      });
    }

    // Default to JSON export
    return ApiResponse.success(data, 'Analytics data exported successfully');

  } catch (error) {
    console.error('Analytics export error:', error);
    
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.code);
    }
    
    return ApiResponse.error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}

// Helper function to generate CSV export
function generateCSVExport(analyticsData: AnalyticsData, includeRawData: boolean): string {
  const lines: string[] = [];
  
  // Header information
  lines.push('Poll Analytics Report');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Poll ID: ${analyticsData.pollId}`);
  lines.push(`Total Votes: ${analyticsData.totalVotes}`);
  lines.push(`Unique Voters: ${analyticsData.uniqueVoters}`);
  lines.push(`Engagement Rate: ${analyticsData.engagementRate.toFixed(2)}%`);
  lines.push('');
  
  // Option breakdown
  lines.push('Option Analysis');
  lines.push('Option,Votes,Percentage,Trend');
  analyticsData.optionBreakdown.forEach(option => {
    lines.push(`"${option.optionText}",${option.voteCount},${option.percentage.toFixed(2)}%,${option.trend}`);
  });
  lines.push('');
  
  // Voting trends
  if (analyticsData.votingTrends.length > 0) {
    lines.push('Voting Trends');
    lines.push('Date,Daily Votes,Cumulative Votes');
    analyticsData.votingTrends.forEach(trend => {
      lines.push(`${trend.date},${trend.votes},${trend.cumulativeVotes}`);
    });
    lines.push('');
  }
  
  // Insights
  if (analyticsData.insights.length > 0) {
    lines.push('Key Insights');
    lines.push('Type,Title,Description,Value');
    analyticsData.insights.forEach(insight => {
      lines.push(`${insight.type},"${insight.title}","${insight.description}",${insight.value}`);
    });
  }
  
  return lines.join('\n');
}