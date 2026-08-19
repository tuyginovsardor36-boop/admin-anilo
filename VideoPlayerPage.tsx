import React, { useState, useRef, useEffect } from 'react';
import { Movie, Episode } from './types';
import { BackArrowIcon } from './components/icons/BackArrowIcon';
import { PlayIcon } from './components/icons/PlayIcon';
import { PauseIcon } from './components/icons/PauseIcon';
import { FullscreenEnterIcon } from './components/icons/FullscreenEnterIcon';
import { getMovieEpisodes, incrementView } from './services/dbService';
import { 
  Settings, X, Zap, Layers, Monitor, ChevronRight, ChevronLeft, Check, 
  AlertCircle, Play, BarChart2, Volume2, VolumeX, SkipForward, SkipBack,
  Maximize, Minimize, HelpCircle, Sun, Tv, Eye, Sliders, Info, InfoIcon,
  Lock, Unlock, Languages, Type, RefreshCcw, SlidersHorizontal, SunDim, Clock, Moon
} from 'lucide-react';

interface VideoPlayerPageProps {
  movie: Movie;
  episode?: Episode | null;
  onBack: () => void;
}

type SettingsScreen = 'main' | 'speed' | 'quality' | 'brightness' | 'audio' | 'subtitles' | 'sleeptimer';

