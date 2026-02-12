
import React from 'react';

export type LogoExpression = 'neutral' | 'smirk' | 'annoyed' | 'sad' | 'angry' | 'proud';

interface LogoProps {
  className?: string;
  expression?: LogoExpression;
}

const Logo: React.FC<LogoProps> = ({ 
  className = "w-10 h-10", 
  expression = 'neutral' 
}) => {
  // Eye path logic based on the specific "sleeping/squint" style in the uploaded image
  const getEyePaths = () => {
    switch (expression) {
      case 'proud':
        return (
          <>
            <path d="M 33 42 Q 38 37 43 42" stroke="white" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
            <path d="M 57 42 Q 62 37 67 42" stroke="white" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
          </>
        );
      case 'angry':
        return (
          <>
            <path d="M 32 45 L 43 40" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
            <path d="M 57 40 L 68 45" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
          </>
        );
      case 'annoyed':
        return (
          <>
            <path d="M 32 43 L 43 43" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
            <path d="M 57 43 L 68 43" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
          </>
        );
      default: // neutral/uploaded style
        return (
          <>
            {/* These match the specific semi-circle eyes in the user's image */}
            <path d="M 32 40 C 32 46, 43 46, 43 40" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
            <path d="M 57 40 C 57 46, 68 46, 68 40" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
          </>
        );
    }
  };

  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ghost body - Exactly like the uploaded image: Dome top, slanted rectangular bottom */}
      <path
        d="M 25 55 
           C 25 25, 75 25, 75 55
           L 75 90
           L 64 82
           L 64 90
           L 50 82
           L 50 90
           L 36 82
           L 36 85
           L 25 80 Z"
        fill="#EF216A"
      />
      
      {/* Eyes */}
      <g style={{ transition: 'all 0.2s ease-in-out' }}>
        {getEyePaths()}
      </g>
    </svg>
  );
};

export default Logo;
