
import React, { useState, useRef, useEffect } from 'react';
import { Movie } from '../types';
import { MovieCard } from './MovieCard';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface MovieCarouselProps {
    movies: Movie[];
    onMovieClick?: (movie: Movie) => void;
}

export const MovieCarousel: React.FC<MovieCarouselProps> = ({ movies, onMovieClick }) => {
    const [activeIndex, setActiveIndex] = useState(Math.floor(movies.length / 2));
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Responsive State
    const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

    // Ekranga qarab o'lchamlarni aniqlash
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 640) {
                setScreenSize('mobile');
            } else if (width < 1024) {
                setScreenSize('tablet');
            } else {
                setScreenSize('desktop');
            }
        };

        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleNavClick = (direction: 'next' | 'prev') => {
        setActiveIndex((current) => {
            const newIndex = direction === 'next' ? current + 1 : current - 1;
            return Math.max(0, Math.min(movies.length - 1, newIndex));
        });
    };
    
    const handleCardClick = (index: number) => {
        if (index === activeIndex) {
            onMovieClick?.(movies[index]);
        } else {
            setActiveIndex(index);
        }
    }

    if (!movies || movies.length === 0) {
        return null;
    }

    // --- RESPONSIVE SOZLAMALAR ---
    const settings = {
        mobile: {
            cardWidth: '60vw',     // 65vw dan 60vw ga kichraytirildi (bo'yi sig'ishi uchun)
            spacing: 65,           
            scaleInactive: 0.85,   
            containerHeight: '580px' // 450px dan 580px ga oshirildi (tepasi kesilmasligi uchun)
        },
        tablet: {
            cardWidth: '40vw',
            spacing: 45,
            scaleInactive: 0.85,
            containerHeight: '650px' // 500px dan 650px ga oshirildi
        },
        desktop: {
            cardWidth: '20vw',     
            maxWidth: '280px',     
            spacing: 25,
            scaleInactive: 0.9,
            containerHeight: '700px' // 600px dan 700px ga oshirildi
        }
    };

    const currentSettings = settings[screenSize];

    return (
        <div 
            ref={containerRef} 
            className="relative w-full flex items-center justify-center overflow-hidden my-4 sm:my-8"
            style={{ height: currentSettings.containerHeight }}
        >
            
            {/* Orqa fon effekti (Hozirgi aktiv kinoning xira posti) */}
            <div className="absolute inset-0 z-0 overflow-hidden opacity-30 blur-3xl">
                <img 
                    src={movies[activeIndex]?.posterUrl} 
                    alt="" 
                    className="w-full h-full object-cover transition-all duration-700"
                />
                <div className="absolute inset-0 bg-black/60"></div>
            </div>

            <div className="relative w-full h-full flex items-center justify-center z-10">
                {movies.map((movie, index) => {
                    // Markazdan qancha uzoqligi
                    const offset = index - activeIndex;
                    const isActive = offset === 0;
                    const absOffset = Math.abs(offset);
                    
                    // Ko'rinish chegarasi (ortiqcha yuklamaslik uchun)
                    if (screenSize === 'mobile' && absOffset > 2) return null;
                    if (screenSize !== 'mobile' && absOffset > 4) return null;

                    return (
                        <div
                            key={`${movie.title}-${index}`}
                            className={`absolute transition-all duration-500 ease-out cursor-pointer p-4
                                ${isActive ? 'z-20' : 'z-10'}
                            `}
                            style={{
                                // Hisoblash: Markaz (50%) + (Uzoqlik * Masofa%)
                                left: `calc(50% + ${offset * currentSettings.spacing}%)`,
                                transform: `
                                    translateX(-50%) 
                                    scale(${isActive ? 1.05 : currentSettings.scaleInactive}) 
                                    ${isActive ? 'translateY(0)' : 'translateY(5%)'} 
                                    rotateY(${offset * -5}deg)
                                `,
                                // Aktiv karta scale 1.1 dan 1.05 ga tushirildi (tabiiy o'lcham)
                                
                                // Uzoqlashgan sari shaffofroq bo'ladi
                                opacity: isActive ? 1 : Math.max(0.2, 1 - absOffset * 0.3),
                                width: currentSettings.cardWidth,
                                maxWidth: (currentSettings as any).maxWidth || 'none',
                                zIndex: 10 - absOffset,
                            }}
                            onClick={() => handleCardClick(index)}
                        >
                            <div className={`relative rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${isActive ? 'ring-2 ring-orange-500 shadow-orange-500/50' : 'brightness-50 hover:brightness-75'}`}>
                                <MovieCard 
                                    movie={movie} 
                                    isActive={isActive} 
                                    onClick={() => {}} 
                                />
                                
                                {/* Play Icon Overlay for Active Item */}
                                {isActive && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 shadow-lg animate-pulse">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-white fill-white" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Refleksiya (Soyasi) */}
                            {isActive && (
                                <div className="absolute -bottom-10 left-0 right-0 h-24 bg-gradient-to-b from-white/10 to-transparent opacity-30 blur-lg transform scale-y-[-1] mask-image-gradient pointer-events-none">
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Navigation Buttons */}
            <button 
                onClick={() => handleNavClick('prev')}
                disabled={activeIndex === 0}
                className="absolute left-2 sm:left-8 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-orange-600/80 disabled:opacity-0 disabled:cursor-not-allowed transition-all shadow-lg group"
                aria-label="Previous movie"
            >
                <ChevronLeftIcon className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
            </button>
            <button
                onClick={() => handleNavClick('next')}
                disabled={activeIndex === movies.length - 1}
                className="absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-orange-600/80 disabled:opacity-0 disabled:cursor-not-allowed transition-all shadow-lg group"
                aria-label="Next movie"
            >
                <ChevronRightIcon className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
            </button>

        </div>
    );
};
