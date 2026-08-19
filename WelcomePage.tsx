import React, { useState, useEffect } from 'react';
import { getAppConfig } from './services/dbService';
import { Movie } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, X, ShieldCheck, FileText, Info, Zap, Tv, Sparkles, Play, ArrowRight } from 'lucide-react';
import { SubscriptionPlans } from './components/SubscriptionPlans';
import { Page } from './App';

interface WelcomePageProps {
  onMovieClick: (movie: Movie) => void; 
  onSearch: (query: string) => void;
  onStart: () => void; 
  onNavigate: (page: Page) => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onStart, onNavigate }) => {
  const [customBg, setCustomBg] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [customLogo, setCustomLogo] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const config = await getAppConfig();
        if (config['site_background']) setCustomBg(config['site_background']);
        if (config['site_logo']) setCustomLogo(config['site_logo']);
      } catch (e) { console.error(e); }
    };
    loadContent();
  }, []);

  const handlePlanSelection = (plan: string) => {
      setShowPremiumModal(false);
      setTimeout(() => onStart(), 300);
  };

  const heroBg = customBg || 'https://i.imgur.com/sC56bsu.jpg';

  // Animation variants
  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 18 },
    },
  };

  const logoVariants: any = {
    hidden: { scale: 0.82, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: 'spring', stiffness: 90, damping: 15 },
    },
  };

  const features = [
    { 
      icon: <Zap className="text-orange-500 w-5 h-5" />, 
      title: "Tezkor Tarjima", 
      desc: "Kutishlarsiz eng so'nggi qismlar uzb dublyajda" 
    },
    { 
      icon: <Tv className="text-orange-500 w-5 h-5" />, 
      title: "Full HD Sifat", 
      desc: "Yuqori tiniqlikdagi video va musaffo ovoz" 
    },
    { 
      icon: <Sparkles className="text-orange-500 w-5 h-5" />, 
      title: "No Ads Premium", 
      desc: "Reklamalarsiz qulay va uzluksiz tomosha" 
    }
  ];

  return (
    <div className="relative min-h-screen w-full bg-[#050505] flex flex-col justify-between overflow-x-hidden font-sans text-white">
      
      {/* Background with Ken Burns zoom animation */}
      <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.img 
            initial={{ scale: 1.08 }}
            animate={{ scale: 1.01 }}
            transition={{
              duration: 25,
              ease: "easeOut"
            }}
            src={heroBg} 
            alt="Background" 
            className="w-full h-full object-cover opacity-35 filter blur-[1px]" 
          />
          {/* Enhanced cinematic gradient for deep dark contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-[#050505]/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-[#050505]" />
          {/* Center ambient radial warm glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.12)_0%,transparent_65%)] pointer-events-none" />
      </div>

      {/* Header Info Banner / Active Count Tag */}
      <div className="relative z-10 w-full flex justify-center pt-5 px-4 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="bg-black/40 backdrop-blur-md border border-white/5 py-1.5 px-4 rounded-full text-[9px] font-black uppercase tracking-[0.25em] text-orange-500 flex items-center gap-2"
        >
          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping"></span>
          Eng katta sharq madaniyati portali
        </motion.div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto w-full my-auto">
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center justify-center w-full"
          >
              
              {/* Brand Logo & Name Area */}
              <motion.div variants={logoVariants} className="mb-6 flex flex-col md:flex-row items-center gap-4 md:gap-5">
                  <div className="relative group cursor-pointer shrink-0">
                      {/* Ambient Glowing Aura */}
                      <div className="absolute -inset-2 bg-orange-600/25 rounded-full opacity-40 blur-xl group-hover:opacity-60 transition duration-500"></div>
                      
                      {/* Perfect Glass Circle with Border */}
                      <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full bg-zinc-950/50 backdrop-blur-xl border border-zinc-800/85 hover:border-orange-500/50 overflow-hidden flex items-center justify-center p-2.5 shadow-[0_16px_48px_rgba(0,0,0,0.85)] transition-all duration-300 group-hover:scale-105">
                          <motion.img 
                            whileHover={{ scale: 1.04 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                            src={customLogo || "/logotip.png"} 
                            alt="Anilo Logo" 
                            className="w-full h-full object-cover rounded-full filter drop-shadow-[0_4px_12px_rgba(249,115,22,0.3)]"
                            onError={(e) => {
                                // Fallback safe SVG if logo image is broken
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC5zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iYmxhY2siLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIzNSIgc3Ryb2tlPSIjZjk3MzE2IiBzdHJva2Utd2lkdGg9IjYiIGZpbGw9Im5vbmUiLz48L3N2Zz4=';
                            }}
                          />
                      </div>
                  </div>
                  <div className="text-center md:text-left">
                      <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] font-mono">
                          ANILO<span className="text-orange-500">.UZ</span>
                      </h1>
                      <div className="flex items-center justify-center md:justify-start gap-2 mt-1.5 pl-1">
                          <div className="h-px w-6 bg-orange-500/50 hidden md:block" />
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.35em]">
                              Professional Dublyaj
                          </p>
                      </div>
                  </div>
              </motion.div>

              {/* Title Descriptive Text */}
              <motion.p 
                variants={itemVariants}
                className="text-zinc-300 text-sm md:text-base font-medium leading-relaxed max-w-lg mb-8 drop-shadow-md px-4"
              >
                O'zbekistondagi eng zamonaviy anime portali. Yuqori aniqlikdagi premyerlar, professional dublyaj va sevimli qahramonlaringiz olami bir qadamda.
              </motion.p>

              {/* Action Buttons with high quality animation triggers */}
              <motion.div variants={itemVariants} className="w-full max-w-sm space-y-3.5 px-4 mb-10">
                  <motion.button 
                    whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(249,115,22,0.4)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowPremiumModal(true)}
                    className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2.5 rounded-2xl shadow-xl shadow-orange-600/25"
                  >
                    <Crown size={15} fill="white" className="animate-pulse" /> Premium Rejalar
                  </motion.button>

                  <motion.button 
                    whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onStart} 
                    className="w-full py-4 bg-black/40 border border-white/10 hover:border-white/20 text-white font-black text-xs uppercase tracking-[0.2em] transition-all backdrop-blur-md rounded-2xl flex items-center justify-center gap-2"
                  >
                    <Play size={13} fill="white" /> Portaldan foydalanish
                  </motion.button>
              </motion.div>

              {/* Brand Highlights Bento Grid */}
              <motion.div 
                variants={itemVariants}
                className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-3xl px-4 mt-2"
              >
                {features.map((feat, idx) => (
                  <div 
                    key={idx} 
                    className="flex flex-col items-center md:items-start p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-center md:text-left transition-all duration-300 hover:bg-white/[0.04] hover:border-white/10"
                  >
                    <div className="p-2 bg-orange-500/10 rounded-xl mb-3 border border-orange-500/10">
                      {feat.icon}
                    </div>
                    <h3 className="text-xs font-black text-white mb-1 uppercase tracking-wider">{feat.title}</h3>
                    <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">{feat.desc}</p>
                  </div>
                ))}
              </motion.div>

          </motion.div>
      </div>

      {/* FOOTER LEGAL LINKS */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="w-full flex flex-col items-center gap-4 py-8 px-4"
      >
          <div className="flex items-center gap-2 md:gap-5 bg-black/40 backdrop-blur-md border border-white/5 p-1 rounded-full px-4 max-w-md w-full justify-between sm:w-auto">
              <button 
                onClick={() => onNavigate('copyright')}
                className="flex items-center gap-1.5 py-2 px-3 text-[9px] font-black text-zinc-400 hover:text-orange-500 transition-all uppercase tracking-widest"
              >
                  <ShieldCheck size={12} className="text-orange-500/70" /> Maxfiylik
              </button>
              <div className="w-px h-3 bg-zinc-800"></div>
              <button 
                onClick={() => onNavigate('copyright')}
                className="flex items-center gap-1.5 py-2 px-3 text-[9px] font-black text-zinc-400 hover:text-orange-500 transition-all uppercase tracking-widest"
              >
                  <FileText size={12} className="text-orange-500/70" /> Oferta
              </button>
              <div className="w-px h-3 bg-zinc-800"></div>
              <button 
                onClick={() => onNavigate('copyright')}
                className="flex items-center gap-1.5 py-2 px-3 text-[9px] font-black text-zinc-400 hover:text-orange-500 transition-all uppercase tracking-widest"
              >
                  <Info size={12} className="text-orange-500/70" /> Biz haqimizda
              </button>
          </div>
          <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-[0.4em]">© {new Date().getFullYear()} ANILO MEDIA GROUP</p>
      </motion.div>

      {/* PREMIUM MODAL with beautiful spring animation */}
      <AnimatePresence>
        {showPremiumModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/95 backdrop-blur-sm"
              onClick={() => setShowPremiumModal(false)}
            >
                <motion.div 
                  initial={{ y: "100%", opacity: 0.5 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "100%", opacity: 0.5 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="bg-[#0a0a0a] border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-6xl h-[90vh] sm:h-auto sm:max-h-[92vh] overflow-hidden shadow-2xl relative flex flex-col" 
                  onClick={e => e.stopPropagation()}
                >
                    {/* Pull-to-dismiss bar on mobile */}
                    <div className="w-full flex justify-center pt-3 pb-1 sm:hidden cursor-pointer" onClick={() => setShowPremiumModal(false)}>
                        <div className="w-12 h-1.5 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors"></div>
                    </div>

                    <div className="flex items-center justify-between px-6 py-4.5 border-b border-white/5 bg-[#0a0a0a]/95 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-orange-600/10 border border-orange-500/20 rounded-xl text-orange-500"><Crown size={18} fill="currentColor" /></div>
                            <div>
                                <h2 className="text-base font-black text-white uppercase tracking-tight">Premium Tarif Rejalari</h2>
                                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Cheklovsiz, yuqori tezlik va ultra sifat</p>
                            </div>
                        </div>
                        <button 
                          onClick={() => setShowPremiumModal(false)} 
                          className="text-zinc-500 hover:text-white transition-colors p-2 bg-white/5 rounded-full hover:scale-105 active:scale-95"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-0 overflow-y-auto scrollbar-hide flex-1 bg-[#0a0a0a]">
                        <div className="py-6 px-4">
                            <SubscriptionPlans onPlanSelect={handlePlanSelection} />
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
