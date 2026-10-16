import React, { useState, useEffect } from 'react';
import { 
  Bell, ChevronRight, X, Calendar, Download, AlertCircle, FileText, 
  Sparkles, Plus, Edit3, Trash2, Check, RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { triggerAppNotification } from './NotificationToast';

export interface Notice {
  id: string;
  title: string;
  category: 'Admissions' | 'Academics' | 'Sports' | 'Circular' | 'Events';
  date: string;
  isNew?: boolean;
  details: string;
  downloadable?: boolean;
  isDefault?: boolean;
}

export const defaultNotices: Notice[] = [
  {
    id: 'd1',
    title: 'Admissions Open for Session 2026-27 (Nursery to 12th - Science, Commerce & Arts)',
    category: 'Admissions',
    date: 'Session 2026-27',
    isNew: true,
    details: 'Registration and admission open for all classes from Nursery to Senior Secondary. Special scholarship available for meritorious students. Limited seats per section to ensure individual attention.',
    downloadable: true,
    isDefault: true
  },
  {
    id: 'd2',
    title: 'Outstanding HBSE 10th & 12th Board Results — District Top Rankers Felicitated',
    category: 'Academics',
    date: 'Recent Announcement',
    isNew: true,
    details: 'Adarsh Vidya Mandir once again sets district record in Palwal with 100% pass percentage and multiple students securing 90%+ marks in Haryana Board examinations.',
    downloadable: false,
    isDefault: true
  },
  {
    id: 'd3',
    title: 'State Championship Victory: AVM Kho-Kho Team Bags 1st Place',
    category: 'Sports',
    date: 'Sports Update',
    isNew: true,
    details: 'Our school Kho-Kho team brought laurels to Meerpur Kaurali by securing first position in Haryana State Inter-School Championship.',
    downloadable: false,
    isDefault: true
  },
  {
    id: 'd4',
    title: 'School Transport Bus Routes & Safety Guidelines 2026-27',
    category: 'Circular',
    date: 'Active Circular',
    isNew: false,
    details: 'Comprehensive bus transport coverage across Meerpur Kaurali, Palwal city, and neighboring villages. Safe transit with experienced drivers and attendants.',
    downloadable: true,
    isDefault: true
  },
  {
    id: 'd5',
    title: 'School Timings Notification: Morning Assembly at 8:00 AM Sharp',
    category: 'Circular',
    date: 'Routine Notice',
    isNew: false,
    details: 'Classes run from 8:00 AM to 2:00 PM (Monday to Saturday). Parents are requested to ensure students arrive punctually in proper clean school uniform.',
    downloadable: false,
    isDefault: true
  }
];

import { storageCache } from '../lib/storageCache';

export const useLiveNotices = () => {
  // Initialize immediately from client storage cache so refresh NEVER loses notices
  const [notices, setNotices] = useState<Notice[]>(() => {
    try {
      const cachedDeleted = new Set(storageCache.getDeletedNoticeIds());
      const cachedLive = storageCache.getNotices();
      const activeDefault = defaultNotices
        .filter(d => !cachedDeleted.has(d.id))
        .map(d => ({ ...d, isDefault: true }));
      const activeLive = cachedLive
        .filter(l => !cachedDeleted.has(l.id))
        .map(l => ({ ...l, isDefault: false }));
      const combined = [...activeLive, ...activeDefault];
      return combined.length > 0 ? combined : defaultNotices;
    } catch {
      return defaultNotices;
    }
  });

  useEffect(() => {
    let currentLive: Notice[] = storageCache.getNotices();
    let currentDeleted = new Set<string>(storageCache.getDeletedNoticeIds());

    const applyNotices = () => {
      const activeDefault = defaultNotices
        .filter(d => !currentDeleted.has(d.id))
        .map(d => ({ ...d, isDefault: true }));
      const activeLive = currentLive
        .filter(l => !currentDeleted.has(l.id))
        .map(l => ({ ...l, isDefault: false }));
      
      const combined = [...activeLive, ...activeDefault];
      setNotices(combined.length > 0 ? combined : defaultNotices);
    };

    // Instant local event listeners for 0-delay updates
    const handleInstantAdd = (e: Event) => {
      const customEvent = e as CustomEvent<Notice>;
      if (customEvent.detail) {
        storageCache.addNoticeItem(customEvent.detail);
        currentLive = [customEvent.detail, ...currentLive];
        applyNotices();
      }
    };

    const handleInstantDelete = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        currentDeleted.add(customEvent.detail);
        storageCache.addDeletedNoticeId(customEvent.detail);
        storageCache.removeNoticeItem(customEvent.detail);
        applyNotices();
      }
    };

    const handleInstantEdit = (e: Event) => {
      const customEvent = e as CustomEvent<Notice>;
      if (customEvent.detail) {
        const updated = customEvent.detail;
        storageCache.addNoticeItem(updated);
        currentLive = currentLive.map(n => n.id === updated.id ? { ...n, ...updated } : n);
        applyNotices();
      }
    };

    window.addEventListener('avm_notice_instant_add', handleInstantAdd);
    window.addEventListener('avm_notice_instant_delete', handleInstantDelete);
    window.addEventListener('avm_notice_instant_edit', handleInstantEdit);

    let unsubLive = () => {};
    let unsubDeleted = () => {};

    // 1. Deleted notices listener
    try {
      unsubDeleted = onSnapshot(collection(db, 'deleted_notices'), (snapshot) => {
        const set = new Set<string>();
        snapshot.docs.forEach(doc => {
          set.add(doc.id);
          const data = doc.data();
          if (data?.noticeId) set.add(data.noticeId);
        });
        currentDeleted = set;
        storageCache.saveDeletedNoticeIds(Array.from(set));
        applyNotices();
      }, (err) => {
        console.warn("Deleted notices listener notice:", err);
      });
    } catch {}

    // 2. Live notices listener
    try {
      unsubLive = onSnapshot(collection(db, 'notices'), (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as any)
          })) as Notice[];
          currentLive = list;
          storageCache.saveNotices(list);
        } else {
          currentLive = [];
          storageCache.saveNotices([]);
        }
        applyNotices();
      }, (err) => {
        console.warn("Firestore notices error:", err);
      });
    } catch {
      applyNotices();
    }

    return () => {
      window.removeEventListener('avm_notice_instant_add', handleInstantAdd);
      window.removeEventListener('avm_notice_instant_delete', handleInstantDelete);
      window.removeEventListener('avm_notice_instant_edit', handleInstantEdit);
      unsubLive();
      unsubDeleted();
    };
  }, []);

  return notices;
};

