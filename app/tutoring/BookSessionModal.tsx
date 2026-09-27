"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

interface BookSessionModalProps {
  tutorId: string;
  tutorName: string;
  availability: any[];
  onClose: () => void;
}

export default function BookSessionModal({ tutorId, tutorName, availability, onClose }: BookSessionModalProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const { pending } = useFormStatus();

  const handleSubmit = async (formData: FormData) => {
    formData.append("tutorId", tutorId);
    formData.append("date", selectedDate);
    formData.append("startTime", selectedSlot || "");
    formData.append("endTime", selectedSlot ? availability.find((a: any) => a.dayOfWeek === new Date(selectedDate).getDay())?.endTime : "");
    formData.append("message", message);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline-xl text-headline-xl text-on-surface font-extrabold">
              Book Session with {tutorName}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>

          <form action="/api/book-session" method="POST" className="space-y-4">
            <input type="hidden" name="tutorId" value={tutorId} />
            
            <div>
              <label className="block font-label-sm font-semibold mb-2 text-on-surface">
                Select Date
              </label>
              <input
                type="date"
                name="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-blue-400 focus:outline-none"
              />
            </div>

            {selectedDate && (
              <div>
                <label className="block font-label-sm font-semibold mb-2 text-on-surface">
                  Available Time Slots
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availability
                    .filter((a: any) => a.dayOfWeek === new Date(selectedDate).getDay())
                    .map((slot: any, idx: number) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedSlot(slot.startTime)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          selectedSlot === slot.startTime
                            ? "border-blue-500 bg-blue-50 text-blue-600"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <p className="font-label-sm font-semibold">
                          {slot.startTime} - {slot.endTime}
                        </p>
                      </button>
                    ))}
                </div>
                {availability.filter((a: any) => a.dayOfWeek === new Date(selectedDate).getDay()).length === 0 && (
                  <p className="text-text-muted font-body-sm">No availability for this day</p>
                )}
              </div>
            )}

            <div>
              <label className="block font-label-sm font-semibold mb-2 text-on-surface">
                What do you need help with?
              </label>
              <textarea
                name="message"
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe what topics you'd like to cover in this session..."
                className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-blue-400 focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-600 px-4 py-3 font-label-md font-semibold hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending || !selectedDate || !selectedSlot || !message}
                className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-3 font-label-md font-bold shadow-xl border-4 border-white/30 transform hover:scale-105 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {pending ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Booking...
                  </>
                ) : (
                  "Send Request"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
