import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import {
  tutorProfiles,
  profiles,
  tutorAvailability,
  tutorEnrollments,
  tutorSessions,
  learnerStats,
  userBadges,
  badges,
} from "@/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";
import EnrollButton from "../EnrollButton";

export default async function PublicTutorProfilePage({
  params,
}: {
  params: Promise<{ tutorId: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { tutorId } = await params;

  // Get tutor profile
  const [tutorProfile] = await db
    .select({
      tutorId: tutorProfiles.tutorId,
      bio: tutorProfiles.bio,
      subjects: tutorProfiles.subjects,
      hourlyRate: tutorProfiles.hourlyRate,
      timezone: tutorProfiles.timezone,
      isActive: tutorProfiles.isActive,
      rating: tutorProfiles.rating,
      totalSessions: tutorProfiles.totalSessions,
      rankLevel: tutorProfiles.rankLevel,
      rankPoints: tutorProfiles.rankPoints,
      totalLearners: tutorProfiles.totalLearners,
      activeLearners: tutorProfiles.activeLearners,
      badgesAwardedCount: tutorProfiles.badgesAwardedCount,
      experienceYears: tutorProfiles.experienceYears,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
    })
    .from(tutorProfiles)
    .innerJoin(profiles, eq(tutorProfiles.tutorId, profiles.id))
    .where(eq(tutorProfiles.tutorId, tutorId))
    .limit(1);

  if (!tutorProfile || !tutorProfile.isActive) {
    redirect("/tutoring");
  }

  // Get tutor's availability
  const availability = await db
    .select()
    .from(tutorAvailability)
    .where(and(eq(tutorAvailability.tutorId, tutorId), eq(tutorAvailability.isActive, true)))
    .orderBy(tutorAvailability.dayOfWeek);

  // Get tutor's badges awarded count
  const awardedBadges = await db
    .select()
    .from(userBadges)
    .where(eq(userBadges.awardedByTutorId, tutorId))
    .limit(1);

  // Check if current user is enrolled with this tutor
  let enrollmentStatus: "pending" | "accepted" | "rejected" | "removed" | null = null;
  if (user) {
    const [enrollment] = await db
      .select({ status: tutorEnrollments.status })
      .from(tutorEnrollments)
      .where(
        and(
          eq(tutorEnrollments.tutorId, tutorId),
          eq(tutorEnrollments.learnerId, user.id)
        )
      )
      .limit(1);
    enrollmentStatus = enrollment?.status || null;
  }

  return (
    <div className="w-full px-8 py-8 bg-gradient-to-br from-emerald-50 via-violet-50 to-sky-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/tutoring"
          className="inline-flex items-center gap-2 font-label-lg text-label-lg text-slate-600 hover:text-emerald-600 transition-colors group mb-4"
        >
          <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-1">arrow_back</span>
          <span>Back to Tutors</span>
        </Link>
      </div>

      {/* Profile Header */}
      <div className="rounded-2xl bg-white p-8 shadow-clay-surface border border-slate-200 mb-8">
        <div className="flex flex-col md:flex-row gap-6">
          <UserAvatar
            avatarUrl={tutorProfile.avatarUrl}
            displayName={tutorProfile.displayName}
            size="lg"
          />
          <div className="flex-1">
            <h1 className="font-headline-2xl text-headline-2xl text-slate-900 font-extrabold mb-2">
              {tutorProfile.displayName}
            </h1>
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-700 font-label-md font-semibold shadow-clay-secondary">
                <span className="material-symbols-outlined text-[18px]">star</span>
                {tutorProfile.rating || "N/A"}
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 font-label-md font-semibold shadow-clay-secondary">
                <span className="material-symbols-outlined text-[18px]">school</span>
                Level {tutorProfile.rankLevel}
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 font-label-md font-semibold shadow-clay-secondary">
                <span className="material-symbols-outlined text-[18px]">people</span>
                {tutorProfile.activeLearners} active learners
              </div>
            </div>
            <p className="font-body-lg text-slate-600 mb-4">{tutorProfile.bio}</p>
            <div className="flex flex-wrap gap-3 mb-4">
              {tutorProfile.subjects?.map((subject) => (
                <span
                  key={subject}
                  className="px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-label-sm font-semibold shadow-clay-primary border-2 border-white/30"
                >
                  {subject}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 text-base text-slate-600">
              <span>🕐 {tutorProfile.timezone}</span>
              <span>📚 {tutorProfile.totalSessions} sessions</span>
              <span>🎓 {tutorProfile.experienceYears} years experience</span>
              {tutorProfile.hourlyRate && (
                <span>💰 ${tutorProfile.hourlyRate}/hour</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {user && user.id !== tutorId && (
          <div className="flex flex-wrap gap-4 mt-8 pt-8 border-t-2 border-slate-200">
            <EnrollButton tutorId={tutorId} initialStatus={enrollmentStatus} />
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-2xl bg-white p-6 shadow-clay-surface border border-slate-200 text-center">
          <div className="text-4xl font-headline-xl text-slate-900 font-extrabold mb-2">
            {tutorProfile.totalLearners}
          </div>
          <div className="font-label-md text-slate-600">Total Learners</div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-clay-surface border border-slate-200 text-center">
          <div className="text-4xl font-headline-xl text-slate-900 font-extrabold mb-2">
            {tutorProfile.totalSessions}
          </div>
          <div className="font-label-md text-slate-600">Sessions Completed</div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-clay-surface border border-slate-200 text-center">
          <div className="text-4xl font-headline-xl text-slate-900 font-extrabold mb-2">
            {tutorProfile.badgesAwardedCount}
          </div>
          <div className="font-label-md text-slate-600">Badges Awarded</div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-clay-surface border border-slate-200 text-center">
          <div className="text-4xl font-headline-xl text-slate-900 font-extrabold mb-2">
            {tutorProfile.rankPoints}
          </div>
          <div className="font-label-md text-slate-600">Rank Points</div>
        </div>
      </div>

      {/* Availability */}
      {availability.length > 0 && (
        <div className="rounded-2xl bg-white p-8 shadow-clay-surface border border-slate-200 mb-8">
          <h2 className="font-headline-lg text-headline-lg text-slate-900 font-extrabold mb-6">
            Availability
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {availability.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center gap-4 p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 shadow-clay-secondary"
              >
                <span className="material-symbols-outlined text-emerald-600">schedule</span>
                <div>
                  <div className="font-label-lg text-slate-900 font-semibold">
                    {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][slot.dayOfWeek]}
                  </div>
                  <div className="font-body-sm text-slate-600">
                    {slot.startTime} - {slot.endTime}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
