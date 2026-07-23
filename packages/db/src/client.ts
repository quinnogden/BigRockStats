import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { requiredEnv } from "@brs/core";
import * as schema from "./schema";

export type Database = ReturnType<typeof drizzle<typeof schema>>;

export interface DatabaseHandle {
  db: Database;
  pool: pg.Pool;
  close(): Promise<void>;
}

export function createDatabase(connectionString: string): DatabaseHandle {
  const pool = new pg.Pool({ connectionString });
  const db = drizzle(pool, { schema });

  return {
    db,
    pool,
    close: () => pool.end(),
  };
}

export function requireDatabaseUrl(): string {
  return requiredEnv("DATABASE_URL");
}
