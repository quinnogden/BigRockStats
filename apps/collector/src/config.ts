import "dotenv/config";
import { requiredEnv } from "@brs/core";

export interface CollectorConfig {
  databaseUrl: string;
  discordBotToken: string;
  guildId: string;
}

export function loadConfig(): CollectorConfig {
  return {
    databaseUrl: requiredEnv("DATABASE_URL"),
    discordBotToken: requiredEnv("DISCORD_BOT_TOKEN"),
    guildId: requiredEnv("DISCORD_GUILD_ID"),
  };
}
