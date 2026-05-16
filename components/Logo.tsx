
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
  // Adjusted Y-coordinates to shift eyes down globally by ~8-10 units
  const getEyePaths = () => {
    switch (expression) {
      case 'proud':
        return (
          <>
            <path d="M 33 50 Q 38 45 43 50" stroke="white" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
            <path d="M 57 50 Q 62 45 67 50" stroke="white" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
          </>
        );
      case 'angry':
        return (
          <>
            <path d="M 32 53 L 43 48" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
            <path d="M 57 48 L 68 53" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
          </>
        );
      case 'annoyed':
        return (
          <>
            <path d="M 32 51 L 43 51" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
            <path d="M 57 51 L 68 51" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
          </>
        );
      case 'smirk':
        return (
          <>
            <path d="M 32 51 L 43 48" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
            <path d="M 57 48 C 57 54, 68 54, 68 48" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
          </>
        );
      default: // neutral/uploaded style shifted down
        return (
          <>
            <path d="M 32 48 C 32 54, 43 54, 43 48" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
            <path d="M 57 48 C 57 54, 68 54, 68 48" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
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
      {/* Ghost body - Dome top peaks at y=25 */}
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
      
      {/* Eyes shifted down to ~y=48/50 to be more central in the face */}
      <g style={{ transition: 'all 0.2s ease-in-out' }}>
        {getEyePaths()}
      </g>
    </svg>
  );
};

export default Logo;
