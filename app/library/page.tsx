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
    <div className="w-full px-6 py-6 bg-gradient-to-br from-background via-tertiary/10 to-tertiary/10 min-h-screen">
      {/* Header with Mascot - Stitch Frame Style */}
      <div className="relative w-full bg-tertiary rounded-3xl p-1 shadow-clay-surface overflow-hidden mb-6">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-surface/40 pointer-events-none"></div>
        <div className="relative bg-surface/95 backdrop-blur-sm rounded-[24px] p-6 md:p-8">
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left: Header info */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-4 py-1 rounded-full bg-tertiary text-text-primary font-label-sm text-label-sm tracking-wider uppercase font-bold shadow-clay-surface border-2 border-surface/30">📚 Content Library</span>
              <span className="text-text-muted text-label-sm">•</span>
              <span className="px-4 py-1 rounded-full bg-gradient-to-r from-tertiary to-error text-text-primary font-label-sm text-label-sm font-bold shadow-clay-surface border-2 border-surface/30">Video Only</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-text-primary tracking-tight leading-none">
              Video Library 🎬
            </h1>
            <p className="font-body-lg text-body-lg text-text-muted leading-relaxed">
              Watch lesson videos without completing quizzes. Progress is not tracked in the Library.
            </p>
          </div>

          {/* Right: Mascot */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-4 shrink-0">
            <div className="relative max-w-xs bg-secondary/10 p-4 rounded-[24px] shadow-clay-surface border-4 border-surface/50 order-2 sm:order-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-secondary text-[18px]" style={{ fontVariationSettings: 'FILL 1' }}>play_circle</span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">Browse Freely</span>
              </div>
              <p className="font-headline-md text-label-md text-text-primary font-bold leading-snug">
                "Watch any lesson video anytime. No quizzes, no pressure!"
              </p>
            </div>
            <div className="relative w-28 h-28 md:w-32 md:h-32 shrink-0 order-1 sm:order-2">
              <Mascot pose="idle" size={128} />
            </div>
          </div>
        </div>
        </div>
      </div>

      {libraryLessons.length === 0 ? (
        <div className="rounded-[24px] bg-surface p-8 text-center shadow-clay-surface border-4 border-surface/50">
          <div className="relative w-20 h-20 rounded-xl bg-surface-border flex items-center justify-center overflow-hidden shadow-clay-surface mx-auto mb-4 border-4 border-surface/30">
            <Mascot pose="empty" size={64} />
          </div>
          <p className="font-body-md text-text-muted font-bold">
            No lessons available. Enroll in a course to access the library.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {libraryLessons.map((lesson: any) => (
            <div key={lesson.id} className="rounded-[24px] bg-gradient-to-br from-surface to-tertiary/10 p-6 shadow-clay-surface border-4 border-tertiary/30">
              <div className="flex justify-between items-start mb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full bg-tertiary text-text-primary font-label-sm text-label-sm font-bold shadow-clay-surface border-2 border-surface/30">
                      {lesson.courseName}
                    </span>
                    <span className="text-text-muted text-label-sm">•</span>
                    <span className="font-label-sm text-text-muted font-bold">
                      {lesson.unitName}
                    </span>
                  </div>
                  <h2 className="font-headline-md text-headline-md text-text-primary">{lesson.title}</h2>
                  <p className="font-body-sm text-text-muted mt-2">{lesson.description}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="material-symbols-outlined text-secondary text-[16px]" style={{ fontVariationSettings: 'FILL 1' }}>stars</span>
                    <span className="font-label-sm text-secondary font-bold">{lesson.xpReward} XP (if completed via quiz)</span>
                  </div>
                </div>
              </div>

              {lesson.videoUrl ? (
                <VideoPlayer videoUrl={lesson.videoUrl} lessonId={lesson.id} />
              ) : (
                <div className="rounded-xl bg-surface p-8 text-center border-4 border-surface/50">
                  <div className="text-4xl mb-3">🎬</div>
                  <p className="font-body-sm text-text-muted font-bold">No video available for this lesson</p>
                </div>
              )}

              <div className="mt-4 rounded-xl border-4 border-secondary/30 bg-secondary/10 p-4 text-sm text-secondary">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-[18px] text-secondary">info</span>
                  <span className="font-label-md font-bold text-secondary">Library Mode:</span>
                </div>
                <p className="font-body-sm text-secondary">
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
