import { getAllUsers, changeUserRole } from "./actions";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  // Check if user has admin role first
  let userProfile = null;
  try {
    const [profileResult] = await db
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);
    userProfile = profileResult;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // Don't redirect on error, show page with error message instead
    userProfile = null;
  }

  if (!userProfile || userProfile.role !== 'admin') {
    return (
      <div className="w-full px-6 py-6 bg-gradient-to-br from-background via-tertiary/10 to-tertiary/10 min-h-screen">
        <div className="max-w-md mx-auto mt-20 p-6 bg-error/10 border-2 border-error/30 rounded-xl">
          <h1 className="text-xl font-bold text-error mb-2">Access Denied</h1>
          <p className="text-error">You must be an admin to access this page.</p>
        </div>
      </div>
    );
  }

  const resolvedSearchParams = await searchParams;
  const searchQuery = resolvedSearchParams.q || "";
  let users: any[] = [];
  try {
    users = await getAllUsers(searchQuery);
  } catch (error) {
    console.error('Error fetching users in page:', error);
    users = [];
  }

  return (
    <div className="w-full px-6 py-6 bg-gradient-to-br from-background via-tertiary/10 to-tertiary/10 min-h-screen">
      <div className="mb-6">
        <h1 className="font-headline-xl text-headline-xl text-text-primary font-extrabold mb-2">User Management 👥</h1>
        <p className="font-body-md text-text-muted">View and manage user roles</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <form method="GET">
          <input
            type="text"
            name="q"
            placeholder="Search users by name or role..."
            defaultValue={searchQuery}
            className="w-full max-w-md px-4 py-2 border-4 border-tertiary/30 rounded-xl bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-tertiary focus:border-tertiary shadow-clay-surface"
            suppressHydrationWarning={true}
          />
          <button
            type="submit"
            className="ml-2 px-4 py-2 bg-tertiary text-text-primary rounded-xl font-label-md font-semibold shadow-clay-surface border-4 border-surface/30 transform hover:scale-105 transition-all active:scale-95"
          >
            Search
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="rounded-[24px] bg-gradient-to-br from-surface to-tertiary/10 shadow-clay-surface border-4 border-tertiary/30 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-tertiary border-b-4 border-tertiary/30">
            <tr>
              <th className="px-6 py-3 text-left font-label-md font-semibold text-text-primary">Name</th>
              <th className="px-6 py-3 text-left font-label-md font-semibold text-text-primary">Role</th>
              <th className="px-6 py-3 text-left font-label-md font-semibold text-text-primary">XP</th>
              <th className="px-6 py-3 text-left font-label-md font-semibold text-text-primary">Streak</th>
              <th className="px-6 py-3 text-left font-label-md font-semibold text-text-primary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user: any) => (
                <tr key={user.id} className="border-b-4 border-tertiary/30 hover:bg-tertiary/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-label-md font-semibold text-text-primary">{user.displayName || "Anonymous"}</div>
                    <div className="font-body-sm text-text-muted">{user.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full font-body-sm font-semibold border-2 ${
                        user.role === "admin"
                          ? "bg-gradient-to-r from-error to-secondary text-text-primary border-surface/30"
                          : user.role === "tutor"
                          ? "bg-tertiary text-text-primary border-surface/30"
                          : "bg-tertiary text-text-primary border-surface/30"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-body-sm text-text-primary">{user.xp || 0}</td>
                  <td className="px-6 py-4 font-body-sm text-text-primary">{user.streakCount || 0} days</td>
                  <td className="px-6 py-4">
                    <form action={async (formData) => {
                      "use server";
                      const newRole = formData.get("role") as "learner" | "tutor" | "admin";
                      await changeUserRole(user.id, newRole);
                    }} suppressHydrationWarning={true}>
                      <select
                        name="role"
                        defaultValue={user.role}
                        className="px-3 py-1 border border-surface-border rounded-lg bg-surface text-text-primary font-body-sm mr-2"
                        suppressHydrationWarning={true}
                      >
                        <option value="learner">Learner</option>
                        <option value="tutor">Tutor</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-text-primary text-surface rounded-lg font-body-sm font-semibold hover:bg-surface-border transition-all"
                      >
                        Change
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      <div className="mt-4 font-body-sm text-text-primary">
        Total users: {users.length}
      </div>
    </div>
  );
}
