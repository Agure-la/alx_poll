"use client";

import { useRouter } from "next/navigation";
import { CreatePollFormComponent } from "@/components/polls/create-poll-form";
import { useState } from "react";
import { Toast } from "@/components/ui/toast";

export default function CreatePollPage() {
  const router = useRouter();
  const [showToast, setShowToast] = useState(false);

  const handleSuccess = (pollId: string) => {
    setShowToast(true);
    
    // Redirect to polls page after a short delay
    setTimeout(() => {
      router.push('/polls');
    }, 1500);
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
      
      {showToast && (
        <Toast 
          message="Poll created successfully! Redirecting to polls page..." 
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
