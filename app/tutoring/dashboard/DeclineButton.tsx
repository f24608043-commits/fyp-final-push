"use client";

import { useFormStatus } from "react-dom";

export default function DeclineButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl border-4 border-gray-200 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 px-4 py-2 font-label-md font-semibold hover:from-gray-200 hover:to-gray-300 transition-all shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
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
