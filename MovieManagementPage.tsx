
import React, { useState, useEffect } from 'react';
import { Movie } from './types';
import { 
    getAdminAllContent, addMovieToDB, updateMovieInDB, deleteMovieFromDB, 
    uploadPoster, uploadVideo, toggleMovieArchive, deleteFandubProject, updateFandubUpload, approveFandubUpload, rejectFandubUpload 
} from './services/dbService';
import { LoadingSpinner } from './components/LoadingSpinner';
import { EditIcon } from './components/icons/EditIcon';
import { DeleteIcon } from './components/icons/DeleteIcon';
import { PlusIcon } from './components/icons/PlusIcon';
import { AddMovieModal } from './components/AddMovieModal';
import { useNotification } from './hooks/useNotification';
import { Pagination } from './components/Pagination';
import { Mic, CheckCircle, Eye, AlertCircle, Check, X } from 'lucide-react';

const ITEMS_PER_PAGE = 15;

export const MovieManagementPage: React.FC = () => {
    const [content, setContent] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const { addNotification } = useNotification();
    
    const [activeTab, setActiveTab] = useState<'all' | 'official' | 'fandub'>('all');
    const [currentPage, setCurrentPage] = useState(1);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await getAdminAllContent();
            setContent(data);
        } catch (error) {
            addNotification({ type: 'error', title: 'Xatolik', message: 'Ma\'lumotlarni yuklab bo\'lmadi' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSaveMovie = async (data: any) => {
        setIsSaving(true);
        try {
            // AddMovieModal allaqachon fayllarni yuklab, URL-larni beradi
            const finalData = {
                ...data,
                poster_url: data.poster, // AddMovieModal-dan kelgan URL
                video_url: data.videoSource, // AddMovieModal-dan kelgan URL
            };

            if (editingItem?.type === 'fandub') {
                await updateFandubUpload(editingItem.id, {
                    title: data.title,
                    year: data.year,
                    description: data.plot,
                    genre: data.genre,
                    poster_url: data.poster,
                    video_url: data.videoSource,
                    episodes: data.episodes,
                    status: 'approved',
                    is_series: data.is_series,
                    tags: data.tags
                });
                addNotification({ type: 'success', title: 'Yangilandi', message: 'Fandub loyihasi yangilandi.' });
            } else {
                if (data.id) {
                    await updateMovieInDB(data.id, finalData);
                    addNotification({ type: 'success', title: 'Yangilandi', message: 'Anime yangilandi.' });
                } else {
                    await addMovieToDB(finalData);
                    addNotification({ type: 'success', title: 'Qo\'shildi', message: 'Yangi anime qo\'shildi.' });
                }
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: error.message || 'Saqlashda xatolik.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (item: any) => {
        if (!window.confirm(`"${item.title}" ni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.`)) return;

        try {
            if (item.type === 'fandub') {
                await deleteFandubProject(item.id);
            } else {
                await deleteMovieFromDB(item.id);
            }
            addNotification({ type: 'success', title: 'O\'chirildi', message: 'Kontent bazadan olib tashlandi.' });
            fetchData();
        } catch (error: any) {
            addNotification({ type: 'error', title: 'Xatolik', message: 'O\'chirishda xatolik yuz berdi.' });
        }
    };

    const handleApprove = async (id: number) => {
        try {
            await approveFandubUpload(id);
            addNotification({ type: 'success', title: 'Tasdiqlandi', message: 'Loyiha katalogga chiqdi.' });
            fetchData();
        } catch { addNotification({ type: 'error', title: 'Xatolik', message: 'Tasdiqlab bo\'lmadi.' }); }
    };

    const filteredContent = content.filter(item => {
        if (activeTab === 'all') return true;
        return item.type === activeTab;
    });

    const totalPages = Math.ceil(filteredContent.length / ITEMS_PER_PAGE);
    const currentItems = filteredContent.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Yagona Katalog</h1>
                    <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mt-1">Rasmiy va Fan-Dublyaj boshqaruvi</p>
                </div>
                <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-white text-black font-black uppercase text-[10px] tracking-widest px-8 py-4 rounded-2xl shadow-xl hover:scale-105 transition-all">
                    <PlusIcon className="w-5 h-5" /> Yangi Qo'shish
                </button>
            </div>
            
            <div className="flex gap-2 mb-8 bg-[#0a0a0a] p-1.5 rounded-2xl border border-white/5 w-fit">
                {[
                    { id: 'all', label: 'Barchasi' },
                    { id: 'official', label: 'Rasmiy' },
                    { id: 'fandub', label: 'Fan-Dublyaj' },
                ].map(tab => (
                    <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setCurrentPage(1); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-orange-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>
            
            {isLoading ? <div className="flex justify-center py-20"><LoadingSpinner /></div> : (
                <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] overflow-hidden shadow-3xl">
                    <table className="w-full text-left">
                        <thead className="bg-[#111] text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                            <tr>
                                <th className="p-6">Anime / Sarlavha</th>
                                <th className="p-6">Ko'rishlar</th>
                                <th className="p-6">Janr</th>
                                <th className="p-6">Turi</th>
                                <th className="p-6">Holat</th>
                                <th className="p-6 text-right">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {currentItems.map(item => (
                                <tr key={`${item.type}-${item.id}`} className="group hover:bg-white/5 transition-all">
                                    <td className="p-6 flex items-center gap-5">
                                        <img src={item.poster_url || item.posterUrl} className="w-14 h-20 rounded-xl object-cover shadow-2xl border border-white/10" alt="" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[200px]">{item.title}</p>
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase mt-1">{item.year} • {item.translator || 'Anilo'}</p>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2 text-white font-black text-sm">
                                            <Eye size={14} className="text-blue-500"/>
                                            {item.view_count?.toLocaleString() || 0}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase truncate max-w-[100px]">{item.genre || 'Noma\'lum'}</p>
                                    </td>
                                    <td className="p-6">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${item.type === 'official' ? 'bg-blue-600/10 text-blue-400 border-blue-500/20' : 'bg-purple-600/10 text-purple-400 border-purple-500/20'}`}>
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        {item.type === 'fandub' ? (
                                            <div className="flex items-center gap-2">
                                                {item.status === 'pending' ? (
                                                    <span className="flex items-center gap-1 bg-yellow-600/20 text-yellow-500 px-2 py-1 rounded text-[8px] font-black uppercase"> <AlertCircle size={10}/> Kutilmoqda</span>
                                                ) : item.status === 'approved' ? (
                                                    <span className="bg-green-600/20 text-green-500 px-2 py-1 rounded text-[8px] font-black uppercase">Faol</span>
                                                ) : (
                                                    <span className="bg-red-600/20 text-red-500 px-2 py-1 rounded text-[8px] font-black uppercase">Rad etilgan</span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded text-[8px] font-black uppercase">Rasmiy</span>
                                        )}
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            {item.type === 'fandub' && item.status === 'pending' && (
                                                <button onClick={() => handleApprove(item.id)} className="p-3 bg-green-600/10 hover:bg-green-600 text-green-500 hover:text-white rounded-2xl transition-all shadow-xl" title="Tasdiqlash"><Check size={18}/></button>
                                            )}
                                            <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-3 bg-white/5 hover:bg-blue-600 text-zinc-500 hover:text-white rounded-2xl transition-all shadow-xl"><EditIcon className="w-5 h-5"/></button>
                                            <button onClick={() => handleDelete(item)} className="p-3 bg-white/5 hover:bg-red-600 text-zinc-500 hover:text-white rounded-2xl transition-all shadow-xl"><DeleteIcon className="w-5 h-5"/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="p-8 border-t border-white/5 bg-[#0d0d0d]">
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                </div>
            )}

            {isModalOpen && (
                <AddMovieModal 
                    initialData={editingItem}
                    onClose={() => !isSaving && setIsModalOpen(false)}
                    onSave={handleSaveMovie}
                    isSaving={isSaving}
                />
            )}
        </div>
    );
};
