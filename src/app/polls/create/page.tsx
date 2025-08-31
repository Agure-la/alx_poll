"use client";

import { useRouter } from "next/navigation";
import { CreatePollFormComponent } from "@/components/polls/create-poll-form";

export default function CreatePollPage() {
  const router = useRouter();

  const handleSuccess = (pollId: string) => {
    // Redirect to the newly created poll
    router.push(`/polls/${pollId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Create New Poll</h1>
          <p className="text-gray-600">
            Share your question with the community and gather valuable feedback
          </p>
        </div>

        <CreatePollFormComponent onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
