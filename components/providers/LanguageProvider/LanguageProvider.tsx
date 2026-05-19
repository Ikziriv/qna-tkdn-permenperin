import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Language } from '../../../types';

/** Shape of the language context value. */
export interface LanguageContextType {
  /** Currently active language. */
  language: Language;
  /** Setter to change the active language. */
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * Hook to access the current language and setter.
 *
 * @throws If called outside of a LanguageProvider.
 */
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};

/** Props for the LanguageProvider component. */
export interface LanguageProviderProps {
  /** Default language on first mount. Defaults to 'id'. */
  defaultLanguage?: Language;
  /** Content wrapped by the provider. */
  children: React.ReactNode;
}

/**
 * Provider that manages the active application language.
 *
 * Persists the selection to localStorage under the key `tkdn_lang`.
 */
export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  defaultLanguage = 'id',
  children,
}) => {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('tkdn_lang');
    return (saved as Language) || defaultLanguage;
  });

  useEffect(() => {
    if (i18n.language && i18n.language !== language) {
      setLanguageState(i18n.language as Language);
    }
  }, [i18n.language]);

  const setLanguage = useCallback((lang: Language) => {
    i18n.changeLanguage(lang);
    setLanguageState(lang);
  }, [i18n]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
