import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Maximize2, Play, Film, Image as ImageIcon, Sparkles, Filter, Camera, ImagePlus, UploadCloud, Plus } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { storageCache } from '../lib/storageCache';

export interface GalleryItem {
  id: string;
  img: string;
  title: string;
  category: 'Campus' | 'Sports' | 'Toppers' | 'Celebrations';
  type?: 'photo' | 'video';
  videoUrl?: string;
}

export const defaultGalleryData: GalleryItem[] = [
  // Toppers
  { id: 't1', img: '/districttoppers (1).jpeg', title: 'District Merit Board Achiever', category: 'Toppers', type: 'photo' },
  { id: 't2', img: '/districttoppers (2).jpeg', title: 'Top Rank Board Student', category: 'Toppers', type: 'photo' },
  { id: 't3', img: '/districttoppers (3).jpeg', title: 'Excellence in Senior Secondary Board', category: 'Toppers', type: 'photo' },
  { id: 't4', img: '/districttoppers (4).jpeg', title: 'HBSE District Rank Holder', category: 'Toppers', type: 'photo' },
  { id: 't5', img: '/districttoppers (5).jpeg', title: 'High Scorer Academic Felicitations', category: 'Toppers', type: 'photo' },

  // Sports (Kho-Kho & Badminton)
  { id: 's1', img: '/kho-kho (1).jpeg', title: 'State Level Kho-Kho Match Action', category: 'Sports', type: 'photo' },
  { id: 's2', img: '/kho-kho (4).jpeg', title: 'Championship Trophy Celebration', category: 'Sports', type: 'photo' },
  { id: 's3', img: '/kho-kho (2).jpeg', title: 'Kho-Kho Team Lineup & Agility', category: 'Sports', type: 'photo' },
  { id: 's4', img: '/kho-kho (5).jpeg', title: 'Inter-School Sports Meet Match', category: 'Sports', type: 'photo' },
  { id: 's5', img: '/kho-kho (7).jpeg', title: 'Athletic Team Spirit & Drills', category: 'Sports', type: 'photo' },
  { id: 's6', img: '/badminton.jpg.jpeg', title: 'Indoor Badminton Court Tournament', category: 'Sports', type: 'photo' },
  { id: 's7', img: '/badminton.jpg (2).jpeg', title: 'Badminton Coaching & Technique', category: 'Sports', type: 'photo' },
  { id: 's8', img: '/badminton.jpg (3).jpeg', title: 'Sports Infrastructure & Training', category: 'Sports', type: 'photo' },
  { id: 's9', img: '/kho-kho (11).jpeg', title: 'State Tournament Medals Award', category: 'Sports', type: 'photo' },

  // Campus & Learning
  { id: 'c1', img: '/life at avm (1).jpeg', title: 'Smart Classroom Interactive Session', category: 'Campus', type: 'photo' },
  { id: 'c2', img: '/life at avm (2).jpeg', title: 'Dedicated Science Lab Experiment', category: 'Campus', type: 'photo' },
  { id: 'c3', img: '/life at avm (4).jpeg', title: 'Morning Assembly & Discipline', category: 'Campus', type: 'photo' },
  { id: 'c4', img: '/life at avm (5).jpeg', title: 'Collaborative Group Study', category: 'Campus', type: 'photo' },
  { id: 'c5', img: '/life at avm (7).jpeg', title: 'Teacher Guidance & Mentoring', category: 'Campus', type: 'photo' },
  { id: 'c6', img: '/life at avm (8).jpeg', title: 'Primary Section Joyful Learning', category: 'Campus', type: 'photo' },
  { id: 'c7', img: '/life at avm (10).jpeg', title: 'Computer & Digital Literacy Lab', category: 'Campus', type: 'photo' },
  { id: 'c8', img: '/life at avm (12).jpeg', title: 'Library & Reading Period', category: 'Campus', type: 'photo' },

  // Celebrations & Cultural
  { id: 'e1', img: '/life at avm (15).jpeg', title: 'Annual Cultural Fest & Performances', category: 'Celebrations', type: 'photo' },
  { id: 'e2', img: '/life at avm (16).jpeg', title: 'Independence Day Celebrations', category: 'Celebrations', type: 'photo' },
  { id: 'e3', img: '/life at avm (18).jpeg', title: 'Prize Distribution Ceremony', category: 'Celebrations', type: 'photo' },
  { id: 'e4', img: '/life at avm (20).jpeg', title: 'Yoga & Health Awareness Day', category: 'Celebrations', type: 'photo' },
  { id: 'e5', img: '/life at avm (22).jpeg', title: 'Science & Art Exhibition Display', category: 'Celebrations', type: 'photo' },
  { id: 'e6', img: '/life at avm (25).jpeg', title: 'Founder’s Day Memorial Assembly', category: 'Celebrations', type: 'photo' },
  { id: 'e7', img: '/life at avm (28).jpeg', title: 'Children’s Day Joyous Activities', category: 'Celebrations', type: 'photo' },
  { id: 'e8', img: '/life at avm (30).jpeg', title: 'Student Leadership Investiture', category: 'Celebrations', type: 'photo' },
];

