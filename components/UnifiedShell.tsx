"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

interface UnifiedShellProps {
  children: React.ReactNode;
  role: "learner" | "tutor" | "admin";
  initialXp?: number;
  initialStreak?: number;
  initialDisplayName?: string;
}

export default function UnifiedShell({ 
  children, 
  role, 
  initialXp = 0, 
  initialStreak = 0, 
  initialDisplayName = "" 
}: UnifiedShellProps) {
  const pathname = usePathname();
  const [xp, setXp] = useState(initialXp);
  const [streak, setStreak] = useState(initialStreak);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [level, setLevel] = useState(Math.floor(Math.sqrt((initialXp || 0) / 100)) + 1);

  // Only fetch if we don't have initial data (fallback for pages not using server-side data)
  useEffect(() => {
    if (initialXp > 0 || initialDisplayName) {
      return;
    }

    async function loadUserData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const response = await fetch(`/api/profile/${user.id}`);
        if (response.ok) {
          const profile = await response.json();
          setXp(profile.xp || 0);
          setStreak(profile.streak_count || 0);
          setDisplayName(profile.display_name || "");
          setLevel(Math.floor(Math.sqrt((profile.xp || 0) / 100)) + 1);
        }
      }
    }
    loadUserData();
  }, [initialXp, initialDisplayName]);

  // Role-specific configuration
  const isLearner = role === "learner";
  const isTutor = role === "tutor" || role === "admin";
  
  const logoIcon = isLearner ? "terminal" : "school";
  const roleLabel = isLearner ? "Learner Desk" : "Tutor Portal";
  const headerLabel = isLearner ? "Python Fundamentals" : "Tutoring Hub";
  const userRoleLabel = role.toUpperCase();

  const navItems = isLearner 
    ? [
        { path: "/path", label: "Path", icon: "home" },
        { path: "/library", label: "Library", icon: "menu_book" },
        { path: "/tutoring", label: "Class", icon: "groups" },
        { path: "/friends", label: "Friends", icon: "diversity_3" },
      ]
    : [
        { path: "/tutoring/dashboard", label: "Dashboard", icon: "dashboard" },
        { path: "/tutoring/history", label: "History", icon: "history" },
        { path: "/tutoring", label: "My Classes", icon: "groups" },
      ];

  const crossRoleLink = isLearner
    ? null // Learners don't see tutor portal link
    : { path: "/path", label: "Learner View", icon: "home" };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-lowest z-50 flex flex-col justify-between shadow-subtle">
        <div className="flex flex-col">
          {/* Logo */}
          <div className="h-16 px-6 flex items-center gap-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isLearner ? 'bg-primary-container text-on-primary-container' : 'bg-secondary-container text-on-secondary-container'}`}>
              <span className="material-symbols-outlined text-[22px]">{logoIcon}</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className={`font-label-lg tracking-tight font-extrabold uppercase ${isLearner ? 'text-primary' : 'text-secondary'}`}>LEGO</span>
              <span className="font-label-sm text-on-surface-variant font-bold tracking-wide">Learn And Go</span>
            </div>
          </div>

          {/* Role Badge */}
          <div className="px-4 py-2">
            <div className="px-4 py-1 bg-surface-container rounded-full flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isLearner ? 'bg-primary-container' : 'bg-secondary-container'}`}></span>
              <span className="font-label-sm uppercase tracking-wider text-on-surface-variant font-bold">{roleLabel}</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1 px-4 py-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-4 px-4 py-2 rounded-xl transition-all ${
                  pathname === item.path
                    ? `bg-surface-container-high font-bold shadow-glow ${isLearner ? 'text-primary' : 'text-secondary'}`
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface font-label-md"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
            {crossRoleLink && (
              <>
                <div className="my-2 border-t border-surface-container"></div>
                <Link
                  href={crossRoleLink.path}
                  className={`flex items-center gap-4 px-4 py-2 rounded-xl font-label-md hover:bg-surface-container-low transition-all ${isLearner ? 'text-secondary' : 'text-primary'}`}
                >
                  <span className="material-symbols-outlined text-[20px]">{crossRoleLink.icon}</span>
                  <span>{crossRoleLink.label}</span>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Settings */}
        <div className="flex flex-col gap-1 px-4 pb-6">
          <Link
            href="/settings"
            className="flex items-center gap-4 px-4 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-all font-label-md"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span>Settings</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="pl-64 flex-1">
        {/* Top Header */}
        <header className="fixed top-0 left-64 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl shadow-subtle z-40 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors" type="button">
              <span className={`w-2.5 h-2.5 rounded-full ${isLearner ? 'bg-primary-container' : 'bg-secondary-container'}`}></span>
              <span className="font-label-md text-on-surface">{headerLabel}</span>
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">arrow_drop_down</span>
            </button>
          </div>
          <div className="flex items-center gap-6">
            {/* Stats */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface font-label-md">
                {isLearner ? (
                  <span className="text-secondary-container">🔥</span>
                ) : (
                  <span className="material-symbols-outlined text-secondary text-[16px]" style={{ fontVariationSettings: 'FILL 1' }}>local_fire_department</span>
                )}
                <span>{streak}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface font-label-md">
                {isLearner ? (
                  <span className="text-tertiary-container">⚡</span>
                ) : (
                  <span className="material-symbols-outlined text-secondary text-[16px]" style={{ fontVariationSettings: 'FILL 1' }}>stars</span>
                )}
                <span>{xp.toLocaleString()}</span>
              </div>
            </div>
            {/* User Info */}
            <div className="flex items-center gap-2">
              <div className="flex flex-col text-right">
                <span className="font-label-md text-on-surface leading-tight">{displayName || (isLearner ? "Learner" : "Tutor")}</span>
                <div className="flex items-center justify-end gap-1">
                  <span className={`font-label-sm font-extrabold ${isLearner ? 'text-primary' : 'text-secondary'}`}>LVL {level}</span>
                  <span className="font-label-sm text-on-surface-variant">•</span>
                  <span className="font-label-sm text-on-surface-variant uppercase tracking-wider font-bold">{userRoleLabel}</span>
                </div>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isLearner ? 'bg-primary text-on-primary' : 'bg-secondary text-on-secondary'}`}>
                <span className="material-symbols-outlined text-[18px]">{isLearner ? "person" : "supervised_user_circle"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="relative pt-16 min-h-screen w-full px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
