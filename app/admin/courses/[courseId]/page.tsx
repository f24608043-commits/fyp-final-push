import { db } from "@/db";
import { courses, units, lessons } from "@/db/schema";
import { asc, count, eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { updateCourse, createUnit } from "./actions";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) notFound();

  const courseUnits = await db
    .select()
    .from(units)
    .where(eq(units.courseId, courseId))
    .orderBy(asc(units.orderIndex));

  // Lesson counts per unit
  const unitIds = courseUnits.map((u) => u.id);
  const lessonCounts =
    unitIds.length > 0
      ? await db
          .select({ unitId: lessons.unitId, count: count() })
          .from(lessons)
          .where(inArray(lessons.unitId, unitIds))
          .groupBy(lessons.unitId)
      : [];

  const lessonCountMap = new Map(lessonCounts.map((l) => [l.unitId, Number(l.count)]));

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-text-muted">
        <Link href="/admin" className="hover:text-tertiary">
          Courses
        </Link>
        <span>/</span>
        <span className="font-semibold text-text-muted">{course.title}</span>
      </nav>

      {/* Edit Course */}
      <section className="mb-8 rounded-[24px] border border-surface-border bg-surface p-6 shadow-clay-surface">
        <h2 className="mb-4 text-lg font-extrabold text-text-muted">Course Details</h2>
        <form action={updateCourse} className="space-y-4">
          <input type="hidden" name="courseId" value={course.id} />

          <div>
            <label className="block text-sm font-semibold text-text-muted mb-1" htmlFor="title">
              Title <span className="text-error">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              defaultValue={course.title}
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
              defaultValue={course.description ?? ""}
              className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-tertiary focus:outline-none focus:ring-1 focus:ring-tertiary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-muted mb-1" htmlFor="coverUrl">
              Cover Image URL
            </label>
            <input
              id="coverUrl"
              name="coverUrl"
              type="url"
              defaultValue={course.coverUrl ?? ""}
              className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-tertiary focus:outline-none focus:ring-1 focus:ring-tertiary"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="isPublished"
              name="isPublished"
              type="checkbox"
              defaultChecked={course.isPublished}
              className="h-4 w-4 rounded border-surface-border text-tertiary focus:ring-tertiary"
            />
            <label htmlFor="isPublished" className="text-sm font-medium text-text-muted">
              Published (visible to learners)
            </label>
          </div>

          <div className="flex justify-end border-t border-surface-border pt-4">
            <button
              type="submit"
              className="rounded-lg bg-tertiary px-5 py-2 text-sm font-bold text-text-primary shadow hover:bg-tertiary"
            >
              Save Changes
            </button>
          </div>
        </form>
      </section>

      {/* Units List */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-text-muted">
            Units ({courseUnits.length})
          </h2>
        </div>

        {courseUnits.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-surface-border p-8 text-center text-text-primary">
            No units yet. Add your first unit below.
          </div>
        ) : (
          <div className="mb-6 space-y-3">
            {courseUnits.map((unit, idx) => (
              <Link
                key={unit.id}
                href={`/admin/units/${unit.id}`}
                className="flex items-center justify-between rounded-xl border border-surface-border bg-surface p-4 shadow-clay-surface transition hover:border-tertiary hover:shadow-clay-surface"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-tertiary/10 text-xs font-bold text-tertiary">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-text-muted">{unit.title}</p>
                    <p className="text-xs text-text-muted">
                      {lessonCountMap.get(unit.id) || 0} lessons
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

        {/* Add Unit Form */}
        <div className="rounded-[24px] border border-surface-border bg-surface p-5 shadow-clay-surface">
          <h3 className="mb-3 text-sm font-extrabold text-text-muted">+ Add New Unit</h3>
          <form action={createUnit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <input type="hidden" name="courseId" value={course.id} />
            <div className="flex-1">
              <input
                name="title"
                type="text"
                required
                placeholder="Unit title (e.g. Python Fundamentals)"
                className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-tertiary focus:outline-none focus:ring-1 focus:ring-tertiary"
              />
            </div>
            <div className="flex-1">
              <input
                name="description"
                type="text"
                placeholder="Short description (optional)"
                className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-tertiary focus:outline-none focus:ring-1 focus:ring-tertiary"
              />
            </div>
            <button
              type="submit"
              className="whitespace-nowrap rounded-lg bg-tertiary px-4 py-2 text-sm font-bold text-text-primary shadow hover:bg-tertiary"
            >
              Create Unit →
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
