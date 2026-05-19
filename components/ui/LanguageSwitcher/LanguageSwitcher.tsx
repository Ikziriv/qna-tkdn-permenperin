import React from 'react';
import { useTranslation } from 'react-i18next';

/** Props for the LanguageSwitcher component. */
export interface LanguageSwitcherProps {
  /** Additional CSS classes for the container. */
  className?: string;
}

/**
 * Reusable LanguageSwitcher primitive.
 *
 * Renders a segmented toggle for switching between supported languages.
 */
export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
}) => {
  const { i18n, t } = useTranslation();
  const language = i18n.language as 'en' | 'id';

  return (
    <div className={`flex bg-slate-100 p-1 rounded-xl ${className}`}>
      <button
        onClick={() => i18n.changeLanguage('id')}
        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
          language === 'id'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        }`}
        aria-pressed={language === 'id'}
        aria-label={t('common.switchToIndonesian')}
        lang="id"
      >
        ID
      </button>
      <button
        onClick={() => i18n.changeLanguage('en')}
        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
          language === 'en'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        }`}
        aria-pressed={language === 'en'}
        aria-label={t('common.switchToEnglish')}
        lang="en"
      >
        EN
      </button>
    </div>
  );
};
