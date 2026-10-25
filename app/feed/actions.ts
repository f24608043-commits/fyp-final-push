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
      .select({ count: sql<number>`count(*)` })
      .from(postLikes)
      .where(eq(postLikes.postId, postId));

    revalidatePath("/feed");
    return { success: true, liked: !existingLike, count: countResult?.count || 0 };
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

export async function getFeed(cursor?: string, limit: number = 20) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    // Get user's friends (accepted friendships)
    const friendIds = await db
      .select({
        friendId: sql<string>`CASE
          WHEN requester_id = ${user.id} THEN addressee_id
          ELSE requester_id
        END`,
      })
      .from(friendships)
      .where(
        and(
          or(eq(friendships.requesterId, user.id), eq(friendships.addresseeId, user.id)),
          eq(friendships.status, "accepted")
        )
      );

    const friendIdList = friendIds.map(f => f.friendId);

    // Get user's group member IDs
    const groupMemberIds = await db
      .select({ userId: groupMembers.userId })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.userId, user.id)
        )
      );

    // Get all group IDs the user is in
    const userGroupIds = groupMemberIds.map(g => g.userId);

    // Build query: posts from friends OR posts from user's groups OR own posts
    const whereClause = and(
      eq(posts.isDeleted, false),
      or(
        eq(posts.authorId, user.id),
        friendIdList.length > 0 ? inArray(posts.authorId, friendIdList) : undefined,
        // Group posts: posts from people who share a group with the user
        userGroupIds.length > 0 ? sql`${posts.authorId} IN (
          SELECT DISTINCT gm2.user_id
          FROM group_members gm1
          JOIN group_members gm2 ON gm1.group_id = gm2.group_id
          WHERE gm1.user_id = ${user.id} AND gm2.user_id != ${user.id}
        )` : undefined,
      )
    );

    // Apply cursor if provided
    const cursorCondition = cursor
      ? sql`${posts.createdAt} < ${new Date(cursor)} OR (${posts.createdAt} = ${new Date(cursor)} AND ${posts.id} < ${cursor})`
      : undefined;

    const finalWhere = cursorCondition
      ? and(whereClause, cursorCondition)
      : whereClause;

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

    // Get like counts and user's like status for each post
    const postsWithEngagement = await Promise.all(
      feedPosts.map(async (post) => {
        const [likeCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(postLikes)
          .where(eq(postLikes.postId, post.id));

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

        const [commentCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(postComments)
          .where(eq(postComments.postId, post.id));

        // Get hashtags
        const hashtags = await db
          .select({ tag: postHashtags.tag })
          .from(postHashtags)
          .where(eq(postHashtags.postId, post.id));

        return {
          ...post,
          likeCount: likeCount?.count || 0,
          likedByMe: !!userLike,
          commentCount: commentCount?.count || 0,
          hashtags: hashtags.map(h => h.tag),
        };
      })
    );

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
    const cursorCondition = cursor
      ? sql`${postComments.createdAt} < ${new Date(cursor)} OR (${postComments.createdAt} = ${new Date(cursor)} AND ${postComments.id} < ${cursor})`
      : undefined;

    const whereClause = cursorCondition
      ? and(eq(postComments.postId, postId), cursorCondition)
      : eq(postComments.postId, postId);

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

    const nextCursor = comments.length >= limit
      ? `${comments[comments.length - 1].createdAt.toISOString()}_${comments[comments.length - 1].id}`
      : null;

    return {
      comments,
      nextCursor,
      hasMore: !!nextCursor,
    };
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    throw new Error(error.message || "Failed to fetch comments. Please try again.");
  }
}
