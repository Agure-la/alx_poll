import { Poll, Vote } from '@/types';
import { AnalyticsData, VotingTrend, OptionAnalytics, Insight, TimeFrame, EngagementMetrics } from '@/types/analytics';

/**
 * Calculate engagement rate based on poll views and votes
 */
export function calculateEngagementRate(poll: Poll, votes: Vote[]): number {
  if (!poll.viewCount || poll.viewCount === 0) return 0;
  const uniqueVoters = new Set(votes.map(vote => vote.userId)).size;
  return (uniqueVoters / (poll.views || 0)) * 100;
}

/**
 * Generate voting trends over time
 */
export function getVotingTrends(votes: Vote[], timeFrame: TimeFrame): VotingTrend[] {
  const sortedVotes = votes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const trends: VotingTrend[] = [];
  const groupedVotes = groupVotesByTimeFrame(sortedVotes, timeFrame);
  
  let cumulativeVotes = 0;
  
  for (const [date, dayVotes] of Object.entries(groupedVotes)) {
    cumulativeVotes += dayVotes.length;
    trends.push({
      date,
      votes: dayVotes.length,
      cumulativeVotes
    });
  }
  
  return trends;
}

/**
 * Analyze individual option performance
 */
export function analyzeOptions(poll: Poll, votes: Vote[]): OptionAnalytics[] {
  const totalVotes = votes.length;
  const optionVotes = votes.reduce((acc, vote) => {
    acc[vote.optionId] = (acc[vote.optionId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return poll.options.map(option => {
    const voteCount = optionVotes[option.id] || 0;
    const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
    
    return {
      optionId: option.id,
      optionText: option.text,
      voteCount,
      percentage,
      trend: calculateOptionTrend(option.id, votes)
    };
  });
}

/**
 * Generate insights based on analytics data
 */
export function generateInsights(poll: Poll, analytics: AnalyticsData): Insight[] {
  const insights: Insight[] = [];
  
  // Engagement insight
  if (analytics.engagementRate > 50) {
    insights.push({
      id: 'high-engagement',
      type: 'engagement',
      title: 'High Engagement',
      description: 'Your poll has excellent engagement with over 50% of viewers voting',
      value: `${analytics.engagementRate.toFixed(1)}%`,
      trend: 'up',
      severity: 'success'
    });
  } else if (analytics.engagementRate < 20) {
    insights.push({
      id: 'low-engagement',
      type: 'engagement',
      title: 'Low Engagement',
      description: 'Consider improving your poll title or description to increase engagement',
      value: `${analytics.engagementRate.toFixed(1)}%`,
      trend: 'down',
      severity: 'warning'
    });
  }
  
  // Voting trend insight
  const recentTrends = analytics.votingTrends.slice(-7); // Last 7 periods
  const isIncreasing = recentTrends.length > 1 && 
    (recentTrends[recentTrends.length - 1]?.votes ?? 0) > (recentTrends[0]?.votes ?? 0);
    
  if (isIncreasing) {
    insights.push({
      id: 'increasing-votes',
      type: 'trend',
      title: 'Growing Interest',
      description: 'Your poll is gaining momentum with increasing votes over time',
      value: 'Trending Up',
      trend: 'up',
      severity: 'success'
    });
  }
  
  // Option performance insight
  const topOption = analytics.optionBreakdown.reduce((max, option) => 
    option.voteCount > max.voteCount ? option : max
  );
  
  if (topOption.percentage > 70) {
    insights.push({
      id: 'dominant-option',
      type: 'performance',
      title: 'Clear Winner',
      description: `"${topOption.optionText}" is leading with overwhelming support`,
      value: `${topOption.percentage.toFixed(1)}%`,
      severity: 'info'
    });
  }
  
  return insights;
}

/**
 * Calculate engagement metrics
 */
export function calculateEngagementMetrics(poll: Poll, votes: Vote[]): EngagementMetrics {
  const uniqueVoters = new Set(votes.map(vote => vote.userId || vote.sessionId)).size;
  const viewsToVotes = poll.views ? (uniqueVoters / poll.views) * 100 : 0;
  
  // Calculate completion rate (users who voted vs users who started)
  const completionRate = poll.startedCount ? (uniqueVoters / poll.startedCount) * 100 : 100;
  
  // Calculate average time to vote (simplified)
  const averageTimeToVote = votes.length > 0 ? 
    votes.reduce((sum, vote) => sum + (vote.timeToVote || 30), 0) / votes.length : 30;
  
  // Return visitors (users who voted multiple times)
  const voterCounts = votes.reduce((acc, vote) => {
    const voterId = vote.userId || vote.sessionId;
    acc[voterId] = (acc[voterId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const returnVisitors = Object.values(voterCounts).filter(count => count > 1).length;
  
  return {
    viewsToVotes,
    completionRate,
    averageTimeToVote,
    returnVisitors
  };
}

// Helper functions
function groupVotesByTimeFrame(votes: Vote[], timeFrame: TimeFrame): Record<string, Vote[]> {
  return votes.reduce((acc, vote) => {
    const date = new Date(vote.createdAt);
    let key: string;
    
    switch (timeFrame) {
      case 'hour':
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
        break;
      case 'day':
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
        break;
      case 'month':
        key = `${date.getFullYear()}-${date.getMonth()}`;
        break;
      default:
        key = date.toISOString().split('T')[0] || date.toDateString();
    }
    
    if (!acc[key]) acc[key] = [];
    acc[key]?.push(vote) ?? (acc[key] = [vote]);
    return acc;
  }, {} as Record<string, Vote[]>);
}

function calculateOptionTrend(optionId: string, votes: Vote[]): 'increasing' | 'decreasing' | 'stable' {
  const optionVotes = votes.filter(vote => vote.optionId === optionId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  
  if (optionVotes.length < 2) return 'stable';
  
  const midPoint = Math.floor(optionVotes.length / 2);
  const firstHalf = optionVotes.slice(0, midPoint).length;
  const secondHalf = optionVotes.slice(midPoint).length;
  
  if (secondHalf > firstHalf * 1.2) return 'increasing';
  if (secondHalf < firstHalf * 0.8) return 'decreasing';
  return 'stable';
}

/**
 * Format analytics data for charts
 */
export function formatChartData(data: OptionAnalytics[]): any[] {
  return data.map((option, index) => ({
    name: option.optionText,
    value: option.voteCount,
    percentage: option.percentage,
    color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`
  }));
}

/**
 * Export analytics data to CSV format
 */
export function exportToCSV(analytics: AnalyticsData): string {
  const headers = ['Option', 'Votes', 'Percentage', 'Trend'];
  const rows = analytics.optionBreakdown.map(option => [
    option.optionText,
    option.voteCount.toString(),
    `${option.percentage.toFixed(2)}%`,
    option.trend
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}