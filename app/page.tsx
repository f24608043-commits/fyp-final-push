import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const startTime = Date.now();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const endTime = Date.now();
  console.log(`[PERF] Home page server render time: ${endTime - startTime}ms`);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <div className="max-w-md w-full rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-container text-4xl shadow-lg">
            🧱
          </div>
        </div>

        {/* Title */}
        <h1 className="font-headline-xl text-headline-xl text-on-surface font-extrabold mb-2">LEGO</h1>
        <p className="font-body-md text-on-surface-variant mb-8">
          Learn And Go — AI-powered, gamified learning with video lessons, quizzes, and live tutoring.
        </p>

        {/* CTA Buttons */}
        <div className="space-y-3">
          {user ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-primary bg-primary-container/20 p-4 text-sm text-primary">
                <p className="font-semibold">Welcome back!</p>
                <p className="text-xs mt-1">Signed in as {user.email}</p>
              </div>
              <Link
                href="/path"
                className="block w-full rounded-full bg-primary-container px-6 py-3 text-sm font-semibold text-on-primary hover:bg-primary shadow-lg transition-all active:translate-y-[2px]"
              >
                Continue Learning →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Link
                href="/sign-up"
                className="block w-full rounded-full bg-primary-container px-6 py-3 text-sm font-semibold text-on-primary hover:bg-primary shadow-lg transition-all active:translate-y-[2px]"
              >
                Get Started Free
              </Link>
              <Link
                href="/sign-in"
                className="block w-full rounded-full border border-outline-variant px-6 py-3 text-sm font-medium text-on-surface hover:bg-surface-container transition-all"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-8 pt-8 border-t border-outline-variant">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl mb-1">📚</div>
              <p className="text-xs font-semibold text-on-surface">Video Lessons</p>
            </div>
            <div>
              <div className="text-2xl mb-1">🎯</div>
              <p className="text-xs font-semibold text-on-surface">Interactive Quizzes</p>
            </div>
            <div>
              <div className="text-2xl mb-1">👨‍🏫</div>
              <p className="text-xs font-semibold text-on-surface">Live Tutoring</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
