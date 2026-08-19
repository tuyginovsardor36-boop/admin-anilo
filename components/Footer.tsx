import React from 'react';
import { Page } from '../App';

interface FooterProps {
    onNavigate: (page: Page) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#090b1a] border-t border-gray-800 mt-16 py-8">
      <div className="container mx-auto px-4 text-center">
        <div className="mb-4">
            <h2 className="text-2xl font-bold font-['Metal_Mania'] tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                Anilo.uz
            </h2>
        </div>
        
        <p className="text-gray-400 text-sm mb-2">
            &copy; 2025 Anilo.uz. Barcha huquqlar himoyalangan.
        </p>
        
        <button 
            onClick={() => onNavigate('copyright')}
            className="text-blue-400/60 hover:text-blue-400 text-xs transition-colors duration-300 border-b border-transparent hover:border-blue-400/50 pb-0.5"
        >
            Mualliflik huquqi bilan tanishib chiqing, bu yerni bosing
        </button>
      </div>
    </footer>
  );
};