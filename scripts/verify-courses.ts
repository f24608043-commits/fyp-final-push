// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { ssl: { rejectUnauthorized: false } });

async function verifyCourses() {
  console.log("🔍 Verifying courses in database...");

  // Check all published courses
  const publishedCourses = await sql`
    SELECT id, title, is_published FROM public.courses 
    WHERE is_published = true
    ORDER BY title;
  `;

  console.log(`\n📚 Published Courses (${publishedCourses.length}):`);
  publishedCourses.forEach((course: any) => {
    console.log(`  ✅ ${course.title} (ID: ${course.id})`);
  });

  // Check units and lessons for each course
  for (const course of publishedCourses) {
    const units = await sql`
      SELECT id, title, order_index FROM public.units 
      WHERE course_id = ${course.id}
      ORDER BY order_index;
    `;

    console.log(`\n  📦 Units for ${course.title} (${units.length}):`);
    
    for (const unit of units) {
      const lessons = await sql`
        SELECT id, title, order_index FROM public.lessons 
        WHERE unit_id = ${unit.id}
        ORDER BY order_index;
      `;

      console.log(`    - ${unit.title} (${lessons.length} lessons)`);
      
      // Check if lessons have quizzes
      for (const lesson of lessons) {
        const [quizCount] = await sql`
          SELECT COUNT(*) as count FROM public.challenges 
          WHERE lesson_id = ${lesson.id};
        `;
        
        if (quizCount.count === 0) {
          console.log(`      ⚠️  ${lesson.title} - NO QUIZ`);
        }
      }
    }
  }

  await sql.end();
  console.log("\n🎉 VERIFICATION COMPLETE!");
  process.exit(0);
}

verifyCourses().catch(async (e) => {
  console.error("Verification error:", e);
  await sql.end();
  process.exit(1);
});
