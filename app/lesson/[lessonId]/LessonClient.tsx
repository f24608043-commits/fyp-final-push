"use client";

import { useState } from "react";
import Link from "next/link";
import { submitQuiz, type QuizSubmissionResult } from "../actions";
import Celebration from "@/components/Celebration";
import Mascot from "@/components/Mascot";

interface OptionItem {
  id: string;
  optionText: string;
}

interface ChallengeItem {
  id: string;
  questionText: string;
  points: number;
  options: OptionItem[];
}

interface LessonClientProps {
  lessonId: string;
  lessonTitle: string;
  lessonDescription: string | null;
  youtubeVideoId: string;
  xpReward: number;
  unitTitle: string;
  challenges: ChallengeItem[];
  previousStatus?: "completed" | "in_progress" | "locked";
}

export default function LessonClient({
  lessonId,
  lessonTitle,
  lessonDescription,
  youtubeVideoId,
  xpReward,
  unitTitle,
  challenges,
  previousStatus,
}: LessonClientProps) {
  const [stage, setStage] = useState<"watch" | "quiz" | "result" | "celebration">(
    previousStatus === "completed" ? "watch" : "watch"
  );
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<QuizSubmissionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOptionSelect = (challengeId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [challengeId]: optionId,
    }));
  };

  const handleSubmitQuiz = async () => {
    const unanswered = challenges.some((c) => !selectedAnswers[c.id]);
    if (unanswered) {
      setErrorMsg("Please answer all questions before submitting.");
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await submitQuiz(lessonId, selectedAnswers);
      setResult(res);
      if (res.passed) {
        setStage("celebration");
      } else {
        setStage("result");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit quiz. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full px-6 py-6">
      {/* Top Breadcrumb Bar & Quick Stats */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          href="/path"
          className="inline-flex items-center gap-2 font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors group"
        >
          <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-1">arrow_back</span>
          <span>Return to Learning Path</span>
        </Link>
        <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm shadow-sm">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
          <span className="text-on-surface-variant">Estimated time:</span>
          <span className="font-headline-md text-label-md text-primary">8 mins</span>
        </div>
      </div>

      {/* Main Header Card with Mascot Speech */}
      <div className="relative w-full rounded-3xl bg-surface-container-lowest p-6 md:p-8 shadow-xl overflow-hidden mb-6">
        {/* Decorative background gradients */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-primary-fixed/25 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-tertiary-fixed/30 blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left: Lesson Hierarchy, Headline & Scope */}
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 rounded-lg bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm tracking-wider uppercase">{unitTitle}</span>
              <span className="text-outline text-label-sm">•</span>
              <span className="px-3 py-0.5 rounded-lg bg-primary-container/20 text-primary font-label-sm text-label-sm">Lesson</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight leading-none">
              {lessonTitle}
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              {lessonDescription}
            </p>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed font-label-md text-label-md">
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                <span>+{xpReward} XP Reward</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface-container-high text-on-surface font-label-md text-label-md">
                <span className="material-symbols-outlined text-primary text-[18px]">code_blocks</span>
                <span>{challenges.length} Interactive Challenges</span>
              </div>
            </div>
          </div>

          {/* Right: Mascot + Speech Bubble */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center lg:items-end justify-center gap-4 shrink-0 self-center lg:self-auto">
            {/* Speech Bubble */}
            <div className="relative max-w-xs bg-surface-container-lowest p-4 rounded-2xl shadow-lg border-b-4 border-surface-container-high order-2 sm:order-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-secondary text-[18px]" style={{ fontVariationSettings: 'FILL 1' }}>local_fire_department</span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">7-Day Streak active!</span>
              </div>
              <p className="font-headline-md text-label-md text-on-surface font-bold leading-snug">
                "You're already on a 7-day streak! Let's crush this lesson."
              </p>
              {/* Speech bubble arrow */}
              <div className="hidden sm:block absolute -right-2.5 top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-surface-container-lowest"></div>
            </div>
            {/* Mascot */}
            <div className="relative w-28 h-28 md:w-32 md:h-32 shrink-0 order-1 sm:order-2">
              <Mascot pose="encouraging" size={128} />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {stage === "watch" && (
          <div className="rounded-3xl bg-surface-container-lowest p-4 shadow-md border-b-4 border-surface-container-high overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">smart_display</span>
                <h2 className="font-headline-md text-headline-md text-on-surface">Video Lecture Preview</h2>
              </div>
              <span className="px-3 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">Embedded YouTube Lesson</span>
            </div>

            {/* Video Player */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-surface-container-highest">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?rel=0`}
                title={lessonTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setStage("quiz")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-container text-on-primary font-label-lg font-bold uppercase tracking-wider shadow-lg hover:bg-primary transition-all active:translate-y-[2px]"
              >
                Take Quiz
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {stage === "quiz" && (
          <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-on-primary text-sm font-bold">
                  2
                </div>
                <span className="font-headline-md text-headline-md text-on-surface">Quiz</span>
              </div>
              <button
                type="button"
                onClick={() => setStage("watch")}
                className="font-label-sm font-bold text-primary hover:underline"
              >
                ← Rewatch Video
              </button>
            </div>
            <p className="font-body-sm text-on-surface-variant mb-6">
              Answer all questions correctly to earn XP and unlock the next level.
            </p>

            {errorMsg && (
              <div className="mb-6 rounded-xl border border-error bg-error-container p-4 text-sm text-on-error-container">
                {errorMsg}
              </div>
            )}

            <div className="space-y-6">
              {challenges.map((c, cIdx) => (
                <div key={c.id} className="rounded-xl border border-outline-variant bg-surface-container p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-label-sm font-bold uppercase tracking-wider text-on-surface-variant">
                      Question {cIdx + 1} of {challenges.length}
                    </span>
                    <span className="font-label-sm font-medium text-on-surface-variant">
                      {c.points} {c.points === 1 ? "point" : "points"}
                    </span>
                  </div>

                  <h3 className="font-label-md text-on-surface mb-4">{c.questionText}</h3>

                  <div className="space-y-3">
                    {c.options.map((opt) => {
                      const isSelected = selectedAnswers[c.id] === opt.id;

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleOptionSelect(c.id, opt.id)}
                          className={`flex w-full items-center justify-between rounded-xl border p-4 text-left font-label-md transition-all ${
                            isSelected
                              ? "border-primary bg-surface-container-high text-primary shadow-glow"
                              : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary hover:bg-surface-container"
                          }`}
                        >
                          <span>{opt.optionText}</span>
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                              isSelected
                                ? "border-primary bg-primary text-on-primary"
                                : "border-outline-variant"
                            }`}
                          >
                            {isSelected ? "✓" : ""}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitQuiz}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-container text-on-primary font-label-lg font-bold uppercase tracking-wider shadow-lg hover:bg-primary disabled:opacity-50 transition-all active:translate-y-[2px]"
              >
                {isSubmitting ? "Grading..." : "Submit Answers"}
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {stage === "result" && result && (
          <div className="rounded-2xl bg-surface-container-lowest p-8 shadow-md text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-surface-container text-5xl">
              {result.passed ? "🎉" : "🔄"}
            </div>

            <h2 className="font-headline-xl text-headline-xl text-on-surface font-extrabold">
              {result.passed ? "Level Completed!" : "Almost There!"}
            </h2>

            <p className="mt-2 font-body-md text-on-surface-variant">
              {result.passed
                ? `Great job! You scored ${result.score}% (${result.correctCount}/${result.totalQuestions} correct) and unlocked the next level.`
                : `You scored ${result.score}%. You need at least 50% to pass and unlock the next level.`}
            </p>

            <div className="my-8 inline-flex items-center gap-8 rounded-2xl bg-surface-container px-8 py-6 border border-outline-variant">
              <div>
                <div className="font-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Your Score</div>
                <div
                  className={`font-headline-xl text-headline-xl font-extrabold ${
                    result.passed ? "text-primary-container" : "text-secondary"
                  }`}
                >
                  {result.score}%
                </div>
              </div>

              {result.passed && (
                <>
                  <div className="h-12 w-px bg-outline-variant" />
                  <div>
                    <div className="font-label-sm uppercase tracking-wider text-on-surface-variant font-bold">XP Earned</div>
                    <div className="font-headline-xl text-headline-xl font-extrabold text-secondary-container">
                      +{result.xpAwarded}
                    </div>
                  </div>
                </>
              )}
            </div>

            {result.badgesAwarded.length > 0 && (
              <div className="mb-6 rounded-xl border border-secondary bg-secondary-fixed p-4 inline-block">
                <span className="font-label-sm font-bold uppercase text-on-secondary-container">
                  🏅 New Badge Unlocked!
                </span>
                <p className="mt-1 font-label-md font-semibold text-on-secondary-container">
                  {result.badgesAwarded.join(", ")}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              {result.passed ? (
                <>
                  <button
                    type="button"
                    onClick={() => setStage("celebration")}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-container text-on-primary font-label-lg font-bold uppercase tracking-wider shadow-lg hover:bg-primary transition-all active:translate-y-[2px]"
                  >
                    View Celebration
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </button>
                  <Link
                    href="/path"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-outline-variant font-label-md font-semibold text-on-surface hover:bg-surface-container transition-all"
                  >
                    Skip to Path
                  </Link>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAnswers({});
                      setStage("quiz");
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-container text-on-primary font-label-lg font-bold uppercase tracking-wider shadow-lg hover:bg-primary transition-all active:translate-y-[2px]"
                  >
                    Retake Quiz
                  </button>
                  <button
                    type="button"
                    onClick={() => setStage("watch")}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-outline-variant font-label-md font-semibold text-on-surface hover:bg-surface-container transition-all"
                  >
                    Rewatch Video
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {stage === "celebration" && result && (
          <Celebration
            lessonTitle={lessonTitle}
            xpEarned={result.xpAwarded}
            totalXP={result.totalXP || 0}
            lessonsCompleted={result.lessonsCompleted || 0}
            accuracy={result.score}
            streakDays={result.streakDays || 0}
            badge={result.badgesAwarded.length > 0 ? {
              name: result.badgesAwarded[0],
              description: "Awarded for your achievement!"
            } : undefined}
            onNextLesson={() => window.location.href = "/path"}
            onReview={() => setStage("result")}
            onReturnToPath={() => window.location.href = "/path"}
          />
        )}
      </div>
    </div>
  );
}
