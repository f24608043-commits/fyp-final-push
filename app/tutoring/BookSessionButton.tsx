"use client";

import { useFormStatus } from "react-dom";

export default function BookSessionButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 font-label-md font-bold shadow-xl border-4 border-white/30 transform hover:scale-105 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100 flex items-center gap-2"
    >
      {pending ? (
        <>
          <span className="animate-spin">⏳</span>
          Booking...
        </>
      ) : (
        "Book Session"
      )}
    </button>
  );
}
