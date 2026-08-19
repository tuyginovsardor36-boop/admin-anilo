
import React, { useRef } from 'react';
import { Movie } from '../types';
import { MovieCard } from './MovieCard';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface GenreSectionProps {
  title: string;
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
}

export const GenreSection: React.FC<GenreSectionProps> = ({ title, movies, onMovieClick }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = window.innerWidth * 0.7; // Ekran kengligining 70% ga surish
      
      if (direction === 'left') {
        current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <section className="mb-12 animate-fade-in relative group/section">
      {/* Sarlavha */}
      <h2 className="text-2xl font-bold text-white mb-4 px-4 border-l-4 border-orange-500 flex items-center gap-2">
        {title}
        <span className="text-sm font-normal text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full ml-2">
            {movies.length}
        </span>
      </h2>

      {/* Navigatsiya tugmalari (faqat Desktopda hover bo'lganda chiqadi) */}
      <button 
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-orange-600/80 p-2 rounded-r-xl text-white backdrop-blur-sm opacity-0 group-hover/section:opacity-100 transition-all duration-300 hidden md:block"
      >
        <ChevronLeftIcon className="w-8 h-8" />
      </button>
      
      <button 
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-orange-600/80 p-2 rounded-l-xl text-white backdrop-blur-sm opacity-0 group-hover/section:opacity-100 transition-all duration-300 hidden md:block"
      >
        <ChevronRightIcon className="w-8 h-8" />
      </button>

      {/* Gorizontal Scroll Konteyner */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto pb-4 scrollbar-hide px-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* 
            Grid Layout:
            grid-rows-2: 2 qator bo'lsin
            grid-flow-col: Elementlar ustun bo'lib joylashsin (yonga qarab ketadi)
            w-max: Konteyner kengligi ichidagi elementlarga qarab cho'zilsin
        */}
        <div className="grid grid-rows-2 grid-flow-col gap-4 w-max">
          {movies.map((movie) => (
            <div key={`${title}-${movie.id}`} className="w-[160px] sm:w-[200px] md:w-[220px] h-full">
              <MovieCard 
                movie={movie} 
                isActive={true} 
                onClick={() => onMovieClick(movie)} 
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
