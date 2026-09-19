import { db } from "@/db";
import { tutorProfiles, tutorSessions, profiles } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { updateTutorProfile } from "@/app/tutoring/actions";
import { updateSessionStatus } from "@/app/tutoring/actions";
import { redirect } from "next/navigation";

export default async function AdminTutoringPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  // Check if user is admin
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile || profile.role !== "admin") {
    redirect("/path");
  }

  // Get all tutor profiles (limited for performance)
  const allTutors = await db
    .select({
      id: tutorProfiles.tutorId,
      bio: tutorProfiles.bio,
      subjects: tutorProfiles.subjects,
      hourlyRate: tutorProfiles.hourlyRate,
      timezone: tutorProfiles.timezone,
      isActive: tutorProfiles.isActive,
      rating: tutorProfiles.rating,
      totalSessions: tutorProfiles.totalSessions,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
    })
    .from(tutorProfiles)
    .innerJoin(profiles, eq(tutorProfiles.tutorId, profiles.id))
    .orderBy(desc(tutorProfiles.createdAt))
    .limit(50);

  // Get all sessions for oversight
  const allSessions = await db
    .select({
      id: tutorSessions.id,
      tutorId: tutorSessions.tutorId,
      learnerId: tutorSessions.learnerId,
      scheduledAt: tutorSessions.scheduledAt,
      durationMins: tutorSessions.durationMins,
      status: tutorSessions.status,
      jitsiRoomId: tutorSessions.jitsiRoomId,
      tutorName: profiles.displayName,
    })
    .from(tutorSessions)
    .innerJoin(profiles, eq(tutorSessions.tutorId, profiles.id))
    .orderBy(desc(tutorSessions.scheduledAt))
    .limit(50);

  // Calculate session metrics
  const totalSessions = allSessions.length;
  const confirmedSessions = allSessions.filter((s: any) => s.status === "confirmed").length;
  const completedSessions = allSessions.filter((s: any) => s.status === "completed").length;
  const cancelledSessions = allSessions.filter((s: any) => s.status === "cancelled").length;

  return (
    <div className="w-full px-6 py-6">
      <h1 className="font-headline-xl text-headline-xl text-text-primary font-extrabold mb-6">Admin Tutoring Dashboard</h1>

      {/* Session Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl bg-surface p-4 shadow-clay-surface border border-surface-border">
          <h3 className="font-label-md text-text-muted font-semibold">Total Sessions</h3>
          <p className="font-headline-xl text-headline-xl text-tertiary font-extrabold">{totalSessions}</p>
        </div>
        <div className="rounded-2xl bg-surface p-4 shadow-clay-surface border border-surface-border">
          <h3 className="font-label-md text-text-muted font-semibold">Confirmed</h3>
          <p className="font-headline-xl text-headline-xl text-success font-extrabold">{confirmedSessions}</p>
        </div>
        <div className="rounded-2xl bg-surface p-4 shadow-clay-surface border border-surface-border">
          <h3 className="font-label-md text-text-muted font-semibold">Completed</h3>
          <p className="font-headline-xl text-headline-xl text-primary font-extrabold">{completedSessions}</p>
        </div>
        <div className="rounded-2xl bg-surface p-4 shadow-clay-surface border border-surface-border">
          <h3 className="font-label-md text-text-muted font-semibold">Cancelled</h3>
          <p className="font-headline-xl text-headline-xl text-error font-extrabold">{cancelledSessions}</p>
        </div>
      </div>

      {/* Tutor Management */}
      <div className="mb-8">
        <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold mb-4">Tutor Management ({allTutors.length})</h2>
        <div className="rounded-2xl bg-surface shadow-clay-surface border border-surface-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-border border-b border-surface-border">
              <tr>
                <th className="px-4 py-3 text-left font-label-md font-semibold text-text-primary">Tutor</th>
                <th className="px-4 py-3 text-left font-label-md font-semibold text-text-primary">Subjects</th>
                <th className="px-4 py-3 text-left font-label-md font-semibold text-text-primary">Rate</th>
                <th className="px-4 py-3 text-left font-label-md font-semibold text-text-primary">Rating</th>
                <th className="px-4 py-3 text-left font-label-md font-semibold text-text-primary">Sessions</th>
                <th className="px-4 py-3 text-left font-label-md font-semibold text-text-primary">Status</th>
                <th className="px-4 py-3 text-left font-label-md font-semibold text-text-primary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {allTutors.map((tutor: any) => (
                <tr key={tutor.id} className="hover:bg-surface-border">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-surface-border flex items-center justify-center text-text-primary font-label-md font-semibold">
                        {tutor.displayName?.[0] || "?"}
                      </div>
                      <span className="font-label-md font-semibold text-text-primary">{tutor.displayName || "Unknown"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {tutor.subjects?.slice(0, 2).map((subject: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-secondary text-white rounded font-body-sm font-semibold">
                          {subject}
                        </span>
                      ))}
                      {tutor.subjects?.length > 2 && (
                        <span className="font-body-sm text-text-muted">+{tutor.subjects.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-body-sm text-text-primary">
                    {tutor.hourlyRate ? `$${tutor.hourlyRate}/hr` : "Free"}
                  </td>
                  <td className="px-4 py-3 font-body-sm text-text-primary">
                    ⭐ {tutor.rating}/5
                  </td>
                  <td className="px-4 py-3 font-body-sm text-text-primary">
                    {tutor.totalSessions}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded font-body-sm font-semibold ${
                      tutor.isActive ? "bg-success text-white" : "bg-error text-white"
                    }`}>
                      {tutor.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <form action={async () => {
                      "use server";
                      await updateTutorProfile({
                        isActive: !tutor.isActive,
                      });
                    }} suppressHydrationWarning={true}>
                      <button className="font-body-sm text-primary hover:text-primary-dark font-semibold transition-all">
                        {tutor.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Session Oversight */}
      <div>
        <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold mb-4">Recent Sessions (Last 50)</h2>
        <div className="rounded-2xl bg-surface shadow-clay-surface border border-surface-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-border border-b border-surface-border">
              <tr>
                <th className="px-4 py-3 text-left font-label-md font-semibold text-text-primary">Session ID</th>
                <th className="px-4 py-3 text-left font-label-md font-semibold text-text-primary">Tutor</th>
                <th className="px-4 py-3 text-left font-label-md font-semibold text-text-primary">Scheduled</th>
                <th className="px-4 py-3 text-left font-label-md font-semibold text-text-primary">Duration</th>
                <th className="px-4 py-3 text-left font-label-md font-semibold text-text-primary">Status</th>
                <th className="px-4 py-3 text-left font-label-md font-semibold text-text-primary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {allSessions.map((session: any) => (
                <tr key={session.id} className="hover:bg-surface-border">
                  <td className="px-4 py-3 font-body-sm font-mono text-text-primary">
                    {session.id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 font-body-sm text-text-primary">
                    {session.tutorName || "Unknown"}
                  </td>
                  <td className="px-4 py-3 font-body-sm text-text-primary">
                    {new Date(session.scheduledAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-body-sm text-text-primary">
                    {session.durationMins} min
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded font-body-sm font-semibold ${
                      session.status === "confirmed" ? "bg-success text-white" :
                      session.status === "completed" ? "bg-primary text-white" :
                      session.status === "cancelled" ? "bg-error text-white" :
                      "bg-tertiary text-white"
                    }`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {session.status === "confirmed" && (
                      <form action={async () => {
                        "use server";
                        await updateSessionStatus(session.id, "cancelled");
                      }} suppressHydrationWarning={true}>
                        <button className="font-body-sm text-error hover:text-error-dark font-semibold transition-all">
                          Cancel
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
