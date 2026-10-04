import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { groups, groupMembers, profiles, enrollmentRequests } from "@/db/schema";
import { eq, and, count, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import Mascot from "@/components/Mascot";

export default async function LearnerClassesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch user profile to check role
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  // Only learners can access this page
  if (profile?.role !== "learner") {
    redirect("/tutoring/classes");
  }

  // Fetch learner's enrolled groups
  const enrolledGroups = await db
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
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .innerJoin(profiles, eq(groups.tutorId, profiles.id))
    .where(eq(groupMembers.userId, user.id));

  // Fetch pending enrollment requests
  const pendingRequests = await db
    .select({
      id: enrollmentRequests.id,
      groupId: enrollmentRequests.groupId,
      groupName: groups.name,
      groupSubject: groups.subject,
      tutorName: profiles.displayName,
      requestedAt: enrollmentRequests.requestedAt,
    })
    .from(enrollmentRequests)
    .innerJoin(groups, eq(enrollmentRequests.groupId, groups.id))
    .innerJoin(profiles, eq(groups.tutorId, profiles.id))
    .where(
      and(
        eq(enrollmentRequests.studentId, user.id),
        eq(enrollmentRequests.status, "pending")
      )
    );

  return (
    <div className="w-full px-8 py-8 bg-gradient-to-br from-primary/10 via-tertiary/10 to-tertiary/10 min-h-screen">
      {/* Header */}
      <div className="relative w-full bg-gradient-to-br from-primary via-tertiary to-tertiary rounded-3xl p-1 shadow-clay-surface overflow-hidden mb-8">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-surface/40 pointer-events-none"></div>
        <div className="relative bg-surface/95 backdrop-blur-sm rounded-[24px] p-8 md:p-10">
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-4 py-1 rounded-full bg-gradient-to-r from-primary to-tertiary text-text-primary font-label-sm text-label-sm tracking-wider uppercase font-bold shadow-clay-surface border-2 border-surface/30">📚 My Classes</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-text-muted tracking-tight leading-none">
                My Classes
              </h1>
              <p className="font-body-lg text-body-lg text-text-muted leading-relaxed">
                View your enrolled classes and join new ones
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/classes/join"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-tertiary text-text-primary px-6 py-3 font-label-md font-bold shadow-clay-surface border-2 border-surface/30 transform hover:scale-105 transition-transform duration-150 active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">login</span>
                Join Class
              </Link>
              <Link
                href="/classes/browse"
                className="inline-flex items-center gap-2 rounded-full bg-surface border-2 border-surface-border text-text-muted px-6 py-3 font-label-md font-semibold shadow-clay-surface hover:shadow-clay-surface transition-shadow duration-150"
              >
                <span className="material-symbols-outlined text-[20px]">search</span>
                Browse Classes
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-8 rounded-[24px] bg-secondary/10 p-8 shadow-clay-surface border border-secondary/30">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-secondary text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>schedule</span>
            <h2 className="font-headline-lg text-headline-lg text-secondary font-extrabold">
              Pending Requests ({pendingRequests.length})
            </h2>
          </div>
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div key={request.id} className="rounded-[24px] bg-surface p-6 shadow-clay-surface border border-secondary/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-label-md text-text-muted font-semibold">
                      {request.groupName}
                    </p>
                    <p className="font-body-sm text-text-muted">
                      by {request.tutorName} {request.groupSubject && `• ${request.groupSubject}`}
                    </p>
                    <p className="font-body-sm text-text-muted mt-1">
                      Requested {new Date(request.requestedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-4 py-2 rounded-full bg-secondary/10 text-secondary font-label-sm font-semibold shadow-clay-secondary">
                    Pending
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enrolled Classes */}
      {enrolledGroups.length === 0 ? (
        <div className="rounded-[24px] bg-surface p-12 text-center shadow-clay-surface border border-surface-border">
          <div className="relative w-24 h-24 rounded-xl bg-surface-border flex items-center justify-center overflow-hidden shadow-clay-primary mx-auto mb-6 border-2 border-surface/30">
            <span className="material-symbols-outlined text-text-muted text-[48px]">school</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-text-muted font-bold mb-2">No Classes Yet</h2>
          <p className="font-body-md text-text-muted mb-6">Browse available classes to get started</p>
          <Link
            href="/classes/browse"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-tertiary text-text-primary px-6 py-3 font-label-md font-bold shadow-clay-primary border-2 border-surface/30 transform hover:scale-105 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">search</span>
            Browse Classes
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {enrolledGroups.map((group) => (
            <Link
              key={group.id}
              href={`/classes/${group.id}`}
              className="rounded-[24px] bg-surface p-6 shadow-clay-surface border border-surface-border hover:shadow-clay-primary transition-all cursor-pointer"
            >
              {group.coverImageUrl ? (
                <div className="w-full h-32 rounded-xl bg-gradient-to-br from-primary/10 to-tertiary/10 mb-4 overflow-hidden border-2 border-surface-border">
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
                <div className="w-full h-32 rounded-xl bg-gradient-to-br from-primary/10 to-tertiary/10 mb-4 flex items-center justify-center border-2 border-surface-border shadow-clay-secondary">
                  <span className="material-symbols-outlined text-primary text-[48px]">school</span>
                </div>
              )}
              <h3 className="font-headline-md text-headline-md text-text-muted font-bold mb-2">
                {group.name}
              </h3>
              {group.subject && (
                <p className="font-body-sm text-text-muted mb-2">{group.subject}</p>
              )}
              <div className="flex items-center gap-2 mb-3">
                {group.tutorAvatar ? (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-tertiary flex items-center justify-center text-text-primary font-bold text-sm border-2 border-surface/30 shadow-clay-primary">
                    {group.tutorName?.[0] || "?"}
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-tertiary flex items-center justify-center text-text-primary font-bold text-sm border-2 border-surface/30 shadow-clay-primary">
                    {group.tutorName?.[0] || "?"}
                  </div>
                )}
                <p className="font-body-sm text-text-muted">
                  {group.tutorName || "Unknown Tutor"}
                </p>
              </div>
              {group.description && (
                <p className="font-body-sm text-text-muted mb-4 line-clamp-2">
                  {group.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
