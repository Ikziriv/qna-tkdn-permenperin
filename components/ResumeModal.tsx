import React from 'react';
import { Language } from '../types';
import { translations } from '../translations';

interface ResumeModalProps {
  language: Language;
  onContinue: () => void;
  onRestart: () => void;
}

const ResumeModal: React.FC<ResumeModalProps> = ({ language, onContinue, onRestart }) => {
  const t = translations[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-8 max-w-md w-full animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 mb-3">
          {t.resumeTitle}
        </h2>
        
        <p className="text-slate-500 leading-relaxed mb-8">
          {t.resumeDesc}
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={onContinue}
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all transform active:scale-[0.98] shadow-lg shadow-blue-200"
          >
            {t.resumeContinue}
          </button>
          
          <button
            onClick={onRestart}
            className="w-full py-4 px-6 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold transition-all"
          >
            {t.resumeRestart}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumeModal;
