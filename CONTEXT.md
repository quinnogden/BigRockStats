# Big Rock Stats

A self-hosted activity tracker for a single Discord server. It records what happens in the server and presents it back to that server's own members as leaderboards, channel rankings and per-person profiles.

## Language

### People

**Member**:
Someone currently in the Discord server. Bots and webhooks are never Members.
_Avoid_: User, account, player

**Former Member**:
Someone who was a Member and has since left. Their history is kept; their access is not.
_Avoid_: Deleted member, inactive member, churned user

**Member Profile**:
The page showing one Member's own statistics. Any Member can view any Member Profile — it is not restricted to your own.
_Avoid_: My Stats (that is only the navigation label), user page, profile page

**Typical Member**:
The median Member with any activity in the selected Range. The baseline that headline numbers are compared against.
_Avoid_: Average member, mean, server average

### Activity

**Message**:
A single message sent by a Member in a Tracked Channel. Only its author, channel and timestamp are recorded — never its content. A Message that was later deleted still counts.
_Avoid_: Post, chat, event

**Reaction Given**:
An emoji a Member added to someone else's Message. This is what the interface means whenever it says "reactions".
_Avoid_: Emoji use, react

**Reaction Received**:
An emoji added by someone else to a Member's own Message. Recorded, but not currently displayed.
_Avoid_: Reactions earned, popularity

**Voice Session**:
One continuous stretch of a Member being connected to a voice channel, from joining to leaving. Time spent alone still counts; the AFK channel is excluded entirely.
_Avoid_: Voice time (that is the aggregate), call, VC session

**Imported Voice Hour**:
The fraction of one clock hour that one Member spent in voice, imported once from Statbot to cover the period before this tracker existed. Carries no channel, so it can never be attributed to a particular voice channel.
_Avoid_: Imported voice day, historical voice, legacy data, voice backfill

**Badge**:
A named award shown on a Member Profile, earned by a fixed rule such as leading the server in messages.
_Avoid_: Achievement, award, trophy

**Server Rank**:
A Member's position when every Member is ordered by all-time Messages. Always this one metric, never a blend.
_Avoid_: Score, level, overall rank

### Places and scope

**Tracked Channel**:
A channel explicitly listed in the server's configuration as one to record. Activity anywhere else is invisible to the tracker. Threads count toward their parent Tracked Channel rather than appearing separately.
_Avoid_: Watched channel, enabled channel, indexed channel

**Range**:
The time window a page is showing — All-time, This month, This week or Today. Every Range except All-time is resolved in the viewer's own timezone.
_Avoid_: Period, timeframe, filter, window

### Collection

**Collector**:
The single long-lived process holding the Discord connection, recording activity as it happens. Exactly one may run at a time.
_Avoid_: Bot, worker, listener, daemon

**Backfill**:
The one-off crawl of Discord's history that populates Messages and Reactions from before the Collector existed. Resumable, and safe to re-run. Voice activity cannot be backfilled.
_Avoid_: Import (that means the Statbot voice data), sync, scrape, seed
