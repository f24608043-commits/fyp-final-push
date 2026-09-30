// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { ssl: { rejectUnauthorized: false } });

async function testBadgeAwarding() {
  console.log("=== Testing Badge Awarding Mechanism ===\n");

  try {
    // Get test learner
    const [learner] = await sql`
      SELECT p.id, p.display_name, p.xp, p.streak_count
      FROM profiles p
      JOIN auth.users u ON p.id = u.id
      WHERE p.role = 'learner'
      LIMIT 1
    `;

    if (!learner) {
      throw new Error("No learner account found.");
    }

    console.log(`Test Learner: ${learner.display_name}`);
    console.log(`XP: ${learner.xp}, Streak: ${learner.streak_count}\n`);

    // Check completed lessons count
    const [completedLessons] = await sql`
      SELECT COUNT(*) as count FROM public.user_progress 
      WHERE user_id = ${learner.id} AND status = 'completed';
    `;

    console.log(`Completed Lessons: ${completedLessons.count}\n`);

    // Check available badges
    const badges = await sql`
      SELECT id, name, criteria_type, criteria_value FROM public.badges
      ORDER BY criteria_type;
    `;

    console.log("Available Badges:");
    badges.forEach((badge: any) => {
      console.log(`  - ${badge.name} (${badge.criteria_type}, value: ${badge.criteria_value})`);
    });

    console.log("\n🏅 Checking badge eligibility...");

    // Check "First Step" badge (first_lesson)
    const [firstLessonBadge] = await sql`
      SELECT id, name FROM public.badges WHERE criteria_type = 'first_lesson';
    `;

    if (firstLessonBadge && completedLessons.count >= 1) {
      const [existing] = await sql`
        SELECT id FROM public.user_badges 
        WHERE user_id = ${learner.id} AND badge_id = ${firstLessonBadge.id};
      `;

      if (!existing) {
        console.log(`  ✅ Eligible for: ${firstLessonBadge.name}`);
        await sql`
          INSERT INTO public.user_badges (user_id, badge_id)
          VALUES (${learner.id}, ${firstLessonBadge.id});
        `;
        console.log(`     Awarded!`);
      } else {
        console.log(`  ✓ Already has: ${firstLessonBadge.name}`);
      }
    }

    // Check "Level Up" badge (lessons_completed)
    const [lessonsCompletedBadge] = await sql`
      SELECT id, name, criteria_value FROM public.badges WHERE criteria_type = 'lessons_completed';
    `;

    if (lessonsCompletedBadge && completedLessons.count >= lessonsCompletedBadge.criteria_value) {
      const [existing] = await sql`
        SELECT id FROM public.user_badges 
        WHERE user_id = ${learner.id} AND badge_id = ${lessonsCompletedBadge.id};
      `;

      if (!existing) {
        console.log(`  ✅ Eligible for: ${lessonsCompletedBadge.name}`);
        await sql`
          INSERT INTO public.user_badges (user_id, badge_id)
          VALUES (${learner.id}, ${lessonsCompletedBadge.id});
        `;
        console.log(`     Awarded!`);
      } else {
        console.log(`  ✓ Already has: ${lessonsCompletedBadge.name}`);
      }
    }

    // Check streak badge
    const [streakBadge] = await sql`
      SELECT id, name, criteria_value FROM public.badges WHERE criteria_type = 'streak_days';
    `;

    if (streakBadge && learner.streak_count >= streakBadge.criteria_value) {
      const [existing] = await sql`
        SELECT id FROM public.user_badges 
        WHERE user_id = ${learner.id} AND badge_id = ${streakBadge.id};
      `;

      if (!existing) {
        console.log(`  ✅ Eligible for: ${streakBadge.name}`);
        await sql`
          INSERT INTO public.user_badges (user_id, badge_id)
          VALUES (${learner.id}, ${streakBadge.id});
        `;
        console.log(`     Awarded!`);
      } else {
        console.log(`  ✓ Already has: ${streakBadge.name}`);
      }
    }

    // Show final badge count
    const [badgeCount] = await sql`
      SELECT COUNT(*) as count FROM public.user_badges WHERE user_id = ${learner.id};
    `;

    console.log(`\n=== Test Complete ===`);
    console.log(`Total Badges: ${badgeCount.count}`);

    const userBadges = await sql`
      SELECT b.name, ub.awarded_at
      FROM user_badges ub
      JOIN badges b ON ub.badge_id = b.id
      WHERE ub.user_id = ${learner.id}
      ORDER BY ub.awarded_at;
    `;

    console.log("\n🏅 User's Badges:");
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

testBadgeAwarding().catch((e) => {
  console.error("Script failed:", e);
  process.exit(1);
});
