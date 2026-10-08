"use client";

import { useState } from "react";
import { completeOnboarding } from "./actions";
import Mascot from "@/components/Mascot";

interface OnboardingFormProps {
  publishedCourses: any[];
  userProfile: any;
}

export default function OnboardingForm({ publishedCourses, userProfile }: OnboardingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      await completeOnboarding(formData);
    } catch (error) {
      setIsSubmitting(false);
      console.error("Onboarding error:", error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 md:p-6">
      <div className="w-full max-w-2xl rounded-[20px] md:rounded-[24px] bg-surface p-6 md:p-8 shadow-clay-surface border border-surface-border">
        {/* Header with Mascot */}
        <div className="mb-6 md:mb-8 text-center">
          <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl bg-surface-border flex items-center justify-center overflow-hidden shadow-clay-surface mx-auto mb-4">
            <Mascot pose="celebrate" size={64} />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 md:px-4 md:py-1.5 font-label-xs md:font-label-sm font-semibold text-primary">
            <span>👋</span>
            <span className="text-sm md:text-base">Welcome, {userProfile?.displayName || "Learner"}!</span>
          </div>
          <h1 className="mt-4 font-headline-lg md:font-headline-xl text-text-primary tracking-tight font-extrabold">Personalize Your Path</h1>
          <p className="mt-2 font-body-sm md:font-body-md text-text-muted">
            Set up your learning goals and select the subjects you want to master.
          </p>
        </div>

        <form action={handleSubmit} className="space-y-6 md:space-y-8">
          {/* 1. Course Selection */}
          <div>
            <h2 className="font-headline-md text-text-primary font-extrabold">1. Select Your Courses</h2>
            <p className="font-body-sm text-text-muted">Pick one or more courses to add to your library.</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {publishedCourses.map((c, index) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-surface-border bg-surface-border p-3 md:p-4 hover:border-primary hover:bg-surface-border has-checked:border-primary has-checked:bg-surface-border transition-all"
                >
                  <input
                    type="checkbox"
                    name="courseIds"
                    value={c.id}
                    defaultChecked={index === 0}
                    className="mt-1 h-4 w-4 rounded border-surface-border text-primary focus:ring-primary"
                    disabled={isSubmitting}
                  />
                  <div>
                    <div className="font-label-sm md:font-label-md text-text-primary font-semibold text-sm md:text-base">{c.title}</div>
                    <div className="mt-1 font-body-xs md:font-body-sm text-text-muted line-clamp-2">{c.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 2. Placement Assessment */}
          <div>
            <h2 className="font-headline-md text-text-primary font-extrabold">2. What is your coding background?</h2>
            <p className="font-body-sm text-text-muted">Helps us recommend pacing and practice challenges.</p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                { id: "beginner", title: "Complete Beginner", desc: "Never written code before" },
                { id: "intermediate", title: "Some Experience", desc: "Know basic syntax and loops" },
                { id: "advanced", title: "Experienced", desc: "Comfortable with software concepts" },
              ].map((level) => (
                <label
                  key={level.id}
                  className="flex cursor-pointer flex-col rounded-xl border border-surface-border bg-surface-border p-3 md:p-4 hover:border-primary has-checked:border-primary has-checked:bg-surface-border transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm md:font-label-md text-text-primary font-semibold text-sm md:text-base">{level.title}</span>
                    <input
                      type="radio"
                      name="placementAnswer"
                      value={level.id}
                      defaultChecked={level.id === "beginner"}
                      className="h-4 w-4 text-primary focus:ring-primary"
                      disabled={isSubmitting}
                    />
                  </div>
                  <span className="mt-1 font-body-xs md:font-body-sm text-text-muted">{level.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 3. Daily Goal Picker */}
          <div>
            <h2 className="font-headline-md text-text-primary font-extrabold">3. Set Your Daily Time Goal</h2>
            <p className="font-body-sm text-text-muted">Consistent daily practice builds your learning streak.</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { mins: 10, label: "Casual", time: "10 mins/day" },
                { mins: 15, label: "Regular", time: "15 mins/day" },
                { mins: 30, label: "Serious", time: "30 mins/day" },
                { mins: 60, label: "Intense", time: "60 mins/day" },
              ].map((goal) => (
                <label
                  key={goal.mins}
                  className="flex cursor-pointer flex-col items-center rounded-xl border border-surface-border bg-surface-border p-2 md:p-3 text-center hover:border-primary has-checked:border-primary has-checked:bg-surface-border transition-all"
                >
                  <input
                    type="radio"
                    name="dailyGoalMinutes"
                    value={goal.mins}
                    defaultChecked={goal.mins === 15}
                    className="mb-2 h-4 w-4 text-primary focus:ring-primary"
                    disabled={isSubmitting}
                  />
                  <span className="font-label-xs md:font-label-sm font-bold uppercase tracking-wider text-text-muted text-xs md:text-sm">
                    {goal.label}
                  </span>
                  <span className="mt-0.5 font-label-sm md:font-label-md font-semibold text-text-primary text-xs md:text-sm">{goal.time}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-primary text-text-primary py-3 font-label-md md:font-label-lg font-bold uppercase tracking-wider shadow-clay-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-text-primary"></span>
                <span>Setting up your journey...</span>
              </>
            ) : (
              "Start My Learning Journey →"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
