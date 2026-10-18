import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

let sql: NeonQueryFunction<false, false> | null = null;

if (connectionString) {
  sql = neon(connectionString);
}

export const db = sql ? drizzle(sql, { schema }) : (null as unknown as ReturnType<typeof drizzle<typeof schema>>);

export function getDb() {
  if (!db) {
    throw new Error(
      "DATABASE_URL is not configured. Please set DATABASE_URL in your .env or environment variables."
    );
  }
  return db;
}
