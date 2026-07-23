import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getTotalVoiceHours } from "@brs/db";
import type { DatabaseHandle } from "@brs/db";
import {
  createTestDatabase,
  readVoiceSessions,
  truncateAll,
} from "@brs/db/testing";
import { createVoiceStateRecorder, recordVoiceStateChange } from "./voice";

/**
 * The ingest→query seam: Discord-shaped voice state changes go in through the
 * Collector's handler, voice hours come out through the query function the
 * page consumes. Nothing here knows the shape of a query or the name of a
 * column.
 */

const GUILD = "900000000000000001";
const ALICE = "900000000000000010";
const BOB = "900000000000000011";
const GENERAL = "900000000000000020";
const GAMING = "900000000000000021";

let handle: DatabaseHandle;

beforeEach(async () => {
  handle ??= await createTestDatabase();
  await truncateAll(handle);
});

afterAll(async () => {
  await handle?.close();
});

function joins(memberId: string, channelId: string) {
  return {
    before: { guildId: GUILD, memberId, channelId: null },
    after: { guildId: GUILD, memberId, channelId },
  };
}

function leaves(memberId: string, channelId: string) {
  return {
    before: { guildId: GUILD, memberId, channelId },
    after: { guildId: GUILD, memberId, channelId: null },
  };
}

function moves(memberId: string, from: string, to: string) {
  return {
    before: { guildId: GUILD, memberId, channelId: from },
    after: { guildId: GUILD, memberId, channelId: to },
  };
}

/** Discord reports mute and deafen changes as a same-channel transition. */
function togglesMute(memberId: string, channelId: string) {
  return moves(memberId, channelId, channelId);
}

describe("recording Voice Sessions", () => {
  it("counts the time between a Member joining and leaving", async () => {
    await recordVoiceStateChange(
      handle.db,
      joins(ALICE, GENERAL),
      new Date("2026-01-01T10:00:00Z"),
    );
    await recordVoiceStateChange(
      handle.db,
      leaves(ALICE, GENERAL),
      new Date("2026-01-01T12:30:00Z"),
    );

    expect(await getTotalVoiceHours(handle.db)).toBeCloseTo(2.5, 6);
  });

  it("stores one session with the true join and leave times", async () => {
    const joinedAt = new Date("2026-01-01T10:00:00Z");
    const leftAt = new Date("2026-01-01T12:30:00Z");

    await recordVoiceStateChange(handle.db, joins(ALICE, GENERAL), joinedAt);
    await recordVoiceStateChange(handle.db, leaves(ALICE, GENERAL), leftAt);

    const sessions = await readVoiceSessions(handle);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      memberId: ALICE,
      channelId: GENERAL,
      joinedAt,
      leftAt,
    });
  });

  it("keeps time continuous when a Member moves between voice channels", async () => {
    await recordVoiceStateChange(
      handle.db,
      joins(ALICE, GENERAL),
      new Date("2026-01-01T10:00:00Z"),
    );
    await recordVoiceStateChange(
      handle.db,
      moves(ALICE, GENERAL, GAMING),
      new Date("2026-01-01T11:00:00Z"),
    );
    await recordVoiceStateChange(
      handle.db,
      leaves(ALICE, GAMING),
      new Date("2026-01-01T11:30:00Z"),
    );

    expect(await getTotalVoiceHours(handle.db)).toBeCloseTo(1.5, 6);

    const sessions = await readVoiceSessions(handle);
    expect(sessions.map((session) => session.channelId)).toEqual([
      GENERAL,
      GAMING,
    ]);
  });

  it("does not split a session when a Member mutes or deafens", async () => {
    await recordVoiceStateChange(
      handle.db,
      joins(ALICE, GENERAL),
      new Date("2026-01-01T10:00:00Z"),
    );
    await recordVoiceStateChange(
      handle.db,
      togglesMute(ALICE, GENERAL),
      new Date("2026-01-01T10:30:00Z"),
    );
    await recordVoiceStateChange(
      handle.db,
      leaves(ALICE, GENERAL),
      new Date("2026-01-01T11:00:00Z"),
    );

    expect(await readVoiceSessions(handle)).toHaveLength(1);
    expect(await getTotalVoiceHours(handle.db)).toBeCloseTo(1, 6);
  });

  it("counts an ongoing session up to the moment it is asked about", async () => {
    await recordVoiceStateChange(
      handle.db,
      joins(ALICE, GENERAL),
      new Date("2026-01-01T10:00:00Z"),
    );

    const total = await getTotalVoiceHours(handle.db, {
      asOf: new Date("2026-01-01T13:00:00Z"),
    });

    expect(total).toBeCloseTo(3, 6);
  });

  it("sums the time of every Member in the server", async () => {
    await recordVoiceStateChange(
      handle.db,
      joins(ALICE, GENERAL),
      new Date("2026-01-01T10:00:00Z"),
    );
    await recordVoiceStateChange(
      handle.db,
      joins(BOB, GAMING),
      new Date("2026-01-01T10:00:00Z"),
    );
    await recordVoiceStateChange(
      handle.db,
      leaves(ALICE, GENERAL),
      new Date("2026-01-01T11:00:00Z"),
    );
    await recordVoiceStateChange(
      handle.db,
      leaves(BOB, GAMING),
      new Date("2026-01-01T12:00:00Z"),
    );

    expect(await getTotalVoiceHours(handle.db)).toBeCloseTo(3, 6);
  });

  it("reports no voice hours when nothing has been recorded", async () => {
    expect(await getTotalVoiceHours(handle.db)).toBe(0);
  });
});

describe("rapid transitions", () => {
  /**
   * The gateway hands the Collector events without waiting for the previous
   * one to be stored. A Member hopping channels quickly can therefore have a
   * move arrive while their join is still being written.
   */
  it("keeps one Member's overlapping events in order", async () => {
    const record = createVoiceStateRecorder(handle.db);

    await Promise.all([
      record(joins(ALICE, GENERAL), new Date("2026-01-01T10:00:00Z")),
      record(moves(ALICE, GENERAL, GAMING), new Date("2026-01-01T11:00:00Z")),
      record(leaves(ALICE, GAMING), new Date("2026-01-01T11:30:00Z")),
    ]);

    const sessions = await readVoiceSessions(handle);
    expect(sessions.map((session) => session.channelId)).toEqual([
      GENERAL,
      GAMING,
    ]);
    expect(sessions.every((session) => session.leftAt !== null)).toBe(true);
    expect(await getTotalVoiceHours(handle.db)).toBeCloseTo(1.5, 6);
  });

  it("does not make one Member's events wait behind another's", async () => {
    const record = createVoiceStateRecorder(handle.db);

    await Promise.all([
      record(joins(ALICE, GENERAL), new Date("2026-01-01T10:00:00Z")),
      record(joins(BOB, GAMING), new Date("2026-01-01T10:00:00Z")),
      record(leaves(ALICE, GENERAL), new Date("2026-01-01T11:00:00Z")),
      record(leaves(BOB, GAMING), new Date("2026-01-01T12:00:00Z")),
    ]);

    expect(await getTotalVoiceHours(handle.db)).toBeCloseTo(3, 6);
  });
});
