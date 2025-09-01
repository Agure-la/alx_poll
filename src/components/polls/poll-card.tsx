"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Poll } from "@/types";
import { formatDate, calculateTotalVotes, isExpired } from "@/lib/utils";

interface PollCardProps {
  poll: Poll;
}

export function PollCard({ poll }: PollCardProps) {
  const totalVotes = calculateTotalVotes(poll.options);
  const expired = poll.expiresAt ? isExpired(poll.expiresAt) : false;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{poll.title}</CardTitle>
            {poll.description && (
              <CardDescription>{poll.description}</CardDescription>
            )}
          </div>
          <div className="flex gap-2">
            {!poll.isActive && (
              <Badge variant="secondary">Inactive</Badge>
            )}
            {expired && (
              <Badge variant="destructive">Expired</Badge>
            )}
            {poll.allowMultipleVotes && (
              <Badge variant="outline" className="text-xs">Multiple Choice</Badge>
            )}
            {poll.requireAuthentication && (
              <Badge variant="outline" className="text-xs">Login Required</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{totalVotes} votes</span>
            <span>Created {formatDate(poll.createdAt)}</span>
          </div>
          
          <div className="space-y-2">
            {poll.options.slice(0, 2).map((option) => (
              <div key={option.id} className="text-sm">
                <div className="flex justify-between mb-1">
                  <span>{option.text}</span>
                  <span>{option.votes} votes</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {poll.options.length > 2 && (
              <p className="text-xs text-muted-foreground">
                +{poll.options.length - 2} more options
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button asChild className="flex-1">
              <Link href={`/polls/${poll.id}`}>
                View Poll
              </Link>
            </Button>
            {poll.isActive && !expired && (
              <Button variant="outline" asChild>
                <Link href={`/polls/${poll.id}`}>
                  Vote Now
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
