import { createCourse } from "./actions";

export default function NewCoursePage() {
  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-text-muted">New Course</h1>
        <p className="mt-1 text-sm text-text-muted">
          Fill in the details below. You can add units and lessons after saving.
        </p>
      </div>

      <form action={createCourse} className="rounded-[24px] border border-surface-border bg-surface p-6 shadow-clay-surface space-y-5">
        <div>
          <label className="block text-sm font-semibold text-text-muted mb-1" htmlFor="title">
            Course Title <span className="text-error">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="e.g. Python Programming"
            className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-tertiary focus:outline-none focus:ring-1 focus:ring-tertiary"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text-muted mb-1" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="A brief description of what learners will achieve"
            className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-tertiary focus:outline-none focus:ring-1 focus:ring-tertiary"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text-muted mb-1" htmlFor="coverUrl">
            Cover Image URL (optional)
          </label>
          <input
            id="coverUrl"
            name="coverUrl"
            type="url"
            placeholder="https://..."
            className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-tertiary focus:outline-none focus:ring-1 focus:ring-tertiary"
          />
        </div>

        {/* Open Source Content Import Section */}
        <div className="border-t border-surface-border pt-5">
          <h3 className="text-sm font-bold text-text-muted mb-3">Import from Open Source Content</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-text-muted mb-1" htmlFor="youtubeUrl">
                YouTube Playlist URL
              </label>
              <input
                id="youtubeUrl"
                name="youtubeUrl"
                type="url"
                placeholder="https://www.youtube.com/playlist?list=..."
                className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-tertiary focus:outline-none focus:ring-1 focus:ring-tertiary"
              />
              <p className="mt-1 text-xs text-text-muted">
                Import videos from a YouTube playlist as lessons
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-muted mb-1" htmlFor="youtubeVideoIds">
                YouTube Video IDs (comma-separated)
              </label>
              <input
                id="youtubeVideoIds"
                name="youtubeVideoIds"
                type="text"
                placeholder="dQw4w9WgXcQ, abc123def456"
                className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-tertiary focus:outline-none focus:ring-1 focus:ring-tertiary"
              />
              <p className="mt-1 text-xs text-text-muted">
                Add specific YouTube videos as lessons
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="isPublished"
            name="isPublished"
            type="checkbox"
            className="h-4 w-4 rounded border-surface-border text-tertiary focus:ring-tertiary"
          />
          <label htmlFor="isPublished" className="text-sm font-medium text-text-muted">
            Publish immediately (visible to learners)
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-surface-border pt-4">
          <a
            href="/admin"
            className="rounded-lg border border-surface-border px-4 py-2 text-sm font-semibold text-text-muted hover:bg-surface"
          >
            Cancel
          </a>
          <button
            type="submit"
            className="rounded-lg bg-tertiary px-5 py-2 text-sm font-bold text-text-primary shadow hover:bg-tertiary"
          >
            Create Course →
          </button>
        </div>
      </form>
    </div>
  );
}
