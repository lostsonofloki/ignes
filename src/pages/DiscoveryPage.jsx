import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { getSupabase } from '../supabaseClient';
import { discoverMovies } from '../utils/gemini';
import { fetchTMDBMovie } from '../api/tmdb';
import LogMovieModal from '../components/LogMovieModal';
import './DiscoveryPage.css';

const MOOD_PRESETS = [
  { id: 'cozy', label: 'Cozy', icon: '🕯️', prompt: 'A comforting, warm film for a quiet night in' },
  { id: 'adrenaline', label: 'Adrenaline', icon: '🔥', prompt: 'High-octane action that keeps me on the edge of my seat' },
  { id: 'mind-bending', label: 'Mind-Bending', icon: '🧠', prompt: 'Something that twists reality and makes me think' },
  { id: 'deep-cuts', label: 'Deep Cuts', icon: '💎', prompt: 'Obscure gems that most people have never seen' },
  { id: 'noir', label: 'Noir', icon: '🌑', prompt: 'Dark, atmospheric crime with moral ambiguity' },
  { id: 'euphoric', label: 'Euphoric', icon: '✨', prompt: 'Uplifting cinema that leaves me feeling alive' },
];

const BASE_SYSTEM_PROMPT = `You are the Ember Oracle, an elite film historian and curator for Ignes, a premium movie discovery platform.

YOUR ROLE:
- Recommend films that are PERFECT tonal matches for the user's mood
- Prioritize DEEP CUTS and underappreciated gems over mainstream blockbusters
- NEVER suggest obvious IMDB Top 250 picks unless they're genuinely the best match
- Focus on directorial vision, cinematography, and emotional resonance

YOUR RESPONSE FORMAT:
Return ONLY valid JSON with this structure:
{
  "title": "Exact movie title",
  "year": 1994,
  "rationale": "2-3 sentences explaining WHY this film matches their mood, referencing specific directorial choices, themes, or cinematic techniques",
  "vibeCheck": "A short, punchy 5-7 word tagline capturing the essence"
}

USER CONTEXT:
The user has provided their favorite films and current mood. Use this to understand their taste profile. If they love atmospheric horror, don't suggest slapstick comedy. If they appreciate slow-burn indie dramas, don't recommend Michael Bay.

CONSTRAINT - REJECTED MOVIES:
If the user provides a list of rejected movies, DO NOT suggest any of them again. These films have been explicitly rejected and the user wants different recommendations.

AVOID:
- Generic plot summaries
- Obvious blockbuster recommendations
- Films that don't match the stated mood
- More than 1-2 sentences in the rationale

BE SPECIFIC:
Instead of "This film is dark and moody," say "Rehane's use of natural lighting and long takes creates an oppressive atmosphere that mirrors the protagonist's psychological decay."`;

