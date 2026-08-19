
import React from 'react';

interface PromptButtonProps {
  onClick: () => void;
  label: string;
  isLoading: boolean;
  icon: React.ReactNode;
  className?: string;
}

const PromptButton: React.FC<PromptButtonProps> = ({ onClick, label, isLoading, icon, className = '' }) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`
        flex-1 flex items-center justify-center gap-2 px-4 py-3 
        bg-slate-800 border border-slate-700 rounded-lg 
        text-slate-200 font-semibold 
        hover:bg-slate-700 hover:text-white 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500
        transition-all duration-200 ease-in-out
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {isLoading ? (
        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        icon
      )}
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{label.split(' ')[1] || label}</span>
    </button>
  );
};

export default PromptButton;
