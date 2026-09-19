import { getFriendList, getPendingRequests } from "./actions";
import { acceptFriendRequest, rejectFriendRequest, removeFriend } from "./actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Mascot from "@/components/Mascot";
import Link from "next/link";

export default async function FriendsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const [friends, pendingRequests] = await Promise.all([
    getFriendList(),
    getPendingRequests()
  ]);

  return (
    <div className="w-full px-6 py-6">
      {/* Header with Mascot */}
      <div className="relative w-full rounded-3xl bg-surface-container-lowest p-6 md:p-8 shadow-xl overflow-hidden mb-6">
        {/* Decorative background gradients */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-primary-fixed/25 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-tertiary-fixed/30 blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left: Header info */}
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 rounded-lg bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm tracking-wider uppercase">Social Learning</span>
              <span className="text-outline text-label-sm">•</span>
              <span className="px-3 py-0.5 rounded-lg bg-primary-container/20 text-primary font-label-sm text-label-sm">Friends & Community</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight leading-none">
              Friends & Social Learning
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              Connect with other learners and track your progress together
            </p>
          </div>

          {/* Right: Mascot */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center lg:items-end justify-center gap-4 shrink-0 self-center lg:self-auto">
            <div className="relative max-w-xs bg-surface-container-lowest p-4 rounded-2xl shadow-lg border-b-4 border-surface-container-high order-2 sm:order-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-secondary text-[18px]" style={{ fontVariationSettings: 'FILL 1' }}>group</span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Build Your Network</span>
              </div>
              <p className="font-headline-md text-label-md text-on-surface font-bold leading-snug">
                "Learning together is more fun! Add friends to stay motivated."
              </p>
            </div>
            <div className="relative w-28 h-28 md:w-32 md:h-32 shrink-0 order-1 sm:order-2">
              <Mascot pose="encouraging" size={128} />
            </div>
          </div>
        </div>
      </div>

      {/* Pending Friend Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            <h2 className="font-headline-md text-headline-md text-on-surface font-extrabold">
              Pending Requests ({pendingRequests.length})
            </h2>
          </div>
          <div className="space-y-3">
            {pendingRequests.map((request: any) => (
              <div key={request.id} className="rounded-2xl bg-surface-container-lowest p-4 shadow-md">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-on-primary font-bold text-lg">
                      {request.requester?.displayName?.[0] || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-label-md text-on-surface font-semibold truncate">
                        {request.requester?.displayName || "Unknown User"}
                      </p>
                      <p className="font-body-sm text-on-surface-variant">
                        Sent {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <form action={async () => {
                      "use server";
                      await acceptFriendRequest(request.id);
                    }}>
                      <button className="rounded-full bg-primary-container text-on-primary px-4 py-2 font-label-md font-bold shadow-glow hover:bg-primary transition-all active:translate-y-[2px]">
                        Accept
                      </button>
                    </form>
                    <form action={async () => {
                      "use server";
                      await rejectFriendRequest(request.id);
                    }}>
                      <button className="rounded-xl border border-outline-variant bg-surface-container text-on-surface px-4 py-2 font-label-md font-semibold hover:bg-surface-container-high transition-all">
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friend List */}
      <div>
        <h2 className="font-headline-md text-headline-md text-on-surface font-extrabold mb-4">
          My Friends ({friends.length})
        </h2>
        {friends.length === 0 ? (
          <div className="rounded-2xl bg-surface-container-lowest p-8 text-center shadow-md">
            <div className="relative w-20 h-20 rounded-xl bg-surface-container flex items-center justify-center overflow-hidden shadow-inner mx-auto mb-4">
              <Mascot pose="empty" size={64} />
            </div>
            <p className="font-body-md text-on-surface-variant">No friends yet. Add some friends to get started!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {friends.map((friend: any) => (
              <div key={friend.id} className="rounded-2xl bg-surface-container-lowest p-5 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-container text-on-primary font-bold text-xl">
                    {friend.displayName?.[0] || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-label-md text-on-surface font-semibold truncate">
                      {friend.displayName || "Unknown User"}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-secondary text-[16px]" style={{ fontVariationSettings: 'FILL 1' }}>stars</span>
                      <span className="font-body-sm text-secondary font-bold">{friend.xp} XP</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 font-body-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-secondary text-[16px]" style={{ fontVariationSettings: 'FILL 1' }}>local_fire_department</span>
                    <span>{friend.streakCount} day streak</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/profile/${friend.id}`}
                      className="font-label-sm font-bold text-primary hover:underline"
                    >
                      View
                    </Link>
                    <form action={async () => {
                      "use server";
                      await removeFriend(friend.id);
                    }}>
                      <button className="font-label-sm font-medium text-error hover:text-error/80 transition-colors">
                        Remove
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
