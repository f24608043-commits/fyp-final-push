"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface EnrollButtonProps {
  courseId: string;
  courseTitle: string;
  courseDescription: string;
}

export default function EnrollButton({ courseId, courseTitle, courseDescription }: EnrollButtonProps) {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const router = useRouter();

  const handleEnroll = async () => {
    setIsEnrolling(true);
    try {
      const formData = new FormData();
      formData.append("courseId", courseId);
      
      const response = await fetch("/api/enroll", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        router.refresh();
      } else {
        throw new Error("Failed to enroll");
      }
    } catch (error) {
      console.error("Enrollment error:", error);
      setIsEnrolling(false);
    }
  };

  return (
    <button
      onClick={handleEnroll}
      disabled={isEnrolling}
      className="w-full rounded-[24px] bg-surface p-6 shadow-clay-surface border-4 border-surface/50 hover:border-primary hover:bg-surface-border transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-headline-md text-text-primary font-bold mb-2 group-hover:text-primary transition-colors">
            {courseTitle}
          </h3>
          <p className="font-body-sm text-text-muted line-clamp-2">{courseDescription}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-text-primary font-label-sm font-bold shadow-clay-primary group-hover:scale-105 transition-transform">
          {isEnrolling ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-text-primary"></span>
              <span>Enrolling...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Enroll</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}
