import React from 'react';

const baseProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  fill: 'none',
  viewBox: '0 0 24 24',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const iconStyle = { display: 'block' };

export const SunIcon = ({ size = 20, className }) => (
  <svg {...baseProps} className={className} width={size} height={size} style={iconStyle}>
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
    <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
    <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
    <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
  </svg>
);

export const MoonIcon = ({ size = 20, className }) => (
  <svg {...baseProps} className={className} width={size} height={size} style={iconStyle}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
  </svg>
);

export const LinkedinIcon = ({ size = 20, className }) => (
  <svg {...baseProps} className={className} width={size} height={size} style={iconStyle}>
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
  </svg>
);

export const MailIcon = ({ size = 20, className }) => (
  <svg {...baseProps} className={className} width={size} height={size} style={iconStyle}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a2 2 0 0 1-2.06 0L2 7" />
  </svg>
);

