import { db } from "@/db";
import { courses, units, lessons } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Mascot from "@/components/Mascot";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const [allCourses, unitCounts, lessonCounts] = await Promise.all([
    db
      .select({
        id: courses.id,
        title: courses.title,
        isPublished: courses.isPublished,
      })
      .from(courses)
      .orderBy(courses.createdAt),
    db
      .select({ courseId: units.courseId, count: count() })
      .from(units)
      .groupBy(units.courseId),
    db
      .select({ courseId: units.courseId, count: count() })
      .from(lessons)
      .innerJoin(units, eq(lessons.unitId, units.id))
      .groupBy(units.courseId)
  ]);

  const unitMap = new Map(unitCounts.map((u) => [u.courseId, Number(u.count)]));
  const lessonMap = new Map(lessonCounts.map((l) => [l.courseId, Number(l.count)]));

  return (
    <div className="w-full px-6 py-6">
      {/* Header with Mascot */}
      <div className="relative w-full rounded-3xl bg-surface-container-lowest p-6 md:p-8 shadow-xl overflow-hidden mb-6">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-primary-fixed/25 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-tertiary-fixed/30 blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 rounded-lg bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm tracking-wider uppercase">Admin Panel</span>
              <span className="text-outline text-label-sm">•</span>
              <span className="px-3 py-0.5 rounded-lg bg-error-container/20 text-error font-label-sm text-label-sm">Management</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight leading-none">
              Course Management
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              Create and manage courses, units, lessons, and AI-generated quizzes
            </p>
          </div>

          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center lg:items-end justify-center gap-4 shrink-0 self-center lg:self-auto">
            <div className="relative w-28 h-28 md:w-32 md:h-32 shrink-0">
              <Mascot pose="idle" size={128} />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface font-extrabold">All Courses</h2>
          <p className="mt-1 font-body-sm text-on-surface-variant">
            Manage your course content
          </p>
        </div>
        <Link
          href="/admin/courses/new"
          className="rounded-full bg-primary-container text-on-primary px-5 py-2.5 font-label-md font-bold shadow-glow hover:bg-primary transition-all active:translate-y-[2px]"
        >
          + New Course
        </Link>
      </div>

      {allCourses.length === 0 ? (
        <div className="rounded-2xl bg-surface-container-lowest p-12 text-center shadow-md">
          <div className="relative w-20 h-20 rounded-xl bg-surface-container flex items-center justify-center overflow-hidden shadow-inner mx-auto mb-4">
            <Mascot pose="empty" size={64} />
          </div>
          <p className="font-body-md text-on-surface-variant">No courses yet. Create your first course above.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allCourses.map((course) => (
            <Link
              key={course.id}
              href={`/admin/courses/${course.id}`}
              className="group rounded-2xl bg-surface-container-lowest p-5 shadow-md transition hover:shadow-lg border border-outline-variant hover:border-primary"
            >
              <div className="flex items-start justify-between">
                <h2 className="font-label-lg text-on-surface font-semibold group-hover:text-primary">
                  {course.title}
                </h2>
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 font-label-sm font-bold ${
                    course.isPublished
                      ? "bg-primary-container/20 text-primary"
                      : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  {course.isPublished ? "Published" : "Draft"}
                </span>
              </div>
              <div className="mt-3 flex gap-4 font-label-sm text-on-surface-variant">
                <span>{unitMap.get(course.id) || 0} units</span>
                <span>{lessonMap.get(course.id) || 0} lessons</span>
              </div>
              <p className="mt-3 font-label-sm font-semibold text-primary group-hover:underline">
                Manage →
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
