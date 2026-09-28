"use client";

import { useState } from "react";
import EnrollmentStatusBadge from "@/components/EnrollmentStatusBadge";

interface EnrollButtonProps {
  tutorId: string;
  initialStatus?: "pending" | "accepted" | "rejected" | "removed" | null;
}

export default function EnrollButton({ tutorId, initialStatus }: EnrollButtonProps) {
  const [status, setStatus] = useState<"pending" | "accepted" | "rejected" | "removed" | null>(initialStatus || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnroll = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send enrollment request");
      }

      const data = await response.json();
      setStatus(data.enrollment.status);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!status) return;

    try {
      setIsLoading(true);
      setError(null);

      // Find the enrollment ID - for now we'll need to fetch it
      const enrollmentsResponse = await fetch(`/api/enrollments?role=learner`);
      const enrollmentsData = await enrollmentsResponse.json();
      const enrollment = enrollmentsData.pending?.find((e: any) => e.tutorId === tutorId);

      if (!enrollment) {
        throw new Error("Enrollment not found");
      }

      const response = await fetch(`/api/enrollments/${enrollment.id}/cancel`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to cancel enrollment request");
      }

      setStatus("rejected");
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "accepted") {
    return <EnrollmentStatusBadge status="accepted" />;
  }

  if (status === "rejected") {
    return (
      <div className="flex flex-col gap-1">
        <EnrollmentStatusBadge status="rejected" />
        <button
          onClick={handleEnroll}
          disabled={isLoading}
          className="rounded-xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600 px-3 py-2 font-label-sm font-bold shadow-lg hover:from-blue-100 hover:to-cyan-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? "Requesting..." : "Request Again"}
        </button>
        {error && <span className="text-xs text-error font-label-sm">{error}</span>}
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="flex flex-col gap-1">
        <EnrollmentStatusBadge status="pending" />
        <button
          onClick={handleCancel}
          disabled={isLoading}
          className="rounded-xl border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600 px-3 py-2 font-label-sm font-semibold shadow-lg hover:from-gray-100 hover:to-gray-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? "Cancelling..." : "Cancel Request"}
        </button>
        {error && <span className="text-xs text-error font-label-sm">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleEnroll}
        disabled={isLoading}
        className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-2 font-label-sm font-bold shadow-xl border-2 border-white/30 transform hover:scale-105 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <span className="animate-spin">⏳</span>
            Sending...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Enroll
          </>
        )}
      </button>
      {error && <span className="text-xs text-error font-label-sm">{error}</span>}
    </div>
  );
}
