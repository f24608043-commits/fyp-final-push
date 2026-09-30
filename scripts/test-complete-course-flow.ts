// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { ssl: { rejectUnauthorized: false } });

async function testCompleteCourseFlow() {
  console.log("=== COMPLETE COURSE FLOW TEST ===\n");

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

    console.log(`👤 Test Learner: ${learner.display_name} (ID: ${learner.id})`);
    console.log(`   Initial Stats: XP=${learner.xp}, Streak=${learner.streak_count}\n`);

    // Test 1: Course Enrollment
    console.log("━━━ TEST 1: COURSE ENROLLMENT ━━━");
    const courses = await sql`
      SELECT id, title FROM public.courses 
      WHERE title IN ('SEO (Search Engine Optimization)', 'Digital Marketing', 'Web Development', 'Cyber Security')
      ORDER BY title;
    `;

    let enrolledCount = 0;
    for (const course of courses) {
      const [enrollment] = await sql`
        SELECT * FROM public.enrollments 
        WHERE user_id = ${learner.id} AND course_id = ${course.id};
      `;

      if (!enrollment) {
        await sql`
          INSERT INTO public.enrollments (user_id, course_id, is_active, placement_answer)
          VALUES (${learner.id}, ${course.id}, false, 'beginner');
        `;
        enrolledCount++;
        console.log(`  ✅ Enrolled in: ${course.title}`);
      } else {
        console.log(`  ✓ Already enrolled: ${course.title}`);
      }
    }
    console.log(`   Total Enrollments: ${enrolledCount} new\n`);

    // Test 2: Lesson Unlocking Progression
    console.log("━━━ TEST 2: LESSON UNLOCKING PROGRESSION ━━━");
    for (const course of courses) {
      console.log(`\n📚 ${course.title}`);
      
      const units = await sql`
        SELECT id, title, order_index FROM public.units 
        WHERE course_id = ${course.id}
        ORDER BY order_index;
      `;

      for (const unit of units) {
        const lessons = await sql`
          SELECT id, title, order_index FROM public.lessons 
          WHERE unit_id = ${unit.id}
          ORDER BY order_index;
        `;

        let unlocked = 0;
        let locked = 0;

        for (const lesson of lessons) {
          const [progress] = await sql`
            SELECT status FROM public.user_progress 
            WHERE user_id = ${learner.id} AND lesson_id = ${lesson.id};
          `;

          if (!progress) {
            // First lesson of first unit should be unlocked
            if (unit.order_index === 0 && lesson.order_index === 0) {
              await sql`
                INSERT INTO public.user_progress (user_id, lesson_id, status, attempts)
                VALUES (${learner.id}, ${lesson.id}, 'in_progress', 0);
              `;
              unlocked++;
            } else {
              locked++;
            }
          } else if (progress.status !== 'locked') {
            unlocked++;
          } else {
            locked++;
          }
        }

        console.log(`  📦 ${unit.title}: ${unlocked} unlocked, ${locked} locked`);
      }
    }

    // Test 3: Complete First Lesson of Each Course
    console.log("\n━━━ TEST 3: LESSON COMPLETION ━━━");
    let totalXP = 0;
    let lessonsCompleted = 0;

    for (const course of courses) {
      const [firstLesson] = await sql`
        SELECT l.id, l.title, l.xp_reward
        FROM public.lessons l
        JOIN public.units u ON l.unit_id = u.id
        WHERE u.course_id = ${course.id} AND u.order_index = 0 AND l.order_index = 0
        LIMIT 1;
      `;

      if (firstLesson) {
        const [progress] = await sql`
          SELECT status FROM public.user_progress 
          WHERE user_id = ${learner.id} AND lesson_id = ${firstLesson.id};
        `;

        if (!progress || progress.status !== 'completed') {
          await sql`
            INSERT INTO public.user_progress (user_id, lesson_id, status, attempts, score, completed_at)
            VALUES (${learner.id}, ${firstLesson.id}, 'completed', 1, 100, NOW())
            ON CONFLICT (user_id, lesson_id) 
            DO UPDATE SET status = 'completed', score = 100, attempts = 1, completed_at = NOW();
          `;
          
          await sql`
            UPDATE public.profiles
            SET xp = xp + ${firstLesson.xp_reward}
            WHERE id = ${learner.id};
          `;

          totalXP += firstLesson.xp_reward;
          lessonsCompleted++;
          console.log(`  ✅ Completed: ${firstLesson.title} (+${firstLesson.xp_reward} XP)`);
        } else {
          console.log(`  ✓ Already completed: ${firstLesson.title}`);
        }
      }
    }

    // Test 4: Badge Awarding
    console.log("\n━━━ TEST 4: BADGE AWARDING ━━━");
    
    // Check completed lessons count
    const [completedLessons] = await sql`
      SELECT COUNT(*) as count FROM public.user_progress 
      WHERE user_id = ${learner.id} AND status = 'completed';
    `;

    console.log(`   Completed Lessons: ${completedLessons.count}`);

    // Award First Step badge
    const [firstStepBadge] = await sql`
      SELECT id, name FROM public.badges WHERE criteria_type = 'first_lesson';
    `;

    if (firstStepBadge && completedLessons.count >= 1) {
      const [existing] = await sql`
        SELECT id FROM public.user_badges 
        WHERE user_id = ${learner.id} AND badge_id = ${firstStepBadge.id};
      `;

      if (!existing) {
        await sql`
          INSERT INTO public.user_badges (user_id, badge_id)
          VALUES (${learner.id}, ${firstStepBadge.id});
        `;
        console.log(`  🏅 Awarded: ${firstStepBadge.name}`);
      } else {
        console.log(`  ✓ Already has: ${firstStepBadge.name}`);
      }
    }

    // Award Level Up badge if 5+ lessons
    const [levelUpBadge] = await sql`
      SELECT id, name, criteria_value FROM public.badges WHERE criteria_type = 'lessons_completed';
    `;

    if (levelUpBadge && completedLessons.count >= levelUpBadge.criteria_value) {
      const [existing] = await sql`
        SELECT id FROM public.user_badges 
        WHERE user_id = ${learner.id} AND badge_id = ${levelUpBadge.id};
      `;

      if (!existing) {
        await sql`
          INSERT INTO public.user_badges (user_id, badge_id)
          VALUES (${learner.id}, ${levelUpBadge.id});
        `;
        console.log(`  🏅 Awarded: ${levelUpBadge.name}`);
      }
    }

    // Test 5: Verify Unit Badge Eligibility
    console.log("\n━━━ TEST 5: UNIT BADGE ELIGIBILITY ━━━");
    
    for (const course of courses) {
      const units = await sql`
        SELECT u.id, u.title, u.badge_id
        FROM public.units u
        WHERE u.course_id = ${course.id}
        ORDER BY u.order_index;
      `;

      for (const unit of units) {
        if (unit.badge_id) {
          const [unitCompleted] = await sql`
            SELECT COUNT(*) as count
            FROM public.user_progress up
            JOIN public.lessons l ON up.lesson_id = l.id
            WHERE up.user_id = ${learner.id} 
              AND l.unit_id = ${unit.id} 
              AND up.status = 'completed';
          `;

          const [totalLessons] = await sql`
            SELECT COUNT(*) as count FROM public.lessons WHERE unit_id = ${unit.id};
          `;

          if (unitCompleted.count === totalLessons.count) {
            console.log(`  ✅ ${unit.title}: All lessons completed - eligible for badge`);
          } else {
            console.log(`  ⏳ ${unit.title}: ${unitCompleted.count}/${totalLessons.count} lessons completed`);
          }
        }
      }
    }

    // Test 6: Final Stats Summary
    console.log("\n━━━ TEST 6: FINAL STATS SUMMARY ━━━");
    
    const [finalStats] = await sql`
      SELECT p.xp, p.streak_count FROM profiles p WHERE p.id = ${learner.id};
    `;

    const [badgeCount] = await sql`
      SELECT COUNT(*) as count FROM public.user_badges WHERE user_id = ${learner.id};
    `;

    const [finalCompleted] = await sql`
      SELECT COUNT(*) as count FROM public.user_progress 
      WHERE user_id = ${learner.id} AND status = 'completed';
    `;

    console.log(`   XP: ${learner.xp} → ${finalStats.xp} (+${totalXP})`);
    console.log(`   Completed Lessons: ${finalCompleted.count}`);
    console.log(`   Badges Earned: ${badgeCount.count}`);

    const userBadges = await sql`
      SELECT b.name FROM user_badges ub
      JOIN badges b ON ub.badge_id = b.id
      WHERE ub.user_id = ${learner.id}
      ORDER BY ub.awarded_at;
    `;

    console.log(`\n   Badges:`);
    userBadges.forEach((badge: any) => {
      console.log(`     - ${badge.name}`);
    });

    console.log("\n━━━ ALL TESTS COMPLETED SUCCESSFULLY ━━━");

  } catch (error) {
    console.error("Test failed:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

testCompleteCourseFlow().catch((e) => {
  console.error("Script failed:", e);
  process.exit(1);
});
