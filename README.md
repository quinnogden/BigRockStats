# Big Rock Stats

A self-hosted activity tracker for a single Discord server. It records what happens in the server and presents it back to that server's own members as leaderboards, channel rankings and per-person profiles.

Sign-in is Discord OAuth, restricted to members of the one guild it tracks. No message content is ever stored — only who posted, where, and when.

## Status

Pre-implementation. The specification lives in [issue #1](https://github.com/quinnogden/BigRockStats/issues/1).

## Docs

- [`CONTEXT.md`](./CONTEXT.md) — the domain glossary. Start here.
- [`docs/adr/`](./docs/adr/) — architecture decisions and the reasoning behind them.
- [`docs/agents/`](./docs/agents/) — conventions for agents working in this repo.
