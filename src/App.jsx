import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import Logo from './components/Logo';
import IgnesLogo from './components/IgnesLogo';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import GlobalSearch from './components/GlobalSearch';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '70px',
      background: '#000000',
      borderBottom: '2px solid #333',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: '20px'
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
        <IgnesLogo size={35} showText={true} />
      </Link>

      {/* Desktop Search */}
      <div style={{ flex: 1, maxWidth: '400px' }}>
        <GlobalSearch />
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={toggleMenu}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '10px'
        }}
        aria-label="Menu"
      >
        <span style={{ display: 'block', width: '25px', height: '3px', background: '#fff', margin: '5px 0' }}></span>
        <span style={{ display: 'block', width: '25px', height: '3px', background: '#fff', margin: '5px 0' }}></span>
        <span style={{ display: 'block', width: '25px', height: '3px', background: '#fff', margin: '5px 0' }}></span>
      </button>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div style={{
          position: 'absolute',
          top: '70px',
          left: 0,
          right: 0,
          background: '#121212',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 99998
        }}>
          <Link to="/" style={{ color: '#fff', textDecoration: 'none', padding: '10px' }}>Trending</Link>
          <Link to="/library" style={{ color: '#fff', textDecoration: 'none', padding: '10px' }}>My Library</Link>
          <Link to="/history" style={{ color: '#fff', textDecoration: 'none', padding: '10px' }}>History</Link>
          {isAuthenticated ? (
            <>
              <Link to="/profile" style={{ color: '#fff', textDecoration: 'none', padding: '10px' }}>{user?.username}</Link>
              <button onClick={handleLogout} style={{ color: '#fff', background: 'transparent', border: 'none', padding: '10px', cursor: 'pointer' }}>Logout</button>
            </>
          ) : (
            <Link to="/login" style={{ color: '#fff', textDecoration: 'none', padding: '10px' }}>Login</Link>
          )}
        </div>
      )}
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
