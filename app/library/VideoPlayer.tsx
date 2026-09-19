"use client";

import { useState } from "react";

interface VideoPlayerProps {
  videoUrl: string;
  lessonId: string;
}

export default function VideoPlayer({ videoUrl, lessonId }: VideoPlayerProps) {
  const [hasPlayed, setHasPlayed] = useState(false);

  const handlePlay = async () => {
    if (!hasPlayed) {
      setHasPlayed(true);
      try {
        const { recordLibraryView } = await import("./actions");
        await recordLibraryView(lessonId);
      } catch (error) {
        console.error("Failed to record library view:", error);
      }
    }
  };

  return (
    <div className="aspect-video bg-black rounded-xl overflow-hidden">
      <video
        controls
        className="w-full h-full"
        src={`https://www.youtube.com/watch?v=${videoUrl}`}
        onPlay={handlePlay}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
