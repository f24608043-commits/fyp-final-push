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
  const [selectedSlotTime, setSelectedSlotTime] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const { pending } = useFormStatus();

  // Get day of week without timezone conversion issues
  const getSelectedDayOfWeek = (dateStr: string): number => {
    if (!dateStr) return -1;
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.getDay();
  };

  const selectedDay = getSelectedDayOfWeek(selectedDate);
  const daySlots = availability.filter((a: any) => a.dayOfWeek === selectedDay);
  const selectedSlotObj = daySlots.find((s: any) => s.startTime === selectedSlotTime);
  const slotIndex = availability.findIndex((a: any) => a.dayOfWeek === selectedDay && a.startTime === selectedSlotTime);

  return (
    <div className="fixed inset-0 bg-text-primary/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-surface rounded-[24px] shadow-clay-surface max-w-md w-full max-h-[90vh] overflow-y-auto border-4 border-surface/50">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline-xl text-headline-xl text-text-primary font-extrabold">
              Book Session with {tutorName}
            </h2>
            <button
              onClick={onClose}
              type="button"
              className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-full hover:bg-surface-border"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>

          <form action="/api/book-session" method="POST" className="space-y-4">
            <input type="hidden" name="tutorId" value={tutorId} />
            <input type="hidden" name="slotIndex" value={slotIndex >= 0 ? slotIndex : 0} />
            <input type="hidden" name="startTime" value={selectedSlotTime || ""} />
            <input type="hidden" name="endTime" value={selectedSlotObj?.endTime || ""} />
            
            <div>
              <label className="block font-label-sm font-semibold mb-2 text-text-primary">
                Select Date
              </label>
              <input
                type="date"
                name="date"
                required
                min={new Date().toISOString().split("T")[0]}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlotTime(null);
                }}
                className="w-full rounded-xl border-2 border-surface-border p-3 focus:border-tertiary focus:outline-none bg-background text-text-primary"
              />
            </div>

            {selectedDate && (
              <div>
                <label className="block font-label-sm font-semibold mb-2 text-text-primary">
                  Available Time Slots
                </label>
                {daySlots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {daySlots.map((slot: any, idx: number) => {
                      const isSelected = selectedSlotTime === slot.startTime;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedSlotTime(slot.startTime)}
                          className={`p-3 rounded-xl border-2 transition-all text-left ${
                            isSelected
                              ? "border-tertiary bg-tertiary/15 text-tertiary font-bold shadow-clay-surface"
                              : "border-surface-border hover:border-surface-border/80 bg-surface"
                          }`}
                        >
                          <p className="font-label-sm">
                            {slot.startTime} - {slot.endTime}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-surface-border/50 border border-surface-border text-center">
                    <p className="text-text-muted font-body-sm">No slots available for this day of the week</p>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block font-label-sm font-semibold mb-2 text-text-primary">
                What do you need help with?
              </label>
              <textarea
                name="message"
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe what topics you'd like to cover in this session..."
                className="w-full rounded-xl border-2 border-surface-border p-3 focus:border-tertiary focus:outline-none resize-none bg-background text-text-primary"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border-2 border-surface-border text-text-muted px-4 py-3 font-label-md font-semibold hover:bg-surface-border transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending || !selectedDate || !selectedSlotTime || !message.trim()}
                className="flex-1 rounded-xl bg-tertiary text-text-primary px-4 py-3 font-label-md font-bold shadow-clay-surface border-4 border-surface/30 transform hover:scale-105 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {pending ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span>
                    <span>Booking...</span>
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
