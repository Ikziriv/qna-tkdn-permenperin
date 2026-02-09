
import React from 'react';
import { useLanguage } from '../App';
import { translations } from '../translations';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { language, setLanguage } = useLanguage();
  const t = translations[language];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-slate-50 to-slate-100">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-auto h-8 p-1 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">TKDN</span>
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="uppercase text-md font-black tracking-tight text-slate-800">{t.appName}</span>
              <small className="uppercase text-xs text-slate-400">{t.appSubline}</small>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex text-sm text-slate-400 font-medium uppercase tracking-wider">
              {t.tagline}
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setLanguage('id')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${language === 'id' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                ID
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${language === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {children}
      </main>
      <footer className="py-8 text-center text-slate-400 text-sm">
        &copy; {new Date().getFullYear()} {t.appName} {t.appSubline}
      </footer>
    </div>
  );
};

export default Layout;
