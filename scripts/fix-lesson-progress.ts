// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { ssl: { rejectUnauthorized: false } });

async function fixLessonProgress() {
  console.log("=== Fixing Lesson Progress for 'hello' learner ===\n");

  try {
    // Get the 'hello' learner
    const [learner] = await sql`
      SELECT p.id, p.display_name, p.xp
      FROM profiles p
      JOIN auth.users u ON p.id = u.id
      WHERE p.display_name = 'hello'
      LIMIT 1
    `;

    if (!learner) {
      throw new Error("Learner 'hello' not found.");
    }

    console.log(`Learner: ${learner.display_name} (ID: ${learner.id})\n`);

    // Get the new courses
    const courses = await sql`
      SELECT id, title FROM public.courses 
      WHERE title IN ('SEO (Search Engine Optimization)', 'Digital Marketing', 'Web Development', 'Cyber Security')
      ORDER BY title;
    `;

    for (const course of courses) {
      console.log(`📚 ${course.title}`);

      // Get first lesson of first unit
      const [firstLesson] = await sql`
        SELECT l.id, l.title, l.xp_reward
        FROM public.lessons l
        JOIN public.units u ON l.unit_id = u.id
        WHERE u.course_id = ${course.id} AND u.order_index = 0 AND l.order_index = 0
        LIMIT 1;
      `;

      if (!firstLesson) {
        console.log(`  ⚠️  No lessons found\n`);
        continue;
      }

      console.log(`  📝 Lesson: ${firstLesson.title} (XP: ${firstLesson.xp_reward})`);

      // Check current progress
      const [progress] = await sql`
        SELECT id, status FROM public.user_progress 
        WHERE user_id = ${learner.id} AND lesson_id = ${firstLesson.id};
      `;

      if (!progress) {
        console.log(`  ⚠️  No progress record - creating one...`);
        await sql`
          INSERT INTO public.user_progress (user_id, lesson_id, status, attempts, score, completed_at)
          VALUES (${learner.id}, ${firstLesson.id}, 'completed', 1, 100, NOW());
        `;
        console.log(`  ✅ Progress record created`);
      } else if (progress.status === 'completed') {
        console.log(`  ✅ Already completed`);
      } else {
        console.log(`  🔄 Updating status to completed...`);
        await sql`
          UPDATE public.user_progress 
          SET status = 'completed', score = 100, attempts = 1, completed_at = NOW()
          WHERE user_id = ${learner.id} AND lesson_id = ${firstLesson.id};
        `;
        console.log(`  ✅ Updated`);
      }
    }

    // Verify progress
    const [completedCount] = await sql`
      SELECT COUNT(*) as count FROM public.user_progress 
      WHERE user_id = ${learner.id} AND status = 'completed';
    `;

    console.log(`\n=== Verification ===`);
    console.log(`Completed Lessons: ${completedCount.count}`);

    // Award badges
    if (completedCount.count >= 1) {
      const [firstLessonBadge] = await sql`
        SELECT id, name FROM public.badges WHERE criteria_type = 'first_lesson';
      `;

      if (firstLessonBadge) {
        const [existing] = await sql`
          SELECT id FROM public.user_badges 
          WHERE user_id = ${learner.id} AND badge_id = ${firstLessonBadge.id};
        `;

        if (!existing) {
          console.log(`\n🏅 Awarding 'First Step' badge...`);
          await sql`
            INSERT INTO public.user_badges (user_id, badge_id)
            VALUES (${learner.id}, ${firstLessonBadge.id});
          `;
          console.log(`  ✅ Badge awarded!`);
        }
      }
    }

  } catch (error) {
    console.error("Fix failed:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

fixLessonProgress().catch((e) => {
  console.error("Script failed:", e);
  process.exit(1);
});
