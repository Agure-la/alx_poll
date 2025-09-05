"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Poll } from "@/types";
import { formatDate, calculateTotalVotes, calculatePercentage, isExpired } from "@/lib/utils";
import { PollAPI } from "@/lib/api";

/**
 * The properties for the `PollDetails` component.
 */
interface PollDetailsProps {
  /** The poll to display. */
  poll: Poll;
  /** The user's vote for the poll. */
  userVote?: string | null;
  /** The user's votes for the poll (for multiple choice polls). */
  userVotes?: string[];
  /** A callback function that is called when the user votes successfully. */
  onVoteSuccess?: () => void;
  /** Whether the user is authenticated. */
  isAuthenticated?: boolean;
}

/**
 * A component that displays the details of a poll.
 * It allows users to vote on the poll and view the results.
 * @param {PollDetailsProps} props - The component properties.
 */
export function PollDetails({ poll, userVote, userVotes = [], onVoteSuccess, isAuthenticated = false }: PollDetailsProps) {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>(userVotes);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState("");

  const totalVotes = calculateTotalVotes(poll.options);
  const expired = poll.expiresAt ? isExpired(poll.expiresAt) : false;
  const hasVoted = poll.allowMultipleVotes ? userVotes.length > 0 : userVote;
  const canVote = poll.isActive && !expired && !hasVoted;
  
  // We check if the poll requires authentication and if the user is authenticated.
  const needsAuth = poll.requireAuthentication && !isAuthenticated;

  /**
   * Handles the vote submission.
   * It calls the `vote` or `voteMultiple` method from the `PollAPI` and calls the `onVoteSuccess` callback.
   */
  const handleVote = async () => {
    if (poll.allowMultipleVotes) {
      if (selectedOptions.length === 0) {
        setError("Please select at least one option");
        return;
      }
    } else {
      if (!selectedOption) {
        setError("Please select an option");
        return;
      }
    }

    setIsVoting(true);
    setError("");

    try {
      if (poll.allowMultipleVotes) {
        // If the poll allows multiple votes, we call the `voteMultiple` method.
        for (const optionId of selectedOptions) {
          await PollAPI.vote(poll.id, optionId);
        }
      } else {
        // Otherwise, we call the `vote` method.
        const response = await PollAPI.vote(poll.id, selectedOption);
        if (!response.success) {
          setError(response.error || "Failed to vote");
          return;
        }
      }
      onVoteSuccess?.();
    } catch (err) {
      setError("Failed to vote. Please try again.");
    } finally {
      setIsVoting(false);
    }
  };

  /**
   * Handles the selection of a poll option.
   * @param optionId The ID of the option to select.
   */
  const handleOptionToggle = (optionId: string) => {
    if (poll.allowMultipleVotes) {
      // If the poll allows multiple votes, we toggle the option in the `selectedOptions` array.
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      // Otherwise, we set the `selectedOption` to the selected option.
      setSelectedOption(optionId);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl">{poll.title}</CardTitle>
            <div className="flex gap-2">
              {/* We display badges to indicate the poll's status and settings. */}
              {!poll.isActive && (
                <Badge variant="secondary">Inactive</Badge>
              )}
              {expired && (
                <Badge variant="destructive">Expired</Badge>
              )}
              {hasVoted && (
                <Badge variant="outline">Voted</Badge>
              )}
              {poll.allowMultipleVotes && (
                <Badge variant="secondary">Multiple Choice</Badge>
              )}
              {poll.requireAuthentication && (
                <Badge variant="secondary">Login Required</Badge>
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
            const isSelected = poll.allowMultipleVotes 
              ? selectedOptions.includes(option.id)
              : selectedOption === option.id;
            const isUserVote = poll.allowMultipleVotes
              ? userVotes.includes(option.id)
              : userVote === option.id;

            return (
              <div key={option.id} className="space-y-2">
                <div
                  className={`p-4 border rounded-lg transition-colors ${
                    canVote && !needsAuth
                      ? isSelected
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300 cursor-pointer"
                      : isUserVote
                      ? "border-primary bg-primary/10"
                      : "border-gray-200"
                  } ${(!canVote || needsAuth) ? "cursor-default" : ""}`}
                  onClick={() => canVote && !needsAuth && handleOptionToggle(option.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1">
                      {/* If the poll allows multiple votes, we display a checkbox for each option. */}
                      {poll.allowMultipleVotes && canVote && !needsAuth && (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleOptionToggle(option.id)}
                          className="mt-0.5"
                        />
                      )}
                      <span className="font-medium">{option.text}</span>
                    </div>
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
                  {/* If the user has already voted or the poll is not active, we display the results. */}
                  {(hasVoted || !canVote) && (
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

        {/* If the user can vote, we display the vote button. */}
        {canVote && !needsAuth && (
          <div className="space-y-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {error}
              </div>
            )}
            <Button
              onClick={handleVote}
              disabled={
                (poll.allowMultipleVotes ? selectedOptions.length === 0 : !selectedOption) || 
                isVoting
              }
              className="w-full"
            >
              {isVoting ? "Submitting vote..." : "Submit Vote"}
            </Button>
          </div>
        )}

        {/* If the poll requires authentication and the user is not authenticated, we display a message. */}
        {needsAuth && (
          <div className="text-center text-sm text-muted-foreground bg-blue-50 p-3 rounded">
            You must be logged in to vote on this poll.
          </div>
        )}

        {/* If the user has already voted, we display a thank you message. */}
        {hasVoted && (
          <div className="text-center text-sm text-muted-foreground bg-green-50 p-3 rounded">
            Thank you for voting! You can view the results above.
          </div>
        )}

        {/* If the poll is not active, we display a message. */}
        {!poll.isActive && (
          <div className="text-center text-sm text-muted-foreground bg-gray-50 p-3 rounded">
            This poll is no longer active.
          </div>
        )}

        {/* If the poll has expired, we display a message. */}
        {expired && (
          <div className="text-center text-sm text-muted-foreground bg-orange-50 p-3 rounded">
            This poll has expired and no longer accepts votes.
          </div>
        )}
      </CardContent>
    </Card>
  );
}