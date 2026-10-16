import React, { useState, useEffect } from 'react';
import { Palette, Check, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ThemeConfig {
  id: string;
  name: string;
  hindiName: string;
  navy: string;
  gold: string;
  accent: string;
  previewBg: string;
  previewGold: string;
}

export const themes: ThemeConfig[] = [
  {
    id: 'slate-navy',
    name: 'Royal Navy & Gold',
    hindiName: 'रॉयल नेवी और गोल्ड (मूल)',
    navy: '#0f172a',
    gold: '#c5a059',
    accent: '#1e293b',
    previewBg: '#0f172a',
    previewGold: '#c5a059'
  },
  {
    id: 'heritage-maroon',
    name: 'Heritage Maroon & Gold',
    hindiName: 'हेरिटेज मैरून और गोल्ड',
    navy: '#450a0a',
    gold: '#d97706',
    accent: '#7f1d1d',
    previewBg: '#450a0a',
    previewGold: '#d97706'
  },
  {
    id: 'regal-emerald',
    name: 'Forest Emerald & Warm Gold',
    hindiName: 'एमराल्ड ग्रीन और गोल्ड',
    navy: '#064e3b',
    gold: '#eab308',
    accent: '#065f46',
    previewBg: '#064e3b',
    previewGold: '#eab308'
  },
  {
    id: 'sapphire-blue',
    name: 'Sapphire Blue & Amber',
    hindiName: 'सैफायर ब्लू और एम्बर',
    navy: '#1e3a8a',
    gold: '#f59e0b',
    accent: '#172554',
    previewBg: '#1e3a8a',
    previewGold: '#f59e0b'
  }
];

export const ThemeSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('slate-navy');

  const applyTheme = (theme: ThemeConfig) => {
    setCurrentTheme(theme.id);
    document.documentElement.style.setProperty('--brand-navy', theme.navy);
    document.documentElement.style.setProperty('--brand-gold', theme.gold);
    document.documentElement.style.setProperty('--brand-accent', theme.accent);
    try {
      localStorage.setItem('avm-preferred-theme', theme.id);
    } catch {}
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('avm-preferred-theme');
      if (saved) {
        const found = themes.find((t) => t.id === saved);
        if (found) {
          applyTheme(found);
        }
      }
    } catch {}
  }, []);

  return (
    <>
      {/* Floating Theme Switcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-6 lg:bottom-28 lg:right-10 w-11 h-11 rounded-full bg-white text-slate-800 shadow-xl border border-slate-200 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 cursor-pointer group"
        title="Change School Color Theme"
      >
        <Palette size={20} className="text-brand-gold group-hover:rotate-45 transition-transform duration-300" />
      </button>

      {/* Theme Modal Popover */}
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Palette size={18} className="text-brand-gold" />
                  <h4 className="font-serif font-bold text-slate-900 text-sm">
                    School Color Palette
                  </h4>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <p className="text-xs text-slate-500 mb-4">
                Select your preferred visual theme for Adarsh Vidya Mandir:
              </p>

              <div className="space-y-2.5">
                {themes.map((theme) => {
                  const isSelected = currentTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => applyTheme(theme)}
                      className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'border-brand-gold bg-amber-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Color Swatch */}
                        <div className="flex -space-x-1.5 items-center">
                          <span
                            className="w-6 h-6 rounded-full border-2 border-white shadow"
                            style={{ backgroundColor: theme.previewBg }}
                          />
                          <span
                            className="w-6 h-6 rounded-full border-2 border-white shadow"
                            style={{ backgroundColor: theme.previewGold }}
                          />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-xs text-slate-900">
                            {theme.name}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {theme.hindiName}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-brand-gold text-white flex items-center justify-center text-xs">
                          <Check size={12} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                <span className="text-[11px] text-slate-400">
                  Theme changes are instantly applied across the website.
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
