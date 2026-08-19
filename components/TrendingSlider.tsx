
import React, { useRef } from 'react';
import { Movie } from '../types';
import { Play } from 'lucide-react';

interface TrendingSliderProps {
    movies: Movie[];
    onMovieClick: (movie: Movie) => void;
}

export const TrendingSlider: React.FC<TrendingSliderProps> = ({ movies, onMovieClick }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = 300;
            if (direction === 'left') {
                current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    return (
        <div className="relative w-full py-10 overflow-hidden group/slider">
            <h2 className="text-2xl md:text-4xl font-black text-white mb-8 px-4 md:px-8 uppercase tracking-tighter flex items-center gap-3">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">TREND</span> 
                <span>TOPLAM</span>
            </h2>

            {/* Navigation Arrows (Desktop) */}
            <button onClick={() => scroll('left')} className="absolute left-2 top-1/2 z-20 bg-black/50 p-3 rounded-full text-white backdrop-blur-md border border-white/10 hidden md:block hover:bg-orange-600 transition-colors">
                ←
            </button>
            <button onClick={() => scroll('right')} className="absolute right-2 top-1/2 z-20 bg-black/50 p-3 rounded-full text-white backdrop-blur-md border border-white/10 hidden md:block hover:bg-orange-600 transition-colors">
                →
            </button>

            {/* Scroll Container */}
            <div 
                ref={scrollRef}
                className="flex gap-6 overflow-x-auto px-8 pb-10 pt-4 scrollbar-hide snap-x snap-mandatory"
                style={{ 
                    perspective: '1000px',
                    WebkitOverflowScrolling: 'touch', // Smooth touch scroll on iOS
                }}
            >
                {movies.map((movie, index) => (
                    <div 
                        key={movie.id}
                        onClick={() => onMovieClick(movie)}
                        className="relative flex-shrink-0 w-48 md:w-64 h-72 md:h-96 cursor-pointer group transition-all duration-500 hover:scale-105 hover:z-10 snap-center"
                        style={{
                            transform: 'skewX(-6deg)',
                            borderRadius: '20px',
                            overflow: 'hidden',
                            boxShadow: '10px 10px 30px rgba(0,0,0,0.5)'
                        }}
                    >
                        {/* Image Layer - Counter Skew */}
                        <div className="absolute inset-0 bg-zinc-800" style={{ transform: 'skewX(6deg) scale(1.2)' }}>
                            <img 
                                src={movie.posterUrl} 
                                alt={movie.title} 
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                        </div>

                        {/* Content Overlay */}
                        <div 
                            className="absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end h-full"
                            style={{ transform: 'skewX(6deg)' }} 
                        >
                            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center mb-3 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shadow-orange-600/50">
                                    <Play size={18} fill="white" className="ml-1"/>
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none drop-shadow-md line-clamp-2">
                                    {movie.title}
                                </h3>
                                <p className="text-orange-400 text-xs font-bold mt-1 uppercase tracking-widest">
                                    {movie.genre.split(',')[0]}
                                </p>
                            </div>
                        </div>
                        
                        {/* Border Effect */}
                        <div className="absolute inset-0 border-2 border-white/10 group-hover:border-orange-500/50 transition-colors pointer-events-none rounded-[20px]"></div>
                    </div>
                ))}
            </div>
        </div>
    );
};
