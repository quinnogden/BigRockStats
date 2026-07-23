import { and, eq, isNull } from "drizzle-orm";
import type { Snowflake } from "@brs/core";
import type { Database } from "./client";
import { voiceSessions } from "./schema";

export interface OpenVoiceSession {
  guildId: Snowflake;
  memberId: Snowflake;
  channelId: Snowflake;
  joinedAt: Date;
}

/**
 * Starts a Voice Session for a Member.
 *
 * At most one session per Member per guild may be open at a time; the database
 * enforces that with a partial unique index rather than trusting the caller.
 */
export async function openVoiceSession(
  db: Database,
  session: OpenVoiceSession,
): Promise<void> {
  await db.insert(voiceSessions).values(session);
}

export interface CloseVoiceSession {
  guildId: Snowflake;
  memberId: Snowflake;
  leftAt: Date;
}

/**
 * Ends a Member's open Voice Session. Does nothing if none is open, which is
 * what happens when the Collector starts up mid-session.
 *
 * @returns the number of sessions closed.
 */
export async function closeOpenVoiceSession(
  db: Database,
  { guildId, memberId, leftAt }: CloseVoiceSession,
): Promise<number> {
  const closed = await db
    .update(voiceSessions)
    .set({ leftAt })
    .where(
      and(
        eq(voiceSessions.guildId, guildId),
        eq(voiceSessions.memberId, memberId),
        isNull(voiceSessions.leftAt),
      ),
    )
    .returning({ id: voiceSessions.id });

  return closed.length;
}
