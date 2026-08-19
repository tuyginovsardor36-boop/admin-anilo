import React from 'react';
import { CulturalAnalysis } from '../types';
import { Globe, MessageCircle, BookOpen, Mic } from 'lucide-react';

interface ResultCardProps {
  data: CulturalAnalysis;
}

export const ResultCard: React.FC<ResultCardProps> = ({ data }) => {
  return (
    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 animate-fade-in-up">
      {/* Header Section with Gradient */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="w-6 h-6" />
              {data.detectedLanguage}
            </h2>
            <span className="text-indigo-100 text-sm uppercase tracking-wider font-semibold bg-indigo-700/30 px-2 py-1 rounded mt-2 inline-block">
              {data.isoCode}
            </span>
          </div>
          <div className="text-right">
             <div className="text-4xl font-serif opacity-90">
                {data.isoCode === 'uz' ? 'Salom!' : 'Hello!'}
             </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Translation Block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Translation</span>
            </div>
            <p className="text-lg font-medium text-slate-800">{data.englishTranslation}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Mic className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Pronunciation</span>
            </div>
            <p className="text-lg font-mono text-indigo-600">{data.pronunciation}</p>
          </div>
        </div>

        {/* Gemini's Response */}
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">Gemini's Response</h3>
            <p className="text-blue-900 italic">"{data.friendlyResponse}"</p>
        </div>

        {/* Cultural Facts */}
        <div>
          <div className="flex items-center gap-2 text-slate-800 mb-4 border-b border-slate-100 pb-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-lg">Cultural Insights</h3>
          </div>
          <ul className="space-y-3">
            {data.culturalFacts.map((fact, index) => (
              <li key={index} className="flex items-start gap-3 text-slate-600 leading-relaxed">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold mt-0.5">
                  {index + 1}
                </span>
                {fact}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};