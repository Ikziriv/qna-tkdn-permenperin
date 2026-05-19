import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/ui';

/** Props for the AppLayout component. */
export interface AppLayoutProps {
  /** Content rendered inside the layout. */
  children: React.ReactNode;
  /** Whether to render the layout in full-width mode (used by admin dashboard). */
  fullWidth?: boolean;
  /** Whether to hide the top navigation header (e.g. on auth pages). */
  hideHeader?: boolean;
}

/**
 * Root application layout component.
 *
 * Provides the top navigation bar with branding, language switcher, and responsive
 * main content area with a sticky footer.
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ children, fullWidth = false, hideHeader = false }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-slate-50 to-slate-100">
      {!hideHeader && (
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className={`${fullWidth ? 'px-8' : 'max-w-4xl mx-auto px-4'} h-16 flex items-center justify-between`}>
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-auto h-8 p-1 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">TKDN</span>
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="uppercase text-md font-black tracking-tight text-slate-800">{t('app.name')}</span>
              <small className="uppercase text-xs text-slate-400">{t('app.subline')}</small>
            </div>
          </Link>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex text-sm text-slate-400 font-medium uppercase tracking-wider">
              {t('app.tagline')}
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </nav>
      )}
      <main className={`${fullWidth ? 'w-full px-8' : 'max-w-4xl mx-auto px-4'} py-8 md:py-12`}>
        {children}
      </main>
      <footer className="py-8 text-center text-slate-400 text-sm">
        &copy; {new Date().getFullYear()} {t('app.name')} {t('app.subline')}
      </footer>
    </div>
  );
};
