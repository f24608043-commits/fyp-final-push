"use client";

import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

export default function MessageButton({ tutorId }: { tutorId: string }) {
  const { pending } = useFormStatus();
  const router = useRouter();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600 px-3 py-2 font-label-sm font-bold shadow-lg hover:from-blue-100 hover:to-cyan-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
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
