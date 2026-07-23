import type { VoiceStateChange } from "@brs/core";
import { closeOpenVoiceSession, openVoiceSession } from "@brs/db";
import type { Database } from "@brs/db";

export type VoiceStateRecorder = (
  change: VoiceStateChange,
  observedAt: Date,
) => Promise<void>;

/**
 * Builds the recorder the Collector hands gateway events to.
 *
 * The gateway does not wait for one event to be stored before delivering the
 * next, so a Member hopping channels can have their move arrive mid-write.
 * Processed concurrently, the leave can land before the join and strand an
 * open session that then reads as hundreds of hours.
 *
 * Work is therefore queued per Member: each Member's events are applied in
 * arrival order, while different Members still proceed in parallel.
 */
export function createVoiceStateRecorder(db: Database): VoiceStateRecorder {
  const pending = new Map<string, Promise<void>>();

  return (change, observedAt) => {
    const key = `${change.after.guildId}:${change.after.memberId}`;
    const previous = pending.get(key) ?? Promise.resolve();

    // A failed event must not stall the Member's queue behind it.
    const next = previous
      .catch(() => undefined)
      .then(() => recordVoiceStateChange(db, change, observedAt));

    const settled = next.catch(() => undefined).then(() => {
      if (pending.get(key) === settled) {
        pending.delete(key);
      }
    });
    pending.set(key, settled);

    return next;
  };
}

/**
 * Records a Member's voice state change as a Voice Session.
 *
 * `observedAt` is when the Collector saw the event. Discord does not stamp
 * voice state updates, so this is the truest join and leave time available.
 */
export async function recordVoiceStateChange(
  db: Database,
  change: VoiceStateChange,
  observedAt: Date,
): Promise<void> {
  const { before, after } = change;

  // Mute and deafen changes arrive as a transition with the channel unchanged.
  // Voice time counts all connected time regardless of that state, so a
  // session is never split on one (ADR-0004).
  if (before.channelId === after.channelId) {
    return;
  }

  if (before.channelId !== null) {
    await closeOpenVoiceSession(db, {
      guildId: after.guildId,
      memberId: after.memberId,
      leftAt: observedAt,
    });
  }

  if (after.channelId !== null) {
    await openVoiceSession(db, {
      guildId: after.guildId,
      memberId: after.memberId,
      channelId: after.channelId,
      joinedAt: observedAt,
    });
  }
}
