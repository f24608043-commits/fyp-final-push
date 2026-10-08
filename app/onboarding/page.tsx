import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { courses, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch user profile and published courses in parallel
  const [userProfileResult, publishedCourses] = await Promise.all([
    db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1),
    db.select().from(courses).where(eq(courses.isPublished, true)),
  ]);

  const userProfile = userProfileResult[0];

  if (userProfile?.onboardingDone) {
    redirect("/path");
  }

  const params = await searchParams;

  // Show error if present
  if (params.error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-[24px] bg-surface p-8 shadow-clay-surface border border-surface-border text-center">
          <h1 className="font-headline-xl text-text-primary font-extrabold mb-4">Error</h1>
          <p className="font-body-md text-text-muted mb-6">{params.error}</p>
          <button
            onClick={() => window.location.href = "/onboarding"}
            className="px-6 py-3 rounded-full bg-primary text-text-primary font-label-md font-bold uppercase tracking-wider shadow-clay-primary hover:bg-primary/90 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return <OnboardingForm publishedCourses={publishedCourses} userProfile={userProfile} />;
}
