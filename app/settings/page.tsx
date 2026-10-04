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

  const isTutor = profile?.role === "tutor";
  const isLearner = profile?.role === "learner";

  const themeGradient = isTutor 
    ? "from-secondary via-secondary to-tertiary"
    : isLearner 
    ? "from-primary via-tertiary to-tertiary"
    : "bg-surface-border";

  const bgGradient = isTutor
    ? "from-surface via-secondary/10 to-tertiary/10"
    : isLearner
    ? "from-primary/10 via-tertiary/10 to-tertiary/10"
    : "bg-surface";

  const activeTabBg = isTutor
    ? "bg-secondary"
    : isLearner
    ? "bg-gradient-to-r from-primary to-tertiary"
    : "bg-surface-border";

  const hoverColor = isTutor ? "hover:text-secondary" : isLearner ? "hover:text-success" : "hover:text-text-muted";

  return (
    <div className={`w-full px-8 py-8 ${bgGradient} min-h-screen`}>
      {/* Header */}
      <div className={`relative w-full ${themeGradient} rounded-3xl p-1 shadow-clay-surface overflow-hidden mb-8`}>
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-surface/40 pointer-events-none"></div>
        <div className="relative bg-surface/95 backdrop-blur-sm rounded-[24px] p-8 md:p-10">
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-4 py-1 rounded-full ${activeTabBg} text-text-primary font-label-sm text-label-sm tracking-wider uppercase font-bold shadow-clay-surface border-2 border-surface/30`}>⚙️ Settings</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-text-muted tracking-tight leading-none">
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
          className={`px-4 py-2 rounded-full ${activeTabBg} text-text-primary font-label-md font-semibold shadow-clay-primary border-2 border-surface/30 whitespace-nowrap`}
        >
          Profile
        </Link>
        <Link
          href="/settings?tab=account"
          className="px-4 py-2 rounded-full bg-surface text-text-muted font-label-md font-semibold hover:bg-surface transition-all whitespace-nowrap border-2 border-surface-border"
        >
          Account
        </Link>
        <Link
          href="/settings?tab=notifications"
          className="px-4 py-2 rounded-full bg-surface text-text-muted font-label-md font-semibold hover:bg-surface transition-all whitespace-nowrap border-2 border-surface-border"
        >
          Notifications
        </Link>
        <Link
          href="/settings?tab=privacy"
          className="px-4 py-2 rounded-full bg-surface text-text-muted font-label-md font-semibold hover:bg-surface transition-all whitespace-nowrap border-2 border-surface-border"
        >
          Privacy
        </Link>
        {profile.role === "tutor" && (
          <Link
            href="/settings?tab=tutor"
            className="px-4 py-2 rounded-full bg-surface text-text-muted font-label-md font-semibold hover:bg-surface transition-all whitespace-nowrap border-2 border-surface-border"
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
