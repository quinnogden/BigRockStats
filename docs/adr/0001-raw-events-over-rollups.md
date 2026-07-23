# Raw events over rollup tables

Every Message, Reaction and Voice Session is stored as its own row and aggregated with SQL at query time. There are no pre-computed rollup or summary tables, even though almost every screen displays an aggregate.

This looks like an obvious performance mistake and isn't. The server is ~56 Members producing ~10k Messages a month, so the whole dataset is well under a million rows — small enough that Postgres answers any of these queries in single-digit milliseconds with ordinary indexes. Rollups would buy nothing measurable while adding a second write path, a backfill path for the rollups themselves, and a permanent class of "the summary drifted from the source" bugs.

## Consequences

- A new metric is a new query, not a migration plus a derived-data rebuild. This is why both Reaction Given and Reaction Received are already available despite only one being displayed.
- Correcting bad data means fixing rows, with nothing downstream to invalidate.
- If the server ever grew by an order of magnitude, rollups could be added as a cache in front of these queries without changing the source of truth. Do that when a page is actually slow, not before.
