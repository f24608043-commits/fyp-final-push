// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { ssl: { rejectUnauthorized: false } });

async function seedBadges() {
  console.log("🏅 Creating badges for courses and units...");

  // Get all courses
  const courses = await sql`
    SELECT id, title FROM public.courses 
    WHERE title IN ('SEO (Search Engine Optimization)', 'Digital Marketing', 'Web Development', 'Cyber Security', 'Python Programming')
    ORDER BY title;
  `;

  console.log(`Found ${courses.length} courses`);

  for (const course of courses) {
    console.log(`\n📚 Processing course: ${course.title}`);

    // Create course completion badge
    const badgeName = `${course.title} - Master`;
    const badgeDescription = `Complete all lessons in the ${course.title} course`;
    const iconUrl = "🏆";

    const [existingBadge] = await sql`
      SELECT id FROM public.badges WHERE name = ${badgeName};
    `;

    let badgeId;
    if (existingBadge) {
      badgeId = existingBadge.id;
      console.log(`  ✅ Badge already exists: ${badgeName}`);
    } else {
      const [newBadge] = await sql`
        INSERT INTO public.badges (name, description, icon_url, criteria_type, criteria_value)
        VALUES (${badgeName}, ${badgeDescription}, ${iconUrl}, 'course_complete', 1)
        RETURNING id;
      `;
      badgeId = newBadge.id;
      console.log(`  ✅ Created badge: ${badgeName}`);
    }

    // Update course with badge_id (if column exists)
    try {
      await sql`
        UPDATE public.courses 
        SET badge_id = ${badgeId}
        WHERE id = ${course.id};
      `;
      console.log(`  ✅ Linked badge to course`);
    } catch (err) {
      console.log(`  ⚠️  Could not link badge to course (column may not exist)`);
    }

    // Get all units for this course
    const units = await sql`
      SELECT id, title FROM public.units 
      WHERE course_id = ${course.id}
      ORDER BY order_index;
    `;

    console.log(`  Found ${units.length} units`);

    for (const unit of units) {
      // Create unit completion badge
      const unitBadgeName = `${unit.title} - Completed`;
      const unitBadgeDescription = `Complete all lessons in the ${unit.title} unit`;
      const unitIconUrl = "⭐";

      const [existingUnitBadge] = await sql`
        SELECT id FROM public.badges WHERE name = ${unitBadgeName};
      `;

      let unitBadgeId;
      if (existingUnitBadge) {
        unitBadgeId = existingUnitBadge.id;
        console.log(`    ✅ Unit badge already exists: ${unitBadgeName}`);
      } else {
        const [newUnitBadge] = await sql`
          INSERT INTO public.badges (name, description, icon_url, criteria_type, criteria_value)
          VALUES (${unitBadgeName}, ${unitBadgeDescription}, ${unitIconUrl}, 'lessons_completed', 1)
          RETURNING id;
        `;
        unitBadgeId = newUnitBadge.id;
        console.log(`    ✅ Created unit badge: ${unitBadgeName}`);
      }

      // Update unit with badge_id
      try {
        await sql`
          UPDATE public.units 
          SET badge_id = ${unitBadgeId}
          WHERE id = ${unit.id};
        `;
        console.log(`    ✅ Linked badge to unit`);
      } catch (err) {
        console.log(`    ⚠️  Could not link badge to unit (column may not exist)`);
      }
    }
  }

  await sql.end();
  console.log("\n🎉 BADGE SEEDING COMPLETE!");
  process.exit(0);
}

seedBadges().catch(async (e) => {
  console.error("Badge seeding error:", e);
  await sql.end();
  process.exit(1);
});
