import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { authAPI } from '../api';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await authAPI.login(formData);
      login(response.data.user, response.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const handleGoogleCredential = async (response) => {
    if (!response?.credential) {
      setError('Google sign-in failed. Please try again.');
      return;
    }

    setLoadingGoogle(true);
    setError('');
    try {
      const result = await authAPI.googleLogin({ token: response.credential });
      login(result.data.user, result.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Google login failed');
    } finally {
      setLoadingGoogle(false);
    }
  };

  useEffect(() => {
    if (!googleClientId) return;

    let script = document.querySelector('script[data-google-identity]');

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id) {
        setError('Unable to load Google sign-in. Please try again later.');
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
        hosted_domain: 'spectral.energy'
      });

      if (googleButtonRef.current) {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          logo_alignment: 'left'
        });
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = 'true';
      script.onload = initializeGoogle;
      script.onerror = () => setError('Unable to load Google sign-in. Please try again later.');
      document.body.appendChild(script);
    } else if (window.google?.accounts?.id) {
      initializeGoogle();
    } else {
      script.onload = initializeGoogle;
    }

    return () => window.google?.accounts?.id?.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleClientId]);

  return (
    <div className="login-outer">
      <div className="login-card card">
        <h2 className="login-title">Login</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="form-control"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="input-with-action">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="ghost-action"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{ background: 'none', border: 'none', padding: 0, marginLeft: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? (
                  // Eye-off SVG
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-5.05 0-9.29-3.14-11-8 1.21-3.06 3.44-5.5 6.32-6.74"/><path d="M1 1l22 22"/><path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c.96 0 1.84-.38 2.47-1"/><path d="M14.47 14.47A3.5 3.5 0 0 0 12 8.5c-.96 0-1.84.38-2.47 1"/></svg>
                ) : (
                  // Eye SVG
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3.5"/></svg>
                )}
              </button>
            </div>
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" className="btn btn-primary login-btn">
            <span style={{ display: 'block', width: '100%', textAlign: 'center' }}>Login</span>
          </button>
        </form>
        {googleClientId ? (
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ color: 'var(--muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>
            <div ref={googleButtonRef} style={{ display: 'flex', justifyContent: 'center' }} />
            <p style={{ marginTop: '8px', color: 'var(--muted)', fontSize: '12px', textAlign: 'center' }}>
              Use your @spectral.energy Google account. Non-allowed accounts will be blocked.
            </p>
            {loadingGoogle && (
              <p style={{ marginTop: '8px', textAlign: 'center', color: 'var(--muted)' }}>
                Connecting to Google…
              </p>
            )}
          </div>
        ) : (
          <p style={{ marginTop: '16px', color: 'var(--muted)', fontSize: '12px', textAlign: 'center' }}>
            Google sign-in is not configured. Set VITE_GOOGLE_CLIENT_ID to enable it.
          </p>
        )}
        <p className="login-note">
          New accounts are currently created by administrators. Please contact your admin team for access.
        </p>
      </div>
    </div>
  );
};

export default Login;
