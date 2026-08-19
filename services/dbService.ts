
// ... (oldingi importlar o'zgarishsiz qoladi) ...
import { 
    UserProfile, Movie, Episode, FandubChannel, FandubUpload, FandubStory, Ad,
    SocialLink, UserDevice, SupportTicket, TicketMessage, News, Transaction,
    ATCWallet, ATCTransaction, ContestTask, WheelPrize, QuizQuestion, ContestAd,
    ArkWallet, ArkMarketData, ArkAd, ArkQuiz, ArkAutopilotConfig, ArkSchedule,
    ArkWithdrawal, ShopProduct, ShopWallet, ShopOrder, Promocode, Broadcast, PaymentRequestDB,
    FandubPost, PremiumBundle, FandubEarning, FandubWithdrawal, LiveStream, LiveChatMessage
} from '../types';
import { supabase } from './supabaseClient';
import { isAiPilotEnabled, runAiServerManager } from './aiGuardService';
import { getCache, setCache } from './cacheService';

export const normalizeUrl = (url: string): string => {
    if (!url) return '';
    let normalized = url.trim();
    // Support Dropbox share links
    if (normalized.includes('dropbox.com')) {
        if (normalized.includes('dl=0')) {
            normalized = normalized.replace('dl=0', 'raw=1');
        } else if (!normalized.includes('raw=1') && !normalized.includes('dl=1')) {
            if (normalized.includes('?')) {
                normalized += '&raw=1';
            } else {
                normalized += '?raw=1';
            }
        }
    }
    // Support Google Drive share links
    if (normalized.includes('drive.google.com') && normalized.includes('/file/d/')) {
        const parts = normalized.split('/file/d/');
        if (parts.length > 1) {
            const fileId = parts[1].split('/')[0];
            normalized = `https://lh3.googleusercontent.com/d/${fileId}`;
        }
    }
    return normalized;
};

// --- CHAT & MENTIONS & NOTIFICATIONS ---

export const getUserIdByUsername = async (username: string): Promise<string | null> => {
    try {
        const { data } = await supabase.from('profiles').select('id').eq('username', username).maybeSingle();
        return data?.id || null;
    } catch { return null; }
};

export const createNotification = async (userId: string, title: string, message: string, type: string = 'info', data: any = null) => {
    try {
        await supabase.from('notifications').insert({
            user_id: userId,
            title,
            message,
            type,
            data,
            is_read: false,
            created_at: new Date().toISOString()
        });
    } catch (e) { console.error("Notification error:", e); }
};

export const getMovieReviews = async (movieId: number) => {
    try {
        // parent_id bo'yicha bog'langan xabarlarni olish uchun join qo'shamiz
        const { data } = await supabase
            .from('reviews')
            .select(`
                *,
                profiles(full_name, username, avatar_url, role),
                parent:parent_id(comment, profiles(username))
            `)
            .eq('movie_id', movieId)
            .order('created_at', { ascending: true });
        return data || [];
    } catch (e) { return []; }
};

export const addReview = async (movieId: number, userId: string, rating: number, comment: string, parentId: number | null = null) => {
    if (isAiPilotEnabled()) {
        const guardResult = await runAiServerManager(`User Review Submission on Movie ID ${movieId}: "${comment}"`);
        if (guardResult && !guardResult.allowed) throw new Error(`AI Guard: ${guardResult.analysis}`);
    }
    await supabase.from('reviews').insert({ 
        movie_id: movieId, 
        user_id: userId, 
        rating, 
        comment, 
        parent_id: parentId, // Javob berilayotgan xabar IDsi
        created_at: new Date().toISOString() 
    });
};

// ... (qolgan barcha funksiyalar o'zgarishsiz qoladi) ...
export const incrementView = async (movieId: number, isFandub: boolean) => {
    try {
        await supabase.rpc('increment_movie_views', { m_id: movieId, is_fandub: isFandub });
    } catch (e) { console.error("Stats error:", e); }
};

export const getAdminAllContent = async (): Promise<any[]> => {
    try {
        const { data: movies } = await supabase.from('movies').select('*').order('created_at', { ascending: false });
        const { data: fandubs } = await supabase.from('fandub_uploads').select('*, fandub_channels(name)').order('created_at', { ascending: false });
        
        const official = (movies || []).map(m => ({ 
            ...m, 
            type: 'official', 
            posterUrl: normalizeUrl(m.poster_url || m.posterUrl || ''),
            poster_url: normalizeUrl(m.poster_url || m.posterUrl || ''),
            videoUrl: normalizeUrl(m.video_url || m.videoUrl || ''),
            video_url: normalizeUrl(m.video_url || m.videoUrl || ''),
            view_count: m.view_count || 0 
        }));
        
        const community = (fandubs || []).map(f => ({ 
            ...f, 
            type: 'fandub', 
            posterUrl: normalizeUrl(f.poster_url || ''),
            poster_url: normalizeUrl(f.poster_url || ''),
            videoUrl: normalizeUrl(f.video_url || ''),
            video_url: normalizeUrl(f.video_url || ''),
            translator: f.fandub_channels?.name || 'Studio',
            view_count: f.view_count || 0,
            status: f.status 
        }));
        
        return [...official, ...community].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch { return []; }
};

export const deleteFandubChannel = async (id: string) => {
    const { error } = await supabase.from('fandub_channels').delete().eq('id', id);
    if (error) throw error;
};

export const deleteFandubProject = async (id: number) => {
    const { error } = await supabase.from('fandub_uploads').delete().eq('id', id);
    if (error) throw error;
    localStorage.removeItem('anilo_cache_all_movies_catalog');
};

export const updateFandubUpload = async (id: number, updates: any) => {
    const cleanUpdates = { ...updates };
    if (cleanUpdates.poster_url) cleanUpdates.poster_url = normalizeUrl(cleanUpdates.poster_url);
    if (cleanUpdates.video_url) cleanUpdates.video_url = normalizeUrl(cleanUpdates.video_url);
    if (cleanUpdates.episodes && Array.isArray(cleanUpdates.episodes)) {
        cleanUpdates.episodes = cleanUpdates.episodes.map((ep: any) => ({
            ...ep,
            source: normalizeUrl(ep.source || ep.videoSource || '')
        }));
    }
    const { error } = await supabase.from('fandub_uploads').update(cleanUpdates).eq('id', id);
    if (error) throw error;
    localStorage.removeItem('anilo_cache_all_movies_catalog');
};

export const approveFandubUpload = async (id: number) => {
    const { error } = await supabase.from('fandub_uploads').update({ status: 'approved' }).eq('id', id);
    if (error) throw error;
    localStorage.removeItem('anilo_cache_all_movies_catalog');
};

export const rejectFandubUpload = async (id: number) => {
    const { error } = await supabase.from('fandub_uploads').update({ status: 'rejected' }).eq('id', id);
    if (error) throw error;
    localStorage.removeItem('anilo_cache_all_movies_catalog');
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
        if (!userId) return null;
        const cachedProfile = getCache<UserProfile>(`profile_${userId}`);
        if (cachedProfile) return cachedProfile;

        let dbData: any = null;
        let fetchError: any = null;

        try {
            const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
            dbData = data;
            fetchError = error;
        } catch (dbErr) {
            fetchError = dbErr;
        }

        if (dbData) {
            setCache(`profile_${userId}`, dbData, 5); 
            return dbData as UserProfile;
        }

        // If no database data exists or a DB query error occurred, we fall back to meta-data from authentication.
        // This ensures the profile picture and details never disappear due to security or database policy restrictions.
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.id === userId) {
                const localPart = user.email ? user.email.split('@')[0] : 'user';
                const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                const fallbackProfile: UserProfile = {
                    id: userId,
                    email: user.email || '',
                    full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Foydalanuvchi',
                    username: user.user_metadata?.username || `${localPart}_${randomSuffix}`,
                    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
                    role: user.email === 'tuyginovsardor@gmail.com' ? 'owner' : 'user', // Ensure the main admin is mapped to owner
                    balance: 0,
                    phone: null,
                    short_id: Math.random().toString(36).substring(2, 8).toUpperCase(),
                    email_notifications: true,
                    push_notifications: true,
                    language: 'uz',
                    created_at: new Date().toISOString(),
                    subscription_plan: null,
                    subscription_end_at: null,
                    free_trial_started_at: null
                };

                // Try to persist it in the database if there was no structural database error,
                // but if insert fails, we still return the fallback profile gracefully.
                if (!dbData && !fetchError) {
                    try {
                        const { data: inserted, error: insertError } = await supabase
                            .from('profiles')
                            .insert(fallbackProfile)
                            .select()
                            .single();
                        if (!insertError && inserted) {
                            setCache(`profile_${userId}`, inserted, 5);
                            return inserted as UserProfile;
                        }
                    } catch (err) {
                        console.error("Auto Profile Creation Exception:", err);
                    }
                }

                setCache(`profile_${userId}`, fallbackProfile, 5);
                return fallbackProfile;
            }
        } catch (metaErr) {
            console.error("Auth User Metadata Failure:", metaErr);
        }

        return null;
    } catch (e) {
        return null;
    }
};

