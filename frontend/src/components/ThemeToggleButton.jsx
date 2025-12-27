import React from 'react';
import { useTheme } from '../ThemeContext';
import { MoonIcon, SunIcon } from './Icons';

const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={`theme-toggle ${isDark ? 'is-dark' : 'is-light'}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span className="theme-toggle__rail" aria-hidden="true">
        <span className={`theme-toggle__thumb ${isDark ? 'is-dark' : 'is-light'}`}>
          {isDark ? <MoonIcon size={18} className="theme-toggle__icon" /> : <SunIcon size={18} className="theme-toggle__icon" />}
        </span>
      </span>
      <span className="theme-toggle__label">
        <span className="theme-toggle__state">{isDark ? 'Dark mode' : 'Light mode'}</span>
      </span>
    </button>
  );
};

export default ThemeToggleButton;
