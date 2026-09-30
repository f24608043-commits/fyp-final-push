import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import postgres from "postgres";
import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sql = postgres(process.env.DATABASE_URL!, { ssl: { rejectUnauthorized: false } });

async function runMigration() {
  console.log("=== Running base migration (0003_remarkable_spyke.sql) ===\n");

  try {
    // Run the base migration to create tutor tables
    const baseMigrationPath = join(__dirname, "../drizzle/0003_remarkable_spyke.sql");
    const baseMigrationSQL = readFileSync(baseMigrationPath, "utf-8");

    console.log("Executing base schema migration...");
    await sql.unsafe(baseMigrationSQL);
    console.log("✓ Base schema migration completed\n");

    console.log("=== Running feature migration (0010_add_tutoring_features.sql) ===\n");

    // Run the feature migration to add new columns and tables
    const featureMigrationPath = join(__dirname, "../drizzle/0010_add_tutoring_features.sql");
    const featureMigrationSQL = readFileSync(featureMigrationPath, "utf-8");

    console.log("Executing feature schema migration...");
    await sql.unsafe(featureMigrationSQL);
    console.log("✓ Feature schema migration completed\n");

    console.log("=== Migration completed successfully ===");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

runMigration().catch((e) => {
  console.error("Script failed:", e);
  process.exit(1);
});
