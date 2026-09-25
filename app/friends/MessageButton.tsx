"use client";

import { useFormStatus } from "react-dom";

export default function MessageButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="font-label-sm font-bold border-2 border-pink-300 bg-gradient-to-br from-pink-50 to-rose-50 text-pink-600 px-3 py-2 rounded-full shadow-lg hover:from-pink-100 hover:to-rose-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
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
