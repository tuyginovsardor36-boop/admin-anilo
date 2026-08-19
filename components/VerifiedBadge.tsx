
import React from 'react';

interface VerifiedBadgeProps {
  type: 'gold' | 'silver';
  className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ type, className = "w-5 h-5" }) => {
  const isGold = type === 'gold';

  return (
    <div 
        className={`relative inline-flex items-center justify-center ${className}`}
        title={isGold ? "Premium Foydalanuvchi" : "Tasdiqlangan Foydalanuvchi"}
    >
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full drop-shadow-md filter" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FCD34D" />   {/* yellow-300 */}
                    <stop offset="50%" stopColor="#F59E0B" />   {/* amber-500 */}
                    <stop offset="100%" stopColor="#B45309" />  {/* amber-700 */}
                </linearGradient>
                <linearGradient id="silver-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#E2E8F0" />   {/* slate-200 */}
                    <stop offset="50%" stopColor="#94A3B8" />   {/* slate-400 */}
                    <stop offset="100%" stopColor="#475569" />  {/* slate-600 */}
                </linearGradient>
            </defs>
            
            {/* Star Shape Background */}
            <path 
                d="M12 2L14.8 8.2L21.5 9.1L16.5 13.8L17.8 20.5L12 17.2L6.2 20.5L7.5 13.8L2.5 9.1L9.2 8.2L12 2Z" 
                fill={isGold ? "url(#gold-gradient)" : "url(#silver-gradient)"} 
                stroke={isGold ? "#B45309" : "#475569"}
                strokeWidth="0.5"
            />
            
            {/* Checkmark */}
            <path 
                d="M9 12.5L11 14.5L15.5 9.5" 
                stroke="white" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                style={{ filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.3))' }}
            />
        </svg>
    </div>
  );
};
