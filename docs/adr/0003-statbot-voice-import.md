# Voice history is imported from Statbot as hourly fractions

Discord keeps no record of past voice activity — unlike Messages and Reactions, voice time that wasn't observed as it happened is gone permanently. Statbot had been running on the server for about a year before this project existed, so its export is the only source of voice history that will ever be available. It is imported once, as Imported Voice Hours.

Statbot's chart exports give one row per hour, each value being the fraction of that hour spent in voice (`1` = the full sixty minutes, two decimal places, so roughly ±18 seconds per hour). Hourly resolution holds across a full-year range, so the import is a single export per view rather than a series of chunks.

Several exports are used together. The **member drilldown chart** gives one column per Member and is the actual import. A **member roster** export (`username, display_name, server_nickname, id, joined_at, created_on`) resolves chart columns to Discord user IDs — chart headers are `lower(server_nickname || display_name || username)`. The **server-wide voice chart** and an **all-time per-member ranking** both total the same figure and serve as checksums. An **all-time per-channel ranking** carries channel IDs and also reconciles to that total.

## Consequences

- Imported Voice Hours reduce to the same shape as aggregated Voice Sessions, so historical voice can feed the activity heatmap and can be re-bucketed into a viewer's timezone (ADR-0002) like everything else. There is no meaningful methodology seam at the import date.
- The one exception is timezones offset by a fraction of an hour. A viewer in such a zone gets imported voice attributed to the nearest whole hour. Nobody in this server is, and it is not worth handling.
- The hourly export carries **no channel**, so historical voice cannot be sliced by channel over time. A separate all-time per-channel ranking does exist and reconciles exactly to the server total, so the Channels page can show historical voice as **all-time totals only** — the Range tabs do not apply to it.
- Chart columns resolve to Discord user IDs via the roster export, so the import does **not** depend on the Collector being live. Unresolved columns are reported rather than silently dropped. Display names contain non-Latin characters and one contains embedded double quotes that the chart's header row fails to escape; the importer decodes UTF-8 explicitly and special-cases that header.
- **Members sharing a server nickname are collapsed by the export.** Two Members nicknamed "Kevin" produced two identical columns matching neither's true total. Colliding Members must be exported individually — alone in a file, the column is unambiguous. Any duplicate header is an error, never a merge.
- **The drilldown silently omits some Members.** Six with under four hours each were absent from a whole-server export. Membership of the import is verified against the all-time ranking, and missing Members are exported separately.
- Blank cells mean the Member had no voice activity in that hour and are imported as zero. They appear only in multi-series exports where series differ in length; the server-wide export has none.
- Statbot counts all connected time including time spent alone, which is why this project does too. See ADR-0004.
- The import is one-off. There is no ongoing Statbot dependency, and the premium upgrades it required can lapse once the import is verified.
- Nothing exists before Statbot's own window, and nothing can. Available voice history begins **2025-08-13**, while the server was created **2025-07-21** — the first three weeks of voice were never recorded by anything.

## Timezone

Exported timestamps are suffixed `Z` while the Statbot dashboard is configured to ADT, so the export is either genuine UTC or ADT mislabelled — a three-hour difference. The data itself does not settle it: the daily trough (05:00–11:00Z) and evening peak (20:00–01:00Z) read plausibly under either reading.

Imported as UTC, on the basis that the file should be taken at its word. This is verifiable rather than permanent: once the Collector has been running, its timestamps are unambiguously UTC, and comparing the overlapping window against a Statbot export for the same period will expose an offset immediately. Correcting it is a single shift applied to imported rows.
