import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();

  return (
    <div className="card" style={{ maxWidth: '480px', margin: '50px auto' }}>
      <h2 style={{ marginBottom: '12px' }}>Registration temporarily disabled</h2>
      <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
        New account creation is currently managed by your Spectral administrator. Please reach out to
        your admin team to be onboarded to the platform.
      </p>
      <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
        <button className="btn btn-primary" onClick={() => navigate('/login')}>
          Return to Login
        </button>
        <Link to="/login" style={{ alignSelf: 'center', color: 'var(--primary)' }}>
          Back to sign-in
        </Link>
      </div>
    </div>
  );
};

export default Register;
