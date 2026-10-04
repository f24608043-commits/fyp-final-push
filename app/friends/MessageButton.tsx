"use client";

import { useFormStatus } from "react-dom";

export default function MessageButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="font-label-sm font-bold border-2 border-tertiary bg-gradient-to-br from-tertiary/10 to-error/10 text-tertiary px-3 py-2 rounded-full shadow-clay-surface hover:from-tertiary/10 hover:to-error/10 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {pending ? (
        <>
          <span className="animate-spin">⏳</span>
          Opening...
        </>
      ) : (
        "Message"
      )}
    </button>
  );
}
