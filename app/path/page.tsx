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
    <div className="w-full px-6 py-6 bg-gradient-to-br from-background via-primary/5 to-secondary/5 min-h-screen">
      {/* Welcome Banner with Mascot - Stitch Frame Style */}
      <section className="w-full mb-6">
        <div className="relative bg-gradient-to-br from-primary via-primary/95 to-secondary rounded-3xl p-1 shadow-2xl overflow-hidden">
          {/* Stitch border effect */}
          <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-white/30 pointer-events-none"></div>
          <div className="absolute inset-2 rounded-2xl border-2 border-dotted border-white/20 pointer-events-none"></div>
          
          <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6 z-10">
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-xl border-4 border-white">
                <Mascot pose="encouraging" size={80} />
                <span className="absolute top-0 right-0 flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-green-500 border-2 border-white"></span>
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent px-3 py-1 rounded-full font-extrabold border-2 border-primary/20">🎮 Course in Progress</span>
                  <span className="font-label-sm text-label-sm text-text-muted font-bold">• Unit 1</span>
                </div>
                <h1 className="font-headline-lg text-headline-lg text-text-primary leading-snug">
                  Good morning, {profile.displayName || "Learner"}! 🌟
                </h1>
                <p className="font-body-md text-body-md text-text-muted">
                  Keep your momentum going! Complete {currentLesson ? `Node ${orderedLessonsWithUnit.indexOf(currentLesson) + 1}` : "the next lesson"} to reach your daily goal.
                </p>
              </div>
            </div>
            {/* Quick Stats - Colorful Cards */}
            <div className="flex items-center gap-4 z-10 flex-shrink-0">
              <div className="flex flex-col items-center bg-gradient-to-br from-orange-400 to-red-500 text-white px-5 py-3 rounded-2xl text-center min-w-[88px] shadow-xl border-4 border-white/30 transform hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>local_fire_department</span>
                <span className="font-label-lg text-label-lg leading-tight font-extrabold">{profile.streakCount || 0}</span>
                <span className="font-label-sm text-label-sm uppercase opacity-90 font-bold">Streak</span>
              </div>
              <div className="flex flex-col items-center bg-gradient-to-br from-blue-400 to-purple-500 text-white px-5 py-3 rounded-2xl text-center min-w-[88px] shadow-xl border-4 border-white/30 transform hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>bolt</span>
                <span className="font-label-lg text-label-lg leading-tight font-extrabold">{profile.xp?.toLocaleString() || 0}</span>
                <span className="font-label-sm text-label-sm uppercase opacity-90 font-bold">XP</span>
              </div>
              <div className="flex flex-col items-center bg-gradient-to-br from-green-400 to-teal-500 text-white px-5 py-3 rounded-2xl text-center min-w-[88px] shadow-xl border-4 border-white/30 transform hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>emoji_events</span>
                <span className="font-label-lg text-label-lg leading-tight font-extrabold">{Math.floor(Math.sqrt(profile.xp / 100)) + 1}</span>
                <span className="font-label-sm text-label-sm uppercase opacity-90 font-bold">Level</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Current Lesson Hero Card - Stitch Frame Style */}
      {currentLesson && (
        <div className="relative bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-3xl p-1 shadow-2xl overflow-hidden mb-6">
          <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-white/40 pointer-events-none"></div>
          <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col gap-1 max-w-xl z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-label-sm text-label-sm px-3 py-1 rounded-full uppercase tracking-wider font-extrabold flex items-center gap-1 shadow-lg border-2 border-white/30">
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
                <span className="font-label-md text-label-md font-extrabold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">{completedCount} / {totalCount} activities</span>
              </div>
              <div className="w-full h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg" style={{ width: `${(completedCount / totalCount) * 100}%` }}></div>
              </div>
            </div>
          </div>
          {/* CTA Button */}
          <div className="z-10 flex flex-col items-center w-full md:w-auto">
            <Link
              href={`/lesson/${currentLesson.lesson.id}`}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-label-lg text-label-lg uppercase tracking-wider shadow-xl border-4 border-white/30 transform hover:scale-105 transition-all active:scale-95"
            >
              <span>Continue Learning</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </Link>
            <div className="flex items-center gap-1 mt-2 text-secondary font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: 'FILL 1' }}>stars</span>
              <span>+{currentLesson.lesson.xpReward} XP Reward on Finish</span>
            </div>
          </div>
          <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-purple-500/20 blur-xl pointer-events-none"></div>
        </div>
        </div>
      )}

      {/* Gamified Path Section - Stitch Frame Style */}
      <div className="bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 rounded-3xl p-1 shadow-2xl flex flex-col items-center relative overflow-hidden">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-white/40 pointer-events-none"></div>
        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-6 w-full flex flex-col items-center">
        {/* Unit Header */}
        <div className="w-full flex items-center justify-between pb-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-headline-md shadow-xl border-4 border-white/30">
              <span className="material-symbols-outlined text-[28px]">data_object</span>
            </div>
            <div>
              <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">Unit 1</span>
              <h3 className="font-headline-md text-headline-md text-text-primary">{courseUnits[0]?.title || "Course"}</h3>
            </div>
          </div>
          <span className="font-label-sm text-label-sm bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-1.5 rounded-full font-bold shadow-lg border-2 border-white/30">
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

                {/* Node Circle - Colorful */}
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center hover:scale-110 active:translate-y-[2px] transition-transform border-4 ${
                    isCompleted
                      ? "bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-xl border-white/30"
                      : isCurrent
                      ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-xl border-white/30 animate-pulse"
                      : "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-500 shadow-lg border-white/20"
                  }`}
                >
                  <span className="material-symbols-outlined text-[36px]" style={isCompleted ? { fontVariationSettings: 'FILL 1' } : {}}>
                    {isCompleted ? "check_circle" : isCurrent ? "play_circle" : "lock"}
                  </span>
                </div>

                {/* Star ratings for completed - Colorful */}
                {isCompleted && (
                  <div className="flex items-center gap-0.5 mt-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full shadow-xl border-2 border-white/30">
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
    </div>
  );
}
