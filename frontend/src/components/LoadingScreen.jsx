import React from 'react';
import logo from '../assets/spectral-logo.svg';

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-screen">
      <div className="loading-inner">
        <img src={logo} alt="Spectral Real Estate Solutions" className="loading-logo" />
        <div className="loading-copy">
          <p className="eyebrow">Smart Buildings Platform</p>
          <h2>Preparing your skyline</h2>
          <p className="muted">{message}</p>
        </div>
        <div className="loading-city" aria-hidden="true">
          <span className="building building-short" />
          <span className="building building-medium" />
          <span className="building building-tall" />
          <span className="building building-medium" />
          <span className="building building-short" />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
