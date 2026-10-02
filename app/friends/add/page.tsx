import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { redirect } from "next/navigation";
import Link from "next/link";
import { sendFriendRequest } from "../actions";

export default async function AddFriendPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="w-full px-6 py-6 bg-gradient-to-br from-background via-pink-50 to-rose-50 min-h-screen">
      {/* Header */}
      <div className="relative w-full bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 rounded-3xl p-1 shadow-2xl overflow-hidden mb-8">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-white/40 pointer-events-none"></div>
        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-8 md:p-10">
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Link
                href="/friends"
                className="inline-flex items-center gap-1 text-text-muted hover:text-primary font-label-sm font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to Friends
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-4 py-1 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-label-sm text-label-sm tracking-wider uppercase font-bold shadow-lg border-2 border-white/30">➕ Add Friend</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-text-primary tracking-tight leading-none">
                Add a Friend
              </h1>
              <p className="font-body-lg text-body-lg text-text-muted leading-relaxed">
                Enter their email or username to send a friend request
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Friend Form */}
      <div className="rounded-2xl bg-surface p-8 shadow-clay-surface border border-surface-border max-w-2xl">
        <form action={sendFriendRequest} className="space-y-6">
          <div>
            <label htmlFor="email" className="block font-label-md font-semibold text-text-primary mb-2">
              Email or Username *
            </label>
            <input
              type="text"
              id="email"
              name="email"
              required
              className="w-full rounded-xl border-2 border-surface-border px-4 py-3 font-body-md text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Enter email or username"
            />
            <p className="font-body-sm text-text-muted mt-2">
              Enter the email address or username of the person you want to add
            </p>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-surface-border">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 font-label-md font-bold shadow-clay-primary border-2 border-white/30 transform hover:scale-105 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
              Send Request
            </button>
            <Link
              href="/friends"
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
