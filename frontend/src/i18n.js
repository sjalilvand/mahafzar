import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'fa',
    supportedLngs: ['fa', 'en', 'ar', 'de', 'fr', 'es', 'tr', 'ru'],

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json'
    },

    detection: {
      order: ['localStorage', 'cookie', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    },

    interpolation: {
      escapeValue: false
    },

    react: {
      useSuspense: false
    },

    ns: ['common', 'home', 'auth', 'courses', 'forum', 'profile', 'gamification', 'settings'],
    defaultNS: 'common'
  });

export default i18n;