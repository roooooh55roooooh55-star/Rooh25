
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Video, UserInteractions } from './types.ts';

export const LOGO_URL = "https://i.top4top.io/p_3643ksmii1.jpg";

export const getDeterministicStats = (seed: string) => {
  let hash = 0;
  if (!seed) return { views: 0, likes: 0 };
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const baseViews = Math.abs(hash % 900000) + 500000; 
  const views = baseViews * (Math.abs(hash % 5) + 2); 
  const likes = Math.abs(Math.floor(views * (0.12 + (Math.abs(hash % 15) / 100)))); 
  return { views, likes };
};

export const formatBigNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const VideoCardThumbnail: React.FC<{ 
  video: Video, 
  isOverlayActive: boolean, 
  progress?: number, 
  showNewBadge?: boolean,
  onCategorySelect?: (cat: string) => void,
  onLike?: (id: string) => void,
  isLiked?: boolean
}> = ({ video, isOverlayActive, progress, showNewBadge, onCategorySelect, onLike, isLiked }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const stats = useMemo(() => getDeterministicStats(video.video_url), [video.video_url]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isOverlayActive) {
      v.pause();
      if (observerRef.current) observerRef.current.disconnect();
      return;
    }
    observerRef.current = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) v.play().catch(() => {}); else v.pause();
    }, { threshold: 0.1 });
    observerRef.current.observe(v);
    return () => observerRef.current?.disconnect();
  }, [video.video_url, isOverlayActive]);

  return (
    <div className="w-full h-full relative bg-neutral-950 overflow-hidden group rounded-2xl shadow-2xl border border-white/5 pointer-events-auto transition-all duration-500 hover:border-red-600/30">
      <video 
        ref={videoRef}
        src={video.video_url} 
        poster={video.poster_url}
        muted loop playsInline 
        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-700 pointer-events-none"
      />
      
      <div className="absolute top-2 right-2 z-30">
        <button 
          onClick={(e) => { e.stopPropagation(); onLike?.(video.id); }}
          className={`p-2 rounded-xl backdrop-blur-md border transition-all active:scale-75 ${isLiked ? 'bg-red-600/80 border-red-400 text-white shadow-[0_0_15px_red]' : 'bg-black/40 border-white/10 text-white/70 hover:text-white'}`}
        >
          <svg className="w-4 h-4" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent p-3 z-20 flex flex-col gap-1 pointer-events-none text-right">
        <div className="flex justify-start">
          <button 
            onClick={(e) => { e.stopPropagation(); onCategorySelect?.(video.category); }}
            className="border border-red-600/50 bg-red-600/20 px-2 py-0.5 rounded-md backdrop-blur-md shadow-[0_0_10px_rgba(220,38,38,0.2)] pointer-events-auto active:scale-95 transition-transform"
          >
            <span className="text-[7px] font-black text-red-400 uppercase tracking-tighter">{video.category}</span>
          </button>
        </div>
        <p className="text-white text-[9px] font-black line-clamp-1 italic drop-shadow-lg leading-tight mt-1">{video.title}</p>
        <div className="flex items-center justify-between gap-1.5 mt-1 bg-black/40 px-2 py-0.5 rounded-full border border-white/5 backdrop-blur-sm self-start">
           <div className="flex items-center gap-0.5"><svg className="w-2.5 h-2.5 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg><span className="text-[7px] font-black text-white">{formatBigNumber(stats.likes)}</span></div>
           <div className="flex items-center gap-0.5 border-l border-white/20 pl-1.5"><svg className="w-2.5 h-2.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg><span className="text-[7px] font-black text-white">{formatBigNumber(stats.views)}</span></div>
        </div>
      </div>
    </div>
  );
};

const SmartMarquee: React.FC<{ 
  items: Video[], onPlay: (v: Video) => void, isOverlayActive: boolean, isShort?: boolean, direction?: 'ltr' | 'rtl', onCategorySelect?: (cat: string) => void, onLike?: (id: string) => void, likedIds?: string[]
}> = ({ items, onPlay, isOverlayActive, isShort = true, direction = 'rtl', onCategorySelect, onLike, likedIds = [] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const tripledItems = useMemo(() => [...items, ...items, ...items], [items]);

  useEffect(() => {
    if (!scrollRef.current || isOverlayActive) return;
    const scroll = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft += (direction === 'rtl' ? 1 : -1);
        const scrollWidth = scrollRef.current.scrollWidth / 3;
        if (Math.abs(scrollRef.current.scrollLeft) >= scrollWidth * 2 || scrollRef.current.scrollLeft >= 0) {
           scrollRef.current.scrollLeft = -scrollWidth;
        }
      }
    };
    const timer = setInterval(scroll, 30);
    return () => clearInterval(timer);
  }, [isOverlayActive, direction, items]);

  return (
    <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide px-2 py-2 cursor-grab select-none" style={{ direction: 'rtl' }}>
      {tripledItems.map((v, i) => (
        <div key={`${v.id}-${i}`} onClick={() => onPlay(v)} className={`${isShort ? 'w-32 aspect-[9/16]' : 'w-52 aspect-video'} shrink-0 active:scale-95 transition-transform`}>
          <VideoCardThumbnail video={v} isOverlayActive={isOverlayActive} onCategorySelect={onCategorySelect} onLike={onLike} isLiked={likedIds.includes(v.id)} />
        </div>
      ))}
    </div>
  );
};

interface MainContentProps {
  videos: Video[]; categoriesList: string[]; interactions: UserInteractions; onPlayShort: (v: Video, list: Video[]) => void; onPlayLong: (v: Video, list: Video[]) => void; onHardRefresh: () => void; loading: boolean; isTitleYellow: boolean; onSearchToggle?: () => void; isOverlayActive: boolean; onCategorySelect?: (category: string) => void; onLike?: (id: string) => void;
}

