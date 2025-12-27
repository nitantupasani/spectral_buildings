import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import logo from '../assets/spectral-logo.svg';
import ThemeToggleButton from './ThemeToggleButton';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          <img src={logo} alt="Spectral Real Estate Solutions" className="navbar-brand__logo" />
          <div>
            <h1 className="navbar-brand__title">Brighter Control Knowledge Hub</h1>
            <div className="navbar-brand__subtitle">Team-wide knowledge sharing & duty coordination</div>
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
          {user ? (
            <>
              <div className="navbar-user">
                <span className="navbar-user__name">{user.username}</span>
                <span className="navbar-user__role">{user.role}</span>
              </div>
              <button className="btn btn-secondary navbar-logout" onClick={handleLogout}>
                Logout from {user.username}
              </button>
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
