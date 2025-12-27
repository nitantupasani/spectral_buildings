import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import logo from '../assets/spectral-logo.svg';
import ThemeToggleButton from './ThemeToggleButton';
import { LinkedinIcon, MailIcon } from './Icons';
import { useTheme } from '../ThemeContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme } = useTheme();
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
          <ThemeToggleButton />
          {user && (
            <>
              <Link to="/" className="nav-ghost-link">Knowledge</Link>
              <Link to="/buildings" className="nav-ghost-link">Buildings</Link>
            </>
          )}
          <div className="navbar-contact">
            <a
              className={`nav-icon-link ${theme === 'dark' ? 'is-dark' : 'is-light'}`}
              href="https://www.linkedin.com/company/spectral-energy/"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Spectral on LinkedIn"
            >
              <LinkedinIcon className="nav-icon" />
            </a>
            <a
              className={`nav-icon-link ${theme === 'dark' ? 'is-dark' : 'is-light'}`}
              href="mailto:info@spectral.energy"
              aria-label="Contact Spectral via email"
            >
              <MailIcon className="nav-icon" />
            </a>
          </div>
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
