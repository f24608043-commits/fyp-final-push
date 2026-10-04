import { User } from "@supabase/supabase-js";

interface SettingsProfileProps {
  profile: any;
  user: User;
}

export default function SettingsProfile({ profile, user }: SettingsProfileProps) {
  return (
    <div className="rounded-[24px] bg-surface p-6 shadow-clay-surface border border-surface-border">
      <div className="flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>person</span>
        <h2 className="font-headline-lg text-headline-lg text-text-primary font-extrabold">Profile Information</h2>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block font-label-sm font-semibold mb-2 text-text-muted uppercase tracking-wider">Display Name</label>
          <div className="px-4 py-3 bg-surface-border rounded-xl text-text-primary font-label-md">
            {profile.displayName || "Not set"}
          </div>
        </div>
        <div>
          <label className="block font-label-sm font-semibold mb-2 text-text-muted uppercase tracking-wider">Email</label>
          <div className="px-4 py-3 bg-surface-border rounded-xl text-text-primary font-label-md">
            {user.email}
          </div>
        </div>
        <div>
          <label className="block font-label-sm font-semibold mb-2 text-text-muted uppercase tracking-wider">Role</label>
          <div className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-label-sm font-semibold border border-primary/20 capitalize">
            {profile.role}
          </div>
        </div>
        <div>
          <label className="block font-label-sm font-semibold mb-2 text-text-muted uppercase tracking-wider">Avatar URL</label>
          <div className="px-4 py-3 bg-surface-border rounded-xl text-text-primary font-label-md break-all">
            {profile.avatarUrl || "Not set"}
          </div>
        </div>
      </div>
    </div>
  );
}
