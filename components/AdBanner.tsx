
import React, { useEffect, useRef } from 'react';
import { Ad } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { incrementAdView } from '../services/dbService';

interface AdBannerProps {
  ad: Ad;
  onClose: () => void;
}

export const AdBanner: React.FC<AdBannerProps> = ({ ad, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (ad.id) {
            incrementAdView(ad.id);
        }
    }, [ad.id]);

    useEffect(() => {
        // Ensure video plays if it's a video type
        if (ad.type === 'video' && videoRef.current) {
            videoRef.current.muted = true; // Autoplay policy requirement
            videoRef.current.play().catch(e => console.log("Ad autoplay blocked", e));
        }
    }, [ad]);

    if (!ad) return null;

    return (
        <div className="relative my-10 group animate-fade-in">
            <a href={ad.targetUrl} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden shadow-lg border border-orange-500/20 hover:border-orange-500/50 transition-all duration-300 bg-gray-900">
                {ad.type === 'banner' ? (
                    <img 
                        src={ad.contentUrl} 
                        alt={ad.name} 
                        className="w-full h-auto object-cover"
                    />
                ) : (
                    <video 
                        ref={videoRef}
                        src={ad.contentUrl} 
                        className="w-full h-auto object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                    />
                )}
            </a>
            <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded z-10">
                Reklama
            </div>
            <button 
                onClick={onClose}
                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-gray-300 hover:bg-black/80 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-10"
                aria-label="Reklamani yopish"
            >
                <CloseIcon className="w-4 h-4" />
            </button>
        </div>
    );
};