export const NoticeTicker: React.FC<{ onOpenModal: () => void }> = ({ onOpenModal }) => {
  const notices = useLiveNotices();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % (notices.length || 1));
  };

  const currentNotice = notices[currentIndex] || defaultNotices[0];

  return (
    <div className="bg-gradient-to-r from-amber-500 via-brand-gold to-yellow-600 text-brand-navy py-1.5 sm:py-2 px-3 sm:px-6 shadow-sm border-b border-amber-600/20 relative z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-xs sm:text-sm font-medium">
        <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
          <span className="inline-flex items-center gap-1 bg-brand-navy text-brand-gold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider uppercase shrink-0 shadow-xs animate-pulse">
            <Bell size={12} className="text-yellow-400 shrink-0" />
            <span className="hidden sm:inline">सूचना /</span> Notice
          </span>

          <div className="truncate flex-1 text-white font-semibold cursor-pointer hover:underline flex items-center gap-1.5 text-xs sm:text-sm" onClick={onOpenModal}>
            <span className="truncate">{currentNotice.title}</span>
            {currentNotice.isNew && (
              <span className="bg-red-600 text-white text-[9px] font-black uppercase px-1.5 py-0.2 rounded shrink-0">
                NEW
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <button
            onClick={handleNext}
            className="text-[10px] sm:text-[11px] text-white/90 hover:text-white underline font-semibold cursor-pointer transition-colors"
            title="Next Announcement"
          >
            <span className="hidden sm:inline">Next ({currentIndex + 1}/{notices.length})</span>
            <span className="sm:hidden font-mono">{currentIndex + 1}/{notices.length} ↻</span>
          </button>
          <button
            onClick={onOpenModal}
            className="bg-brand-navy/90 hover:bg-brand-navy text-brand-gold hover:text-yellow-300 font-bold px-2 py-0.5 sm:px-3 sm:py-1 rounded text-[11px] sm:text-xs transition-all flex items-center gap-0.5 sm:gap-1 shadow-xs cursor-pointer"
          >
            <span className="hidden xs:inline">Notice</span> Board
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const NoticeModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const notices = useLiveNotices();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeNoticeId, setActiveNoticeId] = useState<string | null>(notices[0]?.id || 'd1');

  // Add / Edit Notice Modal Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<'Admissions' | 'Academics' | 'Sports' | 'Circular' | 'Events'>('Circular');
  const [formDate, setFormDate] = useState('Session 2026-27');
  const [formDetails, setFormDetails] = useState('');
  const [formIsNew, setFormIsNew] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const categories = ['All', 'Admissions', 'Academics', 'Sports', 'Circular', 'Events'];

  const filteredNotices = selectedCategory === 'All'
    ? notices
    : notices.filter((n) => n.category === selectedCategory);

  // Open Form for Adding New Notice
  const handleOpenAdd = () => {
    setEditingNotice(null);
    setFormTitle('');
    setFormCategory('Circular');
    setFormDate('Session 2026-27');
    setFormDetails('');
    setFormIsNew(true);
    setShowAddForm(true);
  };

  // Open Form for Editing Existing Notice
  const handleOpenEdit = (n: Notice, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNotice(n);
    setFormTitle(n.title);
    setFormCategory(n.category || 'Circular');
    setFormDate(n.date || 'Active Notice');
    setFormDetails(n.details);
    setFormIsNew(Boolean(n.isNew));
    setShowAddForm(true);
  };

  // Handle Save (Add or Edit) with 0-delay instant feedback
  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDetails.trim()) return;

    setIsSaving(true);
    const title = formTitle.trim();
    const details = formDetails.trim();
    const date = formDate.trim() || 'Session 2026-27';

    try {
      if (editingNotice) {
        // Instant Optimistic Dispatch for Edit
        const updatedNotice: Notice = {
          ...editingNotice,
          title,
          category: formCategory,
          date,
          details,
          isNew: formIsNew
        };
        storageCache.addNoticeItem(updatedNotice);
        window.dispatchEvent(new CustomEvent('avm_notice_instant_edit', { detail: updatedNotice }));

        if (editingNotice.isDefault) {
          // If it was a default notice, delete default tombstone and write as new live notice
          await setDoc(doc(db, 'deleted_notices', editingNotice.id), {
            noticeId: editingNotice.id,
            deletedAt: new Date().toISOString()
          });
          const docRef = await addDoc(collection(db, 'notices'), {
            title,
            category: formCategory,
            date,
            details,
            isNew: formIsNew,
            downloadable: false,
            createdAt: new Date().toISOString()
          });
          updatedNotice.id = docRef.id;
          storageCache.addNoticeItem(updatedNotice);
        } else {
          // Update Firestore doc
          await updateDoc(doc(db, 'notices', editingNotice.id), {
            title,
            category: formCategory,
            date,
            details,
            isNew: formIsNew,
            updatedAt: new Date().toISOString()
          });
        }

        triggerAppNotification(
          "Notice Updated",
          `✅ नोटिस "${title.slice(0, 35)}..." तुरंत अपडेट हो गया!`,
          'success'
        );
      } else {
        // Instant Optimistic Dispatch for Add
        const tempId = 'notice-' + Date.now();
        const newNotice: Notice = {
          id: tempId,
          title,
          category: formCategory,
          date,
          details,
          isNew: formIsNew,
          downloadable: false
        };
        storageCache.addNoticeItem(newNotice);
        window.dispatchEvent(new CustomEvent('avm_notice_instant_add', { detail: newNotice }));

        // Firestore persist
        const docRef = await addDoc(collection(db, 'notices'), {
          title,
          category: formCategory,
          date,
          details,
          isNew: formIsNew,
          downloadable: false,
          createdAt: new Date().toISOString()
        });
        newNotice.id = docRef.id;
        storageCache.addNoticeItem(newNotice);

        triggerAppNotification(
          "Notice Published Live",
          `✅ नया नोटिस "${title.slice(0, 35)}..." नोटिस बोर्ड और टिकर पर लाइव हो गया!`,
          'success'
        );
      }

      setShowAddForm(false);
      setEditingNotice(null);
    } catch (err) {
      console.error(err);
      triggerAppNotification("Notice Error", String(err), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete with 0-delay instant feedback
  const handleDeleteNotice = async (notice: Notice, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 0-delay instant optimistic dispatch & storageCache update
    storageCache.addDeletedNoticeId(notice.id);
    storageCache.removeNoticeItem(notice.id);
    window.dispatchEvent(new CustomEvent('avm_notice_instant_delete', { detail: notice.id }));

    try {
      if (notice.isDefault) {
        // Record tombstone in deleted_notices collection
        await setDoc(doc(db, 'deleted_notices', notice.id), {
          noticeId: notice.id,
          title: notice.title,
          deletedAt: new Date().toISOString()
        });
      } else {
        // Delete document from Firestore
        await deleteDoc(doc(db, 'notices', notice.id));
      }

      triggerAppNotification(
        "Notice Deleted",
        `🗑️ नोटिस "${notice.title.slice(0, 30)}..." नोटिस बोर्ड से हटा दिया गया।`,
        'info'
      );
    } catch (err) {
      console.error(err);
      triggerAppNotification("Delete Error", String(err), 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-6 bg-brand-navy/85 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-brand-navy text-white p-4 sm:p-6 relative flex items-center justify-between border-b border-brand-gold/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-brand-gold/20 flex items-center justify-center text-brand-gold border border-brand-gold/40 shrink-0">
              <Bell size={24} />
            </div>
            <div>
              <h3 className="text-lg sm:text-2xl font-serif font-bold text-white flex items-center gap-2">
                Digital Notice Board <span className="text-brand-gold font-normal text-xs sm:text-base">(डिजिटल सूचना पट्ट)</span>
              </h3>
              <p className="text-slate-300 text-xs">Official announcements, exams, results & circulars</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAdd}
              className="bg-brand-gold hover:bg-yellow-500 text-brand-navy font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Add Notice (नया नोटिस)</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* INLINE ADD / EDIT FORM (WHEN OPENED) */}
        {showAddForm && (
          <div className="bg-amber-50/90 border-b-2 border-brand-gold p-4 sm:p-5 shadow-inner">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-serif font-bold text-brand-navy text-sm sm:text-base flex items-center gap-2">
                {editingNotice ? <Edit3 size={17} className="text-brand-gold" /> : <Plus size={17} className="text-brand-gold" />}
                <span>{editingNotice ? 'Edit Notice (नोटिस एडिट करें)' : 'Add New Notice (नया नोटिस जोड़ें)'}</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-red-600 hover:underline font-bold cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveNotice} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Notice Headline / Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Winter Break Schedule / Board Admit Cards Available"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  >
                    <option value="Admissions">Admissions</option>
                    <option value="Academics">Academics</option>
                    <option value="Sports">Sports</option>
                    <option value="Circular">Circular</option>
                    <option value="Events">Events</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Date / Session Tag
                  </label>
                  <input
                    type="text"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    placeholder="e.g. Session 2026-27"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 p-2 bg-white border border-slate-300 rounded-lg cursor-pointer w-full">
                    <input
                      type="checkbox"
                      checked={formIsNew}
                      onChange={(e) => setFormIsNew(e.target.checked)}
                      className="rounded text-brand-gold focus:ring-brand-gold"
                    />
                    <span className="text-xs font-bold text-red-600">Show "NEW" Badge</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Circular Description & Details *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formDetails}
                  onChange={(e) => setFormDetails(e.target.value)}
                  placeholder="Complete announcement details, guidelines, or timings..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-brand-navy hover:bg-slate-800 text-brand-gold font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>{editingNotice ? 'Save Notice Changes' : 'Publish to Board Live'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories Bar */}
        <div className="bg-slate-100 p-2 sm:px-6 flex gap-1.5 overflow-x-auto border-b border-slate-200 shrink-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-brand-navy text-brand-gold shadow'
                  : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Notices Content Area */}
        <div className="overflow-y-auto p-3 sm:p-6 space-y-3 flex-1">
          {filteredNotices.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              इस श्रेणी में कोई सूचना उपलब्ध नहीं है।
            </div>
          ) : (
            filteredNotices.map((notice) => {
              const isExpanded = activeNoticeId === notice.id;
              return (
                <div
                  key={notice.id}
                  className={`border rounded-xl transition-all ${
                    isExpanded
                      ? 'border-brand-gold bg-amber-50/40 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div
                    className="p-3.5 sm:p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    onClick={() => setActiveNoticeId(isExpanded ? null : notice.id)}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <span className="p-2 rounded-lg bg-slate-100 text-brand-navy mt-0.5 shrink-0">
                        <FileText size={18} />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-navy/10 text-brand-navy">
                            {notice.category}
                          </span>
                          {notice.isNew && (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-600 text-white">
                              NEW
                            </span>
                          )}
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar size={12} /> {notice.date}
                          </span>
                        </div>
                        <h4 className="font-semibold text-brand-navy text-sm sm:text-base leading-snug">
                          {notice.title}
                        </h4>
                      </div>
                    </div>

                    {/* Action Buttons: Edit, Delete, Toggle View */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEdit(notice, e)}
                        className="px-2.5 py-1 text-xs font-bold text-brand-navy bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                        title="Edit this notice"
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteNotice(notice, e)}
                        className="px-2.5 py-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                        title="Delete this notice"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>

                      <span className="text-xs font-bold text-brand-gold ml-1">
                        {isExpanded ? 'Hide ▲' : 'View ▼'}
                      </span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 pt-1 border-t border-amber-200/50 text-slate-700 text-sm leading-relaxed"
                      >
                        <p className="bg-white p-3.5 rounded-lg border border-amber-200/70 text-slate-700">
                          {notice.details}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs text-slate-500 italic">
                            Issued by: Principal Office, Adarsh Vidya Mandir, Meerpur Kaurali
                          </div>
                          <a
                            href="tel:+919813969669"
                            className="text-xs font-semibold text-brand-navy hover:text-brand-gold flex items-center gap-1.5"
                          >
                            Queries? Call +91 9813969669 ➔
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-3 sm:p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-brand-gold" />
            <span>लाइव डिजिटल सूचना पट्ट: कोई भी नोटिस एडिट/डिलीट करते ही तुरंत अपडेट होता है।</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-brand-navy text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
