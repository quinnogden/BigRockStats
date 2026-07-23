import { sql } from "drizzle-orm";
import {
  bigserial,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * One row per Voice Session — a continuous stretch of a Member being connected
 * to a voice channel, from joining to leaving.
 *
 * Raw event rows only; there are no rollup tables anywhere in this schema
 * (ADR-0001). Sessions store true join and leave times, and attribution to
 * hours, days and Ranges happens at query time so the raw data stays honest.
 *
 * A row whose `leftAt` is null is an open session: the Member is still
 * connected. The partial unique index makes "at most one open session per
 * Member per guild" an invariant the database enforces, rather than something
 * the Collector has to remember.
 */
export const voiceSessions = pgTable(
  "voice_sessions",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    guildId: text("guild_id").notNull(),
    memberId: text("member_id").notNull(),
    channelId: text("channel_id").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull(),
    leftAt: timestamp("left_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("voice_sessions_one_open_per_member")
      .on(table.guildId, table.memberId)
      .where(sql`${table.leftAt} is null`),
    index("voice_sessions_joined_at_idx").on(table.joinedAt),
  ],
);

export type VoiceSessionRow = typeof voiceSessions.$inferSelect;
