import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Mascot from "@/components/Mascot";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <div className="w-full px-6 py-6">
      {/* Header with Mascot */}
      <div className="relative w-full rounded-3xl bg-surface p-6 md:p-8 shadow-clay-surface border border-surface-border overflow-hidden mb-6">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-primary/25 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-tertiary/30 blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 rounded-lg bg-surface-container-high text-text-muted font-label-sm text-label-sm tracking-wider uppercase">Settings</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-text-primary tracking-tight leading-none">
              Account Settings
            </h1>
            <p className="font-body-lg text-body-lg text-text-muted leading-relaxed">
              Manage your account preferences and profile information
            </p>
          </div>

          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center lg:items-end justify-center gap-4 shrink-0 self-center lg:self-auto">
            <div className="relative w-28 h-28 md:w-32 md:h-32 shrink-0">
              <Mascot pose="idle" size={128} />
            </div>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Profile Information */}
        <div className="rounded-2xl bg-surface shadow-clay-surface border border-surface-border">
          <div className="p-4 border-b border-surface-border">
            <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold">Profile Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block font-label-md text-text-primary font-semibold mb-2">Display Name</label>
              <div className="px-4 py-3 bg-surface-container rounded-xl text-text-primary">
                {profile.displayName || "Not set"}
              </div>
            </div>
            <div>
              <label className="block font-label-md text-text-primary font-semibold mb-2">Email</label>
              <div className="px-4 py-3 bg-surface-container rounded-xl text-text-primary">
                {user.email}
              </div>
            </div>
            <div>
              <label className="block font-label-md text-text-primary font-semibold mb-2">Role</label>
              <div className="px-4 py-3 bg-surface-container rounded-xl text-text-primary capitalize">
                {profile.role}
              </div>
            </div>
          </div>
        </div>

        {/* Learning Preferences */}
        <div className="rounded-2xl bg-surface shadow-clay-surface border border-surface-border">
          <div className="p-4 border-b border-surface-border">
            <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold">Learning Preferences</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block font-label-md text-text-primary font-semibold mb-2">Daily Goal (minutes)</label>
              <div className="px-4 py-3 bg-surface-container rounded-xl text-text-primary">
                {profile.dailyGoalMinutes} minutes
              </div>
            </div>
            <div>
              <label className="block font-label-md text-text-primary font-semibold mb-2">Onboarding Completed</label>
              <div className="px-4 py-3 bg-surface-container rounded-xl text-text-primary">
                {profile.onboardingDone ? "Yes" : "No"}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-2xl bg-surface shadow-clay-surface border border-surface-border">
          <div className="p-4 border-b border-surface-border">
            <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold">Your Stats</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface-container rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">⚡</div>
              <p className="font-headline-xl text-primary font-extrabold">{profile.xp}</p>
              <p className="font-label-sm text-text-muted">Total XP</p>
            </div>
            <div className="bg-surface-container rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">🔥</div>
              <p className="font-headline-xl text-secondary font-extrabold">{profile.streakCount}</p>
              <p className="font-label-sm text-text-muted">Day Streak</p>
            </div>
            <div className="bg-surface-container rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">📊</div>
              <p className="font-headline-xl text-tertiary font-extrabold">
                {Math.floor(Math.sqrt(profile.xp / 100)) + 1}
              </p>
              <p className="font-label-sm text-text-muted">Level</p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-2xl bg-error/10 border border-error/20 shadow-clay-error">
          <div className="p-4 border-b border-error/20">
            <h2 className="font-headline-md text-headline-md text-error font-extrabold">Danger Zone</h2>
          </div>
          <div className="p-6">
            <p className="font-body-md text-text-muted mb-4">
              Account deletion and other dangerous actions coming soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
