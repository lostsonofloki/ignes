/**
 * Helpers for Library advanced search (mood, genre, rating filters).
 */

export function normalizeNlMoodToken(token) {
  if (!token) return '';
  const t = String(token).toLowerCase();
  const map = {
    'mind-bending': 'mindbending',
  };
  return map[t] || t;
}

export function movieMatchesMoodFilter(movie, moodIds, mode) {
  if (!moodIds?.length) return true;
  const mm = movie.moods || [];
  if (mode === 'all') return moodIds.every((id) => mm.includes(id));
  return moodIds.some((id) => mm.includes(id));
}

export function movieMatchesGenreFilter(movie, selectedGenres) {
  if (!selectedGenres?.length) return true;
  const mg = (movie.genres || []).map((g) => String(g).toLowerCase().trim());
  return selectedGenres.every((want) => {
    const w = want.toLowerCase();
    return mg.some((x) => x === w || x.includes(w));
  });
}

export function movieMatchesRatingFilter(movie, minR, maxR) {
  let minNum = minR !== '' && minR != null && Number.isFinite(Number(minR)) ? Number(minR) : null;
  let maxNum = maxR !== '' && maxR != null && Number.isFinite(Number(maxR)) ? Number(maxR) : null;
  if (minNum != null && maxNum != null && minNum > maxNum) {
    const t = minNum;
    minNum = maxNum;
    maxNum = t;
  }

  const hasMin = minNum != null;
  const hasMax = maxNum != null;
  if (!hasMin && !hasMax) return true;

  const raw = movie.rating;
  if (raw == null || !Number.isFinite(Number(raw))) return false;

  const r = Number(raw);
  if (hasMin && r < minNum) return false;
  if (hasMax && r > maxNum) return false;
  return true;
}
