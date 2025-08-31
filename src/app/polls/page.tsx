"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PollCard } from "@/components/polls/poll-card";
import { Poll } from "@/types";
import { PollAPI } from "@/lib/api";

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [filteredPolls, setFilteredPolls] = useState<Poll[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "expired">("all");

  useEffect(() => {
    const loadPolls = async () => {
      try {
        const fetchedPolls = await PollAPI.getPolls();
        setPolls(fetchedPolls);
        setFilteredPolls(fetchedPolls);
      } catch (error) {
        console.error("Failed to load polls:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPolls();
  }, []);

  useEffect(() => {
    let filtered = polls;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (poll) =>
          poll.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          poll.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filter === "active") {
      filtered = filtered.filter((poll) => poll.isActive);
    } else if (filter === "expired") {
      filtered = filtered.filter(
        (poll) => !poll.isActive || (poll.expiresAt && new Date() > poll.expiresAt)
      );
    }

    setFilteredPolls(filtered);
  }, [polls, searchTerm, filter]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading polls...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Browse Polls</h1>
            <p className="text-gray-600">
              Discover and participate in community polls
            </p>
          </div>
          <Button asChild>
            <Link href="/polls/create">Create New Poll</Link>
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Search polls..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All Polls
            </Button>
            <Button
              variant={filter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("active")}
            >
              Active
            </Button>
            <Button
              variant={filter === "expired" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("expired")}
            >
              Expired
            </Button>
          </div>
        </div>

        {/* Poll Results */}
        <div className="space-y-4">
          {filteredPolls.length > 0 ? (
            <>
              <p className="text-sm text-gray-600 mb-4">
                {filteredPolls.length} poll{filteredPolls.length !== 1 ? "s" : ""} found
              </p>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPolls.map((poll) => (
                  <PollCard key={poll.id} poll={poll} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No polls found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm
                  ? "Try adjusting your search terms or filters"
                  : "There are no polls available yet"}
              </p>
              <Button asChild>
                <Link href="/polls/create">Create the First Poll</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
