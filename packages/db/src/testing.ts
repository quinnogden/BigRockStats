import { sql } from "drizzle-orm";
import { createDatabase } from "./client";
import type { DatabaseHandle } from "./client";
import { migrateToLatest } from "./migrate";
import { voiceSessions } from "./schema";
import type { VoiceSessionRow } from "./schema";

const DEFAULT_TEST_DATABASE_URL =
  "postgres://bigrock:bigrock@localhost:5433/bigrockstats_test";

/**
 * Connects to the real Postgres used by tests, applies migrations and empties
 * every table.
 *
 * Tests run against a real database on purpose: the windowing, ranking and
 * median logic largely *is* SQL, so mocking it would test nothing worth
 * testing. Start it with `docker compose up -d postgres-test`.
 */
export async function createTestDatabase(): Promise<DatabaseHandle> {
  const url = process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL;

  let handle: DatabaseHandle;
  try {
    handle = createDatabase(url);
    await handle.db.execute(sql`select 1`);
  } catch (cause) {
    throw new Error(
      `Could not connect to the test database at ${url}. ` +
        "Run `docker compose up -d postgres-test` first.",
      { cause },
    );
  }

  await migrateToLatest(handle.db);
  await truncateAll(handle);
  return handle;
}

/**
 * Reads the stored Voice Session rows.
 *
 * Row-level rather than behavioural on purpose: ADR-0001 makes "one raw event
 * row per Voice Session, storing true join and leave times" part of the
 * contract, and a total-hours assertion cannot tell one long session from two
 * short ones.
 */
export async function readVoiceSessions(
  handle: DatabaseHandle,
): Promise<VoiceSessionRow[]> {
  return handle.db.select().from(voiceSessions).orderBy(voiceSessions.joinedAt);
}

export async function truncateAll(handle: DatabaseHandle): Promise<void> {
  await handle.db.execute(
    sql`truncate table voice_sessions restart identity cascade`,
  );
}
