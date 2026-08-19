
import React, { useState, useEffect } from 'react';
import { Episode, Movie } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { PlusIcon } from './icons/PlusIcon';
import { DeleteIcon } from './icons/DeleteIcon';
import { CheckIcon } from './icons/CheckIcon';
import { uploadToCodeUsta, uploadPoster } from '../services/dbService';

interface AddMovieModalProps {
  onClose: () => void;
  onSave: (movieData: any) => void;
  initialData?: Movie | null; // For editing
  isSaving?: boolean;
}

const InputField: React.FC<{label: string, id: string, type?: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, disabled?: boolean, placeholder?: string}> = ({ label, id, type = 'text', value, onChange, disabled, placeholder }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
        <input 
            id={id}
            type={type} 
            value={value}
            onChange={onChange}
            required={id !== 'tags' && id !== 'translator'} // Tags and Translator optional
            disabled={disabled}
            placeholder={placeholder}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none text-white disabled:opacity-50"
        />
    </div>
);

// Predefined Genres List
const GENRE_OPTIONS = [
    { id: 'Action', label: 'Jangari (Action)' },
    { id: 'Adventure', label: 'Sarguzasht' },
    { id: 'Comedy', label: 'Komediya' },
    { id: 'Drama', label: 'Drama' },
    { id: 'Fantasy', label: 'Fantastika' },
    { id: 'Romance', label: 'Romantika' },
    { id: 'Sci-Fi', label: 'Ilmiy-fantastik' },
    { id: 'Horror', label: 'Qo\'rqinchli' },
    { id: 'Mystery', label: 'Detektiv' },
    { id: 'Supernatural', label: 'G\'ayritabiiy' },
    { id: 'Sports', label: 'Sport' },
    { id: 'Slice of Life', label: 'Hayotiy' },
    { id: 'Psychological', label: 'Psixologik' },
    { id: 'Thriller', label: 'Triller' }
];