export const getUserByEmail = async (email: string): Promise<UserProfile | null> => {
    try {
        const { data } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
        return data as UserProfile;
    } catch (e) { return null; }
};

export const getUserSessions = async (userId: string): Promise<UserDevice[]> => {
    try {
        const { data } = await supabase.from('user_devices').select('*').eq('user_id', userId).order('last_active', { ascending: false });
        return (data || []) as UserDevice[];
    } catch (e) { return []; }
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
    try {
        if (isAiPilotEnabled()) {
            const guardResult = await runAiServerManager(`User Profile Update: ${JSON.stringify(updates)}`);
            if (guardResult && !guardResult.allowed) throw new Error(`AI Guard: ${guardResult.analysis}`);
        }
        const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
        if (error) throw error;
        localStorage.removeItem(`anilo_cache_profile_${userId}`);
    } catch (e) { throw e; }
};

export const getMovies = async (): Promise<Movie[]> => {
    try {
        const cachedMovies = getCache<Movie[]>('all_movies_catalog');
        if (cachedMovies) return cachedMovies;
        const getOfficial = async () => {
            const { data, error } = await supabase.from('movies').select('*').eq('is_archived', false).order('created_at', { ascending: false });
            if (error) return [];
            return (data || []).map(m => ({ 
                ...m, 
                poster_url: normalizeUrl(m.poster_url || m.posterUrl || ''),
                posterUrl: normalizeUrl(m.poster_url || m.posterUrl || ''),
                video_url: normalizeUrl(m.video_url || m.videoUrl || ''),
                videoUrl: normalizeUrl(m.video_url || m.videoUrl || ''),
                is_fandub: false,
                view_count: m.view_count || 0
            }));
        };
        const getFandub = async () => {
            try {
                const { data, error } = await supabase.from('fandub_uploads').select('*, fandub_channels(name)').eq('status', 'approved').order('created_at', { ascending: false });
                if (error) return [];
                return (data || []).map(m => ({
                    id: m.id,
                    title: m.title,
                    year: m.year,
                    plot: m.description,
                    poster_url: normalizeUrl(m.poster_url || ''),
                    posterUrl: normalizeUrl(m.poster_url || ''),
                    video_url: normalizeUrl(m.video_url || ''),
                    videoUrl: normalizeUrl(m.video_url || ''),
                    genre: m.genre,
                    language: 'JP/UZ',
                    quality: 'HD',
                    rating: 5.0,
                    is_fandub: true,
                    channel_id: m.channel_id,
                    translator: m.fandub_channels?.name || 'Fandub',
                    status: 'completed',
                    access_type: m.access_type,
                    created_at: m.created_at,
                    is_blocked: m.is_blocked || false,
                    view_count: m.view_count || 0
                }));
            } catch { return []; }
        };
        const [official, fandub] = await Promise.all([getOfficial(), getFandub()]);
        const mergedMovies = [...official, ...fandub]
            .filter(m => !m.is_blocked)
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        if (mergedMovies.length > 0) setCache('all_movies_catalog', mergedMovies, 60);
        return mergedMovies;
    } catch (e) { return []; }
};

export const getMovieEpisodes = async (movieId: number): Promise<Episode[]> => {
    try {
        const { data: fandubMovie } = await supabase.from('fandub_uploads').select('episodes').eq('id', movieId).maybeSingle();
        if (fandubMovie && fandubMovie.episodes) return fandubMovie.episodes as Episode[];
        const { data } = await supabase.from('episodes').select('*').eq('movie_id', movieId).order('id', { ascending: true });
        return data || [];
    } catch (e) { return []; }
};

const checkIsAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Siz tizimga kirmagansiz.");
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || !['admin', 'owner'].includes(profile.role)) {
        throw new Error("Sizda ushbu adminlik huquqi yo'q.");
    }
};

