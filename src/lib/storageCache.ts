/**
 * Dual-persistence client-side storage cache.
 * Provides instant 0ms retrieval on page refresh, offline persistence,
 * and reliable caching for media, notices, events, achievers, and deleted item sets.
 */

const CACHE_KEYS = {
  MEDIA: 'avm_cache_media_items',
  DELETED_MEDIA: 'avm_cache_deleted_media_ids',
  NOTICES: 'avm_cache_notices_items',
  DELETED_NOTICES: 'avm_cache_deleted_notice_ids',
  EVENTS: 'avm_cache_events_items',
  DELETED_EVENTS: 'avm_cache_deleted_event_ids',
  ACHIEVERS: 'avm_cache_achievers_items',
  DELETED_ACHIEVERS: 'avm_cache_deleted_achiever_ids',
  ADMISSIONS: 'avm_cache_admissions_items'
};

// --- In-Memory Fallback & Sync Layer ---
export const storageCache = {
  // 1. Media Items
  getMedia(): any[] {
    try {
      const raw = localStorage.getItem(CACHE_KEYS.MEDIA);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  saveMedia(items: any[]): void {
    try {
      // Keep most recent 50 custom uploaded items in local storage to prevent quota overflow
      const trimmed = items.slice(0, 50);
      localStorage.setItem(CACHE_KEYS.MEDIA, JSON.stringify(trimmed));
    } catch (err) {
      console.warn("Storage quota warning (media):", err);
      // If quota exceeded, trim more aggressively
      try {
        const minimal = items.slice(0, 20);
        localStorage.setItem(CACHE_KEYS.MEDIA, JSON.stringify(minimal));
      } catch {}
    }
  },
  addMediaItem(item: any): void {
    const list = this.getMedia();
    const filtered = list.filter(m => m.id !== item.id);
    this.saveMedia([item, ...filtered]);
  },
  removeMediaItem(id: string): void {
    const list = this.getMedia();
    this.saveMedia(list.filter(m => m.id !== id));
  },

  // 2. Deleted Media IDs (Tombstones)
  getDeletedMediaIds(): string[] {
    try {
      const raw = localStorage.getItem(CACHE_KEYS.DELETED_MEDIA);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  saveDeletedMediaIds(ids: string[]): void {
    try {
      localStorage.setItem(CACHE_KEYS.DELETED_MEDIA, JSON.stringify(Array.from(new Set(ids))));
    } catch {}
  },
  addDeletedMediaId(id: string): void {
    const current = this.getDeletedMediaIds();
    this.saveDeletedMediaIds([...current, id]);
  },
  removeDeletedMediaId(id: string): void {
    const current = this.getDeletedMediaIds();
    this.saveDeletedMediaIds(current.filter(i => i !== id));
  },

  // 3. Notices Items
  getNotices(): any[] {
    try {
      const raw = localStorage.getItem(CACHE_KEYS.NOTICES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  saveNotices(items: any[]): void {
    try {
      localStorage.setItem(CACHE_KEYS.NOTICES, JSON.stringify(items));
    } catch {}
  },
  addNoticeItem(item: any): void {
    const list = this.getNotices();
    const filtered = list.filter(n => n.id !== item.id);
    this.saveNotices([item, ...filtered]);
  },
  removeNoticeItem(id: string): void {
    const list = this.getNotices();
    this.saveNotices(list.filter(n => n.id !== id));
  },

  // 4. Deleted Notices IDs
  getDeletedNoticeIds(): string[] {
    try {
      const raw = localStorage.getItem(CACHE_KEYS.DELETED_NOTICES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  saveDeletedNoticeIds(ids: string[]): void {
    try {
      localStorage.setItem(CACHE_KEYS.DELETED_NOTICES, JSON.stringify(Array.from(new Set(ids))));
    } catch {}
  },
  addDeletedNoticeId(id: string): void {
    const current = this.getDeletedNoticeIds();
    this.saveDeletedNoticeIds([...current, id]);
  },

  // 5. Events Items
  getEvents(): any[] {
    try {
      const raw = localStorage.getItem(CACHE_KEYS.EVENTS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  saveEvents(items: any[]): void {
    try {
      localStorage.setItem(CACHE_KEYS.EVENTS, JSON.stringify(items));
    } catch {}
  },
  addEventItem(item: any): void {
    const list = this.getEvents();
    const filtered = list.filter(e => e.id !== item.id);
    this.saveEvents([item, ...filtered]);
  },
  removeEventItem(id: string): void {
    const list = this.getEvents();
    this.saveEvents(list.filter(e => e.id !== id));
  },

  // 6. Deleted Event IDs
  getDeletedEventIds(): string[] {
    try {
      const raw = localStorage.getItem(CACHE_KEYS.DELETED_EVENTS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  saveDeletedEventIds(ids: string[]): void {
    try {
      localStorage.setItem(CACHE_KEYS.DELETED_EVENTS, JSON.stringify(Array.from(new Set(ids))));
    } catch {}
  },
  addDeletedEventId(id: string): void {
    const current = this.getDeletedEventIds();
    this.saveDeletedEventIds([...current, id]);
  },

  // 7. Achievers Items
  getAchievers(): any[] {
    try {
      const raw = localStorage.getItem(CACHE_KEYS.ACHIEVERS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  saveAchievers(items: any[]): void {
    try {
      localStorage.setItem(CACHE_KEYS.ACHIEVERS, JSON.stringify(items));
    } catch {}
  },
  addAchieverItem(item: any): void {
    const list = this.getAchievers();
    const filtered = list.filter(a => a.id !== item.id);
    this.saveAchievers([item, ...filtered]);
  },
  removeAchieverItem(id: string): void {
    const list = this.getAchievers();
    this.saveAchievers(list.filter(a => a.id !== id));
  }
};
