import React from 'react';

interface TermoprolLogoProps {
  variant?: 'horizontal' | 'icon';
  theme?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const TermoprolLogo: React.FC<TermoprolLogoProps> = ({
  variant = 'horizontal',
  theme = 'light',
  size = 'md',
  className = ''
}) => {
  // Height adjustments based on size
  let heightClass = 'h-9';
  let iconClass = 'w-9 h-9';

  if (size === 'sm') {
    heightClass = 'h-8';
    iconClass = 'w-8 h-8';
  } else if (size === 'lg') {
    heightClass = 'h-11';
    iconClass = 'w-11 h-11';
  } else if (size === 'xl') {
    heightClass = 'h-14';
    iconClass = 'w-14 h-14';
  }

  if (variant === 'icon') {
    return (
      <img
        src="/termoprol-icon.png"
        alt="Termoprol"
        className={`${iconClass} object-contain flex-shrink-0 transition-transform duration-200 hover:scale-105 ${className}`}
        loading="eager"
      />
    );
  }

  // Choose the official white-text version for dark backgrounds, or dark-text for light backgrounds
  const logoSrc = theme === 'dark' ? '/termoprol-logo-white.png' : '/termoprol-logo.png';

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src={logoSrc}
        alt="Termoprol - Tecnologia em refrigeração"
        className={`${heightClass} w-auto object-contain transition-transform duration-200 hover:scale-102`}
        loading="eager"
      />
    </div>
  );
};
