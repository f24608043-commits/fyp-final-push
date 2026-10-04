"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
import Mascot from "@/components/Mascot";
import Link from "next/link";

export default function EditAvailabilityPage() {
  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadAvailability() {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          redirect("/sign-in");
          return;
        }

        const response = await fetch(`/api/tutor-availability?tutorId=${user.id}`);
        const data = await response.json();
        setAvailability(data.availability || []);
      } catch (error) {
        console.error("Error loading availability:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAvailability();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData(e.currentTarget);
      const response = await fetch("/api/set-availability", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        redirect("/tutoring/dashboard");
      } else {
        alert(data.error || "Failed to save availability");
      }
    } catch (error) {
      console.error("Error saving availability:", error);
      alert("Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  // Group availability by day of week
  const availabilityByDay: Record<number, any[]> = {};
  availability.forEach((slot: any) => {
    if (!availabilityByDay[slot.dayOfWeek]) {
      availabilityByDay[slot.dayOfWeek] = [];
    }
    availabilityByDay[slot.dayOfWeek].push(slot);
  });

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="w-full px-6 py-6 bg-gradient-to-br from-background via-tertiary/10 to-tertiary/10 min-h-screen">
      {/* Header */}
      <div className="relative w-full bg-tertiary rounded-3xl p-1 shadow-clay-surface overflow-hidden mb-6">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-surface/40 pointer-events-none"></div>
        <div className="relative bg-surface/95 backdrop-blur-sm rounded-[24px] p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/tutoring/dashboard" className="text-text-muted hover:text-text-muted">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </Link>
            <h1 className="font-headline-xl text-headline-xl text-text-primary font-extrabold">
              Edit Availability
            </h1>
          </div>
          <p className="font-body-md text-text-muted">
            Set your weekly availability for tutoring sessions. Learners can book sessions during these time slots.
          </p>
        </div>
      </div>

      {/* Availability Form */}
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, idx) => (
            <div key={day} className="rounded-[24px] bg-surface p-6 shadow-clay-surface border-4 border-tertiary/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-headline-md text-headline-md text-text-primary font-extrabold">
                  {day}
                </h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name={`day_${idx}_enabled`}
                    className="w-5 h-5 rounded border-surface-border text-tertiary focus:ring-tertiary"
                    defaultChecked={availabilityByDay[idx]?.length > 0}
                    onChange={(e) => {
                      const container = e.target.closest('.rounded-[24px]');
                      const slotsContainer = container?.querySelector('.slots-container');
                      if (slotsContainer) {
                        (slotsContainer as HTMLElement).style.display = e.target.checked ? 'block' : 'none';
                      }
                    }}
                  />
                  <span className="font-label-sm font-semibold text-text-primary">Available</span>
                </label>
              </div>

              <div className={`slots-container ${availabilityByDay[idx]?.length === 0 ? 'hidden' : ''}`}>
                {availabilityByDay[idx]?.map((slot: any, slotIdx: number) => (
                  <div key={slot.id} className="flex gap-3 mb-3">
                    <div className="flex-1">
                      <label className="block font-label-sm font-semibold mb-1 text-text-primary">
                        Start Time
                      </label>
                      <input
                        type="time"
                        name={`day_${idx}_slot_${slotIdx}_start`}
                        defaultValue={slot.startTime}
                        className="w-full rounded-xl border-2 border-surface-border p-3 focus:border-tertiary focus:outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block font-label-sm font-semibold mb-1 text-text-primary">
                        End Time
                      </label>
                      <input
                        type="time"
                        name={`day_${idx}_slot_${slotIdx}_end`}
                        defaultValue={slot.endTime}
                        className="w-full rounded-xl border-2 border-surface-border p-3 focus:border-tertiary focus:outline-none"
                      />
                    </div>
                  </div>
                ))}

                {availabilityByDay[idx]?.length === 0 && (
                  <div className="flex gap-3 mb-3">
                    <div className="flex-1">
                      <label className="block font-label-sm font-semibold mb-1 text-text-primary">
                        Start Time
                      </label>
                      <input
                        type="time"
                        name={`day_${idx}_slot_0_start`}
                        defaultValue="09:00"
                        className="w-full rounded-xl border-2 border-surface-border p-3 focus:border-tertiary focus:outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block font-label-sm font-semibold mb-1 text-text-primary">
                        End Time
                      </label>
                      <input
                        type="time"
                        name={`day_${idx}_slot_0_end`}
                        defaultValue="17:00"
                        className="w-full rounded-xl border-2 border-surface-border p-3 focus:border-tertiary focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="flex gap-3 pt-4">
            <Link
              href="/tutoring/dashboard"
              className="flex-1 rounded-xl border-2 border-surface-border surface text-text-muted px-4 py-3 font-label-md font-semibold hover:bg-surface transition-all text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-tertiary text-text-primary px-4 py-3 font-label-md font-bold shadow-clay-surface border-4 border-surface/30 transform hover:scale-105 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Availability"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
