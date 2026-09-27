import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Next.js dev-mode singleton pattern to prevent connection leaks
const globalForDb = globalThis as unknown as {
  client: ReturnType<typeof postgres> | undefined;
};

function getClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Return existing client in dev mode, or create new one
  if (globalForDb.client) {
    return globalForDb.client;
  }

  const client = postgres(connectionString, {
    prepare: false,
    ssl: { rejectUnauthorized: false },
    connection: {
      timeout: 120000, // 120 second connection timeout
    },
    max: 10, // Reduce pool size to prevent connection exhaustion
    idle_timeout: 20, // Close idle connections faster
    connect_timeout: 120, // 120 second connection attempt timeout
    max_lifetime: 60 * 10, // Recycle connections after 10 minutes
    onnotice: () => {}, // Ignore notices from pgbouncer
  });

  // Store in global for dev mode hot-reloading
  if (process.env.NODE_ENV !== "production") {
    globalForDb.client = client;
  }

  return client;
}

export const db = drizzle(getClient(), { schema });

// Export schema tables for convenience
export * from "./schema";
