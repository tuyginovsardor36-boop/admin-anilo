import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { WelcomePage } from './WelcomePage';
import { SearchPage } from './SearchPage';
import { DashboardPage } from './DashboardPage';
import { AuthModal } from './components/AuthModal';
import { Movie, UserRole, Ad, Notification, Episode, UserProfile, LiveStream } from './types';
import { MovieDetailPage } from './MovieDetailPage';
import { VideoPlayerPage } from './VideoPlayerPage';
import { AdminPage } from './AdminPage';
import { DubDashboard } from './DubDashboard';
import { StudioPage } from './StudioPage';
import { ShopPage } from './ShopPage';
import { ShopAdminPage } from './ShopAdminPage';
import { CatalogPage } from './CatalogPage'; 
import { FandubDashboard } from './FandubDashboard';
import { RamazonPage } from './RamazonPage'; 
import { VideoAdPlayer } from './components/VideoAdPlayer';
import { NotificationContext } from './hooks/useNotification';
import { NotificationContainer } from './components/Notification';
import { AiAssistantPage } from './AiAssistantPage';
import { supabase } from './services/supabaseClient';
import { CopyrightPage } from './CopyrightPage';
import { ChatPage } from './ChatPage';
import { PWAReportPage } from './PWAReportPage';
import { Home, Search, Sparkles, User, X, Layers, LayoutGrid, ShoppingBag, WifiOff, RefreshCw, AlertTriangle, Moon, Star, Maximize2, Video, Users, Tv } from 'lucide-react';
import { getUserProfile, getMovies } from './services/dbService';
import { pruneCache, clearAppCache } from './services/cacheService';
import { HamburgerMenu } from './components/HamburgerMenu';
import { LegalDocs } from './components/LegalDocs';
import { PWAProvider } from './components/InstallPWA';

export type Page = 'welcome' | 'search' | 'dashboard' | 'ai-assistant' | 'admin' | 'copyright' | 'dub-dashboard' | 'studio' | 'shop' | 'shop-admin' | 'catalog' | 'fandub-dashboard' | 'ramazon' | 'chat' | 'pwa-report';
export type DashboardSubPage = 'main' | 'profile' | 'settings' | 'history' | 'saved' | 'account' | 'billing' | 'plans' | 'more' | 'support';
export type AdminSubPage = 'dashboard' | 'sessions' | 'broadcasts' | 'users' | 'movies' | 'settings' | 'financials' | 'support' | 'advertisements' | 'promocodes' | 'customization' | 'sitemap' | 'security' | 'stamp_tool' | 'bundle_manager';
export type LegalDocType = 'privacy' | 'terms';

