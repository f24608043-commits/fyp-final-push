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
    <div className="w-full px-6 py-6 bg-gradient-to-br from-background via-tertiary/10 to-tertiary/10 min-h-screen">
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
          <span className="material-symbols-outlined text-success text-[24px]">check_circle</span>
          <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold">
            Active Enrollments ({enrolled.length})
          </h2>
        </div>
        {enrolled.length === 0 ? (
          <div className="rounded-[24px] bg-surface p-8 text-center shadow-clay-surface border-4 border-surface/50">
            <p className="font-body-md text-text-muted font-bold">No active enrollments yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {enrolled.map((enrollment) => (
              <div
                key={enrollment.id}
                className="rounded-[24px] bg-gradient-to-br from-surface to-primary/10 p-5 shadow-clay-surface border-4 border-primary/30"
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
                            className="rounded-full bg-gradient-to-r from-tertiary to-primary text-text-primary px-2 py-1 font-label-sm font-semibold shadow-clay-surface border-2 border-surface/30"
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
                      className="rounded-xl border-2 border-tertiary bg-tertiary/10 text-tertiary px-3 py-2 font-label-sm font-bold shadow-clay-surface hover:from-tertiary/10 hover:to-tertiary/10 transition-all flex items-center gap-2"
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
          <span className="material-symbols-outlined text-secondary text-[24px]">pending</span>
          <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold">
            Pending Requests ({pending.length})
          </h2>
        </div>
        {pending.length === 0 ? (
          <div className="rounded-[24px] bg-surface p-8 text-center shadow-clay-surface border-4 border-surface/50">
            <p className="font-body-md text-text-muted font-bold">No pending requests.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((enrollment) => (
              <div
                key={enrollment.id}
                className="rounded-[24px] bg-gradient-to-br from-surface to-secondary/10 p-5 shadow-clay-surface border-4 border-secondary/30"
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
                        className="rounded-xl border-2 border-surface-border bg-surface text-text-muted px-3 py-2 font-label-sm font-semibold shadow-clay-surface hover:from-surface hover:to-surface transition-all"
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
            <span className="material-symbols-outlined text-error text-[24px]">cancel</span>
            <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold">
              Rejected Requests ({rejected.length})
            </h2>
          </div>
          <div className="space-y-3">
            {rejected.map((enrollment) => (
              <div
                key={enrollment.id}
                className="rounded-[24px] bg-gradient-to-br from-surface to-error/10 p-5 shadow-clay-surface border-4 border-error/30 opacity-75"
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
