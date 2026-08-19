
import React, { useState, useCallback, useEffect } from 'react';
import { SearchBar } from './components/SearchBar';
import { MovieCard } from './components/MovieCard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { searchMoviesDB } from './services/dbService';
import { getActiveAdForLocation } from './services/adService';
import { Movie, Ad } from './types';
import { AdBanner } from './components/AdBanner';
import { Pagination } from './components/Pagination';
import { Search, Compass, Tv, Film } from 'lucide-react';

interface SearchPageProps {
  initialQuery: string;
  onNewSearch: (query: string) => void;
  onMovieClick: (movie: Movie) => void;
}

const ITEMS_PER_PAGE = 20;

const SEARCH_CATEGORIES = [
    'Action', 'Sarguzasht', 'Komediya', 'Drama', 'Fantastika', 
    'Romantika', 'Qo\'rqinchli', 'Detektiv', 'Sport', 'Psixologik', 'Triller', 'Musiqiy'
];

export const SearchPage: React.FC<SearchPageProps> = ({ initialQuery, onNewSearch, onMovieClick }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState<boolean>(false);
  const [currentQuery, setCurrentQuery] = useState(initialQuery);
  const [ad, setAd] = useState<Ad | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setMovies([]);
      setSearched(false);
      return;
    }
    setCurrentQuery(query);
    setIsLoading(true);
    setError(null);
    setSearched(true);
    setMovies([]);
    setCurrentPage(1); // Reset page on new search

    try {
      // Use Database Search
      const result = await searchMoviesDB(query);
      setMovies(result);
      if (result.length === 0) {
        setError("Ushbu so'rov bo'yicha animelar topilmadi. Boshqa nomni sinab ko'ring.");
      }
    } catch (err) {
      console.error(err);
      setError('Qidiruvda xatolik yuz berdi.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) {
        performSearch(initialQuery);
    }
  }, [initialQuery, performSearch]);

  useEffect(() => { 
      const fetchAd = async () => {
          const activeAd = await getActiveAdForLocation('search_top');
          setAd(activeAd);
      }
      fetchAd();
  }, []);

  const handleCategoryClick = (category: string) => {
      onNewSearch(category);
      performSearch(category);
  };

  // Pagination Logic
  const totalPages = Math.ceil(movies.length / ITEMS_PER_PAGE);
  const currentMovies = movies.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Sarlavha: Qidiruv */}
      <div className="text-center py-5">
        <h1 className="text-xl font-bold tracking-tight text-white mb-2">Qidiruv</h1>
      </div>

      <div className="max-w-xl mx-auto px-4 mt-2">
        <SearchBar onSearch={performSearch} isLoading={isLoading} />
      </div>
      
      {/* INITIAL STATE: NIMANI QIDIRAMIZ? */}
      {!searched && !isLoading && (
        <div className="max-w-xl mx-auto px-4 flex flex-col items-center justify-center pt-28 pb-12 animate-fade-in text-center">
            
            {/* Chiroyli birlashgan Kamera + Lupa ikonkasi (Rasmga mosravishda) */}
            <div className="relative mb-6 text-white select-none">
                <div className="flex items-center gap-1">
                    {/* Kamera SVG */}
                    <svg className="w-16 h-16 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {/* Lupa SVG */}
                    <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-zinc-900 to-black p-2 border border-zinc-800 rounded-full shadow-lg">
                        <Search className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                </div>
            </div>

            <p className="text-zinc-350 font-medium text-base tracking-wide mt-2">Nimani qidiramiz?</p>
            
            {/* Kategoriyalar ro'yxati (pastda) */}
            <div className="w-full mt-16 text-left">
                <h3 className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest mb-4">Kategoriyalar bo'yicha kashf etish</h3>
                <div className="grid grid-cols-2 gap-2.5">
                    {SEARCH_CATEGORIES.slice(0, 8).map((cat) => (
                        <button
                            key={cat}
                            onClick={() => handleCategoryClick(cat)}
                            className="bg-zinc-950/40 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 rounded-xl py-3 px-4 text-center text-xs font-bold text-zinc-400 hover:text-white transition-all active:scale-95 whitespace-nowrap"
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}
      
      {ad && <AdBanner ad={ad} onClose={() => setAd(null)} />}

      {searched && !isLoading && (
        <div className="text-center mb-6 mt-8">
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                Qidiruv Natijalari
            </h2>
            <p className="text-zinc-400 text-xs mt-1">"{currentQuery}" uchun topilganlar: {movies.length}</p>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center mt-20">
            <LoadingSpinner />
        </div>
      )}

      {error && !isLoading && (
        <div className="text-center text-red-400 bg-red-900/10 border border-red-950/40 p-4.5 rounded-2xl max-w-xl mx-auto mt-12 px-6">
          <p className="text-xs font-semibold leading-relaxed">{error}</p>
        </div>
      )}

      {!isLoading && movies.length > 0 && (
        <div className="max-w-xl mx-auto px-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
                {currentMovies.map((movie) => (
                <MovieCard
                    key={`${movie.title}-${movie.id}-search`}
                    movie={movie}
                    isActive={true}
                    onClick={() => onMovieClick(movie)}
                />
                ))}
            </div>
            <div className="mt-8 pb-12">
                <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    onPageChange={handlePageChange} 
                />
            </div>
        </div>
      )}
    </div>
  );
};
