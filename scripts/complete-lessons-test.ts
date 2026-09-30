// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { ssl: { rejectUnauthorized: false } });

async function completeLessonsForTest() {
  console.log("=== Completing First Lesson for Each Course (Test) ===\n");

  try {
    // Get test learner
    const [learner] = await sql`
      SELECT p.id, p.display_name, p.xp
      FROM profiles p
      JOIN auth.users u ON p.id = u.id
      WHERE p.role = 'learner'
      LIMIT 1
    `;

    if (!learner) {
      throw new Error("No learner account found.");
    }

    console.log(`Test Learner: ${learner.display_name} (Current XP: ${learner.xp})\n`);

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
        SELECT status, score, attempts FROM public.user_progress 
        WHERE user_id = ${learner.id} AND lesson_id = ${firstLesson.id};
      `;

      if (!progress) {
        console.log(`  ⚠️  No progress record - creating one...`);
        await sql`
          INSERT INTO public.user_progress (user_id, lesson_id, status, attempts, score, completed_at)
          VALUES (${learner.id}, ${firstLesson.id}, 'completed', 1, 100, NOW());
        `;
      } else if (progress.status === 'completed') {
        console.log(`  ✅ Already completed`);
        continue;
      } else {
        console.log(`  🔄 Updating status to completed...`);
        await sql`
          UPDATE public.user_progress 
          SET status = 'completed', score = 100, attempts = 1, completed_at = NOW()
          WHERE user_id = ${learner.id} AND lesson_id = ${firstLesson.id};
        `;
      }

      // Award XP
      await sql`
        UPDATE public.profiles
        SET xp = xp + ${firstLesson.xp_reward}
        WHERE id = ${learner.id};
      `;

      console.log(`  ✅ Completed! Awarded ${firstLesson.xp_reward} XP\n`);
    }

    // Check updated learner stats
    const [updatedLearner] = await sql`
      SELECT p.xp, COUNT(ub.id) as badge_count
      FROM profiles p
      LEFT JOIN user_badges ub ON p.id = ub.user_id
      WHERE p.id = ${learner.id}
      GROUP BY p.id, p.xp;
    `;

    console.log(`\n=== Test Complete ===`);
    console.log(`Learner XP: ${learner.xp} → ${updatedLearner.xp}`);
    console.log(`Badges Earned: ${updatedLearner.badge_count}`);

    // Check which badges were awarded
    const userBadges = await sql`
      SELECT b.name, ub.awarded_at
      FROM user_badges ub
      JOIN badges b ON ub.badge_id = b.id
      WHERE ub.user_id = ${learner.id}
      ORDER BY ub.awarded_at DESC;
    `;

    console.log(`\n🏅 Badges:`);
    userBadges.forEach((badge: any) => {
      console.log(`  - ${badge.name}`);
    });

  } catch (error) {
    console.error("Test failed:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

completeLessonsForTest().catch((e) => {
  console.error("Script failed:", e);
  process.exit(1);
});
