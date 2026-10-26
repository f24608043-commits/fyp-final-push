import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import PostComposer from "./PostComposer";
import FeedList from "./FeedList";
import Mascot from "@/components/Mascot";
import Link from "next/link";
import { db } from "@/db";
import { profiles, friendships, posts } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get user profile and stats
  const [profile, friendCount, postCount] = await Promise.all([
    db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1),
    db.select({ count: sql<number>`count(*)` })
      .from(friendships)
      .where(
        and(
          sql`(${friendships.requesterId} = ${user.id} OR ${friendships.addresseeId} = ${user.id})`,
          eq(friendships.status, "accepted")
        )
      ),
    db.select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(eq(posts.authorId, user.id))
  ]);

  const userProfile = profile[0];
  const totalFriends = friendCount[0]?.count || 0;
  const totalPosts = postCount[0]?.count || 0;

  const { getFeed } = await import("./actions");
  const feed = await getFeed(undefined, 20);

  return (
    <div className="w-full px-6 py-6 bg-gradient-to-br from-background via-tertiary/10 to-tertiary/10 min-h-screen">
      {/* Header with Mascot - Stitch Frame Style */}
      <div className="relative w-full bg-tertiary rounded-3xl p-1 shadow-clay-surface overflow-hidden mb-6">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-surface/40 pointer-events-none"></div>
        <div className="relative bg-surface/95 backdrop-blur-sm rounded-[24px] p-6 md:p-8">
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col gap-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-4 py-1 rounded-full bg-tertiary text-text-primary font-label-sm text-label-sm tracking-wider uppercase font-bold shadow-clay-surface border-2 border-surface/30">📱 Social Feed</span>
                <span className="text-text-muted text-label-sm">•</span>
                <span className="px-4 py-1 rounded-full bg-primary text-text-primary font-label-sm text-label-sm font-bold shadow-clay-surface border-2 border-surface/30">Stay Connected!</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-text-primary tracking-tight leading-none">
                Your Social Feed
              </h1>
              <p className="font-body-lg text-body-lg text-text-muted leading-relaxed">
                Share updates, celebrate achievements, and connect with friends
              </p>
            </div>

            <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center lg:items-end justify-center gap-4 shrink-0 self-center lg:self-auto">
              <div className="relative max-w-xs bg-tertiary/10 p-4 rounded-[24px] shadow-clay-surface border-4 border-surface/50 order-2 sm:order-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-tertiary text-[18px]" style={{ fontVariationSettings: 'FILL 1' }}>forum</span>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-tertiary font-bold">Share Your Journey</span>
                </div>
                <p className="font-headline-md text-label-md text-text-primary font-bold leading-snug">
                  "Connect with friends and celebrate learning together!"
                </p>
              </div>
              <div className="relative w-28 h-28 md:w-32 md:h-32 shrink-0 order-1 sm:order-2">
                <Mascot pose="celebrate" size={128} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-[24px] bg-secondary/10 p-5 shadow-clay-surface border-4 border-secondary/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">📝</span>
            <span className="font-headline-xl text-secondary font-extrabold">{totalPosts}</span>
          </div>
          <p className="font-label-md text-secondary font-semibold">Your Posts</p>
          <p className="font-body-sm text-secondary mt-1">Keep sharing!</p>
        </div>

        <div className="rounded-[24px] bg-tertiary/10 p-5 shadow-clay-surface border-4 border-tertiary/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">👥</span>
            <span className="font-headline-xl text-tertiary font-extrabold">{totalFriends}</span>
          </div>
          <p className="font-label-md text-tertiary font-semibold">Friends</p>
          <Link href="/friends" className="font-body-sm text-primary mt-1 hover:underline">Find more →</Link>
        </div>

        <div className="rounded-[24px] bg-primary/10 p-5 shadow-clay-surface border-4 border-primary/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">📰</span>
            <span className="font-headline-xl text-success font-extrabold">{feed.posts.length}</span>
          </div>
          <p className="font-label-md text-success font-semibold">Feed Posts</p>
          <p className="font-body-sm text-primary mt-1">Stay updated</p>
        </div>
      </div>

      {/* Post Composer */}
      <PostComposer />

      {/* Feed */}
      {feed.posts.length === 0 ? (
        <div className="mt-6 rounded-[24px] bg-surface p-12 text-center shadow-clay-surface border-4 border-surface/50">
          <div className="relative w-24 h-24 rounded-xl bg-surface-border flex items-center justify-center overflow-hidden shadow-clay-surface mx-auto mb-4 border-4 border-surface/30">
            <Mascot pose="empty" size={96} />
          </div>
          <h2 className="font-headline-lg text-headline-lg text-text-primary font-bold mb-2">
            No posts yet
          </h2>
          <p className="font-body-md text-text-muted mb-4">
            Share your first post or add friends to see their updates here!
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/friends/add" className="px-6 py-3 rounded-full bg-tertiary text-text-primary font-label-sm font-semibold shadow-clay-surface border-2 border-surface/30 hover:bg-tertiary/80 transition-all">
              Add Friends
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <FeedList />
        </div>
      )}
    </div>
  );
}
