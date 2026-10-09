"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { usePresence } from "@/hooks/usePresence";
import { subscribeToUserNotifications } from "@/lib/realtime";

type Role = "learner" | "tutor" | "admin";

interface ShellChromeProps {
  children: React.ReactNode;
  role: Role;
  userId: string;
  displayName: string;
  avatarUrl?: string;
}

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const NAV_CONFIG: Record<
  Role,
  { sidebar: NavItem[]; bottom: NavItem[]; more: NavItem[] }
> = {
  learner: {
    sidebar: [
      { path: "/path", label: "Path", icon: "home" },
      { path: "/library", label: "Library", icon: "menu_book" },
      { path: "/classes", label: "My Classes", icon: "school" },
      { path: "/tutoring", label: "Tutoring", icon: "groups" },
      { path: "/friends", label: "Friends", icon: "diversity_3" },
      { path: "/messages", label: "Messages", icon: "chat" },
    ],
    bottom: [
      { path: "/path", label: "Path", icon: "home" },
      { path: "/library", label: "Library", icon: "menu_book" },
      { path: "/classes", label: "Classes", icon: "school" },
      { path: "/tutoring", label: "Tutoring", icon: "groups" },
      { path: "/profile", label: "Profile", icon: "person" },
    ],
    more: [
      { path: "/leaderboard", label: "Leaderboard", icon: "leaderboard" },
      { path: "/notifications", label: "Notifications", icon: "notifications" },
      { path: "/settings", label: "Settings", icon: "settings" },
    ],
  },
  tutor: {
    sidebar: [
      { path: "/tutoring/classes", label: "My Classes", icon: "school" },
      { path: "/tutoring/dashboard", label: "Dashboard", icon: "dashboard" },
      { path: "/tutoring/history", label: "History", icon: "history" },
      { path: "/messages", label: "Messages", icon: "chat" },
    ],
    bottom: [
      { path: "/tutoring/classes", label: "Classes", icon: "school" },
      { path: "/tutoring/dashboard", label: "Dashboard", icon: "dashboard" },
      {
        path: "/tutoring/learner-dashboard",
        label: "Learners",
        icon: "people",
      },
      { path: "/tutoring/history", label: "History", icon: "history" },
      { path: "/profile", label: "Profile", icon: "person" },
    ],
    more: [
      { path: "/notifications", label: "Notifications", icon: "notifications" },
      { path: "/settings", label: "Settings", icon: "settings" },
    ],
  },
  admin: {
    sidebar: [
      { path: "/admin", label: "Dashboard", icon: "dashboard" },
      { path: "/admin/users", label: "Users", icon: "people" },
      { path: "/admin/courses", label: "Courses", icon: "school" },
      { path: "/admin/badges", label: "Badges", icon: "military_tech" },
      { path: "/admin/tutoring", label: "Tutoring", icon: "groups" },
      { path: "/messages", label: "Messages", icon: "chat" },
    ],
    bottom: [
      { path: "/admin", label: "Dashboard", icon: "dashboard" },
      { path: "/admin/users", label: "Users", icon: "people" },
      { path: "/admin/courses", label: "Courses", icon: "school" },
      { path: "/admin/badges", label: "Badges", icon: "military_tech" },
      { path: "/profile", label: "Profile", icon: "person" },
    ],
    more: [
      { path: "/admin/tutoring", label: "Tutoring", icon: "groups" },
      { path: "/settings", label: "Settings", icon: "settings" },
    ],
  },
};

const ACCENT: Record<
  Role,
  {
    logoIcon: string;
    roleLabel: string;
    solid: string;
    soft: string;
    dot: string;
    text: string;
    level: string;
  }
> = {
  learner: {
    logoIcon: "terminal",
    roleLabel: "Learner Desk",
    solid: "bg-primary text-text-primary shadow-clay-primary",
    soft: "bg-primary/10 text-primary",
    dot: "bg-primary",
    text: "text-primary",
    level: "bg-primary text-text-primary shadow-clay-primary",
  },
  tutor: {
    logoIcon: "school",
    roleLabel: "Tutor Portal",
    solid: "bg-secondary text-text-primary shadow-clay-secondary",
    soft: "bg-secondary/10 text-secondary",
    dot: "bg-secondary",
    text: "text-secondary",
    level: "bg-secondary text-text-primary shadow-clay-secondary",
  },
  admin: {
    logoIcon: "admin_panel_settings",
    roleLabel: "Admin Panel",
    solid: "bg-tertiary text-text-primary shadow-clay-tertiary",
    soft: "bg-tertiary/10 text-tertiary",
    dot: "bg-tertiary",
    text: "text-tertiary",
    level: "bg-tertiary text-text-primary shadow-clay-tertiary",
  },
};

