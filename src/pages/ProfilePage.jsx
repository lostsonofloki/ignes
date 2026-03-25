import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { getSupabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import './ProfilePage.css';

const GENRE_COLORS = [
  '#f97316', // Orange
  '#ea580c', // Orange Dark
  '#c2410c', // Orange Deeper
  '#9a3412', // Orange Darkest
  '#fdba74', // Orange Light
  '#fb923c', // Orange Lighter
  '#eab308', // Yellow
  '#ca8a04', // Yellow Dark
];

const MOOD_COLORS = {
  emotional: '#f87171',
  vibe: '#c084fc',
  intellectual: '#94a3b8',
};

const MOOD_CATEGORIES = {
  bittersweet: 'emotional',
  heartwarming: 'emotional',
  tearjerker: 'emotional',
  uplifting: 'emotional',
  bleak: 'emotional',
  atmospheric: 'vibe',
  dark: 'vibe',
  gritty: 'vibe',
  neon: 'vibe',
  tense: 'vibe',
  whimsical: 'vibe',
  gory: 'vibe',
  eerie: 'vibe',
  claustrophobic: 'vibe',
  campy: 'vibe',
  dread: 'vibe',
  'jump-scary': 'vibe',
  psychological: 'intellectual',
  mindbending: 'intellectual',
  challenging: 'intellectual',
  philosophical: 'intellectual',
  slowburn: 'intellectual',
  complex: 'intellectual',
};

function ProfilePage() {
  const { user, updateUser, logout } = useUser();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.username || '');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [stats, setStats] = useState({
    moviesWatched: 0,
    reviewsWritten: 0,
    daysLogged: 0,
    totalWatched: 0,
    avgRating: 0,
    hoursWatched: 0,
  });
  const [ratingsData, setRatingsData] = useState([]);
  const [genreData, setGenreData] = useState([]);
  const [moodData, setMoodData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      try {
        const supabase = getSupabase();
        const { data } = await supabase
          .from('profiles')
          .select('display_name, bio, avatar_url')
          .eq('id', user.id)
          .maybeSingle();
        if (data?.bio) setBio(data.bio);
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };
    fetchProfile();
  }, [user?.id]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        const supabase = getSupabase();
        const { data: movieLogs } = await supabase
          .from('movie_logs')
          .select('*')
          .eq('user_id', user.id);

        if (movieLogs) {
          const watched = movieLogs.filter(m => m.watch_status === 'watched' || !m.watch_status).length;
          const reviews = movieLogs.filter(m => m.review && m.review.trim()).length;
          const uniqueDays = new Set(movieLogs.map(m =>
            new Date(m.created_at).toISOString().split('T')[0]
          )).size;

          const watchedMovies = movieLogs.filter(m => m.watch_status === 'watched' && m.rating !== null);
          const moviesWithRatings = watchedMovies.filter(m => m.rating);
          const avg = moviesWithRatings.length > 0
            ? moviesWithRatings.reduce((sum, m) => sum + m.rating, 0) / moviesWithRatings.length
            : 0;

          // Estimate hours (avg movie = 1.5 hours)
          const hoursWatched = Math.round(watched * 1.5);

          const ratingCounts = {};
          watchedMovies.forEach(movie => {
            if (movie.rating) {
              const ratingKey = movie.rating.toFixed(1);
              ratingCounts[ratingKey] = (ratingCounts[ratingKey] || 0) + 1;
            }
          });

          const ratingsArray = Object.entries(ratingCounts)
            .map(([rating, count]) => ({ rating, count }))
            .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));

          const genreCounts = {};
          watchedMovies.forEach(movie => {
            if (movie.genres && Array.isArray(movie.genres)) {
              movie.genres.forEach(genre => {
                genreCounts[genre] = (genreCounts[genre] || 0) + 1;
              });
            }
          });

          const genreArray = Object.entries(genreCounts)
            .map(([genre, count], index) => ({
              name: genre,
              value: count,
              color: GENRE_COLORS[index % GENRE_COLORS.length],
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

          // Calculate total for percentage
          const totalGenres = genreArray.reduce((sum, g) => sum + g.value, 0);

          // Add percentage to genre names for legend display
          const genreDataWithPercent = genreArray.map((genre) => ({
            ...genre,
            name: `${genre.name} (${Math.round((genre.value / totalGenres) * 100)}%)`,
          }));

          const moodCounts = {};
          Object.keys(MOOD_CATEGORIES).forEach(mood => {
            moodCounts[mood] = 0;
          });
          watchedMovies.forEach(movie => {
            if (movie.moods && Array.isArray(movie.moods)) {
              movie.moods.forEach(mood => {
                if (moodCounts[mood] !== undefined) {
                  moodCounts[mood]++;
                }
              });
            }
          });

          const moodArray = Object.entries(moodCounts)
            .map(([mood, count]) => {
              const category = MOOD_CATEGORIES[mood] || 'vibe';
              return {
                name: mood.charAt(0).toUpperCase() + mood.slice(1).replace('-', ' '),
                value: count,
                color: MOOD_COLORS[category],
                category,
              };
            })
            .sort((a, b) => b.value - a.value);

          setStats({
            moviesWatched: watched,
            reviewsWritten: reviews,
            daysLogged: uniqueDays,
            totalWatched: watchedMovies.length,
            avgRating: avg.toFixed(1),
            hoursWatched,
          });
          setRatingsData(ratingsArray);
          setGenreData(genreDataWithPercent);
          setMoodData(moodArray);
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [user?.id]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be less than 5MB');
      return;
    }
    setIsUploading(true);
    setUploadError('');
    try {
      const supabase = getSupabase();
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        });
      if (profileError) throw profileError;
      setAvatarUrl(publicUrl);
      setSuccess('Avatar updated successfully!');
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setUploadError(err.message || 'Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError('Display name cannot be empty');
      return;
    }
    setIsSaving(true);
    setError('');
    setSuccess('');
    try {
      const supabase = getSupabase();
      await updateUser({ username: displayName });
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          display_name: displayName,
          bio: bio || null,
          updated_at: new Date().toISOString(),
        });
      if (profileError) throw profileError;
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(user?.username || '');
    setBio('');
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  if (!user) return null;

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Profile Header */}
        <div className="profile-header">
          <label className="profile-avatar-wrapper" htmlFor="avatar-upload">
            <div className={`profile-avatar-large ${avatarUrl ? 'has-avatar' : ''}`}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile avatar" />
              ) : (
                <span>{(user?.username || user?.email || '?').charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="avatar-upload-overlay">
              {isUploading ? (
                <div className="uploading-spinner"></div>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span>Change</span>
                </>
              )}
            </div>
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            disabled={isUploading}
            style={{ display: 'none' }}
          />

          {!isEditing ? (
            <>
              <div className="profile-info">
                <h1>{user?.username || 'User'}</h1>
                <p className="profile-email">{user?.email}</p>
                {bio && <p className="profile-bio">{bio}</p>}
                {uploadError && <p className="upload-error">{uploadError}</p>}
                {success && <p className="upload-success">{success}</p>}
              </div>
              <div className="profile-actions">
                <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </button>
                <button className="logout-btn" onClick={logout}>
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="profile-edit-form">
              <div className="form-group">
                <label htmlFor="displayName">Display Name</label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  disabled={isSaving}
                />
              </div>
              <div className="form-group">
                <label htmlFor="bio">Bio (optional)</label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  disabled={isSaving}
                />
              </div>
              {error && <div className="form-error">{error}</div>}
              {success && <div className="form-success">{success}</div>}
              <div className="form-actions">
                <button className="cancel-btn" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </button>
                <button className="save-btn" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-number">{isLoading ? '...' : stats.moviesWatched}</span>
            <span className="stat-label">Movies Logged</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{isLoading ? '...' : stats.hoursWatched}</span>
            <span className="stat-label">Hours Watched</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{isLoading ? '...' : stats.avgRating}</span>
            <span className="stat-label">Average Rating</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{isLoading ? '...' : stats.daysLogged}</span>
            <span className="stat-label">Days Logged</span>
          </div>
        </div>

        {/* Movie Insights */}
        <div className="movie-insights-section">
          <h2 className="insights-title">Movie Insights</h2>

          {isLoading ? (
            <div className="insights-loading">
              <div className="loading-spinner"></div>
              <p>Loading your movie insights...</p>
            </div>
          ) : stats.totalWatched === 0 ? (
            <div className="insights-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M16 4v16M8 8v12M12 12v8M4 20h16" />
              </svg>
              <h3>No watched movies yet</h3>
              <p>Start logging movies to see your insights!</p>
            </div>
          ) : (
            <div className="insights-grid">
              {/* Total Watched */}
              <div className="insights-card insights-card-large total-watched-card">
                <h2 className="total-watched-label">Total Watched</h2>
                <div className="total-watched-number">{stats.totalWatched}</div>
                <p className="total-watched-subtitle">movies completed</p>
                {stats.avgRating && (
                  <div className="avg-rating">
                    <span className="rating-label">Average Rating:</span>
                    <span className="rating-value">{stats.avgRating}</span>
                  </div>
                )}
              </div>

              {/* Top Genres */}
              <div className="insights-card insights-card-large">
                <h3 className="insights-card-title">Top Genres</h3>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={genreData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {genreData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #2a2a2a',
                          borderRadius: '8px',
                          color: '#ffffff'
                        }}
                      />
                      <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{
                          paddingTop: '20px',
                          color: '#888888',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Ratings Distribution */}
              <div className="insights-card">
                <h3 className="insights-card-title">Ratings Distribution</h3>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={ratingsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                      <XAxis dataKey="rating" stroke="#888888" fontSize={11} />
                      <YAxis stroke="#888888" fontSize={11} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #2a2a2a',
                          borderRadius: '8px',
                          color: '#ffffff'
                        }}
                      />
                      <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Mood Breakdown */}
              <div className="insights-card">
                <h3 className="insights-card-title">Mood Breakdown</h3>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={moodData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                      <XAxis type="number" stroke="#888888" fontSize={11} allowDecimals={false} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#888888"
                        fontSize={11}
                        width={90}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #2a2a2a',
                          borderRadius: '8px',
                          color: '#ffffff'
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {moodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Account Settings */}
        <div className="account-settings-section">
          <h2 className="insights-title">Account Settings</h2>
          <div className="settings-card">
            <div className="setting-item">
              <div className="setting-info">
                <h3 className="setting-title">Email</h3>
                <p className="setting-description">{user?.email}</p>
              </div>
            </div>
            <div className="setting-item">
              <div className="setting-info">
                <h3 className="setting-title">Password</h3>
                <p className="setting-description">Change your password</p>
              </div>
              <button
                className="setting-action-btn"
                onClick={() => navigate('/update-password')}
              >
                Update
              </button>
            </div>
            <div className="setting-item">
              <div className="setting-info">
                <h3 className="setting-title">Sign Out</h3>
                <p className="setting-description">Log out of your account</p>
              </div>
              <button className="setting-action-btn logout" onClick={logout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
