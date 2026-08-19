import React from 'react';

export const QualityIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 8V7H8" />
        <path d="M10 7L8 17" />
        <path d="M14 7l-2.5 5 2.5 5" />
        <path d="M20 7v10" />
        <path d="M17.5 12h-1" />
        <path d="M4 7h4" />
        <path d="M6 7v10" />
    </svg>
);
