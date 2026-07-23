import { createDatabase, requireDatabaseUrl } from "@brs/db";
import type { Database } from "@brs/db";

/**
 * One connection pool per process, reused across requests and across hot
 * reloads in development.
 */
const globalForDatabase = globalThis as typeof globalThis & {
  brsDatabase?: Database;
};

export function getDatabase(): Database {
  globalForDatabase.brsDatabase ??= createDatabase(requireDatabaseUrl()).db;
  return globalForDatabase.brsDatabase;
}
