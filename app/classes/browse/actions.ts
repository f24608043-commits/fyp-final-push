"use server";

import { db } from "@/db";
import { groupMembers } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function joinClass(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const groupId = formData.get("groupId") as string;

  if (!groupId) {
    throw new Error("Group ID is required");
  }

  try {
    // Add user to group
    await db.insert(groupMembers).values({
      groupId,
      userId: user.id,
      role: "student",
    });

    revalidatePath("/classes");
    revalidatePath("/classes/browse");
    redirect(`/classes/${groupId}`);
  } catch (error: any) {
    console.error("Error joining class:", error);
    if (error.code === "23505") {
      throw new Error("You are already a member of this class.");
    }
    throw new Error("Failed to join class. Please try again.");
  }
}
