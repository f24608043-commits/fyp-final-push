import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const startTime = Date.now();
  let user = null;
  try {
    const supabase = await createClient();
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (error) {
    console.error('[HOME] Error fetching user:', error);
  }

  const endTime = Date.now();
  console.log(`[PERF] Home page server render time: ${endTime - startTime}ms`);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8 text-center">
      <div className="max-w-lg w-full rounded-3xl bg-white p-12 shadow-2xl border border-gray-100">
        {/* Logo */}
        <div className="mb-10 flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-5xl shadow-xl">
            🧱
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl font-extrabold text-gray-900 mb-4">LEGO</h1>
        <p className="text-lg text-gray-600 mb-10 leading-relaxed">
          Learn And Go — AI-powered, gamified learning with video lessons, quizzes, and live tutoring.
        </p>

        {/* CTA Buttons */}
        <div className="space-y-4">
          {user ? (
            <div className="space-y-6">
              <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-6 text-sm text-blue-700">
                <p className="font-semibold text-base">Welcome back!</p>
                <p className="text-sm mt-2">Signed in as {user.email}</p>
              </div>
              <Link
                href="/path"
                className="block w-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 text-base font-semibold text-white hover:from-blue-600 hover:to-purple-700 shadow-lg transition-all active:scale-95"
              >
                Continue Learning →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Link
                href="/sign-up"
                className="block w-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 text-base font-semibold text-white hover:from-blue-600 hover:to-purple-700 shadow-lg transition-all active:scale-95"
              >
                Get Started Free
              </Link>
              <Link
                href="/sign-in"
                className="block w-full rounded-full border-2 border-gray-200 px-8 py-4 text-base font-medium text-gray-700 hover:bg-gray-50 transition-all"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-12 pt-10 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl mb-2">📚</div>
              <p className="text-sm font-semibold text-gray-700">Video Lessons</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🎯</div>
              <p className="text-sm font-semibold text-gray-700">Interactive Quizzes</p>
            </div>
            <div>
              <div className="text-3xl mb-2">👨‍🏫</div>
              <p className="text-sm font-semibold text-gray-700">Live Tutoring</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
