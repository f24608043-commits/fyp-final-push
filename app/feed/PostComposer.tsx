"use client";

import { useState, useRef } from "react";
import { createPost } from "./actions";

interface PostComposerProps {}

export default function PostComposer({}: PostComposerProps) {
  const [body, setBody] = useState("");
  const [postType, setPostType] = useState<"general" | "achievement" | "resource" | "milestone" | "question">("general");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const postTypeOptions = [
    { value: "general", label: "Share an update", icon: "edit_note" },
    { value: "achievement", label: "Celebrate achievement", icon: "emoji_events" },
    { value: "resource", label: "Share a resource", icon: "library_books" },
    { value: "milestone", label: "Milestone reached", icon: "flag" },
    { value: "question", label: "Ask a question", icon: "help" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("body", body);
      formData.append("postType", postType);
      if (mediaFile) {
        formData.append("media", mediaFile);
      }

      await createPost(formData);

      // Reset form
      setBody("");
      setPostType("general");
      setMediaFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Reload page to show new post
      window.location.reload();
    } catch (error: any) {
      console.error("Error creating post:", error);
      alert(error.message || "Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      setMediaFile(file);
    }
  };

  const remainingChars = 3000 - body.length;

  return (
    <div className="relative rounded-[24px] bg-surface p-6 shadow-clay-surface border-4 border-surface/50 mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Post Type Selector */}
        <div className="flex flex-wrap gap-2">
          {postTypeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPostType(option.value as any)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-label-sm font-semibold transition-all shadow-clay-surface ${
                postType === option.value
                  ? "bg-tertiary text-text-primary border-2 border-surface/30"
                  : "bg-surface-border text-text-muted border-2 border-surface-border hover:border-tertiary/50 hover:bg-tertiary/10"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: postType === option.value ? 'FILL 1' : 'FILL 0' }}>{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>

        {/* Text Input */}
        <div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What's on your mind? Share your learning journey..."
            rows={4}
            maxLength={3000}
            className="w-full rounded-xl border-2 border-surface/50 px-4 py-3 font-body-md text-text-primary focus:border-tertiary focus:outline-none focus:ring-2 focus:ring-tertiary/20 transition-all resize-none bg-surface"
          />
          <div className="flex justify-between items-center mt-2">
            <span className={`font-label-sm font-semibold ${
              remainingChars < 100 ? "text-error" : "text-text-muted"
            }`}>
              {remainingChars} characters remaining
            </span>
          </div>
        </div>

        {/* Media Upload */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
            id="media-upload"
          />
          <label
            htmlFor="media-upload"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-border text-text-muted font-label-sm font-semibold border-2 border-surface-border hover:border-tertiary/50 hover:bg-tertiary/10 cursor-pointer transition-all shadow-clay-surface"
          >
            <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
            {mediaFile ? mediaFile.name : "Add media"}
          </label>
          {mediaFile && (
            <button
              type="button"
              onClick={() => {
                setMediaFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="ml-2 px-3 py-1 rounded-full bg-error/10 text-error font-label-sm font-semibold border-2 border-error/20 hover:bg-error/20 transition-all"
            >
              Remove
            </button>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!body.trim() || isSubmitting}
            className="inline-flex items-center gap-2 rounded-full bg-tertiary text-text-primary px-6 py-3 font-label-md font-bold shadow-clay-surface border-2 border-surface/30 transform hover:scale-105 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
                Posting...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: 'FILL 1' }}>send</span>
                Post
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
