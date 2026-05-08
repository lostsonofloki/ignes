import { useState, useRef, useEffect } from 'react';
import { useLists } from '../context/ListContext';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { checkDuplicateInCollection } from '../utils/collectionIntegrity';
import CreateListModal from './CreateListModal';
import './AddToListButton.css';

/**
 * AddToListButton - Dropdown button to add a movie to custom lists
 * @param {Object} movie - Movie object with tmdb_id, title, poster_path
 * @param {string} className - Additional CSS class name
 * @param {'default' | 'icon'} variant - Button variant ('default' shows text, 'icon' shows icon only)
 */
function AddToListButton({ movie, className = '', variant = 'default' }) {
  const { isAuthenticated, user } = useUser();
  const {
    lists,
    isLoading,
    addMovieToList,
    isMovieInList,
    getListsContainingMovie,
    canEditList,
  } = useLists();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPlacement, setDropdownPlacement] = useState('end');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isAdding, setIsAdding] = useState(null); // tmdb_id of movie being added
  const dropdownRef = useRef(null);

  const existingLists = getListsContainingMovie(movie?.tmdb_id);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen || !dropdownRef.current) return;

    const updatePlacement = () => {
      if (!dropdownRef.current) return;

      const rect = dropdownRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
      const horizontalPadding = 12;
      const preferredWidth = 300;
      const maxAllowed = Math.max(220, viewportWidth - horizontalPadding * 2);
      const dropdownWidth = Math.min(preferredWidth, maxAllowed);

      const spaceIfStart = viewportWidth - rect.left - horizontalPadding;
      const spaceIfEnd = rect.right - horizontalPadding;

      if (spaceIfStart >= dropdownWidth) {
        setDropdownPlacement('start');
      } else if (spaceIfEnd >= dropdownWidth) {
        setDropdownPlacement('end');
      } else {
        setDropdownPlacement(spaceIfStart >= spaceIfEnd ? 'start' : 'end');
      }
    };

    updatePlacement();
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);

    return () => {
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, [isOpen]);

  const handleToggleDropdown = () => {
    if (!isAuthenticated) return;
    setIsOpen(!isOpen);
  };

  const handleAddToList = async (listId) => {
    if (!movie?.tmdb_id) return;

    const list = lists.find(l => l.id === listId);
    if (!list) return;

    try {
      setIsAdding(listId);
      const duplicateCheck = await checkDuplicateInCollection({
        userId: user?.id,
        tmdbId: movie.tmdb_id,
      });

      if (duplicateCheck.isDuplicate) {
        toast.error(`Anti-Double-Buy: ${duplicateCheck.reasons.join(' + ')}`);
        setIsOpen(false);
        return;
      }

      await addMovieToList(listId, movie);
      toast.success(`Added to ${list.name}!`);
      setIsOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to add to list.');
    } finally {
      setIsAdding(null);
    }
  };

  const handleCreateNewList = () => {
    setShowCreateModal(true);
    setIsOpen(false);
  };

  const handleListCreated = () => {
    toast.success('List created!');
    setShowCreateModal(false);
    setIsOpen(true); // Reopen dropdown to select the new list
  };

  // Don't show button if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <div className={`add-to-list-container ${className}`} ref={dropdownRef}>
        {variant === 'icon' ? (
          <button
            className="add-to-list-button-icon"
            onClick={handleToggleDropdown}
            disabled={isLoading}
            aria-expanded={isOpen}
            aria-haspopup="true"
            aria-label={
              existingLists.length > 0
                ? `Add to another list — already in ${existingLists.length}`
                : 'Add to a list'
            }
            title={existingLists.length > 0 ? `In ${existingLists.length} list(s)` : 'Add to list'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
              <path strokeLinecap="round" d="M9 6h11M9 12h11M9 18h8" />
            </svg>
            {existingLists.length > 0 && (
              <span className="add-to-list-badge">{existingLists.length}</span>
            )}
          </button>
        ) : (
          <button
            className="add-to-list-button"
            onClick={handleToggleDropdown}
            disabled={isLoading}
            aria-expanded={isOpen}
            aria-haspopup="true"
            title={existingLists.length > 0 ? `In ${existingLists.length} list(s)` : 'Add to list'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
              <path strokeLinecap="round" d="M9 6h11M9 12h11M9 18h8" />
            </svg>
            <span>Add to List</span>
            {existingLists.length > 0 && (
              <span className="add-to-list-badge">{existingLists.length}</span>
            )}
          </button>
        )}

        {isOpen && (
          <div className={`add-to-list-dropdown add-to-list-dropdown--${dropdownPlacement}`}>
            {isLoading ? (
              <div className="add-to-list-loading">
                <div className="loading-spinner"></div>
                <span>Loading lists...</span>
              </div>
            ) : lists.length === 0 ? (
              <div className="add-to-list-empty">
                <p>You don't have any lists yet.</p>
                <button
                  className="add-to-list-create-empty"
                  onClick={handleCreateNewList}
                >
                  Create Your First List
                </button>
              </div>
            ) : (
              <>
                <div className="add-to-list-header">
                  <span>Add to list...</span>
                </div>
                <div className="add-to-list-items">
                  {lists.map((list) => {
                    const isInList = isMovieInList(list.id, movie?.tmdb_id);
                    const isReadOnly = !canEditList(list.id);
                    return (
                      <button
                        key={list.id}
                        className={`add-to-list-item ${isInList ? 'in-list' : ''} ${isReadOnly ? 'read-only' : ''}`}
                        onClick={() => !isInList && handleAddToList(list.id)}
                        disabled={isInList || isAdding === list.id || isReadOnly}
                        title={isReadOnly ? 'View-only list' : undefined}
                      >
                        <span className="list-name">{list.name}</span>
                        <span className="list-count">
                          {list.list_items?.length || 0} movies
                        </span>
                        {isReadOnly && (
                          <span className="list-role-badge">Viewer</span>
                        )}
                        {isInList ? (
                          <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        ) : isAdding === list.id ? (
                          <div className="adding-spinner"></div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                <div className="add-to-list-footer">
                  <button
                    className="add-to-list-create"
                    onClick={handleCreateNewList}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Create New List
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateListModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleListCreated}
        />
      )}
    </>
  );
}

export default AddToListButton;
