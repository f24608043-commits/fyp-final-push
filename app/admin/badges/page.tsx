import { getAllBadges, createBadge, updateBadge, deleteBadge } from "./actions";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function AdminBadgesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  // Check if user has admin role
  const [userProfile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!userProfile || userProfile.role !== 'admin') {
    redirect("/path");
  }

  const badges = await getAllBadges();

  return (
    <div className="w-full px-6 py-6">
      <div className="mb-6">
        <h1 className="font-headline-xl text-headline-xl text-text-primary font-extrabold mb-2">Badge Management</h1>
        <p className="font-body-md text-text-muted">Create, edit, and delete badge definitions</p>
      </div>

      {/* Create Badge Form */}
      <div className="rounded-2xl bg-surface p-6 shadow-clay-surface border border-surface-border mb-6">
        <h2 className="font-headline-md text-headline-md text-text-primary font-extrabold mb-4">Create New Badge</h2>
        <form action={async (formData) => {
          "use server";
          const data = {
            name: formData.get("name") as string,
            description: formData.get("description") as string,
            icon: formData.get("icon") as string,
            criteriaType: formData.get("criteriaType") as "first_lesson" | "lessons_completed" | "course_complete" | "streak_days" | "xp_earned",
            criteriaValue: parseInt(formData.get("criteriaValue") as string),
          };
          await createBadge(data);
        }} suppressHydrationWarning={true}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-label-md text-text-primary font-semibold mb-1">Name</label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-3 py-2 border border-surface-border rounded-xl bg-surface text-text-primary"
                placeholder="Badge name"
                suppressHydrationWarning={true}
              />
            </div>
            <div>
              <label className="block font-label-md text-text-primary font-semibold mb-1">Icon</label>
              <input
                type="text"
                name="icon"
                required
                className="w-full px-3 py-2 border border-surface-border rounded-xl bg-surface text-text-primary"
                placeholder="🏆"
                suppressHydrationWarning={true}
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block font-label-md text-text-primary font-semibold mb-1">Description</label>
            <textarea
              name="description"
              required
              className="w-full px-3 py-2 border border-surface-border rounded-xl bg-surface text-text-primary"
              rows={2}
              placeholder="Badge description"
              suppressHydrationWarning={true}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-label-md text-text-primary font-semibold mb-1">Criteria Type</label>
              <select
                name="criteriaType"
                required
                className="w-full px-3 py-2 border border-surface-border rounded-xl bg-surface text-text-primary"
                suppressHydrationWarning={true}
              >
                <option value="first_lesson">First Lesson</option>
                <option value="lessons_completed">Lessons Completed</option>
                <option value="streak_days">Streak Days</option>
                <option value="course_complete">Course Complete</option>
              </select>
            </div>
            <div>
              <label className="block font-label-md text-text-primary font-semibold mb-1">Criteria Value</label>
              <input
                type="number"
                name="criteriaValue"
                required
                className="w-full px-3 py-2 border border-surface-border rounded-xl bg-surface text-text-primary"
                placeholder="1"
                suppressHydrationWarning={true}
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-error text-white rounded-xl font-label-md font-bold shadow-clay-error hover:bg-error-dark transition-all"
          >
            Create Badge
          </button>
        </form>
      </div>

      {/* Badges List */}
      <div className="rounded-2xl bg-surface shadow-clay-surface border border-surface-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-border border-b border-surface-border">
            <tr>
              <th className="px-6 py-3 text-left font-label-md font-semibold text-text-primary">Icon</th>
              <th className="px-6 py-3 text-left font-label-md font-semibold text-text-primary">Name</th>
              <th className="px-6 py-3 text-left font-label-md font-semibold text-text-primary">Description</th>
              <th className="px-6 py-3 text-left font-label-md font-semibold text-text-primary">Criteria</th>
              <th className="px-6 py-3 text-left font-label-md font-semibold text-text-primary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {badges.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                  No badges found
                </td>
              </tr>
            ) : (
              badges.map((badge: any) => (
                <tr key={badge.id} className="border-b border-surface-border hover:bg-surface-border">
                  <td className="px-6 py-4 text-2xl">{badge.icon}</td>
                  <td className="px-6 py-4 font-label-md font-semibold text-text-primary">{badge.name}</td>
                  <td className="px-6 py-4 font-body-sm text-text-muted">{badge.description}</td>
                  <td className="px-6 py-4 font-body-sm text-text-primary">
                    {badge.criteriaType}: {badge.criteriaValue}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 bg-primary text-white rounded-lg font-body-sm font-semibold hover:bg-primary-dark transition-all"
                      >
                        Edit
                      </button>
                      <form action={async () => {
                        "use server";
                        await deleteBadge(badge.id);
                      }}>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-error text-white rounded-lg font-body-sm font-semibold hover:bg-error-dark transition-all"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 font-body-sm text-text-primary">
        Total badges: {badges.length}
      </div>
    </div>
  );
}
