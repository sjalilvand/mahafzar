import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import './i18n'; // تنظیمات i18n
import './App.css';
import './appearance';

// پاک‌سازی خودکار Service Worker و کش‌های قدیمی فقط در حالت توسعه.
// اگر PWA قبلاً در dev ثبت شده باشد، SW کهنه صفحه‌ی کش‌شده را سرو می‌کند
// و با سرور خاموش، صفحه سفید + ERR_CONNECTION_REFUSED می‌دهد.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((regs) => regs.forEach((r) => r.unregister()))
    .catch(() => {});
  if (window.caches && typeof caches.keys === 'function') {
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .catch(() => {});
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </SettingsProvider>
    </BrowserRouter>
  </React.StrictMode>
);
