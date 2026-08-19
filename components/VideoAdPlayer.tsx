
import React, { useState, useEffect, useRef } from 'react';
import { Ad } from '../types';
import { incrementAdView } from '../services/dbService';

interface VideoAdPlayerProps {
  ad: Ad;
  onFinish: () => void;
}

export const VideoAdPlayer: React.FC<VideoAdPlayerProps> = ({ ad, onFinish }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [countdown, setCountdown] = useState(5);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    // Increment view count on mount
    if (ad.id) {
        incrementAdView(ad.id);
    }

    const video = videoRef.current;
    if (!video) return;

    // Muting increases autoplay success rate, especially on mobile
    video.muted = true; 
    
    // Play Promise handling
    const playPromise = video.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.warn("Ad autoplay prevented or interrupted:", error);
            // If autoplay is strictly blocked, we might want to show a "Play" button manually,
            // but for now we just log it.
        });
    }

    const countdownTimer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const handleVideoEnd = () => {
      onFinish();
    };

    video.addEventListener('ended', handleVideoEnd);

    return () => {
      clearInterval(countdownTimer);
      video.removeEventListener('ended', handleVideoEnd);
    };
  }, [onFinish, ad.id]);

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the link from being triggered
    e.preventDefault();
    
    // FIX: Do NOT call pause() here. 
    // Calling pause() while play() is still pending causes the "The play() request was interrupted" error.
    // Since onFinish() unmounts the component, the video will stop automatically.
    onFinish();
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center animate-fade-in">
      <video
        ref={videoRef}
        src={ad.contentUrl}
        className="w-full h-full object-contain"
        playsInline
        autoPlay
        muted
      />
      
      {/* Clickable overlay for the ad target URL */}
      <a href={ad.targetUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 w-full h-full" aria-label={`Reklama: ${ad.name}`}></a>

      {/* Controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent flex justify-between items-end">
          <div className="bg-black/60 backdrop-blur-sm p-2 px-3 rounded-lg text-xs text-gray-300">
             REKLAMA
          </div>

          <div className="flex items-center gap-4">
            {!canSkip && (
                <div className="bg-black/60 backdrop-blur-sm p-2 px-4 rounded-lg text-sm text-white">
                    <span>O'tkazib yuborish mumkin: <span className="font-bold">{countdown}</span></span>
                </div>
            )}
            {canSkip && (
              <button 
                onClick={handleSkip} 
                className="bg-black/60 backdrop-blur-sm p-2 px-4 rounded-lg hover:bg-white/20 transition-colors animate-fade-in text-sm text-white z-10"
              >
                O'tkazib yuborish
              </button>
            )}
          </div>
      </div>
    </div>
  );
};