export const addMovieToDB = async (movieData: any) => {
    await checkIsAdmin();
    const { episodes, ...rest } = movieData;
    
    const cleanMovie = {
        title: rest.title,
        year: Number(rest.year),
        plot: rest.plot || '',
        poster_url: normalizeUrl(rest.poster_url || rest.poster || rest.posterUrl || ''),
        video_url: normalizeUrl(rest.video_url || rest.videoSource || rest.videoUrl || ''),
        genre: rest.genre || '',
        tags: rest.tags || '',
        translator: rest.translator || '',
        is_series: rest.is_series ?? false,
        status: rest.status || 'completed',
        access_type: rest.access_type || 'free',
        language: rest.language || 'UZ',
        quality: rest.quality || 'HD',
        rating: rest.rating ? Number(rest.rating) : 5.0,
        is_archived: rest.is_archived ?? false,
        view_count: rest.view_count || 0
    };

    const { data, error } = await supabase.from('movies').insert(cleanMovie).select().single();
    if (error) {
        console.error("Error inserting movie:", error);
        throw error;
    }

    if (cleanMovie.is_series && episodes && Array.isArray(episodes) && episodes.length > 0) {
        const episodesToInsert = episodes.map((ep: any, idx: number) => ({
            movie_id: data.id,
            title: ep.title || `${idx + 1}-qism`,
            source: normalizeUrl(ep.source || ep.videoSource || ''),
        }));
        const { error: epError } = await supabase.from('episodes').insert(episodesToInsert);
        if (epError) console.error("Error inserting episodes:", epError);
    }

    localStorage.removeItem('anilo_cache_all_movies_catalog');
    return data as Movie;
};

export const updateMovieInDB = async (id: number, movieData: any) => {
    await checkIsAdmin();
    const { episodes, ...rest } = movieData;

    const cleanMovie = {
        title: rest.title,
        year: Number(rest.year),
        plot: rest.plot || '',
        poster_url: normalizeUrl(rest.poster_url || rest.poster || rest.posterUrl || ''),
        video_url: normalizeUrl(rest.video_url || rest.videoSource || rest.videoUrl || ''),
        genre: rest.genre || '',
        tags: rest.tags || '',
        translator: rest.translator || '',
        is_series: rest.is_series ?? false,
        status: rest.status || 'completed',
        access_type: rest.access_type || 'free',
        language: rest.language || 'UZ',
        quality: rest.quality || 'HD',
        rating: rest.rating ? Number(rest.rating) : 5.0,
        is_archived: rest.is_archived ?? false
    };

    const { error } = await supabase.from('movies').update(cleanMovie).eq('id', id);
    if (error) {
        console.error("Error updating movie:", error);
        throw error;
    }

    if (cleanMovie.is_series && episodes && Array.isArray(episodes)) {
        await supabase.from('episodes').delete().eq('movie_id', id);
        if (episodes.length > 0) {
            const episodesToInsert = episodes.map((ep: any, idx: number) => ({
                movie_id: id,
                title: ep.title || `${idx + 1}-qism`,
                source: normalizeUrl(ep.source || ep.videoSource || ''),
            }));
            const { error: epError } = await supabase.from('episodes').insert(episodesToInsert);
            if (epError) console.error("Error inserting episodes on update:", epError);
        }
    }

    localStorage.removeItem('anilo_cache_all_movies_catalog');
};

export const deleteMovieFromDB = async (id: number) => {
    await checkIsAdmin();
    const { error } = await supabase.from('movies').delete().eq('id', id);
    if (error) throw error;
    localStorage.removeItem('anilo_cache_all_movies_catalog');
};

export const toggleMovieArchive = async (id: number, isArchived: boolean) => {
    await checkIsAdmin();
    const { error } = await supabase.from('movies').update({ is_archived: isArchived }).eq('id', id);
    if (error) throw error;
    localStorage.removeItem('anilo_cache_all_movies_catalog');
};

export const getPremiumBundles = async (): Promise<PremiumBundle[]> => {
    try {
        const { data } = await supabase.from('premium_bundles').select('*').order('created_at', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const savePremiumBundle = async (bundle: Partial<PremiumBundle>) => {
    const { id, ...data } = bundle;
    if (id) await supabase.from('premium_bundles').update(data).eq('id', id);
    else await supabase.from('premium_bundles').insert(data);
};

export const deletePremiumBundle = async (id: number) => {
    await supabase.from('premium_bundles').delete().eq('id', id);
};

export const toggleBlockFandub = async (id: number, block: boolean) => {
    await supabase.from('fandub_uploads').update({ is_blocked: block }).eq('id', id);
    localStorage.removeItem('anilo_cache_all_movies_catalog');
};

export const deleteFandubUpload = async (id: number) => {
    await supabase.from('fandub_uploads').delete().eq('id', id);
    localStorage.removeItem('anilo_cache_all_movies_catalog');
};

export const createFandubChannel = async (channel: Partial<FandubChannel>) => {
    await supabase.from('fandub_channels').insert(channel);
};

export const updateFandubChannel = async (id: string, updates: Partial<FandubChannel>) => {
    await supabase.from('fandub_channels').update(updates).eq('id', id);
};

export const createFandubStory = async (story: Partial<FandubStory>) => {
    await supabase.from('fandub_stories').insert(story);
};

export const getFandubPosts = async (channelId: string): Promise<FandubPost[]> => {
    try {
        const { data } = await supabase.from('fandub_posts').select('*').eq('channel_id', channelId).order('created_at', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const createFandubPost = async (post: Partial<FandubPost>) => {
    await supabase.from('fandub_posts').insert(post);
};

export const deleteFandubPost = async (id: number) => {
    await supabase.from('fandub_posts').delete().eq('id', id);
};

export const getUserNotifications = async (userId: string) => {
    try {
        const { data } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
        return data || [];
    } catch (e) { return []; }
};

export const markNotificationsRead = async (userId: string) => {
    try {
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
    } catch (e) {}
};

export const uploadToCodeUsta = async (
    file: File, 
    onProgress?: (percent: number) => void
): Promise<{ url: string; id: string }> => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        // O'zimizning proxy serverimizga murojaat qilamiz
        const uploadUrl = '/api/upload';
        
        xhr.open('POST', uploadUrl);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && onProgress) {
                const percent = Math.round((event.loaded / event.total) * 100);
                onProgress(percent);
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    // TechMentor /f/{id} formatida qaytaradi
                    const apiUrl = import.meta.env.VITE_CODEUSTA_API_URL || 'https://api.techmentor.uz';
                    resolve({
                        url: data.url || `${apiUrl.replace(/\/$/, '')}/f/${data.id}`,
                        id: data.id
                    });
                } catch (e) {
                    reject(new Error('Javobni o\'qib bo\'lmadi'));
                }
            } else {
                try {
                    const errorData = JSON.parse(xhr.responseText);
                    reject(new Error(errorData.error || `Server xatosi (${xhr.status})`));
                } catch (e) {
                    reject(new Error(`Server xatosi (${xhr.status})`));
                }
            }
        };

        xhr.onerror = () => reject(new Error('Tarmoq xatosi (Proxy bilan bog\'lanib bo\'lmadi)'));

        const formData = new FormData();
        formData.append('file', file);
        
        xhr.send(formData);
    });
};

