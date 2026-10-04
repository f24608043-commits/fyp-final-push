import { getTutors, getMySessions, getPendingRequests } from "./actions";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { tutorEnrollments, profiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import Mascot from "@/components/Mascot";
import dynamic from "next/dynamic";
import BookSessionButton from "./BookSessionButton";
import MessageButton from "./MessageButton";
import EnrollButton from "./EnrollButton";

// Lazy load messaging widget
const MessagingWidget = dynamic(() => import("@/components/MessagingWidget"), {
  loading: () => null,
});

export default async function TutoringPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch user profile to check role
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  // Role-based routing
  if (profile?.role === "tutor") {
    // Tutors should see their classes/dashboard
    redirect("/tutoring/classes");
  }

  // Learners see the tutor directory (current view)
  let tutors: any[] = [];
  let mySessions: any[] = [];
  let pendingRequests: any[] = [];
  let myEnrollments: any[] = [];

  try {
    const results = await Promise.all([
      getTutors(),
      getMySessions(),
      getPendingRequests(),
      // Fetch learner's enrollments
      db
        .select({
          tutorId: tutorEnrollments.tutorId,
          status: tutorEnrollments.status,
        })
        .from(tutorEnrollments)
        .where(eq(tutorEnrollments.learnerId, user.id)),
    ]);
    tutors = results[0] || [];
    mySessions = results[1] || [];
    pendingRequests = results[2] || [];
    myEnrollments = results[3] || [];
  } catch (error) {
    console.error("Error fetching tutoring data:", error);
    // Continue with empty arrays if fetch fails
  }

  // Create a map of tutorId -> enrollment status
  const enrollmentStatusMap = new Map(
    myEnrollments.map((e) => [e.tutorId, e.status])
  );

  return (
    <div className="w-full px-8 py-8 bg-gradient-to-br from-background via-tertiary/10 to-tertiary/10 min-h-screen">
      {/* Header with Mascot - Stitch Frame Style */}
      <div className="relative w-full bg-tertiary rounded-3xl p-1 shadow-clay-surface overflow-hidden mb-8">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-surface/40 pointer-events-none"></div>
        <div className="relative bg-surface/95 backdrop-blur-sm rounded-[24px] p-8 md:p-10">
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left: Header info */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-4 py-1 rounded-full bg-tertiary text-text-primary font-label-sm text-label-sm tracking-wider uppercase font-bold shadow-clay-surface border-2 border-surface/30">👨‍🏫 Tutoring</span>
              <span className="text-text-muted text-label-sm">•</span>
              <span className="px-4 py-1 rounded-full bg-gradient-to-r from-tertiary to-primary text-text-primary font-label-sm text-label-sm font-bold shadow-clay-surface border-2 border-surface/30">Expert Help</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-text-primary tracking-tight leading-none">
              Tutoring Hub 🎓
            </h1>
            <p className="font-body-lg text-body-lg text-text-muted leading-relaxed">
              Connect with expert tutors for personalized learning sessions
            </p>
          </div>

          {/* Right: Mascot */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-4 shrink-0">
            <div className="relative max-w-xs bg-tertiary/10 p-4 rounded-[24px] shadow-clay-surface border-4 border-surface/50 order-2 sm:order-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-tertiary text-[18px]" style={{ fontVariationSettings: 'FILL 1' }}>school</span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-tertiary font-bold">Learn Together</span>
              </div>
              <p className="font-headline-md text-label-md text-text-primary font-bold leading-snug">
                "Get personalized help from expert tutors to accelerate your learning!"
              </p>
            </div>
            <div className="relative w-28 h-28 md:w-32 md:h-32 shrink-0 order-1 sm:order-2">
              <Mascot pose="encouraging" size={128} />
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Pending Requests (for tutors) */}
      {pendingRequests.length > 0 && (
        <div className="mb-8 rounded-[24px] bg-secondary/10 p-8 shadow-clay-surface border-4 border-secondary/30">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-text-primary text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>notifications</span>
            <h2 className="font-headline-lg text-headline-lg text-text-primary font-extrabold">
              Pending Session Requests ({pendingRequests.length})
            </h2>
          </div>
          <div className="space-y-4">
            {pendingRequests.map((request: any) => (
              <div key={request.id} className="rounded-[24px] bg-surface p-6 shadow-clay-surface border-4 border-secondary/30">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-text-primary font-bold text-lg shadow-clay-surface border-4 border-surface/30">
                    {request.learner.displayName?.[0] || "?"}
                  </div>
                  <div>
                    <p className="font-label-md text-text-primary font-semibold">
                      {request.learner.displayName || "Unknown"}
                    </p>
                    <p className="font-body-sm text-text-muted">
                      Requested {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {request.message && (
                  <p className="font-body-sm text-text-muted mb-3 italic">
                    "{request.message}"
                  </p>
                )}
                <div className="flex gap-2">
                  <form action={async () => {
                    "use server";
                    const { acceptSessionRequest } = await import("./actions");
                    await acceptSessionRequest(request.id, 0);
                  }}>
                    <button className="rounded-full bg-gradient-to-r from-success to-primary text-text-primary px-4 py-2 font-label-md font-bold shadow-clay-surface border-4 border-surface/30 transform hover:scale-105 transition-all active:scale-95">
                      Accept
                    </button>
                  </form>
                  <form action={async () => {
                    "use server";
                    const { declineSessionRequest } = await import("./actions");
                    await declineSessionRequest(request.id);
                  }}>
                    <button className="rounded-xl border-4 border-surface-border bg-surface text-text-muted px-4 py-2 font-label-md font-semibold hover:from-surface hover:to-surface-border transition-all shadow-clay-surface">
                      Decline
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Sessions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">event</span>
            <h2 className="font-headline-lg text-headline-lg text-text-primary font-extrabold">My Sessions</h2>
          </div>
          <Link
            href="/tutoring/my-enrollments"
            className="inline-flex items-center gap-2 font-label-sm font-semibold text-primary hover:underline"
          >
            <span className="material-symbols-outlined text-[18px]">folder</span>
            My Enrollments
          </Link>
        </div>
        {mySessions.length === 0 ? (
          <div className="rounded-[24px] bg-surface p-10 text-center shadow-clay-surface border-4 border-surface/50">
            <div className="relative w-20 h-20 rounded-xl bg-surface-border flex items-center justify-center overflow-hidden shadow-clay-surface mx-auto mb-4 border-4 border-surface/30">
              <Mascot pose="empty" size={64} />
            </div>
            <p className="font-body-md text-text-muted font-bold">No sessions yet. Find a tutor to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {mySessions.map((session: any) => {
              const otherUserId = session.tutorId === user.id ? session.learnerId : session.tutorId;
              const otherUserName = session.tutorId === user.id ? "Learner" : "Tutor";
              
              return (
                <div key={session.id} className="rounded-[24px] bg-gradient-to-br from-surface to-tertiary/10 p-6 shadow-clay-surface border-4 border-tertiary/30">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-label-md text-text-primary font-semibold">
                        {new Date(session.scheduledAt).toLocaleString()}
                      </p>
                      <p className="font-body-sm text-text-muted mt-1">
                        Duration: {session.durationMins} minutes
                      </p>
                      <span className={`inline-block mt-2 rounded-full px-3 py-1 font-label-sm font-semibold border-2 ${
                        session.status === "confirmed" ? "bg-gradient-to-r from-success to-primary text-text-primary border-surface/30" :
                        session.status === "completed" ? "bg-tertiary text-text-primary border-surface/30" :
                        session.status === "cancelled" ? "bg-error text-text-primary border-surface/30" :
                        "bg-surface-border text-text-muted border-surface-border"
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {session.status === "confirmed" && session.jitsiRoomId && (
                        <a
                          href={`https://meet.jit.si/${session.jitsiRoomId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-tertiary text-text-primary px-4 py-2 font-label-md font-bold shadow-clay-surface border-4 border-surface/30 transform hover:scale-105 transition-all active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[20px]">videocam</span>
                          Join Session
                        </a>
                      )}
                      <MessagingWidget
                        otherUserId={otherUserId}
                        otherUserName={otherUserName}
                        sessionId={session.id}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tutor Directory */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-primary text-[24px]">people</span>
          <h2 className="font-headline-lg text-headline-lg text-text-primary font-extrabold">Find a Tutor</h2>
        </div>
        {tutors.length === 0 ? (
          <div className="rounded-[24px] bg-surface p-10 text-center shadow-clay-surface border-4 border-surface/50">
            <div className="relative w-20 h-20 rounded-xl bg-surface-border flex items-center justify-center overflow-hidden shadow-clay-surface mx-auto mb-4 border-4 border-surface/30">
              <Mascot pose="empty" size={64} />
            </div>
            <p className="font-body-md text-text-muted font-bold">No tutors available yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tutors.map((tutor: any) => (
              <div key={tutor.id} className="rounded-[24px] bg-gradient-to-br from-surface to-tertiary/10 p-6 shadow-clay-surface border-4 border-tertiary/30 hover:shadow-clay-surface hover:border-tertiary/30 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-tertiary text-text-primary font-bold text-xl shadow-clay-surface border-4 border-surface/30">
                    {tutor.displayName?.[0] || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-label-md text-text-primary font-semibold truncate">
                      {tutor.displayName || "Unknown"}
                    </p>
                    <div className="flex items-center gap-1 font-body-sm text-text-muted">
                      <span className="material-symbols-outlined text-secondary text-[16px]" style={{ fontVariationSettings: 'FILL 1' }}>star</span>
                      <span className="font-bold text-secondary">{tutor.rating}/5</span>
                      <span className="font-bold text-text-muted">({tutor.totalSessions} sessions)</span>
                    </div>
                  </div>
                </div>
                <p className="font-body-md text-text-muted mb-4 line-clamp-2">
                  {tutor.bio || "No bio available"}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {tutor.subjects?.map((subject: string, idx: number) => (
                    <span key={idx} className="rounded-full bg-gradient-to-r from-tertiary to-primary text-text-primary px-2 py-1 font-label-sm font-semibold shadow-clay-surface border-2 border-surface/30">
                      {subject}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-end">
                  <div className="flex gap-2">
                    <MessageButton tutorId={tutor.tutorId} />
                    <EnrollButton
                      tutorId={tutor.tutorId}
                      initialStatus={enrollmentStatusMap.get(tutor.tutorId) || null}
                    />
                    <BookSessionButton tutorId={tutor.tutorId} />
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
