import type pg from "pg";

/**
 * Advisory lock key for the Collector's gateway connection. Arbitrary, but
 * fixed: every Collector process competes for this one key.
 */
const COLLECTOR_LOCK_KEY = 8_726_401;

export interface CollectorLock {
  release(): Promise<void>;
}

/**
 * Claims the right to be the Collector.
 *
 * Exactly one Collector may hold the Discord gateway connection — a second one
 * would record every event twice, silently doubling every voice, message and
 * reaction figure. Rather than trusting deployment configuration to enforce
 * that, the process takes a Postgres advisory lock and refuses to start
 * without it. The lock is held on a dedicated connection for the process's
 * lifetime and is released by Postgres automatically if the process dies, so a
 * crashed Collector never blocks its own replacement.
 *
 * @returns the lock, or null if another Collector already holds it.
 */
export async function acquireCollectorLock(
  pool: pg.Pool,
): Promise<CollectorLock | null> {
  const client = await pool.connect();

  try {
    const result = await client.query<{ acquired: boolean }>(
      "select pg_try_advisory_lock($1) as acquired",
      [COLLECTOR_LOCK_KEY],
    );

    if (!result.rows[0]?.acquired) {
      client.release();
      return null;
    }
  } catch (error) {
    client.release();
    throw error;
  }

  return {
    async release() {
      try {
        await client.query("select pg_advisory_unlock($1)", [
          COLLECTOR_LOCK_KEY,
        ]);
      } finally {
        client.release();
      }
    },
  };
}
