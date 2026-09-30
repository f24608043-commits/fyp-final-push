"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/auth/actions";

interface AppShellProps {
  children: React.ReactNode;
  user?: {
    id: string;
    displayName: string | null;
    email: string;
    role: "learner" | "tutor" | "admin";
    xp: number;
    streakCount: number;
  };
}

export default function AppShell({ children, user }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // AppShell is only for non-authenticated pages (sign-in, sign-up)
  // If user is authenticated, UnifiedShell handles the layout
  if (user) {
    return <>{children}</>;
  }

  // Simple layout for non-authenticated pages
  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  );
}
