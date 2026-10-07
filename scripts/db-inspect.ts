import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local") });
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  console.log("DATABASE_URL set:", !!url, url ? url.slice(0, 40) + "..." : "MISSING");
  if (!url) process.exit(1);
  const sql = postgres(process.env.DATABASE_URL!, {
    ssl: { rejectUnauthorized: false },
    max: 1,
  });

  try {
    const db = await sql`SELECT current_database() AS db, current_user AS usr, version() AS ver`;
    console.log("CONNECTION:", JSON.stringify(db[0], null, 2));

    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `;
    console.log("\nPUBLIC TABLES (" + tables.length + "):");
    for (const t of tables) console.log("  -", t.table_name);

    // Row counts per table
    console.log("\nROW COUNTS:");
    for (const t of tables) {
      try {
        const count = await sql`SELECT count(*)::int AS c FROM ${sql(t.table_name)}`;
        console.log(`  ${t.table_name}: ${count[0].c} rows`);
      } catch (e) {
        console.log(`  ${t.table_name}: ERROR reading - ${(e as Error).message}`);
      }
    }

    // Enums
    const enums = await sql`
      SELECT t.typname, e.enumlabel
      FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' ORDER BY t.typname, e.enumsortorder
    `;
    console.log("\nENUMS:");
    for (const e of enums) console.log(`  ${e.typname}: ${e.enumlabel}`);

    // Auth users (emails + roles) - count only
    const users = await sql`
      SELECT count(*)::int AS c FROM auth.users
    `;
    console.log("\nAUTH USERS: " + users[0].c);
  } catch (err) {
    console.error("DB ERROR:", (err as Error).message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error("DB ERROR CODE:", (err as any)?.code);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error("DB ERROR DETAIL:", (err as any)?.detail);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error("DB ERROR STACK:", (err as Error).stack);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();