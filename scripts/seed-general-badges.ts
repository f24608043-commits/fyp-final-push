// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { ssl: { rejectUnauthorized: false } });

async function seedGeneralBadges() {
  console.log("🏅 Creating general achievement badges...");

  const generalBadges = [
    {
      name: "First Step",
      description: "Complete your first lesson",
      iconUrl: "🚀",
      criteriaType: "first_lesson",
      criteriaValue: 1,
    },
    {
      name: "Level Up",
      description: "Complete 5 lessons",
      iconUrl: "⬆️",
      criteriaType: "lessons_completed",
      criteriaValue: 5,
    },
    {
      name: "7 Day Streak",
      description: "Maintain a 7-day learning streak",
      iconUrl: "🔥",
      criteriaType: "streak_days",
      criteriaValue: 7,
    },
  ];

  for (const badge of generalBadges) {
    const [existing] = await sql`
      SELECT id FROM public.badges WHERE name = ${badge.name};
    `;

    if (existing) {
      console.log(`  ✅ Already exists: ${badge.name}`);
    } else {
      await sql`
        INSERT INTO public.badges (name, description, icon_url, criteria_type, criteria_value)
        VALUES (${badge.name}, ${badge.description}, ${badge.iconUrl}, ${badge.criteriaType}, ${badge.criteriaValue});
      `;
      console.log(`  ✅ Created: ${badge.name}`);
    }
  }

  await sql.end();
  console.log("\n🎉 GENERAL BADGE SEEDING COMPLETE!");
  process.exit(0);
}

seedGeneralBadges().catch(async (e) => {
  console.error("Badge seeding error:", e);
  await sql.end();
  process.exit(1);
});
