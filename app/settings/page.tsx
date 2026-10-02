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
    ? "from-amber-500 via-orange-500 to-indigo-500"
    : isLearner 
    ? "from-emerald-500 via-violet-500 to-sky-500"
    : "from-slate-500 via-gray-500 to-zinc-500";

  const bgGradient = isTutor
    ? "from-slate-50 via-amber-50 to-indigo-50"
    : isLearner
    ? "from-emerald-50 via-violet-50 to-sky-50"
    : "from-slate-50 via-gray-50 to-zinc-50";

  const activeTabBg = isTutor
    ? "bg-gradient-to-r from-amber-500 to-orange-500"
    : isLearner
    ? "bg-gradient-to-r from-emerald-500 to-teal-500"
    : "bg-gradient-to-r from-slate-500 to-gray-500";

  const hoverColor = isTutor ? "hover:text-amber-600" : isLearner ? "hover:text-emerald-600" : "hover:text-slate-600";

  return (
    <div className={`w-full px-8 py-8 bg-gradient-to-br ${bgGradient} min-h-screen`}>
      {/* Header */}
      <div className={`relative w-full bg-gradient-to-br ${themeGradient} rounded-3xl p-1 shadow-2xl overflow-hidden mb-8`}>
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-white/40 pointer-events-none"></div>
        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-8 md:p-10">
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-4 py-1 rounded-full ${activeTabBg} text-white font-label-sm text-label-sm tracking-wider uppercase font-bold shadow-lg border-2 border-white/30`}>⚙️ Settings</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-slate-900 tracking-tight leading-none">
                Account Settings
              </h1>
              <p className="font-body-lg text-body-lg text-slate-600 leading-relaxed">
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
      <div className="flex gap-2 mb-6 border-b-2 border-slate-200 pb-4 overflow-x-auto">
        <Link
          href="/settings?tab=profile"
          className={`px-4 py-2 rounded-full ${activeTabBg} text-white font-label-md font-semibold shadow-clay-primary border-2 border-white/30 whitespace-nowrap`}
        >
          Profile
        </Link>
        <Link
          href="/settings?tab=account"
          className="px-4 py-2 rounded-full bg-white text-slate-600 font-label-md font-semibold hover:bg-slate-100 transition-all whitespace-nowrap border-2 border-slate-200"
        >
          Account
        </Link>
        <Link
          href="/settings?tab=notifications"
          className="px-4 py-2 rounded-full bg-white text-slate-600 font-label-md font-semibold hover:bg-slate-100 transition-all whitespace-nowrap border-2 border-slate-200"
        >
          Notifications
        </Link>
        <Link
          href="/settings?tab=privacy"
          className="px-4 py-2 rounded-full bg-white text-slate-600 font-label-md font-semibold hover:bg-slate-100 transition-all whitespace-nowrap border-2 border-slate-200"
        >
          Privacy
        </Link>
        {profile.role === "tutor" && (
          <Link
            href="/settings?tab=tutor"
            className="px-4 py-2 rounded-full bg-white text-slate-600 font-label-md font-semibold hover:bg-slate-100 transition-all whitespace-nowrap border-2 border-slate-200"
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
