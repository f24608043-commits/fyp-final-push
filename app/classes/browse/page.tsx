import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { groups, profiles, groupMembers } from "@/db/schema";
import { eq, and, desc, not } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { joinClass } from "./actions";

export default async function BrowseClassesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch public groups that user is not already a member of
  const availableGroups = await db
    .select({
      id: groups.id,
      name: groups.name,
      description: groups.description,
      subject: groups.subject,
      gradeLevel: groups.gradeLevel,
      coverImageUrl: groups.coverImageUrl,
      groupCode: groups.groupCode,
      privacy: groups.privacy,
      createdAt: groups.createdAt,
      tutorId: groups.tutorId,
      tutorName: profiles.displayName,
      tutorAvatar: profiles.avatarUrl,
    })
    .from(groups)
    .innerJoin(profiles, eq(groups.tutorId, profiles.id))
    .where(eq(groups.privacy, "public"))
    .orderBy(desc(groups.createdAt))
    .limit(20);

  // Get user's enrolled group IDs
  const enrolledGroupIds = await db
    .select({ groupId: groupMembers.groupId })
    .from(groupMembers)
    .where(eq(groupMembers.userId, user.id));

  const enrolledIds = new Set(enrolledGroupIds.map(g => g.groupId));

  return (
    <div className="w-full px-8 py-8 bg-gradient-to-br from-background via-tertiary/10 to-tertiary/10 min-h-screen">
      {/* Header */}
      <div className="relative w-full bg-tertiary rounded-3xl p-1 shadow-clay-surface overflow-hidden mb-8">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-surface/40 pointer-events-none"></div>
        <div className="relative bg-surface/95 backdrop-blur-sm rounded-[24px] p-8 md:p-10">
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Link
                href="/classes"
                className="inline-flex items-center gap-1 text-text-muted hover:text-primary font-label-sm font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to My Classes
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-4 py-1 rounded-full bg-tertiary text-text-primary font-label-sm text-label-sm tracking-wider uppercase font-bold shadow-clay-surface border-2 border-surface/30">🔍 Browse Classes</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-text-primary tracking-tight leading-none">
                Discover Classes
              </h1>
              <p className="font-body-lg text-body-lg text-text-muted leading-relaxed">
                Find and join public classes available to everyone
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      {availableGroups.length === 0 ? (
        <div className="rounded-[24px] bg-surface p-12 text-center shadow-clay-surface border-4 border-surface/50">
          <span className="material-symbols-outlined text-text-primary text-[64px]">school</span>
          <h2 className="font-headline-lg text-headline-lg text-text-primary font-bold mt-4 mb-2">No Public Classes Available</h2>
          <p className="font-body-md text-text-muted mb-6">
            Check back later or ask your tutor to make their class public
          </p>
          <Link
            href="/classes/join"
            className="inline-flex items-center gap-2 rounded-full bg-tertiary text-text-primary px-6 py-3 font-label-md font-bold shadow-clay-surface border-4 border-surface/30 transform hover:scale-105 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">login</span>
            Join with Code
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {availableGroups.map((group) => {
            const isEnrolled = enrolledIds.has(group.id);
            return (
              <div
                key={group.id}
                className="rounded-[24px] bg-surface p-6 shadow-clay-surface border border-surface-border"
              >
                {group.coverImageUrl ? (
                  <div className="w-full h-32 rounded-xl bg-tertiary/10 mb-4 overflow-hidden border-2 border-surface-border">
                    <img
                      src={group.coverImageUrl}
                      alt={group.name}
                      loading="lazy"
                      decoding="async"
                      width={640}
                      height={256}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-32 rounded-xl bg-tertiary/10 mb-4 flex items-center justify-center border-2 border-surface-border">
                    <span className="material-symbols-outlined text-tertiary text-[48px]">school</span>
                  </div>
                )}
                <h3 className="font-headline-md text-headline-md text-text-primary font-bold mb-2">
                  {group.name}
                </h3>
                {group.subject && (
                  <p className="font-body-sm text-text-muted mb-2">{group.subject}</p>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-tertiary flex items-center justify-center text-text-primary font-bold text-sm border-2 border-surface/30">
                    {group.tutorName?.[0] || "?"}
                  </div>
                  <p className="font-body-sm text-text-muted">
                    {group.tutorName || "Unknown Tutor"}
                  </p>
                </div>
                {group.description && (
                  <p className="font-body-sm text-text-muted mb-4 line-clamp-2">
                    {group.description}
                  </p>
                )}
                {isEnrolled ? (
                  <Link
                    href={`/classes/${group.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-surface-border border-2 border-surface-border text-text-primary px-4 py-2 font-label-md font-semibold"
                  >
                    <span className="material-symbols-outlined text-[18px]">check</span>
                    Enrolled
                  </Link>
                ) : (
                  <form action={joinClass}>
                    <input type="hidden" name="groupId" value={group.id} />
                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-tertiary text-text-primary px-4 py-2 font-label-md font-bold shadow-clay-primary border-2 border-surface/30 transform hover:scale-105 transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      Join Class
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