function DiscoveryPage() {
  const { user } = useUser();
  const toast = useToast();
  const [selectedMood, setSelectedMood] = useState(null);
  const [tempPrompt, setTempPrompt] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [tmdbData, setTmdbData] = useState(null);
  const [error, setError] = useState('');
  const [userFavorites, setUserFavorites] = useState([]);
  const [rejectedIds, setRejectedIds] = useState([]);
  const [rejectedTitles, setRejectedTitles] = useState([]);
  
  // Library integration states
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isListDropdownOpen, setIsListDropdownOpen] = useState(false);
  const [userLists, setUserLists] = useState([]);
  const [isAddingToList, setIsAddingToList] = useState(false);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user?.id) return;
      try {
        const supabase = getSupabase();
        const { data } = await supabase
          .from('movie_logs')
          .select('title, tmdb_id, moods, rating')
          .eq('user_id', user.id)
          .eq('watch_status', 'watched')
          .gte('rating', 4.5)
          .order('rating', { ascending: false })
          .limit(10);
        setUserFavorites(data || []);
      } catch (err) {
        console.error('Error fetching favorites:', err);
      }
    };
    fetchFavorites();
  }, [user?.id]);

  // Fetch user's custom lists
  useEffect(() => {
    const fetchLists = async () => {
      if (!user?.id) return;
      try {
        const supabase = getSupabase();
        const { data } = await supabase
          .from('lists')
          .select('id, name, description')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setUserLists(data || []);
      } catch (err) {
        console.error('Error fetching lists:', err);
      }
    };
    fetchLists();
  }, [user?.id]);

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
    setTempPrompt(mood.prompt);
  };

  const handleChange = (e) => {
    setTempPrompt(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (tempPrompt.trim()) {
      handleDiscover();
    }
  };

  const handleDiscover = async (additionalRejectedIds = [], additionalRejectedTitles = []) => {
    if (!tempPrompt.trim()) return;

    setIsDiscovering(true);
    setError('');
    setRecommendation(null);
    setTmdbData(null);

    try {
      const userContext = userFavorites.length > 0
        ? `User's favorite films: ${userFavorites.map(f => f.title).join(', ')}`
        : 'No favorite films provided';

      const allRejectedTitles = [...rejectedTitles, ...additionalRejectedTitles];
      const rejectedContext = allRejectedTitles.length > 0
        ? `\n\nREJECTED MOVIES (DO NOT SUGGEST): ${allRejectedTitles.join(', ')}`
        : '';

      const systemPrompt = `${BASE_SYSTEM_PROMPT}${rejectedContext}`;

      const aiResponse = await discoverMovies({
        mood: tempPrompt,
        userContext,
        systemPrompt,
      });

      console.log('AI Recommendation:', aiResponse);

      if (!aiResponse || !aiResponse.title) {
        throw new Error('The Oracle is silent. Please try again.');
      }

      setRecommendation(aiResponse);

      const tmdbMovie = await fetchTMDBMovie(aiResponse.title, aiResponse.year?.toString() || '');
      if (tmdbMovie) {
        setTmdbData(tmdbMovie);
      }
    } catch (err) {
      console.error('Discovery error:', err);
      setError(err.message || 'The Oracle could not find a match. Try a different mood.');
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleRejectAndReroll = async () => {
    if (!tmdbData?.id && !recommendation?.title) return;

    const newRejectedIds = tmdbData?.id ? [...rejectedIds, tmdbData.id] : rejectedIds;
    const newRejectedTitles = recommendation?.title ? [...rejectedTitles, recommendation.title] : rejectedTitles;

    setRejectedIds(newRejectedIds);
    setRejectedTitles(newRejectedTitles);

    await handleDiscover(newRejectedIds, newRejectedTitles);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Mark as Watched - Open LogMovieModal
  const handleMarkAsWatched = () => {
    if (tmdbData) {
      setIsLogModalOpen(true);
    }
  };

  // Add to Watchlist - Direct Supabase insert
  const handleAddToWatchlist = async () => {
    if (!tmdbData || !user?.id) return;

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('movie_logs')
        .insert({
          user_id: user.id,
          tmdb_id: tmdbData.id,
          title: tmdbData.title,
          year: tmdbData.release_date?.split('-')[0],
          poster: tmdbData.poster_path,
          watch_status: 'to-watch',
          rating: 0,
          moods: [],
          review: ''
        });

      if (error) throw error;

      toast.success(`"${tmdbData.title}" added to Watchlist`);
    } catch (err) {
      console.error('Error adding to watchlist:', err);
      toast.error('Failed to add to watchlist');
    }
  };

  // Add to List - Insert into list_items
  const handleAddToList = async (listId, listName) => {
    if (!tmdbData || !user?.id || !listId) return;

    setIsAddingToList(true);
    setIsListDropdownOpen(false);

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('list_items')
        .insert({
          list_id: listId,
          tmdb_id: tmdbData.id,
          title: tmdbData.title,
          poster_path: tmdbData.poster_path
        });

      if (error) throw error;

      toast.success(`"${tmdbData.title}" added to ${listName}`);
    } catch (err) {
      console.error('Error adding to list:', err);
      toast.error(err.message?.includes('duplicate') ? 'Already in this list' : 'Failed to add to list');
    } finally {
      setIsAddingToList(false);
    }
  };

  const getMovieDataForModal = () => {
    if (!tmdbData) return null;
    return {
      id: tmdbData.id,
      title: tmdbData.title,
      poster_path: tmdbData.poster_path,
      release_date: tmdbData.release_date,
      overview: tmdbData.overview
    };
  };

  return (
    <div className="discovery-page">
      <div className="discovery-container">
        <div className="discovery-header">
          <div className="oracle-icon">🔮</div>
          <h1>Ember Oracle</h1>
          <p className="oracle-tagline">AI-powered film discovery for the discerning viewer</p>
        </div>

        <div className="mood-bubbles">
          {MOOD_PRESETS.map((mood) => (
            <button
              key={mood.id}
              className={`mood-bubble ${selectedMood?.id === mood.id ? 'active' : ''}`}
              onClick={() => handleMoodSelect(mood)}
            >
              <span className="mood-icon">{mood.icon}</span>
              <span className="mood-label">{mood.label}</span>
            </button>
          ))}
        </div>

        <div className="prompt-section">
          <label className="prompt-label">Or describe your vibe:</label>
          <form onSubmit={handleSubmit} className="prompt-input-wrapper">
            <textarea
              value={tempPrompt}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="e.g., 'A sci-fi film that explores loneliness with stunning visuals'"
              className="prompt-input"
              rows={3}
              disabled={isDiscovering}
            />
            <button
              type="submit"
              className="discover-btn"
              disabled={isDiscovering || !tempPrompt.trim()}
            >
              {isDiscovering ? (
                <>
                  <span className="loading-spinner"></span>
                  Consulting...
                </>
              ) : (
                <>
                  <span>✨</span>
                  Discover
                </>
              )}
            </button>
          </form>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {recommendation && (
          <div className="recommendation-card animate-in fade-in">
            <div className="rec-poster-container">
              {tmdbData?.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`}
                  alt={recommendation.title}
                  className="rec-poster"
                />
              ) : (
                <div className="rec-poster-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
              )}
            </div>

            <div className="rec-content">
              <div className="rec-header">
                <h2 className="rec-title">{recommendation.title}</h2>
                <span className="rec-year">{tmdbData?.release_date?.split('-')[0] || recommendation.year}</span>
              </div>

              <div className="rec-vibe-check">
                <span className="vibe-label">Vibe Check:</span>
                <span className="vibe-text">{recommendation.vibeCheck}</span>
              </div>

              <div className="rec-rationale">
                <h3 className="rationale-title">Why Ignes Picked This</h3>
                <p className="rationale-text">{recommendation.rationale}</p>
              </div>

              {/* Library Integration Buttons - Deep Ember Theme */}
              {tmdbData && (
                <div className="rec-library-actions">
                  <button
                    onClick={handleMarkAsWatched}
                    className="lib-action-btn"
                    title="Mark as Watched"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Mark as Watched
                  </button>

                  <button
                    onClick={handleAddToWatchlist}
                    className="lib-action-btn"
                    title="Add to Watchlist"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Add to Watchlist
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setIsListDropdownOpen(!isListDropdownOpen)}
                      className="lib-action-btn"
                      disabled={isAddingToList || userLists.length === 0}
                      title="Add to List"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                      </svg>
                      Add to List
                      {isAddingToList && <span className="loading-spinner spinner-sm"></span>}
                    </button>

                    {isListDropdownOpen && userLists.length > 0 && (
                      <div className="list-dropdown">
                        {userLists.map((list) => (
                          <button
                            key={list.id}
                            onClick={() => handleAddToList(list.id, list.name)}
                            className="list-dropdown-item"
                          >
                            {list.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="rec-actions">
                {tmdbData?.id && (
                  <a
                    href={`https://www.themoviedb.org/movie/${tmdbData.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tmdb-link"
                  >
                    View on TMDB
                  </a>
                )}

                <button
                  className="reject-reroll-btn"
                  onClick={handleRejectAndReroll}
                  disabled={isDiscovering}
                  title="Reject this suggestion and get a new recommendation"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 4v6h-6M20.49 15a9 9 0 0 1-2.82-3.36M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                    <path d="M1 4v6h6M3.51 9a9 9 0 0 1 2.82-3.36"/>
                  </svg>
                  Reject & Reroll
                </button>
              </div>

              {rejectedTitles.length > 0 && (
                <div className="rejected-count">
                  <span className="rejected-badge">{rejectedTitles.length}</span>
                  <span className="rejected-text">movies rejected this session</span>
                </div>
              )}
            </div>
          </div>
        )}

        {!recommendation && !isDiscovering && !error && (
          <div className="empty-state">
            <div className="empty-icon">🎬</div>
            <p>Select a mood or describe your vibe to begin</p>
          </div>
        )}
      </div>

      {/* Log Movie Modal */}
      {isLogModalOpen && tmdbData && (
        <LogMovieModal
          movie={getMovieDataForModal()}
          onClose={() => setIsLogModalOpen(false)}
          onSaved={() => {
            setIsLogModalOpen(false);
            toast.success(`"${tmdbData.title}" logged successfully!`);
          }}
        />
      )}
    </div>
  );
}

export default DiscoveryPage;
