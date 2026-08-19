
import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { Plus, Trash2, Film, Image as ImageIcon, Save, CheckCircle, Info, Link, Upload } from 'lucide-react';
import { Episode } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { uploadToCodeUsta, uploadPoster } from '../services/dbService';

interface AddFandubUploadModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
  isUploading: boolean;
  initialData?: any;
}

const GENRE_OPTIONS = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Romance', 'Sci-Fi', 'Horror', 'Isekai', 'Shonen'];

export const AddFandubUploadModal: React.FC<AddFandubUploadModalProps> = ({ onClose, onSave, isUploading: isUploadingProp, initialData }) => {
    const [title, setTitle] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());
    const [genre, setGenre] = useState<string[]>([]);
    const [desc, setDesc] = useState('');
    const [access, setAccess] = useState<'free' | 'premium'>('free');
    const [tags, setTags] = useState('');
    const [is_series, setIsSeries] = useState(true);
    
    const [posterType, setPosterType] = useState<'url' | 'file'>('file');
    const [posterUrl, setPosterUrl] = useState('');
    const [episodes, setEpisodes] = useState<any[]>([{ title: '1-qism', type: 'file', source: '' }]);

    const [isUploading, setIsUploading] = useState(isUploadingProp);
    const [posterProgress, setPosterProgress] = useState<number | null>(null);
    const [episodeProgress, setEpisodeProgress] = useState<{[key: number]: number | null}>({});

    useEffect(() => {
        setIsUploading(isUploadingProp);
    }, [isUploadingProp]);

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setYear(initialData.year);
            setGenre(initialData.genre.split(',').map((g: string) => g.trim()));
            setDesc(initialData.desc);
            setAccess(initialData.access);
            setTags(initialData.tags || '');
            setIsSeries(initialData.is_series !== undefined ? initialData.is_series : true);
            setPosterUrl(initialData.poster_url || initialData.posterUrl || '');
            setPosterType('url');
            setEpisodes(initialData.episodes || []);
        }
    }, [initialData]);

    const handlePosterFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setPosterProgress(0);
        try {
            const { url } = await uploadPoster(file, (p) => setPosterProgress(p));
            setPosterUrl(url);
            setPosterProgress(null);
        } catch (error) {
            alert("Poster yuklashda xatolik: " + (error as Error).message);
            setPosterProgress(null);
        }
    };

    const handleEpisodeFileChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setEpisodeProgress(prev => ({ ...prev, [index]: 0 }));
        try {
            const { url } = await uploadToCodeUsta(file, (p) => {
                setEpisodeProgress(prev => ({ ...prev, [index]: p }));
            });
            handleEpisodeChange(index, 'source', url);
            setEpisodeProgress(prev => ({ ...prev, [index]: null }));
        } catch (error) {
            alert(`${index + 1}-qismni yuklashda xatolik: ` + (error as Error).message);
            setEpisodeProgress(prev => ({ ...prev, [index]: null }));
        }
    };

    const toggleGenre = (g: string) => {
        setGenre(prev => prev.includes(g) ? prev.filter(i => i !== g) : [...prev, g]);
    };

    const handleAddEpisode = () => {
        setEpisodes([...episodes, { title: `${episodes.length + 1}-qism`, type: 'file', source: '' }]);
    };

    const handleEpisodeChange = (index: number, field: string, value: any) => {
        const newEps = [...episodes];
        newEps[index][field] = value;
        setEpisodes(newEps);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (genre.length === 0) return alert("Kamida bitta janr tanlang");
        
        const isAnyEpisodeUploading = Object.values(episodeProgress).some(p => p !== null);
        if (posterProgress !== null || isAnyEpisodeUploading) {
            alert("Iltimos, barcha fayllar yuklanib bo'lishini kuting!");
            return;
        }

        onSave({
            id: initialData?.id,
            title, year, genre: genre.join(', '), desc, access, tags, is_series,
            poster_url: posterUrl,
            episodes
        });
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => !isUploading && onClose()}></div>
            <form onSubmit={handleSubmit} className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-5xl rounded-[3rem] p-8 md:p-12 overflow-y-auto max-h-[90vh] animate-slide-in-up custom-scrollbar">
                <div className="flex justify-between items-center mb-10">
                    <h2 className="text-4xl font-black uppercase tracking-tighter text-white">{initialData ? 'Loyihani Tahrirlash' : 'Yangi Loyiha Yuklash'}</h2>
                    <button type="button" onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors"><CloseIcon className="w-8 h-8"/></button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Anime Sarlavhasi</label>
                            <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-purple-600" required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Chiqarilgan Yili</label>
                                <input type="number" value={year} onChange={e=>setYear(Number(e.target.value))} className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-5 text-white font-bold" required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Kirish Turi</label>
                                <select value={access} onChange={e=>setAccess(e.target.value as any)} className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-5 text-white font-bold appearance-none">
                                    <option value="free">BEPUL</option>
                                    <option value="premium">PREMIUM</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Janrlar</label>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {GENRE_OPTIONS.map(g => (
                                    <button key={g} type="button" onClick={()=>toggleGenre(g)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${genre.includes(g) ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>{g}</button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Poster (400x600)</label>
                            <div className="flex gap-2 p-1 bg-zinc-900 rounded-xl w-fit">
                                <button type="button" onClick={()=>setPosterType('file')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 ${posterType==='file' ? 'bg-purple-600 text-white' : 'text-zinc-500'}`}><Upload size={14}/> Fayl</button>
                                <button type="button" onClick={()=>setPosterType('url')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 ${posterType==='url' ? 'bg-purple-600 text-white' : 'text-zinc-500'}`}><Link size={14}/> Link</button>
                            </div>
                            
                            {posterType === 'file' ? (
                                <div className="relative border-2 border-dashed border-zinc-800 rounded-3xl p-10 flex flex-col items-center justify-center hover:border-purple-600/50 transition-all cursor-pointer">
                                    {posterUrl ? <img src={posterUrl} className="absolute inset-0 w-full h-full object-cover rounded-3xl opacity-40" /> : <ImageIcon size={40} className="text-zinc-700" />}
                                    <span className="text-[10px] font-black uppercase text-zinc-500 mt-2">{posterProgress !== null ? `Yuklanmoqda: ${posterProgress}%` : (posterUrl ? 'Poster yuklandi' : 'Poster yuklang')}</span>
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handlePosterFileChange} accept="image/*" disabled={posterProgress !== null} />
                                    {posterProgress !== null && (
                                        <div className="absolute bottom-4 left-4 right-4 bg-zinc-800 h-1 rounded-full overflow-hidden">
                                            <div className="bg-purple-600 h-full transition-all duration-300" style={{ width: `${posterProgress}%` }}></div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <input value={posterUrl} onChange={e=>setPosterUrl(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-5 text-white text-xs" placeholder="https://image-url.com/poster.jpg" />
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Qisqacha Tavsif</label>
                            <textarea value={desc} onChange={e=>setDesc(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-5 text-white text-sm h-32 resize-none outline-none focus:border-purple-600" />
                        </div>

                        <div className="flex items-center gap-2 pt-2 ml-4">
                            <input id="is_series" type="checkbox" checked={is_series} onChange={e => setIsSeries(e.target.checked)} className="h-4 w-4 rounded border-zinc-800 bg-zinc-900 text-purple-600 focus:ring-purple-500" />
                            <label htmlFor="is_series" className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Bu serialmi?</label>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-black uppercase text-zinc-400">Epizodlar (Video yuklash)</h3>
                            <button type="button" onClick={handleAddEpisode} className="text-purple-500 text-[10px] font-black uppercase hover:underline">+ Qism Qo'shish</button>
                        </div>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {episodes.map((ep, idx) => (
                                <div key={idx} className="bg-zinc-900/50 border border-white/5 p-5 rounded-3xl space-y-4 relative group">
                                    <div className="flex justify-between items-center">
                                        <input value={ep.title} onChange={e=>handleEpisodeChange(idx, 'title', e.target.value)} className="bg-transparent border-b border-zinc-800 text-white font-black text-sm outline-none w-2/3" placeholder="Qism nomi"/>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={()=>handleEpisodeChange(idx, 'type', 'file')} className={`p-2 rounded-lg ${ep.type==='file' ? 'bg-purple-600 text-white' : 'bg-black text-zinc-600'}`}><Upload size={14}/></button>
                                            <button type="button" onClick={()=>handleEpisodeChange(idx, 'type', 'url')} className={`p-2 rounded-lg ${ep.type==='url' ? 'bg-purple-600 text-white' : 'bg-black text-zinc-600'}`}><Link size={14}/></button>
                                            <button type="button" onClick={()=>setEpisodes(episodes.filter((_, i) => i !== idx))} className="p-2 text-zinc-700 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                                        </div>
                                    </div>
                                    
                                    {ep.type === 'file' ? (
                                        <div className="relative h-20 border-2 border-dashed border-zinc-800 rounded-2xl flex items-center justify-center bg-black/20 hover:border-purple-600/30 transition-all cursor-pointer">
                                            <Film size={20} className="text-zinc-800 mr-2"/>
                                            <span className="text-[9px] font-black uppercase text-zinc-600 truncate max-w-[150px]">
                                                {episodeProgress[idx] !== undefined && episodeProgress[idx] !== null ? `Yuklanmoqda: ${episodeProgress[idx]}%` : (ep.source ? 'Video yuklandi' : 'MP4/MKV Yuklash')}
                                            </span>
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleEpisodeFileChange(idx, e)} disabled={episodeProgress[idx] !== undefined && episodeProgress[idx] !== null} />
                                            {episodeProgress[idx] !== undefined && episodeProgress[idx] !== null && (
                                                <div className="absolute bottom-2 left-4 right-4 bg-zinc-800 h-1 rounded-full overflow-hidden">
                                                    <div className="bg-purple-600 h-full transition-all duration-300" style={{ width: `${episodeProgress[idx]}%` }}></div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <input value={ep.source as string || ''} onChange={e=>handleEpisodeChange(idx, 'source', e.target.value)} className="w-full bg-black/40 border border-zinc-800 rounded-xl p-3 text-[10px] text-zinc-400 font-mono" placeholder="Direct MP4/HLS URL..." />
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2 pt-6">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Teglar (Tags)</label>
                            <input value={tags} onChange={e=>setTags(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-5 text-white text-xs" placeholder="ninja, boruto, sarguzasht..." />
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex gap-4 pt-8 border-t border-white/5">
                    <button type="button" onClick={onClose} disabled={isUploading} className="flex-1 py-5 bg-zinc-900 text-zinc-500 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all">Bekor qilish</button>
                    <button type="submit" disabled={isUploading || posterProgress !== null || Object.values(episodeProgress).some(p => p !== null)} className="flex-1 py-5 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                        {isUploading ? <LoadingSpinner /> : <><Save size={18}/> {initialData ? 'O\'zgarishlarni saqlash' : 'Moderatsiyaga yuborish'}</>}
                    </button>
                </div>
            </form>
        </div>
    );
};
