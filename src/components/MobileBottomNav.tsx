import React from 'react';
import { Phone, MessageCircle, FileText, MapPin } from 'lucide-react';

interface MobileBottomNavProps {
  onOpenAdmission: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenAdmission }) => {
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-brand-navy/95 backdrop-blur-lg border-t border-white/10 md:hidden shadow-2xl py-2 px-3">
      <div className="grid grid-cols-4 gap-1 items-center text-center">
        {/* Call Button */}
        <a
          href="tel:+919813969669"
          className="flex flex-col items-center justify-center py-1.5 px-1 text-slate-300 hover:text-brand-gold transition-colors active:scale-95"
        >
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-1 text-brand-gold">
            <Phone size={15} />
          </div>
          <span className="text-[10px] font-bold tracking-tight">Call Now</span>
        </a>

        {/* WhatsApp Button */}
        <a
          href="https://wa.me/919813969669"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center py-1.5 px-1 text-slate-300 hover:text-green-400 transition-colors active:scale-95"
        >
          <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mb-1">
            <MessageCircle size={16} />
          </div>
          <span className="text-[10px] font-bold tracking-tight text-green-400">WhatsApp</span>
        </a>

        {/* Online Admission Application */}
        <button
          onClick={onOpenAdmission}
          className="flex flex-col items-center justify-center py-1.5 px-1 text-slate-300 hover:text-brand-gold transition-colors active:scale-95 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-brand-gold text-brand-navy flex items-center justify-center mb-1 shadow-md font-bold">
            <FileText size={15} />
          </div>
          <span className="text-[10px] font-bold tracking-tight text-brand-gold">Apply Online</span>
        </button>

        {/* Location / Directions */}
        <a
          href="#reach-out"
          className="flex flex-col items-center justify-center py-1.5 px-1 text-slate-300 hover:text-brand-gold transition-colors active:scale-95"
        >
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-1 text-brand-gold">
            <MapPin size={15} />
          </div>
          <span className="text-[10px] font-bold tracking-tight">Location</span>
        </a>
      </div>
    </div>
  );
};
