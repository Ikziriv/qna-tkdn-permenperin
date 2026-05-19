import 'react-i18next';
import type en from './locales/en.json';

type Resources = typeof en;

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: Resources;
    };
  }
}
