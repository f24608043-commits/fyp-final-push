import React from "react";

interface EnrollmentStatusBadgeProps {
  status: "pending" | "accepted" | "rejected" | "removed";
}

export default function EnrollmentStatusBadge({ status }: EnrollmentStatusBadgeProps) {
  const styles = {
    pending: "bg-secondary/10 text-secondary border-secondary/30",
    accepted: "bg-primary/10 text-success border-primary/30",
    rejected: "bg-error/10 text-error border-error/30",
    removed: "surface text-text-muted border-surface-border",
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
