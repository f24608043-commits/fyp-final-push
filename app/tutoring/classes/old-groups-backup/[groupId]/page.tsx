import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import {
  tutorGroups,
  tutorGroupMembers,
  profiles,
  tutorEnrollments,
  tutorGroupSessions,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";
import DeleteGroupButton from "./DeleteGroupButton";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { groupId } = await params;

  // Get group details
  const [group] = await db
    .select()
    .from(tutorGroups)
    .where(eq(tutorGroups.id, groupId))
    .limit(1);

  if (!group || group.tutorId !== user.id) {
    redirect("/tutoring/groups");
  }

  // Get group members
  const members = await db
    .select({
      id: tutorGroupMembers.id,
      learnerId: tutorGroupMembers.learnerId,
      enrolledAt: tutorGroupMembers.enrolledAt,
      learner: {
        id: profiles.id,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
      },
    })
    .from(tutorGroupMembers)
    .innerJoin(profiles, eq(tutorGroupMembers.learnerId, profiles.id))
    .where(eq(tutorGroupMembers.groupId, groupId));

  // Get group sessions
  const sessions = await db
    .select()
    .from(tutorGroupSessions)
    .where(eq(tutorGroupSessions.groupId, groupId))
    .orderBy(tutorGroupSessions.startTime);

  // Get enrolled learners (for adding to group)
  const enrolledLearners = await db
    .select({
      id: tutorEnrollments.id,
      learnerId: tutorEnrollments.learnerId,
      learner: {
        id: profiles.id,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
      },
    })
    .from(tutorEnrollments)
    .innerJoin(profiles, eq(tutorEnrollments.learnerId, profiles.id))
    .where(and(eq(tutorEnrollments.tutorId, user.id), eq(tutorEnrollments.status, "accepted")));

  const memberIds = members.map((m) => m.learnerId);
  const availableLearners = enrolledLearners.filter(
    (el) => !memberIds.includes(el.learnerId)
  );

  async function updateGroup(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const selectedLearners = formData.getAll("learners") as string[];

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/groups/${groupId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, learnerIds: selectedLearners }),
    });

    if (!response.ok) {
      throw new Error("Failed to update group");
    }

    redirect(`/tutoring/groups/${groupId}`);
  }

  async function deleteGroup() {
    "use server";
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/groups/${groupId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete group");
    }

    redirect("/tutoring/groups");
  }

  async function createSession(formData: FormData) {
    "use server";
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    const notes = formData.get("notes") as string;

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/groups/${groupId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startTime, endTime, notes }),
    });

    if (!response.ok) {
      throw new Error("Failed to create session");
    }

    redirect(`/tutoring/groups/${groupId}`);
  }

  return (
    <div className="w-full px-8 py-8 bg-gradient-to-br from-surface via-secondary/10 to-tertiary/10 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/tutoring/groups"
          className="inline-flex items-center gap-2 font-label-lg text-label-lg text-text-muted hover:text-secondary transition-colors group mb-4"
        >
          <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-1">arrow_back</span>
          <span>Back to Groups</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline-2xl text-headline-2xl text-text-muted tracking-tight">
              {group.name}
            </h1>
            {group.description && (
              <p className="font-body-lg text-body-lg text-text-muted">{group.description}</p>
            )}
          </div>
          <DeleteGroupButton
            groupId={groupId}
            onDelete={() => {
              window.location.href = "/tutoring/groups";
            }}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Group Members */}
        <div className="rounded-[24px] bg-surface p-8 shadow-clay-surface border border-surface-border">
          <h2 className="font-headline-lg text-headline-lg text-text-muted font-extrabold mb-6">
            Members ({members.length})
          </h2>
          {members.length === 0 ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-text-primary text-[48px]">people</span>
              <p className="font-body-lg text-text-muted mt-2">No members in this group yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-surface border-2 border-surface-border shadow-clay-secondary"
                >
                  <UserAvatar
                    avatarUrl={member.learner.avatarUrl}
                    displayName={member.learner.displayName}
                    size="md"
                  />
                  <div className="flex-1">
                    <p className="font-label-md text-text-muted font-semibold">
                      {member.learner.displayName || "Unknown"}
                    </p>
                    <p className="font-body-md text-text-muted">
                      Added {new Date(member.enrolledAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Members Form */}
          {availableLearners.length > 0 && (
            <div className="mt-6 pt-6 border-t-2 border-surface-border">
              <h3 className="font-label-md text-text-muted font-semibold mb-4">
                Add Members
              </h3>
              <form action={updateGroup} className="space-y-4">
                <input type="hidden" name="name" value={group.name} />
                <input type="hidden" name="description" value={group.description || ""} />
                <div className="space-y-3">
                  {availableLearners.map((enrollment) => (
                    <label
                      key={enrollment.id}
                      className="flex items-center gap-3 p-3 rounded-lg border-2 border-surface-border hover:border-secondary cursor-pointer transition-colors shadow-clay-secondary"
                    >
                      <input
                        type="checkbox"
                        name="learners"
                        value={enrollment.learnerId}
                        className="w-4 h-4 rounded border-2 border-surface-border text-secondary focus:ring-secondary"
                      />
                      <UserAvatar
                        avatarUrl={enrollment.learner.avatarUrl}
                        displayName={enrollment.learner.displayName}
                        size="sm"
                      />
                      <span className="font-label-sm text-text-muted">
                        {enrollment.learner.displayName || "Unknown"}
                      </span>
                    </label>
                  ))}
                </div>
                <button
                  type="submit"
                  className="w-full rounded-full bg-secondary text-text-primary px-4 py-3 font-label-md font-semibold shadow-clay-primary border-2 border-surface/30 transform hover:scale-105 transition-all active:scale-95"
                >
                  Add Selected
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Group Sessions */}
        <div className="rounded-[24px] bg-surface p-8 shadow-clay-surface border border-surface-border">
          <h2 className="font-headline-lg text-headline-lg text-text-muted font-extrabold mb-6">
            Sessions ({sessions.length})
          </h2>
          
          {/* Create Session Form */}
          <form action={createSession} className="mb-6 p-6 rounded-xl bg-tertiary/10 border-2 border-tertiary/30 shadow-clay-secondary">
            <h3 className="font-label-md text-text-muted font-semibold mb-4">Schedule New Session</h3>
            <div className="space-y-4">
              <div>
                <label className="block font-label-sm text-text-muted mb-2">Start Time *</label>
                <input
                  type="datetime-local"
                  name="startTime"
                  required
                  className="w-full px-4 py-3 rounded-lg border-2 border-surface-border focus:border-secondary focus:outline-none transition-colors font-body-md shadow-clay-surface-pressed bg-surface"
                />
              </div>
              <div>
                <label className="block font-label-sm text-text-muted mb-2">End Time (Optional)</label>
                <input
                  type="datetime-local"
                  name="endTime"
                  className="w-full px-4 py-3 rounded-lg border-2 border-surface-border focus:border-secondary focus:outline-none transition-colors font-body-md shadow-clay-surface-pressed bg-surface"
                />
              </div>
              <div>
                <label className="block font-label-sm text-text-muted mb-2">Notes (Optional)</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Session notes or agenda"
                  className="w-full px-4 py-3 rounded-lg border-2 border-surface-border focus:border-secondary focus:outline-none transition-colors font-body-md resize-none shadow-clay-surface-pressed bg-surface"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-tertiary text-text-primary px-4 py-3 font-label-md font-semibold shadow-clay-primary border-2 border-surface/30 transform hover:scale-105 transition-all active:scale-95"
              >
                Create Session
              </button>
            </div>
          </form>

          {/* Sessions List */}
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-text-primary text-[48px]">event</span>
              <p className="font-body-lg text-text-muted mt-2">No sessions scheduled yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="p-5 rounded-xl bg-surface border-2 border-surface-border shadow-clay-secondary"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-label-md text-text-muted font-semibold">
                        {new Date(session.startTime).toLocaleString()}
                      </p>
                      {session.endTime && (
                        <p className="font-body-md text-text-muted">
                          to {new Date(session.endTime).toLocaleString()}
                        </p>
                      )}
                      <span className={`inline-block mt-2 rounded-full px-3 py-1 font-label-sm font-semibold border-2 ${
                        session.status === "scheduled" ? "bg-tertiary text-text-primary border-surface/30" :
                        session.status === "ongoing" ? "bg-gradient-to-r from-success to-primary text-text-primary border-surface/30" :
                        session.status === "completed" ? "bg-surface-border text-text-primary border-surface/30" :
                        "bg-error text-text-primary border-surface/30"
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    {session.status === "scheduled" && session.meetingUrl && (
                      <a
                        href={session.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 inline-flex items-center gap-2 rounded-full bg-tertiary text-text-primary px-4 py-2 font-label-md font-bold shadow-clay-primary border-2 border-surface/30 transform hover:scale-105 transition-all active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[18px]">videocam</span>
                        Start
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
