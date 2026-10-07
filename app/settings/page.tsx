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
    <div className={`w-full px-4 py-4 md:px-8 md:py-8 ${bgGradient} min-h-screen`}>
      {/* Header */}
      <div className={`relative w-full ${themeGradient} rounded-2xl md:rounded-3xl p-1 shadow-clay-surface overflow-hidden mb-6 md:mb-8`}>
        <div className="absolute inset-0 rounded-2xl md:rounded-3xl border-4 border-dashed border-surface/40 pointer-events-none"></div>
        <div className="relative bg-surface/95 backdrop-blur-sm rounded-[20px] md:rounded-[24px] p-4 md:p-6 lg:p-8 lg:p-10">
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 md:gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 md:px-4 md:py-1 rounded-full ${activeTabBg} text-text-primary font-label-xs md:font-label-sm tracking-wider uppercase font-bold shadow-clay-surface border-2 border-surface/30`}>⚙️ Settings</span>
              </div>
              <h1 className="font-headline-lg md:font-headline-xl text-text-muted tracking-tight leading-none">
                Account Settings
              </h1>
              <p className="font-body-sm md:font-body-lg text-text-muted leading-relaxed">
                Manage your account preferences and profile information
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 md:w-24 md:h-24 lg:w-28 lg:h-28 shrink-0">
                <Mascot pose="idle" size={112} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 mb-4 md:mb-6 border-b-2 border-surface-border pb-3 md:pb-4 overflow-x-auto">
        <Link
          href="/settings?tab=profile"
          className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full ${activeTabBg} text-text-primary font-label-sm md:font-label-md font-semibold shadow-clay-primary border-2 border-surface/30 whitespace-nowrap text-sm md:text-base`}
        >
          Profile
        </Link>
        <Link
          href="/settings?tab=account"
          className="px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-surface text-text-muted font-label-sm md:font-label-md font-semibold hover:bg-surface transition-all whitespace-nowrap border-2 border-surface-border text-sm md:text-base"
        >
          Account
        </Link>
        <Link
          href="/settings?tab=notifications"
          className="px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-surface text-text-muted font-label-sm md:font-label-md font-semibold hover:bg-surface transition-all whitespace-nowrap border-2 border-surface-border text-sm md:text-base"
        >
          Notifications
        </Link>
        <Link
          href="/settings?tab=privacy"
          className="px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-surface text-text-muted font-label-sm md:font-label-md font-semibold hover:bg-surface transition-all whitespace-nowrap border-2 border-surface-border text-sm md:text-base"
        >
          Privacy
        </Link>
        {profile.role === "tutor" && (
          <Link
            href="/settings?tab=tutor"
            className="px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-surface text-text-muted font-label-sm md:font-label-md font-semibold hover:bg-surface transition-all whitespace-nowrap border-2 border-surface-border text-sm md:text-base"
          >
            Tutor Settings
          </Link>
        )}
      </div>

      {/* Settings Content */}
      <div className="space-y-4 md:space-y-6">
        <SettingsProfile profile={profile} user={user} />
        <SettingsAccount user={user} />
        <SettingsNotifications />
        <SettingsPrivacy />
        {profile.role === "tutor" && <SettingsTutor tutorProfile={tutorProfile} />}
      </div>
    </div>
  );
}
