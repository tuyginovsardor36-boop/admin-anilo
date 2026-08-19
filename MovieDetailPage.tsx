
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Play, Star, Lock, ArrowLeft, MessageSquare, User, Bookmark, Share2, ChevronDown, Mic, Send, Trash2, Edit2, Reply, Info, Calendar, Globe, Layers, Clock, CheckCircle, Eye, TrendingUp, XCircle, CornerUpLeft } from 'lucide-react';
import { supabase } from './services/supabaseClient';
import { getUserProfile, getMovieEpisodes, getMovieReviews, addReview, deleteReview, updateReview, getMovies, isMovieSaved, toggleSaveMovie, getUserIdByUsername, createNotification } from './services/dbService';
import { Movie, UserProfile, Episode } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useNotification } from './hooks/useNotification';
import { MovieCard } from './components/MovieCard';
import { VerifiedBadge } from './components/VerifiedBadge';

interface MovieDetailPageProps {
  movie: Movie;
  onBack: () => void;
  onPlay: () => void;
  onEpisodePlay?: (episode: Episode) => void;
  onArtistClick?: (userId: string) => void;
  onMovieClick?: (movie: Movie) => void;
}

export const MovieDetailPage: React.FC<MovieDetailPageProps> = ({ movie, onBack, onPlay, onEpisodePlay, onArtistClick, onMovieClick }) => {
  const moviePoster = movie.poster_url || movie.posterUrl || '';
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [relatedMovies, setRelatedMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'episodes' | 'info' | 'comments'>('episodes');
  const [scrollY, setScrollY] = useState(0);

  // Episodes Enhanced State
  const [episodeSearch, setEpisodeSearch] = useState('');
  const [episodeSort, setEpisodeSort] = useState<'asc' | 'desc'>('asc');
  const [episodeFilter, setEpisodeFilter] = useState<'all' | 'watched' | 'unwatched'>('all');
  const [watchedEpisodes, setWatchedEpisodes] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(`watched_ep_ids_${movie.id || 0}`);
      return stored ? JSON.parse(stored) : [];
    } catch (e) { return []; }
  });

  // User Rating State
  const [userRating, setUserRating] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(`user_rating_${movie.id || 0}`);
      return stored ? Number(stored) : 0;
    } catch (e) { return 0; }
  });
  const [ratingHover, setRatingHover] = useState(0);

  // Comment Reactions State
  const [commentReactions, setCommentReactions] = useState<Record<number, Record<string, number>>>({});
  const [userReactions, setUserReactions] = useState<Record<number, string>>({});

  // Comment State
  const [rating, setRating] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [replyToComment, setReplyToComment] = useState<any | null>(null);

  const { addNotification } = useNotification();
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    init();
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // SEO: Dynamic Title & Meta
    document.title = `${movie.title} (O'zbek tilida) ko'rish - Anilo.uz`;
    
    // SEO: Inject JSON-LD for Google Card
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "Movie",
        "name": movie.title,
        "image": moviePoster,
        "description": movie.plot,
        "datePublished": movie.year.toString(),
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": finalRating.toFixed(1),
            "bestRating": "5",
            "worstRating": "1",
            "ratingCount": "100"
        },
        "video": {
            "@type": "VideoObject",
            "name": movie.title,
            "description": movie.plot,
            "thumbnailUrl": moviePoster,
            "uploadDate": new Date().toISOString(),
            "contentUrl": window.location.href
        }
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'json-ld-movie';
    script.text = JSON.stringify(schemaData);
    document.head.appendChild(script);
    
    return () => {
        window.removeEventListener('scroll', handleScroll);
        document.title = "Anilo.uz | Anime Olami";
        const oldScript = document.getElementById('json-ld-movie');
        if (oldScript) oldScript.remove();
    };
  }, [movie.id, movie.title]);

  useEffect(() => {
      if (activeTab === 'comments') {
          scrollToBottom();
      }
  }, [activeTab, reviews]);

  const scrollToBottom = () => {
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const init = async () => {
      setIsLoading(true);
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
              const profile = await getUserProfile(user.id);
              setUserProfile(profile as UserProfile);
              const saved = await isMovieSaved(user.id, movie.id!);
              setIsSaved(saved);
          }
          
          const [eps, revs, allMovies] = await Promise.all([
              getMovieEpisodes(movie.id!),
              getMovieReviews(movie.id!),
              getMovies()
          ]);
          
          setEpisodes(eps);
          setReviews(revs);
          
          // Initialize reactions
          let loadedReactions: Record<number, Record<string, number>> = {};
          let loadedMyReactions: Record<number, string> = {};
          try {
              const storedReactions = localStorage.getItem(`comment_reactions_${movie.id || 0}`);
              const myStoredReactions = localStorage.getItem(`my_reactions_${movie.id || 0}`);
              loadedReactions = storedReactions ? JSON.parse(storedReactions) : {};
              loadedMyReactions = myStoredReactions ? JSON.parse(myStoredReactions) : {};
              
              // Seed comments with natural baseline emoji counts if not already present
              revs.forEach((r: any) => {
                  if (!loadedReactions[r.id]) {
                      const seed: Record<string, number> = { '👍': 0, '❤️': 0, '😂': 0, '🔥': 0, '😮': 0 };
                      const hash = r.id % 5;
                      if (hash === 0) {
                          seed['👍'] = Math.floor((r.id * 7) % 18) + 2;
                          seed['🔥'] = Math.floor((r.id * 11) % 12) + 1;
                      } else if (hash === 1) {
                          seed['❤️'] = Math.floor((r.id * 13) % 15) + 3;
                          seed['👍'] = Math.floor((r.id * 3) % 8) + 1;
                      } else if (hash === 2) {
                          seed['🔥'] = Math.floor((r.id * 19) % 25) + 5;
                      } else if (hash === 3) {
                          seed['😂'] = Math.floor((r.id * 17) % 6);
                          seed['👍'] = Math.floor((r.id * 23) % 14) + 2;
                      } else {
                          seed['😮'] = Math.floor((r.id * 5) % 4);
                          seed['❤️'] = Math.floor((r.id * 29) % 10) + 1;
                      }
                      loadedReactions[r.id] = seed;
                  }
              });
              
              localStorage.setItem(`comment_reactions_${movie.id || 0}`, JSON.stringify(loadedReactions));
          } catch (e) {
              console.error("Reactions load error:", e);
          }
          
          setCommentReactions(loadedReactions);
          setUserReactions(loadedMyReactions);
          
          const genres = movie.genre.split(',').map(g => g.trim());
          const related = allMovies.filter(m => 
              m.id !== movie.id && 
              m.genre.split(',').some(g => genres.includes(g.trim()))
          ).slice(0, 12);
          setRelatedMovies(related);

      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
  };

  const isPremiumUser = useMemo(() => {
      if (!userProfile) return false;
      const hasSubscription = userProfile.subscription_end_at && new Date(userProfile.subscription_end_at) > new Date();
      return !!(hasSubscription || ['admin', 'owner', 'manager'].includes(userProfile.role));
  }, [userProfile]);

  const canWatch = movie.access_type === 'free' || isPremiumUser;
  const viewCount = (movie as any).view_count || Math.floor(Math.random() * 5000) + 1000;

  const finalRating = useMemo(() => {
      const base = Number(movie.rating) || 5.0;
      if (userRating > 0) {
          return ((base * 9) + userRating) / 10;
      }
      return base;
  }, [movie.rating, userRating]);

  // --- ACTIONS ---

  const handleReviewSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!userProfile) return addNotification({ type: 'warning', title: 'Kirish kerak', message: 'Fikr bildirish uchun tizimga kiring.' });
      if (!commentText.trim()) return;

      setIsSubmittingReview(true);
      try {
          const mentionPattern = /@(\w+)/g;
          let match;
          while ((match = mentionPattern.exec(commentText)) !== null) {
              const mentionedUsername = match[1];
              const mentionedUserId = await getUserIdByUsername(mentionedUsername);
              if (mentionedUserId && mentionedUserId !== userProfile.id) {
                  await createNotification(
                      mentionedUserId, 
                      "Sizni atmetka qilishdi!", 
                      `@${userProfile.username} sizni "${movie.title}" anime sharhlarida atmetka qildi.`,
                      'promo'
                  );
              }
          }

          if (editingReviewId) {
              await updateReview(editingReviewId, commentText);
              setEditingReviewId(null);
              addNotification({ type: 'success', title: 'Yangilandi', message: 'Sharhingiz o\'zgartirildi.' });
          } else {
              await addReview(movie.id!, userProfile.id, rating, commentText, replyToComment?.id);
              
              if (replyToComment && replyToComment.user_id !== userProfile.id) {
                  await createNotification(
                      replyToComment.user_id,
                      "Xabaringizga javob berishdi",
                      `@${userProfile.username} sizning "${movie.title}" animesidagi fikringizga javob berdi.`,
                      'info'
                  );
              }
          }
          setCommentText('');
          setReplyToComment(null);
          setRating(5);
          const revs = await getMovieReviews(movie.id!);
          setReviews(revs);
          scrollToBottom();
      } catch (e: any) {
          addNotification({ type: 'error', title: 'Xatolik', message: e.message || 'Jarayonda xatolik yuz berdi.' });
      } finally {
          setIsSubmittingReview(false);
      }
  };

  const handleDeleteReview = async (id: number) => {
      if(!window.confirm("O'chirmoqchimisiz?")) return;
      try {
          await deleteReview(id);
          setReviews(prev => prev.filter(r => r.id !== id));
          addNotification({ type: 'success', title: 'O\'chirildi', message: 'Sharh o\'chirildi.' });
      } catch (e) {
          addNotification({ type: 'error', title: 'Xatolik', message: 'O\'chirishda xatolik.' });
      }
  };

  const handleReply = (comment: any) => {
      setReplyToComment({
          id: comment.id,
          username: comment.profiles?.username || 'user',
          text: comment.comment,
          user_id: comment.user_id
      });
      commentInputRef.current?.focus();
  };

  const handleEmojiClick = (commentId: number, emoji: string) => {
      setCommentReactions(prev => {
          const commentReacs = { ...(prev[commentId] || { '👍': 0, '❤️': 0, '😂': 0, '🔥': 0, '😮': 0 }) };
          const myPrevEmoji = userReactions[commentId];
          
          if (myPrevEmoji === emoji) {
              commentReacs[emoji] = Math.max(0, (commentReacs[emoji] || 1) - 1);
              const nextMy = { ...userReactions };
              delete nextMy[commentId];
              setUserReactions(nextMy);
              localStorage.setItem(`my_reactions_${movie.id || 0}`, JSON.stringify(nextMy));
          } else {
              if (myPrevEmoji) {
                  commentReacs[myPrevEmoji] = Math.max(0, (commentReacs[myPrevEmoji] || 1) - 1);
              }
              commentReacs[emoji] = (commentReacs[emoji] || 0) + 1;
              const nextMy = { ...userReactions, [commentId]: emoji };
              setUserReactions(nextMy);
              localStorage.setItem(`my_reactions_${movie.id || 0}`, JSON.stringify(nextMy));
          }
          
          const nextReacs = { ...prev, [commentId]: commentReacs };
          localStorage.setItem(`comment_reactions_${movie.id || 0}`, JSON.stringify(nextReacs));
          return nextReacs;
      });
  };

  const handleToggleWatched = (episodeId: number, e?: React.MouseEvent) => {
      if (e) {
          e.stopPropagation();
      }
      setWatchedEpisodes(prev => {
          const isIncluded = prev.includes(episodeId);
          const next = isIncluded ? prev.filter(id => id !== episodeId) : [...prev, episodeId];
          localStorage.setItem(`watched_ep_ids_${movie.id || 0}`, JSON.stringify(next));
          addNotification({
              type: 'success',
              title: isIncluded ? "Ko'rilmagan" : "Ko'rilgan",
              message: isIncluded ? "Qism ko'rilmagan deb belgilandi." : "Qism ko'rilgan deb belgilandi!"
          });
          return next;
      });
  };

  const handleUserRatingCast = (ratingValue: number) => {
      setUserRating(ratingValue);
      localStorage.setItem(`user_rating_${movie.id || 0}`, String(ratingValue));
      addNotification({
          type: 'success',
          title: 'Rahmat!',
          message: `Siz ushbu animega ${ratingValue} ball berdingiz!`
      });
  };

  const renderCommentText = (text: string) => {
      const parts = text.split(/(@\w+)/g);
      return parts.map((part, i) => {
          if (part.startsWith('@')) {
              return <span key={i} className="text-blue-400 font-bold hover:underline cursor-pointer">{part}</span>;
          }
          return part;
      });
  };

  const handlePlayClick = () => {
      if (!canWatch) {
          addNotification({ type: 'warning', title: 'Premium Kerak', message: 'Tomosha qilish uchun obuna bo\'ling.' });
          return;
      }
      if (episodes.length > 0 && onEpisodePlay) onEpisodePlay(episodes[0]);
      else onPlay();
  };

  const handleEpisodeClick = (episode: Episode) => {
      if (!canWatch) {
          addNotification({ type: 'warning', title: 'Premium Kerak', message: 'Tomosha qilish uchun obuna bo\'ling.' });
          return;
      }
      if (onEpisodePlay) onEpisodePlay(episode);
      else onPlay();
  };

  const handleToggleSave = async () => {
      if (!userProfile) return addNotification({ type: 'warning', title: 'Kirish kerak', message: 'Saqlash uchun tizimga kiring.' });
      try {
          const savedStatus = await toggleSaveMovie(userProfile.id, movie.id!);
          setIsSaved(savedStatus);
          addNotification({ type: 'success', title: savedStatus ? 'Saqlandi' : 'O\'chirildi', message: savedStatus ? 'Saqlanganlarga qo\'shildi.' : 'Saqlanganlardan olib tashlandi.' });
      } catch (e) { console.error(e); }
  };

  const isAdminOrOwner = ['admin', 'owner'].includes(userProfile?.role || '');

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#050505]"><LoadingSpinner /></div>;

  return (
    <div className="bg-[#050505] min-h-screen text-white pb-32 overflow-x-hidden font-sans">
        
        {/* HERO HEADER */}
        <div className="relative w-full h-[85vh] lg:h-[90vh] overflow-hidden">
            <div 
                className="absolute inset-0 z-0"
                style={{ 
                    transform: `translateY(${scrollY * 0.4}px) scale(${1 + scrollY * 0.0005})`,
                    transition: 'transform 0.1s linear'
                }}
            >
                <img src={moviePoster} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
            </div>

            <div className="absolute top-0 left-0 right-0 pt-12 md:pt-8 px-4 md:px-8 flex justify-between items-center z-[100] animate-fade-in">
                <button onClick={onBack} className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all active:scale-90 border border-white/10 shadow-lg">
                    <ArrowLeft size={24} strokeWidth={2.5} />
                </button>
                <div className="flex gap-3">
                    <button className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all active:scale-90 border border-white/10 shadow-lg">
                        <Share2 size={24} />
                    </button>
                    <button 
                        onClick={handleToggleSave} 
                        className={`p-3 backdrop-blur-md rounded-full transition-all active:scale-90 border border-white/10 shadow-lg ${isSaved ? 'bg-orange-600 text-white border-orange-500 shadow-orange-500/50' : 'bg-black/40 text-white hover:bg-white/20'}`}
                    >
                        <Bookmark size={24} fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                </div>
            </div>

            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-16 max-w-7xl mx-auto w-full z-10 pb-20">
                <div className="max-w-3xl space-y-6 animate-slide-in-up">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className={`text-[10px] font-black px-4 py-1.5 rounded-lg uppercase tracking-widest shadow-lg ${movie.access_type === 'premium' ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white' : 'bg-gradient-to-r from-green-600 to-teal-600 text-white'}`}>
                            {movie.access_type === 'premium' ? 'PREMIUM' : 'BEPUL'}
                        </span>
                        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-lg">
                            <Star size={14} className="text-yellow-400 fill-yellow-400"/>
                            <span className="font-bold text-sm">{finalRating.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-lg">
                            <Eye size={14} className="text-blue-400"/>
                            <span className="font-bold text-sm">{viewCount.toLocaleString()}</span>
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none drop-shadow-2xl text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-gray-400">
                        {movie.title}
                    </h1>
                    
                    <div className="flex flex-wrap gap-2">
                        {movie.genre.split(',').slice(0, 3).map((g, i) => (
                            <span key={i} className="text-[10px] uppercase font-bold tracking-widest text-blue-200 border border-blue-500/30 bg-blue-900/20 px-3 py-1 rounded-full">{g.trim()}</span>
                        ))}
                    </div>

                    <p className="text-gray-200 text-sm md:text-lg leading-relaxed font-medium line-clamp-3 md:line-clamp-4 drop-shadow-md border-l-2 border-orange-500 pl-4">
                        {movie.plot}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button 
                            onClick={handlePlayClick}
                            className={`h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95 border-2 ${canWatch ? 'bg-white text-black border-white hover:bg-zinc-200' : 'bg-black/60 backdrop-blur text-white border-white/30'}`}
                        >
                            {canWatch ? <><Play fill="currentColor" size={20}/> Tomosha Qilish</> : <><Lock size={20}/> Premium Obuna</>}
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce opacity-50 z-20">
                <ChevronDown size={32} />
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-10 relative z-30">
            
            <div className="flex justify-center mb-10">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-1.5 rounded-full w-full max-w-lg shadow-2xl">
                    <div className="grid grid-cols-3 relative">
                        <div 
                            className={`absolute top-0 bottom-0 bg-white rounded-full transition-all duration-300 shadow-lg`}
                            style={{ 
                                left: activeTab === 'episodes' ? '0%' : activeTab === 'info' ? '33.33%' : '66.66%',
                                width: '33.33%'
                            }}
                        ></div>

                        <button onClick={() => setActiveTab('episodes')} className={`relative z-10 py-3 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${activeTab === 'episodes' ? 'text-black' : 'text-zinc-400 hover:text-white'}`}>
                            <Play size={14} fill={activeTab==='episodes' ? 'currentColor' : 'none'}/> <span>Qismlar</span>
                        </button>
                        
                        <button onClick={() => setActiveTab('info')} className={`relative z-10 py-3 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${activeTab === 'info' ? 'text-black' : 'text-zinc-400 hover:text-white'}`}>
                            <Info size={14} fill={activeTab==='info' ? 'currentColor' : 'none'}/> <span>Info</span>
                        </button>

                        <button onClick={() => setActiveTab('comments')} className={`relative z-10 py-3 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${activeTab === 'comments' ? 'text-black' : 'text-zinc-400 hover:text-white'}`}>
                            <MessageSquare size={14} fill={activeTab==='comments' ? 'currentColor' : 'none'}/> <span>Chat</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="animate-fade-in min-h-[400px]">
                {activeTab === 'episodes' && (() => {
                    let processedEpisodes = [...episodes];
                    
                    if (episodeSearch) {
                        processedEpisodes = processedEpisodes.filter(ep => 
                            ep.title.toLowerCase().includes(episodeSearch.toLowerCase()) ||
                            ep.title.includes(episodeSearch)
                        );
                    }
                    
                    if (episodeFilter === 'watched') {
                        processedEpisodes = processedEpisodes.filter(ep => watchedEpisodes.includes(ep.id));
                    } else if (episodeFilter === 'unwatched') {
                        processedEpisodes = processedEpisodes.filter(ep => !watchedEpisodes.includes(ep.id));
                    }
                    
                    if (episodeSort === 'desc') {
                        processedEpisodes.reverse();
                    }
                    
                    const totalEps = episodes.length;
                    const watchedCount = episodes.filter(ep => watchedEpisodes.includes(ep.id)).length;
                    const watchedPercent = totalEps > 0 ? Math.round((watchedCount / totalEps) * 100) : 0;

                    return (
                        <div className="space-y-6 animate-slide-in-up">
                            {/* Rich Progress Tracker */}
                            {totalEps > 0 && (
                                <div className="p-5 bg-zinc-900/40 border border-white/5 rounded-3xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Ko'rish holati</h4>
                                        <p className="text-xs text-zinc-500 font-medium">{totalEps} qismdan {watchedCount} tasi ko'rildi ({watchedPercent}%)</p>
                                    </div>
                                    <div className="flex-1 max-w-md bg-zinc-950 h-2.5 rounded-full overflow-hidden relative border border-white/5 shadow-inner">
                                        <div 
                                            className="h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(249,115,22,0.5)]"
                                            style={{ width: `${watchedPercent}%` }}
                                        ></div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (watchedCount === totalEps) {
                                                setWatchedEpisodes([]);
                                                localStorage.setItem(`watched_ep_ids_${movie.id || 0}`, JSON.stringify([]));
                                            } else {
                                                const allIds = episodes.map(e => e.id);
                                                setWatchedEpisodes(allIds);
                                                localStorage.setItem(`watched_ep_ids_${movie.id || 0}`, JSON.stringify(allIds));
                                            }
                                        }}
                                        className="text-[9px] font-black uppercase tracking-widest text-orange-400 hover:text-orange-300 transition-colors bg-orange-950/20 border border-orange-500/20 px-4 py-2.5 rounded-xl cursor-pointer"
                                    >
                                        {watchedCount === totalEps ? "Barchasini ko'rilmagan qilish" : "Barchasini ko'rildi qilish"}
                                    </button>
                                </div>
                            )}

                            {/* Control Bar */}
                            <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                                {/* Search */}
                                <div className="relative flex-1 max-w-sm">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-500">
                                        <span className="text-xs font-bold font-mono">🔍</span>
                                    </span>
                                    <input 
                                        type="text" 
                                        value={episodeSearch}
                                        onChange={e => setEpisodeSearch(e.target.value)}
                                        placeholder="Qism nomi yoki raqamini qidirish..."
                                        className="w-full h-11 bg-zinc-900/60 hover:bg-zinc-950 border border-white/5 hover:border-white/10 rounded-2xl pl-10 pr-10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50 transition-all font-medium"
                                    />
                                    {episodeSearch && (
                                        <button 
                                            onClick={() => setEpisodeSearch('')}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-white"
                                        >
                                            <span className="text-xs font-black">✕</span>
                                        </button>
                                    )}
                                </div>

                                {/* Filters and sorting */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-0.5 flex gap-0.5">
                                        {(['all', 'unwatched', 'watched'] as const).map(f => (
                                            <button 
                                                key={f}
                                                onClick={() => setEpisodeFilter(f)}
                                                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${episodeFilter === f ? 'bg-orange-600 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
                                            >
                                                {f === 'all' ? 'Barchasi' : f === 'unwatched' ? 'Ko\'rilmagan' : 'Ko\'rilgan'}
                                            </button>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={() => setEpisodeSort(p => p === 'asc' ? 'desc' : 'asc')}
                                        className="h-11 px-4 bg-zinc-900/60 border border-white/5 rounded-2xl text-zinc-400 hover:text-white hover:border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 text-xs font-black uppercase tracking-wider"
                                    >
                                        <span>Tartib:</span>
                                        <span className="text-orange-400 font-bold">{episodeSort === 'asc' ? 'Bosbosh' : 'Yaqinlar'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Episode cards grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {processedEpisodes.length > 0 ? processedEpisodes.map((ep, i) => {
                                    const epIdx = episodes.findIndex(e => e.id === ep.id);
                                    const isEpWatched = watchedEpisodes.includes(ep.id);
                                    
                                    return (
                                        <div 
                                            key={ep.id} 
                                            onClick={() => {
                                                if (!watchedEpisodes.includes(ep.id)) {
                                                    const nextWatch = [...watchedEpisodes, ep.id];
                                                    setWatchedEpisodes(nextWatch);
                                                    localStorage.setItem(`watched_ep_ids_${movie.id || 0}`, JSON.stringify(nextWatch));
                                                }
                                                handleEpisodeClick(ep);
                                            }} 
                                            className={`group flex items-center p-3 rounded-2xl cursor-pointer transition-all border ${isEpWatched ? 'bg-zinc-950/40 border-emerald-500/10 hover:border-emerald-500/30' : 'bg-zinc-900/80 border-white/5 hover:border-orange-500/50 hover:bg-zinc-850'}`}
                                        >
                                            <div className="relative w-28 h-16 sm:w-32 sm:h-20 bg-black rounded-xl overflow-hidden flex-shrink-0 mr-4">
                                                <img src={moviePoster} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${isEpWatched ? 'opacity-30' : 'opacity-60'}`} alt=""/>
                                                
                                                {isEpWatched && (
                                                    <div className="absolute top-1 left-1 bg-emerald-600/90 text-white backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-0.5 shadow-md">
                                                        <span>✓ KO'RILDI</span>
                                                    </div>
                                                )}

                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isEpWatched ? 'bg-emerald-600' : 'bg-white/20 backdrop-blur group-hover:bg-orange-600 group-hover:scale-110'}`}>
                                                        <Play size={12} fill="white" className="text-white ml-0.5"/>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex-1 min-w-0 pr-1">
                                                <h4 className={`font-bold text-sm truncate transition-colors ${isEpWatched ? 'text-zinc-500' : 'text-white group-hover:text-orange-500'}`}>{ep.title}</h4>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{epIdx !== -1 ? epIdx + 1 : i + 1}-QISM</span>
                                                    <span className="text-[8px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono font-bold">HD 1080p</span>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleWatched(ep.id);
                                                }}
                                                title={isEpWatched ? "Ko'rilmagan qilish" : "Ko'rilgan deb belgilash"}
                                                className={`p-2.5 rounded-xl border shrink-0 transition-all cursor-pointer ${isEpWatched ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-white' : 'text-zinc-600 border-transparent hover:text-white hover:bg-white/5'}`}
                                            >
                                                <span className="text-[12px] font-bold font-mono leading-none">{isEpWatched ? "✓" : "○"}</span>
                                            </button>
                                        </div>
                                    );
                                }) : (
                                    <div className="col-span-full py-20 text-center bg-zinc-900/50 border border-dashed border-zinc-800 rounded-3xl">
                                        <p className="text-zinc-500 text-xs font-semibold">Hech qanday qism topilmadi.</p>
                                        <button onClick={handlePlayClick} className="mt-4 px-8 py-3 bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all rounded-xl shadow-lg">Kinoni ochish</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {activeTab === 'info' && (
                    <div className="max-w-5xl mx-auto space-y-8 animate-slide-in-up">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Plot and Genre Tags */}
                            <div className="md:col-span-2 bg-[#0c0c0c]/80 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-xl flex flex-col justify-between">
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-white mb-4 pl-3 border-l-4 border-orange-500 flex items-center gap-2">
                                        <span>📖</span> Syujet (Plot)
                                    </h3>
                                    <p className="text-zinc-300 text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                        {movie.plot || "Syujet ma'lumotlari kiritilmagan."}
                                    </p>
                                </div>

                                {movie.tags && (
                                    <div className="mt-8 pt-6 border-t border-white/5">
                                        <h4 className="text-[10px] uppercase tracking-widest text-zinc-500 font-black mb-3">Anime teglari</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {movie.tags.split(',').map((tag, i) => (
                                                <span key={i} className="text-[9px] uppercase font-bold tracking-widest bg-zinc-900/80 text-orange-300 border border-zinc-800/80 py-1.5 px-3 rounded-full hover:border-orange-500/40 cursor-pointer hover:bg-zinc-950 transition-all">
                                                    #{tag.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bento Details Widget Column */}
                            <div className="flex flex-col gap-6">
                                {/* Rating Evaluation box */}
                                <div className="bg-[#0c0c0c]/80 border border-white/5 rounded-3xl p-6 backdrop-blur-md shadow-xl text-center flex flex-col items-center justify-center space-y-4">
                                    <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-500">SIYOSAT VA REYTING</h4>
                                    
                                    <div className="space-y-1">
                                        <div className="text-3xl font-black text-white">{finalRating.toFixed(1)}</div>
                                        <div className="flex items-center justify-center gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={14} className={i < Math.round(finalRating) ? "text-yellow-400 fill-yellow-400" : "text-zinc-800"} />
                                            ))}
                                        </div>
                                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Sizning bahoingiz</p>
                                    </div>

                                    {/* Interactive Rating System */}
                                    <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white/5 rounded-full border border-white/5">
                                        {[1, 2, 3, 4, 5].map((stars) => (
                                            <button
                                                key={stars}
                                                type="button"
                                                onClick={() => handleUserRatingCast(stars)}
                                                onMouseEnter={() => setRatingHover(stars)}
                                                onMouseLeave={() => setRatingHover(0)}
                                                className="transition-all hover:scale-125 focus:outline-none cursor-pointer"
                                            >
                                                <Star
                                                    size={18}
                                                    className={`transition-colors ${
                                                        stars <= (ratingHover || userRating)
                                                            ? "text-orange-500 fill-orange-500"
                                                            : "text-zinc-600"
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    {userRating > 0 && (
                                        <p className="text-[9px] text-emerald-400 font-black tracking-widest uppercase">✓ Baholadingiz: {userRating}/5</p>
                                    )}
                                </div>

                                {/* Deep Metadata Details Grid */}
                                <div className="bg-[#0c0c0c]/80 border border-white/5 rounded-3xl p-6 backdrop-blur-md shadow-xl space-y-3.5 flex-1">
                                    <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-500">XUSUSIYATLARI</h4>
                                    
                                    <div className="space-y-2.5">
                                        <div className="flex justify-between items-center py-1.5 border-b border-white/5 text-xs">
                                            <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Chiqarilgan Yili:</span>
                                            <span className="font-bold text-white">{movie.year || "2024"}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1.5 border-b border-white/5 text-xs">
                                            <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Janrlar:</span>
                                            <span className="font-bold text-white text-right max-w-[150px] truncate" title={movie.genre}>{movie.genre || "Sarguzasht"}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1.5 border-b border-white/5 text-xs">
                                            <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Tili (Language):</span>
                                            <span className="font-black text-orange-400 uppercase tracking-widest text-[10px]">{movie.language || "O'zbekcha / Tarjima"}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1.5 border-b border-white/5 text-xs">
                                            <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Sifati:</span>
                                            <span className="font-black bg-white text-black px-1.5 py-0.5 rounded text-[8px] tracking-widest uppercase">{movie.quality || "FHD Ultra"}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1.5 border-b border-white/5 text-xs">
                                            <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Holati (Status):</span>
                                            <span className={`font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full ${movie.status === 'ongoing' ? 'bg-orange-600/20 text-orange-400 border border-orange-500/20' : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20'}`}>
                                                {movie.status === 'ongoing' ? 'Efirda (Ongoing)' : 'Yakunlangan'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-1.5 border-b border-white/5 text-xs">
                                            <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Ovoz berdi (Dub):</span>
                                            <span className="font-bold text-zinc-300 flex items-center gap-1">
                                                🎙️ {movie.translator || "Anilo Studio"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'comments' && (
                    <div className="max-w-3xl mx-auto flex flex-col h-[75vh] bg-[#0a0a0a] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden relative animate-slide-in-up">
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-40">
                            {reviews.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-700">
                                    <MessageSquare size={48} className="mb-4 opacity-20"/>
                                    <p className="font-black uppercase tracking-widest text-[10px]">Suhbatni boshlang...</p>
                                </div>
                            ) : (
                                reviews.map((rev) => {
                                    const isMe = userProfile?.id === rev.user_id;
                                    const isAdminComment = ['admin', 'owner'].includes(rev.profiles?.role);
                                    const isReply = !!rev.parent_id;
                                    const commentId = rev.id;
                                    const reacs = commentReactions[commentId] || { '👍': 0, '❤️': 0, '😂': 0, '🔥': 0, '😮': 0 };
                                    const myCurrentEmoji = userReactions[commentId];

                                    return (
                                        <div key={rev.id} id={`comment-${rev.id}`} className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className="flex-shrink-0 mt-1">
                                                <div className={`w-10 h-10 rounded-full overflow-hidden border-2 ${isAdminComment ? 'border-orange-500 shadow-orange-500/20 shadow-lg' : 'border-zinc-800 shadow-lg'}`}>
                                                    {rev.profiles?.avatar_url ? <img src={rev.profiles.avatar_url} className="w-full h-full object-cover" alt="avatar" /> : <User size={20} className="w-full h-full p-2 bg-zinc-900 text-zinc-600"/>}
                                                </div>
                                            </div>
                                            <div className={`max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                <div className="flex items-center gap-2 mb-1 px-2">
                                                    <span className={`text-[10px] font-black uppercase tracking-tight ${isAdminComment ? 'text-orange-500' : 'text-zinc-500'}`}>
                                                        {rev.profiles?.username || 'foydalanuvchi'}
                                                    </span>
                                                    {isAdminComment && <VerifiedBadge type="gold" className="w-3 h-3" />}
                                                </div>

                                                <div className={`p-4 rounded-[1.8rem] shadow-xl relative transition-all ${isMe ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-zinc-900 text-zinc-200 rounded-tl-none border border-white/5'}`}>
                                                    {isReply && (
                                                        <div 
                                                            onClick={() => document.getElementById(`comment-${rev.parent_id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                                            className={`mb-3 p-3 rounded-2xl border-l-4 cursor-pointer hover:bg-black/20 transition-colors ${isMe ? 'bg-orange-700/50 border-orange-400' : 'bg-black/20 border-orange-500'}`}
                                                        >
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-0.5">@{rev.parent?.profiles?.username}</p>
                                                            <p className="text-[11px] line-clamp-2 opacity-70 italic leading-tight">{rev.parent?.comment}</p>
                                                        </div>
                                                    )}

                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                        {renderCommentText(rev.comment)}
                                                    </p>
                                                    
                                                    {/* Star rating info of user */}
                                                    <div className="flex items-center justify-between gap-4 mt-2 mb-1">
                                                        <div className="flex items-center gap-0.5">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} size={8} className={i < rev.rating ? (isMe ? "text-orange-200 fill-orange-200" : "text-yellow-500 fill-yellow-500") : "opacity-20"} />
                                                            ))}
                                                        </div>
                                                        <span className={`text-[8px] font-mono opacity-40`}>{new Date(rev.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                                    </div>

                                                    {/* Interactive Emoji reactions row */}
                                                    <div className="flex flex-wrap items-center gap-1 pt-1.5 border-t border-white/5 mt-1.5">
                                                        {(['👍', '❤️', '😂', '🔥', '😮'] as const).map(emoji => {
                                                            const emojiCount = reacs[emoji] || 0;
                                                            const isSelected = myCurrentEmoji === emoji;
                                                            return (
                                                                <button 
                                                                    key={emoji}
                                                                    type="button"
                                                                    onClick={() => handleEmojiClick(rev.id, emoji)}
                                                                    className={`px-1.5 py-0.5 rounded-full text-[10px] flex items-center gap-1 transition-all border cursor-pointer ${isSelected ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 shadow-sm' : 'bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-zinc-300 border-transparent'}`}
                                                                >
                                                                    <span>{emoji}</span>
                                                                    {emojiCount > 0 && <span className="font-mono font-bold font-sans text-[9px]">{emojiCount}</span>}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div className="flex gap-4 mt-1.5 px-3">
                                                    <button onClick={() => handleReply(rev)} className="flex items-center gap-1 text-[9px] font-black text-zinc-600 hover:text-white uppercase tracking-widest transition-colors cursor-pointer"> <CornerUpLeft size={10}/> Javob</button>
                                                    {(isAdminOrOwner || isMe) && <button onClick={() => handleDeleteReview(rev.id)} className="text-[9px] font-black text-red-900/50 hover:text-red-500 uppercase tracking-widest transition-colors cursor-pointer text-red-700/80 hover:text-red-500">O'chirish</button>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={commentsEndRef} />
                        </div>

                        {/* Interactive Form Controls + Canned Replies */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent z-40 border-t border-white/5">
                            {/* Fast Chips panel */}
                            <div className="max-w-2xl mx-auto flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-2">
                                <span className="text-[8px] font-black tracking-widest text-zinc-500 shrink-0 uppercase">Tezkor:</span>
                                {[
                                    "Ajoyib anime! 🔥",
                                    "Keyingi qism qachon chiqadi? 🚀",
                                    "Ovoz berishganiga gap yo'q! 🎙️",
                                    "Tavsiya qilaman! 👍",
                                    "Sifat a'lo darajada! 😍"
                                ].map((phrase) => (
                                    <button
                                        key={phrase}
                                        type="button"
                                        onClick={() => setCommentText(prev => prev ? `${prev} ${phrase}` : phrase)}
                                        className="text-[9px] font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5 px-2.5 py-1.5 rounded-xl shrink-0 transition-colors cursor-pointer"
                                    >
                                        {phrase}
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={handleReviewSubmit} className="max-w-2xl mx-auto flex flex-col bg-[#121212] rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden">
                                {replyToComment && (
                                    <div className="flex items-center justify-between px-5 py-3 bg-white/5 border-b border-white/5 animate-fade-in">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-1 h-8 bg-orange-500 rounded-full flex-shrink-0"></div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Javob qaytarilmoqda: @{replyToComment.username}</p>
                                                <p className="text-xs text-zinc-500 truncate italic">{replyToComment.text}</p>
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => setReplyToComment(null)} className="p-2 text-zinc-500 hover:text-white transition-colors cursor-pointer">
                                            <XCircle size={18} />
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-end gap-2 p-3">
                                    <textarea 
                                        ref={commentInputRef}
                                        value={commentText}
                                        onChange={e => setCommentText(e.target.value)}
                                        placeholder="Xabar yozing (Fikr bildiring)..."
                                        className="flex-1 bg-transparent border-none text-sm text-white focus:ring-0 outline-none resize-none max-h-32 py-3 px-3 custom-scrollbar"
                                        rows={1}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleReviewSubmit(e as any);
                                            }
                                        }}
                                    />
                                    <button 
                                        type="submit"
                                        disabled={isSubmittingReview || !commentText.trim()}
                                        className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center hover:bg-orange-500 transition-all active:scale-90 disabled:opacity-50 shadow-lg shadow-orange-900/30 shrink-0 cursor-pointer"
                                    >
                                        {isSubmittingReview ? <LoadingSpinner /> : <Send size={20} />}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
