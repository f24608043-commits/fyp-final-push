import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { groups, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createAssignment } from "@/app/tutoring/classes/actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CreateAssignmentPage({ params }: PageProps) {
  const { id } = await params;
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

  // Fetch group details
  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.id, id))
    .limit(1);

  if (!group) {
    notFound();
  }

  // Verify user is the tutor of this group
  if (group.tutorId !== user.id) {
    redirect("/tutoring/classes");
  }

  return (
    <div className="w-full px-8 py-8 bg-gradient-to-br from-slate-50 via-amber-50 to-indigo-50 min-h-screen">
      {/* Header */}
      <div className="relative w-full bg-gradient-to-br from-amber-500 via-orange-500 to-indigo-500 rounded-3xl p-1 shadow-2xl overflow-hidden mb-8">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-white/40 pointer-events-none"></div>
        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-8 md:p-10">
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Link
                href={`/tutoring/classes/${id}`}
                className="inline-flex items-center gap-1 text-slate-600 hover:text-amber-600 font-label-sm font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to {group.name}
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-label-sm text-label-sm tracking-wider uppercase font-bold shadow-lg border-2 border-white/30">📝 Create Assignment</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-slate-900 tracking-tight leading-none">
                Create New Assignment
              </h1>
              <p className="font-body-lg text-body-lg text-slate-600 leading-relaxed">
                Create an assignment for {group.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Assignment Form */}
      <div className="rounded-2xl bg-white p-8 shadow-clay-surface border border-slate-200 max-w-3xl">
        <form action={createAssignment} className="space-y-6">
          <input type="hidden" name="groupId" value={id} />

          {/* Assignment Title */}
          <div>
            <label htmlFor="title" className="block font-label-md font-semibold text-slate-900 mb-2">
              Assignment Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 font-body-md text-slate-900 focus:border-amber-400 focus:outline-none shadow-clay-inset bg-white transition-all"
              placeholder="e.g., Chapter 5 Problems"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block font-label-md font-semibold text-slate-900 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={6}
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 font-body-md text-slate-900 focus:border-amber-400 focus:outline-none shadow-clay-inset bg-white transition-all resize-none"
              placeholder="Describe the assignment requirements and instructions..."
            />
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="dueDate" className="block font-label-md font-semibold text-slate-900 mb-2">
              Due Date
            </label>
            <input
              type="datetime-local"
              id="dueDate"
              name="dueDate"
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 font-body-md text-slate-900 focus:border-amber-400 focus:outline-none shadow-clay-inset bg-white transition-all"
            />
          </div>

          {/* Points */}
          <div>
            <label htmlFor="points" className="block font-label-md font-semibold text-slate-900 mb-2">
              Points *
            </label>
            <input
              type="number"
              id="points"
              name="points"
              required
              min="1"
              defaultValue="100"
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 font-body-md text-slate-900 focus:border-amber-400 focus:outline-none shadow-clay-inset bg-white transition-all"
              placeholder="100"
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block font-label-md font-semibold text-slate-900 mb-2">
              Status
            </label>
            <select
              id="status"
              name="status"
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 font-body-md text-slate-900 focus:border-amber-400 focus:outline-none shadow-clay-inset bg-white transition-all"
            >
              <option value="draft">Draft - Save without publishing</option>
              <option value="published">Published - Visible to students</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 font-label-md font-bold shadow-clay-primary border-2 border-white/30 transform hover:scale-105 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">check</span>
              Create Assignment
            </button>
            <Link
              href={`/tutoring/classes/${id}`}
              className="inline-flex items-center gap-2 rounded-full bg-white border-2 border-slate-200 text-slate-900 px-6 py-3 font-label-md font-semibold shadow-clay-surface hover:shadow-clay-primary transition-all"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
