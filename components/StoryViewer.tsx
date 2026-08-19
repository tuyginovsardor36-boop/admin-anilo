
import React, { useState, useEffect } from 'react';
import { X, Volume2, VolumeX, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { FandubStory } from '../types';

interface StoryViewerProps {
  stories: FandubStory[];
  initialIndex: number;
  onClose: () => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({ stories, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  const currentStory = stories[currentIndex];

  useEffect(() => {
    setProgress(0);
    const duration = 5000; // 5 sekund har bir hikoya uchun
    const interval = 50; 
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center animate-fade-in">
      {/* Top Progress Bars */}
      <div className="absolute top-4 left-0 right-0 px-4 flex gap-1 z-50">
        {stories.map((_, i) => (
          <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{ width: i === currentIndex ? `${progress}%` : i < currentIndex ? '100%' : '0%' }}
            ></div>
          </div>
        ))}
      </div>

      {/* Header Info */}
      <div className="absolute top-8 left-0 right-0 px-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-orange-500 p-0.5">
            <img src={currentStory.profiles?.avatar_url || ''} className="w-full h-full rounded-full object-cover" alt="" />
          </div>
          <div>
            <p className="text-sm font-black text-white shadow-lg">@{currentStory.profiles?.username || 'user'}</p>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                {new Date(currentStory.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-white/70 hover:text-white transition-colors bg-white/10 rounded-full backdrop-blur-md">
          <X size={24} />
        </button>
      </div>

      {/* Main Content (Story) */}
      <div className="relative w-full h-full max-w-lg flex flex-col">
        <div className="flex-1 flex items-center justify-center relative">
            {currentStory.media_type === 'image' ? (
                <img src={currentStory.media_url} className="max-w-full max-h-full object-contain shadow-2xl" alt="" />
            ) : (
                <video src={currentStory.media_url} autoPlay muted={isMuted} playsInline className="max-w-full max-h-full object-contain" />
            )}

            {/* Navigation Areas (Clickable sides) */}
            <div className="absolute inset-y-0 left-0 w-1/4" onClick={handlePrev}></div>
            <div className="absolute inset-y-0 right-0 w-1/4" onClick={handleNext}></div>
        </div>

        {/* --- BANNER FIELD (USER REQUESTED) --- */}
        <div className="p-6 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center">
            <div className="w-full p-4 bg-orange-600/10 border border-orange-500/20 rounded-2xl flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center text-white font-black text-xs">AD</div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-orange-500 tracking-widest">Homiylik Reklamasi</p>
                        <p className="text-xs font-bold text-white">Anilo Premium: Cheksiz Imkoniyat</p>
                    </div>
                </div>
                <ExternalLink size={16} className="text-zinc-500" />
            </div>
            
            {/* Story Action button (optional) */}
            <button className="mt-6 px-10 py-3 bg-white text-black rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95">
                Profilni ko'rish
            </button>
        </div>
      </div>
    </div>
  );
};
