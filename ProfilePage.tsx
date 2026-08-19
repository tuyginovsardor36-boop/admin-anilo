
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from './services/supabaseClient';
import { getUserProfile, getUserHistory, updateUserProfile, uploadAvatar, uploadBanner } from './services/dbService';
import { UserProfile, Movie, UserRole } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';
import { VerifiedBadge } from './components/VerifiedBadge';
import { 
    Phone, Info, AtSign, Calendar, Edit2, Camera, 
    ArrowLeft, MoreVertical, Check, Clock, Wallet, Truck, 
    ChevronRight, Briefcase, AlertCircle
} from 'lucide-react';
import { Page } from './App';

interface ProfilePageProps {
    viewUserId?: string | null;
    onMainNavigate?: (page: Page) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ viewUserId, onMainNavigate }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<Movie[]>([]);
  const { addNotification } = useNotification();

  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  
  const [editForm, setEditForm] = useState({ 
      full_name: '', 
      username: '', 
      phone: '', 
      bio: '' 
  });
  
  const [activeTab, setActiveTab] = useState<'history' | 'saved'>('history');
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadData(); }, [viewUserId]);

  const loadData = async () => {
    try {
      let targetUserId = viewUserId;
      if (!targetUserId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) targetUserId = user.id;
      }

      if (targetUserId) {
        const profileData = await getUserProfile(targetUserId);
        setProfile(profileData as UserProfile);
        
        // Check if user is live
        const { data: liveData } = await supabase
            .from('live_streams')
            .select('id')
            .eq('streamer_id', targetUserId)
            .eq('status', 'live')
            .maybeSingle();
        setIsLive(!!liveData);

        setEditForm({
            full_name: profileData?.full_name || '',
            username: profileData?.username || '',
            phone: profileData?.phone || '',
            bio: profileData?.bio || '',
        });

        const historyData = await getUserHistory(targetUserId);
        setHistory(historyData);
      }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
      if (!profile) return;
      if (!editForm.full_name.trim()) return addNotification({ type: 'warning', title: 'Xatolik', message: 'Ism kiritish shart' });

      setLoading(true);
      try {
          await updateUserProfile(profile.id, editForm);
          setProfile({ ...profile, ...editForm });
          setIsEditing(false);
          addNotification({ type: 'success', title: 'Saqlandi', message: 'Profil yangilandi.' });
      } catch (error: any) {
          addNotification({ type: 'error', title: 'Xatolik', message: error.message });
      } finally { setLoading(false); }
  };

  const handleApplyCourier = async () => {
      if (!profile) return;
      try {
          await updateUserProfile(profile.id, { role: 'courier_applicant' as UserRole });
          setProfile({ ...profile, role: 'courier_applicant' });
          addNotification({ type: 'success', title: 'Ariza yuborildi', message: 'Kuryerlik arizangiz 24 soat ichida ko\'rib chiqiladi.' });
      } catch (e) { console.error(e); }
  };

  const hasBannerPermission = () => {
      if (!profile) return false;
      const allowedRoles = ['premium', 'admin', 'owner', 'fandub'];
      const hasSub = profile.subscription_end_at && new Date(profile.subscription_end_at) > new Date();
      return allowedRoles.includes(profile.role) || hasSub;
  };

  const handleBannerClick = () => {
      if (!isEditing && viewUserId) return;
      if (viewUserId) return;

      if (hasBannerPermission()) {
          bannerInputRef.current?.click();
      } else {
          if (window.confirm("Banner o'rnatish uchun Premium obuna kerak. Hoziroq xarid qilasizmi?")) {
              onMainNavigate?.('shop'); 
          }
      }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !profile) return;

      setIsUploadingBanner(true);
      try {
          const publicUrl = await uploadBanner(file);
          await updateUserProfile(profile.id, { banner_url: publicUrl });
          setProfile({ ...profile, banner_url: publicUrl });
          addNotification({ type: 'success', title: 'Banner Yangilandi', message: 'Profil ko\'rinishi o\'zgardi.' });
      } catch (error: any) {
          addNotification({ type: 'error', title: 'Xatolik', message: error.message });
      } finally {
          setIsUploadingBanner(false);
          if (bannerInputRef.current) bannerInputRef.current.value = '';
      }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !profile) return;

      setIsUploadingAvatar(true);
      try {
          const publicUrl = await uploadAvatar(file);
          await updateUserProfile(profile.id, { avatar_url: publicUrl });
          setProfile({ ...profile, avatar_url: publicUrl });
          addNotification({ type: 'success', title: 'Rasm Yangilandi', message: 'Profil rasmi o\'zgardi.' });
          document.dispatchEvent(new Event('profileUpdated'));
      } catch (error: any) {
          addNotification({ type: 'error', title: 'Xatolik', message: error.message });
      } finally {
          setIsUploadingAvatar(false);
          if (avatarInputRef.current) avatarInputRef.current.value = '';
      }
  };

  if (loading && !profile) return <div className="flex justify-center py-20 bg-[#050505] min-h-screen"><LoadingSpinner /></div>;

  const isMyProfile = !viewUserId;

  return (
    <div className="min-h-screen pb-20 animate-fade-in font-sans bg-[#050505] text-gray-200">
      
      <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
      <input type="file" ref={bannerInputRef} onChange={handleBannerUpload} accept="image/*" className="hidden" />

      {/* HEADER */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pt-20 pb-4 pointer-events-none">
          <button onClick={() => onMainNavigate && onMainNavigate('dashboard')} className="p-2.5 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all pointer-events-auto border border-white/10 shadow-lg">
              <ArrowLeft size={22} />
          </button>
          
          <div className="flex gap-3 pointer-events-auto">
              {isMyProfile && (
                  isEditing ? (
                      <button onClick={handleSave} className="p-2.5 bg-orange-600 rounded-full text-white hover:bg-orange-500 transition-all shadow-lg shadow-orange-600/30">
                          <Check size={22} />
                      </button>
                  ) : (
                      <button onClick={() => setIsEditing(true)} className="p-2.5 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all border border-white/10 shadow-lg">
                          <Edit2 size={20} />
                      </button>
                  )
              )}
          </div>
      </div>

      {/* BANNER */}
      <div className="relative h-64 w-full bg-zinc-900 group overflow-hidden">
          {profile?.banner_url ? (
              <img src={profile.banner_url} alt="Cover" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-700" />
          ) : (
              <div className="w-full h-full bg-gradient-to-b from-zinc-800 to-[#050505] flex items-center justify-center">
                  <div className="w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
              </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/30"></div>
          {isMyProfile && (
              <button onClick={handleBannerClick} disabled={isUploadingBanner} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/50 p-4 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm border border-white/20 hover:scale-110 pointer-events-auto">
                  {isUploadingBanner ? <LoadingSpinner /> : <Camera size={24} />}
              </button>
          )}
      </div>

      {/* AVATAR & NAME */}
      <div className="px-4 -mt-16 relative z-10 flex flex-col items-center">
          <div className="relative group cursor-pointer" onClick={() => isMyProfile && avatarInputRef.current?.click()}>
              <div className={`w-32 h-32 rounded-full p-1 bg-[#050505] shadow-2xl transition-all duration-500 ${isLive ? 'ring-4 ring-red-600 ring-offset-4 ring-offset-[#050505]' : ''}`}>
                  <div className="w-full h-full rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-800 relative">
                      {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500 font-black text-4xl">{profile?.full_name?.charAt(0) || 'U'}</div>
                      )}
                      {isUploadingAvatar && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><LoadingSpinner /></div>}
                      {isMyProfile && <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"><Camera className="text-white w-8 h-8" /></div>}
                  </div>
              </div>
              
              {isLive && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg animate-pulse border-2 border-[#050505] whitespace-nowrap">
                      JONLI EFIR
                  </div>
              )}
          </div>

          <div className="mt-3 text-center w-full">
              {isEditing ? (
                  <input type="text" value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} className="bg-transparent border-b border-orange-500 text-center text-2xl font-black text-white w-full outline-none pb-1 placeholder-zinc-600" placeholder="Ism Familiya" autoFocus />
              ) : (
                  <h1 className="text-2xl font-black text-white flex items-center justify-center gap-2 uppercase tracking-tight">
                      {profile?.full_name || 'Foydalanuvchi'}
                      {(['admin', 'owner', 'premium'].includes(profile?.role || '')) && <VerifiedBadge type="gold" className="w-5 h-5" />}
                  </h1>
              )}
              <p className="text-gray-400 text-sm mt-1 font-medium">{profile?.is_online ? <span className="text-green-500 font-bold uppercase text-[10px]">online</span> : 'yaqinda kirgan'}</p>
          </div>
      </div>

      {/* --- KURYERLIK HUDUDI (Yangi) --- */}
      {isMyProfile && (
          <div className="px-4 mt-8">
              <div className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/20 rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Truck size={80} /></div>
                  <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-blue-600 rounded-xl text-white"><Briefcase size={20}/></div>
                          <h3 className="text-lg font-black uppercase text-white tracking-tight">Hamkorlik: Kuryerlik</h3>
                      </div>
                      
                      {profile?.role === 'courier' ? (
                          <div className="space-y-4">
                              <p className="text-sm text-blue-200">Siz bizning rasmiy kuryerimizsiz. Buyurtmalarni boshqarish uchun dashboard-ga o'ting.</p>
                              <button onClick={() => onMainNavigate?.('dashboard')} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                                  BUYURTMALAR PANELI <ChevronRight size={16}/>
                              </button>
                          </div>
                      ) : profile?.role === 'courier_applicant' ? (
                          <div className="flex items-center gap-3 bg-yellow-500/10 p-4 rounded-2xl border border-yellow-500/20">
                              <AlertCircle className="text-yellow-500 shrink-0" size={20}/>
                              <p className="text-xs text-yellow-500 font-bold">ARIZANGIZ KO'RIB CHIQILMOQDA. Yaqin orada siz bilan bog'lanamiz.</p>
                          </div>
                      ) : (
                          <div className="space-y-4">
                              <p className="text-sm text-zinc-400">Anilo Store mahsulotlarini yetkazib berish orqali daromad topmoqchimisiz?</p>
                              <button onClick={handleApplyCourier} className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 hover:text-white transition-all active:scale-95 shadow-lg">
                                  Kuryerlikka ariza berish
                              </button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* INFO LIST */}
      <div className="px-4 mt-6">
          <div className="bg-[#121212] border border-white/5 rounded-3xl overflow-hidden">
              <div className="flex items-start p-5 border-b border-white/5 hover:bg-white/5 transition-colors">
                  <div className="mr-5 text-zinc-500 mt-1"><Info size={22} /></div>
                  <div className="flex-1">
                      {isEditing ? (
                          <textarea value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-base outline-none focus:border-orange-500 resize-none h-20" placeholder="O'zingiz haqingizda (Bio)..." />
                      ) : (
                          <p className="text-white text-base leading-relaxed whitespace-pre-wrap font-medium">{profile?.bio || "Ma'lumot kiritilmagan."}</p>
                      )}
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">Haqida (Bio)</p>
                  </div>
              </div>

              <div className="flex items-center p-5 border-b border-white/5 hover:bg-white/5 transition-colors">
                  <div className="mr-5 text-zinc-500"><Phone size={22} /></div>
                  <div className="flex-1">
                      {isEditing ? (
                          <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="bg-transparent text-white text-base w-full outline-none border-b border-orange-500" placeholder="+998 90 123 45 67" />
                      ) : (
                          <p className="text-blue-400 text-base font-medium font-mono">{profile?.phone || 'Kiritilmagan'}</p>
                      )}
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">Mobil raqam</p>
                  </div>
              </div>

              <div className="flex items-center p-5 hover:bg-white/5 transition-colors">
                  <div className="mr-5 text-zinc-500"><AtSign size={22} /></div>
                  <div className="flex-1">
                      {isEditing ? (
                          <input type="text" value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} className="bg-transparent text-white text-base w-full outline-none border-b border-orange-500" placeholder="username" />
                      ) : (
                          <p className="text-blue-400 text-base font-medium">@{profile?.username || 'username'}</p>
                      )}
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">Foydalanuvchi nomi</p>
                  </div>
              </div>
          </div>
      </div>

      {/* TABS */}
      <div className="mt-8">
          <div className="flex border-b border-white/10 bg-[#050505] sticky top-16 z-20">
              <button onClick={() => setActiveTab('history')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-center relative transition-colors ${activeTab === 'history' ? 'text-orange-500' : 'text-zinc-500 hover:text-white'}`}>
                  Ko'rilganlar {activeTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>}
              </button>
              <button onClick={() => setActiveTab('saved')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-center relative transition-colors ${activeTab === 'saved' ? 'text-orange-500' : 'text-zinc-500 hover:text-white'}`}>
                  Moliya {activeTab === 'saved' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>}
              </button>
          </div>

          <div className="min-h-[200px] bg-[#050505]">
              {activeTab === 'history' && (
                  <div className="grid grid-cols-3 gap-0.5">
                      {history.map(movie => (
                          <div key={movie.id} className="aspect-[2/3] relative bg-zinc-900 cursor-pointer group overflow-hidden">
                              <img src={movie.poster_url || movie.posterUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-70 group-hover:opacity-100" alt="" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                              <div className="absolute bottom-0 left-0 right-0 p-2">
                                  <span className="text-[9px] text-white font-black uppercase tracking-wider line-clamp-1 drop-shadow-md">{movie.title}</span>
                              </div>
                          </div>
                      ))}
                      {history.length === 0 && (
                          <div className="col-span-3 py-20 flex flex-col items-center text-zinc-600">
                              <Clock size={48} className="mb-4 opacity-50"/>
                              <p className="text-xs font-bold uppercase tracking-widest">Tarix bo'sh</p>
                          </div>
                      )}
                  </div>
              )}

              {activeTab === 'saved' && (
                  <div className="p-6">
                      <div className="bg-gradient-to-br from-zinc-900 to-black rounded-[2rem] p-8 text-white shadow-2xl border border-white/10 relative overflow-hidden mb-6">
                          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.3em] mb-2">Asosiy Balans</p>
                          <h2 className="text-4xl font-black tracking-tight">{(profile?.balance || 0).toLocaleString()} <span className="text-lg text-orange-500 font-bold">UZS</span></h2>
                      </div>
                      <button onClick={() => onMainNavigate?.('dashboard')} className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-zinc-200 transition-all active:scale-95">
                          <Wallet size={18} /> Hisobni to'ldirish
                      </button>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
