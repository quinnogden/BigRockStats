CREATE TABLE "voice_sessions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"member_id" text NOT NULL,
	"channel_id" text NOT NULL,
	"joined_at" timestamp with time zone NOT NULL,
	"left_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "voice_sessions_one_open_per_member" ON "voice_sessions" USING btree ("guild_id","member_id") WHERE "voice_sessions"."left_at" is null;--> statement-breakpoint
CREATE INDEX "voice_sessions_joined_at_idx" ON "voice_sessions" USING btree ("joined_at");