import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createGroup } from "../actions";

export default async function CreateClassPage() {
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

  return (
    <div className="w-full px-8 py-8 bg-gradient-to-br from-background via-tertiary/10 to-tertiary/10 min-h-screen">
      {/* Header */}
      <div className="relative w-full bg-tertiary rounded-3xl p-1 shadow-clay-surface overflow-hidden mb-8">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-surface/40 pointer-events-none"></div>
        <div className="relative bg-surface/95 backdrop-blur-sm rounded-[24px] p-8 md:p-10">
          <div className="relative z-10 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-4 py-1 rounded-full bg-tertiary text-text-primary font-label-sm text-label-sm tracking-wider uppercase font-bold shadow-clay-surface border-2 border-surface/30">📚 Create Class</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-text-primary tracking-tight leading-none">
              Create a New Class
            </h1>
            <p className="font-body-lg text-body-lg text-text-muted leading-relaxed">
              Set up a new class to start teaching students
            </p>
          </div>
        </div>
      </div>

      {/* Create Class Form */}
      <div className="rounded-[24px] bg-surface p-8 shadow-clay-surface border border-surface-border max-w-2xl">
        <form action={createGroup} className="space-y-6">
          {/* Class Name */}
          <div>
            <label htmlFor="name" className="block font-label-md font-semibold text-text-primary mb-2">
              Class Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full rounded-xl border-2 border-surface-border px-4 py-3 font-body-md text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="e.g., Advanced Mathematics 101"
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
              rows={4}
              className="w-full rounded-xl border-2 border-surface-border px-4 py-3 font-body-md text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              placeholder="Describe what students will learn in this class..."
            />
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block font-label-md font-semibold text-text-primary mb-2">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              className="w-full rounded-xl border-2 border-surface-border px-4 py-3 font-body-md text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="e.g., Mathematics, Science, English"
            />
          </div>

          {/* Grade Level */}
          <div>
            <label htmlFor="gradeLevel" className="block font-label-md font-semibold text-text-primary mb-2">
              Grade Level
            </label>
            <select
              id="gradeLevel"
              name="gradeLevel"
              className="w-full rounded-xl border-2 border-surface-border px-4 py-3 font-body-md text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="">Select grade level</option>
              <option value="elementary">Elementary School</option>
              <option value="middle">Middle School</option>
              <option value="high">High School</option>
              <option value="college">College/University</option>
              <option value="adult">Adult Education</option>
            </select>
          </div>

          {/* Privacy */}
          <div>
            <label htmlFor="privacy" className="block font-label-sm font-semibold mb-2 text-text-muted uppercase tracking-wider">Privacy</label>
            <select
              id="privacy"
              name="privacy"
              className="w-full rounded-xl border-2 border-surface-border px-4 py-3 font-body-md text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="public">Public - Anyone can discover and join</option>
              <option value="private">Private - Only with class code</option>
            </select>
          </div>

          {/* Cover Image URL */}
          <div>
            <label htmlFor="coverImageUrl" className="block font-label-md font-semibold text-text-primary mb-2">
              Cover Image URL
            </label>
            <input
              type="url"
              id="coverImageUrl"
              name="coverImageUrl"
              className="w-full rounded-xl border-2 border-surface-border px-4 py-3 font-body-md text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Group Code */}
          <div>
            <label htmlFor="groupCode" className="block font-label-md font-semibold text-text-primary mb-2">
              Class Code (optional - leave empty to auto-generate)
            </label>
            <input
              type="text"
              id="groupCode"
              name="groupCode"
              maxLength={10}
              className="w-full rounded-xl border-2 border-surface-border px-4 py-3 font-body-md text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="e.g., MATH101"
            />
            <p className="font-body-sm text-text-muted mt-1">
              Share this code with students to let them join your class
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-tertiary text-text-primary px-6 py-3 font-label-md font-bold shadow-clay-primary border-2 border-surface/30 transform hover:scale-105 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">check</span>
              Create Class
            </button>
            <Link
              href="/tutoring/classes"
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