export function parseYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
}

interface PhotoGalleryProps {
  onOpenAdminMedia?: (autoOpenPicker?: boolean) => void;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = () => {
  // Initialize immediately from client storage cache so refresh NEVER loses photos
  const [items, setItems] = useState<GalleryItem[]>(() => {
    try {
      const cachedDeleted = new Set(storageCache.getDeletedMediaIds());
      const cachedLive = storageCache.getMedia();
      const activeDefault = defaultGalleryData.filter(d => !cachedDeleted.has(d.id));
      const activeLive = cachedLive.filter(l => !cachedDeleted.has(l.id));
      return [...activeLive, ...activeDefault];
    } catch {
      return defaultGalleryData;
    }
  });
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Subscribe to live Firestore media + Instant optimistic updates + deleted media filtering
  useEffect(() => {
    let currentLive: GalleryItem[] = storageCache.getMedia();
    let currentDeleted = new Set<string>(storageCache.getDeletedMediaIds());

    const applyFilter = () => {
      const activeDefault = defaultGalleryData.filter(d => !currentDeleted.has(d.id));
      const activeLive = currentLive.filter(l => !currentDeleted.has(l.id));
      setItems([...activeLive, ...activeDefault]);
    };

    // Instant local optimistic events (0 delay)
    const handleInstantAdd = (e: Event) => {
      const customEvent = e as CustomEvent<GalleryItem[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        customEvent.detail.forEach(item => storageCache.addMediaItem(item));
        currentLive = [...customEvent.detail, ...currentLive];
        applyFilter();
      }
    };

    const handleInstantDelete = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        currentDeleted.add(customEvent.detail);
        storageCache.addDeletedMediaId(customEvent.detail);
        storageCache.removeMediaItem(customEvent.detail);
        applyFilter();
      }
    };

    window.addEventListener('avm_media_instant_add', handleInstantAdd);
    window.addEventListener('avm_media_instant_delete', handleInstantDelete);

    let unsubMedia = () => {};
    let unsubDeleted = () => {};

    try {
      unsubDeleted = onSnapshot(collection(db, 'deleted_media'), (snapshot) => {
        const deletedIds = new Set<string>();
        snapshot.docs.forEach(doc => {
          deletedIds.add(doc.id);
          const data = doc.data();
          if (data?.mediaId) deletedIds.add(data.mediaId);
        });
        currentDeleted = deletedIds;
        storageCache.saveDeletedMediaIds(Array.from(deletedIds));
        applyFilter();
      }, (err) => {
        console.warn("Deleted media listener error:", err);
      });
    } catch {}

    try {
      unsubMedia = onSnapshot(collection(db, 'media'), (snapshot) => {
        if (!snapshot.empty) {
          const fetched = snapshot.docs.map(doc => {
            const data = doc.data() as any;
            const ytId = parseYouTubeVideoId(data.mediaUrl);
            const thumb = data.type === 'video' && ytId
              ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
              : (data.mediaUrl || '/background.png.jpeg');

            return {
              id: doc.id,
              img: thumb,
              title: data.title || 'School Moment',
              category: data.category || 'Campus',
              type: data.type || 'photo',
              videoUrl: data.mediaUrl
            } as GalleryItem;
          });
          currentLive = fetched;
          storageCache.saveMedia(fetched);
        } else {
          currentLive = [];
          storageCache.saveMedia([]);
        }
        applyFilter();
      }, (err) => {
        console.warn("Firestore media listener notice:", err);
      });
    } catch {
      applyFilter();
    }

    return () => {
      window.removeEventListener('avm_media_instant_add', handleInstantAdd);
      window.removeEventListener('avm_media_instant_delete', handleInstantDelete);
      unsubMedia();
      unsubDeleted();
    };
  }, []);

  const filteredItems = items.filter(item => {
    const matchesCategory = 
      activeFilter === 'All' ? true :
      activeFilter === 'Videos' ? item.type === 'video' :
      activeFilter === 'Photos' ? item.type !== 'video' :
      item.category === activeFilter;

    if (!matchesCategory) return false;
    if (!searchQuery.trim()) return true;
    return item.title.toLowerCase().includes(searchQuery.trim().toLowerCase());
  });

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex((prev) => (prev! > 0 ? prev! - 1 : filteredItems.length - 1));
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex((prev) => (prev! < filteredItems.length - 1 ? prev! + 1 : 0));
    }
  };

  const currentLightboxItem = lightboxIndex !== null ? filteredItems[lightboxIndex] : null;
  const currentYtId = currentLightboxItem?.videoUrl ? parseYouTubeVideoId(currentLightboxItem.videoUrl) : null;

  return (
    <section id="gallery" className="py-12 sm:py-20 md:py-24 bg-white px-4 border-t border-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-gold/10 text-brand-gold text-[11px] sm:text-xs font-bold tracking-widest uppercase mb-2 sm:mb-3">
            <Sparkles size={13} /> Life at Adarsh Vidya Mandir
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold text-brand-navy mb-3 sm:mb-4">
            Photos & Videos Gallery
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base md:text-lg">
            Glimpses of daily school life, state-level sports competitions, video highlights, and festive celebrations.
          </p>

          {/* Filter Pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {[
              { id: 'All', label: 'All Media (सभी)' },
              { id: 'Videos', label: '🎥 Videos (वीडियो)' },
              { id: 'Photos', label: '📸 Photos (तस्वीरें)' },
              { id: 'Sports', label: '🏆 Sports & Kho-Kho' },
              { id: 'Toppers', label: '🥇 District Toppers' },
              { id: 'Campus', label: '🏫 Campus & Classes' },
              { id: 'Celebrations', label: '🎉 Cultural & Events' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveFilter(tab.id);
                  setLightboxIndex(null);
                }}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeFilter === tab.id
                    ? 'bg-brand-navy text-brand-gold shadow-md scale-105'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Search & Count Bar */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 फ़ोटो या वीडियो का नाम खोजें (Search gallery)..."
                className="w-full pl-4 pr-10 py-2 rounded-full border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:bg-white transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            <span className="text-xs font-semibold text-slate-400 whitespace-nowrap px-2">
              कुल: <strong className="text-brand-navy">{filteredItems.length}</strong> तस्वीरें / वीडियो
            </span>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {filteredItems.map((item, idx) => (
            <motion.div
              key={item.id + idx}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: (idx % 6) * 0.05 }}
              onClick={() => setLightboxIndex(idx)}
              className="relative group overflow-hidden rounded-xl aspect-[4/5] bg-slate-100 cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/60"
            >
              <img
                src={item.img}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />

              {/* Video Badge Overlay if video */}
              {item.type === 'video' && (
                <div className="absolute top-2.5 right-2.5 bg-red-600 text-white rounded-full p-1.5 shadow-md z-10 animate-pulse">
                  <Play size={13} className="fill-white" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/90 via-brand-navy/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 sm:p-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-brand-gold mb-1 flex items-center gap-1">
                  {item.type === 'video' ? <Film size={11} /> : <ImageIcon size={11} />}
                  {item.category}
                </span>
                <h4 className="text-white text-xs sm:text-sm font-medium leading-snug line-clamp-2">
                  {item.title}
                </h4>
                <div className="mt-2 flex items-center gap-1 text-[11px] text-white/80">
                  {item.type === 'video' ? (
                    <span className="font-bold text-yellow-400 flex items-center gap-1">
                      <Play size={12} className="fill-yellow-400" /> Watch Video
                    </span>
                  ) : (
                    <>
                      <Maximize2 size={12} />
                      <span>Tap to Zoom</span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Lightbox Modal with Video Player and Prev/Next */}
        <AnimatePresence>
          {currentLightboxItem && (
            <div
              className="fixed inset-0 z-[280] flex items-center justify-center p-3 sm:p-6 bg-brand-navy/95 backdrop-blur-md"
              onClick={() => setLightboxIndex(null)}
            >
              {/* Close Button */}
              <button
                onClick={() => setLightboxIndex(null)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors z-20 cursor-pointer"
              >
                <X size={26} />
              </button>

              {/* Prev Button */}
              <button
                onClick={handlePrev}
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/30 text-white flex items-center justify-center transition-colors z-20 cursor-pointer"
              >
                <ChevronLeft size={30} />
              </button>

              {/* Next Button */}
              <button
                onClick={handleNext}
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/30 text-white flex items-center justify-center transition-colors z-20 cursor-pointer"
              >
                <ChevronRight size={30} />
              </button>

              {/* Center Content */}
              <motion.div
                key={lightboxIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="relative max-w-4xl w-full max-h-[85vh] flex flex-col items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative max-h-[75vh] w-full overflow-hidden rounded-xl shadow-2xl border border-white/10 bg-black/60 flex items-center justify-center">
                  {currentLightboxItem.type === 'video' && currentYtId ? (
                    <div className="w-full aspect-video">
                      <iframe
                        src={`https://www.youtube.com/embed/${currentYtId}?autoplay=1`}
                        title={currentLightboxItem.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : currentLightboxItem.type === 'video' && currentLightboxItem.videoUrl ? (
                    <video
                      src={currentLightboxItem.videoUrl}
                      controls
                      autoPlay
                      className="max-h-[75vh] w-auto max-w-full"
                    />
                  ) : (
                    <img
                      src={currentLightboxItem.img}
                      alt={currentLightboxItem.title}
                      className="max-h-[75vh] w-auto max-w-full object-contain mx-auto"
                    />
                  )}
                </div>

                {/* Caption Bar */}
                <div className="mt-4 text-center text-white px-4">
                  <div className="text-brand-gold text-xs font-bold tracking-widest uppercase mb-1">
                    {currentLightboxItem.type === 'video' ? '🎥 Video Highlight' : '📸 Photo'} • {currentLightboxItem.category} • {lightboxIndex! + 1} of {filteredItems.length}
                  </div>
                  <h3 className="text-base sm:text-xl font-serif font-bold text-white">
                    {currentLightboxItem.title}
                  </h3>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
