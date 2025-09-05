'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { PollAPI } from '@/lib/api';
import { CreatePollForm, Poll } from '@/types';
import { useAuth } from '@/contexts/auth-context';

export default function EditPollPage() {
  const { id: pollId } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [poll, setPoll] = useState<Poll | null>(null);
  const [pollData, setPollData] = useState<CreatePollForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const fetchedPoll = await PollAPI.getPoll(pollId as string);
        if (!fetchedPoll) {
          setError('Poll not found');
          return;
        }
        if (fetchedPoll.createdBy !== user?.id) {
          setError('You are not authorized to edit this poll');
          return;
        }
        setPoll(fetchedPoll);
        setPollData({
          title: fetchedPoll.title,
          description: fetchedPoll.description,
          options: fetchedPoll.options.map((o) => o.text),
          allowMultipleVotes: fetchedPoll.allowMultipleVotes,
          requireAuthentication: fetchedPoll.requireAuthentication,
          expiresAt: fetchedPoll.expiresAt,
        });
      } catch (err) {
        setError('Failed to fetch poll');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchPoll();
    }
  }, [pollId, user]);

  const handleAddOption = () => {
    if (pollData && pollData.options.length < 10) {
      setPollData({
        ...pollData,
        options: [...pollData.options, ''],
      });
    }
  };

  const handleRemoveOption = (index: number) => {
    if (pollData && pollData.options.length > 2) {
      const newOptions = pollData.options.filter((_, i) => i !== index);
      setPollData({
        ...pollData,
        options: newOptions,
      });
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    if (pollData) {
      const newOptions = [...pollData.options];
      newOptions[index] = value;
      setPollData({
        ...pollData,
        options: newOptions,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollData) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await PollAPI.updatePoll(pollId as string, pollData);

      if (result.success) {
        router.push(`/polls/${pollId}`);
      } else {
        setError(result.error || 'Failed to update poll');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!pollData) {
    return <div>Poll data could not be loaded.</div>;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Edit Poll</CardTitle>
        <CardDescription>Update the details of your poll</CardDescription>
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

          <div className="space-y-6 border-t pt-6">
            <div>
              <Label className="text-base font-medium">Poll Settings</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Configure how your poll will work and who can participate
              </p>
            </div>

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
                value={pollData.expiresAt ? new Date(pollData.expiresAt).toISOString().slice(0, 16) : ''}
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
              {isLoading ? 'Updating Poll...' : 'Update Poll'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
