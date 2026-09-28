import React from "react";

interface EnrollmentStatusBadgeProps {
  status: "pending" | "accepted" | "rejected" | "removed";
}

export default function EnrollmentStatusBadge({ status }: EnrollmentStatusBadgeProps) {
  const styles = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    accepted: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    removed: "bg-gray-100 text-gray-800 border-gray-200",
  };

  const labels = {
    pending: "Request Sent",
    accepted: "Enrolled",
    rejected: "Rejected",
    removed: "Removed",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
