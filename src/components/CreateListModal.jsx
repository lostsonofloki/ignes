import { useState } from 'react';
import { useLists } from '../context/ListContext';
import { useToast } from '../context/ToastContext';
import { createPortal } from 'react-dom';
import './CreateListModal.css';

/**
 * CreateListModal - Modal for creating a new custom list
 * @param {Function} onClose - Callback when modal is closed
 * @param {Function} onSuccess - Callback when list is successfully created
 */
function CreateListModal({ onClose, onSuccess }) {
  const { createList } = useLists();
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('List name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await createList(name, description, isPublic);
      toast.success(`List "${name.trim()}" created!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to create list.');
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      className="create-list-modal-overlay"
      onClick={onClose}
    >
      <div
        className="create-list-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="create-list-modal-header">
          <h2>Create New List</h2>
          <button
            type="button"
            className="create-list-modal-close"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-list-modal-form">
          {error && (
            <div className="create-list-modal-error">
              {error}
            </div>
          )}

          <div className="create-list-modal-field">
            <label htmlFor="list-name">
              List Name <span className="required">*</span>
            </label>
            <input
              id="list-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Favorite Horror Movies"
              maxLength={100}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="create-list-modal-field">
            <label htmlFor="list-description">Description</label>
            <textarea
              id="list-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for your list..."
              maxLength={500}
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="create-list-modal-field">
            <label className="create-list-toggle-label">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={isSubmitting}
              />
              <span className="create-list-toggle-text">
                Make this list public (others can view it)
              </span>
            </label>
          </div>

          <div className="create-list-modal-actions">
            <button
              type="button"
              className="create-list-modal-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="create-list-modal-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default CreateListModal;
