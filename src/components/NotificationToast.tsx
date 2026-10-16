import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, X, Sparkles, ExternalLink } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: number;
}

// Global dispatcher helper
export const triggerAppNotification = (
  title: string, 
  message: string = 'Website par turant live update ho gaya hai!',
  type: 'success' | 'error' | 'info' = 'success'
) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('avm_notification', {
      detail: {
        id: Math.random().toString(36).substring(7),
        type,
        title,
        message,
        timestamp: Date.now()
      }
    }));

    // Trigger subtle mobile haptic feedback if available
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([80, 40, 80]);
      }
    } catch {}
  }
};

export const NotificationToast: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleNotification = (e: Event) => {
      const customEvent = e as CustomEvent<ToastMessage>;
      if (customEvent.detail) {
        const item = customEvent.detail;
        setToasts(prev => [item, ...prev.slice(0, 2)]);
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== item.id));
        }, 4500);
      }
    };

    window.addEventListener('avm_notification', handleNotification);
    return () => window.removeEventListener('avm_notification', handleNotification);
  }, []);

  const handleDismiss = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed top-4 sm:top-6 inset-x-0 z-[99999] pointer-events-none flex flex-col items-center px-4 space-y-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -25, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className={`pointer-events-auto w-full max-w-md rounded-2xl shadow-2xl p-4 sm:p-5 border flex items-start gap-3.5 backdrop-blur-xl ${
              toast.type === 'error'
                ? 'bg-red-950/95 text-white border-red-500/40 shadow-red-900/30'
                : 'bg-emerald-950/95 text-white border-emerald-400/50 shadow-emerald-950/50'
            }`}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
              toast.type === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white ring-4 ring-emerald-400/20'
            }`}>
              {toast.type === 'error' ? (
                <AlertTriangle size={24} className="stroke-[2.5]" />
              ) : (
                <CheckCircle2 size={24} className="stroke-[2.5] animate-pulse" />
              )}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-emerald-200 flex items-center gap-1">
                  <Sparkles size={11} className="text-brand-gold animate-spin" />
                  Live Sync
                </span>
                <span className="text-[10px] text-white/70">Just Now</span>
              </div>
              <h4 className="font-bold text-white text-base sm:text-lg leading-tight">
                {toast.title}
              </h4>
              <p className="text-white/85 text-xs sm:text-sm mt-1 leading-snug">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => handleDismiss(toast.id)}
              className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              aria-label="Dismiss notification"
            >
              <X size={18} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
