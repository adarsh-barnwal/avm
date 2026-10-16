import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Tag, Sparkles, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface SchoolEvent {
  id: string;
  title: string;
  date: string;
  venue: string;
  description: string;
  category: 'Academic' | 'Sports' | 'Cultural' | 'Celebration';
  status: 'Upcoming' | 'Completed';
  bannerUrl?: string;
}

const defaultEvents: SchoolEvent[] = [
  {
    id: 'e1',
    title: 'Annual Sports Meet & Haryana Kho-Kho Championship Trials',
    date: 'Upcoming Season',
    venue: 'AVM Main Sports Grounds, Meerpur Kaurali',
    description: 'Inter-house athletic competitions including 100m sprint, relay, volleyball, badminton, and selection trials for the district & state-level Kho-Kho tournament.',
    category: 'Sports',
    status: 'Upcoming'
  },
  {
    id: 'e2',
    title: 'Science & Innovation Exhibition 2026',
    date: 'Next Month',
    venue: 'AVM Senior Science Wing & Auditorium',
    description: 'Students from classes 6th to 12th will showcase working models, robotics projects, environmental science solutions, and scientific demonstrations.',
    category: 'Academic',
    status: 'Upcoming'
  },
  {
    id: 'e3',
    title: 'Parent-Teacher Meeting (PTM) & Term Progress Review',
    date: 'Saturday Morning',
    venue: 'Respective Classrooms (8:30 AM - 1:30 PM)',
    description: 'Individual interactive session for parents and teachers to discuss student academic progress, attendance, discipline, and upcoming board preparation.',
    category: 'Academic',
    status: 'Upcoming'
  },
  {
    id: 'e4',
    title: 'Grand Annual Cultural Function & Merit Prize Distribution',
    date: 'Annual Celebration',
    venue: 'School Amphitheatre & Campus Stage',
    description: 'Felicitation of district toppers, state championship athletes, and vibrant student dance, drama, and classical musical performances.',
    category: 'Cultural',
    status: 'Completed'
  }
];

import { storageCache } from '../lib/storageCache';

export const EventsSection: React.FC = () => {
  // Initialize immediately from client storage cache so refresh NEVER loses events
  const [events, setEvents] = useState<SchoolEvent[]>(() => {
    try {
      const cachedDeleted = new Set(storageCache.getDeletedEventIds());
      const cachedLive = storageCache.getEvents();
      const activeDefault = defaultEvents.filter(d => !cachedDeleted.has(d.id));
      const activeLive = cachedLive.filter(l => !cachedDeleted.has(l.id));
      return [...activeLive, ...activeDefault];
    } catch {
      return defaultEvents;
    }
  });
  const [filter, setFilter] = useState<'All' | 'Upcoming' | 'Completed'>('All');

  useEffect(() => {
    let currentLive: SchoolEvent[] = storageCache.getEvents();
    let currentDeleted = new Set<string>(storageCache.getDeletedEventIds());

    const applyEvents = () => {
      const activeDefault = defaultEvents.filter(d => !currentDeleted.has(d.id));
      const activeLive = currentLive.filter(l => !currentDeleted.has(l.id));
      setEvents([...activeLive, ...activeDefault]);
    };

    const handleInstantEvent = (e: Event) => {
      const customEvent = e as CustomEvent<SchoolEvent>;
      if (customEvent.detail) {
        storageCache.addEventItem(customEvent.detail);
        currentLive = [customEvent.detail, ...currentLive];
        applyEvents();
      }
    };

    const handleInstantDeleteEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        currentDeleted.add(customEvent.detail);
        storageCache.addDeletedEventId(customEvent.detail);
        storageCache.removeEventItem(customEvent.detail);
        applyEvents();
      }
    };

    window.addEventListener('avm_event_instant_add', handleInstantEvent);
    window.addEventListener('avm_event_instant_delete', handleInstantDeleteEvent);

    let unsubEvents = () => {};
    let unsubDeleted = () => {};

    try {
      unsubDeleted = onSnapshot(collection(db, 'deleted_events'), (snapshot) => {
        const set = new Set<string>();
        snapshot.docs.forEach(doc => {
          set.add(doc.id);
          const data = doc.data();
          if (data?.eventId) set.add(data.eventId);
        });
        currentDeleted = set;
        storageCache.saveDeletedEventIds(Array.from(set));
        applyEvents();
      }, (err) => {
        console.warn("Deleted events listener:", err);
      });
    } catch {}

    try {
      unsubEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
        if (!snapshot.empty) {
          const liveEvents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as any)
          })) as SchoolEvent[];
          currentLive = liveEvents;
          storageCache.saveEvents(liveEvents);
        } else {
          currentLive = [];
          storageCache.saveEvents([]);
        }
        applyEvents();
      }, (err) => {
        console.warn("Events listener notice:", err);
      });
    } catch {
      applyEvents();
    }

    return () => {
      window.removeEventListener('avm_event_instant_add', handleInstantEvent);
      window.removeEventListener('avm_event_instant_delete', handleInstantDeleteEvent);
      unsubEvents();
      unsubDeleted();
    };
  }, []);

  const filteredEvents = filter === 'All' 
    ? events 
    : events.filter(e => e.status === filter);

  return (
    <section id="events" className="py-12 sm:py-20 md:py-24 bg-slate-50 border-t border-slate-200/80 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 sm:mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-gold/10 text-brand-gold text-[11px] sm:text-xs font-bold tracking-widest uppercase mb-2 sm:mb-3">
            <Calendar size={13} /> School Calendar & Activities
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold text-brand-navy mb-3 sm:mb-4">
            Events & Celebrations
          </h2>
          <p className="text-slate-600 text-sm sm:text-base md:text-lg">
            स्कूल के आगामी कार्यक्रम, खेल प्रतियोगिताएं, विज्ञान प्रदर्शनी एवं सांस्कृतिक उत्सव।
          </p>

          {/* Filter Pills */}
          <div className="flex justify-center gap-2 mt-8">
            {['All', 'Upcoming', 'Completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab as any)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  filter === tab
                    ? 'bg-brand-navy text-brand-gold shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {tab === 'All' ? 'All Events (सभी कार्यक्रम)' : tab === 'Upcoming' ? '🔔 Upcoming Events (आगामी)' : '✓ Past Celebrations (संपन्न)'}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt, idx) => (
            <motion.div
              key={evt.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (idx % 3) * 0.1 }}
              className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
            >
              <div>
                {/* Badges Bar */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                    evt.status === 'Upcoming' 
                      ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {evt.status === 'Upcoming' ? '🔔 UPCOMING' : 'COMPLETED'}
                  </span>
                  <span className="text-[11px] font-bold text-brand-gold bg-brand-gold/10 px-2.5 py-0.5 rounded">
                    {evt.category}
                  </span>
                </div>

                <h3 className="font-serif font-bold text-brand-navy text-xl mb-3 leading-snug group-hover:text-yellow-700 transition-colors">
                  {evt.title}
                </h3>

                <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-3">
                  {evt.description}
                </p>
              </div>

              {/* Event Metadata */}
              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2 font-medium text-slate-700">
                  <Calendar size={14} className="text-brand-gold shrink-0" />
                  <span>{evt.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-brand-gold shrink-0" />
                  <span className="truncate">{evt.venue}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
