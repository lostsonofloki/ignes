/**
 * Year in Review — pure aggregation helpers (Phase 6.8 MVP).
 * See artifacts/adr-year-in-review.md for canonical date and metric rules.
 */

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * @param {Record<string, unknown>} log
 * @returns {Date | null}
 */
export function canonicalWatchDate(log) {
  if (!log) return null;
  const raw = log.watched_at ?? log.created_at;
  if (raw == null || raw === '') return null;
  const d = new Date(raw);
  return Number.isFinite(d.getTime()) ? d : null;
}

/**
 * @param {Record<string, unknown>} log
 * @returns {boolean}
 */
export function isWatchedLog(log) {
  return String(log?.watch_status || '').toLowerCase() === 'watched';
}

/**
 * @param {Record<string, unknown>[]} logs
 * @param {number} year calendar year (e.g. 2026)
 * @returns {Record<string, unknown>[]}
 */
export function filterLogsForYear(logs, year) {
  if (!Array.isArray(logs) || !Number.isFinite(year)) return [];
  return logs.filter((log) => {
    if (!isWatchedLog(log)) return false;
    const d = canonicalWatchDate(log);
    if (!d) return false;
    return d.getFullYear() === year;
  });
}

function topNamedCounts(countMap, limit) {
  return Object.entries(countMap)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

/**
 * @param {Record<string, unknown>[]} logs full movie_logs rows for one user
 * @param {number} year
 * @returns {{
 *   year: number,
 *   filmCount: number,
 *   avgRating: number | null,
 *   ratingHistogram: { rating: string, count: number }[],
 *   topGenres: { name: string, count: number }[],
 *   topMoods: { name: string, count: number }[],
 *   monthlyCounts: { monthIndex: number, label: string, count: number }[],
 *   physicalScanCount: number,
 *   reviewsWrittenCount: number,
 *   ratedFilmCount: number,
 * }}
 */
export function buildYearInReview(year, logs) {
  const yearLogs = filterLogsForYear(logs, year);

  const ratedLogs = yearLogs.filter((m) => {
    const r = m?.rating;
    return r != null && Number.isFinite(Number(r));
  });

  let avgRating = null;
  if (ratedLogs.length > 0) {
    const sum = ratedLogs.reduce((acc, m) => acc + Number(m.rating), 0);
    avgRating = Math.round((sum / ratedLogs.length) * 10) / 10;
  }

  const ratingCounts = {};
  ratedLogs.forEach((movie) => {
    const key = Number(movie.rating).toFixed(1);
    ratingCounts[key] = (ratingCounts[key] || 0) + 1;
  });

  const ratingHistogram = Object.entries(ratingCounts)
    .map(([rating, count]) => ({ rating, count }))
    .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));

  const genreCounts = {};
  yearLogs.forEach((movie) => {
    const genres = movie.genres;
    if (!Array.isArray(genres)) return;
    genres.forEach((g) => {
      const label = String(g || '').trim();
      if (!label) return;
      genreCounts[label] = (genreCounts[label] || 0) + 1;
    });
  });

  const moodCounts = {};
  yearLogs.forEach((movie) => {
    const moods = movie.moods;
    if (!Array.isArray(moods)) return;
    moods.forEach((mood) => {
      const id = String(mood || '').trim();
      if (!id) return;
      moodCounts[id] = (moodCounts[id] || 0) + 1;
    });
  });

  const monthly = Array.from({ length: 12 }, (_, i) => ({
    monthIndex: i,
    label: MONTH_SHORT[i],
    count: 0,
  }));

  yearLogs.forEach((log) => {
    const d = canonicalWatchDate(log);
    if (!d) return;
    const idx = d.getMonth();
    if (idx >= 0 && idx < 12) monthly[idx].count += 1;
  });

  const physicalScanCount = yearLogs.filter((m) => {
    const upc = m?.source_upc;
    return upc != null && String(upc).trim() !== '';
  }).length;

  const reviewsWrittenCount = yearLogs.filter((m) => {
    const rev = m?.review;
    return typeof rev === 'string' && rev.trim().length > 0;
  }).length;

  return {
    year,
    filmCount: yearLogs.length,
    avgRating,
    ratingHistogram,
    topGenres: topNamedCounts(genreCounts, 5),
    topMoods: topNamedCounts(moodCounts, 12),
    monthlyCounts: monthly,
    physicalScanCount,
    reviewsWrittenCount,
    ratedFilmCount: ratedLogs.length,
  };
}
