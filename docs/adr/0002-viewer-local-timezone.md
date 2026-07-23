# Ranges resolve in the viewer's timezone

Every Range except All-time is computed in the timezone of whoever is looking, so "Today" means the viewer's today and "This week" starts on their Monday. Every aggregate query therefore takes a timezone parameter rather than being a plain date-bounded query.

The alternative — a single configured server timezone — would have been simpler and made every result globally identical. It was rejected because a Member reading "you sent 40 messages today" wants that to mean their day, and a stat that silently rolls over at 3am is worse than a small amount of query complexity.

## Consequences

- Cached results must be keyed on `(range, timezone)`. In practice the server spans one to three timezones, so hit rates stay high — this would not hold on a public site.
- Two Members in different timezones can see legitimately different numbers on the same leaderboard at the same moment. This is correct, not a bug.
- All-time is timezone-invariant and needs no such handling.
- The activity heatmap is served as UTC hourly buckets and rotated client-side, which is how it can honestly label itself as local time.
- Imported Voice Hours participate fully. They arrive bucketed by hour, which is fine-grained enough to re-bucket into any whole-hour offset, so historical voice honours the viewer's Range like everything else. Viewers in a zone offset by a fraction of an hour are the sole exception, and there are none. See ADR-0003.
