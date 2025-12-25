import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

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
        <Link to="/" style={{ textDecoration: 'none', color: 'white' }}>
          <h1>🏢 Spectral Buildings</h1>
        </Link>
        <div className="navbar-links">
          {user ? (
            <>
              <span>Welcome, {user.username} ({user.role})</span>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>
                Login
              </Link>
              <Link to="/register" style={{ color: 'white', textDecoration: 'none' }}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
