import { getMySessions, getTutorProfile, getTutorAvailability, getPendingRequests } from "../actions";
import { getPendingEnrollments, getAcceptedLearners } from "../enrollment-actions";
import { getEnrolledLearnersForGroup } from "@/app/messaging/actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Mascot from "@/components/Mascot";
import dynamic from "next/dynamic";
import AcceptButton from "./AcceptButton";
import DeclineButton from "./DeclineButton";
import CreateProfileButton from "./CreateProfileButton";
import EditAvailabilityButton from "./EditAvailabilityButton";

// Server action for accepting session request
async function acceptRequest(requestId: string) {
  "use server";
  try {
    const { acceptSessionRequest } = await import("../actions");
    await acceptSessionRequest(requestId, 0);
  } catch (error) {
    console.error("Accept request error:", error);
    throw error;
  }
}

// Server action for declining session request
async function declineRequest(requestId: string) {
  "use server";
  try {
    const { declineSessionRequest } = await import("../actions");
    await declineSessionRequest(requestId);
  } catch (error) {
    console.error("Decline request error:", error);
    throw error;
  }
}

// Server action for accepting enrollment request
async function acceptEnrollment(enrollmentId: string) {
  "use server";
  try {
    const { acceptTutorEnrollment } = await import("../enrollment-actions");
    await acceptTutorEnrollment(enrollmentId);
  } catch (error) {
    console.error("Accept enrollment error:", error);
    throw error;
  }
}

// Server action for rejecting enrollment request
async function rejectEnrollment(enrollmentId: string) {
  "use server";
  try {
    const { rejectTutorEnrollment } = await import("../enrollment-actions");
    await rejectTutorEnrollment(enrollmentId);
  } catch (error) {
    console.error("Reject enrollment error:", error);
    throw error;
  }
}

// Server action for creating group conversation
async function createGroup(formData: FormData) {
  "use server";
  try {
    const { createGroupConversation } = await import("@/app/messaging/actions");
    const name = formData.get("groupName") as string;
    const selectedLearners = formData.getAll("learners") as string[];
    await createGroupConversation(selectedLearners, name);
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Create group error:", error);
    throw error;
  }
}


// Lazy load messaging widget
const MessagingWidget = dynamic(() => import("@/components/MessagingWidget"), {
  loading: () => null,
});

