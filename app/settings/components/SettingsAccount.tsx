import { User } from "@supabase/supabase-js";

interface SettingsAccountProps {
  user: User;
}

export default function SettingsAccount({ user }: SettingsAccountProps) {
  return (
    <div className="rounded-2xl bg-surface p-6 shadow-clay-surface border border-surface-border">
      <div className="flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>lock</span>
        <h2 className="font-headline-lg text-headline-lg text-text-primary font-extrabold">Account Security</h2>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block font-label-sm font-semibold mb-2 text-text-muted uppercase tracking-wider">Email</label>
          <div className="px-4 py-3 bg-surface-container rounded-xl text-text-primary font-label-md">
            {user.email}
          </div>
        </div>
        <div className="pt-4 border-t border-surface-border">
          <button className="px-4 py-2 rounded-full bg-primary text-white font-label-md font-semibold shadow-clay-primary hover:scale-105 transition-all">
            Change Password
          </button>
        </div>
        <div className="pt-4 border-t border-surface-border">
          <button className="px-4 py-2 rounded-full bg-surface border-2 border-surface-border text-text-primary font-label-md font-semibold hover:bg-surface-hover transition-all">
            Update Email
          </button>
        </div>
      </div>
    </div>
  );
}
