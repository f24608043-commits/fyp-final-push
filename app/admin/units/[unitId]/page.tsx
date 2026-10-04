import { db } from "@/db";
import { units, lessons, courses, badges } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { updateUnit, createLesson } from "./actions";

export default async function UnitDetailPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;

  const [unit] = await db
    .select()
    .from(units)
    .where(eq(units.id, unitId))
    .limit(1);

  if (!unit) notFound();

  const [course] = await db
    .select({ id: courses.id, title: courses.title })
    .from(courses)
    .where(eq(courses.id, unit.courseId))
    .limit(1);

  const unitLessons = await db
    .select()
    .from(lessons)
    .where(eq(lessons.unitId, unitId))
    .orderBy(asc(lessons.orderIndex));

  // All badges for badge picker
  const allBadges = await db
    .select({ id: badges.id, name: badges.name })
    .from(badges)
    .orderBy(asc(badges.name));

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-text-muted">
        <Link href="/admin" className="hover:text-tertiary">Courses</Link>
        <span>/</span>
        <Link href={`/admin/courses/${unit.courseId}`} className="hover:text-tertiary">
          {course?.title ?? "Course"}
        </Link>
        <span>/</span>
        <span className="font-semibold text-text-muted">{unit.title}</span>
      </nav>

      {/* Edit Unit */}
      <section className="mb-8 rounded-[24px] border border-surface-border bg-surface p-6 shadow-clay-surface">
        <h2 className="mb-4 text-lg font-extrabold text-text-muted">Unit Details</h2>
        <form action={updateUnit} className="space-y-4">
          <input type="hidden" name="unitId" value={unit.id} />

          <div>
            <label className="block text-sm font-semibold text-text-muted mb-1" htmlFor="title">
              Unit Title <span className="text-error">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              defaultValue={unit.title}
              className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-tertiary focus:outline-none focus:ring-1 focus:ring-tertiary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-muted mb-1" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={unit.description ?? ""}
              className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-tertiary focus:outline-none focus:ring-1 focus:ring-tertiary"
            />
          </div>

          {/* Badge Attachment (FR9.1d) */}
          <div>
            <label className="block text-sm font-semibold text-text-muted mb-1" htmlFor="badgeId">
              Unit Completion Badge (optional)
            </label>
            <p className="mb-2 text-xs text-text-muted">
              Auto-awarded when a learner completes every lesson in this unit.
            </p>
            <select
              id="badgeId"
              name="badgeId"
              defaultValue={unit.badgeId ?? ""}
              className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-tertiary focus:outline-none focus:ring-1 focus:ring-tertiary"
            >
              <option value="">— No badge —</option>
              {allBadges.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end border-t border-surface-border pt-4">
            <button
              type="submit"
              className="rounded-lg bg-tertiary px-5 py-2 text-sm font-bold text-text-primary shadow hover:bg-tertiary"
            >
              Save Unit
            </button>
          </div>
        </form>
      </section>

      {/* Lessons List */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-text-muted">
            Lessons ({unitLessons.length})
          </h2>
        </div>

        {unitLessons.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-surface-border p-8 text-center text-text-primary mb-6">
            No lessons yet. Add your first lesson below.
          </div>
        ) : (
          <div className="mb-6 space-y-3">
            {unitLessons.map((lesson, idx) => (
              <Link
                key={lesson.id}
                href={`/admin/lessons/${lesson.id}`}
                className="flex items-center justify-between rounded-xl border border-surface-border bg-surface p-4 shadow-clay-surface transition hover:border-tertiary hover:shadow-clay-surface"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-tertiary/10 text-xs font-bold text-tertiary">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-text-muted">{lesson.title}</p>
                    <p className="text-xs text-text-muted">
                      {lesson.xpReward} XP ·{" "}
                      <span
                        className={lesson.isPublished ? "text-success" : "text-text-primary"}
                      >
                        {lesson.isPublished ? "Published" : "Draft"}
                      </span>
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-tertiary hover:underline">
                  Edit →
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Add Lesson Form */}
        <div className="rounded-[24px] border border-surface-border bg-surface p-5 shadow-clay-surface">
          <h3 className="mb-3 text-sm font-extrabold text-text-muted">+ Add New Lesson</h3>
          <form action={createLesson} className="space-y-3">
            <input type="hidden" name="unitId" value={unit.id} />

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">
                  Lesson Title <span className="text-error">*</span>
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  placeholder="e.g. Variables & Data Types"
                  className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-tertiary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">
                  YouTube URL <span className="text-error">*</span>
                </label>
                <input
                  name="youtubeUrl"
                  type="text"
                  required
                  placeholder="youtube.com/watch?v=... or youtu.be/..."
                  className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-tertiary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">
                  Description
                </label>
                <input
                  name="description"
                  type="text"
                  placeholder="Brief description (optional)"
                  className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-tertiary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">
                  XP Reward
                </label>
                <input
                  name="xpReward"
                  type="number"
                  min="1"
                  defaultValue="10"
                  className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-tertiary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-lg bg-tertiary px-4 py-2 text-sm font-bold text-text-primary shadow hover:bg-tertiary"
              >
                Create Lesson →
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
