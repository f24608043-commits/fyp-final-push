import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import {
  tutorEnrollments,
  tutorGroupMembers,
  tutorGroups,
  profiles,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function TutoringLearnersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Check if user is a tutor
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (profile?.role !== "tutor") {
    // Learners should see their learner dashboard
    redirect("/tutoring/learner-dashboard");
  }

  // Get tutor's enrolled learners from tutor_enrollments
  const classLearners = await db
    .select({
      enrollmentId: tutorEnrollments.id,
      status: tutorEnrollments.status,
      createdAt: tutorEnrollments.createdAt,
      learner: {
        id: profiles.id,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
      },
    })
    .from(tutorEnrollments)
    .innerJoin(profiles, eq(tutorEnrollments.learnerId, profiles.id))
    .where(eq(tutorEnrollments.tutorId, user.id))
    .orderBy(desc(tutorEnrollments.createdAt))
    .limit(100);

  // Get tutor's group members
  let groupMembers: any[] = [];
  try {
    const tutorGroupsSub = await db
      .select({ id: tutorGroups.id })
      .from(tutorGroups)
      .where(eq(tutorGroups.tutorId, user.id));
    const groupIds = tutorGroupsSub.map(g => g.id);
    if (groupIds.length > 0) {
      groupMembers = await db
        .select({
          groupId: tutorGroupMembers.groupId,
          groupName: tutorGroups.name,
          enrolledAt: tutorGroupMembers.enrolledAt,
          learner: {
            id: profiles.id,
            displayName: profiles.displayName,
            avatarUrl: profiles.avatarUrl,
          },
        })
        .from(tutorGroupMembers)
        .innerJoin(tutorGroups, eq(tutorGroupMembers.groupId, tutorGroups.id))
        .innerJoin(profiles, eq(tutorGroupMembers.learnerId, profiles.id))
        .where(eq(tutorGroups.tutorId, user.id))
        .orderBy(desc(tutorGroupMembers.enrolledAt))
        .limit(100);
    }
  } catch (error) {
    console.error("Error fetching group members:", error);
    groupMembers = [];
  }

  // Deduplicate learners
  const allLearners = new Map();
  for (const e of classLearners) {
    if (!allLearners.has(e.learner.id)) {
      allLearners.set(e.learner.id, {
        ...e.learner,
        enrollments: [],
        groups: [],
      });
    }
    allLearners.get(e.learner.id).enrollments.push({
      type: "tutoring",
      id: e.enrollmentId,
      status: e.status,
    });
  }
  for (const m of groupMembers) {
    if (!allLearners.has(m.learner.id)) {
      allLearners.set(m.learner.id, {
        ...m.learner,
        enrollments: [],
        groups: [],
      });
    }
    allLearners.get(m.learner.id).groups.push({
      id: m.groupId,
      name: m.groupName,
    });
  }

  const learners = Array.from(allLearners.values());

  return (
    <div className="w-full px-8 py-8 bg-gradient-to-br from-background via-secondary/10 to-secondary/10 min-h-screen">
      <div className="mb-8">
        <h1 className="font-headline-2xl text-headline-2xl text-text-primary tracking-tight mb-3">
          My Learners
        </h1>
        <p className="font-body-lg text-body-lg text-text-muted">
          View and manage learners enrolled in your tutoring sessions and groups
        </p>
      </div>

      <div className="rounded-[24px] bg-surface p-6 shadow-clay-surface border-4 border-secondary/30">
        {learners.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-secondary text-[48px] mb-4 block">
              people
            </span>
            <h3 className="font-headline-md text-headline-md text-text-primary mb-2">
              No Learners Yet
            </h3>
            <p className="font-body-md text-text-muted">
              Learners will appear here when they enroll in your tutoring sessions or join your groups.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 font-body-md text-text-primary">
              Total Learners: <span className="font-bold text-secondary">{learners.length}</span>
            </div>
            <div className="space-y-4">
              {learners.map((learner) => (
                <div key={learner.id} className="flex items-center justify-between p-4 rounded-[16px] bg-surface-border">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      {learner.avatarUrl ? (
                        <img src={learner.avatarUrl} alt={learner.displayName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-primary text-[24px]">person</span>
                      )}
                    </div>
                    <div>
                      <p className="font-label-lg text-text-primary">{learner.displayName || "Anonymous"}</p>
                      <div className="flex items-center gap-2 text-sm text-text-muted mt-1">
                        {learner.enrollments.length > 0 && (
                          <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                            {learner.enrollments.length} enrollment{learner.enrollments.length > 1 ? "s" : ""}
                          </span>
                        )}
                        {learner.groups.length > 0 && (
                          <span className="px-2 py-1 rounded-full bg-secondary/10 text-secondary text-xs">
                            {learner.groups.length} group{learner.groups.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={`/messages/${learner.id}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-text-primary font-label-md font-bold shadow-clay-primary hover:bg-primary/90 transition-all">
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                      Message
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
