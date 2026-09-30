// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { ssl: { rejectUnauthorized: false } });

async function debugBadges() {
  console.log("=== Debugging Badge Issue ===\n");

  try {
    // Get the 'hello' learner
    const [learner] = await sql`
      SELECT p.id, p.display_name, p.xp, p.streak_count
      FROM profiles p
      JOIN auth.users u ON p.id = u.id
      WHERE p.display_name = 'hello'
      LIMIT 1
    `;

    if (!learner) {
      throw new Error("Learner 'hello' not found.");
    }

    console.log(`Learner: ${learner.display_name} (ID: ${learner.id})`);
    console.log(`XP: ${learner.xp}, Streak: ${learner.streak_count}\n`);

    // Check all user_progress for this learner
    const progressRecords = await sql`
      SELECT up.id, up.status, up.score, l.title as lesson_title, u.title as unit_title, c.title as course_title
      FROM public.user_progress up
      JOIN public.lessons l ON up.lesson_id = l.id
      JOIN public.units u ON l.unit_id = u.id
      JOIN public.courses c ON u.course_id = c.id
      WHERE up.user_id = ${learner.id}
      ORDER BY up.status;
    `;

    console.log(`User Progress Records (${progressRecords.length}):`);
    progressRecords.forEach((record: any) => {
      console.log(`  - ${record.lesson_title} (${record.course_title} - ${record.unit_title}): ${record.status}`);
    });

    // Count completed lessons
    const [completedCount] = await sql`
      SELECT COUNT(*) as count FROM public.user_progress 
      WHERE user_id = ${learner.id} AND status = 'completed';
    `;

    console.log(`\nCompleted Lessons Count: ${completedCount.count}`);

    // Check if badges should be awarded
    if (completedCount.count >= 1) {
      console.log(`\n✅ Should award 'First Step' badge`);
      
      const [firstLessonBadge] = await sql`
        SELECT id, name FROM public.badges WHERE criteria_type = 'first_lesson';
      `;

      if (firstLessonBadge) {
        const [existing] = await sql`
          SELECT id FROM public.user_badges 
          WHERE user_id = ${learner.id} AND badge_id = ${firstLessonBadge.id};
        `;

        if (!existing) {
          console.log(`  Awarding badge...`);
          await sql`
            INSERT INTO public.user_badges (user_id, badge_id)
            VALUES (${learner.id}, ${firstLessonBadge.id});
          `;
          console.log(`  ✅ Badge awarded!`);
        } else {
          console.log(`  Already has badge`);
        }
      }
    }

  } catch (error) {
    console.error("Debug failed:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

debugBadges().catch((e) => {
  console.error("Script failed:", e);
  process.exit(1);
});
