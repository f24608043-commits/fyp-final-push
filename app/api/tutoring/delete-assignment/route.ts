import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { assignments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const assignmentId = formData.get("assignmentId") as string;
  const groupId = formData.get("groupId") as string;

  if (!assignmentId || !groupId) {
    return NextResponse.json({ error: "Assignment ID and Group ID required" }, { status: 400 });
  }

  try {
    await db.delete(assignments).where(eq(assignments.id, assignmentId));

    revalidatePath(`/tutoring/classes/${groupId}/assignments`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete assignment error:", error);
    return NextResponse.json({ error: "Failed to delete assignment" }, { status: 500 });
  }
}