export default async function TutorDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const [tutorProfile, mySessions, availability, pendingRequests, pendingEnrollments, acceptedLearners, enrolledLearnersForGroup] = await Promise.all([
    getTutorProfile(user.id),
    getMySessions(),
    getTutorAvailability(user.id),
    getPendingRequests(),
    getPendingEnrollments(),
    getAcceptedLearners(),
    getEnrolledLearnersForGroup().catch(() => []) // Fallback if not tutor
  ]);

  // Separate upcoming and past sessions
  const now = new Date();
  const upcomingSessions = mySessions.filter((s: any) => new Date(s.scheduledAt) > now);
  const pastSessions = mySessions.filter((s: any) => new Date(s.scheduledAt) <= now);

  return (
    <div className="w-full px-8 py-8 bg-gradient-to-br from-surface via-secondary/10 to-tertiary/10 min-h-screen">
      {/* Header Banner with Statistics Cards */}
      <div className="relative w-full bg-gradient-to-br from-secondary via-secondary to-tertiary rounded-3xl p-1 shadow-clay-surface overflow-hidden mb-8">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-surface/40 pointer-events-none"></div>
        <div className="relative bg-surface/95 backdrop-blur-sm rounded-[24px] p-8 md:p-10">
        
        <div className="relative z-10 flex flex-col gap-6">
          {/* Welcome Section */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-4 py-1 rounded-full bg-secondary text-text-primary font-label-sm text-label-sm tracking-wider uppercase font-bold shadow-clay-surface border-2 border-surface/30">👨‍🏫 Tutor Portal</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-text-primary tracking-tight leading-none">
                Welcome back, {tutorProfile?.displayName || "Tutor"}! 👋
              </h1>
              <p className="font-body-lg text-body-lg text-text-muted leading-relaxed">
                Here's your teaching overview for today
              </p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Students */}
            <div className="rounded-[24px] bg-secondary/10 p-6 shadow-clay-surface border border-secondary/30 hover:scale-[1.02] transition-transform duration-150">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-secondary text-text-primary flex items-center justify-center shadow-clay-surface">
                  <span className="material-symbols-outlined text-[20px]">people</span>
                </div>
                <span className="font-label-sm text-secondary font-bold uppercase tracking-wider">Students</span>
              </div>
              <p className="font-headline-2xl text-headline-2xl text-secondary font-extrabold">
                {acceptedLearners?.length || 0}
              </p>
            </div>

            {/* Active Groups */}
            <div className="rounded-[24px] bg-tertiary/10 p-6 shadow-clay-surface border border-tertiary/30 hover:scale-[1.02] transition-transform duration-150">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-tertiary text-text-primary flex items-center justify-center shadow-clay-surface">
                  <span className="material-symbols-outlined text-[20px]">groups</span>
                </div>
                <span className="font-label-sm text-tertiary font-bold uppercase tracking-wider">Groups</span>
              </div>
              <p className="font-headline-2xl text-headline-2xl text-tertiary font-extrabold">
                {enrolledLearnersForGroup?.length || 0}
              </p>
            </div>

            {/* Pending Assignments */}
            <div className="rounded-[24px] bg-gradient-to-br from-error/10 to-tertiary/10 p-6 shadow-clay-surface border border-error/30 hover:scale-[1.02] transition-transform duration-150">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-error text-text-primary flex items-center justify-center shadow-clay-surface">
                  <span className="material-symbols-outlined text-[20px]">assignment</span>
                </div>
                <span className="font-label-sm text-error font-bold uppercase tracking-wider">Requests</span>
              </div>
              <p className="font-headline-2xl text-headline-2xl text-error font-extrabold">
                {pendingRequests?.length || 0}
              </p>
            </div>

            {/* Upcoming Sessions */}
            <div className="rounded-[24px] bg-gradient-to-br from-primary/10 to-tertiary/10 p-6 shadow-clay-surface border border-primary/30 hover:scale-[1.02] transition-transform duration-150">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary text-text-primary flex items-center justify-center shadow-clay-surface">
                  <span className="material-symbols-outlined text-[20px]">event</span>
                </div>
                <span className="font-label-sm text-success font-bold uppercase tracking-wider">Sessions</span>
              </div>
              <p className="font-headline-2xl text-headline-2xl text-success font-extrabold">
                {upcomingSessions?.length || 0}
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Tutor Profile Status */}
      {!tutorProfile ? (
        <div className="mb-8 rounded-[24px] bg-secondary/10 p-8 shadow-clay-surface border border-secondary/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-secondary text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>school</span>
            <h2 className="font-headline-lg text-headline-lg text-secondary font-extrabold">Set Up Your Tutor Profile</h2>
          </div>
          <p className="font-body-md text-secondary mb-4">Complete your profile to start accepting students.</p>
          <form action={async (formData: FormData) => {
            "use server";
            const { createTutorProfile } = await import("../actions");
            const bio = formData.get("bio") as string;
            const subjects = formData.get("subjects") as string;
            const hourlyRate = formData.get("hourlyRate") ? parseInt(formData.get("hourlyRate") as string) : null;
            const timezone = formData.get("timezone") as string;
            
            await createTutorProfile({
              bio,
              subjects: subjects ? subjects.split(",").map(s => s.trim()) : [],
              hourlyRate,
              timezone: timezone || "UTC"
            });
          }}>
            <div className="space-y-5 mb-6">
              <div>
                <label className="block font-label-sm font-semibold mb-1 text-secondary">Bio</label>
                <textarea 
                  name="bio" 
                  required
                  className="w-full rounded-xl border-2 border-secondary/30 p-4 focus:border-secondary focus:outline-none text-base shadow-clay-surface-pressed bg-surface"
                  placeholder="Describe your teaching experience..."
                  rows={4}
                />
              </div>
              <div>
                <label className="block font-label-sm font-semibold mb-1 text-secondary">Subjects (comma-separated)</label>
                <input 
                  type="text" 
                  name="subjects"
                  required
                  className="w-full rounded-xl border-2 border-secondary/30 p-4 focus:border-secondary focus:outline-none text-base shadow-clay-surface-pressed bg-surface"
                  placeholder="Math, Science, Python"
                />
              </div>
              <div>
                <label className="block font-label-sm font-semibold mb-1 text-secondary">Hourly Rate (leave blank for free)</label>
                <input 
                  type="number" 
                  name="hourlyRate"
                  className="w-full rounded-xl border-2 border-secondary/30 p-4 focus:border-secondary focus:outline-none text-base shadow-clay-surface-pressed bg-surface"
                  placeholder="25"
                />
              </div>
              <div>
                <label className="block font-label-sm font-semibold mb-1 text-secondary">Timezone</label>
                <input 
                  type="text" 
                  name="timezone"
                  required
                  defaultValue="UTC"
                  className="w-full rounded-xl border-2 border-secondary/30 p-3 focus:border-secondary focus:outline-none shadow-clay-surface-pressed bg-surface"
                  placeholder="UTC"
                />
              </div>
            </div>
            <CreateProfileButton />
          </form>
        </div>
      ) : (
        <div className="mb-8 rounded-[24px] bg-gradient-to-br from-surface to-tertiary/10 p-8 shadow-clay-surface border border-tertiary/30">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-tertiary text-[20px]" style={{ fontVariationSettings: 'FILL 1' }}>person</span>
                <h2 className="font-headline-lg text-headline-lg text-tertiary font-extrabold">Your Profile</h2>
              </div>
              <p className="font-body-md text-tertiary mt-2">{tutorProfile.bio || "No bio set"}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {tutorProfile.subjects?.map((subject: string, idx: number) => (
                  <span key={idx} className="rounded-full bg-secondary text-text-primary px-3 py-1 font-label-sm font-semibold shadow-clay-primary border-2 border-surface/30">
                    {subject}
                  </span>
                ))}
              </div>
              <p className="font-body-md text-tertiary mt-4 font-semibold">
                {tutorProfile.hourlyRate ? `$${tutorProfile.hourlyRate}/hour` : "Free"} • {tutorProfile.timezone}
              </p>
            </div>
            <div className="flex flex-col items-end gap-3 shrink-0">
              <div className="flex items-center gap-1">
                <span className="font-headline-xl text-headline-xl text-secondary font-extrabold">{tutorProfile.rating}</span>
                <span className="material-symbols-outlined text-secondary text-[28px]" style={{ fontVariationSettings: 'FILL 1' }}>star</span>
              </div>
              <p className="font-body-md text-tertiary">{tutorProfile.totalSessions} sessions</p>
              <div className="flex gap-2">
                <Link
                  href="/tutoring/dashboard/profile"
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-tertiary text-text-primary font-label-sm font-semibold shadow-clay-primary border-2 border-surface/30 transform hover:scale-105 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  Edit
                </Link>
                <Link
                  href="/tutoring/classes"
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-secondary text-text-primary font-label-sm font-semibold shadow-clay-primary border-2 border-surface/30 transform hover:scale-105 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">groups</span>
                  Classes
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-8 rounded-[24px] bg-tertiary/10 p-8 shadow-clay-surface border border-tertiary/30">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-tertiary text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>notifications</span>
            <h2 className="font-headline-lg text-headline-lg text-tertiary font-extrabold">
              Session Requests ({pendingRequests.length})
            </h2>
          </div>
          <div className="space-y-4">
            {pendingRequests.map((request: any) => (
              <div key={request.id} className="rounded-[24px] bg-surface p-6 shadow-clay-surface border border-tertiary/30">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tertiary text-text-primary font-bold text-lg shadow-clay-primary border-2 border-surface/30">
                    {request.learner.displayName?.[0] || "?"}
                  </div>
                  <div>
                    <p className="font-label-md text-tertiary font-semibold">
                      {request.learner.displayName || "Unknown"}
                    </p>
                    <p className="font-body-sm text-tertiary">
                      Requested {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {request.message && (
                  <p className="font-body-sm text-tertiary mb-3 italic">
                    "{request.message}"
                  </p>
                )}
                <div className="flex gap-2">
                  <form action={acceptRequest.bind(null, request.id)}>
                    <AcceptButton />
                  </form>
                  <form action={declineRequest.bind(null, request.id)}>
                    <DeclineButton />
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Enrollment Requests */}
      {pendingEnrollments.length > 0 && (
        <div className="mb-8 rounded-[24px] bg-secondary/10 p-8 shadow-clay-surface border border-secondary/30">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-secondary text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>school</span>
            <h2 className="font-headline-lg text-headline-lg text-secondary font-extrabold">
              Enrollment Requests ({pendingEnrollments.length})
            </h2>
          </div>
          <div className="space-y-4">
            {pendingEnrollments.map((request: any) => (
              <div key={request.id} className="rounded-[24px] bg-surface p-6 shadow-clay-surface border border-secondary/30">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-text-primary font-bold text-lg shadow-clay-primary border-2 border-surface/30">
                    {request.learner.displayName?.[0] || "?"}
                  </div>
                  <div>
                    <p className="font-label-md text-secondary font-semibold">
                      {request.learner.displayName || "Unknown"}
                    </p>
                    <p className="font-body-sm text-secondary">
                      Requested {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {request.message && (
                  <p className="font-body-sm text-secondary mb-3 italic">
                    "{request.message}"
                  </p>
                )}
                <div className="flex gap-2">
                  <form action={acceptEnrollment.bind(null, request.id)}>
                    <button className="shrink-0 rounded-full bg-primary text-text-primary px-4 py-2 font-label-md font-bold shadow-clay-primary border-2 border-surface/30 transform hover:scale-105 transition-all active:scale-95">
                      Accept
                    </button>
                  </form>
                  <form action={rejectEnrollment.bind(null, request.id)}>
                    <button className="shrink-0 rounded-full bg-error text-text-primary px-4 py-2 font-label-md font-bold shadow-clay-primary border-2 border-surface/30 transform hover:scale-105 transition-all active:scale-95">
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Sessions */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-success text-[24px]">event</span>
          <h2 className="font-headline-lg text-headline-lg text-success font-extrabold">Upcoming Sessions</h2>
        </div>
        {upcomingSessions.length === 0 ? (
          <div className="rounded-[24px] bg-surface p-10 text-center shadow-clay-surface border border-surface-border">
            <div className="relative w-20 h-20 rounded-xl bg-surface-border flex items-center justify-center overflow-hidden shadow-clay-primary mx-auto mb-4 border-2 border-surface/30">
              <span className="material-symbols-outlined text-text-muted text-[40px]">event_busy</span>
            </div>
            <p className="font-body-md text-text-muted font-bold">No upcoming sessions scheduled.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingSessions.map((session: any) => (
              <div key={session.id} className="rounded-[24px] bg-gradient-to-br from-surface to-primary/10 p-6 shadow-clay-surface border border-primary/30">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-label-md text-success font-semibold">
                      {new Date(session.scheduledAt).toLocaleString()}
                    </p>
                    <p className="font-body-sm text-success mt-1">
                      Duration: {session.durationMins} minutes
                    </p>
                    <span className={`inline-block mt-2 rounded-full px-3 py-1 font-label-sm font-semibold border-2 ${
                      session.status === "confirmed" ? "bg-gradient-to-r from-success to-primary text-text-primary border-surface/30" :
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
                        className="shrink-0 inline-flex items-center gap-2 rounded-full bg-tertiary text-text-primary px-4 py-2 font-label-md font-bold shadow-clay-primary border-2 border-surface/30 transform hover:scale-105 transition-all active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[20px]">videocam</span>
                        Join Session
                      </a>
                    )}
                    <MessagingWidget
                      otherUserId={session.learnerId}
                      otherUserName="Learner"
                      sessionId={session.id}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Sessions */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-text-muted text-[24px]">history</span>
          <h2 className="font-headline-lg text-headline-lg text-text-muted font-extrabold">Past Sessions</h2>
        </div>
        {pastSessions.length === 0 ? (
          <div className="rounded-[24px] bg-surface p-10 text-center shadow-clay-surface border border-surface-border">
            <div className="relative w-20 h-20 rounded-xl bg-surface-border flex items-center justify-center overflow-hidden shadow-clay-primary mx-auto mb-4 border-2 border-surface/30">
              <span className="material-symbols-outlined text-text-muted text-[40px]">history</span>
            </div>
            <p className="font-body-md text-text-muted font-bold">No past sessions yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pastSessions.map((session: any) => (
              <div key={session.id} className="rounded-[24px] bg-surface p-6 shadow-clay-surface border border-surface-border">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-label-md text-text-muted font-semibold">
                      {new Date(session.scheduledAt).toLocaleString()}
                    </p>
                    <p className="font-body-sm text-text-muted mt-1">
                      Duration: {session.durationMins} minutes
                    </p>
                    <span className={`inline-block mt-2 rounded-full px-3 py-1 font-label-sm font-semibold border-2 ${
                      session.status === "completed" ? "bg-gradient-to-r from-success to-primary text-text-primary border-surface/30" :
                      session.status === "cancelled" ? "bg-error text-text-primary border-surface/30" :
                      "bg-surface-border text-text-muted border-surface-border"
                    }`}>
                      {session.status}
                    </span>
                  </div>
                  <form action={async () => {
                    "use server";
                    const { updateSessionStatus } = await import("../actions");
                    await updateSessionStatus(session.id, "completed");
                  }}>
                    <button className="shrink-0 rounded-full bg-tertiary text-text-primary px-4 py-2 font-label-md font-bold shadow-clay-primary border-2 border-surface/30 transform hover:scale-105 transition-all active:scale-95">
                      Mark Complete
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Availability Settings */}
      <div className="rounded-[24px] bg-surface p-8 shadow-clay-surface mb-8">
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-primary text-[24px]">schedule</span>
          <h2 className="font-headline-lg text-headline-lg text-text-primary font-extrabold">Set Availability</h2>
        </div>
        <p className="font-body-md text-text-muted mb-6">
          Configure your weekly availability for tutoring sessions.
        </p>
        <div className="grid grid-cols-7 gap-3 mb-6">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
            <div key={day} className="text-center">
              <p className="font-label-sm text-text-primary font-semibold mb-2">{day}</p>
              <div className="space-y-1">
                {availability
                  .filter((a: any) => a.dayOfWeek === idx)
                  .map((slot: any) => (
                    <div key={slot.id} className="text-xs rounded bg-tertiary text-text-primary px-2 py-1 font-label-sm font-semibold">
                      {slot.startTime} - {slot.endTime}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
        <EditAvailabilityButton />
      </div>

      {/* Student Roster */}
      <div className="rounded-[24px] bg-tertiary/10 p-8 shadow-clay-surface border-4 border-tertiary/30 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-secondary text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>groups</span>
          <h2 className="font-headline-lg text-headline-lg text-text-primary font-extrabold">
            Student Roster ({acceptedLearners.length})
          </h2>
        </div>
        {acceptedLearners.length === 0 ? (
          <div className="rounded-[24px] bg-surface p-10 text-center shadow-clay-surface border-4 border-tertiary/30">
            <div className="relative w-20 h-20 rounded-xl bg-tertiary/10 flex items-center justify-center overflow-hidden shadow-clay-surface mx-auto mb-4 border-4 border-surface/30">
              <Mascot pose="empty" size={64} />
            </div>
            <p className="font-body-md text-text-muted font-bold">No enrolled students yet.</p>
            <p className="font-body-sm text-text-muted mt-2">Accept enrollment requests to build your student roster.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {acceptedLearners.map((learner: any) => (
              <div key={learner.id} className="rounded-[24px] bg-surface p-4 shadow-clay-surface border-4 border-tertiary/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tertiary text-text-primary font-bold text-lg shadow-clay-surface border-4 border-surface/30">
                    {learner.learner.displayName?.[0] || "?"}
                  </div>
                  <div className="flex-1">
                    <p className="font-label-md text-text-primary font-semibold">
                      {learner.learner.displayName || "Unknown"}
                    </p>
                    <p className="font-body-sm text-text-muted">
                      Enrolled {new Date(learner.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <MessagingWidget
                    otherUserId={learner.learnerId}
                    otherUserName={learner.learner.displayName || "Student"}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Conversation */}
      {enrolledLearnersForGroup.length > 0 && (
        <div className="rounded-[24px] bg-tertiary/10 p-6 shadow-clay-surface border-4 border-tertiary/30">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>forum</span>
            <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold">
              Create Group Conversation
            </h2>
          </div>
          <form action={createGroup} className="space-y-4">
            <div>
              <label className="block font-label-sm font-semibold mb-1">Group Name</label>
              <input
                type="text"
                name="groupName"
                required
                placeholder="e.g., Python Study Group"
                className="w-full rounded-xl border-2 border-tertiary/30 p-3 focus:border-tertiary focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-label-sm font-semibold mb-2">Select Learners</label>
              <div className="space-y-2 max-h-48 overflow-y-auto rounded-xl border-2 border-tertiary/30 p-3">
                {enrolledLearnersForGroup.map((learner: any) => (
                  <label key={learner.id} className="flex items-center gap-3 p-2 hover:bg-tertiary/10 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      name="learners"
                      value={learner.id}
                      className="w-5 h-5 rounded border-2 border-tertiary text-primary focus:ring-tertiary"
                    />
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-tertiary text-text-primary font-bold text-sm shadow-clay-surface border-2 border-surface/30">
                        {learner.displayName?.[0] || "?"}
                      </div>
                      <span className="font-body-sm text-text-primary">{learner.displayName || "Unknown"}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-tertiary text-text-primary py-3 font-label-lg font-bold shadow-clay-surface border-4 border-surface/30 transform hover:scale-105 transition-all active:scale-95"
            >
              Create Group
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
