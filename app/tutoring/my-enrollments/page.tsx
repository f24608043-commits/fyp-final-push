import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import {
  tutorEnrollments,
  profiles,
  tutorProfiles,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";
import EnrollmentStatusBadge from "@/components/EnrollmentStatusBadge";

export default async function MyEnrollmentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch learner's enrollments with tutor info
  const enrollments = await db
    .select({
      id: tutorEnrollments.id,
      status: tutorEnrollments.status,
      message: tutorEnrollments.message,
      createdAt: tutorEnrollments.createdAt,
      tutorId: tutorEnrollments.tutorId,
      tutor: {
        id: profiles.id,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
      },
      tutorProfile: {
        bio: tutorProfiles.bio,
        subjects: tutorProfiles.subjects,
        rating: tutorProfiles.rating,
        hourlyRate: tutorProfiles.hourlyRate,
      },
    })
    .from(tutorEnrollments)
    .innerJoin(profiles, eq(tutorEnrollments.tutorId, profiles.id))
    .leftJoin(tutorProfiles, eq(tutorEnrollments.tutorId, tutorProfiles.tutorId))
    .where(eq(tutorEnrollments.learnerId, user.id));

  const pending = enrollments.filter((e) => e.status === "pending");
  const enrolled = enrollments.filter((e) => e.status === "accepted");
  const rejected = enrollments.filter((e) => e.status === "rejected");

  return (
    <div className="w-full px-6 py-6 bg-gradient-to-br from-background via-blue-50 to-cyan-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/tutoring"
          className="inline-flex items-center gap-2 font-label-md text-label-md text-text-muted hover:text-primary transition-colors group mb-4"
        >
          <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-1">arrow_back</span>
          <span>Back to Tutoring</span>
        </Link>
        <h1 className="font-headline-xl text-headline-xl text-text-primary tracking-tight">
          My Enrollments
        </h1>
        <p className="font-body-lg text-body-lg text-text-muted">
          Manage your tutor enrollments and track your learning journey
        </p>
      </div>

      {/* Active Enrollments */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-green-600 text-[24px]">check_circle</span>
          <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold">
            Active Enrollments ({enrolled.length})
          </h2>
        </div>
        {enrolled.length === 0 ? (
          <div className="rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 p-8 text-center shadow-xl border-4 border-white/50">
            <p className="font-body-md text-text-muted font-bold">No active enrollments yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {enrolled.map((enrollment) => (
              <div
                key={enrollment.id}
                className="rounded-2xl bg-gradient-to-br from-white to-green-50 p-5 shadow-xl border-4 border-green-100"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <UserAvatar
                      avatarUrl={enrollment.tutor.avatarUrl}
                      displayName={enrollment.tutor.displayName}
                      size="lg"
                    />
                    <div>
                      <h3 className="font-label-lg text-text-primary font-semibold">
                        {enrollment.tutor.displayName || "Unknown Tutor"}
                      </h3>
                      <p className="font-body-sm text-text-muted mt-1 line-clamp-2">
                        {enrollment.tutorProfile?.bio || "No bio available"}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {enrollment.tutorProfile?.subjects?.map((subject: string, idx: number) => (
                          <span
                            key={idx}
                            className="rounded-full bg-gradient-to-r from-teal-400 to-green-500 text-white px-2 py-1 font-label-sm font-semibold shadow-lg border-2 border-white/30"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                      <p className="font-body-sm text-text-muted mt-2">
                        Enrolled on {new Date(enrollment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <EnrollmentStatusBadge status={enrollment.status as any} />
                    <Link
                      href={`/messages?userId=${enrollment.tutorId}`}
                      className="rounded-xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600 px-3 py-2 font-label-sm font-bold shadow-lg hover:from-blue-100 hover:to-cyan-100 transition-all flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                      Message
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Requests */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-yellow-600 text-[24px]">pending</span>
          <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold">
            Pending Requests ({pending.length})
          </h2>
        </div>
        {pending.length === 0 ? (
          <div className="rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 p-8 text-center shadow-xl border-4 border-white/50">
            <p className="font-body-md text-text-muted font-bold">No pending requests.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((enrollment) => (
              <div
                key={enrollment.id}
                className="rounded-2xl bg-gradient-to-br from-white to-yellow-50 p-5 shadow-xl border-4 border-yellow-100"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <UserAvatar
                      avatarUrl={enrollment.tutor.avatarUrl}
                      displayName={enrollment.tutor.displayName}
                      size="lg"
                    />
                    <div>
                      <h3 className="font-label-lg text-text-primary font-semibold">
                        {enrollment.tutor.displayName || "Unknown Tutor"}
                      </h3>
                      <p className="font-body-sm text-text-muted mt-1 line-clamp-2">
                        {enrollment.tutorProfile?.bio || "No bio available"}
                      </p>
                      {enrollment.message && (
                        <p className="font-body-sm text-text-muted mt-2 italic">
                          "{enrollment.message}"
                        </p>
                      )}
                      <p className="font-body-sm text-text-muted mt-2">
                        Requested on {new Date(enrollment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <EnrollmentStatusBadge status={enrollment.status as any} />
                    <form
                      action={async () => {
                        "use server";
                        const response = await fetch(
                          `${process.env.NEXT_PUBLIC_APP_URL}/api/enrollments/${enrollment.id}/cancel`,
                          { method: "POST" }
                        );
                        if (response.ok) {
                          redirect("/tutoring/my-enrollments");
                        }
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-xl border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600 px-3 py-2 font-label-sm font-semibold shadow-lg hover:from-gray-100 hover:to-gray-200 transition-all"
                      >
                        Cancel Request
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejected Requests */}
      {rejected.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-red-600 text-[24px]">cancel</span>
            <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold">
              Rejected Requests ({rejected.length})
            </h2>
          </div>
          <div className="space-y-3">
            {rejected.map((enrollment) => (
              <div
                key={enrollment.id}
                className="rounded-2xl bg-gradient-to-br from-white to-red-50 p-5 shadow-xl border-4 border-red-100 opacity-75"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <UserAvatar
                      avatarUrl={enrollment.tutor.avatarUrl}
                      displayName={enrollment.tutor.displayName}
                      size="lg"
                    />
                    <div>
                      <h3 className="font-label-lg text-text-primary font-semibold">
                        {enrollment.tutor.displayName || "Unknown Tutor"}
                      </h3>
                      <p className="font-body-sm text-text-muted mt-1">
                        Rejected on {new Date(enrollment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <EnrollmentStatusBadge status={enrollment.status as any} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