export const uploadFile = async (file: File, bucket: string): Promise<string> => {
    const { url } = await uploadFileWithId(file, bucket);
    return url;
};

export const uploadFileWithId = async (file: File, bucket: string): Promise<{ url: string; id: string }> => {
    // For videos, use CodeUsta
    if (bucket === 'videos') {
        return await uploadToCodeUsta(file);
    }

    // Fallback to Supabase for other buckets (avatars, anilos3, etc.)
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2,9)}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
        contentType: file.type || 'image/jpeg',
        cacheControl: '3600',
        upsert: false
    });
    if (error) throw error;
    const url = supabase.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
    return { url, id: fileName }; // For Supabase, we use the filename as ID
};

export const uploadPoster = async (
    file: File, 
    onProgress?: (percent: number) => void
): Promise<{ url: string; id: string }> => {
    if (onProgress) onProgress(10);
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `poster_${Date.now()}_${Math.random().toString(36).substr(2,9)}.${ext}`;
    if (onProgress) onProgress(30);
    const { error } = await supabase.storage.from('anilos3').upload(fileName, file, {
        contentType: file.type || 'image/jpeg',
        cacheControl: '3600',
        upsert: false
    });
    if (error) {
        console.error("Poster upload to anilos3 error:", error);
        throw error;
    }
    if (onProgress) onProgress(90);
    const url = supabase.storage.from('anilos3').getPublicUrl(fileName).data.publicUrl;
    if (onProgress) onProgress(100);
    return { url, id: fileName };
};

export const uploadVideo = (file: File) => uploadFileWithId(file, 'videos');
export const uploadAvatar = (file: File) => uploadFile(file, 'avatars');
export const uploadBanner = (file: File) => uploadFile(file, 'anilos3');

export const getFandubChannels = async (userId?: string): Promise<FandubChannel[]> => {
    try {
        const { data } = await supabase.from('fandub_channels').select('*').order('subscriber_count', { ascending: false });
        if (userId && data) {
            const { data: follows } = await supabase.from('fandub_follows').select('channel_id').eq('user_id', userId);
            const followedIds = new Set((follows || []).map(f => f.channel_id));
            return data.map(ch => ({ ...ch, is_following: followedIds.has(ch.id) }));
        }
        return data || [];
    } catch (e) { return []; }
};

export const getFandubChannel = async (userId: string): Promise<FandubChannel | null> => {
    try {
        const { data = null } = await supabase.from('fandub_channels').select('*').eq('user_id', userId).maybeSingle();
        return data as FandubChannel;
    } catch (e) { return null; }
};

