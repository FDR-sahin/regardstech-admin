import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  lightMode?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  lightMode = false
}) => {
  const iconSize = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  }[size];

  const textSize = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl'
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Exact Regards Tech stylized arrow mark from website screenshot */}
      <div className={`${iconSize} relative flex items-center justify-center shrink-0`}>
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Outer rectangular bracket with diagonal opening */}
          <rect x="2" y="2" width="36" height="36" rx="6" stroke="#3b82f6" strokeWidth="2.5" className="opacity-90" />
          {/* Inner diagonal chevron track */}
          <path d="M10 30L26 14" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M14 30L30 14" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
          {/* Arrow head pointing up-right */}
          <path d="M19 14H30V25" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold tracking-tight font-sans ${textSize} ${lightMode ? 'text-slate-900' : 'text-white'}`}>
            Regards Tech
          </span>
        </div>
      )}
    </div>
  );
};
