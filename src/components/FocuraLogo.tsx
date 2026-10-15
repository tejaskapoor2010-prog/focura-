import React, { useState } from 'react';
import iconImg from '../assets/images/focura_icon_f_1790235258678.jpg';

interface FocuraLogoProps {
  className?: string;
  showTagline?: boolean;
}

/**
 * Focura Official Brand Mark
 * Displays the exact uploaded F monogram logo image with 100% untouched original styling.
 */
export const FocuraLogo: React.FC<FocuraLogoProps> = ({ 
  className = 'h-10 w-auto',
  showTagline = false 
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {!imgError ? (
        <img
          src={iconImg}
          alt="Focura"
          onError={() => setImgError(true)}
          className="h-full w-auto max-h-full aspect-square object-contain rounded-lg"
        />
      ) : (
        <img
          src="/favicon.jpg"
          alt="Focura"
          className="h-full w-auto max-h-full aspect-square object-contain rounded-lg"
        />
      )}

      {showTagline && (
        <span className="hidden xl:inline-block text-[10px] font-mono text-zinc-500 uppercase tracking-widest pl-1 border-l border-zinc-800">
          AI FOCUS
        </span>
      )}
    </div>
  );
};
