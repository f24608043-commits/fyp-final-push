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
    <div className="w-full px-8 py-8 bg-gradient-to-br from-emerald-50 via-violet-50 to-sky-50 min-h-screen">
      {/* Header */}
      <div className="relative w-full bg-gradient-to-br from-emerald-500 via-violet-500 to-sky-500 rounded-3xl p-1 shadow-2xl overflow-hidden mb-8">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-white/40 pointer-events-none"></div>
        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-8 md:p-10">
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-4 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-violet-500 text-white font-label-sm text-label-sm tracking-wider uppercase font-bold shadow-lg border-2 border-white/30">📚 My Classes</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-slate-900 tracking-tight leading-none">
                My Classes
              </h1>
              <p className="font-body-lg text-body-lg text-slate-600 leading-relaxed">
                View your enrolled classes and join new ones
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/classes/join"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 font-label-md font-bold shadow-beautiful-md border-2 border-white/30 transform hover:scale-105 transition-transform duration-150 active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">login</span>
                Join Class
              </Link>
              <Link
                href="/classes/browse"
                className="inline-flex items-center gap-2 rounded-full bg-white border-2 border-slate-200 text-slate-900 px-6 py-3 font-label-md font-semibold shadow-beautiful-sm hover:shadow-beautiful-md transition-shadow duration-150"
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
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 p-8 shadow-clay-surface border border-amber-200">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-amber-600 text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>schedule</span>
            <h2 className="font-headline-lg text-headline-lg text-amber-900 font-extrabold">
              Pending Requests ({pendingRequests.length})
            </h2>
          </div>
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div key={request.id} className="rounded-2xl bg-white p-6 shadow-clay-surface border border-amber-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-label-md text-slate-900 font-semibold">
                      {request.groupName}
                    </p>
                    <p className="font-body-sm text-slate-600">
                      by {request.tutorName} {request.groupSubject && `• ${request.groupSubject}`}
                    </p>
                    <p className="font-body-sm text-slate-500 mt-1">
                      Requested {new Date(request.requestedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-4 py-2 rounded-full bg-amber-100 text-amber-700 font-label-sm font-semibold shadow-clay-secondary">
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
        <div className="rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 p-12 text-center shadow-clay-surface border border-slate-300">
          <div className="relative w-24 h-24 rounded-xl bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center overflow-hidden shadow-clay-primary mx-auto mb-6 border-2 border-white/30">
            <span className="material-symbols-outlined text-slate-600 text-[48px]">school</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-slate-900 font-bold mb-2">No Classes Yet</h2>
          <p className="font-body-md text-slate-600 mb-6">Browse available classes to get started</p>
          <Link
            href="/classes/browse"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 font-label-md font-bold shadow-clay-primary border-2 border-white/30 transform hover:scale-105 transition-all active:scale-95"
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
              className="rounded-2xl bg-white p-6 shadow-clay-surface border border-slate-200 hover:shadow-clay-primary transition-all cursor-pointer"
            >
              {group.coverImageUrl ? (
                <div className="w-full h-32 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 mb-4 overflow-hidden border-2 border-slate-200">
                  <img
                    src={group.coverImageUrl}
                    alt={group.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-32 rounded-xl bg-gradient-to-br from-emerald-100 to-violet-100 mb-4 flex items-center justify-center border-2 border-slate-200 shadow-clay-secondary">
                  <span className="material-symbols-outlined text-emerald-500 text-[48px]">school</span>
                </div>
              )}
              <h3 className="font-headline-md text-headline-md text-slate-900 font-bold mb-2">
                {group.name}
              </h3>
              {group.subject && (
                <p className="font-body-sm text-slate-600 mb-2">{group.subject}</p>
              )}
              <div className="flex items-center gap-2 mb-3">
                {group.tutorAvatar ? (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm border-2 border-white/30 shadow-clay-primary">
                    {group.tutorName?.[0] || "?"}
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm border-2 border-white/30 shadow-clay-primary">
                    {group.tutorName?.[0] || "?"}
                  </div>
                )}
                <p className="font-body-sm text-slate-600">
                  {group.tutorName || "Unknown Tutor"}
                </p>
              </div>
              {group.description && (
                <p className="font-body-sm text-slate-500 mb-4 line-clamp-2">
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
