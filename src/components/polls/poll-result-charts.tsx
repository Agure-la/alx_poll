"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Chart } from "@/components/ui/chart";
import { Poll, PollAnalytics } from "@/types/analytics";
import { BarChart, PieChart, LineChart, TrendingUp } from "lucide-react";

interface PollResultChartsProps {
  poll: Poll;
  analytics: PollAnalytics;
}

export function PollResultCharts({ poll, analytics }: PollResultChartsProps) {
  const chartData = analytics.optionBreakdown.map(option => ({
    name: option.option,
    votes: option.votes,
    percentage: ((option.votes / analytics.totalVotes) * 100).toFixed(1)
  }));

  return (
    <div className="space-y-6">
      {/* Results Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Vote Distribution
            </CardTitle>
            <CardDescription>Percentage breakdown of all votes</CardDescription>
          </CardHeader>
          <CardContent>
            <Chart
              data={chartData}
              type="pie"
              xKey="name"
              yKey="votes"
              height={350}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Vote Counts
            </CardTitle>
            <CardDescription>Absolute number of votes per option</CardDescription>
          </CardHeader>
          <CardContent>
            <Chart
              data={chartData}
              type="bar"
              xKey="name"
              yKey="votes"
              height={350}
            />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Results</CardTitle>
          <CardDescription>Complete breakdown with percentages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chartData.map((option, index) => {
              const isWinning = option.votes === Math.max(...chartData.map(d => d.votes));
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{option.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {option.votes} votes ({option.percentage}%)
                      </span>
                      {isWinning && <TrendingUp className="h-4 w-4 text-green-600" />}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isWinning ? 'bg-green-600' : 'bg-blue-600'
                      }`}
                      style={{ width: `${option.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Voting Timeline */}
      {analytics.votingTrend.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Voting Timeline
            </CardTitle>
            <CardDescription>How votes accumulated over time</CardDescription>
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
      )}
    </div>
  );
}