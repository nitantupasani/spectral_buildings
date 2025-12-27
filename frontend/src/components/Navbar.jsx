import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import logo from '../assets/spectral-logo.svg';

const Navbar = ({ theme, onToggleTheme }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" style={{ textDecoration: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={logo} alt="Spectral Real Estate Solutions" style={{ width: '46px', height: 'auto' }} />
          <div>
            <h1 style={{ margin: 0 }}>Brighter Control Knowledge Hub</h1>
            <div style={{ fontSize: '12px', color: 'var(--muted)', letterSpacing: '0.08em' }}>Team-wide knowledge sharing & duty coordination</div>
          </div>
        </Link>
        <div className="navbar-links">
          <button
            type="button"
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <div className={`theme-toggle__thumb ${theme === 'dark' ? 'is-dark' : ''}`}>
              {theme === 'light' ? '☀️' : '🌙'}
            </div>
            <span className="theme-toggle__label">{theme === 'light' ? 'Light' : 'Dark'} mode</span>
          </button>
          {user && (
            <>
              <Link to="/" className="nav-ghost-link">Knowledge</Link>
              <Link to="/buildings" className="nav-ghost-link">Buildings</Link>
            </>
          )}
          {user ? (
            <>
              <span>Welcome, {user.username} ({user.role})</span>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
