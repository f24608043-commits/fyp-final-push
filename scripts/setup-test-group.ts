import { createClient } from "@supabase/supabase-js";
import { db } from "@/db";
import { groups, profiles, groupMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function setupTestGroup() {
  const email = process.argv[2];

  if (!email) {
    console.log("Usage: npx tsx scripts/setup-test-group.ts <email>");
    process.exit(1);
  }

  // Get user by email
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.error("User not found with email:", email);
    console.log("Please sign up first at http://localhost:3000");
    process.exit(1);
  }

  console.log("Found user:", user.id, user.email);

  // Check for existing groups
  const existingGroups = await db.select().from(groups).limit(5);
  
  let group;
  if (existingGroups.length > 0) {
    group = existingGroups[0];
    console.log("Using existing group:", group.id, group.name);
  } else {
    // Create a test group
    const [newGroup] = await db.insert(groups).values({
      tutorId: user.id,
      name: "Test Class",
      description: "A test class for development",
      subject: "General",
      gradeLevel: "All Levels",
      groupCode: nanoid(6).toUpperCase(),
      privacy: "private",
    }).returning();
    
    group = newGroup;
    console.log("Created new group:", group.id, group.name, "Code:", group.groupCode);
  }

  // Check if user is already a member
  const [existingMember] = await db
    .select()
    .from(groupMembers)
    .where(eq(groupMembers.userId, user.id))
    .limit(1);

  if (existingMember) {
    console.log("User is already a member of this group");
  } else {
    // Add user to group
    await db.insert(groupMembers).values({
      groupId: group.id,
      userId: user.id,
      role: "student",
    });
    console.log("Successfully added user to group!");
  }

  console.log("\nGroup Details:");
  console.log("- ID:", group.id);
  console.log("- Name:", group.name);
  console.log("- Code:", group.groupCode);
  console.log("\nYou can now visit /classes to see your enrolled class");
}

setupTestGroup();
