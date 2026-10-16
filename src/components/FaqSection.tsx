import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, HelpCircle, Phone, MessageCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  hindiQuestion: string;
  answer: string;
  category: string;
}

const faqs: FaqItem[] = [
  {
    question: 'Which board is Adarsh Vidya Mandir affiliated with?',
    hindiQuestion: 'आदर्श विद्या मंदिर किस शिक्षा बोर्ड से मान्यता प्राप्त है?',
    answer: 'Adarsh Vidya Mandir is formally affiliated with the Haryana Board of School Education (HBSE), Bhiwani. We strictly adhere to curriculum standards from Nursery all the way to Senior Secondary (Class 12th) level.',
    category: 'Affiliation'
  },
  {
    question: 'Which academic streams are available for Classes 11th and 12th?',
    hindiQuestion: 'कक्षा 11वीं और 12वीं में कौन-कौन सी स्ट्रीम उपलब्ध हैं?',
    answer: 'We provide specialized coaching and facilities for all major streams: Science (Medical and Non-Medical), Commerce, and Arts / Humanities. Well-equipped physics, chemistry, biology, and computer labs support practical learning.',
    category: 'Academics'
  },
  {
    question: 'Does the school provide bus transport facility for nearby villages?',
    hindiQuestion: 'क्या आस-पास के गांवों के लिए स्कूल बस / ट्रांसपोर्ट उपलब्ध है?',
    answer: 'Yes! AVM operates a dedicated fleet of safe school buses covering Meerpur Kaurali, Palwal city, and adjacent rural sectors. Each vehicle has experienced drivers and responsible staff attendants to ensure student safety.',
    category: 'Facilities'
  },
  {
    question: 'What are the official school hours?',
    hindiQuestion: 'स्कूल का समय क्या है?',
    answer: 'Regular school hours are Monday through Saturday: Morning 8:00 AM to 2:00 PM (Summer sessions may operate from 7:30 AM to 1:30 PM as per Haryana government educational directives). Office timings for parent queries: 8:00 AM to 2:30 PM.',
    category: 'Timings'
  },
  {
    question: 'What documents are required during admission registration?',
    hindiQuestion: 'एडमिशन के समय कौन-से दस्तावेज़ आवश्यक होते हैं?',
    answer: 'Parents should submit: (1) Birth Certificate of the student, (2) Previous Class Mark Sheet / Report Card, (3) School Leaving Certificate (SLC / TC), (4) Aadhar Cards of student and parents, (5) 4 Passport size color photos, and (6) Parivar Pehchan Patra (PPP / Family ID).',
    category: 'Admissions'
  },
  {
    question: 'What sports programs and extracurricular activities are offered?',
    hindiQuestion: 'खेलकूद और अन्य गतिविधियों में क्या विशेष है?',
    answer: 'AVM is renowned for its State Champion Kho-Kho team and international-standard indoor Badminton courts. We also offer athletics, volleyball, table tennis, annual cultural fests, science exhibitions, and speech/debate competitions.',
    category: 'Sports'
  }
];

export const FaqSection: React.FC<{ onOpenAdmission: () => void }> = ({ onOpenAdmission }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faqs" className="py-24 bg-white px-4 border-t border-slate-100">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/10 text-brand-gold text-xs font-bold tracking-widest uppercase mb-3">
            <HelpCircle size={14} /> Clear Answers for Parents
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-brand-navy mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            अक्सर पूछे जाने वाले सवाल — Common queries regarding admissions, transport, curriculum, and campus life.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? 'border-brand-gold bg-slate-50/70 shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gold block mb-1">
                      {faq.category}
                    </span>
                    <h3 className="text-base sm:text-lg font-serif font-bold text-brand-navy">
                      {faq.question}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      {faq.hindiQuestion}
                    </p>
                  </div>
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isOpen ? 'bg-brand-gold text-white rotate-180' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <ChevronDown size={18} />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-5 sm:px-6 pb-6 pt-1 text-slate-600 text-sm leading-relaxed border-t border-slate-200/60"
                    >
                      <p className="bg-white p-4 rounded-xl border border-slate-100 text-slate-700">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Still have questions prompt */}
        <div className="mt-12 bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h4 className="font-serif font-bold text-brand-navy text-lg">
              Still have questions about admission or fees?
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Our administration desk is available Monday to Saturday to guide you.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenAdmission}
              className="px-5 py-2.5 bg-brand-gold text-brand-navy font-bold rounded-xl text-xs sm:text-sm hover:bg-yellow-500 transition-colors cursor-pointer shadow-sm"
            >
              Apply Online Now
            </button>
            <a
              href="tel:+919813969669"
              className="px-5 py-2.5 bg-brand-navy text-white font-semibold rounded-xl text-xs sm:text-sm hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Phone size={14} className="text-brand-gold" /> Call Helpline
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
