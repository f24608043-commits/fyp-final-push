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

  let profile = null;
  try {
    const [profileResult] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);
    profile = profileResult;
  } catch (error) {
    console.error('Error fetching profile:', error);
  }

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <div className="w-full px-6 py-6 bg-gradient-to-br from-background via-purple-50 to-pink-50 min-h-screen">
      {/* Header with Mascot - Stitch Frame Style */}
      <div className="relative w-full bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-3xl p-1 shadow-2xl overflow-hidden mb-6">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-white/40 pointer-events-none"></div>
        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-6 md:p-8">

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-4 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-label-sm text-label-sm tracking-wider uppercase font-bold shadow-lg border-2 border-white/30">⚙️ Settings</span>
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
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Profile Information */}
        <div className="rounded-2xl bg-gradient-to-br from-white to-purple-50 shadow-xl border-4 border-purple-100">
          <div className="p-4 border-b-4 border-purple-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-600 text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>person</span>
              <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold">Profile Information</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block font-label-sm font-semibold mb-2 text-text-muted uppercase tracking-wider">Display Name</label>
              <div className="px-4 py-3 bg-surface-container rounded-xl text-text-primary font-label-md">
                {profile.displayName || "Not set"}
              </div>
            </div>
            <div>
              <label className="block font-label-sm font-semibold mb-2 text-text-muted uppercase tracking-wider">Email</label>
              <div className="px-4 py-3 bg-surface-container rounded-xl text-text-primary font-label-md">
                {user.email}
              </div>
            </div>
            <div>
              <label className="block font-label-sm font-semibold mb-2 text-text-muted uppercase tracking-wider">Role</label>
              <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-label-sm font-bold shadow-lg border-2 border-white/30 capitalize">
                {profile.role}
              </div>
            </div>
          </div>
        </div>

        {/* Learning Preferences */}
        <div className="rounded-2xl bg-gradient-to-br from-white to-blue-50 shadow-xl border-4 border-blue-100">
          <div className="p-4 border-b-4 border-blue-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>school</span>
              <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold">Learning Preferences</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block font-label-sm font-semibold mb-2 text-text-muted uppercase tracking-wider">Daily Goal</label>
              <div className="flex items-center gap-3 px-4 py-3 bg-surface-container rounded-xl">
                <span className="text-2xl">🎯</span>
                <span className="text-text-primary font-label-md">{profile.dailyGoalMinutes} minutes per day</span>
              </div>
            </div>
            <div>
              <label className="block font-label-sm font-semibold mb-2 text-text-muted uppercase tracking-wider">Onboarding Status</label>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-label-sm font-bold ${
                profile.onboardingDone
                  ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg border-2 border-white/30"
                  : "bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600 border-2 border-gray-300"
              }`}>
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: 'FILL 1' }}>
                  {profile.onboardingDone ? "check_circle" : "pending"}
                </span>
                {profile.onboardingDone ? "Completed" : "Not Started"}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-2xl bg-gradient-to-br from-white to-amber-50 shadow-xl border-4 border-amber-100">
          <div className="p-4 border-b-4 border-amber-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>emoji_events</span>
              <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold">Your Stats</h2>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-yellow-100 to-amber-100 rounded-2xl p-6 text-center shadow-lg border-4 border-yellow-200">
              <div className="text-4xl mb-2">⚡</div>
              <p className="font-headline-xl text-amber-700 font-extrabold">{profile.xp?.toLocaleString() || 0}</p>
              <p className="font-label-sm text-amber-600 font-bold uppercase tracking-wider">Total XP</p>
            </div>
            <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl p-6 text-center shadow-lg border-4 border-orange-200">
              <div className="text-4xl mb-2">🔥</div>
              <p className="font-headline-xl text-orange-700 font-extrabold">{profile.streakCount || 0}</p>
              <p className="font-label-sm text-orange-600 font-bold uppercase tracking-wider">Day Streak</p>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-6 text-center shadow-lg border-4 border-purple-200">
              <div className="text-4xl mb-2">📊</div>
              <p className="font-headline-xl text-purple-700 font-extrabold">
                {Math.floor(Math.sqrt((profile.xp || 0) / 100)) + 1}
              </p>
              <p className="font-label-sm text-purple-600 font-bold uppercase tracking-wider">Level</p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 border-4 border-red-200 shadow-xl">
          <div className="p-4 border-b-4 border-red-200">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600 text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>warning</span>
              <h2 className="font-headline-md text-headline-md text-red-700 font-extrabold">Danger Zone</h2>
            </div>
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
