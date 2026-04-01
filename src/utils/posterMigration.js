import { getSupabase } from '../supabaseClient';
import { fetchTMDBMovie } from '../api/tmdb';

/**
 * Migration: Fix poster_path for movies imported before v1.8.2
 * Updates poster_path column - Supabase generated column syncs to poster automatically
 */

/**
 * Fix a single movie's poster URL
 * @param {string} movieId - movie_logs.id
 * @param {string} tmdbId - TMDB movie ID
 * @param {string} currentPosterPath - Current poster_path value (relative path or null)
 * @param {Object} supabase - Supabase client
 */
export const fixMoviePoster = async (movieId, tmdbId, currentPosterPath, supabase) => {
  // Skip if already a full URL (shouldn't happen with poster_path)
  if (currentPosterPath?.startsWith('https://')) {
    return { success: false, reason: 'Already has full URL' };
  }

  // Skip if null/empty
  if (!currentPosterPath || currentPosterPath === 'N/A') {
    // Try to fetch from TMDB
    if (!tmdbId) {
      return { success: false, reason: 'No TMDB ID' };
    }

    const tmdbData = await fetchTMDBMovieByTmdbId(tmdbId);
    if (!tmdbData?.poster_path) {
      return { success: false, reason: 'No poster on TMDB' };
    }

    const { error } = await supabase
      .from('movie_logs')
      .update({ poster_path: tmdbData.poster_path })
      .eq('id', movieId);

    if (error) {
      console.error(`❌ PATCH failed for ${movieId}:`, error.message);
      return { success: false, reason: error.message };
    }

    return { success: true, action: 'Fetched from TMDB' };
  }

  // Already has relative path - update with full poster_path
  const { error } = await supabase
    .from('movie_logs')
    .update({ poster_path: currentPosterPath })
    .eq('id', movieId);

  if (error) {
    console.error(`❌ PATCH failed for ${movieId}:`, error.message);
    return { success: false, reason: error.message };
  }

  return { success: true, action: 'Updated poster_path' };
};

/**
 * Fetch TMDB movie by TMDB ID (not search)
 * @param {number} tmdbId - TMDB movie ID
 */
export const fetchTMDBMovieByTmdbId = async (tmdbId) => {
  const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
  
  if (!TMDB_API_KEY) {
    console.error('TMDB API key missing');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`
    );

    if (response.ok) {
      return await response.json();
    }

    return null;
  } catch (error) {
    console.error(`Error fetching TMDB movie ${tmdbId}:`, error.message);
    return null;
  }
};

/**
 * Run the full migration for all movies
 * @param {string} userId - User ID to migrate
 * @returns {Promise<{fixed: number, skipped: number, errors: number}>}
 */
export const runPosterMigration = async (userId) => {
  const supabase = getSupabase();

  console.log('🔧 Starting poster migration...');

  // Fetch all movies for user
  const { data: movies, error } = await supabase
    .from('movie_logs')
    .select('id, tmdb_id, poster_path')
    .eq('user_id', userId);

  if (error) {
    console.error('❌ Failed to fetch movies:', error);
    return { fixed: 0, skipped: 0, errors: 1 };
  }

  console.log(`📦 Found ${movies.length} movies to check`);

  let fixed = 0;
  let skipped = 0;
  let errors = 0;

  for (const movie of movies) {
    try {
      const result = await fixMoviePoster(movie.id, movie.tmdb_id, movie.poster_path, supabase);

      if (result.success) {
        console.log(`✅ Fixed: ${movie.id} - ${result.action}`);
        fixed++;
      } else {
        console.log(`⏭️ Skipped: ${movie.id} - ${result.reason}`);
        skipped++;
      }
    } catch (err) {
      console.error(`❌ Error fixing ${movie.id}:`, err);
      errors++;
    }

    // Rate limiting - wait between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`🎉 Migration complete: ${fixed} fixed, ${skipped} skipped, ${errors} errors`);

  return { fixed, skipped, errors };
};
