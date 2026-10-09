"use client";

import { useState } from "react";

interface DeleteGroupButtonProps {
  groupId: string;
  onDelete: () => void;
}

export default function DeleteGroupButton({ groupId, onDelete }: DeleteGroupButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);

    try {
      const formData = new FormData();
      formData.append("groupId", groupId);

      const response = await fetch("/api/tutoring/delete-group", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        onDelete();
      } else {
        throw new Error("Failed to delete group");
      }
    } catch (error) {
      console.error("Delete error:", error);
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="groupId" value={groupId} />
      <button
        type="submit"
        disabled={isDeleting}
        className="rounded-full border-2 border-error bg-error/10 text-error px-4 py-2 font-label-md font-semibold shadow-clay-secondary hover:from-error/10 hover:to-error/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDeleting ? "Deleting..." : "Delete Group"}
      </button>
    </form>
  );
}
