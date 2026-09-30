import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { conversations, conversationMembers, messages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
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
  const { otherUserId, content, sessionId } = body;

  if (!otherUserId || !content) {
    return NextResponse.json({ error: "otherUserId and content are required" }, { status: 400 });
  }

  if (!content.trim()) {
    return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
  }

  try {
    // Find conversation between users
    const ids = [user.id, otherUserId].sort();
    const directKey = `${ids[0]}-${ids[1]}`;

    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.directKey, directKey))
      .limit(1);

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Check if user is a member
    const [member] = await db
      .select()
      .from(conversationMembers)
      .where(
        and(
          eq(conversationMembers.conversationId, conversation.id),
          eq(conversationMembers.userId, user.id)
        )
      )
      .limit(1);

    if (!member) {
      return NextResponse.json({ error: "You are not a member of this conversation" }, { status: 403 });
    }

    // Insert message
    const [message] = await db
      .insert(messages)
      .values({
        conversationId: conversation.id,
        senderId: user.id,
        body: content.trim(),
      })
      .returning();

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: error.message || "Failed to send message" }, { status: 500 });
  }
}
