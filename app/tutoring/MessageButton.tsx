"use client";

import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MessageButton({ tutorId }: { tutorId: string }) {
  const { pending } = useFormStatus();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    try {
      setError(null);
      const response = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId: tutorId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to start conversation");
      }

      const data = await response.json();
      // Navigate to the conversation
      router.push(`/messages?conversation=${data.conversationId}`);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600 px-3 py-2 font-label-sm font-bold shadow-lg hover:from-blue-100 hover:to-cyan-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {pending ? (
          <>
            <span className="animate-spin">⏳</span>
            Opening...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[18px]">chat</span>
            Message
          </>
        )}
      </button>
      {error && (
        <span className="text-xs text-error font-label-sm">{error}</span>
      )}
    </div>
  );
}
