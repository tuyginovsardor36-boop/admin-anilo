import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './services/supabaseClient';
import { useNotification } from './hooks/useNotification';
import { getLiveChatMessages, sendLiveChatMessage, uploadFile } from './services/dbService';
import { LiveChatMessage, UserProfile } from './types';
import { 
    MessageSquare, Send, Mic, MicOff, Smile, Play, Pause, Trash2, 
    Settings, Users, Shield, Plus, Volume2, VolumeX, ShieldCheck, 
    Calendar, Video, Pin, X, Clock, Sparkles, UserMinus, Info
} from 'lucide-react';

// Web Audio API Synthesizer for high-end click / feed notification sounds
const playFrictionSound = (type: 'click' | 'send' | 'receive' | 'join' | 'mute') => {
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1100, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.04);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
            osc.start(now);
            osc.stop(now + 0.04);
        } else if (type === 'send') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'receive') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.setValueAtTime(780, now + 0.06);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            osc.start(now);
            osc.stop(now + 0.18);
        } else if (type === 'join') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now); 
            osc.frequency.setValueAtTime(659.25, now + 0.06); 
            osc.frequency.setValueAtTime(783.99, now + 0.12); 
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'mute') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(280, now);
            osc.frequency.exponentialRampToValueAtTime(90, now + 0.12);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
        }
    } catch (e) {
        console.warn("Sound generation disabled or failed", e);
    }
};

interface ChatRoom {
    id: string;
    name: string;
    description: string;
    creator_id: string;
    emoji: string;
    expiry_days: number;
    admins_list?: string[];
    admin_rights?: Record<string, AdminPermissions>;
    group_username?: string;
    is_channel?: boolean;
    bg_image?: string;
}

interface AdminPermissions {
    canDeleteMessages: boolean;
    canPinMessages: boolean;
    canMuteUsers: boolean;
    canInviteUsers: boolean;
    canEditGroupInfo: boolean;
    canAddAdmins: boolean;
    canStartVideoChat: boolean;
    canSendVoiceNotes: boolean;
    canScheduleMessages: boolean;
    canManageBlockedWords: boolean;
}

const DEFAULT_PERMISSIONS: AdminPermissions = {
    canDeleteMessages: true,
    canPinMessages: true,
    canMuteUsers: true,
    canInviteUsers: true,
    canEditGroupInfo: true,
    canAddAdmins: true,
    canStartVideoChat: true,
    canSendVoiceNotes: true,
    canScheduleMessages: true,
    canManageBlockedWords: false
};

interface ScheduledMessage {
    id: string;
    roomId: string;
    text: string;
    type: 'text' | 'voice';
    voiceUrl?: string;
    voiceDuration?: number;
    sendAt: string;
}

