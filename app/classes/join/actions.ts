"use server";

import { db } from "@/db";
import { groups, groupMembers } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function joinClassByCode(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const groupCode = formData.get("groupCode") as string;

  if (!groupCode || groupCode.trim().length === 0) {
    throw new Error("Class code is required");
  }

  const normalizedCode = groupCode.trim().toUpperCase();

  try {
    // Find group by code
    const [group] = await db
      .select()
      .from(groups)
      .where(eq(groups.groupCode, normalizedCode))
      .limit(1);

    if (!group) {
      throw new Error("Invalid class code. Please check and try again.");
    }

    // Check if user is already a member
    const [existingMember] = await db
      .select()
      .from(groupMembers)
      .where(
        eq(groupMembers.userId, user.id)
      )
      .limit(1);

    if (existingMember) {
      throw new Error("You are already a member of this class.");
    }

    // Add user to group
    await db.insert(groupMembers).values({
      groupId: group.id,
      userId: user.id,
      role: "student",
    });

    revalidatePath("/classes");
    redirect(`/classes/${group.id}`);
  } catch (error: any) {
    console.error("Error joining class:", error);
    if (error.message.includes("Invalid class code") || error.message.includes("already a member")) {
      throw error;
    }
    throw new Error("Failed to join class. Please try again.");
  }
}