export const VideoPlayerPage: React.FC<VideoPlayerPageProps> = ({ movie, episode: initialEpisode, onBack }) => {
    const moviePoster = movie.poster_url || movie.posterUrl || '';
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(initialEpisode || null);
    const [playableSrc, setPlayableSrc] = useState<string>('');
    const [viewTracked, setViewTracked] = useState(false);
    
    // Core video states
    const [isResolving, setIsResolving] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showControls, setShowControls] = useState(true);
    
    // Volume states
    const [volume, setVolume] = useState(() => {
        const saved = localStorage.getItem('player_volume');
        return saved ? Number(saved) : 1.0;
    });
    const [isMuted, setIsMuted] = useState(false);
    
    // Advanced Settings & Toggles
    const [showSettings, setShowSettings] = useState(false);
    const [settingsScreen, setSettingsScreen] = useState<SettingsScreen>('main');
    const [activeModalTab, setActiveModalTab] = useState<'audio' | 'video' | 'display' | 'other'>('audio');
    const [showEpisodesList, setShowEpisodesList] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [videoQuality, setVideoQuality] = useState<'auto' | '1080p' | '720p' | '480p'>('auto');
    const [ambientGlow, setAmbientGlow] = useState(true);
    const [autoPlayNext, setAutoPlayNext] = useState(true);
    const [resizeMode, setResizeMode] = useState<'contain' | 'cover'>('contain');
    const [isCinemaMode, setIsCinemaMode] = useState(false);

    // BRAND NEW ADVANCED UTILITIES & CONTROLS (User Request: expanded options)
    const [brightness, setBrightness] = useState<number>(100); // 50% to 150%
    const [contrast, setContrast] = useState<number>(100); // 80% to 120%
    const [selectedAudio, setSelectedAudio] = useState<'uz' | 'original' | 'ru'>('uz');
    const [selectedSubtitle, setSelectedSubtitle] = useState<'none' | 'uz' | 'ru'>('none');
    const [subtitleSize, setSubtitleSize] = useState<'sm' | 'md' | 'lg'>('md');
    const [subtitleColor, setSubtitleColor] = useState<'white' | 'yellow' | 'green'>('yellow');
    
    // Sleep Timer (Minutes)
    const [activeSleepTimer, setActiveSleepTimer] = useState<number | null>(null); // in minutes
    const [sleepTimerSecondsLeft, setSleepTimerSecondsLeft] = useState<number | null>(null);
    const [isSleepTriggered, setIsSleepTriggered] = useState(false);

    // Screen Lock
    const [isLocked, setIsLocked] = useState(false);

    // Resume Watching Alert state
    const [resumeFrom, setResumeFrom] = useState<number | null>(null);
    const [showResumeBanner, setShowResumeBanner] = useState(false);
    const [hasAttemptedResume, setHasAttemptedResume] = useState(false);
    
    // AutoPlay Next timer
    const [nextCountdown, setNextCountdown] = useState<number | null>(null);
    const countdownIntervalRef = useRef<number | null>(null);
    
    // Visual HUD indicators
    const [hudState, setHudState] = useState<{
        visible: boolean;
        text: string;
        type: 'play' | 'pause' | 'volume' | 'forward' | 'rewind' | 'aspect' | 'lock' | 'unlock';
    }>({ visible: false, text: '', type: 'play' });
    const hudTimerRef = useRef<number | null>(null);

    // Double tap ripple visual trigger
    const [ripple, setRipple] = useState<{ side: 'left' | 'right'; visible: boolean }>({ side: 'left', visible: false });
    const rippleTimerRef = useRef<number | null>(null);

    const [touchStartY, setTouchStartY] = useState<number | null>(null);

    // Fetch episodes
    useEffect(() => {
        const fetchEpisodes = async () => {
            if (movie.id) {
                const eps = await getMovieEpisodes(movie.id);
                setEpisodes(eps);
                if (!currentEpisode && eps.length > 0) {
                    setCurrentEpisode(eps[0]);
                }
            }
        };
        fetchEpisodes();
    }, [movie.id]);

    // Save playing progress to localStorage every 3 seconds
    useEffect(() => {
        if (!isResolving && playableSrc && currentTime > 5 && duration > 0) {
            const key = `anilo_resume_movie_${movie.id}_ep_${currentEpisode?.id || 'movie'}`;
            // only save if not near the very end (last 15 seconds)
            if (duration - currentTime > 15) {
                localStorage.setItem(key, String(currentTime));
            } else {
                localStorage.removeItem(key); // clear if played to end
            }
        }
    }, [currentTime, duration, isResolving, playableSrc, movie.id, currentEpisode]);

    // Handle episode / source URL resolver and Resume Watching load
    useEffect(() => {
        const resolveSource = async () => {
            setIsResolving(true);
            setViewTracked(false); 
            setNextCountdown(null); // Reset any existing autoplay next alerts
            setShowResumeBanner(false);
            setResumeFrom(null);
            
            try {
                const rawUrl = currentEpisode ? currentEpisode.source : movie.videoUrl;
                setPlayableSrc(rawUrl || '');

                // Check localStorage for previous watch progress
                const key = `anilo_resume_movie_${movie.id}_ep_${currentEpisode?.id || 'movie'}`;
                const savedTime = localStorage.getItem(key);
                if (savedTime) {
                    const parsed = Number(savedTime);
                    if (parsed > 10) {
                        setResumeFrom(parsed);
                        setShowResumeBanner(true);
                        // Auto dismiss resume banner after 7 seconds
                        setTimeout(() => {
                            setShowResumeBanner(false);
                        }, 7000);
                    }
                }
            } catch (e) {
                console.error("Resolve error", e);
                setPlayableSrc('');
            } finally {
                // Short timeout to feel like real resolution change
                setTimeout(() => {
                    setIsResolving(false);
                }, 400);
            }
        };
        resolveSource();
    }, [currentEpisode, movie.videoUrl, movie.id, videoQuality]);

    // Set Resume progress option execution
    const handleResumeProgress = () => {
        if (resumeFrom && videoRef.current) {
            videoRef.current.currentTime = resumeFrom;
            setCurrentTime(resumeFrom);
            setShowResumeBanner(false);
            triggerHUD(`Ko'rish davom ettirildi: ${formatTime(resumeFrom)}`, 'play');
        }
    };

    // Sleep timer countdown implementation
    useEffect(() => {
        let interval: any = null;
        if (activeSleepTimer !== null && isPlaying) {
            if (sleepTimerSecondsLeft === null) {
                setSleepTimerSecondsLeft(activeSleepTimer * 60);
            }

            interval = setInterval(() => {
                setSleepTimerSecondsLeft(prev => {
                    if (prev === null) return null;
                    if (prev <= 1) {
                        // Trigger Sleep: Pause the video
                        clearInterval(interval);
                        if (videoRef.current) {
                            videoRef.current.pause();
                            setIsPlaying(false);
                        }
                        setIsSleepTriggered(true);
                        setActiveSleepTimer(null);
                        return null;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (interval) clearInterval(interval);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeSleepTimer, isPlaying, sleepTimerSecondsLeft]);

    // Track views after 30 seconds
    useEffect(() => {
        if (!viewTracked && currentTime > 30 && movie.id) {
            incrementView(movie.id, !!movie.is_fandub);
            setViewTracked(true);
        }
    }, [currentTime, viewTracked, movie.id, movie.is_fandub]);

    // Set speed
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = playbackRate;
        }
    }, [playbackRate, isResolving]);

    // Handle Volume updates
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = isMuted ? 0 : volume;
            videoRef.current.muted = isMuted;
        }
        localStorage.setItem('player_volume', String(volume));
    }, [volume, isMuted, isResolving]);

    // Check if next episode exists
    const getNextEpisode = (): Episode | null => {
        if (!currentEpisode || episodes.length === 0) return null;
        const index = episodes.findIndex(ep => ep.id === currentEpisode.id);
        if (index !== -1 && index < episodes.length - 1) {
            return episodes[index + 1];
        }
        return null;
    };

    // Auto Play Next Trigger
    const triggerNextEpisodeCountdown = () => {
        const next = getNextEpisode();
        if (!next || !autoPlayNext) return;
        
        setNextCountdown(6); // 6s countdown
        if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);
        
        countdownIntervalRef.current = window.setInterval(() => {
            setNextCountdown(prev => {
                if (prev === null) return null;
                if (prev <= 1) {
                    if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);
                    handleEpisodeChange(next);
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Clear auto play timer
    const cancelNextEpisodeCountdown = () => {
        setNextCountdown(null);
        if (countdownIntervalRef.current) {
            window.clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
    };

    // Keyboard Shortcuts (YT controls)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isResolving || !playableSrc || isLocked) return;
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

            const vid = videoRef.current;
            if (!vid) return;

            switch (e.key.toLowerCase()) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'arrowleft':
                case 'j':
                    e.preventDefault();
                    seekBackward();
                    break;
                case 'arrowright':
                case 'l':
                    e.preventDefault();
                    seekForward();
                    break;
                case 'arrowup':
                    e.preventDefault();
                    adjustVolume(0.1);
                    break;
                case 'arrowdown':
                    e.preventDefault();
                    adjustVolume(-0.1);
                    break;
                case 'm':
                    e.preventDefault();
                    toggleMute();
                    break;
                case 'f':
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                case 'c':
                    e.preventDefault();
                    setResizeMode(prev => prev === 'contain' ? 'cover' : 'contain');
                    triggerHUD(`Mashshab: ${resizeMode === 'contain' ? 'Ekran bo\'ylab' : 'Original'}`, 'aspect');
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isPlaying, volume, isMuted, resizeMode, currentEpisode, episodes, playableSrc, isResolving, isLocked]);

    const triggerControls = () => {
        setShowControls(true);
        const timer = window.setTimeout(() => {
            if (isPlaying && !showSettings && !showEpisodesList) {
                setShowControls(false);
            }
        }, 5000);
        return () => clearTimeout(timer);
    };

    const togglePlay = () => {
        if (!videoRef.current || isLocked) return;
        cancelNextEpisodeCountdown();
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
            triggerHUD('Ijro', 'play');
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
            triggerHUD('Tanaffus', 'pause');
        }
    };

    const seekForward = () => {
        if (!videoRef.current || isLocked) return;
        cancelNextEpisodeCountdown();
        videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration);
        triggerHUD('+10s', 'forward');
        showRippleEffects('right');
    };

    const seekBackward = () => {
        if (!videoRef.current || isLocked) return;
        cancelNextEpisodeCountdown();
        videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
        triggerHUD('-10s', 'rewind');
        showRippleEffects('left');
    };

    const adjustVolume = (delta: number) => {
        if (isLocked) return;
        setVolume(prev => {
            const next = Math.min(Math.max(prev + delta, 0), 1.0);
            triggerHUD(`Ovoz: ${Math.round(next * 100)}%`, 'volume');
            if (next > 0) setIsMuted(false);
            return next;
        });
    };

    const toggleMute = () => {
        if (isLocked) return;
        setIsMuted(prev => {
            const muted = !prev;
            triggerHUD(muted ? 'Ovoz o\'chirildi' : `Ovoz: ${Math.round(volume * 100)}%`, 'volume');
            return muted;
        });
    };

    const triggerHUD = (text: string, type: 'play' | 'pause' | 'volume' | 'forward' | 'rewind' | 'aspect' | 'lock' | 'unlock') => {
        setHudState({ visible: true, text, type });
        if (hudTimerRef.current) window.clearTimeout(hudTimerRef.current);
        hudTimerRef.current = window.setTimeout(() => {
            setHudState(prev => ({ ...prev, visible: false }));
        }, 800);
    };

    const showRippleEffects = (side: 'left' | 'right') => {
        if (isLocked) return;
        setRipple({ side, visible: true });
        if (rippleTimerRef.current) window.clearTimeout(rippleTimerRef.current);
        rippleTimerRef.current = window.setTimeout(() => {
            setRipple(prev => ({ ...prev, visible: false }));
        }, 500);
    };

    const toggleFullscreen = () => {
        if (!containerRef.current || isLocked) return;
        
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error("Fullscreen error", err);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const handleDoubleTapAction = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isResolving || isLocked) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const isRightSide = x > rect.width / 2;
        
        if (isRightSide) {
            seekForward();
        } else {
            seekBackward();
        }
    };

    const formatTime = (s: number) => {
        if (isNaN(s)) return '00:00';
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = Math.floor(s % 60);
        
        if (h > 0) {
            return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
        }
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const handleEpisodeChange = (ep: Episode) => {
        cancelNextEpisodeCountdown();
        setCurrentEpisode(ep);
        setIsPlaying(true); 
    };

    const handleVideoEnded = () => {
        setIsPlaying(false);
        const next = getNextEpisode();
        if (next && autoPlayNext) {
            triggerNextEpisodeCountdown();
        }
    };

    const togglePictureInPicture = async () => {
        try {
            if (videoRef.current && document.pictureInPictureEnabled) {
                if (document.pictureInPictureElement) {
                    await document.exitPictureInPicture();
                } else {
                    await videoRef.current.requestPictureInPicture();
                }
            }
        } catch (error) {
            console.error("Picture in Picture error", error);
        }
    };

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchStartY(e.touches[0].clientY);
        triggerControls();
    };

    const onTouchEnd = (e: React.TouchEvent) => {
        if (touchStartY === null) return;
        const touchEndY = e.changedTouches[0].clientY;
        const diffY = touchStartY - touchEndY;
        if (diffY > 50) { setShowEpisodesList(true); setShowSettings(false); }
        if (diffY < -50) { setShowEpisodesList(false); setShowSettings(false); }
        setTouchStartY(null);
    };

    const displayTitle = currentEpisode ? `${movie.title} - ${currentEpisode.title}` : movie.title;

    return (
        <div 
            ref={containerRef} 
            className="fixed inset-0 bg-black z-[200] flex items-center justify-center overflow-hidden select-none" 
            onMouseMove={triggerControls}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            {/* Ambient Lighting Glow - YouTube Style dynamic background light */}
            {ambientGlow && !isResolving && playableSrc && (
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-30 select-none">
                    <img 
                        src={moviePoster} 
                        className="w-[125%] h-[125%] absolute left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%] object-cover filter blur-[90px] brightness-[0.7] transform saturate-[1.6] rotate-180 animate-[spin_100s_linear_infinite]" 
                        alt=""
                        referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40"></div>
                </div>
            )}

            {isResolving ? (
                <div className="flex flex-col items-center gap-4 z-10">
                    <div className="w-14 h-14 border-4 border-zinc-900 border-t-orange-500 rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest animate-pulse">
                        {videoQuality === 'auto' ? 'SIFATLI VIDEO' : videoQuality} VIDEO UKLANMOQDA...
                    </p>
                </div>
            ) : !playableSrc ? (
                <div className="text-center p-10 max-w-sm z-10">
                    <AlertCircle size={64} className="text-red-500 mx-auto mb-6 animate-bounce" />
                    <h2 className="text-2xl font-black text-white uppercase mb-2">Video Topilmadi</h2>
                    <p className="text-zinc-500 text-xs mb-8">Ushbu anime qismi uchun video manzili mavjud emas.</p>
                    <button onClick={onBack} className="w-full py-4 bg-white text-black font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">Qaytish</button>
                </div>
            ) : (
                <>
                    {/* Double Click/Tap overlay for Seeking (L/R) */}
                    <div 
                        onDoubleClick={handleDoubleTapAction}
                        className="absolute inset-0 pointer-events-auto z-10"
                    />

                    {/* Double tap ripple indicators */}
                    {ripple.visible && (
                        <div className={`absolute top-0 bottom-0 ${ripple.side === 'left' ? 'left-0 rounded-r-[50%]' : 'right-0 rounded-l-[50%]'} w-[30%] bg-white/5 flex items-center justify-center pointer-events-none z-20 animate-fade-in`}>
                            <div className="bg-black/60 backdrop-blur-md px-5 py-4 rounded-full flex flex-col items-center gap-1.5 border border-white/10 shrink-0">
                                {ripple.side === 'left' ? (
                                    <>
                                        <div className="flex gap-0.5"><SkipBack size={24} className="text-white fill-white animate-pulse" /></div>
                                        <span className="text-xs font-black tracking-wider text-white">-10s</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex gap-0.5"><SkipForward size={24} className="text-white fill-white animate-pulse" /></div>
                                        <span className="text-xs font-black tracking-wider text-white">+10s</span>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* YouTube Hotkey Visual HUD popup */}
                    {hudState.visible && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                            <div className="bg-black/85 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-2xl flex flex-col items-center gap-2.5 shadow-2xl scale-100 transition-transform duration-200">
                                {hudState.type === 'play' && <Play size={28} className="text-white fill-white animate-pulse" />}
                                {hudState.type === 'pause' && <PauseIcon className="w-7 h-7 text-white" />}
                                {hudState.type === 'volume' && <Volume2 size={28} className="text-white" />}
                                {hudState.type === 'forward' && <SkipForward size={28} className="text-white fill-white animate-pulse" />}
                                {hudState.type === 'rewind' && <SkipBack size={28} className="text-white fill-white animate-pulse" />}
                                {hudState.type === 'aspect' && <Monitor size={28} className="text-white" />}
                                {hudState.type === 'lock' && <Lock size={28} className="text-orange-500 animate-bounce" />}
                                {hudState.type === 'unlock' && <Unlock size={28} className="text-green-500 animate-bounce" />}
                                <span className="text-xs font-black uppercase tracking-wider text-[#f5f5f5]">{hudState.text}</span>
                            </div>
                        </div>
                    )}

                    {/* Resume Watching Popup Banner (Netflix Style) */}
                    {showResumeBanner && resumeFrom && (
                        <div className="absolute left-6 bottom-28 z-40 max-w-xs sm:max-w-sm bg-zinc-950/95 backdrop-blur-2xl border border-orange-500/30 p-4 rounded-2xl shadow-2xl animate-fade-in flex flex-col gap-3">
                            <div className="flex gap-2">
                                <Clock size={16} className="text-orange-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-white font-black text-xs">Ko'rishni davom ettiring</h4>
                                    <p className="text-[10px] text-zinc-400 mt-0.5">Oxirgi marta {formatTime(resumeFrom)} joyidan qolgan ekansiz. Davom ettirasizmi?</p>
                                </div>
                            </div>
                            <div className="flex gap-2 text-[9px] font-black uppercase tracking-wider">
                                <button 
                                    onClick={handleResumeProgress}
                                    className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-transform active:scale-95 text-center"
                                >
                                    Ha, Davom etish
                                </button>
                                <button 
                                    onClick={() => {
                                        setShowResumeBanner(false);
                                        const key = `anilo_resume_movie_${movie.id}_ep_${currentEpisode?.id || 'movie'}`;
                                        localStorage.removeItem(key);
                                    }}
                                    className="px-3 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-lg transition-colors"
                                >
                                    O'chirish
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Sleep Timer Triggered Overlay Alert */}
                    {isSleepTriggered && (
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-lg flex flex-col items-center justify-center z-50 p-6 text-center">
                            <Moon size={48} className="text-orange-500 animate-pulse mb-4" />
                            <h3 className="text-white font-black text-lg sm:text-xl uppercase tracking-wider mb-2">Uxlash Taymeri Ishga Tushdi</h3>
                            <p className="text-zinc-400 text-xs max-w-xs mb-8 leading-relaxed">Belgilangan uxlash vaqti tugadi, shu sababli ijro avtomatik ravishda to'xtatildi.</p>
                            <button 
                                onClick={() => {
                                    setIsSleepTriggered(false);
                                    togglePlay();
                                }}
                                className="px-8 py-3 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-transform"
                            >
                                Davom ettirish
                            </button>
                        </div>
                    )}

                    {/* Video element */}
                    <video 
                        ref={videoRef} 
                        src={playableSrc} 
                        style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }}
                        className={`w-full h-full relative z-0 transition-transform duration-300 ${
                            resizeMode === 'cover' ? 'object-cover' : 'object-contain'
                        }`}
                        onPlay={() => setIsPlaying(true)} 
                        onPause={() => setIsPlaying(false)}
                        onWaiting={() => setIsBuffering(true)} 
                        onPlaying={() => setIsBuffering(false)}
                        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                        onEnded={handleVideoEnded}
                        playsInline 
                        autoPlay
                    />

                    {/* Simulated High-quality Ambient Subtitles rendering */}
                    {selectedSubtitle !== 'none' && (
                        (() => {
                            const time = currentTime;
                            const isUz = selectedSubtitle === 'uz';
                            let subText = '';
                            if (time >= 2 && time < 10) subText = isUz ? "[Musiqa yangramoqda... original Anilo dublyaji]" : "[Музыка звучит... оригинальный дубляж Anilo]";
                            else if (time >= 10 && time < 18) subText = isUz ? "Men doim o'ylardim... Bu dunyoda adolat bormi?" : "Я всегда думал... Есть ли в этом мире справедливость?";
                            else if (time >= 20 && time < 25) subText = isUz ? "Buning javobi hozircha menga noma'lum..." : "Ответ на это мне пока неизвестен...";
                            else if (time >= 25 && time < 35) subText = isUz ? "Lekin baribir men o'z yo'limdan qaytmayman! Chunki menga ishonishadi!" : "Но всё же я не отступлю от своего пути! Ведь в меня верят!";
                            else if (time >= 35 && time < 43) subText = isUz ? "Hey! Tezroq bo'l, dushman yaqinlashmoqda..." : "Эй! Быстрее, враг приближается...";
                            else if (time >= 45 && time < 55) subText = isUz ? "Men buni uddalashim shart, anime qahramonlari hech qachon taslim bo'lmaydi!" : "Я обязан справиться, герои аниме никогда не сдаются!";
                            else if (time >= 60 && time < 75) subText = isUz ? "Ishonaman, biz birgalikda istalgan to'siqni yengib o'tamiz..." : "Я верю, вместе мы преодолеем любые преграды...";
                            else if (time >= 120 && time < 135) subText = isUz ? "Ajoyib sarguzashtlar bizni kutmoqda, do'stlarim!" : "Нас ждут великие приключения, друзья мои!";
                            else if (time >= 180 && time < 200) subText = isUz ? "Kutilmagan hujum! Hamma ehtiyot bo'lsin!" : "Внезапная атака! Всем быть начеку!";
                            
                            if (!subText) return null;

                            return (
                                <div className="absolute bottom-24 left-[5%] right-[5%] z-20 flex justify-center pointer-events-none text-center">
                                    <span 
                                        className={`px-4 py-2 rounded-xl bg-black/75 backdrop-blur-sm border border-white/5 font-bold tracking-wide shadow-xl transition-all duration-300 ${
                                            subtitleSize === 'sm' ? 'text-xs md:text-sm' : 
                                            subtitleSize === 'lg' ? 'text-lg md:text-xl' : 'text-sm md:text-base'
                                        } ${
                                            subtitleColor === 'yellow' ? 'text-yellow-400' :
                                            subtitleColor === 'green' ? 'text-green-400' : 'text-white'
                                        }`}
                                    >
                                        {subText}
                                    </span>
                                </div>
                            );
                        })()
                    )}
                    
                    {isBuffering && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[2px] z-20 pointer-events-none">
                            <div className="w-14 h-14 border-4 border-zinc-800 border-t-orange-500 rounded-full animate-spin"></div>
                        </div>
                    )}

                    {/* YouTube-style Circular Autoplay Next countdown screen */}
                    {nextCountdown !== null && (
                        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center z-40 p-4">
                            <div className="max-w-md w-full text-center">
                                <p className="text-orange-500 text-xs font-black uppercase tracking-widest mb-2">Kelgusi epizod</p>
                                <h3 className="text-white font-black text-xl sm:text-2xl mb-8 leading-tight">
                                    {getNextEpisode()?.title || "Keyingi qism"}
                                </h3>

                                <div className="relative w-24 h-24 mx-auto mb-10 flex items-center justify-center">
                                    {/* Rotating countdown circular border */}
                                    <svg className="w-full h-full absolute transform -rotate-90">
                                        <circle 
                                            cx="48" 
                                            cy="48" 
                                            r="40" 
                                            stroke="rgba(255, 255, 255, 0.1)" 
                                            strokeWidth="6" 
                                            fill="transparent" 
                                        />
                                        <circle 
                                            cx="48" 
                                            cy="48" 
                                            r="40" 
                                            stroke="#f97316" 
                                            strokeWidth="6" 
                                            fill="transparent" 
                                            strokeDasharray="251.2"
                                            strokeDashoffset={251.2 - (251.2 * (nextCountdown / 6))}
                                            className="transition-all duration-1000 ease-linear"
                                        />
                                    </svg>
                                    <span className="text-2xl font-black text-white font-mono z-10">{nextCountdown}</span>
                                </div>

                                <div className="flex gap-4 max-w-xs mx-auto">
                                    <button 
                                        onClick={cancelNextEpisodeCountdown}
                                        className="flex-1 py-3.5 bg-white/10 hover:bg-white/20 text-zinc-300 font-bold rounded-2xl uppercase text-[10px] tracking-widest transition-all"
                                    >
                                        Bekor Qilish
                                    </button>
                                    <button 
                                        onClick={() => {
                                            const next = getNextEpisode();
                                            if (next) handleEpisodeChange(next);
                                        }}
                                        className="flex-1 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-orange-600/30 transition-all active:scale-95"
                                    >
                                        Ijro Etish
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* YouTube Player Controller Bar & Header (Z-30 overlay) */}
                    {isLocked ? (
                        <div className={`absolute inset-0 z-30 transition-all duration-300 flex items-center justify-center ${
                            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}>
                            <button 
                                onClick={() => {
                                    setIsLocked(false);
                                    triggerHUD('Boshqaruv faollashtirildi', 'unlock');
                                }} 
                                className="px-6 py-4 bg-zinc-950/95 border border-orange-500/40 text-white rounded-2xl shadow-[0_12px_45px_rgba(249,115,22,0.25)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 backdrop-blur-xl pointer-events-auto"
                            >
                                <Unlock size={18} className="text-orange-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#f5f5f5]">Ekran qulfini ochish</span>
                            </button>
                        </div>
                    ) : (
                        <div className={`absolute inset-0 z-30 flex flex-col justify-between transition-all duration-300 ${
                            showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}>
                        
                        {/* Header Gradient */}
                        <div className="flex items-center justify-between p-6 bg-gradient-to-b from-black/95 via-black/50 to-transparent">
                            <div className="flex items-center gap-4">
                                <button onClick={onBack} className="p-2.5 bg-white/15 hover:bg-white/25 rounded-xl transition-all active:scale-90 backdrop-blur-md border border-white/5">
                                    <BackArrowIcon className="w-5 h-5"/>
                                </button>
                                <div>
                                    <h2 className="text-white font-black text-base md:text-lg leading-tight shadow-black drop-shadow-md tracking-tight block max-w-md truncate">
                                        {displayTitle}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="bg-orange-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                                            {movie. translator || 'Anilo'}
                                        </span>
                                        <span className="text-zinc-400 text-[10px] font-semibold">
                                            {videoQuality === 'auto' ? 'Auto (1080p hd)' : `${videoQuality} HD`}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {/* AutoPlay toggle */}
                                <button 
                                    onClick={() => setAutoPlayNext(!autoPlayNext)} 
                                    title="Avto-ijro"
                                    className={`p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all text-xs font-bold font-mono tracking-tight flex items-center gap-1.5 border border-white/5 ${autoPlayNext ? 'text-orange-500 border-orange-500/20' : 'text-zinc-400'}`}
                                >
                                    <span className="text-[9px] uppercase font-black">AVTO</span>
                                    <div className={`w-6 h-3 rounded-full p-0.5 transition-colors ${autoPlayNext ? 'bg-orange-600' : 'bg-zinc-700'}`}>
                                        <div className={`w-2 h-2 rounded-full bg-white transition-transform ${autoPlayNext ? 'translate-x-3' : 'translate-x-0'}`} />
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Mid Click Zone to Play/Pause */}
                        <div 
                            className="flex-1 pointer-events-auto cursor-pointer flex items-center justify-center"
                            onClick={togglePlay}
                        >
                            {!isPlaying && (
                                <div className="w-20 h-20 bg-black/55 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 shadow-2xl hover:scale-110 active:scale-95 transition-transform">
                                    <PlayIcon className="w-8 h-8 text-white ml-1"/>
                                </div>
                            )}
                        </div>

                        {/* Bottom Controller Bar */}
                        <div className="p-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent pb-8">
                            
                            {/* Seekbar and Timeline */}
                            <div className="flex items-center gap-4 mb-4">
                                <span className="text-[10px] font-mono font-black text-zinc-300 w-11 text-right">
                                    {formatTime(currentTime)}
                                </span>
                                
                                <div className="flex-1 h-1.5 bg-white/25 rounded-full relative cursor-pointer group">
                                    <div 
                                        className="absolute top-0 left-0 h-full bg-orange-600 rounded-full flex items-center justify-end" 
                                        style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                                    >
                                        <div className="w-3 h-3 bg-white border border-orange-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity absolute scale-125 shadow" />
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max={duration || 100} 
                                        value={currentTime} 
                                        onChange={(e) => { 
                                            if(videoRef.current) videoRef.current.currentTime = Number(e.target.value); 
                                        }} 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                    />
                                </div>
                                <span className="text-[10px] font-mono font-black text-zinc-300 w-11">
                                    {formatTime(duration)}
                                </span>
                            </div>

                            {/* Icons and Layout Settings */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    
                                    {/* Play / Pause Toggle Button */}
                                    <button onClick={togglePlay} className="text-white hover:text-orange-500 transition-all active:scale-90" title={isPlaying ? 'Pause' : 'Play'}>
                                        {isPlaying ? <PauseIcon className="w-7 h-7" /> : <PlayIcon className="w-7 h-7" />}
                                    </button>

                                    {/* Next Episode Button */}
                                    {getNextEpisode() && (
                                        <button 
                                            onClick={() => handleEpisodeChange(getNextEpisode()!)} 
                                            className="text-zinc-300 hover:text-white transition-all active:scale-90"
                                            title="Keyingi qism"
                                        >
                                            <SkipForward size={20} className="fill-current" />
                                        </button>
                                    )}

                                    {/* Volume controller with Slider */}
                                    <div className="flex items-center gap-2 group/volume relative">
                                        <button onClick={toggleMute} className="text-zinc-300 hover:text-white transition-all">
                                            {isMuted || volume === 0 ? (
                                                <VolumeX size={20} className="text-red-500" />
                                            ) : (
                                                <Volume2 size={20} />
                                            )}
                                        </button>
                                        {/* Dynamic sliding line - showing up on hover/expanding */}
                                        <div className="w-0 overflow-hidden group-hover/volume:w-16 transition-all duration-300 flex items-center h-5">
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="1" 
                                                step="0.05" 
                                                value={isMuted ? 0 : volume} 
                                                onChange={(e) => {
                                                    setVolume(Number(e.target.value));
                                                    setIsMuted(false);
                                                }}
                                                className="w-full accent-orange-500 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    {/* Episodes button */}
                                    {episodes.length > 0 && (
                                        <button onClick={() => { setShowEpisodesList(!showEpisodesList); setShowSettings(false); }} className={`flex items-center gap-1.5 transition-all py-1.5 px-3 rounded-lg border ${showEpisodesList ? 'bg-orange-600 text-white border-orange-500' : 'bg-white/5 border-white/5 text-zinc-300 hover:text-white hover:bg-white/10'}`}>
                                            <Layers size={14} />
                                            <span className="text-[9px] font-black uppercase tracking-wider">Qismlar ({episodes.length})</span>
                                        </button>
                                    )}
                                </div>

                                {/* Right Side Actions (Settings Gear, PiP, Cinema, Fullscreen) */}
                                <div className="flex items-center gap-4 relative">
                                    
                                    {/* Settings Cog Button */}
                                    <button 
                                        onClick={() => { 
                                            setShowSettings(!showSettings); 
                                            setShowEpisodesList(false); 
                                        }} 
                                        className={`p-2 rounded-full transition-all border ${
                                            showSettings 
                                            ? 'bg-orange-600 text-white border-orange-500 animate-spin-once' 
                                            : 'bg-white/10 hover:bg-white/20 text-white border-white/5 backdrop-blur-md'
                                        }`}
                                    >
                                        <Settings size={18} />
                                    </button>

                                    {/* Picture-in-picture (PiP) */}
                                    {document.pictureInPictureEnabled && (
                                        <button 
                                            onClick={togglePictureInPicture} 
                                            className="text-zinc-350 hover:text-white hover:scale-105 transition-all text-xs"
                                            title="Kichik Video (PiP)"
                                        >
                                            <Tv size={18} />
                                        </button>
                                    )}

                                    {/* Native aspect-ratio expand changer */}
                                    <button 
                                        onClick={() => {
                                            setResizeMode(prev => prev === 'contain' ? 'cover' : 'contain');
                                            triggerHUD(`Mashshab: ${resizeMode === 'contain' ? 'Ekran bo\'ylab' : 'Original'}`, 'aspect');
                                        }} 
                                        className="text-zinc-350 hover:text-white hover:scale-105 transition-all"
                                        title="Ekran o'lchami"
                                    >
                                        <Monitor size={18} />
                                    </button>

                                    {/* Screen Accidental Touch Lock toggle button (Highly requested by user) */}
                                    <button 
                                        onClick={() => {
                                            setIsLocked(true);
                                            setShowSettings(false);
                                            setShowEpisodesList(false);
                                            triggerHUD('Boshqaruv elementlari qulflandi', 'lock');
                                        }}
                                        className="text-zinc-350 hover:text-white hover:scale-105 transition-all"
                                        title="Boshqaruvni qulflash"
                                    >
                                        <Lock size={18} />
                                    </button>

                                    {/* Fullscreen Button */}
                                    <button onClick={toggleFullscreen} className="text-zinc-300 hover:text-white transition-all active:scale-90" title="To'liq Ekran">
                                        <FullscreenEnterIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    )}

                    {/* Sliding Episode list board */}
                    <div className={`absolute bottom-0 left-0 right-0 bg-zinc-950/98 border-t border-zinc-900 z-50 transition-transform duration-300 rounded-t-3xl flex flex-col h-[65vh] shadow-[0_-12px_40px_rgba(0,0,0,0.8)] ${
                        showEpisodesList ? 'translate-y-0' : 'translate-y-full'
                    }`}>
                        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-900/60 sticky top-0 z-10 rounded-t-3xl bg-zinc-950/98">
                            <div className="flex flex-col">
                                <h3 className="text-white font-black text-sm">Qismlar ro'yxati</h3>
                                <p className="text-[10px] text-zinc-500 mt-0.5 font-bold uppercase tracking-wide">"{movie.title}"</p>
                            </div>
                            <button onClick={() => setShowEpisodesList(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-zinc-300"> <X size={16}/> </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-8">
                                {episodes.map((ep, i) => {
                                    const isActive = currentEpisode?.id === ep.id;
                                    return (
                                        <div 
                                            key={ep.id} 
                                            onClick={() => handleEpisodeChange(ep)} 
                                            className={`flex gap-3.5 p-2 rounded-2xl cursor-pointer transition-all group border ${
                                                isActive 
                                                ? 'bg-zinc-900/80 border-orange-500/20' 
                                                : 'hover:bg-zinc-900/40 border-transparent hover:border-zinc-900'
                                            }`}
                                        >
                                            <div className="relative w-28 sm:w-32 aspect-video rounded-xl overflow-hidden shrink-0 bg-black border border-white/5 shadow-md">
                                                <img 
                                                    src={moviePoster} 
                                                    className={`w-full h-full object-cover transition-transform duration-500 ${
                                                        isActive ? 'opacity-50 scale-105' : 'opacity-80 group-hover:opacity-100'
                                                    }`} 
                                                    alt={ep.title}
                                                    referrerPolicy="no-referrer"
                                                />
                                                <span className="absolute bottom-1 right-1 bg-black/85 text-white text-[8px] font-black px-1 rounded">HD</span>
                                                {isActive && (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="flex items-end gap-0.5 h-3">
                                                            <div className="w-0.5 bg-orange-500 animate-[bounce_1s_infinite] h-full"></div>
                                                            <div className="w-0.5 bg-orange-500 animate-[bounce_1.2s_infinite] h-2/3"></div>
                                                            <div className="w-0.5 bg-orange-500 animate-[bounce_0.8s_infinite] h-full"></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col justify-center min-w-0 flex-1">
                                                <span className="text-[9px] font-black tracking-widest text-orange-500 uppercase mb-1">{i + 1}-QISM</span>
                                                <h4 className={`text-xs font-bold line-clamp-2 leading-tight ${isActive ? 'text-white font-black' : 'text-zinc-300'}`}>{ep.title}</h4>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Settings Modal Window (Yangi modal oyna for expanded player preferences) */}
                    {showSettings && (
                        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 select-none animate-fade-in pointer-events-auto">
                            <div className="w-full max-w-2xl bg-zinc-950/98 backdrop-blur-3xl border border-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-[0_24px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90%] text-white">
                                
                                {/* Header */}
                                <div className="flex justify-between items-start border-b border-zinc-850 pb-4 mb-4 shrink-0">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-orange-600/10 text-orange-500 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-orange-500/20">Sozlamalar paneli</span>
                                            <span className="text-zinc-500 text-[10px] font-bold">V1.0.4</span>
                                        </div>
                                        <h3 className="text-white font-black text-xs uppercase tracking-wide truncate max-w-sm sm:max-w-md">
                                            {displayTitle}
                                        </h3>
                                    </div>
                                    <button 
                                        onClick={() => setShowSettings(false)} 
                                        className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 hover:text-red-500 text-zinc-400 transition-all active:scale-95"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Main Modal Dashboard (Dual-pane) */}
                                <div className="flex-1 overflow-hidden flex flex-col sm:flex-row gap-4 min-h-0">
                                    
                                    {/* Sidebar Tab Selectors */}
                                    <div className="flex flex-row sm:flex-col overflow-x-auto sm:overflow-x-visible shrink-0 gap-1.5 sm:w-44 border-b sm:border-b-0 sm:border-r border-zinc-900 pb-2 sm:pb-0 sm:pr-4 scrollbar-none">
                                        {[
                                            { id: 'audio', label: 'Tarjima va Ovoz', icon: <Volume2 size={15} /> },
                                            { id: 'video', label: 'Sifat va Tezlik', icon: <BarChart2 size={15} /> },
                                            { id: 'display', label: 'Tasvir va O\'lcham', icon: <Sliders size={15} /> },
                                            { id: 'other', label: 'Taymer va Subtitr', icon: <Clock size={15} /> }
                                        ].map(tab => (
                                            <button 
                                                key={tab.id}
                                                onClick={() => setActiveModalTab(tab.id as any)}
                                                className={`flex items-center gap-2.5 py-3 px-3.5 rounded-xl text-left text-xs font-bold transition-all whitespace-nowrap ${
                                                    activeModalTab === tab.id 
                                                    ? 'bg-orange-600/10 text-orange-400 border border-orange-500/30' 
                                                    : 'hover:bg-white/5 text-zinc-400 hover:text-white border border-transparent'
                                                }`}
                                            >
                                                {tab.icon}
                                                <span>{tab.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Scrollable content pane */}
                                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-5 pb-4">
                                        
                                        {/* TAB 1: AUDIO & VOLUME */}
                                        {activeModalTab === 'audio' && (
                                            <div className="space-y-5 animate-fade-in">
                                                {/* Volume slider control */}
                                                <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-850/60 space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="p-2 bg-orange-600/10 border border-orange-500/20 text-orange-500 rounded-lg">
                                                                <Volume2 size={15} />
                                                            </div>
                                                            <span className="text-xs font-black uppercase tracking-wider text-zinc-300">Ovoz kuchaytirgich</span>
                                                        </div>
                                                        <span className="font-mono text-xs font-black text-orange-400">
                                                            {isMuted ? 'MUTE (0%)' : `${Math.round(volume * 100)}%`}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-3">
                                                        <button 
                                                            onClick={() => {
                                                                setIsMuted(!isMuted);
                                                                triggerHUD(!isMuted ? 'Ovoz o\'chirildi' : `Ovoz: ${Math.round(volume * 100)}%`, 'volume');
                                                            }}
                                                            className="p-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors shrink-0"
                                                        >
                                                            {isMuted || volume === 0 ? <VolumeX size={16} className="text-red-500 animate-pulse" /> : <Volume2 size={16} />}
                                                        </button>
                                                        <input 
                                                            type="range"
                                                            min="0"
                                                            max="1"
                                                            step="0.05"
                                                            value={isMuted ? 0 : volume}
                                                            onChange={(e) => {
                                                                const val = Number(e.target.value);
                                                                setVolume(val);
                                                                setIsMuted(false);
                                                                localStorage.setItem('player_volume', String(val));
                                                            }}
                                                            className="flex-1 accent-orange-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Dubbing language selector */}
                                                <div className="space-y-3">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">Tarjima (Dublyaj) tili</span>
                                                    <div className="grid grid-cols-1 md:grid-cols-1 gap-2.5">
                                                        {([
                                                            { key: 'uz', label: 'O\'zbekcha Tarjima (Dublyaj / Professional)', desc: 'Anilo guruhidan maxsus sifatli dublyaj' },
                                                            { key: 'original', label: 'Yaponcha (Asl / Subtitr bilan)', desc: 'Asl audio + o\'zbekcha/ruscha matn' },
                                                            { key: 'ru', label: 'Ruscha Tarjima (MVO / Sub)', desc: 'Rossiya yetakchi ovozli tarjimalari' }
                                                        ] as const).map(track => (
                                                            <button 
                                                                key={track.key} 
                                                                onClick={() => {
                                                                    setSelectedAudio(track.key);
                                                                    triggerHUD(`Tarjima: ${track.label.split('(')[0]}`, 'volume');
                                                                }}
                                                                className={`w-full flex justify-between items-center p-3.5 rounded-2xl text-left text-xs font-bold transition-all border ${
                                                                    selectedAudio === track.key 
                                                                    ? 'bg-orange-600/5 border-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.08)]' 
                                                                    : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-transparent hover:border-zinc-850'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${selectedAudio === track.key ? 'border-orange-500' : 'border-zinc-600'}`}>
                                                                        {selectedAudio === track.key && <div className="w-2 h-2 bg-orange-500 rounded-full" />}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-extrabold text-white text-xs leading-none mb-0.5">{track.label}</span>
                                                                        <span className="text-[9px] text-zinc-500/90 font-medium">{track.desc}</span>
                                                                    </div>
                                                                </div>
                                                                {selectedAudio === track.key && (
                                                                    <span className="bg-orange-600/20 text-orange-400 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-orange-500/20 shrink-0">Faol</span>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB 2: VIDEO & QUALITY */}
                                        {activeModalTab === 'video' && (
                                            <div className="space-y-5 animate-fade-in">
                                                {/* Video quality selector */}
                                                <div className="space-y-3">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">Tasvir Sifati</span>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {(['auto', '1080p', '720p', '480p'] as const).map(quality => (
                                                            <button 
                                                                key={quality} 
                                                                onClick={() => {
                                                                    setVideoQuality(quality);
                                                                    triggerHUD(`Sifati: ${quality === 'auto' ? 'Avtomatik' : quality}`, 'aspect');
                                                                }}
                                                                className={`flex flex-col gap-1 p-3.5 rounded-2xl text-left text-xs font-bold transition-all border ${
                                                                    videoQuality === quality 
                                                                    ? 'bg-orange-600/5 border-orange-500 text-white shadow-[0_4px_20px_rgba(249,115,22,0.1)]' 
                                                                    : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-transparent'
                                                                }`}
                                                            >
                                                                <div className="flex justify-between items-center w-full">
                                                                    <span className="uppercase text-white font-extrabold text-xs">{quality === 'auto' ? 'Avtomatik (Auto)' : `${quality}`}</span>
                                                                    <BarChart2 size={13} className={videoQuality === quality ? 'text-orange-500' : 'text-zinc-650'} />
                                                                </div>
                                                                <span className="text-[9px] text-zinc-500/90 leading-tight font-medium">
                                                                    {quality === 'auto' ? 'Tezlikka qarab moslashadi' : quality === '1080p' ? 'Full HD - Yuqori tiniqlik' : quality === '720p' ? 'HD - Optimal balans' : 'SD - Mobil trafik tejovchi'}
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Playback Speed selector */}
                                                <div className="space-y-3 pt-2">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">Tezlik (Playback speed)</span>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(speed => (
                                                            <button 
                                                                key={speed} 
                                                                onClick={() => {
                                                                    setPlaybackRate(speed);
                                                                    triggerHUD(`Tezlik ${speed}x`, 'play');
                                                                }}
                                                                className={`py-3.5 rounded-xl text-center text-xs font-black transition-all border ${
                                                                    playbackRate === speed 
                                                                    ? 'bg-orange-600/10 border-orange-500 text-orange-400' 
                                                                    : 'bg-white/5 hover:bg-white/10 text-zinc-350 border-transparent'
                                                                }`}
                                                            >
                                                                {speed === 1.0 ? 'Normal (1x)' : `${speed}x`}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB 3: DISPLAY CONTROLS */}
                                        {activeModalTab === 'display' && (
                                            <div className="space-y-5 animate-fade-in">
                                                {/* Sliders for brightness and contrast */}
                                                <div className="space-y-4 bg-zinc-900/40 p-4 rounded-2xl border border-zinc-850/60">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 block">Kengaytirilgan Ekran Tasviri</span>
                                                    
                                                    {/* Brightness slider */}
                                                    <div className="space-y-1.5">
                                                        <div className="flex justify-between text-xs font-bold text-zinc-400">
                                                            <div className="flex items-center gap-1.5"><SunDim size={14} className="text-zinc-500" /> <span>Yorqinlik (Brightness)</span></div>
                                                            <span className="text-orange-500 font-mono text-xs">{brightness}%</span>
                                                        </div>
                                                        <input 
                                                            type="range"
                                                            min="50"
                                                            max="150"
                                                            value={brightness}
                                                            onChange={(e) => setBrightness(Number(e.target.value))}
                                                            className="w-full accent-orange-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                                                        />
                                                    </div>

                                                    {/* Contrast slider */}
                                                    <div className="space-y-1.5 pt-2 border-t border-zinc-900">
                                                        <div className="flex justify-between text-xs font-bold text-zinc-400">
                                                            <div className="flex items-center gap-1.5"><SlidersHorizontal size={14} className="text-zinc-500" /> <span>Kontrast (Contrast)</span></div>
                                                            <span className="text-orange-500 font-mono text-xs">{contrast}%</span>
                                                        </div>
                                                        <input 
                                                            type="range"
                                                            min="80"
                                                            max="130"
                                                            value={contrast}
                                                            onChange={(e) => setContrast(Number(e.target.value))}
                                                            className="w-full accent-orange-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Ambient and scale mode configs */}
                                                <div className="grid grid-cols-2 gap-3 pt-1">
                                                    <div className="bg-zinc-900/40 p-3.5 rounded-2xl border border-zinc-850/60 leading-tight space-y-2.5">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-[#555]">KINO CHONG'I</span>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs font-bold text-white">Yorug'lik Glow</span>
                                                            <button 
                                                                onClick={() => setAmbientGlow(!ambientGlow)}
                                                                className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full transition-all border ${ambientGlow ? 'bg-orange-600/10 text-orange-400 border-orange-500/20' : 'bg-zinc-800 text-zinc-500 border-transparent'}`}
                                                            >
                                                                {ambientGlow ? 'Yoqiq' : 'Ochiq'}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="bg-zinc-900/40 p-3.5 rounded-2xl border border-zinc-850/60 leading-tight space-y-2.5">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-[#555]">PROPORSIYA</span>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs font-bold text-white">Ekran o'lchami</span>
                                                            <button 
                                                                onClick={() => setResizeMode(prev => prev === 'contain' ? 'cover' : 'contain')}
                                                                className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 hover:text-white text-orange-400"
                                                            >
                                                                {resizeMode === 'contain' ? 'Original' : 'Kengaytirilgan'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB 4: SUBTITLES & SLEEP TIMER */}
                                        {activeModalTab === 'other' && (
                                            <div className="space-y-5 animate-fade-in">
                                                {/* Subtitles controls */}
                                                <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-850/60 space-y-3">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 block">Subtitr Matnlari</span>
                                                    
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {([
                                                            { key: 'none', label: 'O\'chirib qo\'yish' },
                                                            { key: 'uz', label: 'O\'zbekcha' },
                                                            { key: 'ru', label: 'Ruscha Matnlar' }
                                                        ] as const).map(sub => (
                                                            <button 
                                                                key={sub.key} 
                                                                onClick={() => setSelectedSubtitle(sub.key)}
                                                                className={`py-3 px-1 rounded-xl text-center text-[11px] font-black transition-all border ${
                                                                    selectedSubtitle === sub.key 
                                                                    ? 'bg-orange-600/10 border-orange-500 text-orange-400' 
                                                                    : 'bg-white/5 hover:bg-white/10 text-zinc-400 border-transparent'
                                                                }`}
                                                            >
                                                                {sub.label.split(' ')[0]}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {selectedSubtitle !== 'none' && (
                                                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-900/80">
                                                            <div>
                                                                <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 block mb-1">Matn Hajmi</span>
                                                                <div className="grid grid-cols-3 gap-1">
                                                                    {(['sm', 'md', 'lg'] as const).map(sz => (
                                                                        <button 
                                                                            key={sz} 
                                                                            onClick={() => setSubtitleSize(sz)}
                                                                            className={`py-1 rounded text-[9px] text-center font-bold transition-all ${subtitleSize === sz ? 'bg-zinc-800 text-white border border-orange-500/20' : 'bg-transparent text-zinc-500'}`}
                                                                        >
                                                                            {sz === 'sm' ? 'Kichik' : sz === 'md' ? 'Norma' : 'Katta'}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 block mb-1">Rangi</span>
                                                                <div className="grid grid-cols-3 gap-1">
                                                                    {(['white', 'yellow', 'green'] as const).map(col => (
                                                                        <button 
                                                                            key={col} 
                                                                            onClick={() => setSubtitleColor(col)}
                                                                            className={`py-1 rounded text-[9px] text-center font-bold transition-all ${subtitleColor === col ? 'bg-zinc-800 text-white border border-orange-500/20' : 'bg-transparent text-zinc-500'}`}
                                                                        >
                                                                            {col === 'white' ? 'Oq' : col === 'yellow' ? 'Sariq' : 'Yashil'}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Sleep timer */}
                                                <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-850/60 space-y-3">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 block">Uxlash Taymeri (Avtomatik ijrodan to'xtatish)</span>
                                                    
                                                    <div className="grid grid-cols-5 gap-1.5">
                                                        {[
                                                            { val: null, label: 'Off' },
                                                            { val: 15, label: '15m' },
                                                            { val: 30, label: '30m' },
                                                            { val: 45, label: '45m' },
                                                            { val: 60, label: '60m' }
                                                        ].map(timerOpt => (
                                                            <button 
                                                                key={timerOpt.val ?? 'off'} 
                                                                onClick={() => {
                                                                    setActiveSleepTimer(timerOpt.val);
                                                                    setSleepTimerSecondsLeft(timerOpt.val ? timerOpt.val * 60 : null);
                                                                    if (timerOpt.val) {
                                                                        triggerHUD(`Taymer o'rnatildi: ${timerOpt.val} min`, 'play');
                                                                    } else {
                                                                        triggerHUD(`Uxlash taymeri yopildi`, 'play');
                                                                    }
                                                                }}
                                                                className={`py-2 rounded-xl text-center text-[10px] font-black transition-all border ${
                                                                    activeSleepTimer === timerOpt.val 
                                                                    ? 'bg-orange-600/10 border-orange-500 text-orange-400' 
                                                                    : 'bg-white/5 hover:bg-white/10 text-zinc-400 border-transparent'
                                                                }`}
                                                            >
                                                                {timerOpt.label}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {activeSleepTimer !== null && (
                                                        <div className="flex justify-between items-center p-2.5 bg-black/40 border border-zinc-850 rounded-xl text-[11px] font-bold">
                                                            <span className="text-zinc-500 uppercase tracking-wider text-[9px]">Avto pauza uchun orqaga hisoblash</span>
                                                            <span className="text-orange-500 font-mono text-xs font-black">
                                                                {sleepTimerSecondsLeft !== null 
                                                                    ? `${Math.floor(sleepTimerSecondsLeft / 60)}m ${sleepTimerSecondsLeft % 60}s` 
                                                                    : `${activeSleepTimer}m 00s`
                                                                }
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer Confirmation */}
                                <div className="border-t border-zinc-850 pt-3.5 mt-3.5 flex justify-end shrink-0">
                                    <button 
                                        onClick={() => setShowSettings(false)}
                                        className="px-6 py-2.5 bg-orange-600 text-white rounded-xl text-xs font-black hover:bg-orange-700 hover:scale-[1.03] active:scale-95 transition-all shadow-[0_4px_20px_rgba(249,115,22,0.2)]"
                                    >
                                        TASDIQLASH VA YOPISH
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
