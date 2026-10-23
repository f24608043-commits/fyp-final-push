"use client";

import { useState, useEffect, useRef } from "react";
import PostCard from "./PostCard";
import { getFeed } from "./actions";

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
  } | null;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  hashtags: string[];
}

interface FeedListProps {
  initialPosts: FeedPost[];
  nextCursor: string | null;
}

export default function FeedList({ initialPosts, nextCursor }: FeedListProps) {
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [cursor, setCursor] = useState<string | null>(nextCursor);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(!!nextCursor);
  const observerRef = useRef<HTMLDivElement>(null);

  const loadMore = async () => {
    if (isLoading || !cursor || !hasMore) return;

    setIsLoading(true);
    try {
      const result = await getFeed(cursor, 20);
      setPosts((prev) => [...prev, ...result.posts]);
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error("Error loading more posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [cursor, hasMore, isLoading]);

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  const handleLikeToggle = (postId: string, newCount: number, liked: boolean) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, likeCount: newCount, likedByMe: liked }
          : post
      )
    );
  };

  const handleCommentCountChange = (postId: string, newCount: number) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, commentCount: newCount }
          : post
      )
    );
  };

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onDeleted={handlePostDeleted}
          onLikeToggle={handleLikeToggle}
          onCommentCountChange={handleCommentCountChange}
        />
      ))}

      {isLoading && (
        <div className="text-center py-8">
          <span className="material-symbols-outlined text-tertiary text-[32px] animate-spin">refresh</span>
          <p className="font-body-md text-text-muted mt-2">Loading more posts...</p>
        </div>
      )}

      {hasMore && <div ref={observerRef} className="h-4" />}

      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8">
          <p className="font-body-md text-text-muted">You're all caught up!</p>
        </div>
      )}
    </div>
  );
}
