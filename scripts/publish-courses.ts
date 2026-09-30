// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { ssl: { rejectUnauthorized: false } });

async function publishCourses() {
  console.log("📢 Publishing courses for onboarding...");

  // Publish the new courses
  const result = await sql`
    UPDATE public.courses
    SET is_published = true
    WHERE title IN ('SEO (Search Engine Optimization)', 'Digital Marketing', 'Web Development', 'Cyber Security')
    RETURNING id, title, is_published;
  `;

  console.log(`✅ Published ${result.length} courses:`);
  result.forEach((course: any) => {
    console.log(`  - ${course.title} (published: ${course.is_published})`);
  });

  // Also check if Python Programming is published
  const [pythonCourse] = await sql`
    SELECT id, title, is_published FROM public.courses WHERE title = 'Python Programming';
  `;

  if (pythonCourse) {
    console.log(`\n📚 Python Programming status: ${pythonCourse.is_published ? 'Published' : 'Not published'}`);
  }

  await sql.end();
  console.log("\n🎉 COURSE PUBLISHING COMPLETE!");
  process.exit(0);
}

publishCourses().catch(async (e) => {
  console.error("Course publishing error:", e);
  await sql.end();
  process.exit(1);
});
