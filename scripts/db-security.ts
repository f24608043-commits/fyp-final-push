import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local") });
import postgres from "postgres";

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { ssl: { rejectUnauthorized: false }, max: 1 });
  try {
    const realtime = await sql`
      SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' ORDER BY tablename
    `;
    console.log("REALTIME PUBLICATION TABLES:");
    for (const r of realtime) console.log("  -", r.tablename);

    const rls = await sql`
      SELECT tablename, rowsecurity FROM pg_tables
      WHERE schemaname='public' AND rowsecurity=true ORDER BY tablename
    `;
    console.log("\nTABLES WITH RLS ENABLED (" + rls.length + "):");
    for (const r of rls) console.log("  -", r.tablename);

    const policies = await sql`
      SELECT schemaname, tablename, policyname, cmd, roles
      FROM pg_policies WHERE schemaname='public' ORDER BY tablename LIMIT 60
    `;
    console.log("\nRLS POLICIES (first 60):");
    for (const p of policies) console.log(`  ${p.tablename} [${p.cmd}]: ${p.policyname} ${p.roles}`);

    // Grant check for anon/authenticated
    const grants = await sql`
      SELECT table_name, grantee, privilege_type FROM information_schema.role_table_grants
      WHERE table_schema='public' AND grantee IN ('anon','authenticated')
      GROUP BY table_name, grantee, privilege_type
      ORDER BY table_name, grantee LIMIT 40
    `;
    console.log("\nGRANTS TO anon/authenticated:");
    for (const g of grants) console.log(`  ${g.table_name} -> ${g.grantee}: ${g.privilege_type}`);
  } catch (e) {
    console.error("ERR", (e as Error).message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}
main();