import { db } from "@/db";
import { profiles, tutorProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

async function seedTestData() {
  console.log("Seeding test data...");

  // Create test tutors
  const tutorEmails = [
    "test-tutor-1@example.com",
    "test-tutor-2@example.com",
    "test-tutor-3@example.com",
  ];

  for (const email of tutorEmails) {
    // Check if tutor exists
    const existing = await db
      .select()
      .from(profiles)
      .where(eq(profiles.displayName, email))
      .limit(1);

    if (existing.length === 0) {
      // Create tutor profile (you'll need to create these users in Supabase Auth first)
      console.log(`Tutor ${email} needs to be created in Supabase Auth first`);
    } else {
      const tutor = existing[0];
      
      // Create tutor profile entry
      const existingTutorProfile = await db
        .select()
        .from(tutorProfiles)
        .where(eq(tutorProfiles.tutorId, tutor.id))
        .limit(1);

      if (existingTutorProfile.length === 0) {
        await db.insert(tutorProfiles).values({
          tutorId: tutor.id,
          bio: "Test tutor for E2E testing",
          subjects: ["Python", "JavaScript"],
          hourlyRate: 50,
          timezone: "UTC",
          isActive: true,
          rating: 5,
          totalSessions: 10,
        });
        console.log(`Created tutor profile for ${email}`);
      }
    }
  }

  console.log("Test data seeding complete");
}

seedTestData().catch(console.error);
