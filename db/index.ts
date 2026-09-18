import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let client: postgres.Sql | null = null;

export function getDb() {
  if (client) return drizzle(client, { schema });
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  
  client = postgres(connectionString, { prepare: false, ssl: { rejectUnauthorized: false } });
  return drizzle(client, { schema });
}

// For backwards compatibility, export a getter
export const db = new Proxy({} as any, {
  get(_target, prop) {
    const dbInstance = getDb();
    return dbInstance[prop as keyof typeof dbInstance];
  },
});
