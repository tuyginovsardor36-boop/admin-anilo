import React, { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

interface InputAreaProps {
  onAnalyze: (text: string) => void;
  isLoading: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onAnalyze, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onAnalyze(input);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl relative">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-indigo-500 to-blue-500 rounded-xl opacity-30 group-hover:opacity-100 transition duration-500 blur"></div>
        <div className="relative flex items-center bg-white rounded-xl p-2 shadow-sm">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a greeting (e.g., Salom, Bonjour, Konnichiwa)..."
            className="flex-1 p-4 bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none text-lg"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Thinking...</span>
              </>
            ) : (
              <>
                <span>Analyze</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
      <p className="text-center text-slate-400 text-sm mt-4">
        Try typing "Salom" to start your journey!
      </p>
    </form>
  );
};