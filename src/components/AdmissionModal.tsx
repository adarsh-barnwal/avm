import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Send, MessageCircle, FileText, Download, Phone, Calendar, School, Award, AlertCircle } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AdmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'apply' | 'prospectus';
}

export const AdmissionModal: React.FC<AdmissionModalProps> = ({ isOpen, onClose, defaultTab = 'apply' }) => {
  const [activeTab, setActiveTab] = useState<'apply' | 'prospectus'>(defaultTab);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form State
  const [studentName, setStudentName] = useState('');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedClass, setSelectedClass] = useState('Nursery');
  const [stream, setStream] = useState('Science (Non-Medical)');
  const [village, setVillage] = useState('');
  const [needBus, setNeedBus] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    // 1. Save directly to Cloud Firestore Database
    try {
      await addDoc(collection(db, 'admissions'), {
        studentName: studentName.trim(),
        parentName: parentName.trim(),
        phone: phone.trim(),
        classGrade: selectedClass,
        stream: (selectedClass === '11th' || selectedClass === '12th') ? stream : '',
        village: village.trim() || 'Meerpur Kaurali',
        needBus: Boolean(needBus),
        status: 'New',
        createdAt: new Date().toISOString()
      });
    } catch (dbErr) {
      console.warn("Firestore admission write notice:", dbErr);
    }

    // 2. Also send notification email via Web3Forms
    const formData = new FormData();
    formData.append("access_key", "c8619600-3c2b-40e6-9f1c-3e2f73a7b9ed");
    formData.append("subject", `New Online Admission Application: ${studentName} for Class ${selectedClass}`);
    formData.append("from_name", "AVM Admission Portal");
    formData.append("Student Name", studentName);
    formData.append("Parent Name", parentName);
    formData.append("Contact Phone", phone);
    formData.append("Class Applying For", selectedClass);
    if (selectedClass === '11th' || selectedClass === '12th') {
      formData.append("Stream", stream);
    }
    formData.append("Village / Area", village);
    formData.append("Requires Bus Transport", needBus ? "Yes" : "No");

    try {
      await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsAppDirect = () => {
    const text = encodeURIComponent(
      `Hello Adarsh Vidya Mandir Administration,\n\nI want to apply for admission for Session 2026-27:\n` +
      `• Student Name: ${studentName || 'Student'}\n` +
      `• Parent/Guardian: ${parentName || 'Parent'}\n` +
      `• Class: ${selectedClass} ${selectedClass === '11th' || selectedClass === '12th' ? `(${stream})` : ''}\n` +
      `• Mobile: ${phone || 'N/A'}\n` +
      `• Village/Area: ${village || 'Meerpur Kaurali / Palwal'}\n` +
      `• Bus Transport: ${needBus ? 'Yes' : 'No'}\n\nPlease share the admission process and seat availability.`
    );
    window.open(`https://wa.me/919813969669?text=${text}`, '_blank');
  };

  const classOptions = [
    'Nursery', 'L.K.G.', 'U.K.G.',
    '1st', '2nd', '3rd', '4th', '5th',
    '6th', '7th', '8th', '9th', '10th',
    '11th', '12th'
  ];

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center p-3 sm:p-6 bg-brand-navy/85 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-navy via-slate-900 to-brand-navy text-white p-5 sm:p-6 relative border-b border-brand-gold/30">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-gold text-brand-navy flex items-center justify-center shadow-lg font-bold">
              <School size={26} />
            </div>
            <div>
              <span className="text-brand-gold text-xs font-bold uppercase tracking-wider block">Session 2026-27</span>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
                Online Admission & Prospectus Portal
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm">Adarsh Vidya Mandir Sr. Sec. School, Meerpur Kaurali</p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex gap-2 mt-5 bg-white/10 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('apply')}
              className={`flex-1 py-2 px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'apply'
                  ? 'bg-brand-gold text-brand-navy shadow-md font-bold'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              📝 Online Admission Form
            </button>
            <button
              onClick={() => setActiveTab('prospectus')}
              className={`flex-1 py-2 px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'prospectus'
                  ? 'bg-brand-gold text-brand-navy shadow-md font-bold'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              📄 Prospectus & Guidelines
            </button>
          </div>
        </div>

        {/* Tab 1: Online Admission Form */}
        {activeTab === 'apply' && (
          <div className="overflow-y-auto p-5 sm:p-8 flex-1">
            {submitted ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 size={36} />
                </div>
                <h4 className="text-2xl font-serif font-bold text-brand-navy">
                  Application Submitted Successfully!
                </h4>
                <p className="text-slate-600 max-w-md mx-auto text-sm leading-relaxed">
                  Thank you for applying to Adarsh Vidya Mandir. Our admissions coordinator will reach out to <strong className="text-brand-navy">{phone}</strong> within 24 hours.
                </p>

                <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    onClick={handleWhatsAppDirect}
                    className="inline-flex items-center justify-center gap-2 bg-green-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-700 transition-colors shadow-md text-sm cursor-pointer"
                  >
                    <MessageCircle size={18} /> Connect on WhatsApp Now
                  </button>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setStudentName('');
                      setParentName('');
                      setPhone('');
                    }}
                    className="inline-flex items-center justify-center px-6 py-3 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-sm cursor-pointer"
                  >
                    Submit Another Application
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertCircle size={17} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Note:</strong> Seats are limited for each class (Nursery to 12th). Submit this form to reserve your registration and priority interaction slot.
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Student Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="e.g. Aryan Sharma"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold bg-slate-50/50 hover:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Father / Mother / Guardian Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      placeholder="e.g. Mr. Rajesh Sharma"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold bg-slate-50/50 hover:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Mobile / WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98123 45678"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold bg-slate-50/50 hover:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Class Seeking Admission In *
                    </label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold bg-slate-50/50 hover:bg-white transition-all"
                    >
                      {classOptions.map((cls) => (
                        <option key={cls} value={cls}>
                          Class {cls}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* If 11th or 12th, ask stream */}
                {(selectedClass === '11th' || selectedClass === '12th') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200"
                  >
                    <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-2">
                      Select Stream for Class {selectedClass} (HBSE Board) *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {['Science (Non-Medical)', 'Science (Medical)', 'Commerce', 'Arts / Humanities'].map((st) => (
                        <label
                          key={st}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs font-medium transition-all ${
                            stream === st
                              ? 'bg-brand-navy text-white border-brand-navy'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="stream"
                            value={st}
                            checked={stream === st}
                            onChange={() => setStream(st)}
                            className="hidden"
                          />
                          <span>{st}</span>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Village / Colony / Area *
                    </label>
                    <input
                      type="text"
                      required
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      placeholder="e.g. Meerpur Kaurali, Palwal"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold bg-slate-50/50 hover:bg-white transition-all"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={needBus}
                        onChange={(e) => setNeedBus(e.target.checked)}
                        className="rounded text-brand-gold focus:ring-brand-gold h-4 w-4"
                      />
                      <span className="text-xs font-semibold text-slate-700">
                        School Bus Transport Required? (हाँ, बस सुविधा चाहिए)
                      </span>
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-brand-gold text-brand-navy font-bold py-3 px-6 rounded-xl hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-gold/20 cursor-pointer disabled:opacity-50 text-sm"
                  >
                    {submitting ? 'Submitting Application...' : 'Submit Online Admission Form'}
                    <Send size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={handleWhatsAppDirect}
                    className="sm:w-auto px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer"
                  >
                    <MessageCircle size={18} /> Apply via WhatsApp
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: Prospectus & Guidelines */}
        {activeTab === 'prospectus' && (
          <div className="overflow-y-auto p-5 sm:p-8 flex-1 space-y-6">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <Calendar className="text-brand-gold mx-auto mb-2" size={24} />
                <h5 className="font-bold text-brand-navy text-sm">School Timings</h5>
                <p className="text-xs text-slate-500 mt-1">8:00 AM - 2:00 PM (Mon to Sat)</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <Award className="text-brand-gold mx-auto mb-2" size={24} />
                <h5 className="font-bold text-brand-navy text-sm">Board Affiliation</h5>
                <p className="text-xs text-slate-500 mt-1">HBSE Bhiwani (Haryana)</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <School className="text-brand-gold mx-auto mb-2" size={24} />
                <h5 className="font-bold text-brand-navy text-sm">Grades Offered</h5>
                <p className="text-xs text-slate-500 mt-1">Nursery to 12th (Senior Sec.)</p>
              </div>
            </div>

            {/* Documents Checklist */}
            <div className="border border-slate-200 rounded-xl p-5 bg-white">
              <h4 className="font-serif font-bold text-brand-navy text-base sm:text-lg mb-3 flex items-center gap-2">
                <FileText className="text-brand-gold" size={20} />
                Documents Required at Admission (आवश्यक दस्तावेज़)
              </h4>
              <ul className="grid sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-600 font-bold">✓</span> Birth Certificate (जन्म प्रमाण पत्र)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600 font-bold">✓</span> Transfer Certificate (TC / SLC)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600 font-bold">✓</span> Previous Class Report Card / Marks Sheet
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600 font-bold">✓</span> Aadhar Card of Student & Parents
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600 font-bold">✓</span> 4 Passport-size Color Photographs
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600 font-bold">✓</span> Parivar Pehchan Patra (PPP / Family ID)
                </li>
              </ul>
            </div>

            {/* Admission Process Steps */}
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50">
              <h4 className="font-serif font-bold text-brand-navy text-base sm:text-lg mb-4">
                4-Step Admission Procedure
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-navy text-brand-gold font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-xs sm:text-sm text-brand-navy block">Registration / पूछताछ:</strong>
                    <span className="text-xs text-slate-600">Fill the online form or visit school campus reception desk.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-navy text-brand-gold font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-xs sm:text-sm text-brand-navy block">Student Interaction / Diagnostic Test:</strong>
                    <span className="text-xs text-slate-600">Simple baseline interaction to understand the child's learning level.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-navy text-brand-gold font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="text-xs sm:text-sm text-brand-navy block">Document Verification:</strong>
                    <span className="text-xs text-slate-600">Submission of TC, birth proof, and photograph copies.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-navy text-brand-gold font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    4
                  </span>
                  <div>
                    <strong className="text-xs sm:text-sm text-brand-navy block">Confirmation & Welcome Kit:</strong>
                    <span className="text-xs text-slate-600">Allocation of section, roll number, and issuing syllabus / uniform info.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-brand-navy text-white p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h5 className="font-bold text-brand-gold text-sm">Need In-Person Consultation?</h5>
                <p className="text-xs text-slate-300">Visit campus reception on working days (8:00 AM - 2:00 PM).</p>
              </div>
              <a
                href="tel:+919813969669"
                className="inline-flex items-center gap-2 bg-brand-gold text-brand-navy font-bold px-4 py-2 rounded-lg text-xs hover:bg-yellow-500 transition-colors shrink-0"
              >
                <Phone size={14} /> Call Admission Office
              </a>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
