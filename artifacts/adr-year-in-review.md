# ADR: Phase 6.8 — Year in Review (MVP)

## 1. Canonical date logic (hybrid)

**Decision:** The MVP uses `watched_at` when present; otherwise `created_at`. This matches aggregation semantics already used on Profile for “this year” style filters and avoids blocking on a `watched_at` migration.

**Implementation:** `canonicalWatchDate(log)` parses `log.watched_at || log.created_at`. Invalid or missing values exclude the log from year-scoped metrics.

**Context:** A dedicated `watched_at` column UI, migration, and optional backfill are slated for a follow-up release when watch-date editing ships.

**UI:** The Year in Review page includes a short disclaimer: films are grouped by these log dates; manual watch-date editing is coming later.

## 2. Headline count vs rating metrics

**Decision:** The headline **film count** includes every log with `watch_status === 'watched'` whose canonical date falls in the selected calendar year (**rating optional**).

**Decision:** **Average rating** and the **rating distribution histogram** use only logs in that same year scope that have a **finite numeric rating** (same scope subset, filtered for ratings).

**Context:** Keeps the headline inclusive while keeping rating stats meaningful when many logs omit scores.

## 3. Timezone boundary rule

**Decision:** Calendar membership (year and month buckets) uses the **viewer’s local timezone** via standard JavaScript `Date` methods (`getFullYear()`, `getMonth()`) on ISO timestamps returned by Supabase.

**Context:** Low-friction client aggregation; late-night local logs stay in the intended calendar year for most users.

## 4. MVP metric catalog (Tier 1 only)

Included:

- Headline total films (watched in year).
- Average rating + rating distribution (rated subset only).
- Top genres (cap 5).
- Top moods (ordered by count).
- Monthly watch counts (12 buckets, January–December).
- Physical collection: count of logs with a non-empty `source_upc`.
- Reviews written: count of logs with non-empty trimmed `review`.

Excluded from MVP: YoY comparison, share/OG images, longest/shortest runtime, server-side RPC aggregation.

## 5. Implementation shape

**Decision:** Single client fetch of `movie_logs` for the authenticated user; pure functions in `src/utils/yearInReview.js` (`buildYearInReview(year, logs)`) compute all metrics. No Supabase RPC for MVP.