function levelFromXp(xp: number) {
  return Math.floor(Math.sqrt((xp || 0) / 100)) + 1;
}

export default function ShellChrome({
  children,
  role,
  userId,
  displayName,
  avatarUrl,
}: ShellChromeProps) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState({ open: false, at: "" });
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [resolvedName, setResolvedName] = useState(displayName);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Global presence tracking
  usePresence({
    id: userId,
    displayName: resolvedName || displayName,
    avatarUrl,
    role,
  });

  // Real-time unread notification listener
  useEffect(() => {
    if (!userId) return;

    let mounted = true;
    async function fetchUnread() {
      try {
        const res = await fetch("/api/notifications/unread");
        if (res.ok) {
          const data = await res.json();
          if (mounted) setUnreadNotifications(data.unreadCount || 0);
        }
      } catch (err) {}
    }

    fetchUnread();

    const unsubscribe = subscribeToUserNotifications(userId, () => {
      setUnreadNotifications((prev) => prev + 1);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [userId]);

  // Derived, not effect-driven: any navigation invalidates the open drawer,
  // which also covers browser back/forward without a setState-in-effect.
  const mobileMenuOpen = drawer.open && drawer.at === pathname;
  const setMobileMenuOpen = (open: boolean) =>
    setDrawer(open ? { open: true, at: pathname } : { open: false, at: pathname });

  const accent = ACCENT[role];
  const level = levelFromXp(xp);

  const { sidebar, bottom, more } = NAV_CONFIG[role];
  const crossRoleLink =
    role === "learner"
      ? null
      : { path: "/path", label: "Learner View", icon: "home" };

  useEffect(() => {
    if (displayName) return;

    let mounted = true;
    async function loadStats() {
      try {
        const res = await fetch(`/api/profile/${userId}`, { cache: "no-store" });
        if (!res.ok || !mounted) return;
        const profile = await res.json();
        if (!mounted) return;
        setXp(profile.xp || 0);
        setStreak(profile.streak_count || 0);
        setResolvedName(profile.display_name || "");
      } catch (error) {
        console.error("Failed to load user data:", error);
      }
    }

    loadStats();
    return () => {
      mounted = false;
    };
  }, [displayName, userId]);

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`);

  const navLinkClass = (path: string) =>
    [
      "flex items-center rounded-[24px] font-label-md transition-all duration-200",
      "hover:bg-surface-border hover:text-text-primary hover:-translate-y-px",
      "active:translate-y-[1px] active:shadow-clay-surface-pressed",
      isActive(path)
        ? `font-bold ${accent.solid}`
        : "text-text-muted shadow-clay-surface",
    ].join(" ");

  const wordmark = (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[20px] ${accent.solid}`}
      >
        <span className="material-symbols-outlined text-[22px]">{accent.logoIcon}</span>
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-label-lg font-extrabold uppercase tracking-tight text-text-primary">
          LEGO
        </span>
        <span className="font-label-sm font-bold tracking-wide text-text-muted">
          Learn And Go
        </span>
      </div>
    </div>
  );

  const roleBadge = (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 shadow-clay-surface ${accent.soft}`}
    >
      <span className={`h-2 w-2 rounded-full ${accent.dot}`} />
      <span className="font-label-sm font-bold uppercase tracking-wider text-text-primary">
        {accent.roleLabel}
      </span>
    </div>
  );

  const avatar = (
    <div
      className={`relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-surface ${accent.solid} transition-transform duration-300 group-hover:scale-105 lg:h-12 lg:w-12`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          width={48}
          height={48}
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="material-symbols-outlined text-[20px] lg:text-[24px]">
          {role === "learner"
            ? "person"
            : role === "admin"
            ? "shield"
            : "supervised_user_circle"}
        </span>
      )}
      <span
        className={`absolute -bottom-1 -right-1 hidden h-7 w-7 items-center justify-center rounded-full border-2 border-surface text-[11px] font-extrabold lg:flex ${accent.level}`}
      >
        {level}
      </span>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between border-r border-surface-border bg-surface shadow-clay-surface lg:flex">
        <div className="flex flex-col p-6">
          <div className="mb-6 h-16 items-center">{wordmark}</div>
          <div className="mb-6">{roleBadge}</div>

          <nav className="flex flex-col gap-2">
            {sidebar.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`${navLinkClass(item.path)} gap-4 px-5 py-3`}
                aria-current={isActive(item.path) ? "page" : undefined}
              >
                <span className="material-symbols-outlined text-[22px]">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            ))}

            {crossRoleLink && (
              <>
                <div className="my-4 border-t border-surface-border" />
                <Link
                  href={crossRoleLink.path}
                  className="flex items-center gap-4 rounded-[24px] px-5 py-3 font-label-md text-text-muted shadow-clay-surface transition-all duration-200 hover:-translate-y-px hover:bg-surface-border hover:text-text-primary active:translate-y-[1px]"
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {crossRoleLink.icon}
                  </span>
                  <span>{crossRoleLink.label}</span>
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex flex-col gap-2 p-6">
          <Link
            href="/settings"
            className="flex items-center gap-4 rounded-[24px] px-5 py-3 font-label-md text-text-muted shadow-clay-surface transition-all duration-200 hover:-translate-y-px hover:bg-surface-border hover:text-text-primary active:translate-y-[1px]"
          >
            <span className="material-symbols-outlined text-[22px]">settings</span>
            <span>Settings</span>
          </Link>
        </div>
      </aside>

      {/* Tablet icon rail */}
      <aside className="sticky top-0 hidden h-screen w-20 shrink-0 flex-col items-center border-r border-surface-border bg-surface py-6 shadow-clay-surface md:flex lg:hidden">
        <div
          className={`mb-6 flex h-10 w-10 items-center justify-center rounded-[20px] ${accent.solid}`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {accent.logoIcon}
          </span>
        </div>

        <nav className="flex w-full flex-1 flex-col items-center gap-2 px-3">
          {sidebar.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              aria-label={item.label}
              aria-current={isActive(item.path) ? "page" : undefined}
              className={[
                "flex h-12 w-12 items-center justify-center rounded-[24px] transition-all duration-200",
                "hover:bg-surface-border hover:-translate-y-px active:translate-y-[1px]",
                isActive(item.path)
                  ? accent.solid
                  : "text-text-muted shadow-clay-surface",
              ].join(" ")}
            >
              <span className="material-symbols-outlined text-[20px]">
                {item.icon}
              </span>
            </Link>
          ))}
        </nav>

        <Link
          href="/settings"
          aria-label="Settings"
          className="flex h-12 w-12 items-center justify-center rounded-[24px] text-text-muted shadow-clay-surface transition-all duration-200 hover:-translate-y-px hover:bg-surface-border hover:text-text-primary active:translate-y-[1px]"
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
        </Link>
      </aside>

      {/* Main column */}
      <div className="relative z-10 min-w-0 flex-1 overflow-x-auto">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-surface-border bg-surface/95 px-4 shadow-clay-surface backdrop-blur-xl lg:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
              className="flex h-10 w-10 items-center justify-center rounded-[20px] bg-surface-border text-text-primary shadow-clay-surface transition-all duration-200 active:translate-y-[1px] active:shadow-clay-surface-pressed"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
            <span className="font-label-lg font-extrabold uppercase tracking-tight text-text-primary">
              LEGO
            </span>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="group hidden transition-transform duration-300 hover:scale-105 active:scale-95 lg:block"
            >
              <div
                className={`relative flex h-11 w-11 items-center justify-center rounded-full shadow-clay-surface transition-all duration-300 group-hover:-translate-y-px ${accent.soft}`}
              >
                <span className="material-symbols-outlined text-[22px]">
                  notifications
                </span>
                {unreadNotifications > 0 && (
                  <span
                    id="notification-badge"
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface bg-error text-[10px] font-bold text-text-primary animate-pulse"
                  >
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </div>
            </Link>

            <div className="flex items-center gap-2 lg:gap-3">
              <div
                className={`hidden items-center gap-2 rounded-full px-5 py-2.5 font-label-md font-bold shadow-clay-surface transition-all duration-300 hover:-translate-y-px lg:flex ${accent.soft}`}
                title="Current streak"
              >
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={{ fontVariationSettings: "FILL 1" }}
                >
                  local_fire_department
                </span>
                <span>{streak}</span>
                <span className="font-label-sm font-normal opacity-70">
                  streak
                </span>
              </div>

              <div
                className="hidden items-center gap-2 rounded-full bg-primary/10 px-5 py-2.5 font-label-md font-bold text-primary shadow-clay-surface transition-all duration-300 hover:-translate-y-px lg:flex"
                title="Total XP"
              >
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={{ fontVariationSettings: "FILL 1" }}
                >
                  bolt
                </span>
                <span>{xp.toLocaleString()}</span>
                <span className="font-label-sm font-normal opacity-70">XP</span>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <div
                className={`flex items-center gap-1 rounded-full px-3 py-2 font-label-sm font-bold shadow-clay-surface ${accent.soft}`}
                title="Current streak"
              >
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "FILL 1" }}
                >
                  local_fire_department
                </span>
                <span className="hidden sm:inline">{streak}</span>
              </div>
              <div
                className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-2 font-label-sm font-bold text-primary shadow-clay-surface"
                title="Total XP"
              >
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: "FILL 1" }}
                >
                  bolt
                </span>
                <span className="hidden sm:inline">{xp.toLocaleString()}</span>
              </div>
            </div>

            <Link href={`/profile/${userId}`} className="group flex items-center gap-3">
              {avatar}
              <div className="hidden flex-col lg:flex">
                <span className="font-label-md font-semibold leading-tight text-text-primary transition-colors group-hover:text-primary">
                  {resolvedName || accent.roleLabel}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`font-label-sm font-extrabold ${accent.text}`}>
                    LVL {level}
                  </span>
                  <span className="font-label-sm text-text-muted">•</span>
                  <span className="font-label-sm font-bold uppercase tracking-wider text-text-muted">
                    {role}
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </header>

        <main className="relative w-full px-4 pb-28 pt-6 lg:px-6 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-50 bg-text-primary/40 backdrop-blur-sm lg:hidden"
          />
          <div className="fixed inset-y-0 left-0 z-50 flex w-[19rem] max-w-[85vw] flex-col bg-surface shadow-clay-surface lg:hidden">
            <div className="flex h-16 items-center justify-between border-b border-surface-border px-4">
              {wordmark}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-[20px] text-text-primary transition-colors hover:bg-surface-border"
              >
                <span className="material-symbols-outlined text-[24px]">
                  close
                </span>
              </button>
            </div>

            <div className="border-b border-surface-border px-4 py-3">
              {roleBadge}
            </div>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4">
              {sidebar.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`${navLinkClass(item.path)} gap-4 px-4 py-3`}
                  aria-current={isActive(item.path) ? "page" : undefined}
                >
                  <span className="material-symbols-outlined text-[24px]">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              ))}

              <div className="my-2 border-t border-surface-border" />
              {more.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 rounded-[24px] px-4 py-3 font-label-md text-text-muted transition-all duration-200 hover:bg-surface-border hover:text-text-primary active:translate-y-[1px]"
                >
                  <span className="material-symbols-outlined text-[24px]">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="border-t border-surface-border px-4 py-4">
              <Link
                href={`/profile/${userId}`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-[24px] px-4 py-3 transition-colors hover:bg-surface-border"
              >
                {avatar}
                <div className="flex flex-col">
                  <span className="font-label-md leading-tight text-text-primary">
                    {resolvedName || accent.roleLabel}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className={`font-label-sm font-extrabold ${accent.text}`}>
                      LVL {level}
                    </span>
                    <span className="font-label-sm text-text-muted">•</span>
                    <span className="font-label-sm font-bold uppercase tracking-wider text-text-muted">
                      {role}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around gap-1 border-t border-surface-border bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-clay-surface backdrop-blur-xl md:hidden lg:hidden">
        {bottom.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            aria-label={item.label}
            aria-current={isActive(item.path) ? "page" : undefined}
            className={[
              "flex min-h-[44px] min-w-[56px] flex-col items-center justify-center rounded-[20px] px-1 transition-all duration-200",
              "active:translate-y-[1px] active:shadow-clay-surface-pressed",
              isActive(item.path) ? accent.soft : "text-text-muted",
            ].join(" ")}
          >
            <span
              className={`material-symbols-outlined text-[22px] ${
                isActive(item.path) ? accent.text : ""
              }`}
            >
              {item.icon}
            </span>
            <span className="mt-0.5 max-w-[64px] truncate font-label-xs">
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}