"use client";

import { useEffect } from "react";

export default function LoadingPage() {
  useEffect(() => {
    // Redirect to path after a brief delay to allow the page to render
    const timer = setTimeout(() => {
      window.location.href = "/path";
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl bg-surface p-8 shadow-clay-surface border border-surface-border text-center">
        <div className="mb-6 flex flex-col items-center">
          <div className="relative w-20 h-20 rounded-xl bg-surface-container flex items-center justify-center overflow-hidden shadow-clay-surface mb-4 animate-pulse">
            <div className="w-12 h-12 bg-primary/30 rounded-full"></div>
          </div>
          <h1 className="font-headline-lg text-text-primary tracking-tight font-extrabold">Loading...</h1>
          <p className="mt-1 font-body-md text-text-muted">Preparing your learning journey</p>
        </div>
        <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-pulse rounded-full" style={{ width: "60%" }}></div>
        </div>
      </div>
    </div>
  );
}
