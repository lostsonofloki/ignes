import MoodChip, { MOODS } from './MoodChip';
import './LibraryAdvancedFilters.css';

function LibraryAdvancedFilters({
  selectedMoods,
  onMoodsChange,
  moodMatchMode,
  onMoodMatchModeChange,
  genreOptions,
  selectedGenres,
  onToggleGenre,
  minRating,
  maxRating,
  onMinRatingChange,
  onMaxRatingChange,
  onClearAdvanced,
}) {
  const hasAdvancedActive =
    selectedMoods.length > 0 ||
    selectedGenres.length > 0 ||
    minRating !== '' ||
    maxRating !== '';

  const handleMoodToggle = (moodId) => {
    if (!onMoodsChange) return;
    if (selectedMoods.includes(moodId)) {
      onMoodsChange(selectedMoods.filter((id) => id !== moodId));
    } else {
      onMoodsChange([...selectedMoods, moodId]);
    }
  };

  return (
    <details className="library-advanced-details">
      <summary className="library-advanced-summary">
        <span className="library-advanced-summary-title">Advanced search</span>
        <span className="library-advanced-summary-meta">
          Mood · genre · your rating
          {hasAdvancedActive ? (
            <span className="library-advanced-active-dot" aria-hidden />
          ) : null}
        </span>
      </summary>

      <div className="library-advanced-body">
        <div className="library-advanced-block">
          <div className="library-advanced-block-header">
            <span className="library-filter-label">Mood</span>
            {selectedMoods.length > 1 && (
              <div className="library-advanced-segment" role="group" aria-label="Mood match mode">
                <button
                  type="button"
                  className={`library-advanced-segment-btn ${moodMatchMode === 'any' ? 'library-advanced-segment-btn--active' : ''}`}
                  onClick={() => onMoodMatchModeChange('any')}
                >
                  Any
                </button>
                <button
                  type="button"
                  className={`library-advanced-segment-btn ${moodMatchMode === 'all' ? 'library-advanced-segment-btn--active' : ''}`}
                  onClick={() => onMoodMatchModeChange('all')}
                >
                  All
                </button>
              </div>
            )}
          </div>
          <div className="library-advanced-mood-grid">
            {MOODS.map((m) => (
              <MoodChip
                key={m.id}
                moodId={m.id}
                isSelected={selectedMoods.includes(m.id)}
                onToggle={handleMoodToggle}
                size="small"
              />
            ))}
          </div>
          <p className="library-advanced-hint">
            Uses your log moods. Choose one or stack several; “All” requires every selected mood on the same log.
          </p>
        </div>

        <div className="library-advanced-block">
          <span className="library-filter-label">Genre</span>
          {genreOptions.length === 0 ? (
            <p className="library-advanced-empty">
              No genres on your logs yet — genres are saved when you log from TMDB. Older imports may be missing them.
            </p>
          ) : (
            <div className="library-advanced-genre-scroll" role="group" aria-label="Filter by genre">
              {genreOptions.map((g) => (
                <label key={g} className="library-advanced-genre-item">
                  <input
                    type="checkbox"
                    checked={selectedGenres.includes(g)}
                    onChange={() => onToggleGenre(g)}
                  />
                  <span>{g}</span>
                </label>
              ))}
            </div>
          )}
          <p className="library-advanced-hint">
            Logs must include every genre you select (best for narrowing).
          </p>
        </div>

        <div className="library-advanced-block library-advanced-rating-row">
          <div className="library-advanced-rating-field">
            <label htmlFor="library-min-rating" className="library-filter-label">
              Min rating
            </label>
            <input
              id="library-min-rating"
              type="number"
              className="library-input"
              min={0}
              max={5}
              step={0.5}
              placeholder="Any"
              value={minRating}
              onChange={(e) => onMinRatingChange(e.target.value)}
            />
          </div>
          <div className="library-advanced-rating-field">
            <label htmlFor="library-max-rating" className="library-filter-label">
              Max rating
            </label>
            <input
              id="library-max-rating"
              type="number"
              className="library-input"
              min={0}
              max={5}
              step={0.5}
              placeholder="Any"
              value={maxRating}
              onChange={(e) => onMaxRatingChange(e.target.value)}
            />
          </div>
        </div>

        {hasAdvancedActive && (
          <div className="library-advanced-actions">
            <button type="button" className="library-advanced-clear-btn" onClick={onClearAdvanced}>
              Clear advanced filters
            </button>
          </div>
        )}
      </div>
    </details>
  );
}

export default LibraryAdvancedFilters;
