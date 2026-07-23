# Big Rock Stats

A self-hosted activity tracker for a single Discord server. It records what happens in the server and presents it back to that server's own members as leaderboards, channel rankings and per-person profiles.

Sign-in is Discord OAuth, restricted to members of the one guild it tracks. No message content is ever stored — only who posted, where, and when.

## Status

Early. The Collector records Voice Sessions and the site shows the server's
total voice hours. Auth, Ranges, Messages, Reactions and every real page are
still to come — see [issue #1](https://github.com/quinnogden/BigRockStats/issues/1)
for the specification and the open tickets for what is next.

## Running it

```sh
cp .env.example .env   # then fill in the Discord values
docker compose up
```

That brings up Postgres, applies migrations, starts the Collector and serves
the site on `http://localhost:3000`.

**Start the Collector as early as you can.** Discord keeps no record of past
voice activity, so voice time that is not observed as it happens is gone
permanently. Messages and Reactions can always be re-crawled later; voice
cannot.

Only one Collector may run at a time — a second would record every event twice.
The process takes a Postgres advisory lock on startup and exits rather than
double-counting, so this is enforced rather than merely documented.

### Discord bot setup

The bot needs the **Guilds** and **Guild Voice States** intents. Neither is
privileged, so no dev-portal toggles are required yet.

The privileged **Message Content** intent is **not** required and should stay
off: no message content is ever stored. Later work adds the privileged **Guild
Members** and **Guild Presences** intents for the roster and status dots.

## Development

```sh
pnpm install
docker compose --profile test up -d postgres-test   # real Postgres for tests
pnpm test
pnpm typecheck
```

Tests run against a real Postgres on purpose — the windowing, ranking and
median logic largely *is* SQL, so mocking the database would test nothing worth
testing. The test database is a separate container from the real one, so a test
run can never truncate irreplaceable voice history.

## Docs

- [`CONTEXT.md`](./CONTEXT.md) — the domain glossary. Start here.
- [`docs/adr/`](./docs/adr/) — architecture decisions and the reasoning behind them.
- [`docs/agents/`](./docs/agents/) — conventions for agents working in this repo.
