// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { ssl: { rejectUnauthorized: false } });

async function testCourseEnrollment() {
  console.log("=== Testing Course Enrollment and Lesson Unlocking ===\n");

  try {
    // Get a test learner account
    const [learner] = await sql`
      SELECT p.id, p.display_name, u.email
      FROM profiles p
      JOIN auth.users u ON p.id = u.id
      WHERE p.role = 'learner'
      LIMIT 1
    `;

    if (!learner) {
      throw new Error("No learner account found. Please create a test learner account first.");
    }

    console.log(`Test Learner: ${learner.display_name} (${learner.email})\n`);

    // Get the new courses
    const courses = await sql`
      SELECT id, title FROM public.courses 
      WHERE title IN ('SEO (Search Engine Optimization)', 'Digital Marketing', 'Web Development', 'Cyber Security')
      ORDER BY title;
    `;

    console.log(`Found ${courses.length} courses to test\n`);

    for (const course of courses) {
      console.log(`\n📚 Testing: ${course.title}`);

      // Check if learner is enrolled
      const [enrollment] = await sql`
        SELECT * FROM public.enrollments 
        WHERE user_id = ${learner.id} AND course_id = ${course.id};
      `;

      if (!enrollment) {
        console.log(`  ⚠️  Not enrolled - creating enrollment...`);
        await sql`
          INSERT INTO public.enrollments (user_id, course_id, is_active, placement_answer)
          VALUES (${learner.id}, ${course.id}, false, 'beginner');
        `;
        console.log(`  ✅ Enrollment created`);
      } else {
        console.log(`  ✅ Already enrolled (active: ${enrollment.isActive})`);
      }

      // Get units and lessons for this course
      const units = await sql`
        SELECT id, title, order_index FROM public.units 
        WHERE course_id = ${course.id}
        ORDER BY order_index;
      `;

      console.log(`  📦 Units: ${units.length}`);

      for (const unit of units) {
        const lessons = await sql`
          SELECT id, title, order_index FROM public.lessons 
          WHERE unit_id = ${unit.id}
          ORDER BY order_index;
        `;

        console.log(`    - ${unit.title} (${lessons.length} lessons)`);

        // Check lesson unlocking status
        let unlockedCount = 0;
        let lockedCount = 0;

        for (const lesson of lessons) {
          const [progress] = await sql`
            SELECT status FROM public.user_progress 
            WHERE user_id = ${learner.id} AND lesson_id = ${lesson.id};
          `;

          if (!progress) {
            // First lesson should be unlocked (in_progress), others locked
            if (lesson.order_index === 0 && unit.order_index === 0) {
              console.log(`      ⚠️  ${lesson.title} - NO PROGRESS (should be unlocked)`);
              // Create initial progress for first lesson
              await sql`
                INSERT INTO public.user_progress (user_id, lesson_id, status, attempts)
                VALUES (${learner.id}, ${lesson.id}, 'in_progress', 0);
              `;
              console.log(`      ✅ Created initial progress (unlocked)`);
              unlockedCount++;
            } else {
              lockedCount++;
            }
          } else {
            if (progress.status === 'locked') {
              lockedCount++;
            } else {
              unlockedCount++;
            }
          }
        }

        console.log(`      Status: ${unlockedCount} unlocked, ${lockedCount} locked`);
      }
    }

    console.log("\n=== Enrollment and Unlocking Test Complete ===");
    console.log("\nNote: To test lesson completion and badge awarding, use the web UI to complete a lesson.");
  } catch (error) {
    console.error("Test failed:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

testCourseEnrollment().catch((e) => {
  console.error("Script failed:", e);
  process.exit(1);
});
