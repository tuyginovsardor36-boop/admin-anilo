
import React, { useState, useEffect } from 'react';
import { getMovies } from './services/dbService';
import { Movie } from './types';
import { MovieCard } from './components/MovieCard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Search, Filter, SlidersHorizontal, Zap } from 'lucide-react';

interface CatalogPageProps {
    onMovieClick: (movie: Movie) => void;
}

const GENRES = [
    'Barchasi', 'Action', 'Sarguzasht', 'Komediya', 'Drama', 'Fantastika', 
    'Romantika', 'Qo\'rqinchli', 'Detektiv', 'Sport', 'Psixologik', 'Triller'
];

interface Collection {
    id: string;
    name: string;
    genre: string;
    fallbackImages: string[];
}

const COLLECTIONS_DATA: Collection[] = [
    {
        id: 'goblin',
        name: 'Goblin dublyajda',
        genre: 'Drama',
        fallbackImages: [
            'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=300',
            'https://images.unsplash.com/photo-1541562232579-512a21360020?q=80&w=300',
            'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=300',
        ]
    },
    {
        id: 'space',
        name: 'Kosmosga sayohat',
        genre: 'Fantastika',
        fallbackImages: [
            'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=300',
            'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=300',
            'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=300',
        ]
    },
    {
        id: 'parallel',
        name: 'Parallel olam',
        genre: 'Sarguzasht',
        fallbackImages: [
            'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=300',
            'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=300',
            'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=300',
        ]
    },
    {
        id: 'past_future',
        name: 'O\'tmish va kelajak',
        genre: 'Action',
        fallbackImages: [
            'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=300',
            'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=300',
            'https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=300',
        ]
    },
    {
        id: 'dino',
        name: 'Dinozavrlar haqida',
        genre: 'Sarguzasht',
        fallbackImages: [
            'https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=300',
            'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?q=80&w=300',
            'https://images.unsplash.com/photo-1525857597365-5f6dbff2e36e?q=80&w=300',
        ]
    },
    {
        id: 'robots',
        name: 'Robotlar',
        genre: 'Fantastika',
        fallbackImages: [
            'https://images.unsplash.com/photo-1535378917042-10a22c95931a?q=80&w=300',
            'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=300',
            'https://images.unsplash.com/photo-1589254065878-42c9da997008?q=80&w=300',
        ]
    }
];

