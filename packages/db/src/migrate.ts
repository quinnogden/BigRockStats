import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createDatabase, requireDatabaseUrl } from "./client";
import type { Database } from "./client";

const migrationsFolder = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../migrations",
);

export async function migrateToLatest(db: Database): Promise<void> {
  await migrate(db, { migrationsFolder });
}

/** `pnpm db:migrate` — applies pending migrations and exits. */
async function main(): Promise<void> {
  const handle = createDatabase(requireDatabaseUrl());
  try {
    await migrateToLatest(handle.db);
    console.log("Migrations applied.");
  } finally {
    await handle.close();
  }
}

const invokedDirectly =
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
