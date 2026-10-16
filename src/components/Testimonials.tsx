import React from 'react';
import { Star, Quote, Award, GraduationCap, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface Testimonial {
  name: string;
  relation: string;
  childInfo: string;
  quote: string;
  highlight: string;
}

const testimonials: Testimonial[] = [
  {
    name: 'Dharmendra Sharma',
    relation: 'Parent of Class 12th District Topper',
    childInfo: 'Son scored 94.6% in HBSE Science',
    quote: 'Adarsh Vidya Mandir has been a blessing for our family. The dedicated faculty not only completed the syllabus with complete conceptual clarity but gave extra doubt-clearing sessions before board exams. My son achieved a top rank in Palwal district without needing external coaching.',
    highlight: 'Outstanding Faculty & Board Mentorship'
  },
  {
    name: 'Sunita Rawat',
    relation: 'Parent of Class 8th Student',
    childInfo: 'Daughter enrolled since Nursery',
    quote: 'What sets AVM apart from other schools in our area is the culture of discipline and respect. The campus is extremely safe, school buses are always on time, and teachers treat every child with immense warmth and care.',
    highlight: 'Safe Campus & Punctual Bus Service'
  },
  {
    name: 'Vikram Singh Chauhan',
    relation: 'Parent & State Kho-Kho Athlete’s Father',
    childInfo: 'Son represents Haryana State Kho-Kho Team',
    quote: 'Under Coach Jairaj Singh’s guidance, my child transformed from a shy boy into a fearless state athlete. The sports facilities and constant encouragement from the Principal made it possible to excel equally in sports and academics.',
    highlight: 'Unmatched Sports & Kho-Kho Training'
  },
  {
    name: 'Pooja Verma',
    relation: 'Alumni (Batch 2021)',
    childInfo: 'Now pursuing B.Tech in Computer Science',
    quote: 'The values and solid mathematical foundation built at AVM gave me the confidence to compete at state and national levels. The teachers believed in me even when I doubted myself.',
    highlight: 'Values, Discipline & Moral Foundation'
  }
];

export const Testimonials: React.FC = () => {
  return (
    <section className="py-24 bg-slate-50 border-t border-slate-200/80 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-gold/10 text-brand-gold text-xs font-bold tracking-widest uppercase mb-3">
            <Award size={14} /> Parents & Alumni Voices
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-brand-navy mb-4">
            Words of Trust & Pride
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Hear from parents and achievers who have experienced the transformative education and disciplined environment at Adarsh Vidya Mandir.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {testimonials.map((t, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-xl border border-slate-100 transition-all duration-300 flex flex-col justify-between relative group"
            >
              <div>
                {/* Rating & Highlight */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-brand-navy bg-brand-gold/15 px-2.5 py-1 rounded-md">
                    {t.highlight}
                  </span>
                </div>

                {/* Quote Text */}
                <div className="relative mb-6">
                  <Quote size={28} className="text-slate-200 absolute -top-2 -left-1 -z-0 opacity-80" />
                  <p className="text-slate-700 text-sm sm:text-base leading-relaxed relative z-10 italic">
                    "{t.quote}"
                  </p>
                </div>
              </div>

              {/* Author Info */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-serif font-bold text-brand-navy text-base">
                    {t.name}
                  </h4>
                  <p className="text-xs text-brand-gold font-semibold">
                    {t.relation}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {t.childInfo}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 text-brand-navy flex items-center justify-center shrink-0">
                  <GraduationCap size={20} className="text-brand-gold" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges Bar */}
        <div className="mt-14 bg-brand-navy rounded-2xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-around gap-6 text-center md:text-left shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold shrink-0">
              <CheckCircle size={24} />
            </div>
            <div>
              <div className="font-bold text-lg text-white">25+ Years Legacy</div>
              <div className="text-xs text-slate-300">Continuous Trust in Meerpur Kaurali</div>
            </div>
          </div>

          <div className="w-px h-10 bg-white/10 hidden md:block"></div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold shrink-0">
              <Award size={24} />
            </div>
            <div>
              <div className="font-bold text-lg text-white">100% Board Results</div>
              <div className="text-xs text-slate-300">HBSE Board of School Education Haryana</div>
            </div>
          </div>

          <div className="w-px h-10 bg-white/10 hidden md:block"></div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold shrink-0">
              <Star size={24} />
            </div>
            <div>
              <div className="font-bold text-lg text-white">State Champions</div>
              <div className="text-xs text-slate-300">Dominant Kho-Kho & Athletics Teams</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
