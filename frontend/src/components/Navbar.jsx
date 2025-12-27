import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import logo from '../assets/spectral-logo.svg';
import ThemeToggleButton from './ThemeToggleButton';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          <img src={logo} alt="Spectral Real Estate Solutions" className="navbar-brand__logo" />
          <div>
            <h1 className="navbar-brand__title">Brighter Control Team</h1>
            <div className="navbar-brand__subtitle">Team-wide knowledge sharing & duty coordination</div>
          </div>
        </Link>
        <div className="navbar-links">
          <ThemeToggleButton />
          {user ? (
            <>
              <div className={`navbar-user ${isMenuOpen ? 'is-open' : ''}`} ref={menuRef}>
                <button
                  type="button"
                  className="navbar-user__toggle"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  aria-haspopup="menu"
                  aria-expanded={isMenuOpen}
                  aria-label={`${user.username} menu`}
                >
                  <span className="navbar-user__name">{user.username}</span>
                  <span className="navbar-user__chevron" aria-hidden="true">▾</span>
                </button>
                {isMenuOpen && (
                  <div className="navbar-user__menu" role="menu">
                    <button
                      type="button"
                      className="navbar-user__menu-item"
                      onClick={handleLogout}
                      role="menuitem"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/login" className="nav-ghost-link">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
