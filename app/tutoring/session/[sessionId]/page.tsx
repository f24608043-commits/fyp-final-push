import { getSession, getSessionNotes, addSessionNote } from "@/app/tutoring/actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Mascot from "@/components/Mascot";

export default async function SessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const { sessionId } = await params;
  
  if (!sessionId) {
    return (
      <div className="w-full px-6 py-6">
        <h1 className="font-headline-xl text-headline-xl text-text-primary font-extrabold mb-4">Invalid Session ID</h1>
        <p className="font-body-md text-text-muted">Session ID is required to view session details.</p>
      </div>
    );
  }

  const session = await getSession(sessionId);
  const notes = await getSessionNotes(sessionId);

  if (!session) {
    return (
      <div className="w-full px-6 py-6">
        <h1 className="font-headline-xl text-headline-xl text-text-primary font-extrabold mb-4">Session Not Found</h1>
        <p className="font-body-md text-text-muted">This session does not exist or you don't have access to it.</p>
      </div>
    );
  }

  const now = new Date();
  const sessionStart = new Date(session.scheduledAt);
  const sessionEnd = new Date(sessionStart.getTime() + session.durationMins * 60000);
  
  // Check if session can be joined (10 minutes before start until end)
  const canJoin = now >= new Date(sessionStart.getTime() - 10 * 60000) && now <= sessionEnd;
  const isPast = now > sessionEnd;
  const isFuture = now < new Date(sessionStart.getTime() - 10 * 60000);

  const isTutor = session.tutorId === user.id;

  return (
    <div className="w-full px-6 py-6">
      {/* Header with Mascot */}
      <div className="relative w-full rounded-3xl bg-surface p-6 md:p-8 shadow-clay-surface overflow-hidden mb-6">
        {/* Decorative background gradients */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-secondary/25 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-tertiary/30 blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left: Header info */}
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 rounded-lg bg-surface-border text-text-muted font-label-sm text-label-sm tracking-wider uppercase">Tutoring</span>
              <span className="text-text-muted text-label-sm">•</span>
              <span className="px-3 py-0.5 rounded-lg bg-secondary/20 text-secondary font-label-sm text-label-sm">Session Details</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-text-primary tracking-tight leading-none">
              Session Details
            </h1>
            <p className="font-body-lg text-body-lg text-text-muted leading-relaxed">
              {new Date(session.scheduledAt).toLocaleString()} • {session.durationMins} minutes
            </p>
            <span className={`inline-block px-3 py-1 rounded-full font-label-md font-bold mt-2 ${
              session.status === "confirmed" ? "bg-success/20 text-primary" :
              session.status === "completed" ? "bg-tertiary text-text-primary" :
              session.status === "cancelled" ? "bg-error text-text-error" :
              "bg-surface-border text-text-muted"
            }`}>
              {session.status}
            </span>
          </div>

          {/* Right: Mascot */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center lg:items-end justify-center gap-4 shrink-0 self-center lg:self-auto">
            <div className="relative max-w-xs bg-surface p-4 rounded-[24px] shadow-clay-surface border-b-4 border-surface-border order-2 sm:order-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-secondary text-[18px]" style={{ fontVariationSettings: 'FILL 1' }}>videocam</span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Video Session</span>
              </div>
              <p className="font-headline-md text-label-md text-text-primary font-bold leading-snug">
                {canJoin ? "Join your live session now!" : isPast ? "Session has ended" : "Session starts soon"}
              </p>
            </div>
            <div className="relative w-28 h-28 md:w-32 md:h-32 shrink-0 order-1 sm:order-2">
              <Mascot pose={canJoin ? "celebrate" : "idle"} size={128} />
            </div>
          </div>
        </div>
      </div>

      {/* Video Session */}
      {session.status === "confirmed" && session.jitsiRoomId && (
        <div className="rounded-[24px] bg-surface p-6 shadow-clay-surface mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-[24px]">videocam</span>
            <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold">Video Session</h2>
          </div>
          
          {isFuture && (
            <div className="rounded-[24px] bg-tertiary p-4 text-center">
              <p className="font-body-md text-text-primary">
                Session will be available 10 minutes before start time.
              </p>
              <p className="font-body-sm text-text-primary mt-1">
                Starts in: {Math.ceil((sessionStart.getTime() - now.getTime()) / 60000)} minutes
              </p>
            </div>
          )}

          {isPast && (
            <div className="rounded-[24px] bg-surface-border p-4 text-center">
              <p className="font-body-md text-text-muted">This session has ended.</p>
            </div>
          )}

          {canJoin && (
            <div className="aspect-video bg-text-primary rounded-[24px] overflow-hidden">
              <iframe
                src={`https://meet.jit.si/${session.jitsiRoomId}`}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          )}
        </div>
      )}

      {/* Session Notes (Tutor only) */}
      {isTutor && session.status !== "cancelled" && (
        <div className="rounded-[24px] bg-surface p-6 shadow-clay-surface mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-[24px]">note</span>
            <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold">Session Notes</h2>
          </div>
          
          <form action={async (formData: FormData) => {
            "use server";
            const noteText = formData.get("noteText") as string;
            const visibility = formData.get("visibility") as "private_tutor" | "shared";
            await addSessionNote({
              sessionId: sessionId,
              noteText,
              visibility,
            });
          }} className="mb-4">
            <div className="mb-3">
              <label className="block font-label-md text-text-primary font-semibold mb-1">Add Note</label>
              <textarea
                name="noteText"
                className="w-full p-3 border border-surface-border rounded-xl bg-surface-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-body-sm text-text-primary"
                rows={3}
                placeholder="Enter your session notes..."
                required
              />
            </div>
            <div className="mb-3">
              <label className="block font-label-md text-text-primary font-semibold mb-1">Visibility</label>
              <select name="visibility" className="w-full p-3 border border-surface-border rounded-xl bg-surface-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-body-sm text-text-primary">
                <option value="shared">Shared with learner</option>
                <option value="private_tutor">Private (tutor only)</option>
              </select>
            </div>
            <button type="submit" className="px-4 py-2 bg-success text-text-primary rounded-xl font-label-md font-bold shadow-glow hover:bg-primary transition-all active:translate-y-[2px]">
              Add Note
            </button>
          </form>

          {notes && notes.length > 0 && (
            <div className="mt-4">
              <h3 className="font-label-md text-text-primary font-semibold mb-2">Existing Notes</h3>
              <div className="space-y-2">
                {notes.map((note: any) => (
                  <div key={note.id} className="bg-surface-border p-3 rounded-xl">
                    <p className="font-body-sm text-text-primary">{note.noteText}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="font-body-sm text-text-muted opacity-75">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                      <span className={`font-label-sm px-2 py-1 rounded-full ${
                        note.visibility === "private_tutor" ? "bg-tertiary/20 text-tertiary" : "bg-success/20 text-primary"
                      }`}>
                        {note.visibility === "private_tutor" ? "Private" : "Shared"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Session Notes (Learner view - shared only) */}
      {!isTutor && notes && notes.length > 0 && (
        <div className="rounded-[24px] bg-surface p-6 shadow-clay-surface">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-[24px]">note</span>
            <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold">Session Notes</h2>
          </div>
          <div className="space-y-2">
            {notes.map((note: any) => (
              <div key={note.id} className="bg-surface-border p-3 rounded-xl">
                <p className="font-body-sm text-text-primary">{note.noteText}</p>
                <p className="font-body-sm text-text-muted opacity-75 mt-1">
                  {new Date(note.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session Actions (Tutor only) */}
      {isTutor && session.status === "confirmed" && (
        <div className="rounded-[24px] bg-surface p-6 shadow-clay-surface">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-[24px]">settings</span>
            <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold">Session Actions</h2>
          </div>
          <div className="flex gap-3">
            <form action={async () => {
              "use server";
              const { updateSessionStatus } = await import("../../actions");
              await updateSessionStatus(sessionId, "completed");
            }}>
              <button className="px-4 py-2 bg-success text-text-primary rounded-xl font-label-md font-bold shadow-glow hover:bg-primary transition-all active:translate-y-[2px]">
                Mark as Completed
              </button>
            </form>
            <form action={async () => {
              "use server";
              const { updateSessionStatus } = await import("../../actions");
              await updateSessionStatus(sessionId, "cancelled");
            }}>
              <button className="px-4 py-2 bg-error text-text-error rounded-xl font-label-md font-bold hover:bg-error transition-all active:translate-y-[2px]">
                Cancel Session
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