export const getFandubUploads = async (userId: string): Promise<FandubUpload[]> => {
    try {
        const { data = [] } = await supabase.from('fandub_uploads').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const getPendingFandubUploads = async (): Promise<FandubUpload[]> => {
    try {
        const { data } = await supabase.from('fandub_uploads').select('*, fandub_channels(name)').eq('status', 'pending').order('created_at', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const getAppConfig = async () => {
    try {
        const { data } = await supabase.from('app_config').select('*');
        const config: Record<string, string> = {};
        (data || []).forEach(item => { config[item.key] = item.value; });
        return config;
    } catch (e) { return {}; }
};

export const updateAppConfig = async (key: string, value: string) => {
    await supabase.from('app_config').upsert({ key, value });
};

export const getDashboardStats = async () => {
    try {
        const { data } = await supabase.rpc('get_dashboard_stats');
        return data;
    } catch (e) { return null; }
};

export const getUnreadNotificationsCount = async (userId: string) => {
    try {
        const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false);
        return count || 0;
    } catch (e) { return 0; }
};

export const getAdminNotificationCounts = async () => {
    try {
        const { data } = await supabase.rpc('get_admin_counts');
        return { financials: data?.payment_pending || 0, support: data?.tickets_open || 0, fandub: data?.fandub_pending || 0 };
    } catch (e) { return { financials: 0, support: 0, fandub: 0 }; }
};

export const toggleFollowChannel = async (userId: string, channelId: string) => {
    try {
        const { data: existing } = await supabase.from('fandub_follows').select('id').eq('user_id', userId).eq('channel_id', channelId).maybeSingle();
        if (existing) {
            await supabase.from('fandub_follows').delete().eq('id', existing.id);
            await supabase.rpc('increment_subscribers', { ch_id: channelId, amt: -1 });
            return false;
        } else {
            await supabase.from('fandub_follows').insert({ user_id: userId, channel_id: channelId });
            await supabase.rpc('increment_subscribers', { ch_id: channelId, amt: 1 });
            return true;
        }
    } catch (e) { return false; }
};

export const getChannelFollowers = async (channelId: string): Promise<string[]> => {
    try {
        const { data } = await supabase.from('fandub_follows').select('user_id').eq('channel_id', channelId);
        return (data || []).map(f => f.user_id);
    } catch (e) { return []; }
};

export const getActiveStories = async (): Promise<FandubStory[]> => {
    try {
        const yesterday = new Date(Date.now() - 24*60*60*1000).toISOString();
        const { data } = await supabase.from('fandub_stories').select('*, profiles(username, avatar_url)').gt('created_at', yesterday);
        return data || [];
    } catch (e) { return []; }
};

export const isMovieSaved = async (userId: string, movieId: number): Promise<boolean> => {
    try {
        const { data } = await supabase.from('saved_movies').select('id').eq('user_id', userId).eq('movie_id', movieId).maybeSingle();
        return !!data;
    } catch (e) { return false; }
};

export const toggleSaveMovie = async (userId: string, movieId: number): Promise<boolean> => {
    try {
        const { data: existing } = await supabase.from('saved_movies').select('id').eq('user_id', userId).eq('movie_id', movieId).maybeSingle();
        if (existing) {
            await supabase.from('saved_movies').delete().eq('id', existing.id);
            return false;
        } else {
            await supabase.from('saved_movies').insert({ user_id: userId, movie_id: movieId });
            return true;
        }
    } catch (e) { return false; }
};

export const getUserHistory = async (userId: string): Promise<Movie[]> => {
    try {
        const { data } = await supabase.from('user_history').select('*, movies(*)').eq('user_id', userId).order('viewed_at', { ascending: false });
        return (data || []).filter(h => h && h.movies).map((h: any) => {
            const m = h.movies;
            const pUrl = normalizeUrl(m.poster_url || m.posterUrl || '');
            const vUrl = normalizeUrl(m.video_url || m.videoUrl || '');
            return {
                ...m,
                poster_url: pUrl,
                posterUrl: pUrl,
                video_url: vUrl,
                videoUrl: vUrl
            };
        }) as Movie[];
    } catch (e) { return []; }
};

export const getSavedMovies = async (userId: string): Promise<Movie[]> => {
    try {
        const { data = [] } = await supabase.from('saved_movies').select('*, movies(*)').eq('user_id', userId).order('created_at', { ascending: false });
        return (data || []).filter(s => s && s.movies).map((s: any) => {
            const m = s.movies;
            const pUrl = normalizeUrl(m.poster_url || m.posterUrl || '');
            const vUrl = normalizeUrl(m.video_url || m.videoUrl || '');
            return {
                ...m,
                poster_url: pUrl,
                posterUrl: pUrl,
                video_url: vUrl,
                videoUrl: vUrl
            };
        }) as Movie[];
    } catch (e) { return []; }
};

export const searchMoviesDB = async (query: string): Promise<Movie[]> => {
    try {
        const { data } = await supabase.from('movies').select('*').or(`title.ilike.%${query}%,genre.ilike.%${query}%,tags.ilike.%${query}%`).eq('is_archived', false);
        return (data || []).map(m => {
            const pUrl = normalizeUrl(m.poster_url || m.posterUrl || '');
            const vUrl = normalizeUrl(m.video_url || m.videoUrl || '');
            return {
                ...m,
                poster_url: pUrl,
                posterUrl: pUrl,
                video_url: vUrl,
                videoUrl: vUrl
            };
        }) as Movie[];
    } catch (e) { return []; }
};

export const deleteReview = async (reviewId: number) => {
    await supabase.from('reviews').delete().eq('id', reviewId);
};

export const updateReview = async (reviewId: number, comment: string) => {
    if (isAiPilotEnabled()) {
        const guardResult = await runAiServerManager(`User Review Edit: "${comment}"`);
        if (guardResult && !guardResult.allowed) throw new Error(`AI Guard: ${guardResult.analysis}`);
    }
    await supabase.from('reviews').update({ comment }).eq('id', reviewId);
};

export const buySubscription = async (userId: string, plan: string, price: number) => {
    await supabase.rpc('buy_subscription', { u_id: userId, p_name: plan, cost: price });
    localStorage.removeItem(`anilo_cache_profile_${userId}`);
};

export const redeemPromocode = async (userId: string, code: string) => {
    const { data, error } = await supabase.rpc('redeem_promocode', { u_id: userId, c_str: code });
    if (error) throw error;
    return data;
};

export const getNews = async (): Promise<News[]> => {
    try {
        const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const createNews = async (title: string, content: string) => {
    await supabase.from('news').insert({ title, content });
};

export const deleteNews = async (id: number) => {
    await supabase.from('news').delete().eq('id', id);
};

export const getAllTickets = async (): Promise<SupportTicket[]> => {
    try {
        const { data } = await supabase.from('support_tickets').select('*, profiles(full_name)').order('created_at', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const getMyTickets = async (userId: string): Promise<SupportTicket[]> => {
    try {
        const { data = [] } = await supabase.from('support_tickets').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const getTicketMessages = async (ticketId: number): Promise<TicketMessage[]> => {
    try {
        const { data } = await supabase.from('ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
        return data || [];
    } catch (e) { return []; }
};

export const createTicket = async (userId: string) => {
    const { data, error } = await supabase.from('support_tickets').insert({ user_id: userId, status: 'open' }).select().single();
    if (error) throw error;
    return data;
};

export const sendMessage = async (ticketId: number, userId: string, message: string, isAdmin: boolean) => {
    await supabase.from('ticket_messages').insert({ ticket_id: ticketId, user_id: userId, message, is_admin: isAdmin });
};

export const getPromocodes = async (): Promise<Promocode[]> => {
    try {
        const { data } = await supabase.from('promocodes').select('*').order('created_at', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const savePromocode = async (promo: Promocode) => {
    await supabase.from('promocodes').insert(promo);
};

export const deletePromocode = async (id: number) => {
    await supabase.from('promocodes').delete().eq('id', id);
};

export const getSocialLinks = async (): Promise<SocialLink[]> => {
    try {
        const { data } = await supabase.from('social_links').select('*').order('label', { ascending: true });
        return data || [];
    } catch (e) { return []; }
};

export const addSocialLink = async (link: Partial<SocialLink>) => {
    await supabase.from('social_links').insert(link);
};

export const deleteSocialLink = async (id: number) => {
    await supabase.from('social_links').delete().eq('id', id);
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
    try {
        const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const deleteUser = async (id: string) => {
    await supabase.from('profiles').delete().eq('id', id);
};

export const getPaymentRequests = async (): Promise<PaymentRequestDB[]> => {
    try {
        const { data } = await supabase.from('payment_requests').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const createPaymentRequest = async (userId: string, amount: number, screenshotUrl: string) => {
    await supabase.from('payment_requests').insert({ user_id: userId, amount, screenshot_url: screenshotUrl, status: 'pending' });
};

export const approvePaymentRequest = async (requestId: number, userId: string, amount: number) => {
    await supabase.rpc('approve_payment', { req_id: requestId, u_id: userId, amt: amount });
    localStorage.removeItem(`anilo_cache_profile_${userId}`);
};

export const rejectPaymentRequest = async (requestId: number) => {
    await supabase.from('payment_requests').update({ status: 'rejected' }).eq('id', requestId);
};

export const getPremiumUsers = async (): Promise<UserProfile[]> => {
    try {
        const { data } = await supabase.from('profiles').select('*').gt('balance', 0).order('balance', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const adminAdjustUserBalance = async (userId: string, amount: number, type: 'add' | 'deduct', description: string) => {
    await supabase.rpc('adjust_user_balance', { u_id: userId, amt: amount, adj_type: type, desc: description });
    localStorage.removeItem(`anilo_cache_profile_${userId}`);
};

export const giveGlobalBonus = async (amount: number, description: string) => {
    const { data, error } = await supabase.rpc('give_global_bonus', { amt: amount, desc: description });
    if (error) throw error;
    return data;
};

export const getAllSessions = async (): Promise<UserDevice[]> => {
    try {
        const { data } = await supabase.from('user_devices').select('*, profiles(full_name, email, role)').order('last_active', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const toggleDeviceBlock = async (id: number, blocked: boolean) => {
    await supabase.from('user_devices').update({ is_blocked: blocked }).eq('id', id);
};

export const getBroadcasts = async (): Promise<Broadcast[]> => {
    try {
        const { data } = await supabase.from('broadcasts').select('*').order('created_at', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const createBroadcast = async (bc: Partial<Broadcast>) => {
    await supabase.from('broadcasts').insert(bc);
};

export const deleteBroadcast = async (id: number) => {
    await supabase.from('broadcasts').delete().eq('id', id);
};

export const getATCWallet = async (userId: string): Promise<ATCWallet | null> => {
    try {
        const { data } = await supabase.from('atc_wallets').select('*').eq('user_id', userId).maybeSingle();
        return data;
    } catch (e) { return null; }
};

export const getATCTransactions = async (userId: string): Promise<ATCTransaction[]> => {
    try {
        const { data } = await supabase.from('atc_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const getContestSettings = async () => {
    try {
        const { data } = await supabase.from('contest_settings').select('*');
        const s: any = {};
        (data || []).forEach(i => s[i.key] = i.value);
        return s;
    } catch (e) { return {}; }
};

export const updateContestSetting = async (key: string, value: any) => {
    await supabase.from('contest_settings').upsert({ key, value });
};

export const getContestTasks = async (): Promise<ContestTask[]> => {
    try {
        const { data } = await supabase.from('contest_tasks').select('*');
        return data || [];
    } catch (e) { return []; }
};

export const createContestTask = async (task: Partial<ContestTask>) => {
    await supabase.from('contest_tasks').insert(task);
};

export const deleteContestTask = async (id: number) => {
    await supabase.from('contest_tasks').delete().eq('id', id);
};

export const getContestAds = async (): Promise<ContestAd[]> => {
    try {
        const { data = [] } = await supabase.from('contest_ads').select('*');
        return data || [];
    } catch (e) { return []; }
};

export const createContestAd = async (ad: Partial<ContestAd>) => {
    await supabase.from('contest_ads').insert(ad);
};

export const deleteContestAd = async (id: number) => {
    await supabase.from('contest_ads').delete().eq('id', id);
};

export const claimATCReward = async (userId: string, amount: number, type: string, desc: string) => {
    await supabase.rpc('claim_atc_reward', { u_id: userId, amt: amount, r_type: type, r_desc: desc });
};

export const convertATCtoUZS = async (userId: string, amount: number, rate: number) => {
    await supabase.rpc('convert_atc_to_uzs', { u_id: userId, atc_amt: amount, ex_rate: rate });
    localStorage.removeItem(`anilo_cache_profile_${userId}`);
};

export const getQuizQuestions = async (count: number): Promise<QuizQuestion[]> => {
    try {
        const { data } = await supabase.rpc('get_random_quiz', { q_count: count });
        return data || [];
    } catch (e) { return []; }
};

export const rewardExtraSpin = async (userId: string, count: number) => {
    await supabase.rpc('add_extra_spins', { u_id: userId, s_count: count });
};

export const getArkWallet = async (userId: string): Promise<ArkWallet | null> => {
    try {
        const { data } = await supabase.from('atc_wallets').select('*').eq('user_id', userId).maybeSingle();
        return data as any; 
    } catch (e) { return null; }
};

export const getArkMarketHistory = async (): Promise<ArkMarketData[]> => {
    try {
        const { data } = await supabase.from('ark_market_history').select('*').order('created_at', { ascending: true });
        return data || [];
    } catch (e) { return []; }
};

export const getArkSettings = async () => {
    try {
        const { data = null } = await supabase.from('ark_settings').select('*');
        const s: any = {};
        (data || []).forEach(i => s[i.key] = i.value);
        return s;
    } catch (e) { return {}; }
};

export const updateArkSettings = async (key: string, value: any) => {
    await supabase.from('ark_settings').upsert({ key, value });
};

export const getArkAds = async (): Promise<ArkAd[]> => {
    try {
        const { data = [] } = await supabase.from('ark_ads').select('*');
        return data || [];
    } catch (e) { return []; }
};

export const createArkAd = async (ad: Partial<ArkAd>) => {
    await supabase.from('ark_ads').insert(ad);
};

export const deleteArkAd = async (id: number) => {
    await supabase.from('ark_ads').delete().eq('id', id);
};

export const getArkQuizzes = async (): Promise<ArkQuiz[]> => {
    try {
        const { data = [] } = await supabase.from('ark_quizzes').select('*');
        return data || [];
    } catch (e) { return []; }
};

export const createArkQuiz = async (q: Partial<ArkQuiz>) => {
    await supabase.from('ark_quizzes').insert(q);
};

export const deleteArkQuiz = async (id: number) => {
    await supabase.from('ark_quizzes').delete().eq('id', id);
};

export const recordArkSpinResult = async (userId: string, prize: WheelPrize) => {
    await supabase.rpc('process_ark_spin', { u_id: userId, p_type: prize.type, p_val: prize.value, p_lbl: prize.label });
};

export const rewardArkSpins = async (userId: string, count: number) => {
    await supabase.rpc('add_ark_spins', { u_id: userId, s_count: count });
};

export const claimArkAdReward = async (userId: string, amount: number, title: string) => {
    await supabase.rpc('claim_ark_ad_reward', { u_id: userId, amt: amount, ad_title: title });
};

export const getArkWithdrawals = async (): Promise<ArkWithdrawal[]> => {
    try {
        const { data } = await supabase.from('ark_withdrawals').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
        return data || [];
    } catch (e) { return []; }
};

export const requestArkWithdrawal = async (userId: string, amount: number, card: string, holder: string) => {
    await supabase.from('ark_withdrawals').insert({ user_id: userId, amount_ark: amount, card_number: card, card_holder: holder });
};

export const approveArkWithdrawal = async (id: number) => {
    await supabase.from('ark_withdrawals').update({ status: 'approved' }).eq('id', id);
};

export const giveArkGlobalBonus = async (amount: number, bonus_msg: string) => {
    await supabase.rpc('give_ark_global_bonus', { amt: amount, bonus_msg });
};

export const runArkAutopilot = async () => {
    const { data, error } = await supabase.rpc('run_ark_autopilot');
    if (error) throw error;
    return data;
};

export const toggleArkMarketStatus = async (status: string) => {
    await updateArkSettings('game_status', status);
};

export const saveArkSchedule = async (schedule: ArkSchedule) => {
    await updateArkSettings('market_schedule', JSON.stringify(schedule));
};

export const getAdminPin = async () => {
    try {
        const config = await getAppConfig();
        return config['admin_pin'] || '0000';
    } catch { return '0000'; }
};

export const setAdminPin = async (pin: string) => {
    await updateAppConfig('admin_pin', pin);
};

export const getProtectedRoutes = async (): Promise<string[]> => {
    try {
        const config = await getAppConfig();
        return JSON.parse(config['protected_routes'] || '[]');
    } catch { return []; }
};

export const setProtectedRoutes = async (routes: string[]) => {
    await updateAppConfig('protected_routes', JSON.stringify(routes));
};

export const saveRecoveryCodes = async (codes: string[]) => {
    await updateAppConfig('admin_recovery_codes', JSON.stringify(codes));
};

export const verifyRecoveryCode = async (code: string): Promise<boolean> => {
    try {
        const config = await getAppConfig();
        const codes = JSON.parse(config['admin_recovery_codes'] || '[]');
        return codes.includes(code);
    } catch { return false; }
};

export const verifyRecoveryCodeStatus = async (): Promise<boolean> => {
    try {
        const config = await getAppConfig();
        const codes = JSON.parse(config['admin_recovery_codes'] || '[]');
        return codes.length > 0;
    } catch { return false; }
};

export const getRecoveryCodesStatus = async (): Promise<boolean> => {
    try {
        const config = await getAppConfig();
        const codes = JSON.parse(config['admin_recovery_codes'] || '[]');
        return codes.length > 0;
    } catch { return false; }
};

export const getShopProducts = async (cat?: string, sort?: string, query?: string): Promise<ShopProduct[]> => {
    try {
        let q = supabase.from('shop_products').select('*').eq('is_active', true);
        if (cat && cat !== 'all') q = q.eq('category', cat);
        if (query) q = q.ilike('title', `%${query}%`);
        if (sort === 'price_asc') q = q.order('price', { ascending: true });
        else if (sort === 'price_desc') q = q.order('price', { ascending: false });
        else if (sort === 'popular') q = q.order('sales_count', { ascending: false });
        else q = q.order('created_at', { ascending: false });
        const { data } = await q;
        return data || [];
    } catch { return []; }
};

export const getAdminShopProducts = async (): Promise<ShopProduct[]> => {
    try {
        const { data } = await supabase.from('shop_products').select('*').order('created_at', { ascending: false });
        return data || [];
    } catch { return []; }
};

export const createShopProduct = async (prod: Partial<ShopProduct>) => {
    await supabase.from('shop_products').insert(prod);
};

export const getShopWallet = async (userId: string): Promise<ShopWallet | null> => {
    try {
        const { data = null } = await supabase.from('shop_wallets').select('*').eq('user_id', userId).maybeSingle();
        return data;
    } catch { return null; }
};

export const createShopPaymentRequest = async (userId: string, amount: number, url: string) => {
    await supabase.from('shop_payment_requests').insert({ user_id: userId, amount, screenshot_url: url });
};

export const placeShopOrder = async (userId: string, productId: number, amount: number, address: string, phone: string) => {
    await supabase.rpc('place_shop_order', { u_id: userId, p_id: productId, amt: amount, addr: address, ph: phone });
    localStorage.removeItem(`anilo_cache_profile_${userId}`);
};

export const getMyShopOrders = async (userId: string): Promise<ShopOrder[]> => {
    try {
        const { data = [] } = await supabase.from('shop_orders').select('*, products(*)').eq('user_id', userId).order('created_at', { ascending: false });
        return data || [];
    } catch { return []; }
};

export const incrementAdView = async (adId: number) => {
    try { await supabase.rpc('increment_ad_views', { ad_id: adId }); } catch {}
};

export const getAds = async (): Promise<Ad[]> => {
    try {
        const { data = [] } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
        return (data || []).map((ad: any) => ({
            id: ad.id,
            name: ad.name,
            type: ad.type,
            contentUrl: ad.content_url,
            targetUrl: ad.target_url,
            location: ad.location,
            status: ad.status,
            view_count: ad.view_count
        }));
    } catch { return []; }
};

export const saveAd = async (ad: Ad) => {
    const { id, ...data } = ad;
    const payload = {
        name: data.name,
        type: data.type,
        content_url: data.contentUrl,
        target_url: data.targetUrl,
        location: data.location,
        status: data.status,
        view_count: data.view_count || 0
    };
    if (id) await supabase.from('ads').update(payload).eq('id', id);
    else await supabase.from('ads').insert(payload);
};

export const deleteAd = async (id: number) => {
    await supabase.from('ads').delete().eq('id', id);
};

export const recordTsPaySuccess = async (userId: string, amount: number, orderId: number) => {
    await supabase.rpc('record_tspay_success', { u_id: userId, amt: amount, o_id: orderId });
    localStorage.removeItem(`anilo_cache_profile_${userId}`);
};

export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
    try {
        const { data } = await supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        return data || [];
    } catch { return []; }
};

export const getAdminMovies = async (): Promise<Movie[]> => {
    try {
        const { data, error } = await supabase.from('movies').select('*').order('created_at', { ascending: false });
        if (error) return [];
        return (data || []).map(m => ({
            ...m,
            posterUrl: m.posterUrl || m.poster_url,
            videoUrl: m.videoUrl || m.video_url
        })) as Movie[];
    } catch { return []; }
};

export const updateUserPassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
};

export const updateUserEmail = async (email: string) => {
    const { error } = await supabase.auth.updateUser({ email });
    if (error) throw error;
    const user = await supabase.auth.getUser();
    if(user.data.user) localStorage.removeItem(`anilo_cache_profile_${user.data.user.id}`);
};

export const checkAndTrackRegistration = async (deviceId: string) => {
    try {
        const { data, error } = await supabase.rpc('check_registration_limit', { dev_id: deviceId });
        if (error) return;
        if (data && !data.allowed) {
            throw new Error(data.message || "Ushbu qurilmadan ro'yxatdan o'tish limiti tugagan.");
        }
    } catch (e: any) { throw e; }
};

export const logDeviceLogin = async (userId: string, deviceId: string) => {
    try {
        const userAgent = navigator.userAgent;
        await supabase.from('user_devices').upsert({
            user_id: userId,
            device_id: deviceId,
            device_name: userAgent,
            last_active: new Date().toISOString()
        }, { onConflict: 'user_id, device_id' });
    } catch {}
};

export const getFandubEarnings = async (channelId: string): Promise<FandubEarning[]> => {
    try {
        const { data } = await supabase.from('fandub_earnings').select('*').eq('channel_id', channelId).order('created_at', { ascending: false });
        return (data || []) as FandubEarning[];
    } catch { return []; }
};

export const getFandubWithdrawals = async (channelId: string): Promise<FandubWithdrawal[]> => {
    try {
        const { data } = await supabase.from('fandub_withdrawals').select('*').eq('channel_id', channelId).order('created_at', { ascending: false });
        return (data || []) as FandubWithdrawal[];
    } catch { return []; }
};

export const requestFandubWithdrawal = async (channelId: string, userId: string, amount: number, card: string, holder: string) => {
    const { error } = await supabase.from('fandub_withdrawals').insert({
        channel_id: channelId,
        user_id: userId,
        amount,
        card_number: card,
        card_holder: holder,
        status: 'pending'
    });
    if (error) throw error;
};

export const getFandubStatsSummary = async (channelId: string) => {
    try {
        const { data } = await supabase.rpc('get_fandub_stats_summary', { ch_id: channelId });
        return data || { lastMonthEarnings: 0 };
    } catch { return { lastMonthEarnings: 0 }; }
};

// --- LIVE STREAMING ---

export const getLiveStreams = async (): Promise<LiveStream[]> => {
    try {
        const { data, error } = await supabase
            .from('live_streams')
            .select('*, profiles(username, avatar_url), fandub_channels(name)')
            .eq('status', 'live')
            .order('viewer_count', { ascending: false });
        
        if (error) {
            console.error("getLiveStreams Error:", error);
            return [];
        }
        return (data || []) as any;
    } catch (e) { 
        console.error("getLiveStreams Exception:", e);
        return []; 
    }
};

export const createLiveStream = async (stream: Partial<LiveStream>) => {
    const { data, error } = await supabase.from('live_streams').insert(stream).select().single();
    if (error) throw error;
    return data as LiveStream;
};

export const updateLiveStream = async (id: string, updates: Partial<LiveStream>) => {
    const { error } = await supabase.from('live_streams').update(updates).eq('id', id);
    if (error) throw error;
};

export const endLiveStream = async (id: string) => {
    const { error } = await supabase.from('live_streams').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
};

export const getLiveChatMessages = async (streamId: string): Promise<LiveChatMessage[]> => {
    try {
        const { data } = await supabase
            .from('live_chat_messages')
            .select('*')
            .eq('stream_id', streamId)
            .order('created_at', { ascending: true })
            .limit(100);
        return (data || []) as LiveChatMessage[];
    } catch (e) { return []; }
};

export const sendLiveChatMessage = async (msg: Partial<LiveChatMessage>) => {
    const { error } = await supabase.from('live_chat_messages').insert(msg);
    if (error) throw error;
};

export const likeLiveStream = async (streamId: string) => {
    const { error } = await supabase.rpc('increment_live_likes', { s_id: streamId });
    if (error) throw error;
};

export const inviteCoStreamer = async (streamId: string, userId: string, username: string) => {
    const { error } = await supabase.from('live_streams').update({ 
        co_streamer_id: userId,
        co_streamer_username: username
    }).eq('id', streamId);
    if (error) throw error;
};

// --- NEW LINKING TABLES API (ADMIN & FANDUB CONNECTIVITY) ---

export interface MovieFandubLink {
    id: number;
    movie_id: number;
    fandub_upload_id: number;
    created_at: string;
    movie?: any;
    fandub_upload?: any;
}

export interface MovieChannelLink {
    id: number;
    movie_id: number;
    channel_id: string;
    created_at: string;
    movie?: any;
    fandub_channel?: any;
}

/**
 * Fetches all fandub projects connected to an official movie
 */
export const getMovieFandubLinks = async (movieId: number): Promise<MovieFandubLink[]> => {
    try {
        const { data, error } = await supabase
            .from('movie_fandub_links')
            .select('*, fandub_uploads(*, fandub_channels(name))')
            .eq('movie_id', movieId);
        if (error) {
            console.warn("movie_fandub_links fetch failed, retrying raw:", error);
            return [];
        }
        return (data || []) as MovieFandubLink[];
    } catch {
        return [];
    }
};

/**
 * Fetches all channels connected to an official movie
 */
export const getMovieChannelLinks = async (movieId: number): Promise<MovieChannelLink[]> => {
    try {
        const { data, error } = await supabase
            .from('movie_channel_links')
            .select('*, fandub_channels(*)')
            .eq('movie_id', movieId);
        if (error) {
            console.warn("movie_channel_links fetch failed:", error);
            return [];
        }
        return (data || []) as MovieChannelLink[];
    } catch {
        return [];
    }
};

/**
 * Links an official movie to a fandub project
 */
export const linkMovieToFandub = async (movieId: number, fandubUploadId: number): Promise<void> => {
    await checkIsAdmin();
    const { error } = await supabase
        .from('movie_fandub_links')
        .insert({ movie_id: movieId, fandub_upload_id: fandubUploadId });
    if (error) {
        console.error("linkMovieToFandub error:", error);
        throw error;
    }
};

/**
 * Links an official movie to a fandub channel
 */
export const linkMovieToChannel = async (movieId: number, channelId: string): Promise<void> => {
    await checkIsAdmin();
    const { error } = await supabase
        .from('movie_channel_links')
        .insert({ movie_id: movieId, channel_id: channelId });
    if (error) {
        console.error("linkMovieToChannel error:", error);
        throw error;
    }
};

/**
 * Removes link between an official movie and a fandub project
 */
export const unlinkMovieFandub = async (movieId: number, fandubUploadId: number): Promise<void> => {
    await checkIsAdmin();
    const { error } = await supabase
        .from('movie_fandub_links')
        .delete()
        .eq('movie_id', movieId)
        .eq('fandub_upload_id', fandubUploadId);
    if (error) {
        console.error("unlinkMovieFandub error:", error);
        throw error;
    }
};

/**
 * Removes link between an official movie and a fandub channel
 */
export const unlinkMovieChannel = async (movieId: number, channelId: string): Promise<void> => {
    await checkIsAdmin();
    const { error } = await supabase
        .from('movie_channel_links')
        .delete()
        .eq('movie_id', movieId)
        .eq('channel_id', channelId);
    if (error) {
        console.error("unlinkMovieChannel error:", error);
        throw error;
    }
};

