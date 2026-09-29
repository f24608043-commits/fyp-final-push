import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { ssl: { rejectUnauthorized: false } });

async function seedMoreLessons() {
  console.log("🌱 Seeding additional lessons...");

  // Get the Python Programming course
  const [course] = await sql`
    SELECT id FROM public.courses WHERE title = 'Python Programming';
  `;

  if (!course) {
    console.error("Python Programming course not found. Run seed.ts first.");
    process.exit(1);
  }

  // Get existing units
  const units = await sql`
    SELECT id, title FROM public.units WHERE course_id = ${course.id} ORDER BY order_index;
  `;

  if (units.length < 2) {
    console.error("Need at least 2 units. Run seed.ts first.");
    process.exit(1);
  }

  const unit1 = units[0];
  const unit2 = units[1];

  // Add more lessons to Unit 1
  console.log(`Adding lessons to Unit 1: ${unit1.title}`);
  
  const [u1l4] = await sql`
    INSERT INTO public.lessons (unit_id, title, description, youtube_video_id, order_index, xp_reward, is_published)
    VALUES (
      ${unit1.id},
      'Loops in Python',
      'Automate repetitive tasks using for and while loops.',
      '6iF8Xb7Z3wQ',
      3,
      25,
      true
    )
    RETURNING id, title;
  `;
  console.log(`  ✅ ${u1l4.title}`);

  const [u1l5] = await sql`
    INSERT INTO public.lessons (unit_id, title, description, youtube_video_id, order_index, xp_reward, is_published)
    VALUES (
      ${unit1.id},
      'Input & Output',
      'Get user input with input() and display output with print().',
      'Zp5MuPOtsSY',
      4,
      20,
      true
    )
    RETURNING id, title;
  `;
  console.log(`  ✅ ${u1l5.title}`);

  // Add more lessons to Unit 2
  console.log(`Adding lessons to Unit 2: ${unit2.title}`);

  const [u2l4] = await sql`
    INSERT INTO public.lessons (unit_id, title, description, youtube_video_id, order_index, xp_reward, is_published)
    VALUES (
      ${unit2.id},
      'Dictionaries & Sets',
      'Work with key-value pairs and unique collections.',
      'XKp9q1eJl9w',
      3,
      30,
      true
    )
    RETURNING id, title;
  `;
  console.log(`  ✅ ${u2l4.title}`);

  const [u2l5] = await sql`
    INSERT INTO public.lessons (unit_id, title, description, youtube_video_id, order_index, xp_reward, is_published)
    VALUES (
      ${unit2.id},
      'File Handling',
      'Read from and write to files on your computer.',
      'UhH6MnpPq8o',
      4,
      35,
      true
    )
    RETURNING id, title;
  `;
  console.log(`  ✅ ${u2l5.title}`);

  const [u2l6] = await sql`
    INSERT INTO public.lessons (unit_id, title, description, youtube_video_id, order_index, xp_reward, is_published)
    VALUES (
      ${unit2.id},
      'Error Handling',
      'Gracefully handle errors with try, except, and finally.',
      'NIWwJbo-9_8',
      5,
      40,
      true
    )
    RETURNING id, title;
  `;
  console.log(`  ✅ ${u2l6.title}`);

  // Create Unit 3: Object-Oriented Programming
  console.log("Creating Unit 3: Object-Oriented Programming");
  const [unit3] = await sql`
    INSERT INTO public.units (course_id, title, description, order_index)
    VALUES (
      ${course.id},
      'Object-Oriented Programming',
      'Learn classes, objects, inheritance, and encapsulation.',
      2
    )
    RETURNING id, title;
  `;
  console.log(`  ✅ Unit 3: ${unit3.title}`);

  // Lessons for Unit 3
  const [u3l1] = await sql`
    INSERT INTO public.lessons (unit_id, title, description, youtube_video_id, order_index, xp_reward, is_published)
    VALUES (
      ${unit3.id},
      'Classes & Objects',
      'Create your own custom data types with classes.',
      'JeznW_7DlB0',
      0,
      35,
      true
    )
    RETURNING id, title;
  `;
  console.log(`  ✅ ${u3l1.title}`);

  const [u3l2] = await sql`
    INSERT INTO public.lessons (unit_id, title, description, youtube_video_id, order_index, xp_reward, is_published)
    VALUES (
      ${unit3.id},
      'Methods & Attributes',
      'Add behavior and properties to your classes.',
      'zQjKM-5M2kU',
      1,
      35,
      true
    )
    RETURNING id, title;
  `;
  console.log(`  ✅ ${u3l2.title}`);

  const [u3l3] = await sql`
    INSERT INTO public.lessons (unit_id, title, description, youtube_video_id, order_index, xp_reward, is_published)
    VALUES (
      ${unit3.id},
      'Inheritance',
      'Create hierarchies of classes to reuse code.',
      'RSl87lqOde8',
      2,
      40,
      true
    )
    RETURNING id, title;
  `;
  console.log(`  ✅ ${u3l3.title}`);

  // Create Unit 4: Advanced Python
  console.log("Creating Unit 4: Advanced Python");
  const [unit4] = await sql`
    INSERT INTO public.units (course_id, title, description, order_index)
    VALUES (
      ${course.id},
      'Advanced Python',
      'Explore decorators, generators, and modules.',
      3
    )
    RETURNING id, title;
  `;
  console.log(`  ✅ Unit 4: ${unit4.title}`);

  // Lessons for Unit 4
  const [u4l1] = await sql`
    INSERT INTO public.lessons (unit_id, title, description, youtube_video_id, order_index, xp_reward, is_published)
    VALUES (
      ${unit4.id},
      'Decorators',
      'Modify functions with @decorators for cleaner code.',
      'FsAPt_9bDxg',
      0,
      45,
      true
    )
    RETURNING id, title;
  `;
  console.log(`  ✅ ${u4l1.title}`);

  const [u4l2] = await sql`
    INSERT INTO public.lessons (unit_id, title, description, youtube_video_id, order_index, xp_reward, is_published)
    VALUES (
      ${unit4.id},
      'Generators & Iterators',
      'Create memory-efficient iterators with yield.',
      'bD05uGo_s6I',
      1,
      45,
      true
    )
    RETURNING id, title;
  `;
  console.log(`  ✅ ${u4l2.title}`);

  const [u4l3] = await sql`
    INSERT INTO public.lessons (unit_id, title, description, youtube_video_id, order_index, xp_reward, is_published)
    VALUES (
      ${unit4.id},
      'Modules & Packages',
      'Organize your code into reusable modules.',
      '3qv38_e6QeM',
      2,
      40,
      true
    )
    RETURNING id, title;
  `;
  console.log(`  ✅ ${u4l3.title}`);

  // Count total lessons
  const [lessonCount] = await sql`
    SELECT COUNT(*) as count FROM public.lessons WHERE unit_id IN (SELECT id FROM public.units WHERE course_id = ${course.id});
  `;
  
  console.log(`\n📊 Total lessons in Python Programming course: ${lessonCount.count}`);
  console.log(`📊 Total units: 4`);
  console.log(`📊 Lessons per unit: Unit 1 (5), Unit 2 (6), Unit 3 (3), Unit 4 (3)`);

  await sql.end();
  console.log("\n🎉 ADDITIONAL LESSONS SEEDED SUCCESSFULLY!");
  process.exit(0);
}

seedMoreLessons().catch(async (e) => {
  console.error("Seed error:", e);
  await sql.end();
  process.exit(1);
});