const MainContent: React.FC<MainContentProps> = ({ 
  videos, categoriesList, interactions, onPlayShort, onPlayLong, onHardRefresh, loading, isTitleYellow, onSearchToggle, isOverlayActive, onCategorySelect, onLike
}) => {
  const [startY, setStartY] = useState(0);
  const [pullOffset, setPullOffset] = useState(0);

  const filtered = useMemo(() => videos.filter(v => !interactions.dislikedIds.includes(v.id)), [videos, interactions.dislikedIds]);
  const shorts = useMemo(() => filtered.filter(v => v.type === 'short'), [filtered]);
  const longs = useMemo(() => filtered.filter(v => v.type === 'long'), [filtered]);

  const shortsGroup1 = useMemo(() => shorts.slice(0, 4), [shorts]);
  const shortsHappyTrip = useMemo(() => shorts.slice(4, 14), [shorts]);
  const shortsGroup2 = useMemo(() => shorts.slice(14, 18), [shorts]);

  return (
    <div 
      className="flex flex-col pb-40 pt-0 px-4 w-full bg-black min-h-screen relative transition-transform duration-200"
      style={{ transform: `translateY(${pullOffset / 2}px)` }}
      dir="rtl"
      onTouchStart={(e) => { if (window.scrollY === 0) setStartY(e.touches[0].pageY); }}
      onTouchMove={(e) => {
        if (startY > 0) {
          const offset = e.touches[0].pageY - startY;
          if (offset > 0) setPullOffset(Math.min(offset, 200));
        }
      }}
      onTouchEnd={() => {
        if (pullOffset > 100) onHardRefresh();
        setPullOffset(0);
        setStartY(0);
      }}
    >
      {pullOffset > 30 && (
        <div className="absolute top-0 left-0 w-full flex justify-center pt-2 z-50">
          <p className="text-[10px] font-black text-red-600 animate-pulse bg-black/80 px-4 py-1 rounded-full border border-red-600/30 backdrop-blur-md">
            {pullOffset > 90 ? 'أفلت لتحديث المستودع...' : 'اسحب لتحديث الأرواح...'}
          </p>
        </div>
      )}

      <section className="flex items-center justify-between py-2 border-b border-white/5 sticky top-0 bg-black/90 backdrop-blur-xl z-40">
        <div className="flex items-center gap-2" onClick={onHardRefresh}>
          <img src={LOGO_URL} className="w-8 h-8 rounded-full border border-red-600 shadow-[0_0_10px_red]" />
          <h1 className={`text-base font-black italic ${isTitleYellow ? 'text-yellow-400' : 'text-red-600'}`}>الحديقة المرعبة</h1>
        </div>
        <button onClick={onSearchToggle} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></button>
      </section>

      {/* 1. مختارات سريعة */}
      <section className="mt-6">
        <div className="flex items-center gap-2 mb-3"><span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span><h2 className="text-xs font-black text-red-600 uppercase italic">مختارات سريعة</h2></div>
        <div className="grid grid-cols-2 gap-3">
          {shortsGroup1.map(v => <div key={v.id} onClick={() => onPlayShort(v, shorts)} className="aspect-[9/16]"><VideoCardThumbnail video={v} isOverlayActive={isOverlayActive} onLike={onLike} isLiked={interactions.likedIds.includes(v.id)} onCategorySelect={onCategorySelect} /></div>)}
        </div>
      </section>

      {/* 2. رحلة سعيدة (10 Shorts LTR) */}
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-3"><span className="w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_10px_cyan]"></span><h2 className="text-xs font-black text-cyan-500 uppercase italic">رحلة سعيدة (LTR)</h2></div>
        <SmartMarquee items={shortsHappyTrip} onPlay={(v) => onPlayShort(v, shorts)} isOverlayActive={isOverlayActive} direction="ltr" onLike={onLike} likedIds={interactions.likedIds} onCategorySelect={onCategorySelect} />
      </section>

      {/* 3. كوابيس مطولة */}
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-3"><span className="w-2 h-2 bg-purple-600 rounded-full"></span><h2 className="text-xs font-black text-purple-600 uppercase italic">كوابيس مطولة</h2></div>
        <div className="flex flex-col gap-4">
          {longs.slice(0, 3).map(v => <div key={v.id} onClick={() => onPlayLong(v, longs)} className="aspect-video"><VideoCardThumbnail video={v} isOverlayActive={isOverlayActive} onLike={onLike} isLiked={interactions.likedIds.includes(v.id)} onCategorySelect={onCategorySelect} /></div>)}
        </div>
      </section>

      {/* 4. جرعة رعب مكثفة */}
      <section className="mt-8 mb-12">
        <div className="flex items-center gap-2 mb-3"><span className="w-2 h-2 bg-red-600 rounded-full"></span><h2 className="text-xs font-black text-red-600 uppercase italic">جرعة رعب مكثفة</h2></div>
        <div className="grid grid-cols-2 gap-3">
          {shortsGroup2.map(v => <div key={v.id} onClick={() => onPlayShort(v, shorts)} className="aspect-[9/16]"><VideoCardThumbnail video={v} isOverlayActive={isOverlayActive} onLike={onLike} isLiked={interactions.likedIds.includes(v.id)} onCategorySelect={onCategorySelect} /></div>)}
        </div>
      </section>

      {loading && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-black/80 px-4 py-1 rounded-full border border-yellow-500/30 text-yellow-500 font-black text-[10px] animate-pulse">جاري تحديث المستودع...</div>}
    </div>
  );
};

export default MainContent;
