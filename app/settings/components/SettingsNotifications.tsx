export default function SettingsNotifications() {
  return (
    <div className="rounded-[24px] bg-surface p-6 shadow-clay-surface border border-surface-border">
      <div className="flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>notifications</span>
        <h2 className="font-headline-lg text-headline-lg text-text-primary font-extrabold">Notification Preferences</h2>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-surface-border">
          <div>
            <p className="font-label-md font-semibold text-text-primary">Email Notifications</p>
            <p className="font-body-sm text-text-muted">Receive notifications via email</p>
          </div>
          <button className="w-12 h-6 rounded-full bg-primary relative transition-all">
            <span className="absolute right-1 top-1 w-4 h-4 rounded-full bg-surface"></span>
          </button>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-surface-border">
          <div>
            <p className="font-label-md font-semibold text-text-primary">Push Notifications</p>
            <p className="font-body-sm text-text-muted">Receive in-app notifications</p>
          </div>
          <button className="w-12 h-6 rounded-full bg-primary relative transition-all">
            <span className="absolute right-1 top-1 w-4 h-4 rounded-full bg-surface"></span>
          </button>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-surface-border">
          <div>
            <p className="font-label-md font-semibold text-text-primary">Message Notifications</p>
            <p className="font-body-sm text-text-muted">Get notified for new messages</p>
          </div>
          <button className="w-12 h-6 rounded-full bg-primary relative transition-all">
            <span className="absolute right-1 top-1 w-4 h-4 rounded-full bg-surface"></span>
          </button>
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="font-label-md font-semibold text-text-primary">Assignment Reminders</p>
            <p className="font-body-sm text-text-muted">Get reminded about upcoming deadlines</p>
          </div>
          <button className="w-12 h-6 rounded-full bg-surface border-2 border-surface-border relative transition-all">
            <span className="absolute left-1 top-1 w-4 h-4 rounded-full surface-border"></span>
          </button>
        </div>
      </div>
    </div>
  );
}
