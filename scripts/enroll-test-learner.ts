import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { ssl: { rejectUnauthorized: false } });

async function run() {
  console.log("=== Enrolling Test Learner in Course ===\n");

  const learnerEmail = "testlearner+test@gmail.com";

  try {
    // Get learner user ID
    const [learner] = await sql`
      SELECT id
      FROM auth.users
      WHERE email = ${learnerEmail}
    `;

    if (!learner) {
      console.log(`✗ Learner not found: ${learnerEmail}`);
      return;
    }

    console.log(`✓ Learner found: ${learner.id}`);

    // Get a course to enroll in
    const [course] = await sql`
      SELECT id, title
      FROM courses
      LIMIT 1
    `;

    if (!course) {
      console.log(`✗ No courses found in database`);
      return;
    }

    console.log(`✓ Course found: ${course.title} (${course.id})`);

    // Check if already enrolled
    const [existingEnrollment] = await sql`
      SELECT id
      FROM enrollments
      WHERE user_id = ${learner.id} AND course_id = ${course.id}
    `;

    if (existingEnrollment) {
      console.log(`ℹ Already enrolled in this course`);
    } else {
      // Create enrollment
      const { randomUUID } = await import("crypto");
      const enrollmentId = randomUUID();

      await sql`
        INSERT INTO enrollments (id, user_id, course_id, enrolled_at, is_active)
        VALUES (${enrollmentId}, ${learner.id}, ${course.id}, NOW(), true)
      `;

      console.log(`✓ Enrollment created: ${enrollmentId}`);
    }

    // Ensure onboarding is marked as done
    await sql`
      UPDATE profiles
      SET onboarding_done = true
      WHERE id = ${learner.id}
    `;

    console.log(`✓ Onboarding marked as done`);

    console.log("\n✓ Test learner enrollment complete");

  } catch (error) {
    console.error("✗ Error:", error);
  } finally {
    await sql.end();
  }
}

run().catch((e) => {
  console.error("Script failed:", e);
  process.exit(1);
});
