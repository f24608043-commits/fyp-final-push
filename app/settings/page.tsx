import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { profiles, tutorProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import Mascot from "@/components/Mascot";
import SettingsProfile from "./components/SettingsProfile";
import SettingsAccount from "./components/SettingsAccount";
import SettingsNotifications from "./components/SettingsNotifications";
import SettingsPrivacy from "./components/SettingsPrivacy";
import SettingsTutor from "./components/SettingsTutor";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  let profile = null;
  let tutorProfile = null;
  try {
    const [profileResult] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);
    profile = profileResult;

    // Fetch tutor profile if user is a tutor
    if (profile?.role === "tutor") {
      const [tutorResult] = await db
        .select()
        .from(tutorProfiles)
        .where(eq(tutorProfiles.tutorId, user.id))
        .limit(1);
      tutorProfile = tutorResult;
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
  }

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <div className="w-full px-8 py-8 bg-gradient-to-br from-background via-blue-50 to-cyan-50 min-h-screen">
      {/* Header */}
      <div className="relative w-full bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 rounded-3xl p-1 shadow-2xl overflow-hidden mb-8">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-white/40 pointer-events-none"></div>
        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-8 md:p-10">
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-4 py-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-label-sm text-label-sm tracking-wider uppercase font-bold shadow-lg border-2 border-white/30">⚙️ Settings</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-text-primary tracking-tight leading-none">
                Account Settings
              </h1>
              <p className="font-body-lg text-body-lg text-text-muted leading-relaxed">
                Manage your account preferences and profile information
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 md:w-28 md:h-28 shrink-0">
                <Mascot pose="idle" size={112} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 mb-6 border-b-2 border-surface-border pb-4 overflow-x-auto">
        <Link
          href="/settings?tab=profile"
          className="px-4 py-2 rounded-full bg-primary text-white font-label-md font-semibold shadow-clay-primary whitespace-nowrap"
        >
          Profile
        </Link>
        <Link
          href="/settings?tab=account"
          className="px-4 py-2 rounded-full bg-surface text-text-muted font-label-md font-semibold hover:bg-surface-hover transition-all whitespace-nowrap"
        >
          Account
        </Link>
        <Link
          href="/settings?tab=notifications"
          className="px-4 py-2 rounded-full bg-surface text-text-muted font-label-md font-semibold hover:bg-surface-hover transition-all whitespace-nowrap"
        >
          Notifications
        </Link>
        <Link
          href="/settings?tab=privacy"
          className="px-4 py-2 rounded-full bg-surface text-text-muted font-label-md font-semibold hover:bg-surface-hover transition-all whitespace-nowrap"
        >
          Privacy
        </Link>
        {profile.role === "tutor" && (
          <Link
            href="/settings?tab=tutor"
            className="px-4 py-2 rounded-full bg-surface text-text-muted font-label-md font-semibold hover:bg-surface-hover transition-all whitespace-nowrap"
          >
            Tutor Settings
          </Link>
        )}
      </div>

      {/* Settings Content */}
      <div className="space-y-6">
        <SettingsProfile profile={profile} user={user} />
        <SettingsAccount user={user} />
        <SettingsNotifications />
        <SettingsPrivacy />
        {profile.role === "tutor" && <SettingsTutor tutorProfile={tutorProfile} />}
      </div>
    </div>
  );
}
