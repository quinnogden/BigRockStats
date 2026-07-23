import { Client, Events, GatewayIntentBits } from "discord.js";
import type { VoiceState as DiscordVoiceState } from "discord.js";
import {
  acquireCollectorLock,
  createDatabase,
  migrateToLatest,
} from "@brs/db";
import type { VoiceState } from "@brs/core";
import { loadConfig } from "./config";
import { createVoiceStateRecorder } from "./handlers/voice";

/**
 * The Collector: the single long-lived process holding the Discord connection,
 * recording activity as it happens.
 *
 * Required gateway intents are only Guilds and GuildVoiceStates. Notably the
 * privileged Message Content intent is NOT required and must not be enabled —
 * no message content is ever stored. Later tickets add the privileged Guild
 * Members and Guild Presences intents for the roster and status dots.
 */
async function main(): Promise<void> {
  const config = loadConfig();
  const database = createDatabase(config.databaseUrl);

  await migrateToLatest(database.db);

  const lock = await acquireCollectorLock(database.pool);
  if (!lock) {
    console.error(
      "Another Collector already holds the gateway connection. " +
        "Exactly one may run at a time — two would record every event twice. " +
        "Exiting.",
    );
    await database.close();
    process.exit(1);
  }

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  });

  client.on(Events.ClientReady, (ready) => {
    console.log(`Collector connected as ${ready.user.tag}.`);
  });

  const recordVoiceState = createVoiceStateRecorder(database.db);

  client.on(Events.VoiceStateUpdate, (before, after) => {
    const observedAt = new Date();

    if (after.guild.id !== config.guildId) {
      return;
    }

    void recordVoiceState(
      { before: toVoiceState(before), after: toVoiceState(after) },
      observedAt,
    ).catch((error: unknown) => {
      console.error("Failed to record a voice state change:", error);
    });
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`Received ${signal}, shutting down.`);
    client.destroy();
    await lock.release();
    await database.close();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  await client.login(config.discordBotToken);
}

function toVoiceState(state: DiscordVoiceState): VoiceState {
  return {
    guildId: state.guild.id,
    memberId: state.id,
    channelId: state.channelId,
  };
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