export const AddMovieModal: React.FC<AddMovieModalProps> = ({ onClose, onSave, initialData, isSaving: isSavingProp = false }) => {
    const [title, setTitle] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());
    const [plot, setPlot] = useState('');
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [tags, setTags] = useState('');
    const [translator, setTranslator] = useState('');
    const [poster, setPoster] = useState<string | File>('');
    const [posterType, setPosterType] = useState<'url' | 'file'>('url');
    const [is_series, setIsSeries] = useState(false);
    const [episodes, setEpisodes] = useState<Partial<Episode>[]>([{ title: '1-qism', sourceType: 'url', source: '' }]);
    const [videoSourceType, setVideoSourceType] = useState<'url' | 'file'>('url');
    const [videoSource, setVideoSource] = useState<string | File>('');
    const [status, setStatus] = useState<'ongoing' | 'completed'>('completed');
    const [accessType, setAccessType] = useState<'free' | 'premium'>('free');
    
    const [isSaving, setIsSaving] = useState(isSavingProp);
    const [posterProgress, setPosterProgress] = useState<number | null>(null);
    const [videoProgress, setVideoProgress] = useState<number | null>(null);
    const [posterUrl, setPosterUrl] = useState('');
    const [videoUrl, setVideoUrl] = useState('');

    useEffect(() => {
        setIsSaving(isSavingProp);
    }, [isSavingProp]);

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setYear(initialData.year);
            setPlot(initialData.plot);
            setTags(initialData.tags || '');
            setTranslator(initialData.translator || '');
            
            if (initialData.genre) {
                const genres = initialData.genre.split(',').map(g => g.trim()).filter(Boolean);
                setSelectedGenres(genres);
            }

            const pUrl = initialData.poster_url || initialData.posterUrl || '';
            setPoster(pUrl);
            setPosterUrl(pUrl);
            setPosterType('url');
            
            const vUrl = initialData.video_url || initialData.videoUrl || '';
            if (vUrl) {
                setVideoSource(vUrl);
                setVideoUrl(vUrl);
                setVideoSourceType('url');
            }
            
            if (initialData.status) setStatus(initialData.status);
            if (initialData.access_type) setAccessType(initialData.access_type);
            if (initialData.is_series !== undefined) setIsSeries(initialData.is_series);
        }
    }, [initialData]);

    const handlePosterFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setPosterProgress(0);
        try {
            const { url } = await uploadPoster(file, (p) => setPosterProgress(p));
            setPosterUrl(url);
            setPoster(url);
            setPosterProgress(null);
        } catch (error) {
            alert("Poster yuklashda xatolik: " + (error as Error).message);
            setPosterProgress(null);
        }
    };

    const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setVideoProgress(0);
        try {
            const { url } = await uploadToCodeUsta(file, (p) => setVideoProgress(p));
            setVideoUrl(url);
            setVideoSource(url);
            setVideoProgress(null);
        } catch (error) {
            alert("Video yuklashda xatolik: " + (error as Error).message);
            setVideoProgress(null);
        }
    };

    const toggleGenre = (genreId: string) => {
        if (isSaving) return;
        setSelectedGenres(prev => {
            if (prev.includes(genreId)) {
                return prev.filter(g => g !== genreId);
            } else {
                return [...prev, genreId];
            }
        });
    };

    const handleEpisodeChange = (index: number, field: keyof Episode, value: any) => {
        const newEpisodes = [...episodes];
        newEpisodes[index] = { ...newEpisodes[index], [field]: value };
        setEpisodes(newEpisodes);
    };

    const addEpisode = () => {
        setEpisodes([...episodes, { title: `${episodes.length + 1}-qism`, sourceType: 'url', source: '' }]);
    };
    
    const removeEpisode = (index: number) => {
        setEpisodes(episodes.filter((_, i) => i !== index));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (posterProgress !== null || videoProgress !== null) {
            alert("Iltimos, fayllar yuklanib bo'lishini kuting!");
            return;
        }

        const finalGenreString = selectedGenres.join(', ');

        const movieData = {
            id: initialData?.id,
            title,
            year,
            plot,
            genre: finalGenreString,
            tags,
            translator,
            poster: posterType === 'file' ? posterUrl : poster,
            poster_id: initialData?.poster_id,
            posterType,
            is_series,
            status,
            access_type: accessType,
            videoSource: !is_series ? (videoSourceType === 'file' ? videoUrl : videoSource) : undefined,
            video_id: !is_series ? initialData?.video_id : undefined,
            videoSourceType: !is_series ? videoSourceType : undefined,
            episodes: is_series ? episodes : []
        };
        onSave(movieData);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={!isSaving ? onClose : undefined}>
            <div className="bg-gray-900 border border-orange-500/30 rounded-lg shadow-xl w-full max-w-2xl m-4 relative max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-gray-800">
                    <h2 className="text-2xl font-bold text-orange-500">{initialData ? 'Animeni Tahrirlash' : 'Yangi Anime Qo\'shish'}</h2>
                    {!isSaving && (
                        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors" aria-label="Yopish">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    )}
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Nomi" id="title" value={title} onChange={e => setTitle(e.target.value)} disabled={isSaving} />
                        <InputField label="Yili" id="year" type="number" value={year} onChange={e => setYear(Number(e.target.value))} disabled={isSaving} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Holati</label>
                            <select 
                                value={status} 
                                onChange={(e) => setStatus(e.target.value as 'ongoing' | 'completed')}
                                disabled={isSaving}
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none text-white"
                            >
                                <option value="completed">Tugallangan</option>
                                <option value="ongoing">Davom etmoqda (Ongoing)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Kirish turi (Access)</label>
                            <select 
                                value={accessType} 
                                onChange={(e) => setAccessType(e.target.value as 'free' | 'premium')}
                                disabled={isSaving}
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none text-white font-bold"
                            >
                                <option value="free" className="text-green-400">BEPUL (Hamma ko'radi)</option>
                                <option value="premium" className="text-yellow-400">PREMIUM (Faqat obunachilar)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Janrlar (Bir nechtasini tanlang)</label>
                        <div className="flex flex-wrap gap-2 bg-gray-800/50 p-3 rounded-md border border-gray-700">
                            {GENRE_OPTIONS.map((option) => {
                                const isSelected = selectedGenres.includes(option.id);
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => toggleGenre(option.id)}
                                        disabled={isSaving}
                                        className={`text-xs sm:text-sm px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 ${
                                            isSelected 
                                                ? 'bg-orange-600 text-white border-orange-500 shadow-lg shadow-orange-500/20' 
                                                : 'bg-gray-800 text-gray-400 border-gray-600 hover:border-gray-400 hover:text-white'
                                        }`}
                                    >
                                        {option.label}
                                        {isSelected && <CheckIcon className="w-3 h-3 sm:w-4 sm:h-4" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    
                    <InputField 
                        label="Qo'shimcha qidiruv so'zlari (Tags)" 
                        id="tags" 
                        value={tags} 
                        onChange={e => setTags(e.target.value)} 
                        disabled={isSaving}
                        placeholder="Masalan: Aniblativ, Ninja, Boruto otasi, Vampir..." 
                    />

                     <InputField 
                        label="Tarjimon (Translator)" 
                        id="translator" 
                        value={translator} 
                        onChange={e => setTranslator(e.target.value)} 
                        disabled={isSaving}
                        placeholder="Masalan: Anilo.uz, Davronbek, yoki studiya nomi" 
                    />

                    <div>
                        <label htmlFor="plot" className="block text-sm font-medium text-gray-300 mb-2">Qisqacha mazmuni</label>
                        <textarea id="plot" value={plot} onChange={e => setPlot(e.target.value)} disabled={isSaving} rows={3} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none text-white disabled:opacity-50"></textarea>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Poster Rasmi</label>
                        <div className="flex gap-4 mb-2">
                           <label className="flex items-center gap-2 text-gray-300"><input type="radio" name="posterType" checked={posterType === 'url'} onChange={() => setPosterType('url')} disabled={isSaving} className="accent-orange-500" /> URL</label>
                           <label className="flex items-center gap-2 text-gray-300"><input type="radio" name="posterType" checked={posterType === 'file'} onChange={() => setPosterType('file')} disabled={isSaving} className="accent-orange-500" /> Fayl yuklash</label>
                        </div>
                        {posterType === 'url' ? (
                            <input type="text" placeholder="https://..." value={poster as string} onChange={e => setPoster(e.target.value)} disabled={isSaving} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none text-white disabled:opacity-50" />
                        ) : (
                            <div className="space-y-2">
                                <input type="file" accept="image/*" onChange={handlePosterFileChange} disabled={isSaving || posterProgress !== null} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-600/20 file:text-orange-400 hover:file:bg-orange-600/30 disabled:opacity-50" />
                                {posterProgress !== null && (
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div className="bg-orange-600 h-2 rounded-full transition-all duration-300" style={{ width: `${posterProgress}%` }}></div>
                                        <p className="text-[10px] text-orange-400 mt-1">Yuklanmoqda: {posterProgress}%</p>
                                    </div>
                                )}
                                {posterUrl && <p className="text-[10px] text-green-400">Yuklandi: {posterUrl}</p>}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
                        <input id="is_series" type="checkbox" checked={is_series} onChange={e => setIsSeries(e.target.checked)} disabled={isSaving} className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-orange-600 focus:ring-orange-500 disabled:opacity-50" />
                        <label htmlFor="is_series" className="text-sm text-gray-300">Bu serialmi?</label>
                    </div>

                    {!is_series && (
                        <div className="pt-4">
                            <h3 className="text-lg font-semibold text-white mb-2">Anime Video Manbasi</h3>
                             <div>
                                <div className="flex gap-4 mb-2">
                                   <label className="flex items-center gap-2 text-gray-300"><input type="radio" name="videoSourceType" checked={videoSourceType === 'url'} onChange={() => setVideoSourceType('url')} disabled={isSaving} className="accent-orange-500" /> URL</label>
                                   <label className="flex items-center gap-2 text-gray-300"><input type="radio" name="videoSourceType" checked={videoSourceType === 'file'} onChange={() => setVideoSourceType('file')} disabled={isSaving} className="accent-orange-500" /> Fayl yuklash</label>
                                </div>
                                {videoSourceType === 'url' ? (
                                    <input type="text" placeholder="https://...mp4" value={videoSource as string} onChange={e => setVideoSource(e.target.value)} disabled={isSaving} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none text-white disabled:opacity-50" />
                                ) : (
                                    <div className="space-y-2">
                                        <input type="file" accept="video/*" onChange={handleVideoFileChange} disabled={isSaving || videoProgress !== null} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-600/20 file:text-orange-400 hover:file:bg-orange-600/30 disabled:opacity-50" />
                                        {videoProgress !== null && (
                                            <div className="w-full bg-gray-700 rounded-full h-2">
                                                <div className="bg-orange-600 h-2 rounded-full transition-all duration-300" style={{ width: `${videoProgress}%` }}></div>
                                                <p className="text-[10px] text-orange-400 mt-1">Yuklanmoqda: {videoProgress}%</p>
                                            </div>
                                        )}
                                        {videoUrl && <p className="text-[10px] text-green-400">Yuklandi: {videoUrl}</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {is_series && (
                        <div className="pt-4">
                            <h3 className="text-lg font-semibold text-white mb-2">Qismlar</h3>
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                {episodes.map((ep, index) => (
                                    <div key={index} className="bg-gray-800 p-3 rounded-lg flex flex-col sm:flex-row gap-2 items-start">
                                        <input type="text" placeholder="Qism nomi" value={ep.title || ''} onChange={e => handleEpisodeChange(index, 'title', e.target.value)} disabled={isSaving} className="flex-grow px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-md text-sm text-white disabled:opacity-50" />
                                        <div className="flex-grow w-full sm:w-auto">
                                          <div className="flex gap-2 mb-1 text-xs">
                                             <label className="flex items-center gap-1 text-gray-300"><input type="radio" name={`sourceType-${index}`} checked={ep.sourceType === 'url'} onChange={() => handleEpisodeChange(index, 'sourceType', 'url')} disabled={isSaving} className="accent-orange-500 w-3 h-3" /> URL</label>
                                             <label className="flex items-center gap-1 text-gray-300"><input type="radio" name={`sourceType-${index}`} checked={ep.sourceType === 'file'} onChange={() => handleEpisodeChange(index, 'sourceType', 'file')} disabled={isSaving} className="accent-orange-500 w-3 h-3" /> Fayl</label>
                                          </div>
                                          {ep.sourceType === 'url' ? (
                                              <input type="text" placeholder="https://...mp4" value={ep.source as string || ''} onChange={e => handleEpisodeChange(index, 'source', e.target.value)} disabled={isSaving} className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-md text-sm text-white disabled:opacity-50" />
                                          ) : (
                                              <input type="file" accept="video/mp4" onChange={e => e.target.files && handleEpisodeChange(index, 'source', e.target.files[0])} disabled={isSaving} className="w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange-600/20 file:text-orange-400 hover:file:bg-orange-600/30 disabled:opacity-50" />
                                          )}
                                        </div>
                                        <button type="button" onClick={() => removeEpisode(index)} disabled={isSaving} className="p-1.5 text-red-500 hover:bg-red-500/20 rounded-full self-start sm:self-center disabled:opacity-50">
                                            <DeleteIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={addEpisode} disabled={isSaving} className="mt-3 flex items-center gap-2 text-sm text-orange-400 hover:underline disabled:opacity-50">
                                <PlusIcon className="w-4 h-4" />
                                Qism qo'shish
                            </button>
                        </div>
                    )}
                </form>

                <div className="p-6 border-t border-gray-800 bg-gray-900/50 flex justify-end gap-4">
                    <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md font-semibold transition-colors text-white disabled:opacity-50">Bekor qilish</button>
                    <button 
                        type="submit" 
                        onClick={handleSubmit} 
                        disabled={isSaving || posterProgress !== null || videoProgress !== null}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-md font-semibold transition-colors text-white flex items-center gap-2 disabled:opacity-80"
                    >
                        {isSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                        {isSaving ? 'Saqlanmoqda...' : 'Saqlash'}
                    </button>
                </div>
            </div>
        </div>
    );
};
