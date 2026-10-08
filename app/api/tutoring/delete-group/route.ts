import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { tutorGroups } from "@/db/schema";
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
  const groupId = formData.get("groupId") as string;

  if (!groupId) {
    return NextResponse.json({ error: "Group ID required" }, { status: 400 });
  }

  try {
    await db.delete(tutorGroups).where(eq(tutorGroups.id, groupId));

    revalidatePath("/tutoring/groups");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete group error:", error);
    return NextResponse.json({ error: "Failed to delete group" }, { status: 500 });
  }
}
