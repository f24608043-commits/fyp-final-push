import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { conversations, conversationMembers, messages, profiles } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { otherUserId, sessionId } = body;

  if (!otherUserId) {
    return NextResponse.json({ error: "otherUserId is required" }, { status: 400 });
  }

  try {
    // Find or create conversation between users
    const ids = [user.id, otherUserId].sort();
    const directKey = `${ids[0]}-${ids[1]}`;

    let [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.directKey, directKey))
      .limit(1);

    if (!conversation) {
      // Create conversation
      [conversation] = await db
        .insert(conversations)
        .values({
          type: "direct",
          directKey,
          createdBy: user.id,
        })
        .returning();

      // Add both participants
      await db.insert(conversationMembers).values([
        { conversationId: conversation.id, userId: user.id, role: "member" },
        { conversationId: conversation.id, userId: otherUserId, role: "member" },
      ]);
    }

    // Get messages
    const conversationMessages = await db
      .select({
        id: messages.id,
        content: messages.body,
        createdAt: messages.createdAt,
        sender: {
          id: profiles.id,
          displayName: profiles.displayName,
          avatarUrl: profiles.avatarUrl,
        },
      })
      .from(messages)
      .innerJoin(profiles, eq(messages.senderId, profiles.id))
      .where(eq(messages.conversationId, conversation.id))
      .orderBy(desc(messages.createdAt))
      .limit(50);

    // Mark as "current" for current user
    const messagesWithSender = conversationMessages.map((msg) => ({
      ...msg,
      sender: {
        ...msg.sender,
        id: msg.sender.id === user.id ? "current" : msg.sender.id,
      },
    }));

    return NextResponse.json({ 
      conversationId: conversation.id,
      messages: messagesWithSender.reverse() 
    });
  } catch (error: any) {
    console.error("Error loading messages:", error);
    return NextResponse.json({ error: error.message || "Failed to load messages" }, { status: 500 });
  }
}
