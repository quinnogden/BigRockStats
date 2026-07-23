import { sql } from "drizzle-orm";
import type { Database } from "./client";

export interface VoiceTotalOptions {
  /**
   * The moment an open Voice Session is measured up to. Defaults to now, so a
   * Member currently sitting in voice contributes the time they have been
   * there rather than nothing at all.
   */
  asOf?: Date;
}

/**
 * Total voice hours across the whole server, all-time.
 *
 * Later tickets add Ranges, which resolve in the viewer's timezone (ADR-0002).
 * All-time is timezone-invariant, so this one needs no timezone.
 */
export async function getTotalVoiceHours(
  db: Database,
  options: VoiceTotalOptions = {},
): Promise<number> {
  const asOf = options.asOf ?? new Date();

  const result = await db.execute<{ hours: string }>(sql`
    select coalesce(
      sum(extract(epoch from (coalesce(left_at, ${asOf.toISOString()}::timestamptz) - joined_at))),
      0
    ) / 3600 as hours
    from voice_sessions
  `);

  return Number(result.rows[0]?.hours ?? 0);
}
