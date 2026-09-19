import { getLibraryLessons } from "./actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import VideoPlayer from "./VideoPlayer";
import Mascot from "@/components/Mascot";

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const libraryLessons = await getLibraryLessons();

  return (
    <div className="w-full px-6 py-6">
      {/* Header with Mascot */}
      <div className="relative w-full rounded-3xl bg-surface-container-lowest p-6 md:p-8 shadow-xl overflow-hidden mb-6">
        {/* Decorative background gradients */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-primary-fixed/25 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-tertiary-fixed/30 blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left: Header info */}
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 rounded-lg bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm tracking-wider uppercase">Content Library</span>
              <span className="text-outline text-label-sm">•</span>
              <span className="px-3 py-0.5 rounded-lg bg-primary-container/20 text-primary font-label-sm text-label-sm">Video Only</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight leading-none">
              Video Library
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              Watch lesson videos without completing quizzes. Progress is not tracked in the Library.
            </p>
          </div>

          {/* Right: Mascot */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center lg:items-end justify-center gap-4 shrink-0 self-center lg:self-auto">
            <div className="relative max-w-xs bg-surface-container-lowest p-4 rounded-2xl shadow-lg border-b-4 border-surface-container-high order-2 sm:order-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-secondary text-[18px]" style={{ fontVariationSettings: 'FILL 1' }}>play_circle</span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Browse Freely</span>
              </div>
              <p className="font-headline-md text-label-md text-on-surface font-bold leading-snug">
                "Watch any lesson video anytime. No quizzes, no pressure!"
              </p>
            </div>
            <div className="relative w-28 h-28 md:w-32 md:h-32 shrink-0 order-1 sm:order-2">
              <Mascot pose="idle" size={128} />
            </div>
          </div>
        </div>
      </div>

      {libraryLessons.length === 0 ? (
        <div className="rounded-2xl bg-surface-container-lowest p-8 text-center shadow-md">
          <div className="relative w-20 h-20 rounded-xl bg-surface-container flex items-center justify-center overflow-hidden shadow-inner mx-auto mb-4">
            <Mascot pose="empty" size={64} />
          </div>
          <p className="font-body-md text-on-surface-variant">
            No lessons available. Enroll in a course to access the library.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {libraryLessons.map((lesson: any) => (
            <div key={lesson.id} className="rounded-2xl bg-surface-container-lowest p-6 shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                      {lesson.courseName}
                    </span>
                    <span className="text-outline text-label-sm">•</span>
                    <span className="font-label-sm text-on-surface-variant">
                      {lesson.unitName}
                    </span>
                  </div>
                  <h2 className="font-headline-md text-headline-md text-on-surface">{lesson.title}</h2>
                  <p className="font-body-sm text-on-surface-variant mt-2">{lesson.description}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="material-symbols-outlined text-secondary text-[16px]">stars</span>
                    <span className="font-label-sm text-secondary font-bold">{lesson.xpReward} XP (if completed via quiz)</span>
                  </div>
                </div>
              </div>

              {lesson.videoUrl ? (
                <VideoPlayer videoUrl={lesson.videoUrl} lessonId={lesson.id} />
              ) : (
                <div className="rounded-xl bg-surface-container p-8 text-center">
                  <div className="text-4xl mb-3">🎬</div>
                  <p className="font-body-sm text-on-surface-variant">No video available for this lesson</p>
                </div>
              )}

              <div className="mt-4 rounded-xl border border-tertiary bg-tertiary-fixed p-4 text-sm text-on-tertiary-fixed">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-[18px]">info</span>
                  <span className="font-label-md font-bold">Library Mode:</span>
                </div>
                <p className="font-body-sm">
                  Watching here does not track progress or award XP. Complete the quiz in the lesson page to earn XP and track progress.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
