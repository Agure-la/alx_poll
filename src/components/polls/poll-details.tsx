"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Poll } from "@/types";
import { formatDate, calculateTotalVotes, calculatePercentage, isExpired } from "@/lib/utils";
import { PollAPI } from "@/lib/api";

interface PollDetailsProps {
  poll: Poll;
  userVote?: string | null;
  onVoteSuccess?: () => void;
}

export function PollDetails({ poll, userVote, onVoteSuccess }: PollDetailsProps) {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState("");

  const totalVotes = calculateTotalVotes(poll.options);
  const expired = poll.expiresAt ? isExpired(poll.expiresAt) : false;
  const canVote = poll.isActive && !expired && !userVote;

  const handleVote = async () => {
    if (!selectedOption) {
      setError("Please select an option");
      return;
    }

    setIsVoting(true);
    setError("");

    try {
      const response = await PollAPI.vote(poll.id, selectedOption);
      if (response.success) {
        onVoteSuccess?.();
      } else {
        setError(response.error || "Failed to vote");
      }
    } catch (err) {
      setError("Failed to vote. Please try again.");
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl">{poll.title}</CardTitle>
            <div className="flex gap-2">
              {!poll.isActive && (
                <Badge variant="secondary">Inactive</Badge>
              )}
              {expired && (
                <Badge variant="destructive">Expired</Badge>
              )}
              {userVote && (
                <Badge variant="outline">Voted</Badge>
              )}
            </div>
          </div>
          {poll.description && (
            <CardDescription className="text-base">
              {poll.description}
            </CardDescription>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{totalVotes} total votes</span>
            <span>•</span>
            <span>Created {formatDate(poll.createdAt)}</span>
            {poll.expiresAt && (
              <>
                <span>•</span>
                <span>
                  {expired ? "Expired" : "Expires"} {formatDate(poll.expiresAt)}
                </span>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {poll.options.map((option) => {
            const percentage = calculatePercentage(option.votes, totalVotes);
            const isSelected = selectedOption === option.id;
            const isUserVote = userVote === option.id;

            return (
              <div key={option.id} className="space-y-2">
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    canVote
                      ? isSelected
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                      : isUserVote
                      ? "border-primary bg-primary/10"
                      : "border-gray-200"
                  } ${!canVote ? "cursor-default" : ""}`}
                  onClick={() => canVote && setSelectedOption(option.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{option.text}</span>
                    <div className="flex items-center gap-2">
                      {isUserVote && (
                        <Badge variant="outline" className="text-xs">
                          Your vote
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {option.votes} votes ({percentage}%)
                      </span>
                    </div>
                  </div>
                  {(userVote || !canVote) && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          isUserVote ? "bg-primary" : "bg-gray-400"
                        }`}
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {canVote && (
          <div className="space-y-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {error}
              </div>
            )}
            <Button
              onClick={handleVote}
              disabled={!selectedOption || isVoting}
              className="w-full"
            >
              {isVoting ? "Submitting vote..." : "Submit Vote"}
            </Button>
          </div>
        )}

        {userVote && (
          <div className="text-center text-sm text-muted-foreground bg-green-50 p-3 rounded">
            Thank you for voting! You can view the results above.
          </div>
        )}

        {!poll.isActive && (
          <div className="text-center text-sm text-muted-foreground bg-gray-50 p-3 rounded">
            This poll is no longer active.
          </div>
        )}

        {expired && (
          <div className="text-center text-sm text-muted-foreground bg-orange-50 p-3 rounded">
            This poll has expired and no longer accepts votes.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
