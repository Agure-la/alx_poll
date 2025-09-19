"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Chart, MetricCard } from "@/components/ui/chart";
import { PollResultCharts } from "@/components/polls/poll-result-charts";
import { CommentsSection } from "@/components/polls/comments-section";
import { QRCodeGenerator } from "@/components/polls/qr-code-generator";
import { useAuth } from "@/contexts/auth-context";
import { Poll } from "@/types/analytics";
interface PollAnalytics {
  totalVotes: number;
  uniqueVoters: number;
  engagementRate: number;
  commentsCount: number;
  votingTrend: Array<{
    date: string;
    votes: number;
  }>;
  optionBreakdown: Array<{
    option: string;
    votes: number;
  }>;
  insights: Array<{
    title: string;
    description: string;
    type: string;
  }>;
}
import { ArrowLeft, Download, Share2, MessageSquare, BarChart3, Users, TrendingUp } from "lucide-react";

export default function PollAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [analytics, setAnalytics] = useState<PollAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pollId = params.id as string;
  const isAdmin = user?.role === 'admin';
  const canViewAnalytics = isAdmin || poll?.created_by === user?.id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [pollResponse, analyticsResponse] = await Promise.all([
          fetch(`/api/polls/${pollId}`),
          fetch(`/api/polls/${pollId}/analytics`)
        ]);

        if (!pollResponse.ok || !analyticsResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const pollData = await pollResponse.json();
        const analyticsData = await analyticsResponse.json();

        setPoll(pollData.data);
        setAnalytics(analyticsData.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (pollId) {
      fetchData();
    }
  }, [pollId]);

  const handleExportData = async () => {
    try {
      const response = await fetch(`/api/polls/${pollId}/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'csv' })
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `poll-${pollId}-analytics.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !poll || !analytics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-600">{error || 'Poll not found'}</p>
            <Button onClick={() => router.back()} className="mt-4 mx-auto block">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canViewAnalytics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-amber-600">You don't have permission to view these analytics.</p>
            <Button onClick={() => router.back()} className="mt-4 mx-auto block">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{poll.title}</h1>
            <p className="text-muted-foreground">Analytics Dashboard</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <QRCodeGenerator pollId={pollId} pollTitle={poll.title} />
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {isAdmin && (
            <Badge variant="secondary">
              <Users className="h-3 w-3 mr-1" />
              Admin View
            </Badge>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Votes"
          value={analytics.totalVotes}
          icon={<BarChart3 className="h-4 w-4" />}
          trend={analytics.votingTrend.length > 1 ? 
            analytics.votingTrend[analytics.votingTrend.length - 1]?.votes -
            analytics.votingTrend[analytics.votingTrend.length - 2]?.votes ?? 0 : 0
          }
        />
        <MetricCard
          title="Unique Voters"
          value={analytics.uniqueVoters}
          icon={<Users className="h-4 w-4" />}
          trend={analytics.engagementRate > 50 ? 1 : -1}
        />
        <MetricCard
          title="Engagement Rate"
          value={`${analytics.engagementRate.toFixed(1)}%`}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={analytics.engagementRate > 30 ? 1 : -1}
        />
        <MetricCard
          title="Comments"
          value={analytics.commentsCount || 0}
          icon={<MessageSquare className="h-4 w-4" />}
          trend={0}
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Voting Trend</CardTitle>
                <CardDescription>Votes over time</CardDescription>
              </CardHeader>
              <CardContent>
                <Chart
                  data={analytics.votingTrend}
                  type="line"
                  xKey="date"
                  yKey="votes"
                  height={300}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Option Breakdown</CardTitle>
                <CardDescription>Vote distribution by option</CardDescription>
              </CardHeader>
              <CardContent>
                <Chart
                  data={analytics.optionBreakdown}
                  type="pie"
                  xKey="option"
                  yKey="votes"
                  height={300}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results">
          <PollResultCharts poll={poll} analytics={analytics} />
        </TabsContent>

        <TabsContent value="comments">
          <CommentsSection pollId={pollId} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics.insights.map((insight, index) => (
                  <div key={index} className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    <Badge variant="outline" className="mt-2">
                      {insight.type}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Response Rate</span>
                    <span className="font-medium">{analytics.engagementRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Time to Vote</span>
                    <span className="font-medium">2.3 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Peak Voting Hour</span>
                    <span className="font-medium">2:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mobile vs Desktop</span>
                    <span className="font-medium">65% / 35%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}