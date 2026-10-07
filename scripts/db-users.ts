import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local") });
import postgres from "postgres";

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { ssl: { rejectUnauthorized: false }, max: 1 });
  try {
    const users = await sql`
      SELECT au.email,
             au.raw_user_meta_data->>'display_name' AS display_name,
             p.role, p.id, p.onboarding_done, p.xp, p.streak_count,
             (au.raw_app_meta_data->>'provider') AS provider,
             au.confirmed_at IS NOT NULL AS confirmed,
             (SELECT count(*)::int FROM public.session_requests sr WHERE sr.learner_id = p.id OR sr.tutor_id = p.id) AS sessions
      FROM auth.users au
      LEFT JOIN public.profiles p ON p.id = au.id
      WHERE au.email IN (
        'alexabraham587@gmail.com',
        'ophix.itsolutions@gmail.com',
        'F24608052@nutech.edu.pk'
      )
      ORDER BY au.email
    `;
    console.log("TARGET USERS:");
    for (const u of users) console.log(JSON.stringify(u, null, 2));

    const broad = await sql`
      SELECT au.email, p.role, p.onboarding_done, p.created_at
      FROM auth.users au
      LEFT JOIN public.profiles p ON p.id = au.id
      WHERE au.email ILIKE '%itsolutions%' OR au.email ILIKE '%nutech%' OR au.email ILIKE '%abraham%' OR au.email ILIKE 'f24%'
      ORDER BY au.email
    `;
    console.log("\nBROAD SEARCH:");
    for (const u of broad) console.log("  ", JSON.stringify(u));

    const tutors = await sql`
      SELECT au.email, p.role, p.onboarding_done, p.id
      FROM auth.users au
      LEFT JOIN public.profiles p ON p.id = au.id
      WHERE p.role IN ('tutor','admin')
      ORDER BY au.email
    `;
    console.log("\nALL TUTORS + ADMINS:");
    for (const u of tutors) console.log("  ", JSON.stringify(u));
  } catch (e) {
    console.error("ERR", (e as Error).message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}
main();