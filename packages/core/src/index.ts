/**
 * Reads a required environment variable.
 *
 * Configuration is one env file, so a missing value is a setup mistake worth
 * failing loudly and early on rather than discovering at the first query.
 */
export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. See .env.example.`);
  }
  return value;
}

/** A Discord snowflake ID. Always carried as a string — they exceed 2^53. */
export type Snowflake = string;

/**
 * The parts of a Discord voice state this project records.
 *
 * Deliberately structural rather than a discord.js type: the Collector's
 * handlers are the ingest seam, and tests drive them with plain objects.
 */
export interface VoiceState {
  guildId: Snowflake;
  memberId: Snowflake;
  /** The voice channel the Member is in, or null when they are not in one. */
  channelId: Snowflake | null;
}

/**
 * A transition between two voice states for one Member.
 *
 * Discord reports mute and deafen changes through the same event; those arrive
 * as a transition where the channel is unchanged. Voice time counts all
 * connected time regardless of that state (ADR-0004), so such transitions are
 * not recorded.
 */
export interface VoiceStateChange {
  before: VoiceState;
  after: VoiceState;
}
