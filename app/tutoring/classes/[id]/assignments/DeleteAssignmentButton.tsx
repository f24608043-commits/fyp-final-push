"use client";

import { useState } from "react";

interface DeleteAssignmentButtonProps {
  assignmentId: string;
  groupId: string;
  onDelete: () => void;
}

export default function DeleteAssignmentButton({ assignmentId, groupId, onDelete }: DeleteAssignmentButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!confirm("Are you sure you want to delete this assignment? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);

    try {
      const formData = new FormData();
      formData.append("assignmentId", assignmentId);
      formData.append("groupId", groupId);

      const response = await fetch("/api/tutoring/delete-assignment", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        onDelete();
      } else {
        throw new Error("Failed to delete assignment");
      }
    } catch (error) {
      console.error("Delete error:", error);
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <input type="hidden" name="groupId" value={groupId} />
      <button
        type="submit"
        disabled={isDeleting}
        className="p-2 rounded-full bg-error/10 text-error hover:bg-error/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        title="Delete assignment"
      >
        {isDeleting ? (
          <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-error block"></span>
        ) : (
          <span className="material-symbols-outlined text-[20px]">delete</span>
        )}
      </button>
    </form>
  );
}
