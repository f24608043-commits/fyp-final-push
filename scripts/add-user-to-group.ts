import { createClient } from "@supabase/supabase-js";
import { db } from "@/db";
import { groups, profiles, groupMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function addUserToGroup() {
  const email = process.argv[2];
  const groupName = process.argv[3];

  if (!email || !groupName) {
    console.log("Usage: npx tsx scripts/add-user-to-group.ts <email> <group_name>");
    process.exit(1);
  }

  // Get user by email
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.error("User not found with email:", email);
    process.exit(1);
  }

  console.log("Found user:", user.id, user.email);

  // Get group by name
  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.name, groupName))
    .limit(1);

  if (!group) {
    console.error("Group not found with name:", groupName);
    process.exit(1);
  }

  console.log("Found group:", group.id, group.name);

  // Add user to group
  try {
    await db.insert(groupMembers).values({
      groupId: group.id,
      userId: user.id,
      role: "student",
    });
    console.log("Successfully added user to group!");
  } catch (error: any) {
    console.error("Error adding user to group:", error);
    process.exit(1);
  }
}

addUserToGroup();
