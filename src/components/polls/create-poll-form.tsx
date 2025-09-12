"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { createPoll } from "@/lib/actions";

const initialState = {
  success: false,
  message: "",
  pollId: null,
  errors: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating Poll..." : "Create Poll"}
    </Button>
  );
}

export function CreatePollFormComponent({ onSuccess }: { onSuccess?: (pollId: string) => void; }) {
  const [state, formAction] = useFormState(createPoll, initialState);
  const [options, setOptions] = useState(["", ""]);
  const router = useRouter();

  useEffect(() => {
    if (state.success && state.pollId) {
      if (onSuccess) {
        onSuccess(state.pollId);
      } else {
        router.push(`/polls/${state.pollId}`);
      }
    }
  }, [state, onSuccess, router]);

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
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
        <form action={formAction} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Poll Title *</Label>
            <Input
              id="title"
              name="title"
              placeholder="What question do you want to ask?"
              required
            />
            {state.errors?.title && <p className="text-sm text-destructive">{state.errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              name="description"
              placeholder="Add more context to your poll"
            />
          </div>

          <div className="space-y-4">
            <Label>Poll Options *</Label>
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  name="options[]"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  required={index < 2}
                />
                {options.length > 2 && (
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
            {state.errors?.options && <p className="text-sm text-destructive">{state.errors.options}</p>}
            {options.length < 10 && (
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
                <Label htmlFor="allow_multiple_votes" className="text-sm font-medium">
                  Allow Multiple Votes
                </Label>
                <p className="text-xs text-muted-foreground">
                  Users can select multiple options in this poll
                </p>
              </div>
              <Switch id="allow_multiple_votes" name="allow_multiple_votes" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="require_authentication" className="text-sm font-medium">
                  Require Authentication
                </Label>
                <p className="text-xs text-muted-foreground">
                  Users must be logged in to vote on this poll
                </p>
              </div>
              <Switch id="require_authentication" name="require_authentication" defaultChecked />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires_at" className="text-sm font-medium">
                Expiration Date (Optional)
              </Label>
              <p className="text-xs text-muted-foreground">
                Set when this poll should automatically close
              </p>
              <Input
                id="expires_at"
                name="expires_at"
                type="datetime-local"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>

          {!state.success && state.message && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {state.message}
            </div>
          )}
          
          {state.success && state.message && (
             <div className="bg-green-600/15 text-green-700 text-sm p-3 rounded-md">
                {state.message}
             </div>
          )}

          <div className="flex gap-4">
            <SubmitButton />
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