export const ChatPage: React.FC = () => {
    const { addNotification } = useNotification();
    const [user, setUser] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    // Channels / Rooms State with Supabase database backing up list
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [showNewRoomModal, setShowNewRoomModal] = useState(false);
    
    // New Room Fields
    const [newRoomName, setNewRoomName] = useState('');
    const [newRoomDesc, setNewRoomDesc] = useState('');
    const [newRoomEmoji, setNewRoomEmoji] = useState('🔥');
    const [newRoomExpiry, setNewRoomExpiry] = useState(5);

    // Messages state
    const [messages, setMessages] = useState<LiveChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [soundEnabled, setSoundEnabled] = useState(true);

    // UI Panel displays
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showSettingsPanel, setShowSettingsPanel] = useState(false);
    const [showParticipantsPanel, setShowParticipantsPanel] = useState(false);

    // Video Chat Lounge state
    const [isVideoChatActive, setIsVideoChatActive] = useState(false);
    const [cameraOn, setCameraOn] = useState(true);
    const [microphoneOn, setMicrophoneOn] = useState(true);
    const [videoParticipants, setVideoParticipants] = useState<any[]>([]);
    const videoCanvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Voice Notes state
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const recordingIntervalRef = useRef<any>(null);
    const [uploadingVoice, setUploadingVoice] = useState(false);
    const [currentlyPlayingAudio, setCurrentlyPlayingAudio] = useState<string | null>(null);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    // Scheduled messages State
    const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
    const [scheduleTime, setScheduleTime] = useState('');
    const [showSchedulePicker, setShowSchedulePicker] = useState(false);

    // Muted members
    const [mutedUsers, setMutedUsers] = useState<Record<string, string[]>>({});
    // Pin feature
    const [pinnedMessages, setPinnedMessages] = useState<Record<string, LiveChatMessage>>({});
    // Emoji overlay state
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const [selectedUserForAdmin, setSelectedUserForAdmin] = useState<UserProfile | null>(null);
    const [showAdminRightsModal, setShowAdminRightsModal] = useState(false);
    const [editingPermissions, setEditingPermissions] = useState<AdminPermissions>(DEFAULT_PERMISSIONS);
    const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);

    // Unique username, limit checks, public channels and background presets configuration
    const [newRoomUsername, setNewRoomUsername] = useState('');
    const [newRoomIsChannel, setNewRoomIsChannel] = useState(false);
    const [newRoomBgImage, setNewRoomBgImage] = useState('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=1200');

    // Add user modal properties
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [memberSearchQuery, setMemberSearchQuery] = useState('');

    // Admin Group controls local editors
    const [editRoomTitle, setEditRoomTitle] = useState('');
    const [editRoomDesc, setEditRoomDesc] = useState('');
    const [editRoomIsChannel, setEditRoomIsChannel] = useState(false);
    const [editRoomBgImage, setEditRoomBgImage] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Play helper respecting user audio preference
    const triggerTone = (sound: 'click' | 'send' | 'receive' | 'join' | 'mute') => {
        if (soundEnabled) playFrictionSound(sound);
    };

    // Calculate dynamic style classes for thin customized scrollbar
    const customScrollbarClass = `[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-track]:bg-zinc-950/20 [&::-webkit-scrollbar-thumb]:bg-zinc-800/80 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-orange-500/80 transition-all`;

    // Fetch rooms list from Supabase
    const fetchRoomsFromSupabase = async (): Promise<ChatRoom[]> => {
        try {
            const { data, error } = await supabase
                .from('live_streams')
                .select('*')
                .eq('cover_url', 'chat_room');

            if (error) throw error;

            if (data && data.length > 0) {
                return data.map(item => {
                    let descriptorExtra = { 
                        desc: item.description || '', 
                        emoji: '🔥', 
                        expiry_days: 5, 
                        admins: [] as string[], 
                        admin_rights: {} as Record<string, AdminPermissions>,
                        group_username: '',
                        is_channel: false,
                        bg_image: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=1200'
                    };
                    try {
                        if (item.description && item.description.startsWith('{')) {
                            descriptorExtra = { ...descriptorExtra, ...JSON.parse(item.description) };
                        }
                    } catch (e) {}

                    return {
                        id: item.id,
                        name: item.title,
                        description: descriptorExtra.desc || item.description || 'Xush kelibsiz suhbat xonamizga.',
                        creator_id: item.streamer_id,
                        emoji: descriptorExtra.emoji || '🔥',
                        expiry_days: descriptorExtra.expiry_days || 5,
                        admins_list: descriptorExtra.admins || [],
                        admin_rights: descriptorExtra.admin_rights || {},
                        group_username: descriptorExtra.group_username || '',
                        is_channel: !!descriptorExtra.is_channel,
                        bg_image: descriptorExtra.bg_image || 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=1200'
                    };
                });
            }
        } catch (e) {
            console.error("fetchRoomsFromSupabase failing:", e);
        }
        return [];
    };

    // Seed initial robust chat channels if Supabase has 0
    const seedDefaultRooms = async () => {
        const defaults = [
            { id: 'a2aa2aaa-0000-0000-0000-000000000001', title: 'umumiy-muloqot', desc: 'Barcha animechilar muloqot markazi va yangiliklar!', emoji: '✨', expiry_days: 5 },
            { id: 'a2aa2aaa-0000-0000-0000-000000000002', title: 'shonen-va-muhokama', desc: 'Attack on Titan, Naruto, Bleach va boshqalar bo\'yicha suhbat', emoji: '⚔️', expiry_days: 3 },
            { id: 'a2aa2aaa-0000-0000-0000-000000000003', title: 'ovozli-va-vlog', desc: 'Ovozli xabarlar va anime soundtreklar almashish xonasi', emoji: '🎙️', expiry_days: 2 },
            { id: 'a2aa2aaa-0000-0000-0000-000000000004', title: 'anime-memlar', desc: 'Eng kulgili va qiziqarli anime mem xonasi', emoji: '😂', expiry_days: 4 }
        ];

        try {
            const payloadRecords = defaults.map(room => {
                const descriptor = {
                    desc: room.desc,
                    emoji: room.emoji,
                    expiry_days: room.expiry_days,
                    admins: [] as string[],
                    admin_rights: {} as Record<string, AdminPermissions>
                };

                return {
                    id: room.id,
                    streamer_id: null,
                    title: room.title,
                    description: JSON.stringify(descriptor),
                    cover_url: 'chat_room',
                    status: 'live',
                    viewer_count: 0,
                    likes_count: 0,
                    started_at: new Date().toISOString()
                };
            });

            // Sequential insert fallback
            for (const rec of payloadRecords) {
                await supabase.from('live_streams').insert(rec);
            }
        } catch (e) {
            console.error("seedDefaultRooms error:", e);
        }
    };

    // Load initial user auth & rooms
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user: u } }) => {
            if (u) {
                setUser(u);
                supabase.from('profiles').select('*').eq('id', u.id).maybeSingle().then(({ data }) => {
                    if (data) setUserProfile(data);
                });
            }
        });

        const initLoad = async () => {
            setLoadingRooms(true);
            let list = await fetchRoomsFromSupabase();
            if (list.length === 0) {
                await seedDefaultRooms();
                list = await fetchRoomsFromSupabase();
            }
            setRooms(list);
            if (list.length > 0) setActiveRoom(list[0]);
            setLoadingRooms(false);
        };
        initLoad();

        // Local cache configurations
        const storedMuted = localStorage.getItem('anilo_anime_chat_muted');
        if (storedMuted) {
            try { setMutedUsers(JSON.parse(storedMuted)); } catch(e){}
        }
        const storedScheduled = localStorage.getItem('anilo_anime_chat_scheduled');
        if (storedScheduled) {
            try { setScheduledMessages(JSON.parse(storedScheduled)); } catch(e){}
        }
        const storedPinned = localStorage.getItem('anilo_anime_chat_pinned');
        if (storedPinned) {
            try { setPinnedMessages(JSON.parse(storedPinned)); } catch(e){}
        }

        // Fetch fallback profiles for admin allocation list
        supabase.from('profiles').select('*').limit(60).then(({ data }) => {
            if (data) setAllProfiles(data);
        });
    }, []);

    // Setup Real-time Rooms Synchronization inside Supabase
    useEffect(() => {
        const roomsChannel = supabase
            .channel('realtime_live_rooms')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'live_streams',
                filter: 'cover_url=eq.chat_room'
            }, async () => {
                const refreshed = await fetchRoomsFromSupabase();
                if (refreshed.length > 0) {
                    setRooms(refreshed);
                    if (activeRoom) {
                        const matching = refreshed.find(r => r.id === activeRoom.id);
                        if (matching) {
                            setActiveRoom(matching);
                        } else {
                            setActiveRoom(refreshed[0]);
                        }
                    }
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(roomsChannel);
        };
    }, [activeRoom]);

    // Update edit values when activeRoom changes
    useEffect(() => {
        if (activeRoom) {
            setEditRoomTitle(activeRoom.name || '');
            setEditRoomDesc(activeRoom.description || '');
            setEditRoomIsChannel(!!activeRoom.is_channel);
            setEditRoomBgImage(activeRoom.bg_image || '');
        }
    }, [activeRoom]);

    // Timer check for scheduled queues
    useEffect(() => {
        localStorage.setItem('anilo_anime_chat_scheduled', JSON.stringify(scheduledMessages));

        const timer = setInterval(() => {
            const now = new Date();
            const toSend = scheduledMessages.filter(msg => new Date(msg.sendAt) <= now);
            if (toSend.length > 0) {
                toSend.forEach(msg => {
                    executeSendMessageRaw(msg.roomId, JSON.stringify({
                        type: msg.type,
                        text: msg.text.startsWith('{') ? JSON.parse(msg.text).text : msg.text,
                        voiceUrl: msg.voiceUrl,
                        voiceDuration: msg.voiceDuration,
                        isScheduled: true
                    }));
                });
                setScheduledMessages(prev => prev.filter(msg => new Date(msg.sendAt) > now));
            }
        }, 3000);

        return () => clearInterval(timer);
    }, [scheduledMessages]);

    // Active Room messages Subscription & Sync
    useEffect(() => {
        if (!activeRoom) return;

        // Load recent chat messages (last 100)
        getLiveChatMessages(activeRoom.id).then(msgList => {
            setMessages(msgList);
            scrollToBottom();
        });

        // Supabase Real-time messages sync channel connection
        const msgChannel = supabase
            .channel(`msg_stream_${activeRoom.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'live_chat_messages',
                filter: `stream_id=eq.${activeRoom.id}`
            }, payload => {
                if (payload.eventType === 'INSERT') {
                    const newMsg = payload.new as LiveChatMessage;
                    setMessages(prev => {
                        if (prev.some(m => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
                    triggerTone('receive');
                    scrollToBottom();
                } else if (payload.eventType === 'DELETE') {
                    const deletedId = payload.old.id;
                    setMessages(prev => prev.filter(m => m.id !== deletedId));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(msgChannel);
        };
    }, [activeRoom]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 120);
    };

    // User Right Checker - Owners, Admins & Creator Checks
    const hasPermission = (userId: string, permission: keyof AdminPermissions): boolean => {
        if (!activeRoom) return false;
        // Group creator/owner has absolute rights
        if (activeRoom.creator_id === userId || userProfile?.role === 'owner' || userProfile?.role === 'admin') return true;
        
        // Default rights standard to users
        if (['canSendVoiceNotes', 'canScheduleMessages', 'canInviteUsers'].includes(permission)) {
            return true;
        }

        const roomAdmins = activeRoom.admins_list || [];
        if (!roomAdmins.includes(userId)) return false;

        const roomPermissions = activeRoom.admin_rights?.[userId];
        if (roomPermissions) {
            return roomPermissions[permission];
        }
        return DEFAULT_PERMISSIONS[permission];
    };

    const getActiveParticipants = (): UserProfile[] => {
        const uniqueParticipants = new Map<string, UserProfile>();
        if (user && userProfile) {
            uniqueParticipants.set(user.id, userProfile);
        }
        allProfiles.forEach(p => {
            if (p && p.id) uniqueParticipants.set(p.id, p);
        });
        messages.forEach(msg => {
            if (msg && msg.user_id && !uniqueParticipants.has(msg.user_id)) {
                uniqueParticipants.set(msg.user_id, {
                    id: msg.user_id,
                    username: msg.username || 'Animechi',
                    avatar_url: msg.avatar_url || null,
                    role: (msg.role as any) || 'user',
                    full_name: msg.username || 'Foydalanuvchi',
                    email: '',
                    balance: 0,
                    phone: null,
                    short_id: '',
                    email_notifications: true,
                    push_notifications: true,
                    language: 'uz',
                    created_at: msg.created_at || new Date().toISOString(),
                    subscription_plan: null,
                    subscription_end_at: null,
                    free_trial_started_at: null
                });
            }
        });
        return Array.from(uniqueParticipants.values());
    };

    // Action button play click sounds Wrapper
    const handleButtonClickWithSound = (fn: () => void) => {
        triggerTone('click');
        fn();
    };

    // Create a new room in Database (Supabase backing live_streams)
    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoomName || !user) {
            addNotification({ type: 'warning', title: 'Kirish', message: 'Iltimos tizimga kiring.' });
            return;
        }

        const cleanName = newRoomName.trim().toLowerCase().replace(/\s+/g, '-');
        const cleanUserHandle = newRoomUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

        if (!cleanUserHandle) {
            addNotification({ type: 'warning', title: 'Username kiritilmadi', message: 'Iltimos, guruh uchun yagona username kiriting.' });
            return;
        }

        // 1. Check for unique handle across existing rooms
        const isTaken = rooms.some(r => r.group_username === cleanUserHandle);
        if (isTaken) {
            addNotification({ 
                type: 'error', 
                title: 'Username band', 
                message: `@${cleanUserHandle} allaqachon band! Boshqa nom tanlang.` 
            });
            return;
        }

        // 2. Check room limits (Standard: 3, Premium/Admins: 10, Global Admins: unlimited)
        const myRooms = rooms.filter(r => r.creator_id === user.id);
        const isPremiumUser = userProfile?.subscription_plan === 'premium' || userProfile?.subscription_plan === 'vip';
        const isGlobalAdminOrOwner = userProfile?.role === 'admin' || userProfile?.role === 'owner';
        
        let maxAllowedLimit = 3;
        if (isPremiumUser) {
            maxAllowedLimit = 10;
        }

        if (!isGlobalAdminOrOwner && myRooms.length >= maxAllowedLimit) {
            addNotification({
                type: 'error',
                title: 'Limitga yetildi',
                message: `Standart foydalanuvchilar max 3 ta, Premium esa 10 ta guruh ocha oladi. Sizda allaqachon ${myRooms.length} ta guruh bor!`
            });
            return;
        }

        // Generate valid general RFC4122 v4 UUID
        const generateUUID = () => {
            if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
                return window.crypto.randomUUID();
            }
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };
        const roomId = generateUUID();

        const descriptor = {
            desc: newRoomDesc || 'Suhbatimiz qoidalari va yo\'riqnomasi.',
            emoji: newRoomEmoji,
            expiry_days: Math.min(Math.max(newRoomExpiry, 1), 5),
            admins: [] as string[],
            admin_rights: {} as Record<string, AdminPermissions>,
            group_username: cleanUserHandle,
            is_channel: newRoomIsChannel,
            bg_image: newRoomBgImage || 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=1200'
        };

        const payload = {
            id: roomId,
            streamer_id: user.id,
            title: cleanName,
            description: JSON.stringify(descriptor),
            cover_url: 'chat_room',
            status: 'live',
            viewer_count: 0,
            likes_count: 0,
            started_at: new Date().toISOString()
        };

        try {
            const { error } = await supabase.from('live_streams').insert(payload);
            if (error) throw error;

            triggerTone('join');
            addNotification({
                type: 'success',
                title: 'Guruh yaratildi!',
                message: `@${cleanUserHandle} xonasi muvaffaqiyatli ochildi.`
            });

            const refreshed = await fetchRoomsFromSupabase();
            setRooms(refreshed);
            const foundRoom = refreshed.find(r => r.id === roomId);
            if (foundRoom) setActiveRoom(foundRoom);

            setShowNewRoomModal(false);
            setNewRoomName('');
            setNewRoomDesc('');
            setNewRoomUsername('');
            setNewRoomIsChannel(false);
            setNewRoomBgImage('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=1200');
            setNewRoomEmoji('🔥');
            setNewRoomExpiry(5);

        } catch (err) {
            console.error("handleCreateRoom database save fail:", err);
            addNotification({ type: 'error', title: 'Xatolik', message: 'Ushbu guruh guruhlash sarlavhasiga yozilmadi.' });
        }
    };

    // Save edited room parameters to Supabase
    const handleSaveRoomEdits = async () => {
        if (!activeRoom) return;
        const cleanTitle = editRoomTitle.trim().toLowerCase().replace(/\s+/g, '-');
        if (!cleanTitle) {
            addNotification({ type: 'warning', title: 'Xatolik', message: 'Guruh nomi bo\'sh bo\'lishi mumkin emas!' });
            return;
        }

        const ok = await updateRoomDetailsInDatabase(activeRoom, {
            name: cleanTitle,
            desc: editRoomDesc.trim(),
            is_channel: editRoomIsChannel,
            bg_image: editRoomBgImage
        });

        if (ok) {
            addNotification({ type: 'success', title: 'Muvaffaqiyat', message: 'Guruh ma\'lumotlari Supabasega saqlandi!' });
        } else {
            addNotification({ type: 'error', title: 'Xatolik', message: 'Saqlashda xatolik yuz berdi.' });
        }
    };

    // Save update inside Database room info
    const updateRoomDetailsInDatabase = async (targetRoom: ChatRoom, updatedProps: Partial<{ name: string, desc: string, emoji: string, expiry_days: number, admins: string[], admin_rights: Record<string, AdminPermissions>, group_username: string, is_channel: boolean, bg_image: string }>) => {
        const descriptor = {
            desc: updatedProps.desc !== undefined ? updatedProps.desc : targetRoom.description,
            emoji: updatedProps.emoji !== undefined ? updatedProps.emoji : targetRoom.emoji,
            expiry_days: updatedProps.expiry_days !== undefined ? updatedProps.expiry_days : targetRoom.expiry_days,
            admins: updatedProps.admins !== undefined ? updatedProps.admins : (targetRoom.admins_list || []),
            admin_rights: updatedProps.admin_rights !== undefined ? updatedProps.admin_rights : (targetRoom.admin_rights || {}),
            group_username: updatedProps.group_username !== undefined ? updatedProps.group_username : (targetRoom.group_username || ''),
            is_channel: updatedProps.is_channel !== undefined ? updatedProps.is_channel : !!targetRoom.is_channel,
            bg_image: updatedProps.bg_image !== undefined ? updatedProps.bg_image : (targetRoom.bg_image || 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=1200')
        };

        try {
            const updatePayload: any = {
                description: JSON.stringify(descriptor)
            };
            if (updatedProps.name !== undefined) {
                updatePayload.title = updatedProps.name;
            }

            const { error } = await supabase
                .from('live_streams')
                .update(updatePayload)
                .eq('id', targetRoom.id);

            if (error) throw error;

            // Instantly local-sync to avoid waiting for repl lag
            const freshRoomModel = {
                ...targetRoom,
                name: updatedProps.name !== undefined ? updatedProps.name : targetRoom.name,
                description: descriptor.desc,
                emoji: descriptor.emoji,
                expiry_days: descriptor.expiry_days,
                admins_list: descriptor.admins,
                admin_rights: descriptor.admin_rights,
                group_username: descriptor.group_username,
                is_channel: !!descriptor.is_channel,
                bg_image: descriptor.bg_image
            };

            setRooms(prev => prev.map(r => r.id === targetRoom.id ? freshRoomModel : r));
            if (activeRoom?.id === targetRoom.id) {
                setActiveRoom(freshRoomModel);
            }
            return true;
        } catch (e) {
            console.error("updateRoomDetailsInDatabase error:", e);
            return false;
        }
    };

    // Absolute deletion of room from Database
    const handleDeleteRoom = async (roomId: string) => {
        if (!user) return;
        if (window.confirm("Haqiqatan ham ushbu xonani o'chirib yubormoqchimisiz? Guruh egasining huquqi!")) {
            triggerTone('mute');
            try {
                const { error } = await supabase.from('live_streams').delete().eq('id', roomId);
                if (error) throw error;

                // Sync delete chat messages
                await supabase.from('live_chat_messages').delete().eq('stream_id', roomId);

                addNotification({
                    type: 'info',
                    title: 'Xona Tarqatildi',
                    message: 'Ushbu xona va undagi barcha xabarlar o\'chirib tashlandi.'
                });

                const list = await fetchRoomsFromSupabase();
                setRooms(list);
                if (list.length > 0) {
                    setActiveRoom(list[0]);
                } else {
                    setActiveRoom(null);
                }
            } catch (err) {
                console.error("handleDeleteRoom error:", err);
                addNotification({ type: 'error', title: 'Xatolik', message: 'Tizimda guruhni o\'chirishda muammo yuzaga keldi.' });
            }
        }
    };

    // Raw message posting logic
    const executeSendMessageRaw = async (roomId: string, messageBody: string) => {
        if (!user) {
            addNotification({ type: 'warning', title: 'Kirish', message: 'Muloqoteda qatnashish uchun profilga kiring.' });
            return;
        }

        try {
            const payload = {
                stream_id: roomId,
                user_id: user.id,
                username: userProfile?.username || user.email?.split('@')[0] || 'Animechi',
                avatar_url: userProfile?.avatar_url || '',
                message: messageBody,
                role: userProfile?.role || 'user',
                created_at: new Date().toISOString()
            };

            await sendLiveChatMessage(payload);
            triggerTone('send');
        } catch (e) {
            console.error("executeSendMessageRaw failed", e);
            addNotification({ type: 'error', title: 'Xatolik', message: 'Xabarni yuborib bo\'lmadi.' });
        }
    };

    // Standard Direct Message Sender
    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputText.trim() || !activeRoom) return;

        // Check if user is muted in this room
        const roomMutedList = mutedUsers[activeRoom.id] || [];
        if (roomMutedList.includes(user?.id)) {
            addNotification({ type: 'error', title: 'Cheklangan', message: 'Siz ushbu xonada yozishdan cheklangansiz (Mute).' });
            return;
        }

        const msgVal = inputText.trim();
        setInputText('');
        setShowEmojiPicker(false);

        if (showSchedulePicker && scheduleTime) {
            const sendAtDate = new Date(scheduleTime);
            if (sendAtDate <= new Date()) {
                addNotification({ type: 'warning', title: 'Xato vaqt', message: 'Kelajakdagi vaqtni kiriting.' });
                return;
            }

            const newScheduled: ScheduledMessage = {
                id: Math.random().toString(36).substring(2, 9),
                roomId: activeRoom.id,
                text: JSON.stringify({ type: 'text', text: msgVal }),
                type: 'text',
                sendAt: sendAtDate.toISOString()
            };

            setScheduledMessages(prev => [...prev, newScheduled]);
            setShowSchedulePicker(false);
            setScheduleTime('');
            addNotification({
                type: 'success',
                title: 'Rejalashtirildi!',
                message: `Xabar rejalashtirgan vaqtingizda yuboriladi: ${sendAtDate.toLocaleTimeString()}`
            });
            return;
        }

        // Direct Text Send
        await executeSendMessageRaw(activeRoom.id, JSON.stringify({
            type: 'text',
            text: msgVal
        }));
    };

    // Deleting single message
    const handleDeleteMessage = async (msgId: string) => {
        if (!user) return;
        if (!hasPermission(user.id, 'canDeleteMessages')) {
            addNotification({ type: 'error', title: 'Rad etildi', message: 'Xabarlarni o\'chirish vakolati sizda yo\'q.' });
            return;
        }

        triggerTone('mute');
        try {
            const { error } = await supabase.from('live_chat_messages').delete().eq('id', msgId);
            if (!error) {
                setMessages(prev => prev.filter(m => m.id !== msgId));
                addNotification({ type: 'info', title: 'O\'chirildi', message: 'Tizim xabari o\'chirildi.' });
            }
        } catch (e) {
            console.error("handleDeleteMessage DB error:", e);
        }
    };

    // Pin single message
    const handlePinMessage = (msg: LiveChatMessage) => {
        if (!user || !activeRoom) return;
        if (!hasPermission(user.id, 'canPinMessages')) {
            addNotification({ type: 'error', title: 'Cheklov', message: 'Xabarlarni pin qilish huquqi sizda mavjud emas.' });
            return;
        }

        triggerTone('click');
        const nextPinned = { ...pinnedMessages, [activeRoom.id]: msg };
        setPinnedMessages(nextPinned);
        localStorage.setItem('anilo_anime_chat_pinned', JSON.stringify(nextPinned));

        executeSendMessageRaw(activeRoom.id, JSON.stringify({
            type: 'system',
            text: `📌 @${msg.username} ning xabari guruh tepasiga qadaldi.`
        }));
        addNotification({ type: 'success', title: 'Qadaldi', message: 'Ushbu xabar pin paneliga o\'rnatildi.' });
    };

    const handleUnpin = () => {
        if (!activeRoom) return;
        triggerTone('click');
        const nextPinned = { ...pinnedMessages };
        delete nextPinned[activeRoom.id];
        setPinnedMessages(nextPinned);
        localStorage.setItem('anilo_anime_chat_pinned', JSON.stringify(nextPinned));
    };

    const addEmoji = (em: string) => {
        setInputText(prev => prev + em);
        triggerTone('click');
    };

    // Voice record audio notes
    const startRecording = async () => {
        if (!activeRoom || !user) return;
        if ((mutedUsers[activeRoom.id] || []).includes(user.id)) {
            addNotification({ type: 'error', title: 'Inkor etildi', message: 'Mikrofoningiz guruhda cheklangan (Mute).' });
            return;
        }

        triggerTone('click');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const audioChunks: Blob[] = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunks.push(e.data);
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const voiceFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });

                setUploadingVoice(true);
                addNotification({ type: 'info', title: 'Yuborilmoqda', message: 'Ovoz yuklanmoqda...' });

                try {
                    let audioUploadedUrl = '';
                    try {
                        audioUploadedUrl = await uploadFile(voiceFile, 'voice');
                    } catch (eBucket) {
                        audioUploadedUrl = await uploadFile(voiceFile, 'posters');
                    }

                    if (showSchedulePicker && scheduleTime) {
                        const sendAtDate = new Date(scheduleTime);
                        const scheduledVoice: ScheduledMessage = {
                            id: Math.random().toString(36).substring(2, 9),
                            roomId: activeRoom.id,
                            text: JSON.stringify({ type: 'voice', url: audioUploadedUrl, duration: recordingTime }),
                            type: 'voice',
                            sendAt: sendAtDate.toISOString()
                        };
                        setScheduledMessages(prev => [...prev, scheduledVoice]);
                        setShowSchedulePicker(false);
                        setScheduleTime('');
                        addNotification({ type: 'success', title: 'Ovoz rejalashtirildi', message: 'Kerakli vaqtda yuboriladi.' });
                    } else {
                        await executeSendMessageRaw(activeRoom.id, JSON.stringify({
                            type: 'voice',
                            url: audioUploadedUrl,
                            duration: recordingTime
                        }));
                    }
                } catch (err) {
                    console.error("Audio recording payload fail:", err);
                    addNotification({ type: 'error', title: 'Xatolik', message: 'Yuklash tizimida xatolik.' });
                } finally {
                    setUploadingVoice(false);
                    setRecordingTime(0);
                }

                stream.getTracks().forEach(tr => tr.stop());
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
            setRecordingTime(0);

            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (micErr) {
            console.error("Microphone check failed:", micErr);
            addNotification({ type: 'error', title: 'Ruxsat yo\'q', message: 'Mikrofon ruxsati rad etildi.' });
        }
    };

    const stopRecording = () => {
        triggerTone('click');
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        }
    };

    const togglePlayVoice = (url: string) => {
        triggerTone('click');
        if (currentlyPlayingAudio === url) {
            audioPlayerRef.current?.pause();
            setCurrentlyPlayingAudio(null);
        } else {
            if (audioPlayerRef.current) audioPlayerRef.current.pause();
            const voiceAudio = new Audio(url);
            voiceAudio.play();
            audioPlayerRef.current = voiceAudio;
            setCurrentlyPlayingAudio(url);
            voiceAudio.onended = () => {
                setCurrentlyPlayingAudio(null);
            };
        }
    };

    // Appoint or Revoke Admin on Database
    const handleOpenAssignAdmin = (prof: UserProfile) => {
        triggerTone('click');
        setSelectedUserForAdmin(prof);
        const existingAuths = activeRoom?.admin_rights?.[prof.id];
        if (existingAuths) {
            setEditingPermissions(existingAuths);
        } else {
            setEditingPermissions(DEFAULT_PERMISSIONS);
        }
        setShowAdminRightsModal(true);
    };

    const saveAdminPermissions = async () => {
        if (!activeRoom || !selectedUserForAdmin) return;

        triggerTone('click');
        const currentAdmins = activeRoom.admins_list ? [...activeRoom.admins_list] : [];
        if (!currentAdmins.includes(selectedUserForAdmin.id)) {
            currentAdmins.push(selectedUserForAdmin.id);
        }

        const nextRightsMap = {
            ...(activeRoom.admin_rights || {}),
            [selectedUserForAdmin.id]: editingPermissions
        };

        const success = await updateRoomDetailsInDatabase(activeRoom, {
            admins: currentAdmins,
            admin_rights: nextRightsMap
        });

        if (success) {
            executeSendMessageRaw(activeRoom.id, JSON.stringify({
                type: 'system',
                text: `🛡️ @${selectedUserForAdmin.username} ushbu xonada "Administrator" etib tayinlandi.`
            }));

            setShowAdminRightsModal(false);
            setSelectedUserForAdmin(null);
            addNotification({ type: 'success', title: 'Saqlandi', message: 'Adminlik huquqlari sozlandi.' });
        }
    };

    const removeAdmin = async (userId: string, userName: string) => {
        if (!activeRoom) return;
        triggerTone('mute');

        const currentAdmins = activeRoom.admins_list ? [...activeRoom.admins_list] : [];
        const nextAdmins = currentAdmins.filter(id => id !== userId);

        const nextRightsMap = { ...(activeRoom.admin_rights || {}) };
        delete nextRightsMap[userId];

        const success = await updateRoomDetailsInDatabase(activeRoom, {
            admins: nextAdmins,
            admin_rights: nextRightsMap
        });

        if (success) {
            executeSendMessageRaw(activeRoom.id, JSON.stringify({
                type: 'system',
                text: `⚠️ @${userName} guruhda adminlik huquqidan ozod qilindi.`
            }));
            addNotification({ type: 'info', title: 'Bekor qilindi', message: 'Admin huquqlari olib tashlandi.' });
        }
    };

    const handleMuteUserToggle = (userId: string, userName: string) => {
        if (!activeRoom) return;
        triggerTone('mute');

        const currentMuted = mutedUsers[activeRoom.id] || [];
        const isCurrentlyMuted = currentMuted.includes(userId);

        let nextMuted: string[];
        if (isCurrentlyMuted) {
            nextMuted = currentMuted.filter(id => id !== userId);
            addNotification({ type: 'success', title: 'Ovoz ochildi', message: `${userName} yoza oladi.` });
            executeSendMessageRaw(activeRoom.id, JSON.stringify({
                type: 'system',
                text: `🔊 @${userName} ning xabar yozish huquqi tiklandi.`
            }));
        } else {
            nextMuted = [...currentMuted, userId];
            addNotification({ type: 'info', title: 'Muted', message: `${userName} xabar yza olmaydi.` });
            executeSendMessageRaw(activeRoom.id, JSON.stringify({
                type: 'system',
                text: `🔇 @${userName} ogohlantirishga qaramay qoida buzgani sababli cheklandi.`
            }));
        }

        const nextMutedMap = { ...mutedUsers, [activeRoom.id]: nextMuted };
        setMutedUsers(nextMutedMap);
        localStorage.setItem('anilo_anime_chat_muted', JSON.stringify(nextMutedMap));
    };

    // Holographic visual spectrum animation for Video conferences
    const handleToggleVideoChat = () => {
        triggerTone('join');
        if (isVideoChatActive) {
            setIsVideoChatActive(false);
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        } else {
            if (!hasPermission(user?.id || '', 'canStartVideoChat')) {
                addNotification({ type: 'error', title: 'Rad etildi', message: 'Video konferensiya yaratish huquqingiz yo\'q.' });
                return;
            }

            setIsVideoChatActive(true);
            const attendees = [
                { id: user?.id || 'host', username: userProfile?.username || 'Siz (Host)', color: '#f97316' },
                { id: 'u_asuka', username: 'Asuka_Soryu', color: '#ec4899' },
                { id: 'u_kaneki', username: 'Kaneki_Ken', color: '#6366f1' },
                { id: 'u_frieren', username: 'Frieren_Elf', color: '#10b981' }
            ];
            setVideoParticipants(attendees);

            setTimeout(() => {
                const canvas = videoCanvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                const drawLoop = () => {
                    ctx.fillStyle = '#060608';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Glowing digital circles
                    ctx.strokeStyle = 'rgba(249, 115, 22, 0.04)';
                    ctx.lineWidth = 1;
                    const centerPointX = canvas.width / 2;
                    const centerPointY = canvas.height / 2;
                    for (let r = 20; r < 140; r += 20) {
                        ctx.beginPath();
                        ctx.arc(centerPointX, centerPointY, r, 0, Math.PI * 2);
                        ctx.stroke();
                    }

                    // Rotating hologram pointer
                    ctx.strokeStyle = 'rgba(249, 115, 22, 0.15)';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    const angle = (Date.now() * 0.001) % (Math.PI * 2);
                    ctx.moveTo(centerPointX, centerPointY);
                    ctx.lineTo(centerPointX + Math.cos(angle) * 110, centerPointY + Math.sin(angle) * 110);
                    ctx.stroke();

                    // Wave lines
                    ctx.lineWidth = 2.5;
                    const waves = 3;
                    for (let w = 0; w < waves; w++) {
                        ctx.beginPath();
                        ctx.strokeStyle = w === 0 ? 'rgba(249, 115, 22, 0.75)' : (w === 1 ? 'rgba(168, 85, 247, 0.55)' : 'rgba(59, 130, 246, 0.45)');
                        ctx.shadowColor = w === 0 ? '#f97316' : '#a855f7';
                        ctx.shadowBlur = microphoneOn ? 8 : 1;

                        const speed = Date.now() * 0.005 * (w + 1);
                        for (let x = 0; x < canvas.width; x++) {
                            const amp = 14 + Math.sin(Date.now() * 0.002) * 6;
                            const y = centerPointY + Math.sin(x * 0.015 + speed) * amp * (microphoneOn ? 1.2 : 0.04);
                            if (x === 0) ctx.moveTo(x, y);
                            else ctx.lineTo(x, y);
                        }
                        ctx.stroke();
                    }
                    ctx.shadowBlur = 0;

                    ctx.fillStyle = '#f97316';
                    ctx.font = '9px monospace';
                    ctx.fillText(`ANILO VOICE CORE LINK: ENCRYPTED ACTIVE`, 12, 18);
                    ctx.fillText(`MIC AMPLITUDE SENSOR: ${microphoneOn ? 'TRANSMITTING' : 'MUTED'}`, 12, 28);

                    animationFrameRef.current = requestAnimationFrame(drawLoop);
                };
                drawLoop();
            }, 200);

            executeSendMessageRaw(activeRoom.id, JSON.stringify({
                type: 'system',
                text: `📹 @${userProfile?.username || 'Owner'} video chat xonasini muvaffaqiyatli ishga tushirdi!`
            }));
        }
    };

    const parsePayload = (messageText: string) => {
        try {
            const dataObj = JSON.parse(messageText);
            if (dataObj && typeof dataObj === 'object') {
                return dataObj;
            }
        } catch(e) {}
        return { type: 'text', text: messageText };
    };

    const activeAdminList = activeRoom ? (activeRoom.admins_list || []) : [];

    return (
        <div className="max-w-7xl mx-auto w-full px-2 sm:px-4 md:px-6 pt-10 pb-8 animate-fade-in">
            <div className="flex h-[calc(100vh-16rem)] min-h-[520px] w-full overflow-hidden rounded-[1.8rem] border border-zinc-900 bg-[#07070a] shadow-2xl relative select-none text-gray-200 md:mb-10">
            
            {/* SIDEBAR: Group channels feed */}
            <div className={`w-80 border-r border-[#15151a] flex flex-col bg-[#0a0a0d] shrink-0 transition-transform md:translate-x-0 absolute md:relative z-40 h-full ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:block'}`}>
                
                {/* Header title */}
                <div className="p-5 border-b border-[#141419] flex items-center justify-between bg-[#0a0a0d]/80 backdrop-blur-xl">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-gradient-to-br from-orange-500/20 to-purple-500/20 border border-orange-500/20 rounded-xl flex items-center justify-center">
                            <MessageSquare className="text-orange-500" size={17} />
                        </div>
                        <div>
                            <h2 className="text-xs font-black uppercase tracking-wider text-white">Anilo Chat</h2>
                            <p className="text-[9px] font-black text-zinc-550 uppercase tracking-widest leading-none mt-0.5">Hamjamiyat</p>
                        </div>
                    </div>

                    <button 
                        onClick={() => handleButtonClickWithSound(() => setSoundEnabled(!soundEnabled))}
                        className={`p-2 rounded-xl border transition-all ${soundEnabled ? 'border-orange-500/20 bg-orange-500/5 text-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.1)]' : 'border-zinc-800/80 text-zinc-650 hover:text-zinc-400'}`}
                        title={soundEnabled ? "Tovushlarni o'chirish" : "Tovushlarni yoqish"}
                    >
                        {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                    </button>
                </div>

                {/* Create Room Button - Available for all dynamic users */}
                <div className="p-4 border-b border-[#141419]/50">
                    <button 
                        onClick={() => handleButtonClickWithSound(() => setShowNewRoomModal(true))}
                        className="w-full bg-gradient-to-r from-orange-600/10 to-purple-600/10 hover:from-orange-600/20 hover:to-purple-600/20 text-orange-400 py-3 px-4 rounded-xl border border-orange-500/20 hover:border-orange-500/40 font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={14} />
                        <span>Yangi Guruh Yaratish</span>
                    </button>
                    <p className="text-[8px] text-zinc-600 font-extrabold text-center uppercase tracking-widest mt-2 leading-none">
                        Siz yaratgan guruh egasi bo'lasiz!
                    </p>
                </div>

                {/* Rooms scrollable list */}
                <div className={`flex-1 overflow-y-auto px-2 py-4 space-y-1 ${customScrollbarClass}`}>
                    <div className="flex items-center gap-2 px-3 mb-2.5">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Muloqot xonalari</p>
                    </div>

                    {loadingRooms ? (
                        <div className="p-6 text-center space-y-2">
                            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <span className="text-[10px] text-zinc-550 uppercase tracking-wider font-bold">Yuklanmoqda...</span>
                        </div>
                    ) : (
                        rooms.map(room => {
                            const isSelected = activeRoom?.id === room.id;
                            const isCreator = user && room.creator_id === user.id;

                            return (
                                <div 
                                    key={room.id}
                                    onClick={() => handleButtonClickWithSound(() => setActiveRoom(room))}
                                    className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-gradient-to-r from-orange-600/10 to-transparent border-orange-500/25 text-white shadow-sm' : 'border-transparent text-zinc-440 hover:text-zinc-200 hover:bg-zinc-900/30'}`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="text-base shrink-0 p-1.5 bg-zinc-900 border border-zinc-850 rounded-lg">{room.emoji}</span>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <p className="text-xs font-black truncate leading-none text-white/90">#{room.name}</p>
                                                {isCreator && (
                                                    <span className="text-[8px] px-1 bg-orange-600/20 text-orange-400 font-extrabold rounded">Sizniki</span>
                                                )}
                                            </div>
                                            <p className="text-[9px] text-zinc-500 truncate mt-1 leading-none">{room.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0 bg-zinc-950 px-1.5 py-0.5 rounded-md border border-zinc-900">
                                        <Clock size={9} className="text-zinc-650" />
                                        <span className="text-[8px] font-bold text-zinc-500">{room.expiry_days}d</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer authorization badge user settings */}
                <div className="p-4 border-t border-[#141419] bg-[#09090c] flex items-center justify-between">
                    {user ? (
                        <div className="flex items-center gap-2.5 min-w-0 w-full">
                            <div className="w-8 h-8 rounded-full border border-zinc-800 overflow-hidden bg-zinc-900 shrink-0 relative">
                                {userProfile?.avatar_url ? (
                                    <img src={userProfile.avatar_url} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-black text-[10px] text-orange-500 bg-orange-500/5">
                                        {userProfile?.username?.[0]?.toUpperCase() || 'A'}
                                    </div>
                                )}
                                <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border-2 border-black rounded-full"></span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-black text-white truncate leading-none">@{userProfile?.username || 'Username'}</p>
                                <div className="flex items-center gap-1 mt-1 leading-none">
                                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 font-black uppercase tracking-wider">
                                        {userProfile?.role || 'user'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-zinc-550 py-1">
                            <Info size={13} />
                            <span className="text-[10px] font-black uppercase tracking-widest italic">Mehmon Rejimi</span>
                        </div>
                    )}
                </div>
            </div>

            {/* CENTRAL WORKSPACE: Viewport streams chat */}
            <div 
                className="flex-1 flex flex-col h-full relative overflow-hidden transition-all duration-500"
                style={{
                    backgroundImage: `linear-gradient(rgba(10, 10, 13, 0.82), rgba(8, 8, 10, 0.88)), url(${activeRoom?.bg_image || 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=1200'})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                
                {/* Active Room Title header bar */}
                <div className="h-16 px-6 border-b border-[#141419] flex items-center justify-between bg-[#0a0a0d] shrink-0 z-30">
                    <div className="flex items-center gap-3 min-w-0">
                        <button 
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="md:hidden text-zinc-400 p-2 hover:bg-zinc-800/40 rounded-lg transition-colors border border-zinc-850 shrink-0"
                        >
                            <MessageSquare size={16} />
                        </button>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-base p-1.5 bg-zinc-900 border border-zinc-850 rounded-lg shrink-0">{activeRoom?.emoji || '🔥'}</span>
                                <h1 className="text-sm md:text-base font-black uppercase text-white tracking-tight truncate">
                                    #{activeRoom?.name || 'muloqot'}
                                </h1>
                                {activeRoom && user && activeRoom.creator_id === user.id && (
                                    <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0">Siz Egasiz (Owner)</span>
                                )}
                                {activeRoom && user && activeAdminList.includes(user.id) && activeRoom.creator_id !== user.id && (
                                    <span className="bg-purple-500/10 border border-purple-500/20 text-purple-400 font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0">Adminstrator</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {/* Video Conference Activator */}
                        {activeRoom && (
                            <button 
                                onClick={handleToggleVideoChat}
                                className={`px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 border transition-all ${isVideoChatActive ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-650/10 animate-pulse' : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-850 hover:border-orange-500/20 text-[#f97316]'}`}
                            >
                                <Video size={12} fill="currentColor" />
                                <span className="hidden sm:inline">{isVideoChatActive ? 'Tugallash' : 'Video Konf'}</span>
                            </button>
                        )}

                        {activeRoom && (
                            <button 
                                onClick={() => handleButtonClickWithSound(() => setShowParticipantsPanel(!showParticipantsPanel))}
                                className={`p-2 rounded-xl border transition-all ${showParticipantsPanel ? 'border-orange-500 text-orange-500 bg-orange-500/5' : 'border-zinc-800 bg-zinc-900 text-zinc-450 hover:text-white'}`}
                                title="A'zolar ro'yxati"
                            >
                                <Users size={15} />
                            </button>
                        )}

                        {activeRoom && (
                            <button 
                                onClick={() => handleButtonClickWithSound(() => setShowSettingsPanel(!showSettingsPanel))}
                                className={`p-2 rounded-xl border transition-all ${showSettingsPanel ? 'border-orange-500 text-orange-500 bg-orange-500/5' : 'border-zinc-800 bg-zinc-900 text-zinc-450 hover:text-white'}`}
                                title="Guruh Sozlamalari"
                            >
                                <Settings size={15} />
                            </button>
                        )}
                    </div>
                </div>

                {/* PINNED ANNOUNCEMENT ROW BAR */}
                {activeRoom && pinnedMessages[activeRoom.id] && (
                    <div className="bg-orange-500/5 border-b border-orange-500/10 px-6 py-2 flex items-center justify-between z-20 shrink-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <Pin size={11} className="text-orange-500 shrink-0" />
                            <div className="min-w-0 leading-none">
                                <span className="text-[8px] font-black uppercase text-orange-500/80 tracking-wider">Ehtiyoj pin xabari</span>
                                <p className="text-xs text-zinc-330 truncate font-bold mt-1 max-w-xl">
                                    {parsePayload(pinnedMessages[activeRoom.id].message).text || 'Ovozli / Audio yozma'}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={handleUnpin}
                            className="p-1 text-zinc-550 hover:text-white rounded transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                {/* VIDEO CHAT SCREEN BLOCK */}
                {isVideoChatActive && (
                    <div className="bg-[#050508] border-b border-zinc-900/50 p-4 shrink-0 z-20">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch h-52">
                            
                            {/* Spectrum block dynamic soundwave */}
                            <div className="lg:col-span-2 bg-[#060608] border border-orange-500/15 rounded-2xl relative overflow-hidden flex items-center justify-center">
                                <canvas ref={videoCanvasRef} className="w-full h-full block" width={420} height={180} />
                                <div className="absolute top-3 right-3 bg-red-600/10 border border-red-500/20 px-2 py-0.5 rounded-md flex items-center gap-1.5 text-red-500 animate-pulse text-[8px] font-bold uppercase tracking-widest">
                                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                                    <span>Live Connection</span>
                                </div>
                            </div>

                            {/* Attending users details */}
                            <div className="bg-zinc-950/40 border border-zinc-900 p-4 rounded-xl flex flex-col justify-between">
                                <div className="space-y-1.5">
                                    <h3 className="text-[10px] font-black text-white uppercase tracking-wider mb-2 leading-none flex items-center gap-1">
                                        <Sparkles size={11} className="text-orange-500 animate-spin" />
                                        <span>Konferensiya ishtirokchilari</span>
                                    </h3>
                                    <div className="space-y-1 overflow-y-auto max-h-24 scrollbar-none">
                                        {videoParticipants.map(us => (
                                            <div key={us.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-zinc-900/40 border border-zinc-900 flex-row">
                                                <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] text-white font-extrabold" style={{ backgroundColor: us.color }}>
                                                    {us.username[0]}
                                                </div>
                                                <span className="text-[9px] font-black text-zinc-300 truncate">@{us.username}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-900/80">
                                    <button 
                                        onClick={() => handleButtonClickWithSound(() => setCameraOn(!cameraOn))}
                                        className={`flex-1 py-1.5 rounded-lg border font-black text-[8px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${cameraOn ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-red-950/20 border-red-500/20 text-red-400'}`}
                                    >
                                        Camera
                                    </button>
                                    <button 
                                        onClick={() => handleButtonClickWithSound(() => setMicrophoneOn(!microphoneOn))}
                                        className={`flex-1 py-1.5 rounded-lg border font-black text-[8px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${microphoneOn ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-red-950/20 border-red-500/20 text-red-400'}`}
                                    >
                                        Mic
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* MESSAGES FLOW STREAM PORT */}
                <div className={`flex-1 overflow-y-auto p-5 space-y-4 ${customScrollbarClass}`}>
                    {activeRoom && messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto animate-fade-in">
                            <div className="w-14 h-14 bg-gradient-to-br from-zinc-900 to-[#15151a] border border-zinc-850 rounded-[1.2rem] flex items-center justify-center mb-4 text-zinc-600 shadow-xl">
                                <MessageSquare size={22} className="animate-bounce" />
                            </div>
                            <h3 className="text-xs font-black text-white uppercase tracking-tight">Xabarlar tarixi bo'sh</h3>
                            <p className="text-[10px] text-zinc-550 leading-relaxed mt-2 uppercase tracking-wide">
                                Birinchi bo'lib suhbatni boshlang. Ushbu xonada barcha xabarlar {activeRoom.expiry_days} kundan keyin butunlay tozalanadi!
                            </p>
                        </div>
                    ) : (
                        messages.map((m, idx) => {
                            const isMyMessage = m.user_id === user?.id;
                            const payload = parsePayload(m.message);

                            // System room changes message representation
                            if (payload.type === 'system') {
                                return (
                                    <div key={m.id || idx} className="flex justify-center my-2 text-center animate-fade-in">
                                        <div className="bg-[#15151a]/40 border border-zinc-900 rounded-xl px-4 py-1.5 text-[9px] font-bold text-zinc-500 flex items-center gap-2 max-w-md shadow-inner leading-none uppercase tracking-wide">
                                            <span>{payload.text}</span>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={m.id || m.created_at || idx} className={`flex gap-3 max-w-lg group relative ${isMyMessage ? 'ml-auto flex-row-reverse' : ''} animate-slide-up`}>
                                    
                                    {/* User Profil picture avatar */}
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-900 border border-zinc-850 shrink-0 select-none">
                                        {m.avatar_url ? (
                                            <img src={m.avatar_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-black text-[10px] text-orange-400 bg-orange-500/5">
                                                {m.username?.[0]?.toUpperCase() || 'A'}
                                            </div>
                                        )}
                                    </div>

                                    {/* Message speech and meta stack */}
                                    <div className="space-y-1.5 min-w-0">
                                        <div className={`flex items-center gap-2 ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <span className="text-[10px] font-black text-zinc-400">@{m.username}</span>
                                            
                                            {/* Prestigy badge tags */}
                                            {activeRoom && activeRoom.creator_id === m.user_id ? (
                                                <span className="bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[7px] font-black px-1.5 py-0.5 rounded uppercase leading-none">Ega</span>
                                            ) : (activeRoom && activeRoom.admins_list?.includes(m.user_id) ? (
                                                <span className="bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[7px] font-black px-1.5 py-0.5 rounded uppercase leading-none">Admin</span>
                                            ) : (m.role === 'owner' ? (
                                                <span className="bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-[7px] font-black px-1.5 py-0.5 rounded uppercase leading-none font-sans">Owner</span>
                                            ) : null))}
                                        </div>

                                        {/* Physical bubble package */}
                                        <div className={`p-3.5 rounded-[1.3rem] shadow-lg relative border ${isMyMessage ? 'bg-gradient-to-br from-orange-600 to-orange-700 border-orange-500 text-white rounded-tr-none' : 'bg-[#0f0f13] border-zinc-900 text-zinc-300 rounded-tl-none'}`}>
                                            {payload.type === 'text' && (
                                                <p className="text-xs font-bold leading-relaxed whitespace-pre-wrap select-text">
                                                    {payload.text}
                                                </p>
                                            )}

                                            {payload.type === 'voice' && (
                                                <div className="flex items-center gap-3.5 py-1 min-w-[170px]">
                                                    <button 
                                                        onClick={() => togglePlayVoice(payload.url)}
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${isMyMessage ? 'bg-white text-orange-600 border-white shadow' : 'bg-orange-650 hover:bg-orange-600 text-white border-orange-500/30 shadow'}`}
                                                    >
                                                        {currentlyPlayingAudio === payload.url ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" className="ml-0.5" />}
                                                    </button>
                                                    <div className="flex-1 leading-none">
                                                        <div className="flex items-center gap-0.5 h-4 mb-2">
                                                            {Array.from({ length: 14 }).map((_, bIdx) => {
                                                                const h = Math.abs(Math.sin((bIdx + idx) * 0.8)) * 100;
                                                                return (
                                                                    <div 
                                                                        key={bIdx}
                                                                        className={`w-0.5 rounded-full ${currentlyPlayingAudio === payload.url ? 'animate-pulse' : ''} ${isMyMessage ? 'bg-white/60' : 'bg-orange-500/50'}`}
                                                                        style={{ height: `${20 + h % 60}%` }}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                        <div className="flex justify-between items-center text-[7px] uppercase font-black tracking-wider opacity-60">
                                                            <span>Ovozlik</span>
                                                            <span>0:{payload.duration < 10 ? '0' + payload.duration : payload.duration}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <p className={`text-[8px] text-right mt-2 opacity-50 font-bold ${isMyMessage ? 'text-white' : 'text-zinc-550'}`}>
                                                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action over lay hover */}
                                    {user && (
                                        <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 ${isMyMessage ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'}`}>
                                            {hasPermission(user.id, 'canPinMessages') && (
                                                <button 
                                                    onClick={() => handlePinMessage(m)}
                                                    className="p-1 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-zinc-550 hover:text-orange-500 rounded-md transition-colors"
                                                    title="Mahkamlash"
                                                >
                                                    <Pin size={11} />
                                                </button>
                                            )}
                                            {hasPermission(user.id, 'canDeleteMessages') && (
                                                <button 
                                                    onClick={() => handleDeleteMessage(m.id)}
                                                    className="p-1 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-zinc-555 hover:text-red-500 rounded-md transition-colors"
                                                    title="O'chirish"
                                                >
                                                    <Trash2 size={11} />
                                                </button>
                                            )}
                                        </div>
                                    )}

                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* INPUT CONTROL CONTROLLER DRAWER BAR */}
                <div className="p-4 bg-[#0a0a0d] border-t border-[#141419] shrink-0 z-30">
                    {user ? (
                        <div className="relative">
                            
                            {/* Emoji Picker Overlay */}
                            {showEmojiPicker && (
                                <div className="absolute bottom-[4.5rem] left-0 bg-[#0c0c10] border border-zinc-850 rounded-xl p-3 shadow-2xl z-50 flex flex-wrap gap-2 max-w-xs scale-95 origin-bottom-left transition-transform duration-150">
                                    {['😀', '😂', '🔥', '✨', '🗡️', '🍜', '👑', '😎', '💀', '💖', '👍', '👀', '💢', '🌟'].map(em => (
                                        <button 
                                            key={em} 
                                            onClick={() => addEmoji(em)}
                                            className="text-lg hover:scale-125 transition-transform p-1.5 hover:bg-zinc-900 rounded-lg cursor-pointer"
                                        >
                                            {em}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Scheduled Timer bar Overlay */}
                            {showSchedulePicker && (
                                <div className="absolute bottom-[4.5rem] right-0 bg-[#0c0c10] border border-zinc-850 rounded-xl p-4 shadow-2xl z-50 max-w-xs space-y-3">
                                    <h4 className="text-[9px] font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                                        <Calendar size={12} className="text-orange-500" />
                                        <span>Xabarni Rejalashtirish</span>
                                    </h4>
                                    <input 
                                        type="datetime-local" 
                                        value={scheduleTime} 
                                        onChange={e => setScheduleTime(e.target.value)}
                                        className="w-full bg-zinc-900 text-xs border border-zinc-800 rounded-lg p-2 text-white outline-none focus:border-orange-500" 
                                    />
                                    <div className="flex gap-2">
                                        <button 
                                            type="button"
                                            onClick={() => setShowSchedulePicker(false)}
                                            className="flex-1 py-1.5 bg-zinc-900 rounded-lg text-[8px] font-black uppercase text-zinc-500 border border-zinc-850"
                                        >
                                            Yopish
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                if (scheduleTime) {
                                                    addNotification({ type: 'info', title: 'Sozlandi', message: 'Yuborish joriy vaqti belgilandi.' });
                                                }
                                            }}
                                            className="flex-1 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-[8px] font-black uppercase"
                                        >
                                            Muhofaza ok
                                        </button>
                                     </div>
                                 </div>
                             )}

                             {(!activeRoom?.is_channel || (user && (activeRoom.creator_id === user.id || activeAdminList.includes(user.id) || ['admin', 'owner'].includes(userProfile?.role || '')))) ? (
                                <form onSubmit={handleSendMessage} className="flex gap-2.5 items-center">
                                    <button 
                                        type="button"
                                        onClick={() => handleButtonClickWithSound(() => setShowEmojiPicker(!showEmojiPicker))}
                                        className={`p-3 rounded-xl border transition-all ${showEmojiPicker ? 'border-orange-500 bg-orange-500/5 text-orange-500' : 'border-zinc-850 bg-zinc-900/60 text-zinc-450 hover:text-white'}`}
                                    >
                                        <Smile size={16} />
                                    </button>

                                    <button 
                                        type="button"
                                        onClick={() => handleButtonClickWithSound(() => setShowSchedulePicker(!showSchedulePicker))}
                                        className={`p-3 rounded-xl border transition-all ${showSchedulePicker ? 'border-orange-500 bg-orange-500/5 text-orange-500' : 'border-zinc-850 bg-zinc-900/60 text-zinc-450 hover:text-white'}`}
                                        title="Xabarni keyinga qoldirish"
                                    >
                                        <Calendar size={16} />
                                    </button>

                                    <div className="flex-1 relative min-w-0">
                                        {isRecording ? (
                                            <div className="w-full bg-red-950/20 border border-red-500/20 rounded-xl px-4 h-11 flex items-center justify-between text-red-500 animate-pulse text-[10px]">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
                                                    <span className="font-extrabold uppercase tracking-widest">OVOZ YOZILYAPTI...</span>
                                                </div>
                                                <span className="font-mono font-black text-xs">00:{recordingTime < 10 ? '0' + recordingTime : recordingTime}</span>
                                            </div>
                                        ) : (
                                            <input 
                                                type="text"
                                                value={inputText}
                                                onChange={e => setInputText(e.target.value)}
                                                placeholder="Guruhga xabar yuborish..."
                                                className="w-full bg-zinc-900 border border-zinc-850 focus:border-orange-500 rounded-xl px-4 h-11 text-xs md:text-sm text-white outline-none placeholder:text-zinc-600 focus:ring-1 focus:ring-orange-500/20 transition-all leading-none"
                                            />
                                        )}
                                    </div>

                                    {inputText.trim() === '' ? (
                                        <button 
                                            type="button"
                                            onClick={isRecording ? stopRecording : startRecording}
                                            disabled={uploadingVoice}
                                            className={`p-3 rounded-xl border transition-all shrink-0 ${isRecording ? 'bg-red-600 border-red-500 text-white animate-bounce' : 'bg-orange-500/5 border-orange-500/20 text-orange-400 hover:bg-orange-650 hover:text-white'}`}
                                        >
                                            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                                        </button>
                                    ) : (
                                        <button 
                                            type="submit"
                                            className="bg-orange-600 hover:bg-orange-500 text-white p-3 rounded-xl transition-all shadow-md shrink-0 border border-orange-500"
                                        >
                                            <Send size={15} />
                                        </button>
                                    )}
                                </form>
                            ) : (
                                <div className="p-3 bg-zinc-950/80 border border-zinc-900/60 rounded-xl text-center flex items-center justify-center gap-2">
                                    <Shield className="text-purple-500 animate-pulse" size={13} />
                                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold font-mono">Ushbu kanalga faqat administratorlar xabar yozishi mumkin.</span>
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className="p-3 bg-zinc-950/50 border border-zinc-900 rounded-xl text-center">
                            <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-black">Xabar yozish uchun profilizga kirishingiz lozim.</span>
                        </div>
                    )}
                </div>

            </div>

            {/* PANEL: EXPIRE SETTINGS DRAWER */}
            {showSettingsPanel && activeRoom && (
                <div className="w-80 border-l border-[#141419] bg-[#0a0a0d] flex flex-col shrink-0 animate-slide-left z-40 relative">
                    <div className="p-4 border-b border-[#141419] flex items-center justify-between bg-zinc-950/40">
                        <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 leading-none">
                            <Shield className="text-orange-500 animate-pulse" size={13} />
                            <span>Guruh Boshqaruvchisi</span>
                        </h3>
                        <button onClick={() => setShowSettingsPanel(false)} className="text-zinc-550 hover:text-white">
                            <X size={15} />
                        </button>
                    </div>

                    <div className={`flex-1 overflow-y-auto p-4 space-y-5 ${customScrollbarClass}`}>
                        
                        {/* Expiry detail change section */}
                        <div className="bg-zinc-950/50 border border-zinc-900 p-4 rounded-xl">
                            <h4 className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-1">Xabarlar tozalanish muddati</h4>
                            <p className="text-[10px] text-zinc-500 leading-normal mb-3">
                                Guruhimizdagi xabarlar xotirasini band qilmaslik maqsadida <span className="text-white font-extrabold">{activeRoom.expiry_days} kun</span> ichida avto-tozalanadi.
                            </p>

                            {user && (activeRoom.creator_id === user.id || userProfile?.role === 'owner') && (
                                <div className="mt-2.5 pt-2 border-t border-zinc-900/60">
                                    <span className="text-[8px] text-zinc-550 font-black uppercase tracking-wider">Muddatni qiymatlang (kunlar)</span>
                                    <div className="grid grid-cols-5 gap-1 mt-1.5">
                                        {[1, 2, 3, 4, 5].map(day => (
                                            <button 
                                                key={day}
                                                type="button"
                                                onClick={async () => {
                                                    triggerTone('click');
                                                    const ok = await updateRoomDetailsInDatabase(activeRoom, { expiry_days: day });
                                                    if (ok) addNotification({ type: 'success', title: 'Saqlandi', message: `Xabarlar muddati ${day} kunga sozlandi.` });
                                                }}
                                                className={`py-1 rounded text-xs font-black text-center border transition-all ${activeRoom.expiry_days === day ? 'bg-orange-600/15 border-orange-500/30 text-orange-400 shadow-sm' : 'bg-zinc-900/50 border-zinc-850 text-zinc-600 hover:text-zinc-200'}`}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Guruh parametrlarini tahrirlash */}
                        {user && (activeRoom.creator_id === user.id || userProfile?.role === 'owner') && (
                            <div className="bg-zinc-950/50 border border-zinc-900/85 p-4 rounded-xl space-y-3">
                                <h4 className="text-[9px] font-black text-orange-400 uppercase tracking-widest leading-none flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                    Guruh sozlamalari (Supabase)
                                </h4>
                                
                                <div className="space-y-2.5">
                                    <div>
                                        <label className="text-[7.5px] font-black text-zinc-550 uppercase block mb-1">Guruh nomi</label>
                                        <input 
                                            type="text" 
                                            value={editRoomTitle}
                                            onChange={e => setEditRoomTitle(e.target.value)}
                                            placeholder="Masalan: Shingeki Muhokamasi"
                                            className="w-full bg-[#131318] border border-zinc-850 focus:border-orange-500 rounded-lg p-2.5 text-xs text-white outline-none" 
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[7.5px] font-black text-zinc-550 uppercase block mb-1">Mavzu yoki Tavsif</label>
                                        <textarea
                                            value={editRoomDesc || ''}
                                            onChange={e => setEditRoomDesc(e.target.value)}
                                            placeholder="Tavsif kiriting..."
                                            rows={2}
                                            className="w-full bg-[#131318] border border-zinc-850 focus:border-orange-500 rounded-lg p-2.5 text-xs text-white outline-none resize-none leading-normal" 
                                        />
                                    </div>

                                    <div>
                                        <span className="text-[7.5px] font-black text-zinc-555 uppercase block mb-1">Xabar yozish ruxsati</span>
                                        <div className="grid grid-cols-2 gap-1.5 mt-1">
                                            <button
                                                type="button"
                                                onClick={() => { triggerTone('click'); setEditRoomIsChannel(false); }}
                                                className={`py-1.5 px-2 rounded-lg border text-[8.5px] font-black uppercase tracking-wider transition-all text-center ${!editRoomIsChannel ? 'bg-orange-600/15 border-orange-500/40 text-orange-400' : 'bg-[#131318] border-zinc-900 text-zinc-550 hover:text-zinc-300'}`}
                                            >
                                                👥 Guruh (Barcha)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { triggerTone('click'); setEditRoomIsChannel(true); }}
                                                className={`py-1.5 px-2 rounded-lg border text-[8.5px] font-black uppercase tracking-wider transition-all text-center ${editRoomIsChannel ? 'bg-purple-600/15 border-purple-500/40 text-purple-400' : 'bg-[#131318] border-zinc-900 text-zinc-550 hover:text-zinc-300'}`}
                                            >
                                                📢 Kanal (Admin)
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <span className="text-[7.5px] font-black text-zinc-555 uppercase block mb-1">Fon rasmini tanlang</span>
                                        <div className="flex gap-2 items-center mt-1">
                                            {[
                                                { name: 'Kosmos', url: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=1200' },
                                                { name: 'Yulduz', url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=1200' },
                                                { name: 'Tungi sakura', url: 'https://images.unsplash.com/photo-1522441815192-d9f04eb0615c?q=80&w=1200' },
                                                { name: 'Kiber', url: 'https://images.unsplash.com/photo-1545239351-ef35f43d514b?q=80&w=1200' }
                                            ].map(img => (
                                                <button
                                                    key={img.name}
                                                    type="button"
                                                    onClick={() => { triggerTone('click'); setEditRoomBgImage(img.url); }}
                                                    className={`relative w-8 h-8 rounded-full overflow-hidden border-2 transition-all ${editRoomBgImage === img.url ? 'border-orange-500 scale-105 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'border-zinc-900 hover:border-zinc-700'}`}
                                                    title={img.name}
                                                >
                                                    <img src={img.url} className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <button
                                        type="button"
                                        onClick={handleSaveRoomEdits}
                                        className="w-full mt-2.5 py-2.5 bg-orange-600 hover:bg-orange-500 active:scale-[0.98] text-white rounded-lg font-black text-[9px] uppercase tracking-widest transition-all shadow-md"
                                    >
                                        O'zgarishlarni Saqlash
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Admins listing */}
                        <div className="space-y-2.5">
                            <h4 className="text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-1 leading-none">
                                <ShieldCheck size={12} className="text-green-500" />
                                <span>Guruh adminstratorlari (Realtime)</span>
                            </h4>
                            {activeAdminList.length === 0 ? (
                                <span className="text-[10px] text-zinc-650 italic block">Guruhda hali administrator tayinlanmadi.</span>
                            ) : (
                                <div className="space-y-1.5">
                                    {getActiveParticipants().filter(p => activeAdminList.includes(p.id)).map(adm => (
                                        <div key={adm.id} className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-xl border border-zinc-900 flex-row">
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-white truncate leading-none">@{adm.username}</p>
                                                <span className="text-[8px] text-zinc-550 inline-block uppercase mt-1">Admin vakolati</span>
                                            </div>
                                            
                                            {user && (activeRoom.creator_id === user.id || userProfile?.role === 'owner') && (
                                                <div className="flex gap-1 shrink-0">
                                                    <button 
                                                        onClick={() => handleOpenAssignAdmin(adm)}
                                                        className="p-1.5 border border-zinc-850 bg-zinc-900 rounded-lg text-zinc-400 hover:text-white text-[9px]"
                                                        title="Haqlarini tahrirlash"
                                                    >
                                                        Huquqlar
                                                    </button>
                                                    <button 
                                                        onClick={() => removeAdmin(adm.id, adm.username)}
                                                        className="p-1 px-1.5 border border-red-900/30 bg-red-950/20 text-red-400 rounded-lg hover:bg-red-950/40"
                                                        title="Ruxsadini qaytarib olish"
                                                    >
                                                        Revoke
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Add Admin allocation */}
                        {user && (activeRoom.creator_id === user.id || userProfile?.role === 'owner') && (
                            <div className="space-y-2 pt-4 border-t border-zinc-900/60">
                                <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">A'zolardan admin tayinlash</span>
                                <div className="space-y-1 max-h-36 overflow-y-auto scrollbar-none mt-1">
                                    {getActiveParticipants().filter(p => p.id !== user.id && !activeAdminList.includes(p.id)).map(pRef => (
                                        <div 
                                            key={pRef.id}
                                            onClick={() => handleOpenAssignAdmin(pRef)}
                                            className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/50 hover:bg-zinc-900 border border-zinc-900 cursor-pointer transition-colors"
                                        >
                                            <p className="text-xs font-bold text-zinc-330">@{pRef.username}</p>
                                            <span className="text-[8px] font-black text-orange-500 uppercase leading-none tracking-widest">+ Tayinlash</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Delete absolute room option */}
                        {user && (activeRoom.creator_id === user.id || userProfile?.role === 'owner') && activeRoom.id !== 'anilo_room_global' && (
                            <div className="pt-3 border-t border-zinc-900/60">
                                <button 
                                    onClick={() => handleDeleteRoom(activeRoom.id)}
                                    className="w-full py-2.5 rounded-xl border border-red-500/10 bg-red-950/20 hover:bg-red-950/30 text-red-400 font-black uppercase text-[9px] tracking-widest transition-colors flex items-center justify-center gap-1.5"
                                >
                                    <span>Guruhni Batamom Yo'q qilish</span>
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            )}

            {/* PANEL: PARTICIPANTS ROSTER DRAWER */}
            {showParticipantsPanel && activeRoom && (
                <div className="w-80 border-l border-[#141419] bg-[#0a0a0d] flex flex-col shrink-0 animate-slide-left z-40 relative">
                    <div className="p-4 border-b border-[#141419] flex items-center justify-between bg-zinc-950/40">
                        <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 leading-none">
                            <Users className="text-orange-500" size={13} />
                            <span>Guruh A'zolari ({getActiveParticipants().length})</span>
                        </h3>
                        <button onClick={() => setShowParticipantsPanel(false)} className="text-zinc-550 hover:text-white">
                            <X size={15} />
                        </button>
                    </div>

                    <div className={`flex-1 overflow-y-auto p-4 space-y-3.5 ${customScrollbarClass}`}>
                        {getActiveParticipants().map(p => {
                            const isMuted = (mutedUsers[activeRoom.id] || []).includes(p.id);
                            return (
                                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-900">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-xs font-black text-white truncate">@{p.username}</p>
                                            {isMuted && <span className="bg-red-500/10 text-red-400 border border-red-500/25 px-1 py-0.5 rounded text-[6px] font-black uppercase leading-none">Muted</span>}
                                        </div>
                                        <span className="text-[7px] text-zinc-500 uppercase mt-1 inline-block leading-none">{p.role || 'user'}</span>
                                    </div>

                                    {user && hasPermission(user.id, 'canMuteUsers') && p.id !== user.id && p.id !== activeRoom.creator_id && (
                                        <button 
                                            onClick={() => handleMuteUserToggle(p.id, p.username)}
                                            className={`px-2 py-1 text-[8px] font-black uppercase rounded-lg border transition-all ${isMuted ? 'bg-green-600/15 border-green-500/25 text-green-300' : 'bg-red-650/10 border-red-500/20 text-red-400 hover:bg-red-650/20'}`}
                                        >
                                            {isMuted ? 'Mute yechish' : 'Mute qilish'}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* MODAL: ADMIN DETAILED RIGHTS CONFIGURATOR */}
            {showAdminRightsModal && selectedUserForAdmin && activeRoom && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[300] flex items-center justify-center p-4">
                    <div className="bg-[#0b0c10] border border-zinc-850 p-6 rounded-[2rem] w-full max-w-md shadow-2xl relative animate-scale-in">
                        
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-black text-white uppercase tracking-tight">Admin Vakolatlarini sozlash</h3>
                                <p className="text-[9px] font-bold text-orange-500 uppercase mt-0.5">@{selectedUserForAdmin.username} foydalanuvchisi uchun</p>
                            </div>
                            <button onClick={() => setShowAdminRightsModal(false)} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-550 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        <div className={`space-y-2.5 max-h-96 overflow-y-auto pr-1 mb-5 ${customScrollbarClass}`}>
                            <div className="flex items-center justify-between p-3 bg-zinc-900/40 rounded-xl border border-zinc-900">
                                <div>
                                    <p className="text-xs font-black text-white leading-none">Xabarlarni O'chirish</p>
                                    <p className="text-[8px] text-zinc-550 mt-1">Guruh a'zolarining xabarlarini tozalash.</p>
                                </div>
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded text-orange-600 focus:ring-0 border-zinc-800 bg-zinc-900 cursor-pointer"
                                    checked={editingPermissions.canDeleteMessages} 
                                    onChange={e => setEditingPermissions({ ...editingPermissions, canDeleteMessages: e.target.checked })} 
                                />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-zinc-900/40 rounded-xl border border-zinc-900">
                                <div>
                                    <p className="text-xs font-black text-white leading-none">Yozishmalar Pin qilish</p>
                                    <p className="text-[8px] text-zinc-550 mt-1">Sarlavha ostiga pin xabarlarni osib qo'yish.</p>
                                </div>
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded text-orange-600 focus:ring-0 border-zinc-800 bg-zinc-900 cursor-pointer"
                                    checked={editingPermissions.canPinMessages} 
                                    onChange={e => setEditingPermissions({ ...editingPermissions, canPinMessages: e.target.checked })} 
                                />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-zinc-900/40 rounded-xl border border-zinc-900">
                                <div>
                                    <p className="text-xs font-black text-white leading-none">A'zolarni cheklash (Muting)</p>
                                    <p className="text-[8px] text-zinc-550 mt-1">Suhbatda qoida buzgan a'zolarni o'chirish.</p>
                                </div>
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded text-orange-600 focus:ring-0 border-zinc-800 bg-zinc-900 cursor-pointer"
                                    checked={editingPermissions.canMuteUsers} 
                                    onChange={e => setEditingPermissions({ ...editingPermissions, canMuteUsers: e.target.checked })} 
                                />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-zinc-900/40 rounded-xl border border-zinc-900">
                                <div>
                                    <p className="text-xs font-black text-white leading-none">Video Chat Boshlash</p>
                                    <p className="text-[8px] text-zinc-550 mt-1">Efirli va visual muloqot konferensiyasini ochish.</p>
                                </div>
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded text-orange-600 focus:ring-0 border-zinc-800 bg-zinc-900 cursor-pointer"
                                    checked={editingPermissions.canStartVideoChat} 
                                    onChange={e => setEditingPermissions({ ...editingPermissions, canStartVideoChat: e.target.checked })} 
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button 
                                type="button" 
                                onClick={() => setShowAdminRightsModal(false)}
                                className="flex-1 py-3.5 bg-zinc-900 text-white font-black text-[10px] uppercase tracking-wider rounded-xl border border-zinc-850"
                            >
                                Bekor qilish
                            </button>
                            <button 
                                type="button" 
                                onClick={saveAdminPermissions}
                                className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-lg shadow-orange-500/10 border border-orange-500"
                            >
                                Huquqlarni ulash
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: CREATE NEW ROOM INPUT PANEL */}
            {showNewRoomModal && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[300] flex items-center justify-center p-4">
                    <form 
                        onSubmit={handleCreateRoom}
                        className="bg-[#0b0c10] border border-zinc-850 p-6 rounded-[2rem] w-full max-w-sm shadow-2xl relative animate-scale-in"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-black text-white uppercase tracking-tight">Yangi Guruh ochish</h3>
                            <button 
                                type="button"
                                onClick={() => handleButtonClickWithSound(() => setShowNewRoomModal(false))}
                                className="p-2 hover:bg-zinc-900 rounded-full text-zinc-550 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4 mb-5">
                            <div>
                                <label className="text-[8px] font-black text-zinc-450 uppercase tracking-widest block mb-1.5">Guruh Nomi (Ko'rinadigan sarlavha)</label>
                                <input 
                                    type="text" 
                                    value={newRoomName}
                                    onChange={e => setNewRoomName(e.target.value)}
                                    placeholder="Masalan: Shingeki Muhokamasi"
                                    className="w-full bg-[#15151a] border border-zinc-850 focus:border-orange-500 rounded-xl p-3 text-xs text-white outline-none" 
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-[8px] font-black text-orange-500 uppercase tracking-widest block mb-1.5">Yagona Guruh Username (@manzil)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3.5 text-xs text-zinc-650 font-bold">@</span>
                                    <input 
                                        type="text" 
                                        value={newRoomUsername}
                                        onChange={e => setNewRoomUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                        placeholder="shingeki_muloqot"
                                        className="w-full bg-[#15151a] border border-orange-500/20 focus:border-orange-500 rounded-xl p-3 pl-7 text-xs text-white outline-none font-bold" 
                                        required
                                    />
                                </div>
                                <span className="text-[7px] text-zinc-500 font-bold uppercase mt-1 block">Bu havola yagona bo'lib, o'zgartirib bo'lmaydi!</span>
                            </div>

                            <div>
                                <label className="text-[8px] font-black text-zinc-450 uppercase tracking-widest block mb-1.5">Mavzu yoki Tavsif</label>
                                <input 
                                    type="text" 
                                    value={newRoomDesc}
                                    onChange={e => setNewRoomDesc(e.target.value)}
                                    placeholder="Attack on Titan oxirgi fasli bo'yicha..."
                                    className="w-full bg-[#15151a] border border-zinc-850 focus:border-orange-500 rounded-xl p-3 text-xs text-white outline-none" 
                                />
                            </div>

                            <div>
                                <label className="text-[8px] font-black text-zinc-450 uppercase tracking-widest block mb-1.5">Guruh Turi (Muloqot shakli)</label>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    <button
                                        type="button"
                                        onClick={() => { triggerTone('click'); setNewRoomIsChannel(false); }}
                                        className={`py-2 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all text-center ${!newRoomIsChannel ? 'bg-orange-600/15 border-orange-500 text-orange-400' : 'bg-[#15151a] border-zinc-900 text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        👥 Guruh (Hamkor)
                                        <span className="block text-[6px] text-zinc-500 font-normal normal-case mt-0.5">Barcha yoza oladi</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { triggerTone('click'); setNewRoomIsChannel(true); }}
                                        className={`py-2 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all text-center ${newRoomIsChannel ? 'bg-purple-600/15 border-purple-500 text-purple-400' : 'bg-[#15151a] border-zinc-900 text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        📢 Kanal (E'lon)
                                        <span className="block text-[6px] text-zinc-500 font-normal normal-case mt-0.5">Faqat Admin yozadi</span>
                                    </button>
                                </div>
                            </div>

                            {/* Background Preset picker */}
                            <div>
                                <label className="text-[8px] font-black text-zinc-450 uppercase tracking-widest block mb-1.5">Orqa fon uchun rasm</label>
                                <div className="flex gap-2 items-center">
                                    {[
                                        { name: 'Kosmos', url: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=1200' },
                                        { name: 'Yulduz', url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=1200' },
                                        { name: 'Tungi sakura', url: 'https://images.unsplash.com/photo-1522441815192-d9f04eb0615c?q=80&w=1200' },
                                        { name: 'Kiber', url: 'https://images.unsplash.com/photo-1545239351-ef35f43d514b?q=80&w=1200' }
                                    ].map(img => (
                                        <button
                                            key={img.name}
                                            type="button"
                                            onClick={() => { triggerTone('click'); setNewRoomBgImage(img.url); }}
                                            className={`relative w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${newRoomBgImage === img.url ? 'border-orange-500 scale-110 shadow-lg' : 'border-zinc-900 hover:border-zinc-700'}`}
                                            title={img.name}
                                        >
                                            <img src={img.url} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[8px] font-black text-zinc-450 uppercase tracking-widest block mb-1.5">Belgi (Emoji)</label>
                                    <select 
                                        value={newRoomEmoji}
                                        onChange={e => { triggerTone('click'); setNewRoomEmoji(e.target.value); }}
                                        className="w-full bg-zinc-900 border border-zinc-850 rounded-xl p-3 text-xs text-white outline-none cursor-pointer"
                                    >
                                        {['🔥', '⚔️', '✨', '🌸', '💀', '🎙️', '😂', '👑', '🍙', '🎵', '🕹️'].map(em => (
                                            <option key={em} value={em}>{em}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[8px] font-black text-zinc-450 uppercase tracking-widest block mb-1.5">Tozalash (Muddati)</label>
                                    <select 
                                        value={newRoomExpiry}
                                        onChange={e => { triggerTone('click'); setNewRoomExpiry(Number(e.target.value)); }}
                                        className="w-full bg-zinc-900 border border-zinc-855 rounded-xl p-3 text-xs text-white outline-none cursor-pointer"
                                    >
                                        {[1, 2, 3, 4, 5].map(day => (
                                            <option key={day} value={day}>{day} Kun</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button 
                                type="button" 
                                onClick={() => setShowNewRoomModal(false)}
                                className="flex-1 py-3 bg-zinc-905 text-white font-black text-[10px] uppercase rounded-xl border border-zinc-850 text-zinc-500"
                            >
                                Bekor qilish
                            </button>
                            <button 
                                type="submit"
                                className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-3 rounded-xl font-black text-[10px] uppercase border border-orange-500 shadow-lg"
                            >
                                Guruhni ochish
                            </button>
                        </div>
                    </form>
                </div>
            )}

            </div>
        </div>
    );
};
