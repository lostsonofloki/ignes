import { useState } from 'react';
import BugReportModal from './BugReportModal';
import './ReportBugButton.css';

/**
 * ReportBugButton - Button that opens the BugReportModal
 * Can be placed in Sidebar, Footer, or anywhere in the app
 * @param {string} variant - 'button' | 'icon' | 'link'
 * @param {string} className - Additional CSS class
 */
function ReportBugButton({ variant = 'button', className = '' }) {
  const [showModal, setShowModal] = useState(false);

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <>
      {variant === 'button' && (
        <button className={`report-bug-btn ${className}`} onClick={handleOpenModal}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Report Bug
        </button>
      )}

      {variant === 'icon' && (
        <button className={`report-bug-icon-btn ${className}`} onClick={handleOpenModal} title="Report Bug">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </button>
      )}

      {variant === 'link' && (
        <button className={`report-bug-link ${className}`} onClick={handleOpenModal}>
          Report Bug
        </button>
      )}

      {showModal && (
        <BugReportModal onClose={handleCloseModal} />
      )}
    </>
  );
}

export default ReportBugButton;
