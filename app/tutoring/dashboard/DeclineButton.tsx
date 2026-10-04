"use client";

import { useFormStatus } from "react-dom";

export default function DeclineButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl border-4 border-surface-border bg-surface text-text-muted px-4 py-2 font-label-md font-semibold hover:from-surface hover:to-surface-border transition-all shadow-clay-surface disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {pending ? (
        <>
          <span className="animate-spin">⏳</span>
          Declining...
        </>
      ) : (
        "Decline"
      )}
    </button>
  );
}
