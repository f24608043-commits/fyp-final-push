import { getMySessions, getTutorProfile, getTutorAvailability, getPendingRequests } from "../actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Mascot from "@/components/Mascot";

export default async function TutorDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const [tutorProfile, mySessions, availability, pendingRequests] = await Promise.all([
    getTutorProfile(user.id),
    getMySessions(),
    getTutorAvailability(user.id),
    getPendingRequests()
  ]);

  // Separate upcoming and past sessions
  const now = new Date();
  const upcomingSessions = mySessions.filter((s: any) => new Date(s.scheduledAt) > now);
  const pastSessions = mySessions.filter((s: any) => new Date(s.scheduledAt) <= now);

  return (
    <div className="w-full px-6 py-6">
      {/* Header with Mascot */}
      <div className="relative w-full rounded-3xl bg-surface-container-lowest p-6 md:p-8 shadow-xl overflow-hidden mb-6">
        {/* Decorative background gradients */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-secondary-fixed/25 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-tertiary-fixed/30 blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left: Header info */}
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 rounded-lg bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm tracking-wider uppercase">Tutor Portal</span>
              <span className="text-outline text-label-sm">•</span>
              <span className="px-3 py-0.5 rounded-lg bg-secondary-container/20 text-secondary font-label-sm text-label-sm">Dashboard</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight leading-none">
              Tutor Dashboard
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              Manage your tutoring sessions and availability
            </p>
          </div>

          {/* Right: Mascot */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center lg:items-end justify-center gap-4 shrink-0 self-center lg:self-auto">
            <div className="relative max-w-xs bg-surface-container-lowest p-4 rounded-2xl shadow-lg border-b-4 border-surface-container-high order-2 sm:order-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-secondary text-[18px]" style={{ fontVariationSettings: 'FILL 1' }}>dashboard</span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Stay Organized</span>
              </div>
              <p className="font-headline-md text-label-md text-on-surface font-bold leading-snug">
                "Track your sessions and manage your teaching schedule efficiently!"
              </p>
            </div>
            <div className="relative w-28 h-28 md:w-32 md:h-32 shrink-0 order-1 sm:order-2">
              <Mascot pose="idle" size={128} />
            </div>
          </div>
        </div>
      </div>

      {/* Tutor Profile Status */}
      {!tutorProfile ? (
        <div className="mb-6 rounded-2xl bg-secondary-fixed p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-on-secondary-container text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>school</span>
            <h2 className="font-headline-md text-headline-md text-on-secondary-container font-extrabold">Set Up Your Tutor Profile</h2>
          </div>
          <p className="font-body-md text-on-secondary-container mb-4">Complete your profile to start accepting students.</p>
          <button className="rounded-xl bg-secondary-container text-on-secondary-container px-4 py-2 font-label-md font-bold shadow-glow hover:bg-secondary transition-all active:translate-y-[2px]">
            Create Profile
          </button>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl bg-surface-container-lowest p-6 shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: 'FILL 1' }}>person</span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-extrabold">Your Profile</h2>
              </div>
              <p className="font-body-sm text-on-surface-variant mt-1">{tutorProfile.bio || "No bio set"}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {tutorProfile.subjects?.map((subject: string, idx: number) => (
                  <span key={idx} className="rounded-full bg-tertiary-fixed text-on-tertiary-fixed px-2 py-1 font-label-sm font-semibold">
                    {subject}
                  </span>
                ))}
              </div>
              <p className="font-body-sm text-on-surface-variant mt-3">
                {tutorProfile.hourlyRate ? `$${tutorProfile.hourlyRate}/hour` : "Free"} • {tutorProfile.timezone}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 justify-end">
                <span className="font-headline-xl text-headline-xl text-secondary font-extrabold">{tutorProfile.rating}</span>
                <span className="material-symbols-outlined text-secondary text-[28px]" style={{ fontVariationSettings: 'FILL 1' }}>star</span>
              </div>
              <p className="font-body-sm text-on-surface-variant">{tutorProfile.totalSessions} sessions</p>
            </div>
          </div>
        </div>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-6 rounded-2xl bg-primary-fixed p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-on-primary-fixed text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>notifications</span>
            <h2 className="font-headline-md text-headline-md text-on-primary-fixed font-extrabold">
              Session Requests ({pendingRequests.length})
            </h2>
          </div>
          <div className="space-y-3">
            {pendingRequests.map((request: any) => (
              <div key={request.id} className="rounded-2xl bg-surface-container-lowest p-4 shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-on-primary font-bold text-lg">
                    {request.learner.displayName?.[0] || "?"}
                  </div>
                  <div>
                    <p className="font-label-md text-on-surface font-semibold">
                      {request.learner.displayName || "Unknown"}
                    </p>
                    <p className="font-body-sm text-on-surface-variant">
                      Requested {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {request.message && (
                  <p className="font-body-sm text-on-surface-variant mb-3 italic">
                    "{request.message}"
                  </p>
                )}
                <div className="flex gap-2">
                  <form action={async () => {
                    "use server";
                    const { acceptSessionRequest } = await import("../actions");
                    await acceptSessionRequest(request.id, 0);
                  }}>
                    <button className="rounded-full bg-primary-container text-on-primary px-4 py-2 font-label-md font-bold shadow-glow hover:bg-primary transition-all active:translate-y-[2px]">
                      Accept
                    </button>
                  </form>
                  <form action={async () => {
                    "use server";
                    const { declineSessionRequest } = await import("../actions");
                    await declineSessionRequest(request.id);
                  }}>
                    <button className="rounded-xl border border-outline-variant bg-surface-container text-on-surface px-4 py-2 font-label-md font-semibold hover:bg-surface-container-high transition-all">
                      Decline
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Sessions */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary text-[24px]">event</span>
          <h2 className="font-headline-md text-headline-md text-on-surface font-extrabold">Upcoming Sessions</h2>
        </div>
        {upcomingSessions.length === 0 ? (
          <div className="rounded-2xl bg-surface-container-lowest p-8 text-center shadow-md">
            <div className="relative w-20 h-20 rounded-xl bg-surface-container flex items-center justify-center overflow-hidden shadow-inner mx-auto mb-4">
              <Mascot pose="empty" size={64} />
            </div>
            <p className="font-body-md text-on-surface-variant">No upcoming sessions scheduled.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingSessions.map((session: any) => (
              <div key={session.id} className="rounded-2xl bg-surface-container-lowest p-5 shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-label-md text-on-surface font-semibold">
                      {new Date(session.scheduledAt).toLocaleString()}
                    </p>
                    <p className="font-body-sm text-on-surface-variant mt-1">
                      Duration: {session.durationMins} minutes
                    </p>
                    <span className={`inline-block mt-2 rounded-full px-3 py-1 font-label-sm font-semibold ${
                      session.status === "confirmed" ? "bg-primary-container/20 text-primary" :
                      "bg-surface-container-high text-on-surface-variant"
                    }`}>
                      {session.status}
                    </span>
                  </div>
                  {session.status === "confirmed" && session.jitsiRoomId && (
                    <a
                      href={`https://meet.jit.si/${session.jitsiRoomId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-2 rounded-full bg-primary-container text-on-primary px-4 py-2 font-label-md font-bold shadow-glow hover:bg-primary transition-all active:translate-y-[2px]"
                    >
                      <span className="material-symbols-outlined text-[20px]">videocam</span>
                      Join Session
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Sessions */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary text-[24px]">history</span>
          <h2 className="font-headline-md text-headline-md text-on-surface font-extrabold">Past Sessions</h2>
        </div>
        {pastSessions.length === 0 ? (
          <div className="rounded-2xl bg-surface-container-lowest p-8 text-center shadow-md">
            <div className="relative w-20 h-20 rounded-xl bg-surface-container flex items-center justify-center overflow-hidden shadow-inner mx-auto mb-4">
              <Mascot pose="empty" size={64} />
            </div>
            <p className="font-body-md text-on-surface-variant">No past sessions yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pastSessions.map((session: any) => (
              <div key={session.id} className="rounded-2xl bg-surface-container-lowest p-5 shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-label-md text-on-surface font-semibold">
                      {new Date(session.scheduledAt).toLocaleString()}
                    </p>
                    <p className="font-body-sm text-on-surface-variant mt-1">
                      Duration: {session.durationMins} minutes
                    </p>
                    <span className={`inline-block mt-2 rounded-full px-3 py-1 font-label-sm font-semibold ${
                      session.status === "completed" ? "bg-tertiary-fixed text-on-tertiary-fixed" :
                      session.status === "cancelled" ? "bg-error-container text-on-error-container" :
                      "bg-surface-container-high text-on-surface-variant"
                    }`}>
                      {session.status}
                    </span>
                  </div>
                  <form action={async () => {
                    "use server";
                    const { updateSessionStatus } = await import("../actions");
                    await updateSessionStatus(session.id, "completed");
                  }}>
                    <button className="shrink-0 rounded-xl bg-primary-container text-on-primary px-4 py-2 font-label-md font-bold shadow-glow hover:bg-primary transition-all active:translate-y-[2px]">
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
      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary text-[24px]">schedule</span>
          <h2 className="font-headline-md text-headline-md text-on-surface font-extrabold">Set Availability</h2>
        </div>
        <p className="font-body-sm text-on-surface-variant mb-4">
          Configure your weekly availability for tutoring sessions.
        </p>
        <div className="grid grid-cols-7 gap-2 mb-4">
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
        <button className="rounded-xl bg-primary-container text-on-primary px-4 py-2 font-label-md font-bold shadow-glow hover:bg-primary transition-all active:translate-y-[2px]">
          Edit Availability
        </button>
      </div>
    </div>
  );
}
