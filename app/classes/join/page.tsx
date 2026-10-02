import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { groups, groupMembers, profiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { joinClassByCode } from "./actions";

export default async function JoinClassPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="w-full px-8 py-8 bg-gradient-to-br from-background via-blue-50 to-cyan-50 min-h-screen">
      {/* Header */}
      <div className="relative w-full bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 rounded-3xl p-1 shadow-2xl overflow-hidden mb-8">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-white/40 pointer-events-none"></div>
        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-8 md:p-10">
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Link
                href="/classes"
                className="inline-flex items-center gap-1 text-text-muted hover:text-primary font-label-sm font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to Classes
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-4 py-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-label-sm text-label-sm tracking-wider uppercase font-bold shadow-lg border-2 border-white/30">🔗 Join Class</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-text-primary tracking-tight leading-none">
                Join a Class
              </h1>
              <p className="font-body-lg text-body-lg text-text-muted leading-relaxed">
                Enter your class code to enroll
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Join Form */}
      <div className="rounded-2xl bg-surface p-8 shadow-clay-surface border border-surface-border max-w-2xl">
        <form action={joinClassByCode} className="space-y-6">
          <div>
            <label htmlFor="groupCode" className="block font-label-md font-semibold text-text-primary mb-2">
              Class Code *
            </label>
            <input
              type="text"
              id="groupCode"
              name="groupCode"
              required
              className="w-full rounded-xl border-2 border-surface-border px-4 py-3 font-body-md text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all uppercase"
              placeholder="e.g., ABC123"
              maxLength={6}
            />
            <p className="font-body-sm text-text-muted mt-2">
              Enter the 6-character code provided by your tutor
            </p>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-surface-border">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 font-label-md font-bold shadow-clay-primary border-2 border-white/30 transform hover:scale-105 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">login</span>
              Join Class
            </button>
            <Link
              href="/classes"
              className="inline-flex items-center gap-2 rounded-full bg-surface border-2 border-surface-border text-text-primary px-6 py-3 font-label-md font-semibold shadow-clay-surface hover:shadow-clay-primary transition-all"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
