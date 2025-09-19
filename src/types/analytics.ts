export interface AnalyticsData {
  pollId: string;
  totalVotes: number;
  uniqueVoters: number;
  engagementRate: number;
  votingTrends: VotingTrend[];
  optionBreakdown: OptionAnalytics[];
  timeSeriesData: TimeSeriesPoint[];
  insights: Insight[];
  lastUpdated: Date;
}

export interface VotingTrend {
  date: string;
  votes: number;
  cumulativeVotes: number;
}

export interface OptionAnalytics {
  optionId: string;
  optionText: string;
  voteCount: number;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface TimeSeriesPoint {
  timestamp: Date;
  votes: number;
  optionId?: string;
}

export interface Insight {
  id: string;
  type: 'engagement' | 'trend' | 'performance' | 'demographic';
  title: string;
  description: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  severity: 'info' | 'warning' | 'success';
}

export interface ChartData {
  name: string;
  value: number;
  percentage?: number;
  color?: string;
}

export interface EngagementMetrics {
  viewsToVotes: number;
  completionRate: number;
  averageTimeToVote: number;
  returnVisitors: number;
}

export type TimeFrame = 'hour' | 'day' | 'week' | 'month';
export type ChartType = 'bar' | 'pie' | 'line' | 'area';

export interface AnalyticsFilters {
  timeFrame: TimeFrame;
  startDate?: Date;
  endDate?: Date;
  includeAnonymous?: boolean;
}