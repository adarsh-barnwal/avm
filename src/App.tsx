import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, X, BookOpen, MonitorPlay, Trophy, ShieldCheck, Bus, 
  Phone, Mail, MapPin, MessageCircle, ChevronRight, GraduationCap,
  Users, Award, Calendar, Quote, BookMarked, Zap, Send, CheckCircle2, AlertCircle, FileText, Download, Sparkles, Shield, Camera
} from 'lucide-react';
import { NoticeTicker, NoticeModal } from './components/NoticeBoard';
import { AdmissionModal } from './components/AdmissionModal';
import { PhotoGallery } from './components/PhotoGallery';
import { EventsSection } from './components/EventsSection';
import { FaqSection } from './components/FaqSection';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ThemeSelector } from './components/ThemeSelector';
import { AdminPortal } from './components/AdminPortal';
import { NotificationToast } from './components/NotificationToast';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase';
import { storageCache } from './lib/storageCache';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  id?: string;
}

const FadeIn: React.FC<FadeInProps> = ({ children, delay = 0, className = "", id }: FadeInProps) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.7, delay, ease: "easeOut" }}
    className={className}
    id={id}
  >
    {children}
  </motion.div>
);

export default function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupStatus, setPopupStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  
  // Modals State
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [admissionModalTab, setAdmissionModalTab] = useState<'apply' | 'prospectus'>('apply');
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [adminPortalTab, setAdminPortalTab] = useState<'notices' | 'admissions' | 'media' | 'events' | 'achievers'>('notices');
  const [autoTriggerGalleryPicker, setAutoTriggerGalleryPicker] = useState(false);
  // Initialize achievers from client storage cache so refresh NEVER loses newly added achievers
  const [liveAchievers, setLiveAchievers] = useState<any[]>(() => {
    try {
      return storageCache.getAchievers();
    } catch {
      return [];
    }
  });

  // Listen for live achievers
  useEffect(() => {
    const handleInstantAchiever = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      if (customEvent.detail) {
        storageCache.addAchieverItem(customEvent.detail);
        setLiveAchievers(prev => [customEvent.detail, ...prev.filter(a => a.id !== customEvent.detail.id)]);
      }
    };

    const handleInstantDeleteAchiever = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        storageCache.removeAchieverItem(customEvent.detail);
        setLiveAchievers(prev => prev.filter(a => a.id !== customEvent.detail));
      }
    };

    window.addEventListener('avm_achiever_instant_add', handleInstantAchiever);
    window.addEventListener('avm_achiever_instant_delete', handleInstantDeleteAchiever);

    let unsub = () => {};
    try {
      unsub = onSnapshot(
        collection(db, 'achievers'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            storageCache.saveAchievers(list);
            setLiveAchievers(list);
          } else {
            storageCache.saveAchievers([]);
            setLiveAchievers([]);
          }
        },
        (error) => {
          console.warn("Achievers snapshot listener error:", error);
        }
      );
    } catch (err) {
      console.warn("Failed to subscribe to achievers:", err);
    }

    return () => {
      window.removeEventListener('avm_achiever_instant_add', handleInstantAchiever);
      window.removeEventListener('avm_achiever_instant_delete', handleInstantDeleteAchiever);
      unsub();
    };
  }, []);

  // Check if opened via #admin or #upload hash (e.g. website.com/#admin or #upload)
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#admin') {
        setShowAdminPortal(true);
      } else if (window.location.hash === '#upload' || window.location.hash === '#gallery-upload') {
        setAdminPortalTab('media');
        setAutoTriggerGalleryPicker(true);
        setShowAdminPortal(true);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    // Show popup after 1.5 seconds of loading
    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handlePopupSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPopupStatus('submitting');
    
    const formData = new FormData(e.currentTarget);
    formData.append("access_key", "c8619600-3c2b-40e6-9f1c-3e2f73a7b9ed");
    formData.append("subject", "New Inquiry from Website Popup Form");

    const object = Object.fromEntries(formData);
    const json = JSON.stringify(object);

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: json
      });
      const result = await res.json();
      
      if (result.success) {
        setPopupStatus('success');
        e.currentTarget.reset();
        setTimeout(() => {
          setShowPopup(false);
          setPopupStatus('idle');
        }, 3000);
      } else {
        console.error("Web3Forms Error:", result);
        setPopupStatus('error');
        setTimeout(() => setPopupStatus('idle'), 5000);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      setPopupStatus('error');
      setTimeout(() => setPopupStatus('idle'), 5000);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormStatus('submitting');
    
    const formData = new FormData(e.currentTarget);
    formData.append("access_key", "c8619600-3c2b-40e6-9f1c-3e2f73a7b9ed");
    formData.append("subject", "New Contact Form Submission from Website");

    const object = Object.fromEntries(formData);
    const json = JSON.stringify(object);

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: json
      });
      const result = await res.json();
      
      if (result.success) {
        setFormStatus('success');
        e.currentTarget.reset();
        setTimeout(() => setFormStatus('idle'), 5000);
      } else {
        console.error("Web3Forms Error:", result);
        setFormStatus('error');
        setTimeout(() => setFormStatus('idle'), 5000);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      setFormStatus('error');
      setTimeout(() => setFormStatus('idle'), 5000);
    }
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Leadership', href: '#leadership' },
    { name: 'Academics', href: '#academics' },
    { name: 'Events', href: '#events' },
    { name: 'Gallery', href: '#gallery' },
    { name: 'Admissions', href: '#admissions' },
    { name: 'FAQs', href: '#faqs' },
    { name: 'Contact', href: '#reach-out' },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden w-full max-w-[100vw] bg-brand-light font-sans text-slate-800 selection:bg-brand-gold selection:text-white">
      
      {/* Real-time Global Notification Toast Popup */}
      <NotificationToast />

      {/* Notice Board Modal */}
      <NoticeModal isOpen={showNoticeModal} onClose={() => setShowNoticeModal(false)} />

      {/* Online Admission & Prospectus Modal */}
      <AdmissionModal 
        isOpen={showAdmissionModal} 
        onClose={() => setShowAdmissionModal(false)} 
        defaultTab={admissionModalTab} 
      />

      {/* Real-time School Admin Management Portal */}
      <AdminPortal 
        isOpen={showAdminPortal} 
        onClose={() => {
          setShowAdminPortal(false);
          setAutoTriggerGalleryPicker(false);
        }} 
        initialTab={adminPortalTab}
        autoTriggerGalleryPicker={autoTriggerGalleryPicker}
      />

      {/* Inquiry Popup Modal */}
      <AnimatePresence>
        {showPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-brand-navy/60 backdrop-blur-sm"
              onClick={() => setShowPopup(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="bg-brand-navy p-6 relative">
                <button 
                  onClick={() => setShowPopup(false)}
                  className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
                <h3 className="text-2xl font-serif font-bold text-brand-gold mb-1">Get in Touch</h3>
                <p className="text-slate-300 text-sm">Fill out the form below and we will contact you shortly.</p>
              </div>
              
              <div className="p-6">
                <form action="https://api.web3forms.com/submit" method="POST" className="space-y-4">
                  <input type="hidden" name="access_key" value="c8619600-3c2b-40e6-9f1c-3e2f73a7b9ed" />
                  <input type="hidden" name="subject" value="New Inquiry from Website Popup Form" />
                  <input type="hidden" name="from_name" value="Adarsh Vidya Mandir Website" />
                  
                  <div>
                    <label htmlFor="popup-name" className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                    <input type="text" id="popup-name" name="name" required className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent transition-all bg-slate-50 hover:bg-white text-sm" placeholder="Your Name" />
                  </div>
                  <div>
                    <label htmlFor="popup-phone" className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input type="tel" id="popup-phone" name="phone" required className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent transition-all bg-slate-50 hover:bg-white text-sm" placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <label htmlFor="popup-query" className="block text-sm font-semibold text-slate-700 mb-1">Your Query</label>
                    <textarea id="popup-query" name="query" rows={3} required className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent transition-all resize-none bg-slate-50 hover:bg-white text-sm" placeholder="How can we help you?"></textarea>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-brand-gold text-white font-bold py-3 px-6 rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-gold/20 group mt-2 cursor-pointer"
                  >
                    Submit <Send size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 1. ROW 1: Dedicated School Name & Identity Line */}
      <div className="bg-white border-b border-slate-100 relative z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-3.5 flex justify-between items-center gap-2">
          {/* Logo & School Name */}
          <a href="#home" className="flex items-center gap-2.5 sm:gap-4 group min-w-0">
            <div className="w-10 h-10 sm:w-13 sm:h-13 md:w-15 md:h-15 bg-white rounded-lg sm:rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300 overflow-hidden shadow-xs border border-slate-200 shrink-0">
              <img src="/logo.jpg.jpeg" alt="AVM Logo" className="w-full h-full object-contain p-0.5 sm:p-1" />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                <span className="font-serif font-extrabold text-base sm:text-2xl md:text-3xl text-brand-navy tracking-tight leading-tight sm:leading-none truncate">
                  Adarsh Vidya Mandir
                </span>
                <span className="text-[10px] sm:text-sm md:text-base font-bold text-brand-gold uppercase tracking-wider shrink-0">
                  Sr. Sec. School
                </span>
              </div>
              <p className="text-[9px] sm:text-xs text-slate-500 font-medium tracking-wide mt-0.5 sm:mt-1 truncate max-w-[210px] sm:max-w-none">
                Meerpur Kaurali, Palwal (Haryana) • HBSE Affiliated • Nursery to 12th
              </p>
            </div>
          </a>

          {/* Action CTAs & Mobile Menu Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              onClick={() => { setAdmissionModalTab('apply'); setShowAdmissionModal(true); }}
              className="bg-brand-gold text-brand-navy hover:bg-yellow-500 font-bold px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[11px] sm:text-xs md:text-sm transition-all shadow-sm shadow-brand-gold/20 flex items-center gap-1 sm:gap-1.5 cursor-pointer shrink-0"
            >
              <Sparkles size={13} className="shrink-0" /> 
              <span><span className="hidden sm:inline">Apply Online </span>2026-27</span>
            </button>

            <a 
              href="mailto:adarshbaranwal05@gmail.com" 
              className="hidden md:flex items-center gap-1.5 border-2 border-brand-navy bg-brand-navy text-white px-3.5 py-2 font-semibold text-xs rounded-lg hover:bg-transparent hover:text-brand-navy transition-all duration-300"
            >
              <Mail size={14} /> Email Connect
            </a>

            {/* Mobile Menu Toggle */}
            <button 
              className="lg:hidden text-brand-navy p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors" 
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Toggle navigation menu"
            >
              <Menu size={24} className="sm:w-7 sm:h-7" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. ROW 2: Contact Wali Line (School Name ke niche aur Navigation Bar ke uper) */}
      <div className="bg-brand-navy border-y border-white/10 py-1 sm:py-1.5 relative z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex flex-wrap justify-between items-center text-[11px] sm:text-xs text-slate-300 tracking-wide font-medium gap-1.5 sm:gap-2">
          <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto no-scrollbar py-0.5">
            <a href="tel:+919813969669" className="flex items-center gap-1 hover:text-brand-gold transition-colors shrink-0">
              <Phone size={12} className="text-brand-gold shrink-0" /> 
              <span>+91 9813969669</span>
            </a>
            <a href="mailto:adarshbaranwal05@gmail.com" className="hidden sm:flex items-center gap-1.5 hover:text-brand-gold transition-colors shrink-0">
              <Mail size={12} className="text-brand-gold shrink-0" /> 
              <span>adarshbaranwal05@gmail.com</span>
            </a>
            <div className="flex items-center gap-1 text-slate-400 shrink-0">
              <MapPin size={12} className="text-brand-gold shrink-0" /> 
              <span className="truncate max-w-[150px] sm:max-w-none">Meerpur Kaurali, Palwal, Haryana</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden md:inline-block text-[10px] uppercase tracking-wider text-slate-400 font-semibold border-r border-white/20 pr-2">
              HBSE Code: 1107
            </span>
            <button
              onClick={() => setShowAdminPortal(true)}
              className="flex items-center gap-1 bg-brand-gold/15 hover:bg-brand-gold hover:text-brand-navy text-brand-gold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded text-[10px] sm:text-[11px] font-bold tracking-wider cursor-pointer transition-all border border-brand-gold/30 shadow-xs"
              title="Admin Portal (Secure Login)"
            >
              <Shield size={11} className="shrink-0" /> 
              <span>Admin Portal</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. ROW 3: Dedicated Navigation Bar & 4. ROW 4: Notice wali line (Navigation bar ke niche) */}
      <header className="sticky top-0 z-50 shadow-md">
        {/* ROW 3: Dedicated Navigation Links Line */}
        <div className="hidden lg:block bg-brand-navy text-white border-t border-brand-gold/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <nav className="flex items-center justify-center gap-7 xl:gap-9 py-2.5">
              {navLinks.map((link) => (
                <a 
                  key={link.name} 
                  href={link.href} 
                  className="text-slate-200 hover:text-brand-gold transition-colors relative py-1 group uppercase tracking-wider font-semibold text-xs xl:text-sm"
                >
                  {link.name}
                  <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand-gold group-hover:w-full transition-all duration-300"></span>
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* ROW 4: Notice wali line (Navigation bar ke niche) */}
        <NoticeTicker onOpenModal={() => setShowNoticeModal(true)} />
      </header>

      {/* Mobile Menu Drawer (Decent sizing, no oversized elements) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-brand-navy flex flex-col p-5 sm:p-6 shadow-2xl overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 shrink-0">
              <div className="flex flex-col">
                <span className="font-serif font-bold text-xl text-white">AVM School</span>
                <span className="text-[10px] uppercase tracking-widest text-brand-gold">Palwal, Haryana</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)} 
                className="text-white hover:text-brand-gold transition-colors p-1"
                aria-label="Close menu"
              >
                <X size={26} />
              </button>
            </div>
            
            <div className="flex flex-col gap-3 sm:gap-4 overflow-y-auto flex-1 pr-1">
              {navLinks.map((link) => (
                <a 
                  key={link.name} 
                  href={link.href} 
                  className="font-serif text-lg sm:text-xl font-medium text-white/90 hover:text-brand-gold transition-colors py-1 border-b border-white/5"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              
              <div className="pt-4 border-t border-white/10 mt-2 flex flex-col gap-2.5 pb-8">
                <button
                  onClick={() => { setMobileMenuOpen(false); setAdmissionModalTab('apply'); setShowAdmissionModal(true); }}
                  className="flex items-center justify-center gap-2 bg-brand-gold text-brand-navy px-4 py-2.5 rounded-lg font-bold text-xs sm:text-sm hover:bg-yellow-500 transition-colors w-full shadow-md cursor-pointer"
                >
                  <Sparkles size={16} /> Apply for Admission 2026-27
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); setShowAdminPortal(true); }}
                  className="flex items-center justify-center gap-2 bg-white/10 text-brand-gold px-4 py-2 rounded-lg font-bold text-xs hover:bg-white/20 transition-all w-full border border-brand-gold/40 cursor-pointer shadow-xs"
                >
                  <Shield size={14} /> Admin Portal (प्रबंधन लॉगिन)
                </button>
                <a 
                  href="mailto:adarshbaranwal05@gmail.com" 
                  className="flex items-center justify-center gap-2 bg-white/5 text-slate-300 px-4 py-2 rounded-lg font-medium text-xs hover:bg-white/10 transition-colors w-full border border-white/10"
                >
                  <Mail size={14} /> Email Connect
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Elegant Hero Section (Proportioned for mobile and desktop) */}
      <section id="home" className="relative min-h-[75vh] sm:min-h-[85vh] md:min-h-[90vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <img 
            src="/background.png.jpeg" 
            alt="School Campus" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-brand-navy/80 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/80 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full pt-10 sm:pt-16 md:pt-20 pb-12 sm:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
              <span className="w-8 sm:w-12 h-[2px] bg-brand-gold"></span>
              <span className="text-brand-gold font-semibold tracking-widest uppercase text-xs sm:text-sm">Welcome to Excellence</span>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-serif font-bold text-white mb-4 sm:mb-8 leading-[1.15]">
              Shaping Future <br />
              <span className="text-brand-gold">Leaders.</span>
            </h1>
            <p className="text-sm sm:text-lg lg:text-xl text-slate-300 mb-6 sm:mb-10 leading-relaxed max-w-2xl font-light">
              Rooted in deep moral values and driven by academic rigor, Adarsh Vidya Mandir provides a holistic environment for students to discover their true potential.
            </p>
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
              <button
                onClick={() => { setAdmissionModalTab('apply'); setShowAdmissionModal(true); }}
                className="bg-brand-gold text-brand-navy px-4 py-2.5 sm:px-8 sm:py-4 font-bold hover:bg-yellow-500 transition-colors flex items-center gap-1.5 sm:gap-2 group shadow-xl shadow-brand-gold/30 text-xs sm:text-base cursor-pointer rounded-sm"
              >
                Apply for Admission 2026-27 <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <a href="#about" className="bg-transparent border border-white/40 text-white px-3.5 py-2.5 sm:px-7 sm:py-4 font-semibold hover:bg-white hover:text-brand-navy transition-colors text-xs sm:text-base rounded-sm">
                Discover AVM
              </a>
              <button
                onClick={() => { setAdmissionModalTab('prospectus'); setShowAdmissionModal(true); }}
                className="bg-white/10 backdrop-blur-sm border border-white/25 text-white px-3.5 py-2.5 sm:px-6 sm:py-4 font-semibold hover:bg-white/20 transition-colors flex items-center gap-1.5 text-xs sm:text-base cursor-pointer rounded-sm"
              >
                <Download size={14} /> Prospectus
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Overview Section */}
      <section id="overview" className="py-12 sm:py-20 md:py-24 bg-slate-50 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center">
            
            <FadeIn delay={0.2} className="w-full max-w-xs sm:max-w-sm mb-8 sm:mb-12">
              <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-xl text-center group hover:-translate-y-1 transition-transform duration-300">
                 <div className="aspect-square rounded-xl overflow-hidden mb-4 sm:mb-5 relative border border-slate-100">
                    <div className="absolute inset-0 bg-brand-navy/5 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                    <img 
                      src="/late. mr. gyashiram.jpg.jpeg" 
                      alt="Late Mr. Gyashi Ram Baranwal" 
                      className="w-full h-full object-cover object-top transform group-hover:scale-105 transition-transform duration-700"
                    />
                 </div>
                 <h4 className="text-lg sm:text-xl font-serif font-bold text-brand-navy mb-1 leading-tight">Late Mr. Gyashi Ram Baranwal</h4>
                 <p className="text-brand-gold text-[10px] sm:text-xs font-bold uppercase tracking-widest">Founder Father</p>
                 <div className="w-10 sm:w-12 h-1 bg-brand-gold/30 mx-auto mt-3 sm:mt-4 rounded-full transition-all group-hover:w-16"></div>
              </div>
            </FadeIn>

            <div className="w-full text-center">
              <FadeIn>
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-brand-gold font-bold tracking-widest uppercase text-xs sm:text-sm mb-2 sm:mb-3">Welcome to AVM</h2>
                  <h3 className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold text-brand-navy mb-4 sm:mb-8">School Overview</h3>
                  <div className="space-y-4 sm:space-y-6 text-slate-600 text-sm sm:text-base md:text-lg leading-relaxed text-left md:text-center">
                    <p>
                      Adarsh Vidya Mandir Senior Secondary School, established in 1999, is a well-respected educational institution located in Meerpur Kaurali, Palwal, Haryana. Founded under the visionary leadership of Late Mr. Gyashi Ram Baranwal, the school has consistently worked towards providing quality education combined with strong moral values.
                    </p>
                    <p>
                      Since its inception, the school has focused on the holistic development of students by balancing academics, discipline, and extracurricular activities. With classes ranging from Nursery to Senior Secondary level, the institution aims to nurture young minds and prepare them for future challenges.
                    </p>
                    <p>
                      The school is equipped with a supportive learning environment, experienced faculty, and modern teaching methodologies that encourage creativity, critical thinking, and confidence among students. Over the years, Adarsh Vidya Mandir has built a reputation for academic excellence and character building.
                    </p>
                    <p>
                      Committed to shaping responsible citizens and future leaders, the school continues to uphold its mission of delivering value-based education and fostering a culture of learning, integrity, and growth.
                    </p>
                  </div>
                </div>
              </FadeIn>
            </div>

          </div>
        </div>
      </section>

      {/* About & Trust Section */}
      <section id="about" className="py-12 sm:py-20 md:py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
              <div className="relative">
                <div className="aspect-[4/3] overflow-hidden rounded-sm relative z-10">
                  <img src="/life%20at%20avm%20(1).jpeg" alt="Students learning" className="w-full h-full object-cover" />
                </div>
                {/* Decorative Elements */}
                <div className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 w-full h-full border-2 border-brand-gold -z-0"></div>
                <div className="absolute -top-6 -right-6 sm:-top-8 sm:-right-8 w-24 h-24 sm:w-32 sm:h-32 bg-slate-100 -z-10 rounded-full"></div>
              </div>

              <div>
                <h2 className="text-brand-gold font-bold tracking-widest uppercase text-xs sm:text-sm mb-2 sm:mb-3">Who We Are</h2>
                <h3 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold text-brand-navy mb-4 sm:mb-6 leading-tight">
                  A Tradition of <br /> Educational Excellence
                </h3>
                <p className="text-slate-600 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 leading-relaxed">
                  Adarsh Vidya Mandir focuses on quality education, discipline, and overall development. We are deeply committed to fostering an environment where every student is encouraged to excel academically, physically, and morally.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-slate-100">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="text-brand-gold mt-1 shrink-0"><BookMarked size={20} className="sm:w-6 sm:h-6" /></div>
                    <div>
                      <h4 className="font-bold text-brand-navy text-sm sm:text-base mb-1">HBSE Affiliated</h4>
                      <p className="text-xs sm:text-sm text-slate-500">Rigorous academic framework set by the Haryana Board.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="text-brand-gold mt-1 shrink-0"><Users size={20} className="sm:w-6 sm:h-6" /></div>
                    <div>
                      <h4 className="font-bold text-brand-navy text-sm sm:text-base mb-1">Expert Faculty</h4>
                      <p className="text-xs sm:text-sm text-slate-500">Highly qualified and deeply dedicated teaching staff.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Highlights / Features Grid */}
      <section className="py-12 sm:py-16 md:py-20 bg-slate-50 border-y border-slate-100 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-16 max-w-2xl mx-auto">
            <h2 className="text-brand-gold font-bold tracking-widest uppercase text-xs sm:text-sm mb-2 sm:mb-3">Our Facilities</h2>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-brand-navy">Campus Highlights</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-6">
            {[
              { icon: Users, title: "Experienced Faculty", desc: "Mentors who guide and inspire." },
              { icon: MonitorPlay, title: "Smart Classes", desc: "Technology-driven learning." },
              { icon: Trophy, title: "Sports Facilities", desc: "Robust physical education." },
              { icon: ShieldCheck, title: "Safe Campus", desc: "Secure, monitored environment." },
              { icon: Bus, title: "Transport Facility", desc: "Safe connectivity for students." },
              { icon: Zap, title: "Generator Facility", desc: "24/7 uninterrupted power backup." }
            ].map((feature, idx) => (
              <FadeIn key={idx} delay={idx * 0.1}>
                <div className="bg-white p-4 sm:p-6 md:p-8 border border-slate-100 hover:border-brand-gold/30 hover:shadow-lg transition-all duration-300 text-center h-full group flex flex-col justify-center items-center rounded-xl">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 group-hover:bg-brand-gold group-hover:text-white text-brand-navy rounded-full flex items-center justify-center mb-3 sm:mb-6 transition-colors duration-300 shrink-0">
                    <feature.icon size={22} className="sm:w-7 sm:h-7" />
                  </div>
                  <h4 className="font-bold text-brand-navy text-xs sm:text-sm md:text-base mb-1.5 sm:mb-3">{feature.title}</h4>
                  <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 leading-snug">{feature.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section id="leadership" className="py-12 sm:py-20 md:py-24 bg-brand-navy text-white relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-accent transform skew-x-12 hidden lg:block"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="mb-8 sm:mb-16">
            <h2 className="text-brand-gold font-bold tracking-widest uppercase text-xs sm:text-sm mb-2 sm:mb-3">Guiding Lights</h2>
            <h3 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold">Our Leadership</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Chairman */}
            <FadeIn delay={0} className="flex">
              <div className="bg-white p-4 sm:p-6 shadow-xl flex-1 flex flex-col justify-start hover:-translate-y-1 transition-transform duration-300 rounded-xl">
                <div className="flex flex-col items-center gap-3 sm:gap-4 mb-4 sm:mb-6 border-b border-slate-100 pb-4 sm:pb-6 text-center">
                  <div className="w-20 h-20 sm:w-28 sm:h-28 bg-slate-50 border-4 border-slate-100 rounded-full flex items-center justify-center text-brand-navy overflow-hidden shrink-0 shadow-inner group">
                    <img src="/chairman.jpg.jpeg" alt="Chairman" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('flex'); e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                    <GraduationCap size={36} className="hidden" />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg sm:text-xl text-brand-navy font-bold">Mr. Prem Singh</h4>
                    <p className="text-brand-gold text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-0.5 sm:mt-1">Chairman</p>
                  </div>
                </div>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed text-center italic">
                  Leading the institution's strategic vision towards achieving the highest standards of educational excellence in Palwal, with an unwavering commitment to societal growth.
                </p>
              </div>
            </FadeIn>

            {/* Director */}
            <FadeIn delay={0.2} className="flex">
              <div className="bg-white p-4 sm:p-6 shadow-xl flex-1 flex flex-col justify-start hover:-translate-y-1 transition-transform duration-300 rounded-xl">
                <div className="flex flex-col items-center gap-3 sm:gap-4 mb-4 sm:mb-6 border-b border-slate-100 pb-4 sm:pb-6 text-center">
                  <div className="w-20 h-20 sm:w-28 sm:h-28 bg-slate-50 border-4 border-slate-100 rounded-full flex items-center justify-center text-brand-navy overflow-hidden shrink-0 shadow-inner group">
                    <img src="/director.png.jpeg" alt="Director" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('flex'); e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                    <BookOpen size={36} className="hidden" />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg sm:text-xl text-brand-navy font-bold">Mr. Satish Kumar</h4>
                    <p className="text-brand-gold text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-0.5 sm:mt-1">Director</p>
                  </div>
                </div>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed text-center italic">
                  Dedicated to ensuring seamless academic operations and fostering holistic development programs that enrich the student experience at AVM.
                </p>
              </div>
            </FadeIn>

            {/* Principal */}
            <FadeIn delay={0.4} className="flex">
              <div className="bg-white p-4 sm:p-6 shadow-xl flex-1 flex flex-col justify-start hover:-translate-y-1 transition-transform duration-300 rounded-xl">
                <div className="flex flex-col items-center gap-3 sm:gap-4 mb-4 sm:mb-6 border-b border-slate-100 pb-4 sm:pb-6 text-center">
                  <div className="w-20 h-20 sm:w-28 sm:h-28 bg-slate-50 border-4 border-slate-100 rounded-full flex items-center justify-center text-brand-navy overflow-hidden shrink-0 shadow-inner group">
                    <img src="/principal.jpg.jpeg" alt="Principal" className="w-full h-full object-cover object-top" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('flex'); e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                    <Quote size={36} className="hidden" />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg sm:text-xl text-brand-navy font-bold">Mr. Omprakash Dhanak</h4>
                    <p className="text-brand-gold text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-0.5 sm:mt-1">Principal</p>
                  </div>
                </div>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed text-center italic">
                  "Education is not merely the accumulation of facts, but the preparation of life itself. At Adarsh Vidya Mandir, our goal is to provide a comprehensive education that empowers students to face real-world challenges."
                </p>
              </div>
            </FadeIn>

            {/* Coordinator */}
            <FadeIn delay={0.6} className="flex">
              <div className="bg-white p-4 sm:p-6 shadow-xl flex-1 flex flex-col justify-start hover:-translate-y-1 transition-transform duration-300 rounded-xl">
                <div className="flex flex-col items-center gap-3 sm:gap-4 mb-4 sm:mb-6 border-b border-slate-100 pb-4 sm:pb-6 text-center">
                  <div className="w-20 h-20 sm:w-28 sm:h-28 bg-slate-50 border-4 border-slate-100 rounded-full flex items-center justify-center text-brand-navy overflow-hidden shrink-0 shadow-inner group">
                    <img src="/coach.jpg.jpeg" alt="Coordinator" className="w-full h-full object-cover object-top" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('flex'); e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                    <GraduationCap size={36} className="hidden" />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg sm:text-xl text-brand-navy font-bold">Mr. Jairaj Singh</h4>
                    <p className="text-brand-gold text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-0.5 sm:mt-1">Coordinator</p>
                  </div>
                </div>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed text-center italic">
                  Bridging athletic excellence and overall institutional coordination, ensuring every student has the guidance they need.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Academics & HBSE Details */}
      <section id="academics" className="py-12 sm:py-20 md:py-24 bg-white px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16 max-w-3xl mx-auto">
            <h2 className="text-brand-gold font-bold tracking-widest uppercase text-xs sm:text-sm mb-2 sm:mb-3">Academic Structure</h2>
            <h3 className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold text-brand-navy mb-3 sm:mb-6">HBSE Curriculum</h3>
            <p className="text-slate-600 text-sm sm:text-base md:text-lg">
              Affiliated with the Board of School Education Haryana (HBSE), Bhiwani. We maintain rigorous standards across all grade levels to ensure profound conceptual understanding.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 relative">
            {/* Connecting line on desktop */}
            <div className="hidden md:block absolute top-[60px] left-[15%] right-[15%] h-[2px] bg-slate-100 z-0"></div>

            {[
              { 
                level: "Primary & Middle", 
                grade: "Nursery to 8th", 
                desc: "Focusing on fundamental language, mathematical skills, and environmental awareness through highly engaging and interactive methods."
              },
              { 
                level: "Secondary", 
                grade: "Classes 9th & 10th", 
                desc: "Intensive preparation based on the comprehensive HBSE syllabus, embedding practical subjects and career-oriented counseling."
              },
              { 
                level: "Senior Secondary", 
                grade: "Classes 11th & 12th", 
                desc: "Specialized focus with expert guidance for board excellence and competitive exam readiness.",
                streams: ["Science", "Commerce", "Arts"]
              }
            ].map((acad, idx) => (
              <FadeIn key={idx} delay={idx * 0.15} className="relative z-10">
                <div className="bg-white text-center p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 mx-auto bg-slate-50 rounded-full border-4 border-white shadow-md flex items-center justify-center mb-4 sm:mb-6 relative">
                    <span className="font-serif font-bold text-2xl sm:text-3xl md:text-4xl text-brand-gold">{idx + 1}</span>
                  </div>
                  <h4 className="text-xl sm:text-2xl font-serif font-bold text-brand-navy mb-1.5 sm:mb-2">{acad.level}</h4>
                  <p className="text-brand-gold font-semibold text-xs sm:text-sm mb-3 sm:mb-4">{acad.grade}</p>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6 px-2 sm:px-4">{acad.desc}</p>
                  
                  {acad.streams && (
                    <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                      {acad.streams.map(stream => (
                         <span key={stream} className="px-3 py-1 bg-brand-navy text-white text-[11px] sm:text-xs font-semibold rounded-none tracking-wide">{stream}</span>
                      ))}
                    </div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-12 sm:py-20 md:py-24 bg-slate-50 border-t border-slate-200 px-4">
        <div className="max-w-7xl mx-auto">
          
          {/* Achievements Counters */}
          <FadeIn>
            <div className="text-center mb-8 sm:mb-12">
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-brand-navy mb-2 sm:mb-4">A Record of Excellence</h3>
              <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto">Building a legacy of academic brilliance, values, and holistic development.</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {[
                { number: "25+", label: "Years of Trust" },
                { number: "100%", label: "HBSE Board Results" },
                { number: "30+", label: "Expert Faculty" },
                { number: "50+", label: "Awards Won" },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white p-4 sm:p-6 md:p-8 border border-slate-100 hover:border-brand-gold/50 transition-colors text-center rounded-xl">
                   <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-brand-navy mb-1 sm:mb-2">{stat.number}</div>
                   <p className="text-brand-gold font-bold uppercase text-[10px] sm:text-xs tracking-widest">{stat.label}</p>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* Top Class Results */}
          <div className="mt-12 sm:mt-20 md:mt-32">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-brand-gold font-bold tracking-widest uppercase text-xs sm:text-sm mb-2 sm:mb-3">Academic Triumphs</h2>
              <h3 className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold text-brand-navy mb-3 sm:mb-6">Top Class Results</h3>
              <p className="text-slate-600 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
                Consistently securing top ranks in the district and setting benchmarks in HBSE board examinations.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 lg:gap-16">
              <FadeIn delay={0.2} className="relative group text-left">
                <div className="absolute inset-0 bg-brand-gold rounded-2xl transform rotate-1 group-hover:rotate-2 transition-transform duration-300"></div>
                <div className="relative bg-white border border-slate-100 p-5 sm:p-8 rounded-2xl shadow-xl flex flex-col h-full transform -rotate-1 group-hover:rotate-0 transition-transform duration-300">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-brand-navy/5 text-brand-navy rounded-full flex items-center justify-center mb-4 sm:mb-6">
                    <Trophy size={26} className="sm:w-8 sm:h-8" />
                  </div>
                  <h4 className="text-xl sm:text-2xl font-serif font-bold text-brand-navy mb-2 sm:mb-3">District Toppers</h4>
                  <p className="text-slate-600 leading-relaxed flex-grow text-sm sm:text-base md:text-lg">
                    Our students consistently seize the #1 spot in the Palwal district for both 10th and 12th standard board exams, setting high academic records unmatched by others.
                  </p>
                  <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-brand-gold font-bold text-base sm:text-lg">100% Pass Rate</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest">Consecutive Years</span>
                    </div>
                  </div>
                </div>
              </FadeIn>
              
              <FadeIn delay={0.4} className="relative group text-left">
                <div className="absolute inset-0 bg-brand-navy rounded-2xl transform -rotate-1 group-hover:-rotate-2 transition-transform duration-300"></div>
                <div className="relative bg-white border border-slate-100 p-5 sm:p-8 rounded-2xl shadow-xl flex flex-col h-full transform rotate-1 group-hover:rotate-0 transition-transform duration-300">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center mb-4 sm:mb-6">
                    <Award size={26} className="sm:w-8 sm:h-8" />
                  </div>
                  <h4 className="text-xl sm:text-2xl font-serif font-bold text-brand-navy mb-2 sm:mb-3">Top District Positions</h4>
                  <p className="text-slate-600 leading-relaxed flex-grow text-sm sm:text-base md:text-lg">
                     With a vast majority of students scoring above 90%, Adarsh Vidya Mandir is synonymous with top-tier academic rankings across the entire region.
                  </p>
                  <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-brand-navy font-bold text-base sm:text-lg">Multiple State Merits</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest">HBSE Board</span>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>

            <FadeIn delay={0.6} className="mt-10 sm:mt-16">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-[10px] sm:text-xs text-brand-gold font-bold uppercase tracking-widest">AVM Excellence</span>
                    <span className="bg-emerald-600 text-white text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles size={10} /> Live Cloud
                    </span>
                  </div>
                  <h4 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-brand-navy mt-1">Our Hall of Fame & Toppers</h4>
                  <p className="text-slate-500 text-xs sm:text-sm">Board Rankers, District Toppers & Co-Curricular Achievers</p>
                </div>

                <button
                  onClick={() => {
                    setAdminPortalTab('achievers');
                    setShowAdminPortal(true);
                  }}
                  className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-brand-navy border border-brand-gold/40 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Trophy size={13} className="text-brand-gold" />
                  + टॉपर / अचीवर जोड़ें (Add Topper)
                </button>
              </div>

              {/* Dynamic Live Achievers if added */}
              {liveAchievers.length > 0 && (
                <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {liveAchievers.map((ach) => (
                    <div key={ach.id} className="bg-white p-4 rounded-2xl border-2 border-brand-gold/40 shadow-md flex items-center gap-3.5 relative overflow-hidden group">
                      <div className="w-12 h-12 rounded-xl bg-brand-navy text-brand-gold flex items-center justify-center shrink-0 shadow">
                        <Trophy size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-extrabold uppercase text-brand-gold px-1.5 py-0.5 rounded bg-brand-navy/5">
                            {ach.category || 'Board Topper'}
                          </span>
                          {ach.year && (
                            <span className="text-[10px] text-slate-400 font-semibold">{ach.year}</span>
                          )}
                        </div>
                        <h5 className="font-bold text-brand-navy text-sm sm:text-base truncate mt-0.5">{ach.name}</h5>
                        <p className="text-xs text-slate-600 truncate">{ach.title}</p>
                        <span className="inline-block text-xs font-bold text-emerald-700 mt-0.5">
                          ⭐ {ach.scoreOrAward}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* District Toppers Gallery Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 justify-center">
                {[1, 2, 3, 4, 5].map((num) => (
                  <div key={num} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-lg group hover:-translate-y-1 transition-all duration-300">
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-inner">
                       <img 
                         src={`/districttoppers (${num}).jpeg`} 
                         alt={`District Topper ${num}`} 
                         className="w-full h-full object-cover object-top transform group-hover:scale-105 transition-transform duration-700"
                       />
                       <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-navy/80 via-brand-navy/30 to-transparent pt-12 pb-4 px-3 flex items-end justify-between">
                         <div className="flex flex-col">
                           <span className="text-brand-gold text-[10px] font-bold tracking-widest uppercase mb-1">Topper</span>
                         </div>
                         <Award className="text-brand-gold fill-brand-gold/20 drop-shadow-md" size={18} />
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>

        </div>
      </section>

      {/* Sports & Athletics */}
      <section id="sports" className="border-t border-slate-100">
        <div className="py-12 sm:py-16 md:py-24 bg-white px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-8 sm:gap-12 items-center">
              <div className="lg:col-span-2 text-center lg:text-left">
                <FadeIn>
                  <h2 className="text-brand-gold font-bold tracking-widest uppercase text-xs sm:text-sm mb-2 sm:mb-3">Athletics Program</h2>
                  <h3 className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold text-brand-navy mb-3 sm:mb-6">Sports Excellence</h3>
                  <p className="text-slate-600 max-w-2xl lg:mx-0 mx-auto text-sm sm:text-base md:text-lg leading-relaxed">
                    Building champions through dedication, world-class facilities, and expert mentorship in diverse disciplines. Our students excel not just in academics but dominate the athletic arena, proudly representing the institution at state and national levels.
                  </p>
                </FadeIn>
              </div>
              
              <div className="lg:col-span-1">
                <FadeIn delay={0.2}>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6 shadow-sm">
                     <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden shrink-0 border-[3px] border-white shadow-md">
                        <img 
                          src="/coach.jpg.jpeg" 
                          alt="Mr. Jairaj Singh" 
                          className="w-full h-full object-cover object-top"
                        />
                     </div>
                     <div>
                       <div className="text-brand-gold text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-1">Head Coach</div>
                       <h4 className="text-brand-navy font-bold font-serif text-lg sm:text-xl mb-1 sm:mb-2">Mr. Jairaj Singh</h4>
                       <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">Dedicated mentor shaping future athletic champions and instilling teamwork.</p>
                     </div>
                  </div>
                </FadeIn>
              </div>
            </div>
          </div>
        </div>

        {/* Kho-Kho */}
        <div className="py-12 sm:py-20 md:py-24 bg-brand-navy text-white relative overflow-hidden px-4">
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1526676037777-05a232554f77?q=80&w=2070&auto=format&fit=crop" 
            className="w-full h-full object-cover grayscale mix-blend-multiply" 
            alt="Sports background" 
          />
          <div className="absolute inset-0 bg-brand-navy/90"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <FadeIn>
              <div className="space-y-4 sm:space-y-6">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-4 sm:py-2 rounded-full bg-brand-gold/10 text-brand-gold text-xs sm:text-sm font-bold tracking-widest uppercase border border-brand-gold/30">
                  <Trophy size={14} className="sm:w-4 sm:h-4" /> Peak Athletic Performance
                </div>
                
                <h3 className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold text-white leading-tight">
                  <span className="block text-brand-gold mb-1 sm:mb-2">Unbeatable</span> 
                  State-Level Kho-Kho Team
                </h3>
                
                <p className="text-slate-300 text-sm sm:text-base md:text-lg leading-relaxed">
                  Adarsh Vidya Mandir takes immense pride in its unstoppable state-level Kho-Kho team. Through rigorous training, unwavering discipline, and unmatched team spirit, our athletes have consistently dominated regional and state tournaments, bringing unprecedented laurels to the institution.
                </p>
                
                <div className="pt-3 sm:pt-6 space-y-4 sm:space-y-6">
                   <div className="flex gap-3 sm:gap-4 items-start">
                     <div className="p-2 sm:p-3 rounded-full bg-brand-gold/10 text-brand-gold shrink-0 border border-brand-gold/20">
                       <Award size={20} className="sm:w-6 sm:h-6" />
                     </div>
                     <div>
                        <h4 className="font-bold text-base sm:text-xl mb-0.5 sm:mb-1 text-white">Consistent Champions</h4>
                        <p className="text-xs sm:text-sm text-slate-400">Undefeated in multiple consensus state-level championships, setting benchmark records.</p>
                     </div>
                   </div>
                   
                   <div className="flex gap-3 sm:gap-4 items-start">
                     <div className="p-2 sm:p-3 rounded-full bg-brand-gold/10 text-brand-gold shrink-0 border border-brand-gold/20">
                       <Users size={20} className="sm:w-6 sm:h-6" />
                     </div>
                     <div>
                        <h4 className="font-bold text-base sm:text-xl mb-0.5 sm:mb-1 text-white">Expert Conditioning</h4>
                        <p className="text-xs sm:text-sm text-slate-400">Trained by veteran coaches focusing on agility, stamina, and advanced tactical strategy.</p>
                     </div>
                   </div>
                </div>
              </div>
            </FadeIn>
            
            <FadeIn delay={0.2}>
               <div className="grid grid-cols-2 gap-3 sm:gap-4">
                 <div className="flex flex-col gap-3 sm:gap-4">
                   <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg border border-white/10 group">
                     <div className="absolute inset-0 bg-brand-navy/20 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                     <img 
                      src="/kho-kho (1).jpeg" 
                      alt="Kho-Kho Match Action" 
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
                     />
                   </div>
                   <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-white/10 group">
                     <div className="absolute inset-0 bg-brand-navy/20 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                     <img 
                      src="/kho-kho (2).jpeg" 
                      alt="Kho-Kho Players" 
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
                     />
                   </div>
                 </div>
                 
                 <div className="relative rounded-2xl overflow-hidden shadow-lg border border-white/10 group h-full mt-4 sm:mt-8 min-h-[200px] sm:min-h-[250px]">
                   <div className="absolute inset-0 bg-brand-navy/20 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                   <img 
                    src="/kho-kho (4).jpeg" 
                    alt="Kho-Kho Team Championship" 
                    className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
                   />
                   <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-20">
                      <div className="bg-brand-navy/80 backdrop-blur-sm border border-white/10 p-2.5 sm:p-4 rounded-xl shadow-lg">
                         <div className="flex items-center gap-2 sm:gap-3">
                           <Trophy className="text-brand-gold shrink-0" size={18} />
                           <div>
                             <div className="text-white font-bold text-xs sm:text-sm">State Champions</div>
                             <div className="text-brand-gold text-[9px] sm:text-[10px] font-bold tracking-wider uppercase mt-0.5 sm:mt-1">Haryana Board Track</div>
                           </div>
                         </div>
                      </div>
                   </div>
                 </div>
               </div>
            </FadeIn>
          </div>
        </div>
        </div>
        
        {/* Badminton */}
        <div className="py-12 sm:py-20 md:py-24 bg-slate-50 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            
            <FadeIn className="order-2 lg:order-1">
               <div className="grid grid-cols-2 gap-3 sm:gap-4">
                 <div className="flex flex-col gap-3 sm:gap-4">
                   <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg border border-slate-200 group">
                     <div className="absolute inset-0 bg-brand-navy/5 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                     <img 
                      src="/badminton.jpg.jpeg" 
                      alt="Badminton Player in action" 
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
                     />
                   </div>
                   <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-slate-200 group">
                     <div className="absolute inset-0 bg-brand-navy/5 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                     <img 
                      src="/badminton.jpg (2).jpeg" 
                      alt="Badminton Training at AVM" 
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
                     />
                   </div>
                 </div>
                 
                 <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 group h-full mt-4 sm:mt-8 min-h-[200px] sm:min-h-[250px]">
                   <div className="absolute inset-0 bg-brand-navy/5 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                   <img 
                    src="/badminton.jpg (3).jpeg" 
                    alt="Badminton Court Excellence" 
                    className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
                   />
                   <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-20">
                      <div className="bg-white/95 backdrop-blur-sm border border-slate-100 p-2.5 sm:p-4 rounded-xl shadow-lg">
                         <div className="flex items-center gap-2 sm:gap-3">
                           <Trophy className="text-brand-gold shrink-0" size={18} />
                           <div>
                             <div className="text-brand-navy font-bold text-xs sm:text-sm">Top Tier Facilities</div>
                             <div className="text-brand-gold text-[9px] sm:text-[10px] font-bold tracking-wider uppercase mt-0.5 sm:mt-1">Professional Courts</div>
                           </div>
                         </div>
                      </div>
                   </div>
                 </div>
               </div>
            </FadeIn>

            <FadeIn delay={0.2} className="order-1 lg:order-2">
              <div className="space-y-4 sm:space-y-6">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-4 sm:py-2 rounded-full bg-slate-50 text-brand-navy text-xs sm:text-sm font-bold tracking-widest uppercase border border-slate-200">
                  <Trophy size={14} className="text-brand-gold sm:w-4 sm:h-4" /> Elite Sports Program
                </div>
                
                <h3 className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold text-brand-navy leading-tight">
                  <span className="block text-brand-gold mb-1 sm:mb-2">Championship</span> 
                  Badminton Excellence
                </h3>
                
                <p className="text-slate-600 text-sm sm:text-base md:text-lg leading-relaxed">
                  Beyond team sports, our students excel in individual arenas. Equipped with professional-grade badminton courts, Adarsh Vidya Mandir offers a robust training program that hones reflexes, agility, and sportsmanship, producing top-tier athletes capable of competing at high-level tournaments.
                </p>
                
                <div className="pt-3 sm:pt-6 space-y-4 sm:space-y-6">
                   <div className="flex gap-3 sm:gap-4 items-start">
                     <div className="p-2 sm:p-3 rounded-full bg-slate-50 text-brand-gold shrink-0 border border-slate-200">
                       <ShieldCheck size={20} className="sm:w-6 sm:h-6" />
                     </div>
                     <div>
                        <h4 className="font-bold text-base sm:text-xl mb-0.5 sm:mb-1 text-brand-navy">Professional Infrastructure</h4>
                        <p className="text-xs sm:text-sm text-slate-600">Indoor courts built exactly to professional standards with optimal lighting and anti-slip surfaces.</p>
                     </div>
                   </div>
                   
                   <div className="flex gap-3 sm:gap-4 items-start">
                     <div className="p-2 sm:p-3 rounded-full bg-slate-50 text-brand-gold shrink-0 border border-slate-200">
                       <Award size={20} className="sm:w-6 sm:h-6" />
                     </div>
                     <div>
                        <h4 className="font-bold text-base sm:text-xl mb-0.5 sm:mb-1 text-brand-navy">Dedicated Mentorship</h4>
                        <p className="text-xs sm:text-sm text-slate-600">Specialized personal coaching tailored to improve technique, footwork, and competitive mindset.</p>
                     </div>
                   </div>
                </div>
              </div>
            </FadeIn>

          </div>
        </div>
      </div>
      </section>

      {/* School Events & Calendar */}
      <EventsSection />

      {/* Categorized Visual Tour & Moments (Photos & Videos) */}
      <PhotoGallery 
        onOpenAdminMedia={(autoOpen) => {
          setAdminPortalTab('media');
          setAutoTriggerGalleryPicker(Boolean(autoOpen));
          setShowAdminPortal(true);
        }}
      />

      {/* Upgraded Admissions Hub */}
      <section id="admissions" className="py-12 sm:py-20 md:py-24 bg-gradient-to-b from-slate-50 to-white px-4 border-t border-slate-200/70">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-gold/10 text-brand-gold text-[11px] sm:text-xs font-bold tracking-widest uppercase mb-2 sm:mb-3">
              <Sparkles size={13} /> Admissions Open 2026-27
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold text-brand-navy mb-3 sm:mb-4">
              Begin Your Child’s Journey of Excellence
            </h2>
            <p className="text-slate-600 text-sm sm:text-base md:text-lg">
              प्रवेश सत्र 2026-27 प्रारंभ — From Nursery to Class 12th (Science, Commerce, Arts). Apply online or visit our school reception for direct registration.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {/* Card 1: Online Application */}
            <div className="bg-white rounded-2xl p-5 sm:p-8 border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-brand-gold/15 text-brand-gold flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-brand-gold group-hover:text-white transition-colors duration-300">
                  <FileText size={24} className="sm:w-7 sm:h-7" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-brand-gold block mb-1.5 sm:mb-2">Fast & Easy</span>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-brand-navy mb-2 sm:mb-3">Online Admission Form</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6">
                  Fill our simple 2-minute registration form. Our admission counseling desk will reserve your interaction slot and contact you.
                </p>
              </div>

              <button
                onClick={() => { setAdmissionModalTab('apply'); setShowAdmissionModal(true); }}
                className="w-full bg-brand-navy text-white font-bold py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl hover:bg-brand-accent transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer text-xs sm:text-sm"
              >
                <span>Apply for Admission</span>
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Card 2: Prospectus & Guidelines */}
            <div className="bg-white rounded-2xl p-5 sm:p-8 border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1">
              <div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-brand-navy/10 text-brand-navy flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-brand-navy group-hover:text-brand-gold transition-colors duration-300">
                  <Download size={24} className="sm:w-7 sm:h-7" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-brand-navy block mb-1.5 sm:mb-2">Complete Guide</span>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-brand-navy mb-2 sm:mb-3">Prospectus & Checklist</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6">
                  Review our 4-step admission procedure, age eligibility, document requirements (Aadhar, TC, Birth Certificate), and timings.
                </p>
              </div>

              <button
                onClick={() => { setAdmissionModalTab('prospectus'); setShowAdmissionModal(true); }}
                className="w-full border-2 border-brand-navy text-brand-navy font-bold py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl hover:bg-brand-navy hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
              >
                <span>View Prospectus Details</span>
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Card 3: WhatsApp & Phone Consultation */}
            <div className="bg-gradient-to-br from-brand-navy to-slate-900 text-white rounded-2xl p-5 sm:p-8 shadow-xl flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300">
              <div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 text-brand-gold flex items-center justify-center mb-4 sm:mb-6">
                  <MessageCircle size={24} className="sm:w-7 sm:h-7" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-brand-gold block mb-1.5 sm:mb-2">Instant Helpline</span>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-white mb-2 sm:mb-3">Direct Support Desk</h3>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6">
                  Speak directly with the school administration regarding bus routes, fee structure, or stream selection in 11th & 12th.
                </p>
              </div>

              <div className="space-y-2.5 sm:space-y-3">
                <a
                  href="https://wa.me/919813969669"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-green-600 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm shadow-md"
                >
                  <MessageCircle size={16} /> Chat on WhatsApp
                </a>
                <a
                  href="tel:+919813969669"
                  className="w-full bg-white/10 text-slate-200 hover:text-white font-semibold py-2 sm:py-2.5 px-4 sm:px-6 rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2 text-[11px] sm:text-xs border border-white/15"
                >
                  <Phone size={13} className="text-brand-gold" /> Call +91 9813969669
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <FaqSection onOpenAdmission={() => { setAdmissionModalTab('apply'); setShowAdmissionModal(true); }} />

      {/* Contact Form Section */}
      <section id="reach-out" className="py-12 sm:py-20 md:py-24 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16 max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-brand-navy mb-3 sm:mb-4">Reach Out to Us</h2>
            <div className="w-16 sm:w-24 h-1 bg-brand-gold mx-auto mb-4 sm:mb-6"></div>
            <p className="text-slate-600 text-sm sm:text-base md:text-lg">
              Have questions about admissions or our programs? Send us a message and our team will get back to you shortly.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-slate-100">
             {/* Info Side */}
             <div className="bg-brand-navy text-white p-5 sm:p-8 md:w-2/5 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 font-serif text-brand-gold">Contact Info</h3>
                  <div className="space-y-5 sm:space-y-8">
                     <div className="flex items-start gap-3 sm:gap-4">
                       <MapPin className="text-brand-gold shrink-0 mt-1" size={20} />
                       <span className="text-xs sm:text-base leading-relaxed">Meerpur Kaurali, Palwal, Haryana, 121107</span>
                     </div>
                     <div className="flex items-center gap-3 sm:gap-4">
                       <Phone className="text-brand-gold shrink-0" size={20} />
                       <span className="text-xs sm:text-base">+91 9813969669</span>
                     </div>
                     <div className="flex items-center gap-3 sm:gap-4">
                       <Mail className="text-brand-gold shrink-0" size={20} />
                       <span className="text-xs sm:text-base break-all">avmschoolmpkaurali@gmail.com</span>
                     </div>
                  </div>
                </div>
                
                <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-white/10">
                  <p className="text-slate-400 text-xs sm:text-sm">Working Hours:</p>
                  <p className="font-semibold text-xs sm:text-sm mt-1">Mon - Sat: 8:00 AM - 2:00 PM</p>
                </div>
             </div>

             {/* Form Side */}
             <div className="p-5 sm:p-8 md:p-12 md:w-3/5 bg-white">
               <form action="https://api.web3forms.com/submit" method="POST" className="space-y-4 sm:space-y-6">
                  <input type="hidden" name="access_key" value="c8619600-3c2b-40e6-9f1c-3e2f73a7b9ed" />
                  <input type="hidden" name="subject" value="New Contact Form Submission from Website" />
                  <input type="hidden" name="from_name" value="Adarsh Vidya Mandir Website" />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label htmlFor="name" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">Full Name</label>
                      <input type="text" id="name" name="name" required className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent transition-all bg-slate-50 hover:bg-white text-xs sm:text-sm" placeholder="Your Name" />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">Phone Number</label>
                      <input type="tel" id="phone" name="phone" required className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent transition-all bg-slate-50 hover:bg-white text-xs sm:text-sm" placeholder="+91 98765 43210" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="query" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">Your Query</label>
                    <textarea id="query" name="query" rows={3} required className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent transition-all resize-none bg-slate-50 hover:bg-white text-xs sm:text-sm" placeholder="How can we help you?"></textarea>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-brand-gold text-white font-bold py-3 sm:py-4 px-6 rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-gold/20 group text-xs sm:text-base cursor-pointer"
                  >
                    Submit <Send size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
               </form>
             </div>
          </div>
        </div>
      </section>

      {/* Footer / Contact */}
      <footer id="contact" className="bg-brand-navy pt-12 sm:pt-20 md:pt-24 pb-20 md:pb-12 px-4 border-t-8 border-brand-gold">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-10 sm:mb-16">
          
          <div className="lg:col-span-1 border-b md:border-b-0 md:border-r border-white/10 pb-6 md:pb-0 pr-0 md:pr-8">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-md flex items-center justify-center overflow-hidden shrink-0">
                 <img src="/logo.jpg.jpeg" alt="AVM Logo" className="w-full h-full object-contain p-1" />
              </div>
              <h3 className="text-white font-serif font-bold text-lg sm:text-xl leading-tight">Adarsh Vidya<br/>Mandir</h3>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6">
              Empowering students through discipline, rigorous academics, and a nurturing environment.
            </p>
          </div>

          <div>
            <h4 className="text-white font-serif font-bold text-base sm:text-lg mb-4 sm:mb-6">Quick Links</h4>
            <ul className="space-y-2.5 sm:space-y-3 text-slate-400 text-xs sm:text-sm font-medium">
              <li><a href="#about" className="hover:text-brand-gold transition-colors block">Our Heritage</a></li>
              <li><a href="#leadership" className="hover:text-brand-gold transition-colors block">Leadership</a></li>
              <li><a href="#academics" className="hover:text-brand-gold transition-colors block">HBSE Academics</a></li>
              <li><a href="#events" className="hover:text-brand-gold transition-colors block">School Events & Calendar</a></li>
              <li><a href="#admissions" className="hover:text-brand-gold transition-colors block">Admission 2026-27</a></li>
              <li><a href="#gallery" className="hover:text-brand-gold transition-colors block">Campus Gallery</a></li>
              <li><a href="#faqs" className="hover:text-brand-gold transition-colors block">Frequently Asked Questions</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-serif font-bold text-base sm:text-lg mb-4 sm:mb-6">Contact Us</h4>
            <ul className="space-y-3 sm:space-y-4 text-slate-400 text-xs sm:text-sm">
              <li className="flex items-start gap-2.5 sm:gap-3">
                <MapPin className="text-brand-gold shrink-0 mt-1" size={15} />
                <span className="leading-relaxed">Meerpur Kaurali, Palwal,<br/>Haryana, 121107</span>
              </li>
              <li className="flex items-start gap-2.5 sm:gap-3">
                <Phone className="text-brand-gold shrink-0 mt-1" size={15} />
                <span className="leading-relaxed">9813969669 • 9813304964 <br className="hidden sm:inline" /> 9671505096 • 9991817090</span>
              </li>
              <li className="flex items-center gap-2.5 sm:gap-3">
                <Mail className="text-brand-gold shrink-0" size={15} />
                <a href="mailto:adarshbaranwal05@gmail.com" className="hover:text-brand-gold transition-colors break-all">
                  adarshbaranwal05@gmail.com
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-serif font-bold text-base sm:text-lg mb-4 sm:mb-6">Find Us</h4>
            <div className="h-40 sm:h-48 w-full bg-slate-800 border border-white/10 relative filter grayscale hover:grayscale-0 transition-all duration-500 rounded-lg overflow-hidden">
               <iframe 
                title="School Location Map"
                src="https://maps.google.com/maps?q=Meerpur+Kaurali,+Palwal,+Haryana&t=&z=14&ie=UTF8&iwloc=&output=embed" 
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-6 sm:pt-8 border-t border-white/10 text-center md:flex md:justify-between md:text-left text-xs sm:text-sm text-slate-500 pb-16 md:pb-0">
          <p>&copy; {new Date().getFullYear()} Adarsh Vidya Mandir Senior Secondary School. All rights reserved.</p>
          <div className="mt-3 md:mt-0 flex flex-wrap items-center justify-center md:justify-end gap-4 sm:gap-6">
             <button
               onClick={() => setShowAdminPortal(true)}
               className="hover:text-brand-gold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
               title="Admin Management Portal"
             >
               <Shield size={13} className="text-brand-gold" />
               <span>Admin Portal (प्रबंधन लॉगिन)</span>
             </button>
             <a href="#home" className="hover:text-brand-gold transition-colors text-xs">Back to Top ↑</a>
          </div>
        </div>
      </footer>


      {/* Floating Theme Palette Customizer */}
      <ThemeSelector />

      {/* Floating Action Button (WhatsApp) */}
      <a 
        href="https://wa.me/919813969669" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-20 right-5 md:bottom-8 md:right-8 w-13 h-13 sm:w-14 sm:h-14 bg-green-500 text-white shadow-2xl flex items-center justify-center hover:bg-green-600 hover:-translate-y-1 transition-all duration-300 z-40 group border border-white/20 rounded-full"
        title="Chat on WhatsApp"
      >
        <MessageCircle size={28} />
      </a>

      {/* Mobile Quick Action Bottom Bar */}
      <MobileBottomNav 
        onOpenAdmission={() => { setAdmissionModalTab('apply'); setShowAdmissionModal(true); }} 
      />
      
    </div>
  );
}
