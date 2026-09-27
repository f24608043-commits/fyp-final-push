import { getTutorAvailability, getTutorProfile } from "../../actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Mascot from "@/components/Mascot";
import Link from "next/link";

export default async function BookSessionPage({ params }: { params: Promise<{ tutorId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const resolvedParams = await params;
  
  const [tutorProfile, availability] = await Promise.all([
    getTutorProfile(resolvedParams.tutorId),
    getTutorAvailability(resolvedParams.tutorId)
  ]);

  if (!tutorProfile) {
    redirect("/tutoring");
  }

  return (
    <div className="w-full px-6 py-6 bg-gradient-to-br from-background via-blue-50 to-purple-50 min-h-screen">
      {/* Header */}
      <div className="relative w-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-3xl p-1 shadow-2xl overflow-hidden mb-6">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-white/40 pointer-events-none"></div>
        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/tutoring" className="text-gray-500 hover:text-gray-700">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </Link>
            <h1 className="font-headline-xl text-headline-xl text-on-surface font-extrabold">
              Book Session with {tutorProfile.displayName || "Tutor"}
            </h1>
          </div>
          <p className="font-body-md text-on-surface-variant">
            Select a date and time slot to request a tutoring session
          </p>
        </div>
      </div>

      {/* Booking Form */}
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl bg-white p-6 shadow-xl border-4 border-blue-100">
          <form action="/api/book-session" method="POST" className="space-y-6">
            <input type="hidden" name="tutorId" value={resolvedParams.tutorId} />
            
            <div>
              <label className="block font-label-sm font-semibold mb-2 text-on-surface">
                Select Date
              </label>
              <input
                type="date"
                name="date"
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-label-sm font-semibold mb-2 text-on-surface">
                Available Time Slots
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availability.length > 0 ? (
                  availability.map((slot: any, idx: number) => (
                    <label key={idx} className="cursor-pointer">
                      <input
                        type="radio"
                        name="slotIndex"
                        value={idx}
                        required
                        className="sr-only peer"
                      />
                      <div className="p-4 rounded-xl border-2 border-gray-200 peer-checked:border-blue-500 peer-checked:bg-blue-50 transition-all">
                        <p className="font-label-sm font-semibold text-on-surface">
                          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][slot.dayOfWeek]}
                        </p>
                        <p className="font-body-md text-on-surface-variant">
                          {slot.startTime} - {slot.endTime}
                        </p>
                      </div>
                    </label>
                  ))
                ) : (
                  <p className="text-text-muted font-body-sm col-span-2">
                    No availability set by this tutor yet
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block font-label-sm font-semibold mb-2 text-on-surface">
                What do you need help with?
              </label>
              <textarea
                name="message"
                required
                rows={4}
                placeholder="Describe what topics you'd like to cover in this session..."
                className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-blue-400 focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Link
                href="/tutoring"
                className="flex-1 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-600 px-4 py-3 font-label-md font-semibold hover:bg-gray-100 transition-all text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-3 font-label-md font-bold shadow-xl border-4 border-white/30 transform hover:scale-105 transition-all active:scale-95"
              >
                Send Request
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
