"use client";

import { useFormStatus } from "react-dom";

export default function EditAvailabilityButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-primary-container text-on-primary px-4 py-2 font-label-md font-bold shadow-glow hover:bg-primary transition-all active:translate-y-[2px] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:translate-y-0 flex items-center gap-2"
    >
      {pending ? (
        <>
          <span className="animate-spin">⏳</span>
          Opening...
        </>
      ) : (
        "Edit Availability"
      )}
    </button>
  );
}
