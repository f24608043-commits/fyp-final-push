"use client";

import { useFormStatus } from "react-dom";

export default function AddFriendButton({ suggestedId }: { suggestedId: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="font-label-sm font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-full shadow-lg border-2 border-white/30 hover:scale-105 transition-transform disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
    >
      {pending ? (
        <>
          <span className="animate-spin">⏳</span>
          Adding...
        </>
      ) : (
        "Add Friend"
      )}
    </button>
  );
}
