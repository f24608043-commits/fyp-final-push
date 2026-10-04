import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import ShellChrome from "@/components/shell/ShellChrome";

export default async function Shell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    let profile = null;
    let userRole: "learner" | "tutor" | "admin" | null = null;

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
    }

    if (!profile) {
      redirect("/onboarding");
    }

    if (profile) {
      userRole = profile.role as "learner" | "tutor" | "admin";
    }

    if (userRole) {
      return (
        <ShellChrome
          role={userRole}
          userId={user.id}
          displayName={profile?.displayName || ""}
          avatarUrl={profile?.avatarUrl || ""}
        >
          {children}
        </ShellChrome>
      );
    }
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background">
      <main className="flex-1 w-full">{children}</main>
    </div>
  );
}