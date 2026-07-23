import { afterAll, beforeAll, expect, it } from "vitest";
import type { CollectorLock, DatabaseHandle } from "./index";
import { acquireCollectorLock } from "./index";
import { createTestDatabase } from "./testing";

let handle: DatabaseHandle;
const held: CollectorLock[] = [];

beforeAll(async () => {
  handle = await createTestDatabase();
});

afterAll(async () => {
  for (const lock of held) {
    await lock.release();
  }
  await handle?.close();
});

it("lets only one Collector hold the gateway connection at a time", async () => {
  const first = await acquireCollectorLock(handle.pool);
  expect(first).not.toBeNull();
  held.push(first!);

  // A second Collector would record every event twice.
  expect(await acquireCollectorLock(handle.pool)).toBeNull();

  await held.pop()!.release();

  // Once the first one goes away, a replacement can take over.
  const replacement = await acquireCollectorLock(handle.pool);
  expect(replacement).not.toBeNull();
  held.push(replacement!);
});
