import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { groups, groupMembers, profiles } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import Mascot from "@/components/Mascot";

export default async function TutorClassesPage() {
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

  // Only tutors can access this page
  if (profile?.role !== "tutor") {
    redirect("/tutoring");
  }

  // Fetch tutor's groups with member counts
  const tutorGroups = await db
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
      memberCount: count(groupMembers.userId),
    })
    .from(groups)
    .leftJoin(groupMembers, eq(groups.id, groupMembers.groupId))
    .where(eq(groups.tutorId, user.id))
    .groupBy(groups.id);

  return (
    <div className="w-full px-8 py-8 bg-gradient-to-br from-background via-tertiary/10 to-tertiary/10 min-h-screen">
      {/* Header */}
      <div className="relative w-full bg-tertiary rounded-3xl p-1 shadow-clay-surface overflow-hidden mb-8">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-surface/40 pointer-events-none"></div>
        <div className="relative bg-surface/95 backdrop-blur-sm rounded-[24px] p-8 md:p-10">
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-4 py-1 rounded-full bg-tertiary text-text-primary font-label-sm text-label-sm tracking-wider uppercase font-bold shadow-clay-surface border-2 border-surface/30">📚 My Classes</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-text-primary tracking-tight leading-none">
                My Classes & Groups
              </h1>
              <p className="font-body-lg text-body-lg text-text-muted leading-relaxed">
                Manage your classes, assignments, and student enrollments
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/tutoring/classes/create"
                className="inline-flex items-center gap-2 rounded-full bg-tertiary text-text-primary px-6 py-3 font-label-md font-bold shadow-clay-surface border-4 border-surface/30 transform hover:scale-105 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                Create Class
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      {tutorGroups.length === 0 ? (
        <div className="rounded-[24px] bg-surface p-12 text-center shadow-clay-surface border-4 border-surface/50">
          <div className="relative w-24 h-24 rounded-xl bg-surface-border flex items-center justify-center overflow-hidden shadow-clay-surface mx-auto mb-6 border-4 border-surface/30">
            <Mascot pose="empty" size={96} />
          </div>
          <h2 className="font-headline-lg text-headline-lg text-text-primary font-bold mb-2">No Classes Yet</h2>
          <p className="font-body-md text-text-muted mb-6">Create your first class to start teaching students</p>
          <Link
            href="/tutoring/classes/create"
            className="inline-flex items-center gap-2 rounded-full bg-tertiary text-text-primary px-6 py-3 font-label-md font-bold shadow-clay-surface border-4 border-surface/30 transform hover:scale-105 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Create Your First Class
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tutorGroups.map((group: any) => (
            <Link
              key={group.id}
              href={`/tutoring/classes/${group.id}`}
              className="rounded-[24px] bg-surface p-6 shadow-clay-surface border border-surface-border hover:shadow-clay-primary transition-all cursor-pointer"
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
              {group.description && (
                <p className="font-body-sm text-text-muted mb-4 line-clamp-2">
                  {group.description}
                </p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-primary text-[18px]">people</span>
                  <span className="font-label-sm font-semibold text-text-primary">
                    {Number(group.memberCount)} students
                  </span>
                </div>
                {group.groupCode && (
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-label-sm font-semibold border border-primary/20">
                    Code: {group.groupCode}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
