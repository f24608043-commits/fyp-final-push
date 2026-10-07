import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local") });
import postgres from "postgres";

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { ssl: { rejectUnauthorized: false }, max: 1 });
  try {
    const fn = await sql`
      SELECT proname, pg_get_function_identity_arguments(oid) AS args
      FROM pg_proc WHERE proname = 'insert_message'
    `;
    console.log("insert_message FUNCTION:", JSON.stringify(fn));

    const migration = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema='public' AND table_name='messages' ORDER BY ordinal_position
    `;
    console.log("messages columns:", migration.map((c) => c.column_name).join(", "));
  } catch (e) {
    console.error("ERR", (e as Error).message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}
main();