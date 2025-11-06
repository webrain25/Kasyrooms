import React from 'react';
import type { Lang } from '@/lib/i18n';

type FlagCode = Lang;

interface FlagIconProps {
  code: FlagCode;
  className?: string;
  title?: string;
  rounded?: boolean;
}

// Simple stylized rectangular flags (flat) using SVG; ratio ~4:3
export const FlagIcon: React.FC<FlagIconProps> = ({ code, className = 'w-5 h-4', title, rounded = true }) => {
  const common = {
    className: `${className} ${rounded ? 'rounded-sm overflow-hidden' : ''}`,
    role: 'img',
    'aria-label': code,
  } as React.SVGProps<SVGSVGElement>;

  switch (code) {
    case 'it':
      return (
        <svg {...common} viewBox="0 0 3 2">
          <title>{title || 'Italiano'}</title>
          <rect width="1" height="2" x="0" fill="#008C45" />
          <rect width="1" height="2" x="1" fill="#F4F5F0" />
          <rect width="1" height="2" x="2" fill="#CD212A" />
        </svg>
      );
    case 'en': // United Kingdom
      return (
        <svg {...common} viewBox="0 0 60 30">
          <title>{title || 'English'}</title>
          <clipPath id="uk-clip"><path d="M0,0 v30 h60 v-30 z" /></clipPath>
          <g clipPath="url(#uk-clip)">
            <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="3" />
            <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
            <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
          </g>
        </svg>
      );
    case 'fr':
      return (
        <svg {...common} viewBox="0 0 3 2">
          <title>{title || 'Français'}</title>
          <rect width="1" height="2" x="0" fill="#002395" />
          <rect width="1" height="2" x="1" fill="#FFFFFF" />
          <rect width="1" height="2" x="2" fill="#ED2939" />
        </svg>
      );
    case 'de':
      return (
        <svg {...common} viewBox="0 0 5 3">
          <title>{title || 'Deutsch'}</title>
          <rect width="5" height="1" y="0" fill="#000" />
            <rect width="5" height="1" y="1" fill="#DD0000" />
            <rect width="5" height="1" y="2" fill="#FFCE00" />
        </svg>
      );
    case 'es':
      return (
        <svg {...common} viewBox="0 0 3 2">
          <title>{title || 'Español'}</title>
          <rect width="3" height="2" fill="#AA151B" />
          <rect width="3" height="1" y="0.5" fill="#F1BF00" />
        </svg>
      );
    default:
      return <span className={className}>{code}</span>;
  }
};

export const LANGUAGE_LABEL: Record<FlagCode, string> = {
  it: 'Italiano',
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español'
};
