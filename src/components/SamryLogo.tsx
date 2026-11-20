import React from 'react';

interface SamryLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSubtitle?: boolean;
  className?: string;
}

export const SamryLogo: React.FC<SamryLogoProps> = ({
  size = 'md',
  showText = true,
  showSubtitle = false,
  className = '',
}) => {
  const iconDimensions = {
    sm: 'w-8 h-8',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }[size];

  const titleSizes = {
    sm: 'text-sm sm:text-base',
    md: 'text-base sm:text-lg',
    lg: 'text-xl sm:text-2xl',
    xl: 'text-2xl sm:text-3xl',
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none shrink-0 ${className}`}>
      <div
        className={`relative ${iconDimensions} rounded-xl bg-slate-900 dark:bg-slate-900 border border-slate-700/80 flex items-center justify-center shrink-0 overflow-hidden shadow-sm`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full p-1.5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="samryGradA" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
            <linearGradient id="samryGradB" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>
          </defs>

          <path
            d="M 46 25 C 35 25 25 30 25 40 C 25 49 36 51 45 54 C 54 57 59 60 59 68 C 59 76 49 80 37 80 C 28 80 22 75 20 70"
            stroke="url(#samryGradA)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 52 79 L 68 25 L 84 79"
            stroke="url(#samryGradB)"
            strokeWidth="8.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 58 60 L 78 60"
            stroke="url(#samryGradA)"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-baseline gap-1.5 whitespace-nowrap">
            <span className={`font-extrabold tracking-tight text-slate-900 dark:text-white ${titleSizes}`}>
              SAMRY AI
            </span>
            <span className="text-[11px] font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
              PRO MAX
            </span>
          </div>
          {showSubtitle && (
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 whitespace-nowrap">
              Oumar Hassane Abdelkerim
            </span>
          )}
        </div>
      )}
    </div>
  );
};
