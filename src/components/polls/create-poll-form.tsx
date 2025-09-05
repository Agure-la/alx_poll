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
import { z } from "zod";

// The Zod schema for validating the create poll form.
export const createPollSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  options: z.array(z.string()).min(2, "At least 2 options are required"),
  allow_multiple_votes: z.boolean(),
  require_authentication: z.boolean(),
  expires_at: z.string().optional()
});

/**
 * The properties for the `CreatePollFormComponent` component.
 */
interface CreatePollFormProps {
  /** A callback function that is called when the poll is created successfully. */
  onSuccess?: (pollId: string) => void;
}

/**
 * A form for creating a new poll.
 * It handles user input, form validation, and submission.
 * @param {CreatePollFormProps} props - The component properties.
 */
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

  /**
   * Adds a new option to the poll.
   */
  const handleAddOption = () => {
    if (pollData.options.length < 10) {
      setPollData({
        ...pollData,
        options: [...pollData.options, ""],
      });
    }
  };

  /**
   * Removes an option from the poll.
   * @param index The index of the option to remove.
   */
  const handleRemoveOption = (index: number) => {
    if (pollData.options.length > 2) {
      const newOptions = pollData.options.filter((_, i) => i !== index);
      setPollData({
        ...pollData,
        options: newOptions,
      });
    }
  };

  /**
   * Handles changes to a poll option.
   * @param index The index of the option to change.
   * @param value The new value of the option.
   */
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...pollData.options];
    newOptions[index] = value;
    setPollData({
      ...pollData,
      options: newOptions,
    });
  };

  /**
   * Handles the form submission.
   * It validates the form data, creates the poll, and calls the `onSuccess` callback.
   * @param e The form event.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // We validate the form data using the Zod schema.
      const validatedData = createPollSchema.parse({
        title: pollData.title,
        description: pollData.description || undefined,
        options: pollData.options.filter(option => option.trim() !== ''),
        allow_multiple_votes: pollData.allowMultipleVotes,
        require_authentication: pollData.requireAuthentication,
        expires_at: pollData.expiresAt ? pollData.expiresAt.toISOString() : undefined
      });

      // We call the `createPoll` method from the `PollAPI` to create the poll.
      const result = await PollAPI.createPoll({
        title: validatedData.title,
        description: validatedData.description,
        options: validatedData.options,
        allowMultipleVotes: validatedData.allow_multiple_votes,
        requireAuthentication: validatedData.require_authentication,
        expiresAt: validatedData.expires_at ? new Date(validatedData.expires_at) : undefined
      });

      if (result.success && result.data) {
        // If the poll is created successfully, we reset the form and call the `onSuccess` callback.
        setPollData({
          title: '',
          description: '',
          options: ['', ''],
          expiresAt: undefined,
          allowMultipleVotes: false,
          requireAuthentication: false,
        });
        
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