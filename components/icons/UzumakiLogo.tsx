
import React from 'react';

export const UzumakiLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      {...props}
    >
      <defs>
        <linearGradient id="compGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff7e33" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>
      <circle cx="256" cy="256" r="256" fill="#000000" />
      <path 
        d="M256 120C180.89 120 120 180.89 120 256C120 331.11 180.89 392 256 392C331.11 392 392 331.11 392 256" 
        stroke="url(#compGrad)" 
        strokeWidth="24" 
        strokeLinecap="round"
      />
      <path 
        d="M256 256C256 210 220 210 220 256C220 310 290 310 290 256C290 180 170 180 170 256C170 350 342 350 342 256" 
        stroke="white" 
        strokeWidth="12" 
        strokeLinecap="round"
      />
    </svg>
  );
};
