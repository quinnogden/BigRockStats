# Voice time counts all connected time, including time spent alone

A Voice Session accrues time from joining a voice channel to leaving it, regardless of whether anyone else is present or whether the Member is muted or deafened. Only the AFK channel is excluded.

The obvious objection is that this rewards idling: someone who sits alone in a channel for six hours outranks someone who actually spent an hour talking to friends. Excluding solo time was seriously considered and rejected for one reason — the year of voice history imported from Statbot counts all connected time (see ADR-0003), and there is no way to reconstruct historical channel occupancy. Measuring live voice differently from imported voice would have put a silent methodology change in the middle of the dataset, which is worse than a leaderboard that occasionally rewards an idler.

## Consequences

- Voice leaderboards can be topped by presence rather than participation. This is known and accepted.
- Voice numbers are directly comparable with Statbot's, which makes Statbot usable as a ground-truth check after Backfill.
- Muted and deafened state is not tracked at all, so sessions are never split on state changes.
- If solo time were ever excluded later, it could only apply to data collected from that point on — creating exactly the discontinuity this decision avoids.
