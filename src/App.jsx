import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
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
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import { useState } from 'react';
import './App.css';

function Header() {
  const { user, isAuthenticated, logout } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Logo */}
        <Link to="/" className="logo-link">
          <IgnesLogo size={35} showText={true} />
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <Link to="/" className="nav-link">Trending</Link>
          <Link to="/library" className="nav-link">My Library</Link>
          <Link to="/history" className="nav-link">History</Link>
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="nav-link nav-username">{user?.username}</Link>
              <button onClick={handleLogout} className="nav-logout">Logout</button>
            </>
          ) : (
            <Link to="/login" className="nav-link">Login</Link>
          )}
        </nav>

        {/* Desktop Search Form */}
        <form onSubmit={handleSearch} className="header-search">
          <input
            type="text"
            placeholder="Search the Archives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </form>

        {/* Hamburger Menu Button (Mobile) */}
        <button
          className="hamburger-btn"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
        <div className="mobile-menu-content">
          
          {/* MOBILE SEARCH BAR - Inline styles to prevent CSS conflicts */}
          <form onSubmit={handleSearch} className="mobile-search-form" style={{ display: 'flex', width: '100%', marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="Search Ignes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '12px', background: '#1a1a1a', border: '1px solid #991b1b', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
            />
          </form>

          <Link to="/" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Trending</Link>
          <Link to="/library" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>My Library</Link>
          <Link to="/history" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>History</Link>
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>{user?.username}</Link>
              <button onClick={handleLogout} className="mobile-logout-btn">Logout</button>
            </>
          ) : (
            <Link to="/login" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}

function AppContent() {
  const location = useLocation();
  
  // Hide header on auth pages
  const isAuthPage = ['/login', '/register', '/update-password'].includes(location.pathname);

  return (
    <div className="app">
      {!isAuthPage && <Header />}

      <main className="app-main">
        <Routes>
          <Route path="/" element={<TrendingMovies />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/actor/:id" element={<ActorPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/update-password" element={<UpdatePasswordPage />} />
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
