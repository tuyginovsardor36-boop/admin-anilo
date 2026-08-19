import React, { useState, useEffect } from 'react';
import { Mic, Grid, Play, Users, Star, Settings, Plus, BarChart3, Edit3, Image as ImageIcon } from 'lucide-react';
import { supabase } from './services/supabaseClient';
import { getUserProfile, getMovies } from './services/dbService';
import { UserProfile, Movie } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';

export const DubDashboard: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [myMovies, setMyMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'grid' | 'stats'>('grid');

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const p = await getUserProfile(user.id);
                setProfile(p as UserProfile);
                
                const allMovies = await getMovies();
                // Filter movies dubbed by this user (mock filter by translator name/id)
                const filtered = allMovies.filter(m => m.translator === p?.full_name || m.translator_id === user.id);
                setMyMovies(filtered);
            }
            setIsLoading(false);
        };
        init();
    }, []);

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#050505]"><LoadingSpinner /></div>;
    if (!profile) return null;

    return (
        <div className="max-w-4xl mx-auto px-4 pt-10 pb-32 animate-fade-in">
            {/* PROFILE HEADER - IG STYLE */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-10 mb-12">
                <div className="relative group">
                    <div className="w-32 h-32 md:w-44 md:h-44 rounded-full p-1 bg-gradient-to-tr from-orange-600 via-purple-600 to-blue-600">
                        <div className="w-full h-full rounded-full bg-[#050505] p-1">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                            ) : (
                                <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center"><Mic className="text-zinc-700" size={48}/></div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center md:items-start">
                    <div className="flex flex-col md:flex-row items-center gap-5 mb-6 w-full">
                        <h2 className="text-2xl font-light text-white tracking-wide">@{profile.username}</h2>
                        <div className="flex gap-2">
                            <button className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm rounded-lg transition-all">
                                Profilni tahrirlash
                            </button>
                            <button className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white">
                                <Settings size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-8 mb-6">
                        <div className="text-center md:text-left">
                            <span className="block font-black text-white text-lg">{myMovies.length}</span>
                            <span className="text-sm text-zinc-500 uppercase tracking-widest font-bold">Loyihalar</span>
                        </div>
                        <div className="text-center md:text-left">
                            <span className="block font-black text-white text-lg">{profile.fans_count || 0}</span>
                            <span className="text-sm text-zinc-500 uppercase tracking-widest font-bold">Muxlislar</span>
                        </div>
                        <div className="text-center md:text-left">
                            <span className="block font-black text-white text-lg">4.9</span>
                            <span className="text-sm text-zinc-500 uppercase tracking-widest font-bold">Reyting</span>
                        </div>
                    </div>

                    <div className="text-center md:text-left space-y-2">
                        <p className="font-black text-white uppercase tracking-tighter text-sm">{profile.full_name}</p>
                        <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
                            {profile.bio || "O'zbek tilidagi eng sara animelarni professional dublyaj qilaman. Studio: Aniblativ."}
                        </p>
                        <a href="#" className="text-blue-400 text-sm font-bold hover:underline">t.me/aniblativ_studio</a>
                    </div>
                </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 border-t border-white/5 pt-8">
                <button className="flex flex-col items-center justify-center p-4 bg-zinc-900 hover:bg-orange-600 transition-all rounded-2xl gap-3 group">
                    <Plus size={24} className="text-zinc-500 group-hover:text-white" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white">Loyiha qo'shish</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 bg-zinc-900 hover:bg-blue-600 transition-all rounded-2xl gap-3 group">
                    <BarChart3 size={24} className="text-zinc-500 group-hover:text-white" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white">Statistika</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 bg-zinc-900 hover:bg-purple-600 transition-all rounded-2xl gap-3 group">
                    <ImageIcon size={24} className="text-zinc-500 group-hover:text-white" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white">Bannerlar</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 bg-zinc-900 hover:bg-zinc-800 transition-all rounded-2xl gap-3 group">
                    <Edit3 size={24} className="text-zinc-500 group-hover:text-white" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white">Status</span>
                </button>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex justify-center border-t border-white/10 mb-8">
                <div className="flex gap-16">
                    <button 
                        onClick={() => setActiveTab('grid')}
                        className={`flex items-center gap-2 pt-4 border-t-2 transition-all ${activeTab === 'grid' ? 'border-white text-white' : 'border-transparent text-zinc-500'}`}
                    >
                        <Grid size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">LOYIHALAR</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('stats')}
                        className={`flex items-center gap-2 pt-4 border-t-2 transition-all ${activeTab === 'stats' ? 'border-white text-white' : 'border-transparent text-zinc-500'}`}
                    >
                        <Play size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">TOMOSHALAR</span>
                    </button>
                </div>
            </div>

            {/* PROJECTS GRID */}
            {activeTab === 'grid' && (
                <div className="grid grid-cols-3 gap-1 md:gap-8 animate-fade-in">
                    {myMovies.map(movie => (
                        <div key={movie.id} className="relative group aspect-[2/3] overflow-hidden bg-zinc-900 rounded-sm cursor-pointer">
                            <img src={movie.poster_url || movie.posterUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-4 p-4 text-center">
                                <div className="flex items-center gap-1 font-black text-white">
                                    <Star size={16} fill="white" className="text-orange-500" />
                                    {movie.rating.toFixed(1)}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest line-clamp-2">{movie.title}</span>
                            </div>
                        </div>
                    ))}
                    {myMovies.length === 0 && (
                        <div className="col-span-3 py-32 text-center border-2 border-dashed border-zinc-800 rounded-xl">
                            <Mic size={48} className="mx-auto text-zinc-800 mb-4" />
                            <p className="text-zinc-600 font-bold uppercase tracking-widest text-sm">Siz ovoz bergan animelar hali yo'q</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'stats' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-zinc-900/50 p-8 rounded-2xl border border-white/5">
                        <h4 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-500 mb-8">Haftalik Tomoshalar</h4>
                        <div className="h-64 flex items-end gap-2 md:gap-4 px-2">
                            {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                                <div key={i} className="flex-1 bg-zinc-800 rounded-t-lg relative group hover:bg-orange-600 transition-all" style={{ height: `${h}%` }}>
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-800 px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{(h * 1234).toLocaleString()} views</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};