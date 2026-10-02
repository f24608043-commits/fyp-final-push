import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import AppShell from "./AppShell";
import UnifiedShell from "./UnifiedShell";

export default async function Shell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userData = undefined;
  let userRole: "learner" | "tutor" | "admin" | null = null;
  let profile = null;
  
  if (user) {
    try {
      const [profileResult] = await db
        .select({
          id: profiles.id,
          role: profiles.role,
          displayName: profiles.displayName,
          avatarUrl: profiles.avatarUrl,
        })
        .from(profiles)
        .where(eq(profiles.id, user.id))
        .limit(1);

      profile = profileResult;
    } catch (error) {
      console.error("Error fetching profile in Shell:", error);
      // Continue without profile data if query fails
    }
    
    if (profile) {
      userData = {
        id: profile.id,
        displayName: profile.displayName,
        email: user.email || "",
        role: profile.role as "learner" | "tutor" | "admin",
      };
      userRole = profile.role as "learner" | "tutor" | "admin";
    }
  }

  // Use UnifiedShell for authenticated users with valid profile
  // If user exists but profile is missing/invalid, redirect to onboarding
  if (user) {
    if (!profile) {
      // User exists but no profile - redirect to onboarding
      redirect("/onboarding");
    }
    if (userRole) {
      return (
        <UnifiedShell 
          role={userRole}
          initialXp={0}
          initialStreak={0}
          initialDisplayName={userData?.displayName || ""}
        >
          {children}
        </UnifiedShell>
      );
    }
  }

  // AppShell for non-authenticated users (sign-in, sign-up pages)
  return <AppShell user={userData}>{children}</AppShell>;
}
