import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import PostComposer from "./PostComposer";
import FeedList from "./FeedList";
import Mascot from "@/components/Mascot";

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { getFeed } = await import("./actions");
  const feed = await getFeed(undefined, 20);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-background via-tertiary/10 to-tertiary/10">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-headline-2xl text-headline-2xl text-text-primary font-bold tracking-tight">
            Feed
          </h1>
          <p className="font-body-md text-text-muted mt-1">
            See updates from your friends and learning groups
          </p>
        </div>

        {/* Post Composer */}
        <PostComposer />

        {/* Feed */}
        {feed.posts.length === 0 ? (
          <div className="mt-8 rounded-[24px] bg-surface p-12 text-center shadow-clay-surface border-4 border-surface/50">
            <Mascot pose="empty" size={96} />
            <h2 className="font-headline-lg text-headline-lg text-text-primary font-bold mt-4 mb-2">
              No posts yet
            </h2>
            <p className="font-body-md text-text-muted mb-4">
              Share something or follow a friend to see their updates here.
            </p>
          </div>
        ) : (
          <div className="mt-6">
            <FeedList initialPosts={feed.posts} nextCursor={feed.nextCursor} />
          </div>
        )}
      </div>
    </div>
  );
}
