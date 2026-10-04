export default function SettingsPrivacy() {
  return (
    <div className="rounded-[24px] bg-surface p-6 shadow-clay-surface border border-surface-border">
      <div className="flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>privacy_tip</span>
        <h2 className="font-headline-lg text-headline-lg text-text-primary font-extrabold">Privacy Settings</h2>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-surface-border">
          <div>
            <p className="font-label-md font-semibold text-text-primary">Profile Visibility</p>
            <p className="font-body-sm text-text-muted">Control who can see your profile</p>
          </div>
          <select className="px-4 py-2 rounded-xl bg-surface-border border-2 border-surface-border font-label-md text-text-primary focus:border-primary focus:outline-none">
            <option>Everyone</option>
            <option>Friends Only</option>
            <option>Private</option>
          </select>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-surface-border">
          <div>
            <p className="font-label-md font-semibold text-text-primary">Search Visibility</p>
            <p className="font-body-sm text-text-muted">Allow others to find you in search</p>
          </div>
          <button className="w-12 h-6 rounded-full bg-primary relative transition-all">
            <span className="absolute right-1 top-1 w-4 h-4 rounded-full bg-surface"></span>
          </button>
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="font-label-md font-semibold text-text-primary">Activity Status</p>
            <p className="font-body-sm text-text-muted">Show when you're online</p>
          </div>
          <button className="w-12 h-6 rounded-full bg-primary relative transition-all">
            <span className="absolute right-1 top-1 w-4 h-4 rounded-full bg-surface"></span>
          </button>
        </div>
      </div>
    </div>
  );
}
