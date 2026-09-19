import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { courses, enrollments, lessons, profiles, units, userProgress } from "@/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import Mascot from "@/components/Mascot";

export default async function PathPage() {
  const startTime = Date.now();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // 1. Verify user profile and onboarding status AND fetch enrollments in parallel
  const [profileResult, userEnrollments] = await Promise.all([
    db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1),
    db.select().from(enrollments).where(eq(enrollments.userId, user.id))
  ]);

  const profile = profileResult[0];

  console.log("[PATH] Profile:", profile ? { id: profile.id, onboardingDone: profile.onboardingDone, role: profile.role } : "NOT FOUND");
  console.log("[PATH] Enrollments count:", userEnrollments.length);

  if (!profile) {
    console.error("[PATH] Profile not found for user:", user.id);
    redirect("/onboarding");
  }

  if (!profile.onboardingDone) {
    console.log("[PATH] Onboarding not done, redirecting to onboarding");
    redirect("/onboarding");
  }

  const activeEnrollment = userEnrollments.find((e) => e.isActive) || userEnrollments[0];

  if (!activeEnrollment) {
    console.log("[PATH] No enrollment found, redirecting to onboarding");
    redirect("/onboarding");
  }

  // 3. Fetch course and units in parallel for speed
  const [course, courseUnits] = await Promise.all([
    db.select().from(courses).where(eq(courses.id, activeEnrollment.courseId)).limit(1),
    db.select().from(units).where(eq(units.courseId, activeEnrollment.courseId)).orderBy(asc(units.orderIndex))
  ]);

  if (!course) {
    redirect("/onboarding");
  }

  const unitIds = courseUnits.map((u) => u.id);

  // 4. Fetch lessons and progress in parallel (they're independent)
  const [courseLessons, progressRows] = await Promise.all([
    unitIds.length > 0
      ? db
          .select()
          .from(lessons)
          .where(inArray(lessons.unitId, unitIds))
          .orderBy(asc(lessons.orderIndex))
      : Promise.resolve([]),
    unitIds.length > 0
      ? db
          .select()
          .from(userProgress)
          .where(
            and(
              eq(userProgress.userId, user.id),
              inArray(userProgress.lessonId, unitIds)
            )
          )
      : Promise.resolve([])
  ]);

  const lessonIds = courseLessons.map((l) => l.id);
  const filteredProgressRows = progressRows.filter(p => lessonIds.includes(p.lessonId));

  const progressMap = new Map(filteredProgressRows.map((p) => [p.lessonId, p.status]));

  const endTime = Date.now();
  console.log(`[PERF] Path page server render time: ${endTime - startTime}ms`);

  // 7. Compute deterministic state machine chain based on real DB progress
  const orderedLessonsWithUnit: Array<{
    lesson: typeof lessons.$inferSelect;
    unit: typeof units.$inferSelect;
    state: "completed" | "current" | "locked";
  }> = [];

  for (const unit of courseUnits) {
    const unitLessons = courseLessons.filter((l) => l.unitId === unit.id);
    for (const lesson of unitLessons) {
      orderedLessonsWithUnit.push({
        lesson,
        unit,
        state: "locked",
      });
    }
  }

  let foundCurrent = false;
  for (const item of orderedLessonsWithUnit) {
    const statusInDb = progressMap.get(item.lesson.id);
    if (statusInDb === "completed") {
      item.state = "completed";
    } else if (!foundCurrent) {
      item.state = "current";
      foundCurrent = true;
    } else {
      item.state = "locked";
    }
  }

  const currentLesson = orderedLessonsWithUnit.find(i => i.state === "current");
  const completedCount = orderedLessonsWithUnit.filter(i => i.state === "completed").length;
  const totalCount = orderedLessonsWithUnit.length;

  return (
    <div className="w-full px-6 py-6">
      {/* Welcome Banner with Mascot */}
      <section className="w-full mb-6">
        <div className="relative bg-surface rounded-3xl p-6 shadow-clay-surface flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden border border-surface-border">
          <div className="flex items-center gap-6 z-10">
            <div className="relative w-20 h-20 rounded-2xl bg-surface-border flex-shrink-0 flex items-center justify-center overflow-hidden shadow-clay-surface">
              <Mascot pose="encouraging" size={64} />
              <span className="absolute top-1 right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-full font-extrabold">Course in Progress</span>
                <span className="font-label-sm text-label-sm text-text-muted font-bold">• Unit 1</span>
              </div>
              <h1 className="font-headline-md text-headline-md text-text-primary leading-snug">
                Good morning, {profile.displayName || "Learner"}! Ready for today's lesson?
              </h1>
              <p className="font-body-sm text-body-sm text-text-muted">
                Keep your momentum going! Complete {currentLesson ? `Node ${orderedLessonsWithUnit.indexOf(currentLesson) + 1}` : "the next lesson"} to reach your daily goal.
              </p>
            </div>
          </div>
          {/* Quick Stats */}
          <div className="flex items-center gap-4 z-10 flex-shrink-0">
            <div className="flex flex-col items-center bg-secondary text-white px-4 py-2 rounded-2xl text-center min-w-[76px] shadow-clay-secondary">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: 'FILL 1' }}>local_fire_department</span>
              <span className="font-label-lg text-label-lg leading-tight">{profile.streakCount || 0}</span>
              <span className="font-label-sm text-label-sm uppercase opacity-90">Streak</span>
            </div>
            <div className="flex flex-col items-center bg-primary text-white px-4 py-2 rounded-2xl text-center min-w-[76px] shadow-clay-primary">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: 'FILL 1' }}>bolt</span>
              <span className="font-label-lg text-label-lg leading-tight">{profile.xp?.toLocaleString() || 0}</span>
              <span className="font-label-sm text-label-sm uppercase opacity-90">XP</span>
            </div>
          </div>
          {/* Ambient Glow */}
          <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-primary/10 blur-2xl pointer-events-none"></div>
          <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-secondary/10 blur-2xl pointer-events-none"></div>
        </div>
      </section>

      {/* Current Lesson Hero Card */}
      {currentLesson && (
        <div className="relative bg-surface rounded-3xl p-6 shadow-clay-primary flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden mb-6 border border-surface-border">
          <div className="flex flex-col gap-1 max-w-xl z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-primary text-white font-label-sm text-label-sm px-2.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold flex items-center gap-1 shadow-clay-primary">
                <span className="material-symbols-outlined text-[14px]">play_circle</span>
                Next Challenge
              </span>
              <span className="font-label-sm text-label-sm text-text-muted uppercase font-bold">
                {currentLesson.unit.title} • Lesson {orderedLessonsWithUnit.indexOf(currentLesson) + 1}
              </span>
            </div>
            <h2 className="font-headline-md text-headline-md text-text-primary">
              {currentLesson.lesson.title}
            </h2>
            <p className="font-body-md text-body-md text-text-muted">
              {currentLesson.lesson.description}
            </p>
            {/* Progress Bar */}
            <div className="w-full mt-2 flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-text-primary">
                <span className="font-label-sm text-label-sm text-text-muted font-bold">Progress</span>
                <span className="font-label-md text-label-md font-extrabold text-primary">{completedCount} / {totalCount} activities</span>
              </div>
              <div className="w-full h-3 bg-surface-border rounded-full overflow-hidden flex">
                <div className="h-full bg-primary rounded-full shadow-clay-primary" style={{ width: `${(completedCount / totalCount) * 100}%` }}></div>
              </div>
            </div>
          </div>
          {/* CTA Button */}
          <div className="z-10 flex flex-col items-center w-full md:w-auto">
            <Link
              href={`/lesson/${currentLesson.lesson.id}`}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-label-lg text-label-lg uppercase tracking-wider shadow-clay-primary active:shadow-clay-primary-pressed active:translate-y-[2px] transition-all hover:bg-primary-dark"
            >
              <span>Continue Learning</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </Link>
            <div className="flex items-center gap-1 mt-2 text-secondary font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: 'FILL 1' }}>stars</span>
              <span>+{currentLesson.lesson.xpReward} XP Reward on Finish</span>
            </div>
          </div>
          <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-primary/10 blur-xl pointer-events-none"></div>
        </div>
      )}

      {/* Gamified Path Section */}
      <div className="bg-surface rounded-3xl p-6 shadow-clay-surface flex flex-col items-center relative overflow-hidden border border-surface-border">
        {/* Unit Header */}
        <div className="w-full flex items-center justify-between pb-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-headline-md shadow-clay-surface">
              <span className="material-symbols-outlined text-[28px]">data_object</span>
            </div>
            <div>
              <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">Unit 1</span>
              <h3 className="font-headline-md text-headline-md text-text-primary">{courseUnits[0]?.title || "Course"}</h3>
            </div>
          </div>
          <span className="font-label-sm text-label-sm bg-surface-border px-3 py-1 rounded-full text-text-muted font-bold">
            {completedCount} of {totalCount} Completed
          </span>
        </div>

        {/* Serpentine Path Nodes */}
        <div className="relative w-full max-w-md py-4 flex flex-col items-center">
          {/* SVG Path Lines */}
          <svg className="absolute top-8 left-1/2 -translate-x-1/2 w-48 h-[580px] pointer-events-none z-0" fill="none" viewBox="0 0 160 580">
            {/* Completed path */}
            <path d="M 80 40 Q 30 110 40 180" fill="none" stroke="#22C55E" strokeLinecap="round" strokeWidth="8"></path>
            <path d="M 40 180 Q 50 250 120 300" fill="none" stroke="#22C55E" strokeLinecap="round" strokeWidth="8"></path>
            {/* Incomplete path */}
            <path d="M 120 300 Q 150 370 70 420" fill="none" stroke="#D1D5DB" strokeDasharray="8 8" strokeLinecap="round" strokeWidth="8"></path>
            <path d="M 70 420 Q 20 480 80 540" fill="none" stroke="#D1D5DB" strokeDasharray="8 8" strokeLinecap="round" strokeWidth="8"></path>
          </svg>

          {/* Nodes */}
          {orderedLessonsWithUnit.slice(0, 4).map((item, idx) => {
            const { lesson, state } = item;
            const isCompleted = state === "completed";
            const isCurrent = state === "current";
            const isLocked = state === "locked";

            const positions = [
              { x: -10, y: 0 }, // Node 1
              { x: 12, y: 0 },  // Node 2
              { x: -6, y: 0 },  // Node 3
              { x: 0, y: 0 },   // Node 4
            ];
            const pos = positions[idx] || { x: 0, y: 0 };

            return (
              <div
                key={lesson.id}
                className={`relative flex flex-col items-center z-10 mb-16 ${idx % 2 === 0 ? '-translate-x-10' : 'translate-x-12'} group`}
              >
                {/* Mascot for current node */}
                {isCurrent && (
                  <div className="absolute -top-12 -left-36 hidden sm:flex items-center gap-2 animate-bounce">
                    <div className="bg-surface px-3 py-2 rounded-2xl shadow-clay-surface border border-surface-border bg-primary/10">
                      <p className="font-label-sm text-text-primary">Let's go! 🚀</p>
                    </div>
                    <Mascot pose="encouraging" size={32} />
                  </div>
                )}

                {/* Node Circle */}
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center hover:scale-105 active:translate-y-[2px] transition-transform ${
                    isCompleted
                      ? "bg-success text-white shadow-clay-success"
                      : isCurrent
                      ? "bg-primary text-white shadow-clay-primary animate-pulse"
                      : "bg-locked text-text-muted"
                  }`}
                >
                  <span className="material-symbols-outlined text-[30px]" style={isCompleted ? { fontVariationSettings: 'FILL 1' } : {}}>
                    {isCompleted ? "check_circle" : isCurrent ? "play_circle" : "lock"}
                  </span>
                </div>

                {/* Star ratings for completed */}
                {isCompleted && (
                  <div className="flex items-center gap-0.5 mt-2 bg-secondary text-white px-2 py-0.5 rounded-full shadow-clay-secondary">
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: 'FILL 1' }}>star</span>
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: 'FILL 1' }}>star</span>
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: 'FILL 1' }}>star</span>
                  </div>
                )}

                {/* Lesson Label */}
                <span className="font-label-md text-label-md text-text-primary mt-1">{lesson.title}</span>

                {/* Link overlay */}
                {!isLocked && (
                  <Link
                    href={`/lesson/${lesson.id}`}
                    className="absolute inset-0 z-20"
                    aria-label={`Go to ${lesson.title}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
