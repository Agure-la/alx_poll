"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { PollAPI } from "@/lib/api";
import { CreatePollForm } from "@/types";
import { createPollSchema } from "@/schemas";

interface CreatePollFormProps {
  onSuccess?: (pollId: string) => void;
}

export function CreatePollFormComponent({ onSuccess }: CreatePollFormProps) {
  const [pollData, setPollData] = useState<CreatePollForm>({
    title: "",
    description: "",
    options: ["", ""],
    allowMultipleVotes: false,
    requireAuthentication: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddOption = () => {
    if (pollData.options.length < 10) {
      setPollData({
        ...pollData,
        options: [...pollData.options, ""],
      });
    }
  };

  const handleRemoveOption = (index: number) => {
    if (pollData.options.length > 2) {
      const newOptions = pollData.options.filter((_, i) => i !== index);
      setPollData({
        ...pollData,
        options: newOptions,
      });
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...pollData.options];
    newOptions[index] = value;
    setPollData({
      ...pollData,
      options: newOptions,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate the form data
      const validatedData = createPollSchema.parse({
        title: pollData.title,
        description: pollData.description || undefined,
        options: pollData.options.filter(option => option.trim() !== ''),
        allow_multiple_votes: pollData.allowMultipleVotes,
        require_authentication: pollData.requireAuthentication,
        expires_at: pollData.expiresAt ? pollData.expiresAt.toISOString() : undefined
      });

      const result = await PollAPI.createPoll({
        title: validatedData.title,
        description: validatedData.description,
        options: validatedData.options,
        allowMultipleVotes: validatedData.allow_multiple_votes,
        requireAuthentication: validatedData.require_authentication,
        expiresAt: validatedData.expires_at ? new Date(validatedData.expires_at) : undefined
      });

      if (result.success && result.data) {
        // Reset form
        setPollData({
          title: '',
          description: '',
          options: ['', ''],
          expiresAt: undefined,
          allowMultipleVotes: false,
          requireAuthentication: false,
        });
        
        // Call success callback
        onSuccess?.(result.data.id);
      } else {
        setError(result.error || 'Failed to create poll');
      }
    } catch (err: any) {
      console.error('Poll creation error:', err);
      if (err.name === 'ZodError') {
        setError('Please check your input and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Poll</CardTitle>
        <CardDescription>
          Create a poll to gather opinions from the community
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Poll Title *</Label>
            <Input
              id="title"
              placeholder="What question do you want to ask?"
              value={pollData.title}
              onChange={(e) =>
                setPollData({ ...pollData, title: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="Add more context to your poll"
              value={pollData.description}
              onChange={(e) =>
                setPollData({ ...pollData, description: e.target.value })
              }
            />
          </div>

          <div className="space-y-4">
            <Label>Poll Options *</Label>
            {pollData.options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  required={index < 2}
                />
                {pollData.options.length > 2 && index >= 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveOption(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            {pollData.options.length < 10 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleAddOption}
                className="w-full"
              >
                Add Option
              </Button>
            )}
          </div>

          {/* Poll Settings */}
          <div className="space-y-6 border-t pt-6">
            <div>
              <Label className="text-base font-medium">Poll Settings</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Configure how your poll will work and who can participate
              </p>
            </div>

            {/* Multiple Votes Setting */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="multiple-votes" className="text-sm font-medium">
                  Allow Multiple Votes
                </Label>
                <p className="text-xs text-muted-foreground">
                  Users can select multiple options in this poll
                </p>
              </div>
              <Switch
                id="multiple-votes"
                checked={pollData.allowMultipleVotes}
                onCheckedChange={(checked) =>
                  setPollData({ ...pollData, allowMultipleVotes: checked })
                }
              />
            </div>

            {/* Authentication Requirement */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="require-auth" className="text-sm font-medium">
                  Require Authentication
                </Label>
                <p className="text-xs text-muted-foreground">
                  Users must be logged in to vote on this poll
                </p>
              </div>
              <Switch
                id="require-auth"
                checked={pollData.requireAuthentication}
                onCheckedChange={(checked) =>
                  setPollData({ ...pollData, requireAuthentication: checked })
                }
              />
            </div>

            {/* Expiration Date */}
            <div className="space-y-2">
              <Label htmlFor="expires-at" className="text-sm font-medium">
                Expiration Date (Optional)
              </Label>
              <p className="text-xs text-muted-foreground">
                Set when this poll should automatically close
              </p>
              <Input
                id="expires-at"
                type="datetime-local"
                value={pollData.expiresAt ? new Date(pollData.expiresAt.getTime() - pollData.expiresAt.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setPollData({
                    ...pollData,
                    expiresAt: value ? new Date(value) : undefined,
                  });
                }}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || pollData.title.trim() === '' || pollData.options.filter(opt => opt.trim() !== '').length < 2}
            >
              {isLoading ? 'Creating Poll...' : 'Create Poll'}
            </Button>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
