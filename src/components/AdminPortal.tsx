import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Shield, Lock, KeyRound, User, Mail, Plus, Trash2, Edit3, X, 
  CheckCircle2, AlertCircle, Phone, MessageCircle, Calendar, Trophy, 
  ImagePlus, Play, LogOut, Sparkles, RefreshCw, Eye, EyeOff, 
  Search, UserCheck, Camera, Check, ExternalLink, ArrowRight, UserPlus, Download, FileSpreadsheet
} from 'lucide-react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { defaultGalleryData, parseYouTubeVideoId } from './PhotoGallery';
import { compressImageFile } from '../lib/imageCompressor';
import { triggerAppNotification } from './NotificationToast';
import { storageCache } from '../lib/storageCache';

const MASTER_EMAIL = 'adarshbaranwal05@gmail.com';

export interface AdminAccount {
  id: string;
  username: string;
  fullName: string;
  email: string;
  password?: string;
  role: 'superadmin' | 'admin';
  createdAt: string;
}

// Built-in Seed Master Admin
const DEFAULT_MASTER_ADMIN: AdminAccount = {
  id: 'master-admin',
  username: 'admin',
  fullName: 'Adarsh Baranwal (Master Admin)',
  email: MASTER_EMAIL,
  password: 'admin',
  role: 'superadmin',
  createdAt: new Date().toISOString()
};

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'notices' | 'admissions' | 'media' | 'events' | 'achievers' | 'admins';
  autoTriggerGalleryPicker?: boolean;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isOpen,
  onClose,
  initialTab = 'notices',
  autoTriggerGalleryPicker = false
}) => {
  // Auth state
  const [currentUser, setCurrentUser] = useState<AdminAccount | null>(() => {
    try {
      const saved = localStorage.getItem('avm_logged_admin');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Auth Screen Mode: 'login' | 'register' | 'forgot'
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regOtp, setRegOtp] = useState('');
  const [generatedRegOtp, setGeneratedRegOtp] = useState('');
  const [isSendingRegOtp, setIsSendingRegOtp] = useState(false);
  const [regOtpSent, setRegOtpSent] = useState(false);
  const [regError, setRegError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Forgot password state
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [generatedForgotOtp, setGeneratedForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSendingForgotOtp, setIsSendingForgotOtp] = useState(false);
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Delete My Account state
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Active Management Tab
  const [activeTab, setActiveTab] = useState<'notices' | 'admissions' | 'media' | 'events' | 'achievers' | 'admins'>(initialTab);

  // Live Database Collections
  const [liveNotices, setLiveNotices] = useState<any[]>([]);
  const [admissionsList, setAdmissionsList] = useState<any[]>([]);
  const [achieversList, setAchieversList] = useState<any[]>([]);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [deletedMediaIds, setDeletedMediaIds] = useState<Set<string>>(new Set());
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [adminsList, setAdminsList] = useState<AdminAccount[]>([DEFAULT_MASTER_ADMIN]);

  // 1. Notice Management State
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<'Admissions' | 'Academics' | 'Sports' | 'Circular' | 'Events'>('Admissions');
  const [noticeDate, setNoticeDate] = useState('Session 2026-27');
  const [noticeDetails, setNoticeDetails] = useState('');
  const [noticeIsNew, setNoticeIsNew] = useState(true);
  const [editingNotice, setEditingNotice] = useState<any | null>(null);
  const [isSavingNotice, setIsSavingNotice] = useState(false);

  // 2. Photos & Videos Media State
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaCategory, setMediaCategory] = useState<'Campus' | 'Sports' | 'Toppers' | 'Celebrations'>('Campus');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaTabFilter, setMediaTabFilter] = useState<'all' | 'uploaded' | 'default'>('all');
  const [isSavingMedia, setIsSavingMedia] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // 3. Event Management State
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventVenue, setEventVenue] = useState('AVM Campus, Meerpur Kaurali');
  const [eventDesc, setEventDesc] = useState('');
  const [eventCategory, setEventCategory] = useState<'Academic' | 'Sports' | 'Cultural' | 'Celebration'>('Cultural');
  const [eventStatus, setEventStatus] = useState<'Upcoming' | 'Completed'>('Upcoming');
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [isSavingEvent, setIsSavingEvent] = useState(false);

  // 4. Achiever Management State
  const [achieverName, setAchieverName] = useState('');
  const [achieverTitle, setAchieverTitle] = useState('');
  const [achieverScore, setAchieverScore] = useState('');
  const [achieverCategory, setAchieverCategory] = useState<'Board Topper' | 'Sports' | 'Merit'>('Board Topper');
  const [achieverYear, setAchieverYear] = useState('2025-26');
  const [editingAchiever, setEditingAchiever] = useState<any | null>(null);
  const [isSavingAchiever, setIsSavingAchiever] = useState(false);

  // 5. Admission Management State
  const [editingAdmission, setEditingAdmission] = useState<any | null>(null);
  const [newAdmissionStudent, setNewAdmissionStudent] = useState('');
  const [newAdmissionParent, setNewAdmissionParent] = useState('');
  const [newAdmissionPhone, setNewAdmissionPhone] = useState('');
  const [newAdmissionClass, setNewAdmissionClass] = useState('Nursery');
  const [newAdmissionVillage, setNewAdmissionVillage] = useState('Meerpur Kaurali');
  const [showAddAdmissionModal, setShowAddAdmissionModal] = useState(false);
  const [isSavingAdmission, setIsSavingAdmission] = useState(false);

  // Sync initial tab when changed
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Subscribe to live Firestore collections (only when opened & authenticated to eliminate lag)
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    // 1. Notices
    const unsubNotices = onSnapshot(collection(db, 'notices'), (snapshot) => {
      setLiveNotices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.warn("Notices error:", err));

    // 2. Admissions
    const unsubAdmissions = onSnapshot(collection(db, 'admissions'), (snapshot) => {
      setAdmissionsList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.warn("Admissions error:", err));

    // 3. Media
    const unsubMedia = onSnapshot(collection(db, 'media'), (snapshot) => {
      setMediaList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.warn("Media error:", err));

    // 4. Deleted Media tracking
    const unsubDeletedMedia = onSnapshot(collection(db, 'deleted_media'), (snapshot) => {
      const set = new Set<string>();
      snapshot.docs.forEach(doc => {
        set.add(doc.id);
        const data = doc.data();
        if (data?.mediaId) set.add(data.mediaId);
      });
      setDeletedMediaIds(set);
    }, (err) => console.warn("Deleted media error:", err));

    // 5. Events
    const unsubEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
      setEventsList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.warn("Events error:", err));

    // 6. Achievers
    const unsubAchievers = onSnapshot(collection(db, 'achievers'), (snapshot) => {
      setAchieversList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.warn("Achievers error:", err));

    // 7. Registered Admins list
    const unsubAdmins = onSnapshot(collection(db, 'admins'), (snapshot) => {
      const dbAdmins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AdminAccount[];
      const combined = [
        DEFAULT_MASTER_ADMIN,
        ...dbAdmins.filter(a => a.username !== DEFAULT_MASTER_ADMIN.username)
      ];
      setAdminsList(combined);
    }, (err) => console.warn("Admins list error:", err));

    return () => {
      unsubNotices();
      unsubAdmissions();
      unsubMedia();
      unsubDeletedMedia();
      unsubEvents();
      unsubAchievers();
      unsubAdmins();
    };
  }, [isOpen, currentUser]);

  // Auto trigger photo picker if requested
  useEffect(() => {
    if (isOpen && autoTriggerGalleryPicker && currentUser && activeTab === 'media') {
      const timer = setTimeout(() => {
        photoInputRef.current?.click();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoTriggerGalleryPicker, currentUser, activeTab]);

  // Helper: Dispatch OTP to email with sender name "A.V.M. ADMIN REGISTRATION"
  const dispatchOtpEmail = async (otp: string, purpose: 'registration' | 'forgot_password', targetEmail: string) => {
    const senderTitle = "A.V.M. ADMIN REGISTRATION";
    const emailSubject = purpose === 'registration' 
      ? `A.V.M. ADMIN REGISTRATION - Security Verification OTP: ${otp}`
      : `A.V.M. ADMIN REGISTRATION - Password Reset OTP: ${otp}`;

    // 1. Direct FormSubmit delivery with sender name "A.V.M. ADMIN REGISTRATION"
    try {
      await fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          name: senderTitle,
          _from: senderTitle,
          _subject: emailSubject,
          email: targetEmail,
          Sender: senderTitle,
          Security_Verification_OTP: otp,
          Purpose: purpose === 'registration' ? "Admin Registration Verification" : "Admin Password Reset",
          Message: `Adarsh Vidya Mandir School Administration: Your 6-digit verification OTP is ${otp}. Valid for 10 minutes.`,
          _captcha: "false",
          _template: "table"
        })
      });
    } catch (e) {
      console.warn("FormSubmit notice:", e);
    }

    // 2. Web3Forms delivery with from_name "A.V.M. ADMIN REGISTRATION"
    try {
      const formData = new FormData();
      formData.append("access_key", "c8619600-3c2b-40e6-9f1c-3e2f73a7b9ed");
      formData.append("name", senderTitle);
      formData.append("from_name", senderTitle);
      formData.append("subject", emailSubject);
      formData.append("email", targetEmail);
      formData.append("to_email", targetEmail);
      formData.append("replyto", targetEmail);
      formData.append("Security_OTP", otp);
      formData.append("Purpose", purpose === 'registration' ? "Admin Registration" : "Password Reset");
      formData.append("Message", `Your A.V.M. Admin verification code is: ${otp}`);

      await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });
    } catch (e) {
      console.warn("Web3Forms notice:", e);
    }
  };

  // --- AUTHENTICATION HANDLERS ---

  // 1. Handle Username & Password Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    const userClean = loginUsername.trim().toLowerCase();
    const passClean = loginPassword.trim();

    try {
      // Find matching admin in live list or master admin
      const matched = adminsList.find(
        a => (a.username.toLowerCase() === userClean || a.email.toLowerCase() === userClean) &&
             (a.password === passClean)
      );

      if (matched) {
        setCurrentUser(matched);
        localStorage.setItem('avm_logged_admin', JSON.stringify(matched));
        triggerAppNotification(
          "Welcome Back!",
          `✅ एडमिन पोर्टल में आपका स्वागत है, ${matched.fullName}`,
          'success'
        );
      } else {
        setLoginError("अमान्य यूज़रनेम या पासवर्ड। कृपया पुनः प्रयास करें।");
      }
    } catch {
      setLoginError("लॉगिन करने में त्रुटि। कृपया पुनः प्रयास करें।");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 2. Handle Send Registration OTP
  const handleSendRegOtp = async () => {
    setRegError('');
    if (!regUsername.trim() || !regPassword.trim() || !regFullName.trim() || !regEmail.trim()) {
      setRegError("कृपया सभी फ़ील्ड (नाम, यूज़रनेम, ईमेल और पासवर्ड) भरें।");
      return;
    }

    if (adminsList.some(a => a.username.toLowerCase() === regUsername.trim().toLowerCase())) {
      setRegError("यह यूज़रनेम पहले से पंजीकृत है। कृपया कोई अन्य यूज़रनेम चुनें।");
      return;
    }

    setIsSendingRegOtp(true);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedRegOtp(otp);

    await dispatchOtpEmail(otp, 'registration', MASTER_EMAIL);

    // Save temporary OTP doc to Firestore
    try {
      await setDoc(doc(db, 'admin_otps', `reg-${regUsername.trim().toLowerCase()}`), {
        otp,
        email: MASTER_EMAIL,
        createdAt: new Date().toISOString()
      });
    } catch {}

    setIsSendingRegOtp(false);
    setRegOtpSent(true);
    triggerAppNotification(
      "OTP Sent to Email",
      `🔐 सत्यापन कोड (OTP) आपके ईमेल ${MASTER_EMAIL} पर भेज दिया गया है। कृपया अपना ईमेल चेक करें।`,
      'info'
    );
  };

  // 3. Handle Verify & Register Admin (0-Delay)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regOtpSent) {
      setRegError("कृपया पहले OTP भेजें।");
      return;
    }

    if (regOtp.trim() !== generatedRegOtp) {
      setRegError("गलत OTP दर्ज किया गया है। कृपया सही 6-अंकीय कोड डालें।");
      return;
    }

    setIsRegistering(true);
    const newAdminId = 'admin-' + Date.now();
    const newAdminData: AdminAccount = {
      id: newAdminId,
      username: regUsername.trim().toLowerCase(),
      fullName: regFullName.trim(),
      email: regEmail.trim(),
      password: regPassword.trim(),
      role: 'admin',
      createdAt: new Date().toISOString()
    };

    try {
      // 0-Delay instant local login
      setCurrentUser(newAdminData);
      localStorage.setItem('avm_logged_admin', JSON.stringify(newAdminData));
      setAdminsList(prev => [...prev, newAdminData]);

      // Cloud persistence
      await setDoc(doc(db, 'admins', newAdminId), newAdminData);

      triggerAppNotification(
        "Admin Account Created!",
        `🎉 नया एडमिन "${newAdminData.fullName}" सफलतापूर्वक पंजीकृत हो गया! (0 Delay)`,
        'success'
      );
      setAuthMode('login');
    } catch (err) {
      console.error(err);
      triggerAppNotification("Registration Notice", "खाता सक्रिय है।", 'info');
    } finally {
      setIsRegistering(false);
    }
  };

  // 4. Handle Send Forgot Password OTP
  const handleSendForgotOtp = async () => {
    setForgotError('');
    if (!forgotIdentifier.trim()) {
      setForgotError("कृपया अपना यूज़रनेम या ईमेल दर्ज करें।");
      return;
    }

    const matched = adminsList.find(
      a => a.username.toLowerCase() === forgotIdentifier.trim().toLowerCase() ||
           a.email.toLowerCase() === forgotIdentifier.trim().toLowerCase()
    );

    if (!matched) {
      setForgotError("इस यूज़रनेम या ईमेल से कोई एडमिन खाता नहीं मिला।");
      return;
    }

    setIsSendingForgotOtp(true);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedForgotOtp(otp);

    await dispatchOtpEmail(otp, 'forgot_password', MASTER_EMAIL);

    try {
      await setDoc(doc(db, 'admin_otps', `forgot-${matched.id}`), {
        otp,
        email: MASTER_EMAIL,
        createdAt: new Date().toISOString()
      });
    } catch {}

    setIsSendingForgotOtp(false);
    setForgotOtpSent(true);
    triggerAppNotification(
      "OTP Sent to Email",
      `🔑 पासवर्ड रीसेट कोड (OTP) आपके ईमेल ${MASTER_EMAIL} पर भेज दिया गया है। कृपया अपना ईमेल चेक करें।`,
      'info'
    );
  };

  // 5. Handle Verify & Reset Password
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    if (forgotOtp.trim() !== generatedForgotOtp) {
      setForgotError("गलत OTP कोड दर्ज किया गया है।");
      return;
    }

    if (!newPassword.trim() || newPassword.trim().length < 4) {
      setForgotError("कृपया कम से कम 4 अक्षरों का नया पासवर्ड दर्ज करें।");
      return;
    }

    const matched = adminsList.find(
      a => a.username.toLowerCase() === forgotIdentifier.trim().toLowerCase() ||
           a.email.toLowerCase() === forgotIdentifier.trim().toLowerCase()
    );

    if (!matched) return;

    try {
      matched.password = newPassword.trim();
      if (matched.id !== 'master-admin') {
        await updateDoc(doc(db, 'admins', matched.id), { password: newPassword.trim() });
      }
      setForgotSuccess(true);
      triggerAppNotification(
        "Password Updated Successfully",
        "✅ नया पासवर्ड सफलतापूर्वक सेट हो गया है। अब नए पासवर्ड से लॉगिन करें।",
        'success'
      );
      setTimeout(() => {
        setAuthMode('login');
        setForgotOtpSent(false);
        setForgotSuccess(false);
      }, 2000);
    } catch (err) {
      setForgotError("पासवर्ड अपडेट करने में समस्या: " + String(err));
    }
  };

  // 6. Handle Delete My Admin Account
  const handleDeleteMyAccount = async () => {
    if (!currentUser) return;
    setIsDeletingAccount(true);

    try {
      if (currentUser.id !== 'master-admin') {
        await deleteDoc(doc(db, 'admins', currentUser.id));
      }
      localStorage.removeItem('avm_logged_admin');
      setCurrentUser(null);
      setShowDeleteAccountModal(false);
      triggerAppNotification(
        "Admin Account Deleted",
        "आपका एडमिन खाता वेबसाइट से हटा दिया गया है।",
        'info'
      );
    } catch (err) {
      console.error(err);
      triggerAppNotification("Delete Error", String(err), 'error');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('avm_logged_admin');
    setCurrentUser(null);
    setAuthMode('login');
    triggerAppNotification("Logged Out", "आप एडमिन पोर्टल से सुरक्षित लॉग आउट हो गए हैं।", 'info');
  };

  // --- CONTENT CRUD HANDLERS WITH DUAL STORAGE PERSISTENCE ---

  // 1. Notice: Add or Edit
  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeDetails.trim()) return;

    setIsSavingNotice(true);
    const title = noticeTitle.trim();
    const details = noticeDetails.trim();
    const date = noticeDate.trim() || 'Session 2026-27';

    try {
      if (editingNotice) {
        // Edit Existing Notice
        const updatedNotice = {
          ...editingNotice,
          title,
          category: noticeCategory,
          date,
          details,
          isNew: noticeIsNew,
          updatedAt: new Date().toISOString()
        };
        storageCache.addNoticeItem(updatedNotice);
        window.dispatchEvent(new CustomEvent('avm_notice_instant_edit', { detail: updatedNotice }));

        await updateDoc(doc(db, 'notices', editingNotice.id), {
          title,
          category: noticeCategory,
          date,
          details,
          isNew: noticeIsNew,
          updatedAt: new Date().toISOString()
        });
        triggerAppNotification(
          "Notice Updated Successfully",
          `✅ नोटिस "${title.slice(0, 30)}..." अपडेट हो गया!`,
          'success'
        );
        setEditingNotice(null);
      } else {
        // Create New Notice (0 delay optimistic + cache)
        const tempId = 'notice-' + Date.now();
        const newNotice = {
          id: tempId,
          title,
          category: noticeCategory,
          date,
          details,
          isNew: noticeIsNew,
          downloadable: false,
          createdAt: new Date().toISOString()
        };
        storageCache.addNoticeItem(newNotice);
        window.dispatchEvent(new CustomEvent('avm_notice_instant_add', { detail: newNotice }));

        const docRef = await addDoc(collection(db, 'notices'), {
          title,
          category: noticeCategory,
          date,
          details,
          isNew: noticeIsNew,
          downloadable: false,
          createdAt: new Date().toISOString()
        });
        newNotice.id = docRef.id;
        storageCache.addNoticeItem(newNotice);

        triggerAppNotification(
          "Notice Published Successfully",
          `✅ नया नोटिस "${title.slice(0, 30)}..." वेबसाइट पर लाइव जारी हो गया!`,
          'success'
        );
      }

      setNoticeTitle('');
      setNoticeDetails('');
      setNoticeIsNew(true);
    } catch (err) {
      console.error(err);
      triggerAppNotification("Notice Error", String(err), 'error');
    } finally {
      setIsSavingNotice(false);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    storageCache.addDeletedNoticeId(id);
    storageCache.removeNoticeItem(id);
    window.dispatchEvent(new CustomEvent('avm_notice_instant_delete', { detail: id }));

    try {
      if (id.startsWith('n')) {
        // Default notice: persist tombstone in deleted_notices
        await setDoc(doc(db, 'deleted_notices', id), {
          noticeId: id,
          deletedAt: new Date().toISOString()
        });
      } else {
        // Live custom notice
        await deleteDoc(doc(db, 'notices', id));
      }
      triggerAppNotification("Notice Deleted", "नोटिस वेबसाइट से हटा दिया गया।", 'info');
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Photos & Videos: Upload & Delete
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const { dataUrl } = await compressImageFile(file, 1000, 1000, 0.72);
          const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
          const tempId = 'photo-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);

          const newMediaItem = {
            id: tempId,
            img: dataUrl,
            title: cleanName,
            category: mediaCategory,
            type: 'photo' as const
          };

          // 1. Immediately cache in local storage so refresh never loses the photo
          storageCache.addMediaItem(newMediaItem);

          // 2. Optimistic local dispatch
          window.dispatchEvent(new CustomEvent('avm_media_instant_add', {
            detail: [newMediaItem]
          }));

          // 3. Firestore persist
          try {
            const docRef = await addDoc(collection(db, 'media'), {
              title: cleanName,
              type: 'photo',
              mediaUrl: dataUrl,
              category: mediaCategory,
              createdAt: new Date().toISOString()
            });
            newMediaItem.id = docRef.id;
            storageCache.addMediaItem(newMediaItem);
          } catch (fireErr) {
            console.warn("Firestore save notice:", fireErr);
          }
        }
      }
      triggerAppNotification(
        "Photos Uploaded Live!",
        `📸 ${files.length} फ़ोटो वेबसाइट गैलरी में तुरंत जोड़ दी गई हैं!`,
        'success'
      );
    } catch (err) {
      triggerAppNotification("Upload Error", String(err), 'error');
    } finally {
      setIsCompressing(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleAddVideoLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl.trim()) return;

    setIsSavingMedia(true);
    const title = mediaTitle.trim() || 'School Video Highlight';
    const ytId = parseYouTubeVideoId(mediaUrl.trim());
    const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '/background.png.jpeg';
    const tempId = 'video-' + Date.now();

    const newVideoItem = {
      id: tempId,
      img: thumb,
      title,
      category: mediaCategory,
      type: 'video' as const,
      videoUrl: mediaUrl.trim()
    };

    storageCache.addMediaItem(newVideoItem);
    window.dispatchEvent(new CustomEvent('avm_media_instant_add', {
      detail: [newVideoItem]
    }));

    try {
      const docRef = await addDoc(collection(db, 'media'), {
        title,
        type: 'video',
        mediaUrl: mediaUrl.trim(),
        category: mediaCategory,
        createdAt: new Date().toISOString()
      });
      newVideoItem.id = docRef.id;
      storageCache.addMediaItem(newVideoItem);
      triggerAppNotification("Video Added", "✅ YouTube वीडियो वेबसाइट गैलरी में जुड़ गया!", 'success');
      setMediaTitle('');
      setMediaUrl('');
    } catch (err) {
      triggerAppNotification("Error", String(err), 'error');
    } finally {
      setIsSavingMedia(false);
    }
  };

  // Delete ANY photo (both uploaded AND pre-loaded default photos)
  const handleDeleteMediaItem = async (item: { id: string; isDefault?: boolean; title?: string }) => {
    // 0-Delay optimistic delete & cache update
    storageCache.addDeletedMediaId(item.id);
    storageCache.removeMediaItem(item.id);
    window.dispatchEvent(new CustomEvent('avm_media_instant_delete', { detail: item.id }));
    setDeletedMediaIds(prev => new Set(prev).add(item.id));

    try {
      if (item.isDefault) {
        // Save tombstone in deleted_media collection
        await setDoc(doc(db, 'deleted_media', item.id), {
          mediaId: item.id,
          title: item.title || 'Default Photo',
          deletedAt: new Date().toISOString()
        });
      } else {
        // Delete uploaded item from media collection
        await deleteDoc(doc(db, 'media', item.id));
      }
      triggerAppNotification(
        "Photo Deleted Successfully",
        `🗑️ फ़ोटो "${item.title || 'तस्वीर'}" वेबसाइट से हटा दी गई है।`,
        'info'
      );
    } catch (err) {
      console.error(err);
      triggerAppNotification("Delete Error", String(err), 'error');
    }
  };

  // Restore deleted default photo
  const handleRestoreDefaultMedia = async (id: string) => {
    storageCache.removeDeletedMediaId(id);
    try {
      await deleteDoc(doc(db, 'deleted_media', id));
      setDeletedMediaIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      triggerAppNotification("Photo Restored", "फ़ोटो वापस गैलरी में जोड़ दी गई है।", 'success');
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Event: Add or Edit
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDate.trim() || !eventDesc.trim()) return;

    setIsSavingEvent(true);
    const title = eventTitle.trim();
    const date = eventDate.trim();
    const venue = eventVenue.trim() || 'AVM Campus, Meerpur Kaurali';
    const description = eventDesc.trim();

    try {
      if (editingEvent) {
        const updated = {
          ...editingEvent,
          title,
          date,
          venue,
          description,
          category: eventCategory,
          status: eventStatus,
          updatedAt: new Date().toISOString()
        };
        storageCache.addEventItem(updated);
        await updateDoc(doc(db, 'events', editingEvent.id), {
          title,
          date,
          venue,
          description,
          category: eventCategory,
          status: eventStatus,
          updatedAt: new Date().toISOString()
        });
        triggerAppNotification("Event Updated", `✅ इवेंट "${title}" अपडेट हो गया!`, 'success');
        setEditingEvent(null);
      } else {
        const tempId = 'evt-' + Date.now();
        const newEvt = {
          id: tempId,
          title,
          date,
          venue,
          description,
          category: eventCategory,
          status: eventStatus,
          createdAt: new Date().toISOString()
        };
        storageCache.addEventItem(newEvt);
        window.dispatchEvent(new CustomEvent('avm_event_instant_add', { detail: newEvt }));

        const docRef = await addDoc(collection(db, 'events'), {
          title,
          date,
          venue,
          description,
          category: eventCategory,
          status: eventStatus,
          createdAt: new Date().toISOString()
        });
        newEvt.id = docRef.id;
        storageCache.addEventItem(newEvt);
        triggerAppNotification("Event Added", `✅ नया इवेंट "${title}" जारी हो गया!`, 'success');
      }

      setEventTitle('');
      setEventDate('');
      setEventDesc('');
    } catch (err) {
      triggerAppNotification("Event Error", String(err), 'error');
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    storageCache.addDeletedEventId(id);
    storageCache.removeEventItem(id);
    window.dispatchEvent(new CustomEvent('avm_event_instant_delete', { detail: id }));

    try {
      if (id.startsWith('e')) {
        // Default event: save tombstone to deleted_events
        await setDoc(doc(db, 'deleted_events', id), {
          eventId: id,
          deletedAt: new Date().toISOString()
        });
      } else {
        await deleteDoc(doc(db, 'events', id));
      }
      triggerAppNotification("Event Removed", "इवेंट वेबसाइट से हटा दिया गया।", 'info');
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Achiever: Add or Edit
  const handleSaveAchiever = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!achieverName.trim() || !achieverTitle.trim()) return;

    setIsSavingAchiever(true);
    const name = achieverName.trim();
    const title = achieverTitle.trim();
    const scoreOrAward = achieverScore.trim() || 'Top Ranker';
    const year = achieverYear.trim() || '2025-26';

    try {
      if (editingAchiever) {
        const updated = {
          ...editingAchiever,
          name,
          title,
          scoreOrAward,
          category: achieverCategory,
          year,
          updatedAt: new Date().toISOString()
        };
        storageCache.addAchieverItem(updated);
        await updateDoc(doc(db, 'achievers', editingAchiever.id), {
          name,
          title,
          scoreOrAward,
          category: achieverCategory,
          year,
          updatedAt: new Date().toISOString()
        });
        triggerAppNotification("Achiever Updated", `✅ टॉपर "${name}" की जानकारी अपडेट हो गई!`, 'success');
        setEditingAchiever(null);
      } else {
        const tempId = 'ach-' + Date.now();
        const newAch = {
          id: tempId,
          name,
          title,
          scoreOrAward,
          category: achieverCategory,
          year,
          createdAt: new Date().toISOString()
        };
        storageCache.addAchieverItem(newAch);
        window.dispatchEvent(new CustomEvent('avm_achiever_instant_add', { detail: newAch }));

        const docRef = await addDoc(collection(db, 'achievers'), {
          name,
          title,
          scoreOrAward,
          category: achieverCategory,
          year,
          createdAt: new Date().toISOString()
        });
        newAch.id = docRef.id;
        storageCache.addAchieverItem(newAch);
        triggerAppNotification("Achiever Added", `✅ टॉपर / अचीवर "${name}" जुड़ गया!`, 'success');
      }

      setAchieverName('');
      setAchieverTitle('');
      setAchieverScore('');
    } catch (err) {
      triggerAppNotification("Error", String(err), 'error');
    } finally {
      setIsSavingAchiever(false);
    }
  };

  const handleDeleteAchiever = async (id: string) => {
    storageCache.removeAchieverItem(id);
    window.dispatchEvent(new CustomEvent('avm_achiever_instant_delete', { detail: id }));

    try {
      await deleteDoc(doc(db, 'achievers', id));
      triggerAppNotification("Achiever Removed", "अचीवर की प्रविष्टि हटा दी गई।", 'info');
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Admissions: Edit status / Delete / Add
  const handleSaveAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmissionStudent.trim() || !newAdmissionPhone.trim()) return;

    setIsSavingAdmission(true);
    try {
      if (editingAdmission) {
        await updateDoc(doc(db, 'admissions', editingAdmission.id), {
          studentName: newAdmissionStudent.trim(),
          parentName: newAdmissionParent.trim(),
          phone: newAdmissionPhone.trim(),
          classGrade: newAdmissionClass,
          village: newAdmissionVillage.trim(),
          status: editingAdmission.status || 'New',
          updatedAt: new Date().toISOString()
        });
        triggerAppNotification("Admission Updated", `✅ छात्र "${newAdmissionStudent}" की जानकारी अपडेट हो गई!`, 'success');
        setEditingAdmission(null);
      } else {
        await addDoc(collection(db, 'admissions'), {
          studentName: newAdmissionStudent.trim(),
          parentName: newAdmissionParent.trim(),
          phone: newAdmissionPhone.trim(),
          classGrade: newAdmissionClass,
          village: newAdmissionVillage.trim(),
          status: 'New',
          createdAt: new Date().toISOString()
        });
        triggerAppNotification("Admission Added", `✅ नया एडमिशन रिकॉर्ड जुड़ गया!`, 'success');
      }

      setNewAdmissionStudent('');
      setNewAdmissionParent('');
      setNewAdmissionPhone('');
      setShowAddAdmissionModal(false);
    } catch (err) {
      triggerAppNotification("Error", String(err), 'error');
    } finally {
      setIsSavingAdmission(false);
    }
  };

  const handleUpdateAdmissionStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'admissions', id), { status: newStatus });
      triggerAppNotification("Status Updated", `एडमिशन स्थिति "${newStatus}" कर दी गई।`, 'success');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAdmission = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'admissions', id));
      triggerAppNotification("Admission Deleted", "रिकॉर्ड हटा दिया गया।", 'info');
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportAdmissionsCSV = () => {
    if (admissionsList.length === 0) {
      triggerAppNotification("Export Notice", "डाउनलोड करने के लिए कोई एडमिशन रिकॉर्ड नहीं है।", 'info');
      return;
    }
    const headers = ["Student Name", "Parent Name", "Phone", "Class", "Stream", "Village", "Status", "Date"];
    const rows = admissionsList.map(a => [
      `"${(a.studentName || '').replace(/"/g, '""')}"`,
      `"${(a.parentName || '').replace(/"/g, '""')}"`,
      `"${(a.phone || '').replace(/"/g, '""')}"`,
      `"${(a.classGrade || '').replace(/"/g, '""')}"`,
      `"${(a.stream || '').replace(/"/g, '""')}"`,
      `"${(a.village || '').replace(/"/g, '""')}"`,
      `"${(a.status || 'New').replace(/"/g, '""')}"`,
      `"${a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AVM_School_Admissions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerAppNotification("Export Complete", "📥 एडमिशन रिकॉर्ड Excel/CSV फ़ाइल में सफलतापूर्वक डाउनलोड हो गया!", 'success');
  };

  // Memoized Combined Media list with Default photos to prevent re-rendering lag
  const combinedMediaList = useMemo(() => {
    const uploaded = mediaList.map(m => ({ ...m, isDefault: false }));
    const defaults = defaultGalleryData.map(d => ({
      id: d.id,
      title: d.title,
      type: d.type || 'photo',
      mediaUrl: d.img,
      category: d.category,
      isDefault: true
    }));

    if (mediaTabFilter === 'uploaded') return uploaded;
    if (mediaTabFilter === 'default') return defaults;
    return [...uploaded, ...defaults];
  }, [mediaList, mediaTabFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-0 sm:p-4 bg-brand-navy/90 backdrop-blur-md">
      <div 
        className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[92vh] sm:max-w-5xl bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-brand-navy text-white px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between border-b border-brand-gold/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-brand-gold text-brand-navy flex items-center justify-center font-bold shadow-md shrink-0">
              <Shield size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs text-brand-gold font-bold uppercase tracking-widest">
                  AVM Control Center
                </span>
                {currentUser && (
                  <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase">
                    Live Session
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-xl font-serif font-bold text-white flex items-center gap-2">
                School Admin & Management Portal
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser && (
              <div className="flex items-center gap-1.5">
                <div className="hidden md:flex flex-col text-right mr-1">
                  <span className="text-xs font-semibold text-white leading-tight">{currentUser.fullName}</span>
                  <span className="text-[10px] text-brand-gold uppercase">@{currentUser.username}</span>
                </div>
                <button
                  onClick={() => setShowDeleteAccountModal(true)}
                  className="text-xs text-red-300 hover:text-red-100 bg-red-900/30 hover:bg-red-900/60 border border-red-500/30 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  title="Delete My Admin Account"
                >
                  <span className="hidden sm:inline">Delete ID</span>
                  <Trash2 size={13} className="sm:hidden" />
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-xs text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  title="Log out"
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Close Portal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* --- UN-AUTHENTICATED: LOGIN / REGISTER / FORGOT PASSWORD SCREEN --- */}
        {!currentUser ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center bg-slate-50">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-8">
              
              {/* Tab selector for Login vs Register */}
              <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setLoginError(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    authMode === 'login' ? 'bg-white text-brand-navy shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Admin Login (लॉगिन)
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setRegError(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    authMode === 'register' ? 'bg-white text-brand-navy shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  New Admin Register (नया एडमिन)
                </button>
              </div>

              {/* 1. LOGIN FORM */}
              {authMode === 'login' && (
                <div>
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-xl bg-brand-navy text-brand-gold flex items-center justify-center mx-auto mb-2 shadow-sm">
                      <Lock size={22} />
                    </div>
                    <h4 className="text-xl font-serif font-bold text-brand-navy">
                      Administrator Login
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      यूज़रनेम और पासवर्ड दर्ज करके एडमिन पोर्टल खोलें।
                    </p>
                  </div>

                  {loginError && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Username or Email *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={loginUsername}
                          onChange={(e) => setLoginUsername(e.target.value)}
                          placeholder="e.g. admin or adarshbaranwal05@gmail.com"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold bg-white"
                        />
                        <User size={16} className="absolute left-3 top-3 text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Password *
                        </label>
                        <button
                          type="button"
                          onClick={() => { setAuthMode('forgot'); setForgotError(''); }}
                          className="text-xs text-brand-gold hover:underline font-semibold cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold bg-white"
                        />
                        <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full bg-brand-navy hover:bg-slate-800 text-brand-gold font-bold py-3 rounded-xl transition-all shadow-md text-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isLoggingIn ? <RefreshCw size={16} className="animate-spin" /> : <Lock size={16} />}
                      <span>Login to Admin Portal</span>
                    </button>
                  </form>

                  <div className="mt-5 text-center text-xs text-slate-500">
                    Master Admin Email: <span className="font-semibold text-slate-700">{MASTER_EMAIL}</span>
                  </div>
                </div>
              )}

              {/* 2. REGISTER NEW ADMIN (OTP PROTECTED) */}
              {authMode === 'register' && (
                <div>
                  <div className="text-center mb-5">
                    <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center mx-auto mb-2 shadow-sm">
                      <UserPlus size={22} />
                    </div>
                    <h4 className="text-xl font-serif font-bold text-brand-navy">
                      Register School Administrator
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      सुरक्षा के लिए मास्टर ईमेल ({MASTER_EMAIL}) पर OTP सत्यापन आवश्यक है।
                    </p>
                  </div>

                  {regError && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{regError}</span>
                    </div>
                  )}

                  <form onSubmit={handleRegisterSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Full Name (पूरा नाम) *
                      </label>
                      <input
                        type="text"
                        required
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="e.g. Teacher / Coordinator Name"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Desired Username (यूज़रनेम) *
                      </label>
                      <input
                        type="text"
                        required
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="e.g. teacher_avm or sharma_admin"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Admin Email (ईमेल) *
                      </label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="e.g. yourname@gmail.com"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Set Password (पासवर्ड) *
                      </label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Choose a secure password"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold bg-white"
                      />
                    </div>

                    {/* Step 2: OTP Trigger & Verification */}
                    <div className="pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[11px] font-bold text-slate-700 uppercase">
                          OTP Verification ({MASTER_EMAIL})
                        </span>
                        {!regOtpSent ? (
                          <button
                            type="button"
                            onClick={handleSendRegOtp}
                            disabled={isSendingRegOtp}
                            className="bg-brand-gold text-brand-navy text-[11px] font-bold px-3 py-1 rounded-md hover:bg-yellow-500 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isSendingRegOtp ? 'Sending...' : 'Send OTP'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendRegOtp}
                            className="text-[11px] text-brand-gold hover:underline font-semibold cursor-pointer"
                          >
                            Resend OTP
                          </button>
                        )}
                      </div>

                      {regOtpSent && (
                        <div>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            value={regOtp}
                            onChange={(e) => setRegOtp(e.target.value)}
                            placeholder="Enter 6-digit OTP received"
                            className="w-full px-3 py-2 text-center font-mono tracking-widest text-base rounded-lg border border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold bg-amber-50/50"
                          />
                          <p className="text-[10px] text-green-700 mt-1">
                            ✅ OTP sent to {MASTER_EMAIL}. Please check your inbox or notification.
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isRegistering || !regOtpSent}
                      className="w-full bg-brand-navy hover:bg-slate-800 text-brand-gold font-bold py-2.5 rounded-xl transition-all shadow-md text-sm cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                    >
                      {isRegistering ? <RefreshCw size={16} className="animate-spin" /> : <UserCheck size={16} />}
                      <span>Complete Registration (0 Delay)</span>
                    </button>
                  </form>
                </div>
              )}

              {/* 3. FORGOT PASSWORD (OTP RESET) */}
              {authMode === 'forgot' && (
                <div>
                  <div className="text-center mb-5">
                    <div className="w-12 h-12 rounded-xl bg-brand-navy text-brand-gold flex items-center justify-center mx-auto mb-2 shadow-sm">
                      <KeyRound size={22} />
                    </div>
                    <h4 className="text-xl font-serif font-bold text-brand-navy">
                      Reset Password (पासवर्ड रीसेट)
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {MASTER_EMAIL} पर OTP भेजकर तुरंत नया पासवर्ड सेट करें।
                    </p>
                  </div>

                  {forgotError && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{forgotError}</span>
                    </div>
                  )}

                  {forgotSuccess && (
                    <div className="mb-4 bg-green-50 border border-green-200 text-green-800 text-xs p-3 rounded-xl flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-green-600" />
                      <span>पासवर्ड सफलतापूर्वक अपडेट हो गया! लॉगिन पर ले जाया जा रहा है...</span>
                    </div>
                  )}

                  <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Registered Username or Email *
                      </label>
                      <input
                        type="text"
                        required
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        placeholder="e.g. admin or adarshbaranwal05@gmail.com"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold bg-white"
                      />
                    </div>

                    {!forgotOtpSent ? (
                      <button
                        type="button"
                        onClick={handleSendForgotOtp}
                        disabled={isSendingForgotOtp}
                        className="w-full bg-brand-gold text-brand-navy font-bold py-2.5 rounded-lg text-xs hover:bg-yellow-500 transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSendingForgotOtp ? <RefreshCw size={14} className="animate-spin" /> : <Mail size={14} />}
                        <span>Send OTP to {MASTER_EMAIL}</span>
                      </button>
                    ) : (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Enter 6-Digit OTP *
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            value={forgotOtp}
                            onChange={(e) => setForgotOtp(e.target.value)}
                            placeholder="Enter 6-digit OTP"
                            className="w-full px-3 py-2 text-center font-mono tracking-widest text-base rounded-lg border border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold bg-amber-50/50"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            New Password *
                          </label>
                          <input
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold bg-white"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-brand-navy text-brand-gold font-bold py-2.5 rounded-xl text-sm hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Check size={16} /> Update Password
                        </button>
                      </>
                    )}

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => setAuthMode('login')}
                        className="text-xs text-slate-600 hover:text-brand-navy font-semibold cursor-pointer underline"
                      >
                        Back to Login
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* --- AUTHENTICATED ADMIN DASHBOARD --- */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Scrollable Navigation Tabs (Mobile Optimized) */}
            <div className="bg-slate-100 p-2 sm:px-6 flex gap-1.5 sm:gap-2 border-b border-slate-200 overflow-x-auto shrink-0 scrollbar-none">
              <button
                onClick={() => setActiveTab('notices')}
                className={`py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'notices' ? 'bg-brand-navy text-brand-gold shadow' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>📢 Notices ({liveNotices.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('media')}
                className={`py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'media' ? 'bg-brand-navy text-brand-gold shadow' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ImagePlus size={15} />
                <span>Photos & Videos ({combinedMediaList.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('events')}
                className={`py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'events' ? 'bg-brand-navy text-brand-gold shadow' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Calendar size={15} />
                <span>Events ({eventsList.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('admissions')}
                className={`py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'admissions' ? 'bg-brand-navy text-brand-gold shadow' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <User size={15} />
                <span>Admissions ({admissionsList.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('achievers')}
                className={`py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'achievers' ? 'bg-brand-navy text-brand-gold shadow' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Trophy size={15} />
                <span>Achievers ({achieversList.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('admins')}
                className={`py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'admins' ? 'bg-brand-navy text-brand-gold shadow' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <UserCheck size={15} />
                <span>Admin Users ({adminsList.length})</span>
              </button>
            </div>

            {/* TAB CONTENT CONTAINER */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6">
              
              {/* --- 1. NOTICES MANAGEMENT --- */}
              {activeTab === 'notices' && (
                <div className="space-y-6">
                  {/* Notice Form (Add or Edit) */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-serif font-bold text-brand-navy text-base sm:text-lg flex items-center gap-2">
                        {editingNotice ? <Edit3 size={18} className="text-brand-gold" /> : <Plus size={18} className="text-brand-gold" />}
                        <span>{editingNotice ? 'Edit Circular / Notice (नोटिस एडिट करें)' : 'Publish New Notice (नया नोटिस जारी करें)'}</span>
                      </h4>
                      {editingNotice && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNotice(null);
                            setNoticeTitle('');
                            setNoticeDetails('');
                          }}
                          className="text-xs text-red-600 hover:underline font-bold"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>

                    <form onSubmit={handleSaveNotice} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Notice Headline *
                        </label>
                        <input
                          type="text"
                          required
                          value={noticeTitle}
                          onChange={(e) => setNoticeTitle(e.target.value)}
                          placeholder="e.g. Winter Break Schedule / Board Admit Cards Ready"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Category *
                          </label>
                          <select
                            value={noticeCategory}
                            onChange={(e) => setNoticeCategory(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold bg-white"
                          >
                            <option value="Admissions">Admissions</option>
                            <option value="Academics">Academics</option>
                            <option value="Sports">Sports</option>
                            <option value="Circular">Circular</option>
                            <option value="Events">Events</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Date / Session Tag
                          </label>
                          <input
                            type="text"
                            value={noticeDate}
                            onChange={(e) => setNoticeDate(e.target.value)}
                            placeholder="e.g. Session 2026-27"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold bg-white"
                          />
                        </div>

                        <div className="flex items-end">
                          <label className="flex items-center gap-2 p-2 bg-white border border-slate-300 rounded-lg cursor-pointer w-full">
                            <input
                              type="checkbox"
                              checked={noticeIsNew}
                              onChange={(e) => setNoticeIsNew(e.target.checked)}
                              className="rounded text-brand-gold focus:ring-brand-gold"
                            />
                            <span className="text-xs font-bold text-red-600">Show "NEW" Badge</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Full Notice Details / Circular Content *
                        </label>
                        <textarea
                          required
                          rows={3}
                          value={noticeDetails}
                          onChange={(e) => setNoticeDetails(e.target.value)}
                          placeholder="Full guidelines, timings, instructions for students and parents..."
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold bg-white resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingNotice}
                        className="bg-brand-navy hover:bg-slate-800 text-brand-gold font-bold py-2.5 px-6 rounded-xl transition-colors flex items-center gap-2 text-xs sm:text-sm shadow cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles size={15} />
                        <span>{isSavingNotice ? 'Saving...' : editingNotice ? 'Update Notice' : 'Publish Notice Live'}</span>
                      </button>
                    </form>
                  </div>

                  {/* Active Notices List */}
                  <div>
                    <h5 className="font-bold text-brand-navy text-sm mb-3">
                      Published Notices on Website ({liveNotices.length})
                    </h5>
                    <div className="space-y-2.5">
                      {liveNotices.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No custom notices published yet.</p>
                      ) : (
                        liveNotices.map((n) => (
                          <div key={n.id} className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-3 shadow-xs">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-brand-navy/10 text-brand-navy">
                                  {n.category}
                                </span>
                                {n.isNew && <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-red-600 text-white">NEW</span>}
                                <span className="text-xs text-slate-400">{n.date}</span>
                              </div>
                              <h6 className="font-bold text-brand-navy text-sm">{n.title}</h6>
                              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.details}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingNotice(n);
                                  setNoticeTitle(n.title);
                                  setNoticeCategory(n.category || 'Admissions');
                                  setNoticeDate(n.date || '');
                                  setNoticeDetails(n.details || '');
                                  setNoticeIsNew(Boolean(n.isNew));
                                }}
                                className="p-2 text-brand-navy hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                title="Edit Notice"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteNotice(n.id)}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                                title="Delete Notice"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* --- 2. PHOTOS & VIDEOS (MEDIA) MANAGEMENT --- */}
              {activeTab === 'media' && (
                <div className="space-y-6">
                  {/* Upload Actions Tray */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                    <h4 className="font-serif font-bold text-brand-navy text-base sm:text-lg mb-2 flex items-center gap-2">
                      <Camera size={20} className="text-brand-gold" />
                      <span>Upload Photos & Videos (गैलरी अपलोड)</span>
                    </h4>
                    <p className="text-xs text-slate-500 mb-4">
                      फ़ोन से फ़ोटो चुनें या YouTube वीडियो लिंक जोड़ें। केवल एडमिन ही फ़ोटो जोड़ या हटा सकते हैं।
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <input
                        type="file"
                        ref={photoInputRef}
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        disabled={isCompressing}
                        className="p-3 rounded-xl border-2 border-brand-gold bg-amber-50 hover:bg-amber-100/80 text-brand-navy font-bold flex items-center gap-3 transition-all cursor-pointer shadow-xs text-left"
                      >
                        <div className="w-10 h-10 rounded-lg bg-brand-gold text-brand-navy flex items-center justify-center shrink-0 shadow-sm">
                          {isCompressing ? <RefreshCw size={20} className="animate-spin" /> : <Camera size={20} />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-brand-navy">
                            {isCompressing ? 'Compressing & Uploading...' : '📸 Open Phone Gallery (फ़ोटो चुनें)'}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            1 या एक साथ कई फ़ोटो अपलोड करें
                          </div>
                        </div>
                      </button>

                      <form onSubmit={handleAddVideoLink} className="flex gap-2">
                        <input
                          type="url"
                          required
                          value={mediaUrl}
                          onChange={(e) => setMediaUrl(e.target.value)}
                          placeholder="Paste YouTube Video URL"
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-gold bg-white"
                        />
                        <button
                          type="submit"
                          disabled={isSavingMedia}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Play size={14} /> Add Video
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Filter & Media Grid */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <h5 className="font-bold text-brand-navy text-sm">
                        All Gallery Media ({combinedMediaList.length}) — Click Delete to remove any photo from website
                      </h5>
                      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg text-xs self-start">
                        <button
                          onClick={() => setMediaTabFilter('all')}
                          className={`px-2.5 py-1 rounded font-medium cursor-pointer ${mediaTabFilter === 'all' ? 'bg-white shadow-xs text-brand-navy font-bold' : 'text-slate-600'}`}
                        >
                          All ({combinedMediaList.length})
                        </button>
                        <button
                          onClick={() => setMediaTabFilter('uploaded')}
                          className={`px-2.5 py-1 rounded font-medium cursor-pointer ${mediaTabFilter === 'uploaded' ? 'bg-white shadow-xs text-brand-navy font-bold' : 'text-slate-600'}`}
                        >
                          Uploaded ({mediaList.length})
                        </button>
                        <button
                          onClick={() => setMediaTabFilter('default')}
                          className={`px-2.5 py-1 rounded font-medium cursor-pointer ${mediaTabFilter === 'default' ? 'bg-white shadow-xs text-brand-navy font-bold' : 'text-slate-600'}`}
                        >
                          Default Pre-loaded ({defaultGalleryData.length})
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {combinedMediaList.map((item) => {
                        const isDeleted = deletedMediaIds.has(item.id);
                        return (
                          <div 
                            key={item.id} 
                            className={`relative rounded-xl border overflow-hidden bg-white shadow-xs flex flex-col ${
                              isDeleted ? 'opacity-40 border-red-300' : 'border-slate-200'
                            }`}
                          >
                            <div className="aspect-square bg-slate-100 relative overflow-hidden">
                              <img
                                src={item.mediaUrl}
                                alt={item.title}
                                loading="lazy"
                                className="w-full h-full object-cover"
                              />
                              {item.type === 'video' && (
                                <span className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <Play size={9} /> Video
                                </span>
                              )}
                              {item.isDefault && (
                                <span className="absolute top-1.5 right-1.5 bg-slate-900/80 text-brand-gold text-[9px] font-bold px-1.5 py-0.5 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="p-2 flex-1 flex flex-col justify-between">
                              <div className="text-[11px] font-semibold text-slate-800 truncate mb-1.5">
                                {item.title || 'Photo'}
                              </div>
                              {isDeleted ? (
                                <button
                                  type="button"
                                  onClick={() => handleRestoreDefaultMedia(item.id)}
                                  className="w-full py-1 bg-green-100 hover:bg-green-200 text-green-800 text-[10px] font-bold rounded flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <RefreshCw size={11} /> Restore Photo
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMediaItem(item)}
                                  className="w-full py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold rounded flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Trash2 size={11} /> Delete Photo
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* --- 3. EVENTS MANAGEMENT --- */}
              {activeTab === 'events' && (
                <div className="space-y-6">
                  {/* Event Form (Add or Edit) */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-serif font-bold text-brand-navy text-base sm:text-lg flex items-center gap-2">
                        {editingEvent ? <Edit3 size={18} className="text-brand-gold" /> : <Plus size={18} className="text-brand-gold" />}
                        <span>{editingEvent ? 'Edit Event (कार्यक्रम संपादित करें)' : 'Add New Event (नया स्कूल कार्यक्रम)'}</span>
                      </h4>
                      {editingEvent && (
                        <button
                          type="button"
                          onClick={() => { setEditingEvent(null); setEventTitle(''); setEventDesc(''); }}
                          className="text-xs text-red-600 hover:underline font-bold"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>

                    <form onSubmit={handleSaveEvent} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Event Title *
                          </label>
                          <input
                            type="text"
                            required
                            value={eventTitle}
                            onChange={(e) => setEventTitle(e.target.value)}
                            placeholder="e.g. Science Exhibition 2026 / Annual Sports Meet"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Date / Timing *
                          </label>
                          <input
                            type="text"
                            required
                            value={eventDate}
                            onChange={(e) => setEventDate(e.target.value)}
                            placeholder="e.g. 24th November, 9:00 AM"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Venue (स्थान)
                          </label>
                          <input
                            type="text"
                            value={eventVenue}
                            onChange={(e) => setEventVenue(e.target.value)}
                            placeholder="AVM Campus, Meerpur Kaurali"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Category
                          </label>
                          <select
                            value={eventCategory}
                            onChange={(e) => setEventCategory(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold bg-white"
                          >
                            <option value="Academic">Academic</option>
                            <option value="Sports">Sports</option>
                            <option value="Cultural">Cultural</option>
                            <option value="Celebration">Celebration</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Status
                          </label>
                          <select
                            value={eventStatus}
                            onChange={(e) => setEventStatus(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold bg-white"
                          >
                            <option value="Upcoming">Upcoming (आगामी)</option>
                            <option value="Completed">Completed (सम्पन्न)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Event Description *
                        </label>
                        <textarea
                          required
                          rows={2}
                          value={eventDesc}
                          onChange={(e) => setEventDesc(e.target.value)}
                          placeholder="Details of activities, participants, prizes..."
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold bg-white resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingEvent}
                        className="bg-brand-navy hover:bg-slate-800 text-brand-gold font-bold py-2.5 px-6 rounded-xl transition-colors flex items-center gap-2 text-xs sm:text-sm shadow cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles size={15} />
                        <span>{isSavingEvent ? 'Saving...' : editingEvent ? 'Update Event' : 'Add Event to Calendar'}</span>
                      </button>
                    </form>
                  </div>

                  {/* Events List */}
                  <div>
                    <h5 className="font-bold text-brand-navy text-sm mb-3">
                      Published School Events ({eventsList.length})
                    </h5>
                    <div className="space-y-2.5">
                      {eventsList.map((ev) => (
                        <div key={ev.id} className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-3 shadow-xs">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-brand-navy/10 text-brand-navy">
                                {ev.category}
                              </span>
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${ev.status === 'Upcoming' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                                {ev.status}
                              </span>
                              <span className="text-xs text-slate-400">{ev.date}</span>
                            </div>
                            <h6 className="font-bold text-brand-navy text-sm">{ev.title}</h6>
                            <p className="text-xs text-slate-500">{ev.venue}</p>
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">{ev.description}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setEditingEvent(ev);
                                setEventTitle(ev.title);
                                setEventDate(ev.date);
                                setEventVenue(ev.venue || '');
                                setEventCategory(ev.category || 'Cultural');
                                setEventStatus(ev.status || 'Upcoming');
                                setEventDesc(ev.description || '');
                              }}
                              className="p-2 text-brand-navy hover:bg-slate-100 rounded-lg cursor-pointer"
                              title="Edit Event"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(ev.id)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                              title="Delete Event"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* --- 4. ADMISSIONS MANAGEMENT --- */}
              {activeTab === 'admissions' && (
                <div className="space-y-6">
                  {/* Top Bar for Admissions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <h4 className="font-bold text-brand-navy text-base">
                        Student Admission Applications ({admissionsList.length})
                      </h4>
                      <p className="text-xs text-slate-500">
                        वेबसाइट से प्राप्त ऑनलाइन प्रवेश आवेदन एवं ऑफ़लाइन प्रविष्टियां।
                      </p>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                      <button
                        type="button"
                        onClick={handleExportAdmissionsCSV}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                        title="Download complete admissions list in Excel/CSV"
                      >
                        <FileSpreadsheet size={15} /> Export CSV / Excel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAdmission(null);
                          setNewAdmissionStudent('');
                          setNewAdmissionParent('');
                          setNewAdmissionPhone('');
                          setShowAddAdmissionModal(true);
                        }}
                        className="bg-brand-navy hover:bg-slate-800 text-brand-gold font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Plus size={15} /> Manual Entry (ऑफ़लाइन एडमिशन जोड़ें)
                      </button>
                    </div>
                  </div>

                  {/* Manual Add / Edit Admission Modal */}
                  {showAddAdmissionModal && (
                    <div className="bg-amber-50/70 border border-brand-gold/40 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-bold text-brand-navy text-sm">
                          {editingAdmission ? 'Edit Admission Application' : 'Add New Admission Record'}
                        </h5>
                        <button onClick={() => setShowAddAdmissionModal(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={16} />
                        </button>
                      </div>

                      <form onSubmit={handleSaveAdmission} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Student Name *</label>
                          <input
                            type="text"
                            required
                            value={newAdmissionStudent}
                            onChange={(e) => setNewAdmissionStudent(e.target.value)}
                            placeholder="Student Name"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Parent Name</label>
                          <input
                            type="text"
                            value={newAdmissionParent}
                            onChange={(e) => setNewAdmissionParent(e.target.value)}
                            placeholder="Parent Name"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number *</label>
                          <input
                            type="tel"
                            required
                            value={newAdmissionPhone}
                            onChange={(e) => setNewAdmissionPhone(e.target.value)}
                            placeholder="Mobile No."
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Class</label>
                          <select
                            value={newAdmissionClass}
                            onChange={(e) => setNewAdmissionClass(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                          >
                            {['Nursery', 'L.K.G.', 'U.K.G.', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Village / Address</label>
                          <input
                            type="text"
                            value={newAdmissionVillage}
                            onChange={(e) => setNewAdmissionVillage(e.target.value)}
                            placeholder="Village / Area"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="submit"
                            disabled={isSavingAdmission}
                            className="w-full bg-brand-navy text-brand-gold font-bold py-2 rounded-lg text-xs cursor-pointer hover:bg-slate-800"
                          >
                            {editingAdmission ? 'Update Record' : 'Save Record'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Admission Applications List */}
                  <div className="space-y-2.5">
                    {admissionsList.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No admission inquiries received yet.</p>
                    ) : (
                      admissionsList.map((adm) => (
                        <div key={adm.id} className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-brand-navy text-sm">{adm.studentName}</span>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-gold/15 text-brand-navy">
                                Class {adm.classGrade} {adm.stream ? `(${adm.stream})` : ''}
                              </span>
                              <select
                                value={adm.status || 'New'}
                                onChange={(e) => handleUpdateAdmissionStatus(adm.id, e.target.value)}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                  adm.status === 'Admitted' ? 'bg-green-100 text-green-800 border-green-300' :
                                  adm.status === 'Contacted' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                  'bg-amber-100 text-amber-800 border-amber-300'
                                }`}
                              >
                                <option value="New">New Inquiry</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Admitted">Admitted</option>
                              </select>
                            </div>
                            <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                              <span>Parent: <strong>{adm.parentName || 'N/A'}</strong></span>
                              <span>Mobile: <strong>{adm.phone}</strong></span>
                              <span>Village: <strong>{adm.village || 'Palwal'}</strong></span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            <a
                              href={`tel:${adm.phone}`}
                              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                              title="Call Parent"
                            >
                              <Phone size={14} />
                            </a>
                            <a
                              href={`https://wa.me/91${adm.phone?.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(adm.parentName || 'Parent')},%20greetings%20from%20Adarsh%20Vidya%20Mandir%20School%20regarding%20admission%20of%20${encodeURIComponent(adm.studentName)}.`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-lg bg-green-100 hover:bg-green-200 text-green-700"
                              title="WhatsApp Message"
                            >
                              <MessageCircle size={14} />
                            </a>
                            <button
                              onClick={() => {
                                setEditingAdmission(adm);
                                setNewAdmissionStudent(adm.studentName);
                                setNewAdmissionParent(adm.parentName || '');
                                setNewAdmissionPhone(adm.phone);
                                setNewAdmissionClass(adm.classGrade || 'Nursery');
                                setNewAdmissionVillage(adm.village || '');
                                setShowAddAdmissionModal(true);
                              }}
                              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-brand-navy"
                              title="Edit Admission"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteAdmission(adm.id)}
                              className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600"
                              title="Delete Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* --- 5. TOPPERS & ACHIEVERS MANAGEMENT --- */}
              {activeTab === 'achievers' && (
                <div className="space-y-6">
                  {/* Achiever Form (Add or Edit) */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-serif font-bold text-brand-navy text-base sm:text-lg flex items-center gap-2">
                        {editingAchiever ? <Edit3 size={18} className="text-brand-gold" /> : <Plus size={18} className="text-brand-gold" />}
                        <span>{editingAchiever ? 'Edit Achiever (अचीवर संपादित करें)' : 'Add Board Topper / Sports Star (नया अचीवर)'}</span>
                      </h4>
                      {editingAchiever && (
                        <button
                          type="button"
                          onClick={() => { setEditingAchiever(null); setAchieverName(''); setAchieverTitle(''); }}
                          className="text-xs text-red-600 hover:underline font-bold"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>

                    <form onSubmit={handleSaveAchiever} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Student Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={achieverName}
                            onChange={(e) => setAchieverName(e.target.value)}
                            placeholder="e.g. Rahul Sharma"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Achievement Title *
                          </label>
                          <input
                            type="text"
                            required
                            value={achieverTitle}
                            onChange={(e) => setAchieverTitle(e.target.value)}
                            placeholder="e.g. 1st Rank HBSE 10th Board / State Gold Medalist"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Score / Percentage
                          </label>
                          <input
                            type="text"
                            value={achieverScore}
                            onChange={(e) => setAchieverScore(e.target.value)}
                            placeholder="e.g. 96.8% or Gold Medal"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Category
                          </label>
                          <select
                            value={achieverCategory}
                            onChange={(e) => setAchieverCategory(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold bg-white"
                          >
                            <option value="Board Topper">Board Topper</option>
                            <option value="Sports">Sports</option>
                            <option value="Merit">Merit & Talent</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Year / Session
                          </label>
                          <input
                            type="text"
                            value={achieverYear}
                            onChange={(e) => setAchieverYear(e.target.value)}
                            placeholder="e.g. 2025-26"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold bg-white"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingAchiever}
                        className="bg-brand-navy hover:bg-slate-800 text-brand-gold font-bold py-2.5 px-6 rounded-xl transition-colors flex items-center gap-2 text-xs sm:text-sm shadow cursor-pointer disabled:opacity-50"
                      >
                        <Trophy size={15} />
                        <span>{isSavingAchiever ? 'Saving...' : editingAchiever ? 'Update Achiever' : 'Publish Achiever Live'}</span>
                      </button>
                    </form>
                  </div>

                  {/* Achievers List */}
                  <div>
                    <h5 className="font-bold text-brand-navy text-sm mb-3">
                      School Toppers & Champions ({achieversList.length})
                    </h5>
                    <div className="space-y-2.5">
                      {achieversList.map((a) => (
                        <div key={a.id} className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-brand-navy/10 text-brand-navy">
                                {a.category}
                              </span>
                              <span className="text-xs font-semibold text-slate-400">{a.year}</span>
                            </div>
                            <h6 className="font-bold text-brand-navy text-sm">{a.name}</h6>
                            <p className="text-xs text-brand-gold font-semibold">{a.title} {a.scoreOrAward ? `— ${a.scoreOrAward}` : ''}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setEditingAchiever(a);
                                setAchieverName(a.name);
                                setAchieverTitle(a.title);
                                setAchieverScore(a.scoreOrAward || '');
                                setAchieverCategory(a.category || 'Board Topper');
                                setAchieverYear(a.year || '');
                              }}
                              className="p-2 text-brand-navy hover:bg-slate-100 rounded-lg cursor-pointer"
                              title="Edit Achiever"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteAchiever(a.id)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                              title="Delete Achiever"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* --- 6. ADMINS MANAGEMENT (UP TO 100+ ADMINS) --- */}
              {activeTab === 'admins' && (
                <div className="space-y-6">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <h4 className="font-serif font-bold text-brand-navy text-base sm:text-lg flex items-center gap-2">
                          <UserCheck size={20} className="text-brand-gold" />
                          <span>Registered Administrators ({adminsList.length})</span>
                        </h4>
                        <p className="text-xs text-slate-500">
                          कम से कम 100 एडमिन रजिस्टर हो सकते हैं। मास्टर ईमेल: {MASTER_EMAIL}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('register');
                          setCurrentUser(null);
                        }}
                        className="bg-brand-navy text-brand-gold font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                      >
                        <UserPlus size={14} /> Register Another Admin
                      </button>
                    </div>

                    <div className="space-y-2">
                      {adminsList.map((admin) => (
                        <div key={admin.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-brand-gold/20 text-brand-gold font-bold flex items-center justify-center shrink-0">
                              {admin.fullName ? admin.fullName[0].toUpperCase() : 'A'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-brand-navy">{admin.fullName}</span>
                                {admin.id === 'master-admin' && (
                                  <span className="text-[9px] bg-brand-gold text-brand-navy font-bold px-1.5 py-0.2 rounded">Master</span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500">
                                @{admin.username} • {admin.email}
                              </div>
                            </div>
                          </div>

                          {admin.id === currentUser?.id ? (
                            <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                              You (Active)
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Verified
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* --- CONFIRM DELETE ACCOUNT MODAL --- */}
        {showDeleteAccountModal && (
          <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                <Trash2 size={24} />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                Delete Admin Account?
              </h4>
              <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                क्या आप वाकई अपना एडमिन खाता (@{currentUser?.username}) हटाना चाहते हैं? यह क्रिया वापस नहीं ली जा सकती।
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteAccountModal(false)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteMyAccount}
                  disabled={isDeletingAccount}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {isDeletingAccount ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
