"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MessageButton({ tutorId }: { tutorId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await fetch("/api/messaging/messages", {
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
      router.push(`/messages/${data.conversationId}`);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded-xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600 px-3 py-2 font-label-sm font-bold shadow-lg hover:from-blue-100 hover:to-cyan-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {loading ? (
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
