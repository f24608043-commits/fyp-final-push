import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

const FEATURES = [
  { icon: "menu_book", label: "Video Lessons" },
  { icon: "quiz", label: "Interactive Quizzes" },
  { icon: "diversity_3", label: "Live Tutoring" },
];

export default async function Home() {
  const startTime = Date.now();
  let user = null;
  try {
    const supabase = await createClient();
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (error) {
    console.error("[HOME] Error fetching user:", error);
  }

  console.log(`[PERF] Home page server render time: ${Date.now() - startTime}ms`);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 py-10 text-center sm:px-6">
      <div className="w-full max-w-lg rounded-[24px] border border-surface-border bg-surface p-8 shadow-clay-surface sm:p-12">
        <div className="mb-8 flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-[24px] bg-primary text-4xl shadow-clay-primary">
            🧱
          </div>
        </div>

        <h1 className="mb-3 font-headline-xl font-extrabold text-text-primary">
          LEGO
        </h1>
        <p className="mb-10 font-body-lg leading-relaxed text-text-muted">
          Learn And Go — AI-powered, gamified learning with video lessons, quizzes,
          and live tutoring.
        </p>

        <div className="space-y-4">
          {user ? (
            <div className="space-y-6">
              <div className="rounded-[24px] border border-primary/20 bg-primary/10 p-6 text-primary shadow-clay-surface">
                <p className="font-label-lg font-bold">Welcome back!</p>
                <p className="mt-2 font-body-sm opacity-80">
                  Signed in as {user.email}
                </p>
              </div>
              <Link
                href="/path"
                className="block w-full rounded-[24px] bg-primary px-8 py-4 font-label-lg font-bold text-text-primary shadow-clay-primary transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-dark active:translate-y-[1px] active:shadow-clay-primary-pressed"
              >
                Continue Learning →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Link
                href="/sign-up"
                className="block w-full rounded-[24px] bg-primary px-8 py-4 font-label-lg font-bold text-text-primary shadow-clay-primary transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-dark active:translate-y-[1px] active:shadow-clay-primary-pressed"
              >
                Get Started Free
              </Link>
              <Link
                href="/sign-in"
                className="block w-full rounded-[24px] border border-surface-border bg-surface px-8 py-4 font-label-lg font-medium text-text-primary shadow-clay-surface transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-border active:translate-y-[1px] active:shadow-clay-surface-pressed"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        <div className="mt-12 border-t border-surface-border pt-10">
          <div className="grid grid-cols-3 gap-4 text-center sm:gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.label}
                className="rounded-[24px] bg-surface-border/60 px-2 py-5 shadow-clay-surface transition-all duration-200 hover:-translate-y-0.5"
              >
                <span className="material-symbols-outlined mb-2 block text-[32px] text-primary">
                  {feature.icon}
                </span>
                <p className="font-label-sm font-semibold text-text-primary">
                  {feature.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}