// Ramazon bezaklari komponenti - Yorqinroq variant
const RamadanDecoration = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
    <div className="absolute top-20 left-[5%] ramadan-decoration" style={{ animationDelay: '0s' }}>
      <Moon size={50} className="text-orange-500 fill-orange-500/30" />
    </div>
    <div className="absolute top-60 right-[10%] ramadan-decoration" style={{ animationDelay: '2s' }}>
      <Star size={25} className="text-yellow-400 fill-yellow-400/50 shadow-xl" />
    </div>
    <div className="absolute bottom-1/3 left-[15%] ramadan-decoration" style={{ animationDelay: '4s' }}>
      <Star size={20} className="text-orange-400 fill-orange-400/20" />
    </div>
    <div className="absolute bottom-40 right-[5%] ramadan-decoration" style={{ animationDelay: '1s' }}>
      <Moon size={70} className="text-orange-600/40 rotate-180" />
    </div>
    <div className="absolute top-1/2 left-4 ramadan-decoration hidden md:block" style={{ animationDelay: '3s' }}>
      <Star size={15} className="text-white/20 fill-white/10" />
    </div>
  </div>
);

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('welcome');
  const [dashboardPage, setDashboardPage] = useState<DashboardSubPage>('main');
  const [adminPage, setAdminPage] = useState<AdminSubPage>('dashboard');
  
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('user');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine); 
  const [showRetryButton, setShowRetryButton] = useState(false); 
  const [initError, setInitError] = useState<string | null>(null);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [legalDocType, setLegalDocType] = useState<LegalDocType | null>(null);

  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [isPlayerActive, setIsPlayerActive] = useState(false);
  const [activeVideoAd, setActiveVideoAd] = useState<Ad | null>(null);

  // Global Live Stream State
  const [activeLiveStream, setActiveLiveStream] = useState<LiveStream | null>(null);
  const [isLiveMinimized, setIsLiveMinimized] = useState(false);
  const [isStreamerMode, setIsStreamerMode] = useState(false);
  const [isAnyLive, setIsAnyLive] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    // Replace existing notifications to avoid stacking ("rain" effect)
    setNotifications([{ id, ...notification }]);
  };
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const refreshProfile = async () => {
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
              const profile = await getUserProfile(user.id);
              if (profile) {
                  setUserProfile(profile);
                  setCurrentUserRole(profile.role);
                  setIsAuthenticated(true);
              }
          }
      } catch (e) {
          console.error("RefreshProfile Error:", e);
      }
  };

  const initApp = async () => {
      try {
          setIsAppReady(false);
          setInitError(null);
          setShowRetryButton(false);
          
          pruneCache();
          
          const safetyTimeout = setTimeout(() => {
              setShowRetryButton(true);
          }, 10000);

          const { data: { session }, error: sessionError } = await supabase.auth.getSession().catch(err => ({ data: { session: null }, error: err }));
          
          if (sessionError) throw sessionError;

          const params = new URLSearchParams(window.location.search);
          const pageParam = params.get('page') as Page;
          const movieIdParam = params.get('movie_id');

          if (session) {
              setIsAuthenticated(true); 
              await refreshProfile();
              
              // Restore persisted state for premium "tab & page retention" experience
              const persistedPage = localStorage.getItem('anilo_persisted_page') as Page;
              const persistedDashboardPage = localStorage.getItem('anilo_persisted_dashboard_page') as DashboardSubPage;
              const persistedIsPlayerActive = localStorage.getItem('anilo_persisted_is_player_active') === 'true';
              const persistedMovieRaw = localStorage.getItem('anilo_persisted_selected_movie');
              const persistedEpisodeRaw = localStorage.getItem('anilo_persisted_active_episode');
              
              if (persistedMovieRaw) {
                  try {
                      const movieObj = JSON.parse(persistedMovieRaw);
                      setSelectedMovie(movieObj);
                      if (persistedEpisodeRaw) {
                          setActiveEpisode(JSON.parse(persistedEpisodeRaw));
                      }
                      if (persistedIsPlayerActive) {
                          setIsPlayerActive(true);
                      }
                  } catch (e) {
                      console.error("Failed to restore persisted movie/episode data", e);
                  }
              }

              if (movieIdParam) {
                  const allMovies = await getMovies();
                  const found = allMovies.find(m => m.id === Number(movieIdParam));
                  if (found) setSelectedMovie(found);
              }

              if (pageParam && ['ramazon', 'search', 'shop', 'studio', 'catalog', 'chat'].includes(pageParam)) {
                  setPage(pageParam);
              } else if (persistedPage && ['welcome', 'search', 'dashboard', 'ai-assistant', 'admin', 'copyright', 'dub-dashboard', 'studio', 'shop', 'shop-admin', 'catalog', 'fandub-dashboard', 'ramazon', 'chat', 'pwa-report'].includes(persistedPage)) {
                  setPage(persistedPage);
                  if (persistedDashboardPage) setDashboardPage(persistedDashboardPage);
              } else {
                  setPage('dashboard');
              }
          } else {
              setPage('welcome');
          }
          
          clearTimeout(safetyTimeout);
          setIsAppReady(true);
      } catch (e: any) { 
          console.error("FATAL INIT ERROR:", e);
          setInitError(e.message || "Tizim yuklanishida xatolik");
          localStorage.removeItem('anilo_cache_all_movies_catalog');
      }
  };

  useEffect(() => {
    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
            setIsAuthenticated(true);
            refreshProfile();
        } else {
            setIsAuthenticated(false);
            setCurrentUserRole('user');
            setUserProfile(null);
            setPage('welcome');
        }
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
        subscription.unsubscribe();
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Path retention persistence - User exits: store tab / screen status dynamically
  useEffect(() => {
    if (isAppReady) {
      localStorage.setItem('anilo_persisted_page', page);
      localStorage.setItem('anilo_persisted_dashboard_page', dashboardPage);
      localStorage.setItem('anilo_persisted_is_player_active', String(isPlayerActive));
      
      if (selectedMovie) {
        localStorage.setItem('anilo_persisted_selected_movie', JSON.stringify(selectedMovie));
      } else {
        localStorage.removeItem('anilo_persisted_selected_movie');
      }
      
      if (activeEpisode) {
        localStorage.setItem('anilo_persisted_active_episode', JSON.stringify(activeEpisode));
      } else {
        localStorage.removeItem('anilo_persisted_active_episode');
      }
    }
  }, [page, dashboardPage, selectedMovie, activeEpisode, isPlayerActive, isAppReady]);

  const handleNavigation = (targetPage: Page) => {
    setPage(targetPage);
    if (targetPage === 'dashboard') setDashboardPage('main');
    setSelectedMovie(null);
    setIsSearchOpen(false);
    
    const newUrl = targetPage === 'welcome' ? '/' : `/?page=${targetPage}`;
    window.history.pushState({}, '', newUrl);
    window.scrollTo(0, 0);
  };

  const handleMovieClick = (movie: Movie) => {
    if (!isAuthenticated) setIsAuthModalOpen(true);
    else {
        setSelectedMovie(movie);
        setActiveEpisode(null);
        if (movie.id) {
            window.history.pushState({ movie_id: movie.id }, '', `?movie_id=${movie.id}`);
        }
        window.scrollTo(0, 0);
    }
  };

  const handleRepair = () => {
      clearAppCache();
      window.location.href = '/';
  };

  if (initError) {
      return (
          <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mb-6">
                  <AlertTriangle size={40} className="text-red-500" />
              </div>
              <h2 className="text-xl font-black text-white uppercase mb-2">Yuklanishda xato</h2>
              <p className="text-zinc-500 text-sm mb-8 max-w-xs">Kesh ma'lumotlari buzilgan bo'lishi mumkin. Ilovani ta'mirlashni bosing.</p>
              <button 
                onClick={handleRepair}
                className="w-full max-w-xs py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-orange-500 transition-all"
              >
                  <RefreshCw size={16} /> Tizimni Ta'mirlash
              </button>
          </div>
      );
  }

  if (!isAppReady) {
      return (
          <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center gap-4 relative">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.3em] animate-pulse">
                  {showRetryButton ? "Internet sekin..." : "Yuklanmoqda..."}
              </p>
              {showRetryButton && (
                  <button onClick={handleRepair} className="mt-4 text-[10px] text-orange-500 font-bold uppercase underline">Keshni tozalab kirish</button>
              )}
          </div>
      );
  }

  const shouldHideGlobalNav = selectedMovie || isPlayerActive || activeVideoAd || 
                             ['welcome', 'admin', 'copyright', 'fandub-dashboard'].includes(page);

  return (
    <PWAProvider>
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
        <NotificationContainer />
        
        {!isOnline && (
            <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest text-center py-1 z-[300] flex items-center justify-center gap-2">
                <WifiOff size={12} /> Offline Rejim
            </div>
        )}

        <div className="min-h-screen text-gray-100 flex flex-col bg-[#050505] relative">
          {!shouldHideGlobalNav && (
            <Header 
              onNavigate={handleNavigation} 
              onDashboardNavigate={setDashboardPage}
              currentPage={page} 
              isAuthenticated={isAuthenticated} 
              onLoginClick={() => setIsAuthModalOpen(true)}
              onSearchClick={() => setIsSearchOpen(true)}
              onSwitchRole={(r) => {if(['admin','owner'].includes(r)) setPage('admin')}}
              onLogout={() => supabase.auth.signOut()}
              isMenuOpen={isMenuOpen}
              setIsMenuOpen={setIsMenuOpen}
            />
          )}
          
          <main className={`flex-1 relative z-10 ${selectedMovie || isPlayerActive || page === 'welcome' ? '' : (page === 'copyright' ? '' : 'pt-20 pb-32 md:pb-20')}`}>
                {activeVideoAd && selectedMovie && <VideoAdPlayer ad={activeVideoAd} onFinish={() => {setActiveVideoAd(null); setIsPlayerActive(true);}} />}
                {isPlayerActive && selectedMovie && !activeVideoAd && (
                    <VideoPlayerPage movie={selectedMovie} episode={activeEpisode} onBack={() => setIsPlayerActive(false)} />
                )}
                
                {!isPlayerActive && !activeVideoAd && (
                  <>
                    {selectedMovie ? (
                      <MovieDetailPage 
                        movie={selectedMovie} 
                        onBack={() => setSelectedMovie(null)} 
                        onPlay={() => setIsPlayerActive(true)} 
                        onEpisodePlay={(episode) => { setActiveEpisode(episode); setIsPlayerActive(true); }} 
                        onArtistClick={setSelectedArtistId}
                        onMovieClick={handleMovieClick}
                      />
                    ) : (
                      <>
                        {page === 'welcome' && <WelcomePage onNavigate={handleNavigation} onSearch={handleNavigation as any} onMovieClick={handleMovieClick} onStart={() => setIsAuthModalOpen(true)} />}
                        {page === 'search' && <SearchPage initialQuery="" onNewSearch={() => {}} onMovieClick={handleMovieClick} />}
                        {page === 'catalog' && <CatalogPage onMovieClick={handleMovieClick} />}
                        {page === 'dashboard' && <DashboardPage viewUserId={selectedArtistId} currentPage={dashboardPage} onNavigate={setDashboardPage} onMainNavigate={handleNavigation} onSearch={() => {}} onLogout={() => supabase.auth.signOut()} onMovieClick={handleMovieClick} currentRole={currentUserRole} onSwitchRole={(r) => {if(['admin','owner'].includes(r)) setPage('admin')}} />}
                        {page === 'admin' && <AdminPage currentRole={currentUserRole} currentPage={adminPage} onNavigate={setAdminPage} onSwitchView={() => setPage('dashboard')} onLogout={() => supabase.auth.signOut()} />}
                        {page === 'ai-assistant' && <AiAssistantPage />}
                        {page === 'chat' && (
                          <ChatPage />
                        )}
                        {page === 'copyright' && <CopyrightPage onBack={() => setPage('welcome')} />}
                        {page === 'dub-dashboard' && <DubDashboard />}
                        {page === 'studio' && (
                          <StudioPage 
                            onArtistClick={setSelectedArtistId} 
                            onMovieClick={handleMovieClick} 
                          />
                        )}
                        {page === 'shop' && <ShopPage />}
                        {page === 'shop-admin' && <ShopAdminPage />}
                        {page === 'fandub-dashboard' && <FandubDashboard />}
                        {page === 'ramazon' && <RamazonPage onBack={() => setPage('dashboard')} />}
                        {page === 'pwa-report' && (
                          <div className="pt-20">
                            <PWAReportPage />
                            <button 
                              onClick={() => setPage('welcome')}
                              className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-white text-black rounded-full font-bold shadow-2xl z-50 flex items-center gap-2"
                            >
                              <Home size={18} /> Asosiyga qaytish
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
          </main>

          {isSearchOpen && (
              <div className="fixed inset-0 z-[200] bg-[#050505] animate-fade-in flex flex-col p-6 sm:p-10">
                  <button onClick={() => setIsSearchOpen(false)} className="absolute top-6 right-6 p-3 bg-zinc-800 rounded-full text-gray-400"><X size={28} /></button>
                  <div className="max-w-4xl mx-auto w-full pt-20">
                      <h2 className="text-4xl font-black tracking-tighter uppercase mb-8 text-white">Kashfiyot</h2>
                      <input type="text" autoFocus placeholder="Anime nomi..." onKeyDown={(e) => { if (e.key === 'Enter') { handleNavigation('search'); setIsSearchOpen(false); } }} className="w-full bg-zinc-900 border-b-2 border-orange-600/50 py-6 px-4 text-2xl font-bold outline-none focus:border-orange-500 transition-all text-white"/>
                  </div>
              </div>
          )}

          {!shouldHideGlobalNav && (
            <div className="fixed bottom-3 left-3 right-3 z-[110] md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-full md:max-w-md">
                <div className="bg-[#050508]/92 backdrop-blur-2xl h-16 flex justify-around items-center px-4 border border-zinc-800/80 rounded-[1.8rem] shadow-[0_8px_32px_rgba(0,0,0,0.85)] py-1">
                    
                    {/* Asosiy */}
                    <button 
                      onClick={() => handleNavigation('dashboard')} 
                      className={`flex flex-col items-center justify-center gap-0.5 w-1/5 transition-all active:scale-90 ${page === 'dashboard' && dashboardPage === 'main' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <Home size={19} strokeWidth={2} />
                        <span className="text-[9px] font-semibold tracking-tight">Asosiy</span>
                    </button>

                    {/* Qidiruv */}
                    <button 
                      onClick={() => handleNavigation('search')} 
                      className={`flex flex-col items-center justify-center gap-0.5 w-1/5 transition-all active:scale-90 ${page === 'search' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <div className={`p-1 rounded-[10px] border transition-all ${page === 'search' ? 'border-white/90 bg-white/5' : 'border-zinc-800/80 bg-zinc-950/20'}`}>
                            <Search size={16} strokeWidth={page === 'search' ? 2.5 : 2} />
                        </div>
                        <span className="text-[9px] font-semibold tracking-tight mt-0.5">Qidiruv</span>
                    </button>

                    {/* To'plam */}
                    <button 
                      onClick={() => handleNavigation('catalog')} 
                      className={`flex flex-col items-center justify-center gap-0.5 w-1/5 transition-all active:scale-90 ${page === 'catalog' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <Layers size={19} strokeWidth={2} />
                        <span className="text-[9px] font-semibold tracking-tight">To'plam</span>
                    </button>

                    {/* TV */}
                    <button 
                      onClick={() => handleNavigation('studio')} 
                      className={`flex flex-col items-center justify-center gap-0.5 w-1/5 transition-all active:scale-90 relative ${page === 'studio' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <Tv size={19} strokeWidth={2} />
                        {isAnyLive && <div className="absolute top-1 right-3 w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></div>}
                        <span className="text-[9px] font-semibold tracking-tight">TV</span>
                    </button>
                    
                    {/* Profil */}
                    <button 
                      onClick={() => {if(isAuthenticated) setIsMenuOpen(true); else setIsAuthModalOpen(true);}} 
                      className={`flex flex-col items-center justify-center gap-0.5 w-1/5 transition-all active:scale-90 ${isMenuOpen ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        {isAuthenticated ? (
                            <div className={`w-5 h-5 rounded-full border overflow-hidden transition-all duration-300 ${isMenuOpen ? 'border-white scale-105' : 'border-zinc-700'}`}>
                                {userProfile?.avatar_url ? (
                                    <img src={userProfile.avatar_url} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                                        <User size={11} className="text-zinc-450" />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <User size={19} strokeWidth={2} />
                        )}
                        <span className="text-[9px] font-semibold tracking-tight">Profil</span>
                    </button>
                </div>
            </div>
          )}

          {isAuthModalOpen && (
            <AuthModal 
              onClose={() => setIsAuthModalOpen(false)} 
              onAuthSuccess={() => {setIsAuthModalOpen(false); setPage('dashboard');}} 
              onOpenLegal={(type) => setLegalDocType(type)}
            />
          )}
          <HamburgerMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onLogout={() => { supabase.auth.signOut(); setIsMenuOpen(false); }} onMainNavigate={handleNavigation} onDashboardNavigate={setDashboardPage} onSwitchRole={(r) => {if(['admin','owner'].includes(r)) setPage('admin')}} onOpenLegal={(type) => setLegalDocType(type)} />
          {legalDocType && <LegalDocs type={legalDocType} onClose={() => setLegalDocType(null)} />}
        </div>
    </NotificationContext.Provider>
    </PWAProvider>
  );
};

export default App;