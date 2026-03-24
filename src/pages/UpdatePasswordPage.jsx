import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabase } from '../supabaseClient';
import './UpdatePasswordPage.css';

/**
 * Update Password Page - For resetting password after email reset link
 */
function UpdatePasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is in reset password flow
    const checkSession = async () => {
      try {
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        
        // If no session, user might not have come from reset email
        if (!session) {
          setError('Please request a password reset email first.');
        }
      } catch (err) {
        console.error('Error checking session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      if (!newPassword || !confirmPassword) {
        throw new Error('Please fill in all fields');
      }

      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const supabase = getSupabase();
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setSuccess('Password updated successfully! Redirecting to login...');
      
      // Clear form
      setNewPassword('');
      setConfirmPassword('');

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="update-password-page">
        <div className="update-password-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Checking session...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="update-password-page">
      <div className="update-password-container">
        <div className="update-password-card">
          <div className="update-password-header">
            <h1 className="update-password-title">Reset your password</h1>
            <p className="update-password-subtitle">
              Enter your new password below
            </p>
          </div>

          <form className="update-password-form" onSubmit={handleUpdatePassword}>
            {error && (
              <div className="error-message">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <circle cx="12" cy="16" r="0.5" fill="currentColor" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="success-message">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span>{success}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="new-password" className="form-label">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                className="form-input"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSubmitting || success}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password" className="form-label">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                className="form-input"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting || success}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="update-password-button"
              disabled={isSubmitting || success}
            >
              {isSubmitting ? (
                <span className="button-loading">
                  <span className="loading-dot"></span>
                  <span className="loading-dot"></span>
                  <span className="loading-dot"></span>
                </span>
              ) : success ? (
                'Password Updated!'
              ) : (
                'Update Password'
              )}
            </button>
          </form>

          <p className="update-password-footer">
            Remember your password?{' '}
            <button
              className="update-password-link"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default UpdatePasswordPage;