export const CatalogPage: React.FC<CatalogPageProps> = ({ onMovieClick }) => {
    const [allMovies, setAllMovies] = useState<Movie[]>([]);
    const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'collections' | 'genres'>('collections');
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('Barchasi');
    const [accessFilter, setAccessFilter] = useState<'all' | 'free' | 'premium'>('all');

    useEffect(() => {
        const loadMovies = async () => {
            try {
                const movies = await getMovies();
                setAllMovies(movies);
                setFilteredMovies(movies);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        loadMovies();
    }, []);

    useEffect(() => {
        let result = allMovies;

        // 1. Search Filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(m => 
                m.title.toLowerCase().includes(q) || 
                m.genre.toLowerCase().includes(q)
            );
        }

        // 2. Genre Filter
        if (selectedGenre !== 'Barchasi') {
            result = result.filter(m => m.genre.toLowerCase().includes(selectedGenre.toLowerCase()));
        }

        // 3. Access Filter
        if (accessFilter !== 'all') {
            result = result.filter(m => m.access_type === accessFilter);
        }

        setFilteredMovies(result);
    }, [searchQuery, selectedGenre, accessFilter, allMovies]);

    // To'plamga bosilganda filtr va janrga yo'naltirish
    const handleCollectionSelect = (collection: Collection) => {
        setSelectedGenre(collection.genre);
        setActiveTab('genres');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Har bir to'plamning rasm stacklarini tozalash
    const getCollectionStackImages = (collection: Collection) => {
        const matches = allMovies.filter(m => m.genre.toLowerCase().includes(collection.genre.toLowerCase()));
        let urls = matches.map(m => m.poster_url).filter(Boolean);
        
        const initialLength = urls.length;
        if (initialLength > 0) {
            while (urls.length < 3) {
                urls.push(urls[urls.length % initialLength]);
            }
        } else {
            const otherRealPosters = allMovies.map(m => m.poster_url).filter(Boolean);
            if (otherRealPosters.length > 0) {
                while (urls.length < 3) {
                    urls.push(otherRealPosters[urls.length % otherRealPosters.length]);
                }
            } else {
                while (urls.length < 3) {
                    urls.push(collection.fallbackImages[urls.length] || collection.fallbackImages[0]);
                }
            }
        }
        return urls.slice(0, 3);
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#050505]"><LoadingSpinner /></div>;

    return (
        <div className="min-h-screen bg-[#050505] pb-32 animate-fade-in pt-4">
            
            <div className="container mx-auto px-4 pb-4 pt-6 max-w-xl">
                {/* 2 Ta Yirik Yumaloq Tab Tugmalari (Tepadagi segment) */}
                <div className="flex bg-zinc-950/40 p-1 rounded-2xl border border-zinc-900/60 mb-8">
                    <button 
                        onClick={() => setActiveTab('collections')}
                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === 'collections' 
                            ? 'bg-zinc-900 text-white shadow-md border border-zinc-800/80' 
                            : 'text-zinc-500 hover:text-zinc-350'
                        }`}
                    >
                        To'plam
                    </button>
                    <button 
                        onClick={() => setActiveTab('genres')}
                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === 'genres' 
                            ? 'bg-zinc-900 text-white shadow-md border border-zinc-800/80' 
                            : 'text-zinc-500 hover:text-zinc-350'
                        }`}
                    >
                        Janrlar
                    </button>
                </div>

                {/* TAB 1: TO'PLAM (COLLECTIONS GRID) */}
                {activeTab === 'collections' && (
                    <div className="animate-fade-in">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-12">
                            {COLLECTIONS_DATA.map((col) => {
                                const stack = getCollectionStackImages(col);
                                return (
                                    <div 
                                        key={col.id} 
                                        onClick={() => handleCollectionSelect(col)}
                                        className="group cursor-pointer flex flex-col items-center select-none"
                                    >
                                        {/* Stacked Images Container */}
                                        <div className="relative w-full aspect-[3/4] max-w-[145px] flex items-center justify-center mb-5">
                                            {/* Orqa rasm (Chapga og'dirilgan) */}
                                            <div className="absolute w-[80%] h-[90%] rounded-2xl overflow-hidden shadow-md border border-white/5 transform -rotate-12 -translate-x-5 -translate-y-1.5 opacity-60 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-15">
                                                <img src={stack[2]} className="w-full h-full object-cover grayscale-[30%]" referrerPolicy="no-referrer" />
                                            </div>
                                            {/* O'rta rasm (O'ngga og'dirilgan) */}
                                            <div className="absolute w-[85%] h-[95%] rounded-2xl overflow-hidden shadow-lg border border-white/5 transform rotate-12 translate-x-5 -translate-y-1 opacity-75 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-15">
                                                <img src={stack[1]} className="w-full h-full object-cover grayscale-[15%]" referrerPolicy="no-referrer" />
                                            </div>
                                            {/* Markazdagi asosiy rasm (Tekis) */}
                                            <div className="absolute w-[90%] h-[100%] rounded-2xl overflow-hidden shadow-[0_12px_24px_rgba(0,0,0,0.8)] border border-white/10 transform transition-transform duration-300 group-hover:scale-105 z-10">
                                                <img src={stack[0]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                            </div>
                                        </div>

                                        {/* To'plam Nomi (Kapsula shaklidagi taglik) */}
                                        <div className="w-full max-w-[145px] bg-zinc-900 border border-zinc-850 py-2 px-3 rounded-xl text-center shadow-inner transition-colors duration-200 group-hover:border-zinc-700">
                                            <span className="text-[10px] sm:text-xs font-bold text-zinc-300 group-hover:text-white uppercase tracking-tight block truncate">
                                                {col.name}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* TAB 2: JANRLAR (CURRENT KATALOG DESIGN) */}
                {activeTab === 'genres' && (
                    <div className="animate-fade-in">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Saralash</h2>
                            <div className="bg-zinc-900 border border-zinc-850 px-3 py-1 rounded-full text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                                {filteredMovies.length} Anime
                            </div>
                        </div>

                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Anime nomi, janri..."
                                className="w-full bg-zinc-900 border border-zinc-850/80 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold text-white outline-none focus:border-zinc-700 transition-all placeholder:text-zinc-600"
                            />
                        </div>

                        {/* Filter Controls */}
                        <div className="flex flex-col gap-4">
                            {/* Access Type Toggle */}
                            <div className="flex bg-zinc-900 border border-zinc-850/50 p-1 rounded-xl w-full">
                                {[
                                    { id: 'all', label: 'Barchasi' },
                                    { id: 'free', label: 'Bepul', icon: <Zap size={12} className="text-green-400"/> },
                                    { id: 'premium', label: 'Premium', icon: <Zap size={12} className="text-yellow-400"/> },
                                ].map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => setAccessFilter(type.id as any)}
                                        className={`flex-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                                            accessFilter === type.id 
                                            ? 'bg-zinc-800 text-white shadow' 
                                            : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                    >
                                        {type.icon}
                                        {type.label}
                                    </button>
                                ))}
                            </div>

                            {/* Genres (Horizontal Scroll) */}
                            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
                                {GENRES.map(genre => (
                                    <button
                                        key={genre}
                                        onClick={() => setSelectedGenre(genre)}
                                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                                            selectedGenre === genre
                                            ? 'bg-orange-600 text-white border-orange-500 shadow-md'
                                            : 'bg-zinc-900 text-zinc-400 border-zinc-850 hover:border-zinc-700 hover:text-white'
                                        }`}
                                    >
                                        {genre}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="mt-8">
                            {filteredMovies.length === 0 ? (
                                <div className="text-center py-16 border border-dashed border-zinc-850 rounded-2xl">
                                    <Filter size={36} className="mx-auto text-zinc-700 mb-3" />
                                    <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest">Hech narsa topilmadi</p>
                                    <button onClick={() => {setSearchQuery(''); setSelectedGenre('Barchasi'); setAccessFilter('all')}} className="mt-2 text-orange-500 text-xs font-bold hover:underline">Filtrlarni tozalash</button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    {filteredMovies.map(movie => (
                                        <MovieCard key={movie.id} movie={movie} isActive={true} onClick={() => onMovieClick(movie)} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
