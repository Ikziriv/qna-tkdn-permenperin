
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { useLanguage } from '../App';
import { translations } from '../translations';

interface OnboardingProps {
  onStart: (profile: UserProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onStart }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const [profile, setProfile] = useState<UserProfile>({ name: '', role: '' });
  const [error, setError] = useState('');
  const [showInfo, setShowInfo] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.name.trim() || !profile.role.trim()) {
      setError(language === 'id' ? 'Harap isi nama dan peran profesional Anda.' : 'Please provide both your name and professional role.');
      return;
    }
    onStart(profile);
  };

  return (
    <div className="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
        <div className="flex items-center justify-between mb-12">
          <div className="flex flex-col w-auto h-auto">
            <h1 className="text-xl font-black uppercase text-slate-900">{t.welcome}</h1>
            <small className="text-blue-600 uppercase font-black">{t.tagline}</small>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowInfo(!showInfo)}
              className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center justify-center"
              aria-label="Info"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4"></path>
                <path d="M12 8h.01"></path>
              </svg>
            </button>
            {showInfo && (
              <div className="absolute right-0 top-10 w-64 bg-white p-4 rounded-xl shadow-xl border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-200 text-left">
                <p className="text-slate-600 text-sm leading-relaxed">
                  {t.onboardingDesc}
                </p>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              {t.fullName}
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Johan Buydi"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              {t.role}
            </label>
            <input
              type="text"
              value={profile.role}
              onChange={(e) => setProfile({ ...profile, role: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Ahli Peraturan Tata Negara"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-medium">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-200 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
          >
            <span>{t.startAssessment}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </form>
      </div>
      <div className="mt-8 flex justify-center gap-4 text-slate-400">
        <div className="flex flex-row justify-between items-center border rounded-xl w-40 bg-white border p-4">
          <span className="text-xl font-bold text-slate-600 mr-2">10</span>
          <span className="text-[10px] uppercase font-bold tracking-widest">{t.questionsLabel}</span>
        </div>
        <div className="flex flex-row justify-between items-center border rounded-xl w-40 bg-white border p-4">
          <span className="text-xl font-bold text-slate-600 mr-2">3-5</span>
          <span className="text-[10px] uppercase font-bold tracking-widest">{t.minutesLabel}</span>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
