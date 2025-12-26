import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import logo from '../assets/spectral-logo.svg';

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
        <Link to="/" style={{ textDecoration: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={logo} alt="Spectral Real Estate Solutions" style={{ width: '46px', height: 'auto' }} />
          <div>
            <h1 style={{ margin: 0 }}>Spectral Buildings</h1>
            <div style={{ fontSize: '12px', color: 'var(--muted)', letterSpacing: '0.08em' }}>Real Estate Solutions</div>
          </div>
        </Link>
        <div className="navbar-links">
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
