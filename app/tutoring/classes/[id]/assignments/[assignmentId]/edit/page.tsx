import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { groups, profiles, assignments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { editAssignment } from "@/app/tutoring/classes/actions";

interface PageProps {
  params: Promise<{ id: string; assignmentId: string }>;
}

export default async function EditAssignmentPage({ params }: PageProps) {
  const { id, assignmentId } = await params;
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

  // Fetch assignment details
  const [assignment] = await db
    .select()
    .from(assignments)
    .where(eq(assignments.id, assignmentId))
    .limit(1);

  if (!assignment) {
    notFound();
  }

  // Verify assignment belongs to the group
  if (assignment.groupId !== id) {
    redirect(`/tutoring/classes/${id}`);
  }

  // Verify user is the tutor of this assignment
  if (assignment.tutorId !== user.id) {
    redirect(`/tutoring/classes/${id}`);
  }

  // Fetch group details
  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.id, id))
    .limit(1);

  return (
    <div className="w-full px-8 py-8 bg-gradient-to-br from-background via-blue-50 to-cyan-50 min-h-screen">
      {/* Header */}
      <div className="relative w-full bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 rounded-3xl p-1 shadow-2xl overflow-hidden mb-8">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-white/40 pointer-events-none"></div>
        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-8 md:p-10">
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Link
                href={`/tutoring/classes/${id}/assignments`}
                className="inline-flex items-center gap-1 text-text-muted hover:text-primary font-label-sm font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to Assignments
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-4 py-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-label-sm text-label-sm tracking-wider uppercase font-bold shadow-lg border-2 border-white/30">✏️ Edit Assignment</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-text-primary tracking-tight leading-none">
                Edit Assignment
              </h1>
              <p className="font-body-lg text-body-lg text-text-muted leading-relaxed">
                Update assignment details for {group?.name || "this class"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Assignment Form */}
      <div className="rounded-2xl bg-surface p-8 shadow-clay-surface border border-surface-border max-w-3xl">
        <form action={editAssignment} className="space-y-6">
          <input type="hidden" name="assignmentId" value={assignment.id} />
          <input type="hidden" name="groupId" value={id} />

          {/* Assignment Title */}
          <div>
            <label htmlFor="title" className="block font-label-md font-semibold text-text-primary mb-2">
              Assignment Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              defaultValue={assignment.title}
              className="w-full rounded-xl border-2 border-surface-border px-4 py-3 font-body-md text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="e.g., Chapter 5 Problems"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block font-label-md font-semibold text-text-primary mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={6}
              defaultValue={assignment.description || ""}
              className="w-full rounded-xl border-2 border-surface-border px-4 py-3 font-body-md text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              placeholder="Describe the assignment requirements and instructions..."
            />
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="dueDate" className="block font-label-md font-semibold text-text-primary mb-2">
              Due Date
            </label>
            <input
              type="datetime-local"
              id="dueDate"
              name="dueDate"
              defaultValue={assignment.dueDate ? new Date(assignment.dueDate).toISOString().slice(0, 16) : ""}
              className="w-full rounded-xl border-2 border-surface-border px-4 py-3 font-body-md text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Points */}
          <div>
            <label htmlFor="points" className="block font-label-md font-semibold text-text-primary mb-2">
              Points *
            </label>
            <input
              type="number"
              id="points"
              name="points"
              required
              min="1"
              defaultValue={assignment.points}
              className="w-full rounded-xl border-2 border-surface-border px-4 py-3 font-body-md text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="100"
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block font-label-md font-semibold text-text-primary mb-2">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={assignment.status}
              className="w-full rounded-xl border-2 border-surface-border px-4 py-3 font-body-md text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="draft">Draft - Save without publishing</option>
              <option value="published">Published - Visible to students</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-4 border-t border-surface-border">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 font-label-md font-bold shadow-clay-primary border-2 border-white/30 transform hover:scale-105 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">save</span>
              Save Changes
            </button>
            <Link
              href={`/tutoring/classes/${id}/assignments/${assignmentId}`}
              className="inline-flex items-center gap-2 rounded-full bg-surface border-2 border-surface-border text-text-primary px-6 py-3 font-label-md font-semibold shadow-clay-surface hover:shadow-clay-primary transition-all"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
