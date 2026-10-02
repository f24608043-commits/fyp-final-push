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
  } catch (error) {
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
    <div className="w-full px-8 py-8 bg-gradient-to-br from-slate-50 via-amber-50 to-indigo-50 min-h-screen">
      {/* Header Banner with Statistics Cards */}
      <div className="relative w-full bg-gradient-to-br from-amber-500 via-orange-500 to-indigo-500 rounded-3xl p-1 shadow-2xl overflow-hidden mb-8">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-white/40 pointer-events-none"></div>
        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-8 md:p-10">
        
        <div className="relative z-10 flex flex-col gap-6">
          {/* Welcome Section */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-label-sm text-label-sm tracking-wider uppercase font-bold shadow-lg border-2 border-white/30">👨‍🏫 Tutor Portal</span>
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
            <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-beautiful-md border border-amber-200 hover:scale-[1.02] transition-transform duration-150">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-beautiful-sm">
                  <span className="material-symbols-outlined text-[20px]">people</span>
                </div>
                <span className="font-label-sm text-amber-700 font-bold uppercase tracking-wider">Students</span>
              </div>
              <p className="font-headline-2xl text-headline-2xl text-amber-900 font-extrabold">
                {acceptedLearners?.length || 0}
              </p>
            </div>

            {/* Active Groups */}
            <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 p-6 shadow-beautiful-md border border-indigo-200 hover:scale-[1.02] transition-transform duration-150">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-beautiful-sm">
                  <span className="material-symbols-outlined text-[20px]">groups</span>
                </div>
                <span className="font-label-sm text-indigo-700 font-bold uppercase tracking-wider">Groups</span>
              </div>
              <p className="font-headline-2xl text-headline-2xl text-indigo-900 font-extrabold">
                {enrolledLearnersForGroup?.length || 0}
              </p>
            </div>

            {/* Pending Assignments */}
            <div className="rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 p-6 shadow-beautiful-md border border-rose-200 hover:scale-[1.02] transition-transform duration-150">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-beautiful-sm">
                  <span className="material-symbols-outlined text-[20px]">assignment</span>
                </div>
                <span className="font-label-sm text-rose-700 font-bold uppercase tracking-wider">Requests</span>
              </div>
              <p className="font-headline-2xl text-headline-2xl text-rose-900 font-extrabold">
                {pendingRequests?.length || 0}
              </p>
            </div>

            {/* Upcoming Sessions */}
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-6 shadow-beautiful-md border border-emerald-200 hover:scale-[1.02] transition-transform duration-150">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-beautiful-sm">
                  <span className="material-symbols-outlined text-[20px]">event</span>
                </div>
                <span className="font-label-sm text-emerald-700 font-bold uppercase tracking-wider">Sessions</span>
              </div>
              <p className="font-headline-2xl text-headline-2xl text-emerald-900 font-extrabold">
                {upcomingSessions?.length || 0}
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Tutor Profile Status */}
      {!tutorProfile ? (
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-8 shadow-clay-surface border border-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-amber-600 text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>school</span>
            <h2 className="font-headline-lg text-headline-lg text-amber-900 font-extrabold">Set Up Your Tutor Profile</h2>
          </div>
          <p className="font-body-md text-amber-800 mb-4">Complete your profile to start accepting students.</p>
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
                <label className="block font-label-sm font-semibold mb-1 text-amber-900">Bio</label>
                <textarea 
                  name="bio" 
                  required
                  className="w-full rounded-xl border-2 border-amber-200 p-4 focus:border-amber-400 focus:outline-none text-base shadow-clay-inset bg-white"
                  placeholder="Describe your teaching experience..."
                  rows={4}
                />
              </div>
              <div>
                <label className="block font-label-sm font-semibold mb-1 text-amber-900">Subjects (comma-separated)</label>
                <input 
                  type="text" 
                  name="subjects"
                  required
                  className="w-full rounded-xl border-2 border-amber-200 p-4 focus:border-amber-400 focus:outline-none text-base shadow-clay-inset bg-white"
                  placeholder="Math, Science, Python"
                />
              </div>
              <div>
                <label className="block font-label-sm font-semibold mb-1 text-amber-900">Hourly Rate (leave blank for free)</label>
                <input 
                  type="number" 
                  name="hourlyRate"
                  className="w-full rounded-xl border-2 border-amber-200 p-4 focus:border-amber-400 focus:outline-none text-base shadow-clay-inset bg-white"
                  placeholder="25"
                />
              </div>
              <div>
                <label className="block font-label-sm font-semibold mb-1 text-amber-900">Timezone</label>
                <input 
                  type="text" 
                  name="timezone"
                  required
                  defaultValue="UTC"
                  className="w-full rounded-xl border-2 border-amber-200 p-3 focus:border-amber-400 focus:outline-none shadow-clay-inset bg-white"
                  placeholder="UTC"
                />
              </div>
            </div>
            <CreateProfileButton />
          </form>
        </div>
      ) : (
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-white to-indigo-50 p-8 shadow-clay-surface border border-indigo-200">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-indigo-600 text-[20px]" style={{ fontVariationSettings: 'FILL 1' }}>person</span>
                <h2 className="font-headline-lg text-headline-lg text-indigo-900 font-extrabold">Your Profile</h2>
              </div>
              <p className="font-body-md text-indigo-800 mt-2">{tutorProfile.bio || "No bio set"}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {tutorProfile.subjects?.map((subject: string, idx: number) => (
                  <span key={idx} className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 font-label-sm font-semibold shadow-clay-primary border-2 border-white/30">
                    {subject}
                  </span>
                ))}
              </div>
              <p className="font-body-md text-indigo-700 mt-4 font-semibold">
                {tutorProfile.hourlyRate ? `$${tutorProfile.hourlyRate}/hour` : "Free"} • {tutorProfile.timezone}
              </p>
            </div>
            <div className="flex flex-col items-end gap-3 shrink-0">
              <div className="flex items-center gap-1">
                <span className="font-headline-xl text-headline-xl text-amber-600 font-extrabold">{tutorProfile.rating}</span>
                <span className="material-symbols-outlined text-amber-500 text-[28px]" style={{ fontVariationSettings: 'FILL 1' }}>star</span>
              </div>
              <p className="font-body-md text-indigo-600">{tutorProfile.totalSessions} sessions</p>
              <div className="flex gap-2">
                <Link
                  href="/tutoring/dashboard/profile"
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-label-sm font-semibold shadow-clay-primary border-2 border-white/30 transform hover:scale-105 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  Edit
                </Link>
                <Link
                  href="/tutoring/classes"
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-label-sm font-semibold shadow-clay-primary border-2 border-white/30 transform hover:scale-105 transition-all active:scale-95"
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
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 p-8 shadow-clay-surface border border-indigo-200">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-indigo-600 text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>notifications</span>
            <h2 className="font-headline-lg text-headline-lg text-indigo-900 font-extrabold">
              Session Requests ({pendingRequests.length})
            </h2>
          </div>
          <div className="space-y-4">
            {pendingRequests.map((request: any) => (
              <div key={request.id} className="rounded-2xl bg-white p-6 shadow-clay-surface border border-indigo-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white font-bold text-lg shadow-clay-primary border-2 border-white/30">
                    {request.learner.displayName?.[0] || "?"}
                  </div>
                  <div>
                    <p className="font-label-md text-indigo-900 font-semibold">
                      {request.learner.displayName || "Unknown"}
                    </p>
                    <p className="font-body-sm text-indigo-700">
                      Requested {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {request.message && (
                  <p className="font-body-sm text-indigo-600 mb-3 italic">
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
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-8 shadow-clay-surface border border-amber-200">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-amber-600 text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>school</span>
            <h2 className="font-headline-lg text-headline-lg text-amber-900 font-extrabold">
              Enrollment Requests ({pendingEnrollments.length})
            </h2>
          </div>
          <div className="space-y-4">
            {pendingEnrollments.map((request: any) => (
              <div key={request.id} className="rounded-2xl bg-white p-6 shadow-clay-surface border border-amber-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold text-lg shadow-clay-primary border-2 border-white/30">
                    {request.learner.displayName?.[0] || "?"}
                  </div>
                  <div>
                    <p className="font-label-md text-amber-900 font-semibold">
                      {request.learner.displayName || "Unknown"}
                    </p>
                    <p className="font-body-sm text-amber-700">
                      Requested {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {request.message && (
                  <p className="font-body-sm text-amber-600 mb-3 italic">
                    "{request.message}"
                  </p>
                )}
                <div className="flex gap-2">
                  <form action={acceptEnrollment.bind(null, request.id)}>
                    <button className="shrink-0 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white px-4 py-2 font-label-md font-bold shadow-clay-primary border-2 border-white/30 transform hover:scale-105 transition-all active:scale-95">
                      Accept
                    </button>
                  </form>
                  <form action={rejectEnrollment.bind(null, request.id)}>
                    <button className="shrink-0 rounded-full bg-gradient-to-r from-rose-500 to-red-500 text-white px-4 py-2 font-label-md font-bold shadow-clay-primary border-2 border-white/30 transform hover:scale-105 transition-all active:scale-95">
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
          <span className="material-symbols-outlined text-emerald-600 text-[24px]">event</span>
          <h2 className="font-headline-lg text-headline-lg text-emerald-900 font-extrabold">Upcoming Sessions</h2>
        </div>
        {upcomingSessions.length === 0 ? (
          <div className="rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 p-10 text-center shadow-clay-surface border border-slate-300">
            <div className="relative w-20 h-20 rounded-xl bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center overflow-hidden shadow-clay-primary mx-auto mb-4 border-2 border-white/30">
              <span className="material-symbols-outlined text-slate-600 text-[40px]">event_busy</span>
            </div>
            <p className="font-body-md text-slate-600 font-bold">No upcoming sessions scheduled.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingSessions.map((session: any) => (
              <div key={session.id} className="rounded-2xl bg-gradient-to-br from-white to-emerald-50 p-6 shadow-clay-surface border border-emerald-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-label-md text-emerald-900 font-semibold">
                      {new Date(session.scheduledAt).toLocaleString()}
                    </p>
                    <p className="font-body-sm text-emerald-700 mt-1">
                      Duration: {session.durationMins} minutes
                    </p>
                    <span className={`inline-block mt-2 rounded-full px-3 py-1 font-label-sm font-semibold border-2 ${
                      session.status === "confirmed" ? "bg-gradient-to-r from-emerald-400 to-green-500 text-white border-white/30" :
                      "bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600 border-slate-300"
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
                        className="shrink-0 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 font-label-md font-bold shadow-clay-primary border-2 border-white/30 transform hover:scale-105 transition-all active:scale-95"
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
          <span className="material-symbols-outlined text-slate-600 text-[24px]">history</span>
          <h2 className="font-headline-lg text-headline-lg text-slate-900 font-extrabold">Past Sessions</h2>
        </div>
        {pastSessions.length === 0 ? (
          <div className="rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 p-10 text-center shadow-clay-surface border border-slate-300">
            <div className="relative w-20 h-20 rounded-xl bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center overflow-hidden shadow-clay-primary mx-auto mb-4 border-2 border-white/30">
              <span className="material-symbols-outlined text-slate-600 text-[40px]">history</span>
            </div>
            <p className="font-body-md text-slate-600 font-bold">No past sessions yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pastSessions.map((session: any) => (
              <div key={session.id} className="rounded-2xl bg-gradient-to-br from-white to-slate-50 p-6 shadow-clay-surface border border-slate-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-label-md text-slate-900 font-semibold">
                      {new Date(session.scheduledAt).toLocaleString()}
                    </p>
                    <p className="font-body-sm text-slate-700 mt-1">
                      Duration: {session.durationMins} minutes
                    </p>
                    <span className={`inline-block mt-2 rounded-full px-3 py-1 font-label-sm font-semibold border-2 ${
                      session.status === "completed" ? "bg-gradient-to-r from-emerald-400 to-green-500 text-white border-white/30" :
                      session.status === "cancelled" ? "bg-gradient-to-r from-rose-400 to-red-500 text-white border-white/30" :
                      "bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600 border-slate-300"
                    }`}>
                      {session.status}
                    </span>
                  </div>
                  <form action={async () => {
                    "use server";
                    const { updateSessionStatus } = await import("../actions");
                    await updateSessionStatus(session.id, "completed");
                  }}>
                    <button className="shrink-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 font-label-md font-bold shadow-clay-primary border-2 border-white/30 transform hover:scale-105 transition-all active:scale-95">
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
      <div className="rounded-2xl bg-surface-container-lowest p-8 shadow-md mb-8">
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-primary text-[24px]">schedule</span>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold">Set Availability</h2>
        </div>
        <p className="font-body-md text-on-surface-variant mb-6">
          Configure your weekly availability for tutoring sessions.
        </p>
        <div className="grid grid-cols-7 gap-3 mb-6">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
            <div key={day} className="text-center">
              <p className="font-label-sm text-on-surface font-semibold mb-2">{day}</p>
              <div className="space-y-1">
                {availability
                  .filter((a: any) => a.dayOfWeek === idx)
                  .map((slot: any) => (
                    <div key={slot.id} className="text-xs rounded bg-tertiary-fixed text-on-tertiary-fixed px-2 py-1 font-label-sm font-semibold">
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
      <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-8 shadow-xl border-4 border-purple-100 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-secondary text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>groups</span>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold">
            Student Roster ({acceptedLearners.length})
          </h2>
        </div>
        {acceptedLearners.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-lg border-4 border-purple-100">
            <div className="relative w-20 h-20 rounded-xl bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center overflow-hidden shadow-xl mx-auto mb-4 border-4 border-white/30">
              <Mascot pose="empty" size={64} />
            </div>
            <p className="font-body-md text-text-muted font-bold">No enrolled students yet.</p>
            <p className="font-body-sm text-text-muted mt-2">Accept enrollment requests to build your student roster.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {acceptedLearners.map((learner: any) => (
              <div key={learner.id} className="rounded-2xl bg-white p-4 shadow-lg border-4 border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-500 text-white font-bold text-lg shadow-xl border-4 border-white/30">
                    {learner.learner.displayName?.[0] || "?"}
                  </div>
                  <div className="flex-1">
                    <p className="font-label-md text-on-surface font-semibold">
                      {learner.learner.displayName || "Unknown"}
                    </p>
                    <p className="font-body-sm text-on-surface-variant">
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
        <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 p-6 shadow-xl border-4 border-indigo-100">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>forum</span>
            <h2 className="font-headline-md text-headline-md text-on-surface font-extrabold">
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
                className="w-full rounded-xl border-2 border-indigo-200 p-3 focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-label-sm font-semibold mb-2">Select Learners</label>
              <div className="space-y-2 max-h-48 overflow-y-auto rounded-xl border-2 border-indigo-200 p-3">
                {enrolledLearnersForGroup.map((learner: any) => (
                  <label key={learner.id} className="flex items-center gap-3 p-2 hover:bg-indigo-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      name="learners"
                      value={learner.id}
                      className="w-5 h-5 rounded border-2 border-indigo-300 text-primary focus:ring-indigo-500"
                    />
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 text-white font-bold text-sm shadow-lg border-2 border-white/30">
                        {learner.displayName?.[0] || "?"}
                      </div>
                      <span className="font-body-sm text-on-surface">{learner.displayName || "Unknown"}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white py-3 font-label-lg font-bold shadow-xl border-4 border-white/30 transform hover:scale-105 transition-all active:scale-95"
            >
              Create Group
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
