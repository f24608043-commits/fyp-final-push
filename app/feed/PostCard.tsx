"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { deletePost, toggleLike, addComment, deleteComment } from "./actions";
import { createClient } from "@/utils/supabase/client";
import { subscribeToPostEngagement } from "@/lib/realtime";

interface FeedPost {
  id: string;
  authorId: string;
  body: string;
  mediaUrls: string[] | null;
  postType: "general" | "achievement" | "resource" | "milestone" | "question";
  referenceBadgeId: string | null;
  createdAt: Date;
  author: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
    role: "learner" | "tutor" | "admin";
  };
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  hashtags: string[];
}

interface PostCardProps {
  post: FeedPost;
  onDeleted: (postId: string) => void;
  onLikeToggle: (postId: string, newCount: number, liked: boolean) => void;
  onCommentCountChange: (postId: string, newCount: number) => void;
}

export default function PostCard({ post, onDeleted, onLikeToggle, onCommentCountChange }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  // Subscribe to real-time likes and comments
  useEffect(() => {
    const unsubscribe = subscribeToPostEngagement(
      post.id,
      // onLikeChange
      async (like) => {
        // Refresh like count from server
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch new like count
        const { db } = await import("@/db");
        const { postLikes, eq, sql } = await import("@/db/schema");
        const [countResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(postLikes)
          .where(eq(postLikes.postId, post.id));

        // Check if current user liked
        const { and, eq } = await import("drizzle-orm");
        const [userLike] = await db
          .select()
          .from(postLikes)
          .where(
            and(
              eq(postLikes.postId, post.id),
              eq(postLikes.userId, user.id)
            )
          )
          .limit(1);

        onLikeToggle(post.id, countResult?.count || 0, !!userLike);
      },
      // onCommentChange
      async (comment) => {
        if (comment) {
          // Refresh comments if visible
          if (showComments) {
            await loadComments();
          }
          // Update comment count
          onCommentCountChange(post.id, post.commentCount + 1);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [post.id, showComments]);

  const handleLike = async () => {
    try {
      const result = await toggleLike(post.id);
      onLikeToggle(post.id, result.count, result.liked);
    } catch (error: any) {
      console.error("Error toggling like:", error);
      alert(error.message || "Failed to toggle like");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    setIsDeleting(true);
    try {
      await deletePost(post.id);
      onDeleted(post.id);
    } catch (error: any) {
      console.error("Error deleting post:", error);
      alert(error.message || "Failed to delete post");
      setIsDeleting(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      await addComment(post.id, commentBody);
      setCommentBody("");
      onCommentCountChange(post.id, post.commentCount + 1);

      // Reload comments if they're visible
      if (showComments) {
        loadComments();
      }
    } catch (error: any) {
      console.error("Error adding comment:", error);
      alert(error.message || "Failed to add comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const loadComments = async () => {
    try {
      const { getPostComments } = await import("./actions");
      const result = await getPostComments(post.id);
      setComments(result.comments);
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  const toggleComments = async () => {
    setShowComments(!showComments);
    if (!showComments && comments.length === 0) {
      await loadComments();
    }
  };

  const formatBody = (body: string) => {
    // Convert hashtags to links
    const hashtagRegex = /#(\w+)/g;
    return body.replace(
      hashtagRegex,
      '<a href="/feed/tag/$1" class="text-tertiary hover:underline font-semibold">#$1</a>'
    );
  };

  const getPostTypeIcon = () => {
    switch (post.postType) {
      case "achievement":
        return "emoji_events";
      case "resource":
        return "library_books";
      case "milestone":
        return "flag";
      case "question":
        return "help";
      default:
        return "edit_note";
    }
  };

  const getPostTypeColor = () => {
    switch (post.postType) {
      case "achievement":
        return "bg-tertiary/10 text-tertiary border-tertiary/30";
      case "resource":
        return "bg-primary/10 text-primary border-primary/30";
      case "milestone":
        return "bg-success/10 text-success border-success/30";
      case "question":
        return "bg-warning/10 text-warning border-warning/30";
      default:
        return "bg-surface-border text-text-muted border-surface-border";
    }
  };

  const isOwnPost = currentUser?.id === post.authorId;

  return (
    <div className="rounded-[24px] bg-surface p-6 shadow-clay-surface border border-surface-border">
      {/* Post Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {post.author.avatarUrl ? (
            <Image
              src={post.author.avatarUrl}
              alt={post.author.displayName || "User"}
              width={48}
              height={48}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-surface-border flex items-center justify-center">
              <span className="material-symbols-outlined text-text-muted text-[24px]">person</span>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-label-md font-bold text-text-primary">
                {post.author.displayName || "Anonymous"}
              </h3>
              <span className={`px-2 py-0.5 rounded-full font-label-xs font-semibold border ${getPostTypeColor()}`}>
                <span className="material-symbols-outlined text-[14px] align-middle mr-1">
                  {getPostTypeIcon()}
                </span>
                {post.postType}
              </span>
            </div>
            <p className="font-body-sm text-text-muted">
              {new Date(post.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        {isOwnPost && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 rounded-full bg-error/10 text-error hover:bg-error/20 transition-all disabled:opacity-50"
            title="Delete post"
          >
            {isDeleting ? (
              <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
            ) : (
              <span className="material-symbols-outlined text-[20px]">delete</span>
            )}
          </button>
        )}
      </div>

      {/* Post Body */}
      <div
        className="font-body-md text-text-primary mb-4 whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: formatBody(post.body) }}
      />

      {/* Media */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <div className="mb-4 space-y-2">
          {post.mediaUrls.map((url, idx) => (
            <div key={idx} className="rounded-xl overflow-hidden border-2 border-surface-border">
              {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <Image
                  src={url}
                  alt={`Post media ${idx + 1}`}
                  width={800}
                  height={400}
                  className="w-full object-cover"
                />
              ) : (
                <video controls className="w-full">
                  <source src={url} />
                  Your browser does not support video.
                </video>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Engagement Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-surface-border">
        <button
          onClick={handleLike}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-label-sm font-semibold transition-all ${
            post.likedByMe
              ? "bg-tertiary text-text-primary shadow-clay-surface border-2 border-surface/30"
              : "bg-surface-border text-text-muted border-2 border-surface-border hover:border-tertiary/50"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {post.likedByMe ? "favorite" : "favorite_border"}
          </span>
          {post.likeCount}
        </button>

        <button
          onClick={toggleComments}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-border text-text-muted font-label-sm font-semibold border-2 border-surface-border hover:border-tertiary/50 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
          {post.commentCount}
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-surface-border">
          {/* Comment Form */}
          <form onSubmit={handleSubmitComment} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Write a comment..."
                maxLength={1000}
                className="flex-1 rounded-xl border-2 border-surface-border px-4 py-2 font-body-md text-text-primary focus:border-tertiary focus:outline-none bg-surface"
              />
              <button
                type="submit"
                disabled={!commentBody.trim() || isSubmittingComment}
                className="px-4 py-2 rounded-full bg-tertiary text-text-primary font-label-sm font-bold shadow-clay-surface border-2 border-surface/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingComment ? "..." : "Post"}
              </button>
            </div>
          </form>

          {/* Comments List */}
          {comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  {comment.author?.avatarUrl ? (
                    <Image
                      src={comment.author.avatarUrl}
                      alt={comment.author.displayName || "User"}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-surface-border flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-text-muted text-[16px]">person</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-label-sm font-bold text-text-primary">
                        {comment.author?.displayName || "Anonymous"}
                      </span>
                      <span className="font-body-xs text-text-muted">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="font-body-sm text-text-primary">{comment.body}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-body-sm text-text-muted text-center py-4">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
