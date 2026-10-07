"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
import Mascot from "@/components/Mascot";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function EditProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          redirect("/sign-in");
          return;
        }

        const response = await fetch(`/api/tutor-profile?tutorId=${user.id}`);
        const data = await response.json();
        setProfile(data.profile);
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData(e.currentTarget);
      const response = await fetch("/api/update-tutor-profile", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        redirect("/tutoring/dashboard");
      } else {
        alert("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full px-6 py-6">
        <div className="rounded-[24px] bg-surface p-6 shadow-clay-surface border-4 border-tertiary/30">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="mt-4 h-4 w-96 max-w-full" />
        </div>
        <div className="mx-auto mt-6 max-w-4xl space-y-6">
          {["Profile Information", "Teaching Details", "Availability"].map((section) => (
            <div key={section} className="rounded-[24px] bg-surface p-6 shadow-clay-surface border-4 border-tertiary/30">
              <Skeleton className="h-6 w-48" />
              <div className="mt-4 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-6 bg-gradient-to-br from-background via-tertiary/10 to-tertiary/10 min-h-screen">
      {/* Header */}
      <div className="relative w-full bg-gradient-to-br from-tertiary via-tertiary to-error rounded-3xl p-1 shadow-clay-surface overflow-hidden mb-6">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-surface/40 pointer-events-none"></div>
        <div className="relative bg-surface/95 backdrop-blur-sm rounded-[24px] p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/tutoring/dashboard" className="text-text-muted hover:text-text-muted">
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </Link>
            <h1 className="font-headline-xl text-headline-xl text-text-primary font-extrabold">
              Edit Tutor Profile
            </h1>
          </div>
          <p className="font-body-md text-text-muted">
            Update your tutor profile information to help learners find you.
          </p>
        </div>
      </div>

      {/* Profile Form */}
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-[24px] bg-surface p-6 shadow-clay-surface border-4 border-tertiary/30">
            <div className="space-y-4">
              <div>
                <label className="block font-label-sm font-semibold mb-1 text-text-primary">
                  Bio
                </label>
                <textarea 
                  name="bio" 
                  required
                  defaultValue={profile?.bio || ""}
                  className="w-full rounded-xl border-2 border-surface-border p-3 focus:border-tertiary focus:outline-none"
                  placeholder="Describe your teaching experience..."
                  rows={4}
                />
              </div>
              <div>
                <label className="block font-label-sm font-semibold mb-1 text-text-primary">
                  Subjects (comma-separated)
                </label>
                <input 
                  type="text" 
                  name="subjects"
                  required
                  defaultValue={profile?.subjects?.join(", ") || ""}
                  className="w-full rounded-xl border-2 border-surface-border p-3 focus:border-tertiary focus:outline-none"
                  placeholder="Math, Science, Python"
                />
              </div>
              <div>
                <label className="block font-label-sm font-semibold mb-1 text-text-primary">
                  Hourly Rate (leave blank for free)
                </label>
                <input 
                  type="number" 
                  name="hourlyRate"
                  defaultValue={profile?.hourlyRate || ""}
                  className="w-full rounded-xl border-2 border-surface-border p-3 focus:border-tertiary focus:outline-none"
                  placeholder="25"
                />
              </div>
              <div>
                <label className="block font-label-sm font-semibold mb-1 text-text-primary">
                  Timezone
                </label>
                <input 
                  type="text" 
                  name="timezone"
                  required
                  defaultValue={profile?.timezone || "UTC"}
                  className="w-full rounded-xl border-2 border-surface-border p-3 focus:border-tertiary focus:outline-none"
                  placeholder="UTC"
                />
              </div>
            </div>
          </div>

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
             {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
