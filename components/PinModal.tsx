
import React, { useState, useEffect } from 'react';
import { Lock, Delete, X } from 'lucide-react';

interface PinModalProps {
  correctPin?: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({ correctPin, onSuccess, onClose }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (input.length === 4) {
        if (input === correctPin) {
            onSuccess();
        } else {
            setError(true);
            setTimeout(() => {
                setInput('');
                setError(false);
            }, 500);
        }
    }
  }, [input, correctPin, onSuccess]);

  const handlePress = (num: number) => {
      if (input.length < 4) {
          setInput(prev => prev + num);
      }
  };

  const handleDelete = () => {
      setInput(prev => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-fade-in">
        <div className="relative w-full max-w-xs flex flex-col items-center">
            <button onClick={onClose} className="absolute top-0 right-0 p-2 text-gray-500 hover:text-white">
                <X size={24} />
            </button>

            <div className="mb-8 flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 border-2 border-orange-600/50 shadow-[0_0_20px_rgba(234,88,12,0.2)]">
                    <Lock className="w-8 h-8 text-orange-500" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">Xavfsizlik Kdi</h2>
                <p className="text-xs text-gray-400">Ushbu bo'limga kirish uchun PIN kodni kiriting</p>
            </div>

            {/* Dots */}
            <div className="flex gap-4 mb-8">
                {[0, 1, 2, 3].map((i) => (
                    <div 
                        key={i} 
                        className={`w-4 h-4 rounded-full transition-all duration-200 ${
                            i < input.length 
                                ? 'bg-orange-500 scale-110 shadow-[0_0_10px_rgba(249,115,22,0.5)]' 
                                : 'bg-gray-700 border border-gray-600'
                        } ${error ? 'bg-red-500 animate-shake' : ''}`}
                    />
                ))}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-4 w-full">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                        key={num}
                        onClick={() => handlePress(num)}
                        className="h-16 w-16 rounded-full bg-gray-800/50 hover:bg-gray-700 border border-gray-700 text-white text-2xl font-bold flex items-center justify-center transition-all active:scale-95 mx-auto"
                    >
                        {num}
                    </button>
                ))}
                <div className="h-16 w-16"></div>
                <button
                    onClick={() => handlePress(0)}
                    className="h-16 w-16 rounded-full bg-gray-800/50 hover:bg-gray-700 border border-gray-700 text-white text-2xl font-bold flex items-center justify-center transition-all active:scale-95 mx-auto"
                >
                    0
                </button>
                <button
                    onClick={handleDelete}
                    className="h-16 w-16 rounded-full bg-transparent hover:bg-red-900/20 text-red-400 flex items-center justify-center transition-all active:scale-95 mx-auto"
                >
                    <Delete size={24} />
                </button>
            </div>
        </div>
    </div>
  );
};
