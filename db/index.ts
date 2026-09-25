import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function getClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return postgres(connectionString, {
    prepare: false,
    ssl: { rejectUnauthorized: false },
    connection: {
      timeout: 30000, // 30 second connection timeout
    },
    max: 15, // Match Supabase pooler limit exactly
    idle_timeout: 5, // Close idle connections faster to prevent leaks
    connect_timeout: 30, // 30 second connection attempt timeout
    max_lifetime: 60 * 15, // Recycle connections after 15 minutes
    onnotice: () => {}, // Ignore notices from pgbouncer
  });
}

export const db = drizzle(getClient(), { schema });

// Export schema tables for convenience
export * from "./schema";
