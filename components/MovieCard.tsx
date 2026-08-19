
import React from 'react';
import { Movie } from '../types';
import { Play, Star, Eye } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
  onClick?: () => void;
  isActive: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  const posterSrc = movie.poster_url || movie.posterUrl || 'https://via.placeholder.com/400x600?text=No+Poster';
  
  // Mock view count logic if not present (for visual consistency based on user request)
  // In real app, movie.view_count would come from DB
  const viewCount = (movie as any).view_count || Math.floor(Math.random() * 5000) + 500;

  return (
    <div 
        className="group flex flex-col w-full cursor-pointer animate-fade"
        onClick={onClick}
    >
      <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#16161a] mb-3 anime-card shadow-2xl border border-white/5 group-hover:border-orange-500/50 transition-all duration-500">
          <img 
            src={posterSrc} 
            alt={movie.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy" 
            onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/400x600?text=Yuklanmadi';
            }}
          />
          
          {/* Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/30 text-white rounded-full flex items-center justify-center transform scale-50 group-hover:scale-100 transition-transform duration-500 shadow-[0_0_20px_rgba(249,115,22,0.5)]">
                  <Play fill="white" size={20} className="ml-1" />
              </div>
          </div>

          {/* Top Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
              <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 border border-white/10 shadow-lg">
                  <Star size={10} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-[10px] font-black text-white">{movie.rating.toFixed(1)}</span>
              </div>
          </div>
          
          <div className="absolute top-2 right-2 bg-gradient-to-r from-orange-600 to-red-600 px-2 py-0.5 rounded-md text-[8px] font-black text-white uppercase tracking-wider shadow-lg">
              {movie.quality}
          </div>

          {/* Bottom Info Overlay (Views & Year) - Always visible or on hover based on preference */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-300">
                  <span className="flex items-center gap-1">
                      <Eye size={12} className="text-blue-400" />
                      {viewCount.toLocaleString()}
                  </span>
                  <span className="text-white bg-white/10 px-1.5 rounded">{movie.year}</span>
              </div>
          </div>
      </div>
      
      <div className="flex flex-col px-1">
          <h3 className="text-white font-bold text-sm leading-snug line-clamp-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-orange-400 group-hover:to-blue-400 transition-all">
              {movie.title}
          </h3>
          <div className="flex items-center gap-2 text-gray-500 mt-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 border border-zinc-800 px-1 rounded">{movie.language.split('/')[0]}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest truncate text-blue-500/80">{movie.genre.split(',')[0]}</span>
          </div>
      </div>
    </div>
  );
};
