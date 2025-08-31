"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PollDetails } from "@/components/polls/poll-details";
import { Poll } from "@/types";
import { PollAPI } from "@/lib/api";

export default function PollPage() {
  const params = useParams();
  const router = useRouter();
  const pollId = params.id as string;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPoll = async () => {
      if (!pollId) return;

      try {
        const fetchedPoll = await PollAPI.getPoll(pollId);
        if (fetchedPoll) {
          setPoll(fetchedPoll);
          // TODO: Fetch user's vote for this poll
          // const userVoteData = await PollAPI.getUserVote(pollId);
          // setUserVote(userVoteData?.optionId || null);
        } else {
          setError("Poll not found");
        }
      } catch (err) {
        setError("Failed to load poll");
        console.error("Error loading poll:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPoll();
  }, [pollId]);

  const handleVoteSuccess = () => {
    // Reload the poll to get updated vote counts
    if (pollId) {
      PollAPI.getPoll(pollId).then((updatedPoll) => {
        if (updatedPoll) {
          setPoll(updatedPoll);
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">Loading poll...</div>
        </div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">
            {error || "Poll Not Found"}
          </h1>
          <p className="text-gray-600 mb-4">
            {error === "Poll not found"
              ? "The poll you're looking for doesn't exist or has been removed."
              : "There was an error loading the poll. Please try again."}
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.back()}>Go Back</Button>
            <Button variant="outline" onClick={() => router.push("/polls")}>
              Browse Polls
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-4"
          >
            ← Back
          </Button>
        </div>

        <PollDetails
          poll={poll}
          userVote={userVote}
          onVoteSuccess={handleVoteSuccess}
        />

        <div className="mt-6 text-center">
          <Button variant="outline" onClick={() => router.push("/polls")}>
            Browse More Polls
          </Button>
        </div>
      </div>
    </div>
  );
}
