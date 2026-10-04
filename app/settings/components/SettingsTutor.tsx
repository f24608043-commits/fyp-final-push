interface SettingsTutorProps {
  tutorProfile: any;
}

export default function SettingsTutor({ tutorProfile }: SettingsTutorProps) {
  return (
    <div className="rounded-[24px] bg-surface p-6 shadow-clay-surface border border-surface-border">
      <div className="flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: 'FILL 1' }}>school</span>
        <h2 className="font-headline-lg text-headline-lg text-text-primary font-extrabold">Tutor Settings</h2>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block font-label-sm font-semibold mb-2 text-text-muted uppercase tracking-wider">Bio</label>
          <div className="px-4 py-3 bg-surface-border rounded-xl text-text-primary font-label-md min-h-[80px]">
            {tutorProfile?.bio || "No bio set"}
          </div>
        </div>
        <div>
          <label className="block font-label-sm font-semibold mb-2 text-text-muted uppercase tracking-wider">Subjects</label>
          <div className="flex flex-wrap gap-2">
            {tutorProfile?.subjects?.map((subject: string, idx: number) => (
              <span key={idx} className="px-3 py-1 rounded-full bg-primary/10 text-primary font-label-sm font-semibold border border-primary/20">
                {subject}
              </span>
            )) || <span className="text-text-muted font-body-sm">No subjects listed</span>}
          </div>
        </div>
        <div>
          <label className="block font-label-sm font-semibold mb-2 text-text-muted uppercase tracking-wider">Hourly Rate</label>
          <div className="px-4 py-3 bg-surface-border rounded-xl text-text-primary font-label-md">
            {tutorProfile?.hourlyRate ? `$${tutorProfile.hourlyRate}/hour` : "Not set"}
          </div>
        </div>
        <div>
          <label className="block font-label-sm font-semibold mb-2 text-text-muted uppercase tracking-wider">Timezone</label>
          <div className="px-4 py-3 bg-surface-border rounded-xl text-text-primary font-label-md">
            {tutorProfile?.timezone || "UTC"}
          </div>
        </div>
        <div className="pt-4 border-t border-surface-border">
          <button className="px-4 py-2 rounded-full bg-primary text-text-primary font-label-md font-semibold shadow-clay-primary hover:scale-105 transition-all">
            Edit Tutor Profile
          </button>
        </div>
      </div>
    </div>
  );
}
