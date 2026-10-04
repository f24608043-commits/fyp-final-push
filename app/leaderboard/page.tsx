import { getGlobalLeaderboard, getStreakLeaderboard, getUserRank } from "./actions";
import { createClient } from "@/utils/supabase/server";
import Mascot from "@/components/Mascot";
import Link from "next/link";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const [globalLeaderboard, streakLeaderboard, userRank] = await Promise.all([
    getGlobalLeaderboard(50),
    getStreakLeaderboard(50),
    user ? getUserRank(user.id) : Promise.resolve(null)
  ]);

  return (
    <div className="w-full px-6 py-6">
      {/* Header with Mascot */}
      <div className="relative w-full rounded-3xl bg-surface p-6 md:p-8 shadow-clay-surface overflow-hidden mb-6">
        {/* Decorative background gradients */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-primary/25 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-tertiary/30 blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left: Header info */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 rounded-lg bg-surface-border text-text-muted font-label-sm text-label-sm tracking-wider uppercase">Competition</span>
              <span className="text-text-muted text-label-sm">•</span>
              <span className="px-3 py-0.5 rounded-lg bg-success/20 text-primary font-label-sm text-label-sm">Global Rankings</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-text-primary tracking-tight leading-none">
              Leaderboards
            </h1>
            <p className="font-body-lg text-body-lg text-text-muted leading-relaxed">
              Compete with learners worldwide and climb the ranks
            </p>
          </div>

          {/* Right: Mascot */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-4 shrink-0">
            <div className="relative max-w-xs bg-surface p-4 rounded-[24px] shadow-clay-surface border-b-4 border-surface-border order-2 sm:order-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-secondary text-[18px]" style={{ fontVariationSettings: 'FILL 1' }}>emoji_events</span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Climb the Ranks</span>
              </div>
              <p className="font-headline-md text-label-md text-text-primary font-bold leading-snug">
                "Every lesson brings you closer to the top. Keep going!"
              </p>
            </div>
            <div className="relative w-28 h-28 md:w-32 md:h-32 shrink-0 order-1 sm:order-2">
              <Mascot pose="celebrate" size={128} />
            </div>
          </div>
        </div>
      </div>
      
      {/* User's Rank */}
      {userRank && (
        <div className="bg-success text-text-primary p-6 rounded-[24px] mb-6 shadow-clay-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-label-sm text-text-primary">Your Global Rank</p>
              <p className="font-headline-xl text-headline-xl font-extrabold">#{userRank.rank}</p>
            </div>
            <div className="text-right">
              <p className="font-label-sm text-text-primary">Total XP</p>
              <p className="font-headline-xl text-headline-xl font-extrabold">{userRank.xp}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6 border-b border-surface-border">
        <button className="px-4 py-2 border-b-2 border-primary text-primary font-label-md font-bold">
          Global XP
        </button>
        <button className="px-4 py-2 text-text-muted hover:text-primary transition-colors font-label-md font-semibold">
          Streaks
        </button>
        <button className="px-4 py-2 text-text-muted hover:text-primary transition-colors font-label-md font-semibold">
          Units
        </button>
      </div>

      {/* Global XP Leaderboard */}
      <div className="rounded-[24px] bg-surface shadow-clay-surface mb-6">
        <div className="p-4 border-b border-surface-border">
          <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold">Global XP Leaderboard</h2>
          <p className="font-body-sm text-text-muted">Top learners by total XP</p>
        </div>
        
        <div className="divide-y divide-surface-border">
          {globalLeaderboard.map((learner: any, index: number) => (
            <div 
              key={learner.id} 
              className={`p-4 flex items-center gap-4 ${
                user?.id === learner.id ? 'bg-success/20' : ''
              }`}
            >
              <div className="w-8 text-center font-headline-md text-text-muted font-bold">
                {index + 1}
              </div>
              
              <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center text-text-primary font-bold">
                {learner.displayName?.[0] || "?"}
              </div>
              
              <div className="flex-1 min-w-0">
                <Link
                  href={`/profile/${learner.id}`}
                  className="font-label-md text-text-primary font-semibold truncate hover:text-primary transition-colors"
                >
                  {learner.displayName || "Anonymous"}
                </Link>
                <div className="flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-secondary text-[16px]" style={{ fontVariationSettings: 'FILL 1' }}>local_fire_department</span>
                  <span className="font-body-sm text-text-muted">{learner.streakCount} day streak</span>
                </div>
              </div>
              
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-secondary text-[16px]" style={{ fontVariationSettings: 'FILL 1' }}>stars</span>
                  <p className="font-headline-md text-secondary font-extrabold">{learner.xp} XP</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Streak Leaderboard */}
      <div className="rounded-[24px] bg-surface shadow-clay-surface">
        <div className="p-4 border-b border-surface-border">
          <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold">Streak Leaderboard</h2>
          <p className="font-body-sm text-text-muted">Top learners by consecutive days</p>
        </div>
        
        <div className="divide-y divide-surface-border">
          {streakLeaderboard.map((learner: any, index: number) => (
            <div 
              key={learner.id} 
              className={`p-4 flex items-center gap-4 ${
                user?.id === learner.id ? 'bg-success/20' : ''
              }`}
            >
              <div className="w-8 text-center font-headline-md text-text-muted font-bold">
                {index + 1}
              </div>
              
              <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center text-text-primary font-bold">
                {learner.displayName?.[0] || "?"}
              </div>
              
              <div className="flex-1 min-w-0">
                <Link
                  href={`/profile/${learner.id}`}
                  className="font-label-md text-text-primary font-semibold truncate hover:text-primary transition-colors"
                >
                  {learner.displayName || "Anonymous"}
                </Link>
                <div className="flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-secondary text-[16px]" style={{ fontVariationSettings: 'FILL 1' }}>stars</span>
                  <span className="font-body-sm text-text-muted">{learner.xp} total XP</span>
                </div>
              </div>
              
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-secondary text-[16px]" style={{ fontVariationSettings: 'FILL 1' }}>local_fire_department</span>
                  <p className="font-headline-md text-secondary font-extrabold">{learner.streakCount} days</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
