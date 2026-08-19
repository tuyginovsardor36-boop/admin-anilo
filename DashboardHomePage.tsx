
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Movie } from './types';
import { getMovies, isMovieSaved, toggleSaveMovie } from './services/dbService';
import { supabase } from './services/supabaseClient';
import { LoadingSpinner } from './components/LoadingSpinner';
import { MovieCard } from './components/MovieCard';
import { Play, Star, TrendingUp, Info, ChevronLeft, ChevronRight, Bookmark, Plus, Moon } from 'lucide-react';
import { useNotification } from './hooks/useNotification';
import { Page } from './App';

interface DashboardHomePageProps {
  onSearch: (query: string) => void;
  onMovieClick: (movie: Movie) => void;
  onMainNavigate?: (page: Page) => void;
}

const TITLE_STYLES = [
    "font-sans tracking-tighter", 
    "font-serif tracking-wide italic", 
    "font-mono tracking-tight", 
];

export const DashboardHomePage: React.FC<DashboardHomePageProps> = ({ onMovieClick, onMainNavigate }) => {
    const [allMovies, setAllMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [heroIndex, setHeroIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [isHeroSaved, setIsHeroSaved] = useState(false);
    
    const [scrollY, setScrollY] = useState(0);
    
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const { addNotification } = useNotification();
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        const fetch = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if(user) setUserId(user.id);
            const movies = await getMovies();
            setAllMovies(movies);
            
            // SEO: Inject JSON-LD ItemList for Google Bot to discover movies
            if (movies.length > 0) {
                const schemaList = {
                    "@context": "https://schema.org",
                    "@type": "ItemList",
                    "numberOfItems": movies.length,
                    "itemListElement": movies.slice(0, 50).map((movie, index) => ({
                        "@type": "ListItem",
                        "position": index + 1,
                        "item": {
                            "@type": "Movie",
                            "name": movie.title,
                            "url": `https://anilo.uz/?movie_id=${movie.id}`,
                            "image": movie.posterUrl,
                            "datePublished": movie.year.toString(),
                            "genre": movie.genre,
                            "aggregateRating": {
                                "@type": "AggregateRating",
                                "ratingValue": movie.rating.toFixed(1),
                                "bestRating": "5",
                                "worstRating": "1"
                            }
                        }
                    }))
                };
                
                const scriptId = 'json-ld-catalog';
                let script = document.getElementById(scriptId) as HTMLScriptElement;
                if (!script) {
                    script = document.createElement('script');
                    script.id = scriptId;
                    script.type = 'application/ld+json';
                    document.head.appendChild(script);
                }
                script.text = JSON.stringify(schemaList);
            }

            setIsLoading(false);
        };
        fetch();

        const handleScroll = () => {
            setScrollY(window.scrollY);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            const script = document.getElementById('json-ld-catalog');
            if (script) script.remove();
        };
    }, []);

    const heroMovies = allMovies.slice(0, 6);
    const currentHeroMovie = heroMovies[heroIndex];

    useEffect(() => {
        const checkSaved = async () => {
            if (userId && currentHeroMovie?.id) {
                const saved = await isMovieSaved(userId, currentHeroMovie.id);
                setIsHeroSaved(saved);
            }
        }
        checkSaved();
    }, [userId, currentHeroMovie, heroIndex]);

    const nextHero = useCallback(() => {
        if (heroMovies.length === 0) return;
        setHeroIndex((prev) => (prev + 1) % heroMovies.length);
    }, [heroMovies.length]);

    const prevHero = useCallback(() => {
        if (heroMovies.length === 0) return;
        setHeroIndex((prev) => (prev - 1 + heroMovies.length) % heroMovies.length);
    }, [heroMovies.length]);

    useEffect(() => {
        if (isAutoPlaying && heroMovies.length > 0) {
            timerRef.current = window.setInterval(nextHero, 7000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isAutoPlaying, nextHero, heroMovies.length]);

    const handleManualNav = (direction: 'next' | 'prev') => {
        setIsAutoPlaying(false);
        if (direction === 'next') nextHero();
        else prevHero();
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    const handleHeroSave = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!userId || !currentHeroMovie?.id) {
            addNotification({type: 'warning', title: 'Kirish kerak', message: 'Saqlash uchun tizimga kiring.'});
            return;
        }
        const newState = await toggleSaveMovie(userId, currentHeroMovie.id);
        setIsHeroSaved(newState);
        addNotification({
            type: 'success', 
            title: newState ? 'Saqlandi' : 'O\'chirildi',
            message: newState ? 'Anime saqlanganlarga qo\'shildi' : 'Anime saqlanganlardan olib tashlandi'
        });
    };

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe) {
            handleManualNav('next');
        }
        if (isRightSwipe) {
            handleManualNav('prev');
        }
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#050505]"><LoadingSpinner /></div>;

    return (
        <div className="pb-32 bg-[#050505] animate-fade-in">
            
            {/* HERO CAROUSEL */}
            <div 
                className="relative w-full h-[80vh] md:h-[850px] group overflow-hidden mb-10 shadow-2xl -mt-20"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <div 
                    className="flex h-full transition-transform duration-700 ease-in-out"
                    style={{ transform: `translateX(-${heroIndex * 100}%)` }}
                >
                    {heroMovies.map((movie, idx) => (
                        <div key={movie.id} className="relative w-full h-full flex-shrink-0 overflow-hidden">
                            <div 
                                className="absolute inset-0 w-full h-full"
                                style={{ 
                                    transform: `translateY(${scrollY * 0.5}px) scale(1.1)`,
                                    transition: 'transform 0.1s linear'
                                }}
                            >
                                <img 
                                    src={movie.poster_url || movie.posterUrl} 
                                    className={`w-full h-full object-cover transition-transform duration-[10000ms] ${heroIndex === idx ? 'scale-110' : 'scale-100'}`} 
                                    alt="" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent"></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent"></div>
                            </div>

                            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-16 lg:p-24 pb-20 md:pb-32 z-20">
                                <div className={`transition-all duration-700 transform ${heroIndex === idx ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                                    
                                    <div className="flex flex-wrap items-center gap-3 mb-4 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
                                        <span className="bg-orange-600 text-white text-[10px] font-black px-3 py-1 rounded uppercase tracking-widest shadow-lg shadow-orange-600/40">
                                            YANGI
                                        </span>
                                        {movie.access_type === 'premium' && (
                                            <span className="bg-yellow-500 text-black text-[10px] font-black px-3 py-1 rounded uppercase tracking-widest shadow-lg">
                                                PREMIUM
                                            </span>
                                        )}
                                        <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-2 py-1 rounded border border-white/20">
                                            <Star size={12} className="text-yellow-400 fill-yellow-400"/>
                                            <span className="text-white font-bold text-xs">{movie.rating.toFixed(1)}</span>
                                        </div>
                                        <span className="text-gray-300 text-xs font-bold uppercase tracking-wider border border-white/20 px-2 py-1 rounded">
                                            {movie.genre.split(',')[0]}
                                        </span>
                                    </div>
                                    
                                    <h1 className={`text-4xl md:text-7xl lg:text-8xl font-black text-white mb-4 uppercase leading-[0.9] drop-shadow-2xl max-w-4xl animate-slide-in-up ${TITLE_STYLES[idx % TITLE_STYLES.length]}`} style={{ animationDelay: '0.2s' }}>
                                        {movie.title}
                                    </h1>
                                    
                                    <p className="text-gray-200 text-sm md:text-lg mb-8 max-w-xl line-clamp-3 font-medium leading-relaxed drop-shadow-md animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
                                        {movie.plot}
                                    </p>

                                    <div className="flex flex-row items-center gap-3 animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
                                        <button 
                                            onClick={() => onMovieClick(movie)}
                                            className="flex-1 sm:flex-none h-14 px-8 bg-white text-black hover:bg-orange-600 hover:text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95 group"
                                        >
                                            <Play fill="currentColor" size={20} className="group-hover:scale-110 transition-transform"/> 
                                            <span className="whitespace-nowrap">Ko'rish</span>
                                        </button>
                                        
                                        <button 
                                            onClick={() => onMovieClick(movie)}
                                            className="flex-1 sm:flex-none h-14 px-8 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                                        >
                                            <Info size={20} />
                                            <span className="whitespace-nowrap">Batafsil</span>
                                        </button>
                                        
                                        <button 
                                            onClick={handleHeroSave}
                                            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-90 border ${isHeroSaved ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-600/40' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
                                        >
                                            {isHeroSaved ? <Bookmark size={22} fill="currentColor" /> : <Plus size={24} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30">
                    {heroMovies.map((_, i) => (
                        <button 
                            key={i} 
                            onClick={() => { setHeroIndex(i); setIsAutoPlaying(false); }} 
                            className={`transition-all duration-500 rounded-full ${i === heroIndex ? 'w-8 h-2 bg-orange-500 shadow-lg shadow-orange-500/50' : 'w-2 h-2 bg-white/40 hover:bg-white/80'}`}
                        ></button>
                    ))}
                </div>
            </div>

            {/* CATEGORIES SECTION */}
            <div className="container mx-auto px-4 md:px-8 space-y-16 pb-20">
                {/* 1. YANGI QO'SHILGANLAR */}
                <div>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                <span className="w-1.5 h-8 bg-orange-600 rounded-full"></span>
                                Yangi Qo'shilganlar
                            </h2>
                            <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-1 ml-5">Katalogdagi eng so'nggi yangiliklar</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10">
                        {allMovies.slice(0, 12).map(movie => (
                            <MovieCard key={movie.id} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                        ))}
                    </div>
                </div>

                {/* 2. ANIMELAR */}
                {(() => {
                    const isAnime = (m: Movie) => {
                        const combined = `${m.genre} ${m.tags || ''}`.toLowerCase();
                        return combined.includes('anime') || 
                               (!combined.includes('film') && !combined.includes('kino') && !combined.includes('dorama') && !combined.includes('kdrama') && !combined.includes('k-drama') && !combined.includes('multfilm') && !combined.includes('cartoon') && !combined.includes('mulfm') && !combined.includes('kdramma') && !combined.includes('kdorram'));
                    };
                    const animeList = allMovies.filter(isAnime);
                    return (
                        <div>
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                        <span className="w-1.5 h-8 bg-purple-600 rounded-full"></span>
                                        Animelar
                                    </h2>
                                    <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-1 ml-5 font-mono">Barcha sevimli anime serial va filmlar</p>
                                </div>
                            </div>
                            {animeList.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10">
                                    {animeList.map(movie => (
                                        <MovieCard key={movie.id} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center bg-zinc-900/20 border border-dashed border-zinc-800/80 rounded-3xl text-zinc-600 font-bold uppercase tracking-widest text-[9px]">
                                    Hali animelar yuklanmagan
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* 3. FILMLAR */}
                {(() => {
                    const isFilm = (m: Movie) => {
                        const combined = `${m.genre} ${m.tags || ''}`.toLowerCase();
                        return combined.includes('film') || combined.includes('kino') || combined.includes('movie');
                    };
                    const filmList = allMovies.filter(isFilm);
                    return (
                        <div>
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                        <span className="w-1.5 h-8 bg-blue-600 rounded-full"></span>
                                        Tarjima Filmlar (Movies)
                                    </h2>
                                    <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-1 ml-5">Saralangan jahon va o'zbek kinolari</p>
                                </div>
                            </div>
                            {filmList.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10">
                                    {filmList.map(movie => (
                                        <MovieCard key={movie.id} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center bg-zinc-900/20 border border-dashed border-zinc-800/80 rounded-3xl text-zinc-600 font-bold uppercase tracking-widest text-[9px]">
                                    Hali doramalar yoki filmlar yo'q, tez orada yuklanadi!
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* 4. DORAMALAR */}
                {(() => {
                    const isDorama = (m: Movie) => {
                        const combined = `${m.genre} ${m.tags || ''}`.toLowerCase();
                        return combined.includes('dorama') || combined.includes('serial') || combined.includes('doramma');
                    };
                    const doramaList = allMovies.filter(isDorama);
                    return (
                        <div>
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                        <span className="w-1.5 h-8 bg-emerald-600 rounded-full"></span>
                                        Doramalar
                                    </h2>
                                    <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-1 ml-5">Mashhur osiyo serial va doramalari</p>
                                </div>
                            </div>
                            {doramaList.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10">
                                    {doramaList.map(movie => (
                                        <MovieCard key={movie.id} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center bg-zinc-900/20 border border-dashed border-zinc-800/80 rounded-3xl text-zinc-600 font-bold uppercase tracking-widest text-[9px]">
                                    Doramalar bo'limi hozircha bo'sh. Tez orada qo'shiladi!
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* 5. MULTFILMLAR */}
                {(() => {
                    const isMultfilm = (m: Movie) => {
                        const combined = `${m.genre} ${m.tags || ''}`.toLowerCase();
                        return combined.includes('multfilm') || combined.includes('cartoon') || combined.includes('mulfm') || combined.includes('multflm');
                    };
                    const multfilmList = allMovies.filter(isMultfilm);
                    return (
                        <div>
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                        <span className="w-1.5 h-8 bg-pink-600 rounded-full"></span>
                                        Multfilmlar
                                    </h2>
                                    <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-1 ml-5">Eng sara multfilm va animatsion asarlar</p>
                                </div>
                            </div>
                            {multfilmList.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10">
                                    {multfilmList.map(movie => (
                                        <MovieCard key={movie.id} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center bg-zinc-900/20 border border-dashed border-zinc-800/80 rounded-3xl text-zinc-600 font-bold uppercase tracking-widest text-[9px]">
                                    Multfilmlar yaqin kunlarda qo'shiladi!
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* 6. K-DRAMALAR */}
                {(() => {
                    const isKdrama = (m: Movie) => {
                        const combined = `${m.genre} ${m.tags || ''}`.toLowerCase();
                        return combined.includes('kdrama') || combined.includes('k-drama') || combined.includes('kdramma') || combined.includes('kdorram');
                    };
                    const kdramaList = allMovies.filter(isKdrama);
                    return (
                        <div>
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                        <span className="w-1.5 h-8 bg-red-600 rounded-full"></span>
                                        K-Doramalar (Korean Kdrama)
                                    </h2>
                                    <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-1 ml-5">Koreya k-dramalari o'zbek tilida</p>
                                </div>
                            </div>
                            {kdramaList.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10">
                                    {kdramaList.map(movie => (
                                        <MovieCard key={movie.id} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center bg-zinc-900/20 border border-dashed border-zinc-800/80 rounded-3xl text-zinc-600 font-bold uppercase tracking-widest text-[9px]">
                                    Kdramalar yaqin kunlarda efirga uzatiladi!
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};
