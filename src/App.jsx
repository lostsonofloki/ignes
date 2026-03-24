import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import Logo from './components/Logo';
import IgnesLogo from './components/IgnesLogo';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import SearchPage from './pages/SearchPage';
import TrendingMovies from './pages/TrendingMovies';
import MovieDetail from './pages/MovieDetail';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LibraryPage from './pages/LibraryPage';
import ProfilePage from './pages/ProfilePage';
import WatchHistory from './pages/WatchHistory';
import ActorPage from './pages/ActorPage';
import { useState } from 'react';
import './App.css';

function Header() {
  const { user, isAuthenticated, logout } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Left: Ignes Logo */}
        <div className="header-left">
          <Link to="/" className="logo">
            <IgnesLogo size={40} showText={true} />
          </Link>
        </div>

        {/* Right: Hamburger Menu Button (Mobile) */}
        <button className="hamburger-btn" onClick={toggleMenu} aria-label="Toggle menu">
          <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
        </button>

        {/* Right: Navigation (Desktop) */}
        <div className={`header-right ${isMenuOpen ? 'menu-open' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>Trending</Link>
          <Link to="/library" className="nav-link" onClick={() => setIsMenuOpen(false)}>My Library</Link>
          <Link to="/history" className="nav-link" onClick={() => setIsMenuOpen(false)}>History</Link>
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="nav-link nav-username" onClick={() => setIsMenuOpen(false)}>
                {user?.username}
              </Link>
              <button onClick={handleLogout} className="nav-logout">Logout</button>
            </>
          ) : (
            <Link to="/login" className="nav-link" onClick={() => setIsMenuOpen(false)}>Login</Link>
          )}
        </div>
      </div>

      {/* Mobile Slide-out Menu */}
      <div className={`mobile-menu ${isMenuOpen ? 'menu-open' : ''}`}>
        <div className="mobile-menu-content">
          <Link to="/" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Trending</Link>
          <Link to="/library" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>My Library</Link>
          <Link to="/history" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>History</Link>
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
                {user?.username}
              </Link>
              <button onClick={handleLogout} className="mobile-logout-btn">Logout</button>
            </>
          ) : (
            <Link to="/login" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}

function AppContent() {
  return (
    <div className="app">
      <Header />

      <main className="app-main">
        <Routes>
          <Route path="/" element={<TrendingMovies />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/actor/:id" element={<ActorPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/history" element={<WatchHistory />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </Router>
  );
}

export default App;
