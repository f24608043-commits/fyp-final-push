"use server";

import { db } from "@/db";
import { posts, postLikes, postComments, postHashtags, profiles, friendships, groupMembers } from "@/db/schema";
import { eq, and, desc, or, inArray, sql } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Helper: Parse hashtags from body
function parseHashtags(body: string): string[] {
  const hashtagRegex = /#(\w+)/g;
  const hashtags = new Set<string>();
  let match;
  while ((match = hashtagRegex.exec(body)) !== null) {
    hashtags.add(match[1].toLowerCase());
  }
  return Array.from(hashtags);
}

// Helper: Upload media to Supabase Storage
async function uploadMedia(file: File, userId: string, postId: string): Promise<string> {
  const supabase = await createClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${postId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('post-media')
    .upload(filePath, file);

  if (error) {
    throw new Error(`Failed to upload media: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('post-media')
    .getPublicUrl(filePath);

  return publicUrl;
}

export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const body = formData.get("body") as string;
  const postType = formData.get("postType") as "general" | "achievement" | "resource" | "milestone" | "question";
  const referenceBadgeId = formData.get("referenceBadgeId") as string | null;
  const mediaFile = formData.get("media") as File | null;

  if (!body || body.trim().length === 0) {
    throw new Error("Post body is required");
  }

  if (body.length > 3000) {
    throw new Error("Post body must be 3000 characters or less");
  }

  try {
    // Create the post
    const [post] = await db
      .insert(posts)
      .values({
        authorId: user.id,
        body: body.trim(),
        postType: postType || "general",
        referenceBadgeId: referenceBadgeId || null,
      })
      .returning();

    // Upload media if provided
    let mediaUrls: string[] = [];
    if (mediaFile && mediaFile.size > 0) {
      const publicUrl = await uploadMedia(mediaFile, user.id, post.id);
      mediaUrls.push(publicUrl);

      await db
        .update(posts)
        .set({ mediaUrls })
        .where(eq(posts.id, post.id));
    }

    // Parse and insert hashtags
    const hashtags = parseHashtags(body);
    if (hashtags.length > 0) {
      await db.insert(postHashtags).values(
        hashtags.map(tag => ({
          postId: post.id,
          tag,
        }))
      );
    }

    revalidatePath("/feed");
    return { success: true, postId: post.id };
  } catch (error: any) {
    console.error("Error creating post:", error);
    throw new Error(error.message || "Failed to create post. Please try again.");
  }
}

export async function deletePost(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    // Verify user is the author
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      throw new Error("Post not found");
    }

    if (post.authorId !== user.id) {
      throw new Error("You can only delete your own posts");
    }

    // Soft delete
    await db
      .update(posts)
      .set({ isDeleted: true })
      .where(eq(posts.id, postId));

    revalidatePath("/feed");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting post:", error);
    throw new Error(error.message || "Failed to delete post. Please try again.");
  }
}

export async function toggleLike(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    // Check if already liked
    const [existingLike] = await db
      .select()
      .from(postLikes)
      .where(
        and(
          eq(postLikes.postId, postId),
          eq(postLikes.userId, user.id)
        )
      )
      .limit(1);

    if (existingLike) {
      // Unlike
      await db
        .delete(postLikes)
        .where(
          and(
            eq(postLikes.postId, postId),
            eq(postLikes.userId, user.id)
          )
        );
    } else {
      // Like
      await db.insert(postLikes).values({
        postId,
        userId: user.id,
      });
    }

    // Get new like count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(postLikes)
      .where(eq(postLikes.postId, postId));

    revalidatePath("/feed");
    return { success: true, liked: !existingLike, count: Number(countResult?.count) || 0 };
  } catch (error: any) {
    console.error("Error toggling like:", error);
    throw new Error(error.message || "Failed to toggle like. Please try again.");
  }
}

export async function addComment(postId: string, body: string, parentCommentId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (!body || body.trim().length === 0) {
    throw new Error("Comment body is required");
  }

  if (body.length > 1000) {
    throw new Error("Comment must be 1000 characters or less");
  }

  try {
    const [comment] = await db
      .insert(postComments)
      .values({
        postId,
        authorId: user.id,
        body: body.trim(),
        parentCommentId: parentCommentId || null,
      })
      .returning();

    revalidatePath("/feed");
    return { success: true, commentId: comment.id };
  } catch (error: any) {
    console.error("Error adding comment:", error);
    throw new Error(error.message || "Failed to add comment. Please try again.");
  }
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    // Verify user is the author
    const [comment] = await db
      .select()
      .from(postComments)
      .where(eq(postComments.id, commentId))
      .limit(1);

    if (!comment) {
      throw new Error("Comment not found");
    }

    if (comment.authorId !== user.id) {
      throw new Error("You can only delete your own comments");
    }

    await db
      .delete(postComments)
      .where(eq(postComments.id, commentId));

    revalidatePath("/feed");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting comment:", error);
    throw new Error(error.message || "Failed to delete comment. Please try again.");
  }
}

export async function getFeed(cursor?: string, limit: number = 20, tag?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    // 1. Get user's friends (accepted friendships)
    let friendIdList: string[] = [];
    try {
      const friendIds = await db
        .select({
          friendId: sql<string>`CASE
            WHEN ${friendships.requesterId} = ${user.id} THEN ${friendships.addresseeId}
            ELSE ${friendships.requesterId}
          END`,
        })
        .from(friendships)
        .where(
          and(
            or(eq(friendships.requesterId, user.id), eq(friendships.addresseeId, user.id)),
            eq(friendships.status, "accepted")
          )
        );

      friendIdList = friendIds.map((f) => f.friendId).filter(Boolean);
    } catch (err) {
      console.warn("Notice: friendships query failed or table not ready, defaulting to empty:", err);
      friendIdList = [];
    }

    // 2. Get user's group IDs
    let userGroupIds: string[] = [];
    try {
      const groupMemberRows = await db
        .select({ groupId: groupMembers.groupId })
        .from(groupMembers)
        .where(eq(groupMembers.userId, user.id));

      userGroupIds = groupMemberRows.map((g) => g.groupId).filter(Boolean);
    } catch (err) {
      console.warn("Notice: group_members query failed or table not ready, defaulting to empty:", err);
      userGroupIds = [];
    }

    // 3. Build visibility conditions: own posts OR friends' posts OR group peers' posts
    const visibilityConditions = [eq(posts.authorId, user.id)];
    if (friendIdList.length > 0) {
      visibilityConditions.push(inArray(posts.authorId, friendIdList));
    }
    if (userGroupIds.length > 0) {
      visibilityConditions.push(
        sql`${posts.authorId} IN (
          SELECT DISTINCT gm2.user_id
          FROM group_members gm2
          WHERE gm2.group_id IN (${sql.join(userGroupIds.map(id => sql`${id}::uuid`), sql`, `)})
          AND gm2.user_id != ${user.id}
        )`
      );
    }

    const whereConditions = [
      eq(posts.isDeleted, false),
      or(...visibilityConditions),
    ];

    // Optional hashtag filtering
    if (tag) {
      const cleanTag = tag.trim().toLowerCase().replace(/^#/, "");
      whereConditions.push(
        sql`EXISTS (
          SELECT 1 FROM post_hashtags ph
          WHERE ph.post_id = ${posts.id} AND LOWER(ph.tag) = ${cleanTag}
        )`
      );
    }

    // Apply cursor pagination if provided
    if (cursor) {
      const parts = cursor.split("_");
      if (parts.length >= 2) {
        const cursorDateStr = parts[0];
        const cursorId = parts.slice(1).join("_");
        const cursorDate = new Date(cursorDateStr);
        if (!isNaN(cursorDate.getTime())) {
          whereConditions.push(
            sql`(${posts.createdAt} < ${cursorDate} OR (${posts.createdAt} = ${cursorDate} AND ${posts.id} < ${cursorId}::uuid))`
          );
        }
      }
    }

    const finalWhere = and(...whereConditions);

    // Fetch posts
    const feedPosts = await db
      .select({
        id: posts.id,
        authorId: posts.authorId,
        body: posts.body,
        mediaUrls: posts.mediaUrls,
        postType: posts.postType,
        referenceBadgeId: posts.referenceBadgeId,
        createdAt: posts.createdAt,
        author: {
          id: profiles.id,
          displayName: profiles.displayName,
          avatarUrl: profiles.avatarUrl,
          role: profiles.role,
        },
      })
      .from(posts)
      .leftJoin(profiles, eq(posts.authorId, profiles.id))
      .where(finalWhere)
      .orderBy(desc(posts.createdAt), desc(posts.id))
      .limit(limit);

    if (feedPosts.length === 0) {
      return { posts: [], nextCursor: null, hasMore: false };
    }

    const postIds = feedPosts.map((p) => p.id);

    // Batch query engagement for all posts concurrently in 4 fast queries instead of 4*N
    const [likeCounts, userLikes, commentCounts, hashtags] = await Promise.all([
      db
        .select({
          postId: postLikes.postId,
          count: sql<number>`count(*)::int`,
        })
        .from(postLikes)
        .where(inArray(postLikes.postId, postIds))
        .groupBy(postLikes.postId)
        .catch(() => []),
      db
        .select({ postId: postLikes.postId })
        .from(postLikes)
        .where(and(inArray(postLikes.postId, postIds), eq(postLikes.userId, user.id)))
        .catch(() => []),
      db
        .select({
          postId: postComments.postId,
          count: sql<number>`count(*)::int`,
        })
        .from(postComments)
        .where(inArray(postComments.postId, postIds))
        .groupBy(postComments.postId)
        .catch(() => []),
      db
        .select({
          postId: postHashtags.postId,
          tag: postHashtags.tag,
        })
        .from(postHashtags)
        .where(inArray(postHashtags.postId, postIds))
        .catch(() => []),
    ]);

    const likeCountMap = new Map(likeCounts.map((l) => [l.postId, Number(l.count) || 0]));
    const userLikeSet = new Set(userLikes.map((l) => l.postId));
    const commentCountMap = new Map(commentCounts.map((c) => [c.postId, Number(c.count) || 0]));
    const hashtagMap = new Map<string, string[]>();
    for (const h of hashtags) {
      if (!hashtagMap.has(h.postId)) hashtagMap.set(h.postId, []);
      hashtagMap.get(h.postId)!.push(h.tag);
    }

    const postsWithEngagement = feedPosts.map((post) => ({
      ...post,
      author: post.author?.id ? post.author : {
        id: post.authorId,
        displayName: "Learner",
        avatarUrl: null,
        role: "learner" as const,
      },
      likeCount: likeCountMap.get(post.id) || 0,
      likedByMe: userLikeSet.has(post.id),
      commentCount: commentCountMap.get(post.id) || 0,
      hashtags: hashtagMap.get(post.id) || [],
    }));

    // Determine next cursor
    const nextCursor = feedPosts.length >= limit
      ? `${feedPosts[feedPosts.length - 1].createdAt.toISOString()}_${feedPosts[feedPosts.length - 1].id}`
      : null;

    return {
      posts: postsWithEngagement,
      nextCursor,
      hasMore: !!nextCursor,
    };
  } catch (error: any) {
    console.error("Error fetching feed:", error);
    throw new Error(error.message || "Failed to fetch feed. Please try again.");
  }
}

export async function getPostComments(postId: string, cursor?: string, limit: number = 20) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    const whereConditions = [eq(postComments.postId, postId)];

    if (cursor) {
      const parts = cursor.split("_");
      if (parts.length >= 2) {
        const cursorDateStr = parts[0];
        const cursorId = parts.slice(1).join("_");
        const cursorDate = new Date(cursorDateStr);
        if (!isNaN(cursorDate.getTime())) {
          whereConditions.push(
            sql`(${postComments.createdAt} < ${cursorDate} OR (${postComments.createdAt} = ${cursorDate} AND ${postComments.id} < ${cursorId}::uuid))`
          );
        }
      }
    }

    const whereClause = and(...whereConditions);

    const comments = await db
      .select({
        id: postComments.id,
        body: postComments.body,
        parentCommentId: postComments.parentCommentId,
        createdAt: postComments.createdAt,
        author: {
          id: profiles.id,
          displayName: profiles.displayName,
          avatarUrl: profiles.avatarUrl,
        },
      })
      .from(postComments)
      .leftJoin(profiles, eq(postComments.authorId, profiles.id))
      .where(whereClause)
      .orderBy(desc(postComments.createdAt), desc(postComments.id))
      .limit(limit);

    const safeComments = comments.map(c => ({
      ...c,
      author: c.author?.id ? c.author : {
        id: "",
        displayName: "User",
        avatarUrl: null,
      },
    }));

    const nextCursor = comments.length >= limit
      ? `${comments[comments.length - 1].createdAt.toISOString()}_${comments[comments.length - 1].id}`
      : null;

    return {
      comments: safeComments,
      nextCursor,
      hasMore: !!nextCursor,
    };
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    throw new Error(error.message || "Failed to fetch comments. Please try again.");
  }
}
