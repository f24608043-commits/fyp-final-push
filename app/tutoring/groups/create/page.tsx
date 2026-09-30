import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import {
  tutorEnrollments,
  profiles,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";

export default async function CreateGroupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get enrolled learners for group creation
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

  async function createGroup(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const selectedLearners = formData.getAll("learners") as string[];

    if (!name) {
      throw new Error("Group name is required");
    }

    // Create group via API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, learnerIds: selectedLearners }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to create group");
    }

    redirect("/tutoring/groups");
  }

  return (
    <div className="w-full px-8 py-8 bg-gradient-to-br from-background via-blue-50 to-cyan-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/tutoring/groups"
          className="inline-flex items-center gap-2 font-label-lg text-label-lg text-text-muted hover:text-primary transition-colors group mb-4"
        >
          <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-1">arrow_back</span>
          <span>Back to Groups</span>
        </Link>
        <h1 className="font-headline-2xl text-headline-2xl text-text-primary tracking-tight">
          Create New Group
        </h1>
        <p className="font-body-lg text-body-lg text-text-muted">
          Select enrolled learners to create a new group for sessions
        </p>
      </div>

      {/* Create Group Form */}
      <div className="max-w-2xl">
        <form action={createGroup} className="space-y-8">
          <div className="rounded-2xl bg-white p-8 shadow-xl border-4 border-gray-100">
            <div className="mb-6">
              <label htmlFor="name" className="block font-label-md text-text-primary font-semibold mb-3">
                Group Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="e.g., Grade 10 Physics - Batch A"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors font-body-lg"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="description" className="block font-label-md text-text-primary font-semibold mb-3">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                placeholder="Describe the group's focus or schedule"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors font-body-lg resize-none"
              />
            </div>
          </div>

          {/* Select Learners */}
          <div className="rounded-2xl bg-white p-8 shadow-xl border-4 border-gray-100">
            <h2 className="font-headline-lg text-headline-lg text-text-primary font-extrabold mb-6">
              Select Learners ({enrolledLearners.length} available)
            </h2>
            {enrolledLearners.length === 0 ? (
              <p className="font-body-lg text-text-muted">
                No enrolled learners available. Accept enrollment requests first.
              </p>
            ) : (
              <div className="space-y-4">
                {enrolledLearners.map((enrollment) => (
                  <label
                    key={enrollment.id}
                    className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-primary cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      name="learners"
                      value={enrollment.learnerId}
                      className="w-5 h-5 rounded border-2 border-gray-300 text-primary focus:ring-primary"
                    />
                    <UserAvatar
                      avatarUrl={enrollment.learner.avatarUrl}
                      displayName={enrollment.learner.displayName}
                      size="md"
                    />
                    <span className="font-label-md text-text-primary font-semibold">
                      {enrollment.learner.displayName || "Unknown"}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Link
              href="/tutoring/groups"
              className="rounded-xl border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600 px-6 py-3 font-label-lg font-semibold shadow-lg hover:from-gray-100 hover:to-gray-200 transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-3 font-label-lg font-bold shadow-xl border-2 border-white/30 transform hover:scale-105 transition-all active:scale-95"
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
