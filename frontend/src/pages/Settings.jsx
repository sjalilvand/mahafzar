import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../contexts/SettingsContext';
import {
  Palette, Type, Layout, Globe, Bell, Shield,
  Eye, Monitor, Smartphone, Download, Upload,
  RotateCcw, Check, X, Sun, Moon, PaintBucket,
  AlignLeft, Grid, Sliders, Volume2, Vibrate
} from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const {
    settings, updateSettings, updateColor, setTheme,
    resetSettings, exportSettings, importSettings,
    availableFonts, predefinedThemes, availableLanguages
  } = useSettings();

  const [activeTab, setActiveTab] = useState('appearance');
  const [previewTheme, setPreviewTheme] = useState(null);

  const tabs = [
    { id: 'appearance', icon: <Palette size={20} />, label: t('settings.appearance.title') },
    { id: 'typography', icon: <Type size={20} />, label: 'فونت و تایپوگرافی' },
    { id: 'language', icon: <Globe size={20} />, label: t('settings.language.title') },
    { id: 'notifications', icon: <Bell size={20} />, label: t('settings.notifications.title') },
    { id: 'layout', icon: <Layout size={20} />, label: 'چیدمان' },
    { id: 'privacy', icon: <Shield size={20} />, label: t('settings.privacy.title') },
  ];

  const changeLanguage = (langCode) => {
    const lang = availableLanguages.find(l => l.code === langCode);
    if (lang) {
      i18n.changeLanguage(langCode);
      updateSettings({
        language: langCode,
        direction: lang.direction
      });
      document.dir = lang.direction;
    }
  };

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (file) importSettings(file);
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>{t('settings.title')}</h1>
        <p>ظاهر و عملکرد سایت را مطابق سلیقه خود تنظیم کنید</p>
        <div className="settings-header-actions">
          <button onClick={exportSettings} className="btn-outline">
            <Download size={16} /> دریافت تنظیمات
          </button>
          <label className="btn-outline">
            <Upload size={16} /> بارگذاری تنظیمات
            <input type="file" accept=".json" onChange={handleFileImport} hidden />
          </label>
          <button onClick={resetSettings} className="btn-outline btn-danger">
            <RotateCcw size={16} /> بازنشانی
          </button>
        </div>
      </div>

      <div className="settings-layout">
        {/* Sidebar Tabs */}
        <div className="settings-sidebar glass-card">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {activeTab === tab.id && <div className="active-indicator" />}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="settings-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* ===== APPEARANCE ===== */}
              {activeTab === 'appearance' && (
                <div className="settings-section">
                  <h3>{t('settings.appearance.title')}</h3>

                  {/* Theme Selection */}
                  <div className="setting-group">
                    <h4>{t('settings.appearance.theme')}</h4>
                    <div className="theme-grid">
                      {Object.entries(predefinedThemes).map(([key, theme]) => (
                        <motion.button
                          key={key}
                          className={`theme-card ${settings.theme === key ? 'active' : ''}`}
                          onClick={() => setTheme(key)}
                          onMouseEnter={() => setPreviewTheme(key)}
                          onMouseLeave={() => setPreviewTheme(null)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className="theme-preview" style={{
                            background: theme.colors.background,
                            border: `2px solid ${theme.colors.primary}`
                          }}>
                            <div className="theme-preview-header" style={{
                              background: theme.colors.surface
                            }} />
                            <div className="theme-preview-body">
                              <div className="preview-block" style={{
                                background: theme.colors.primary
                              }} />
                              <div className="preview-block" style={{
                                background: theme.colors.secondary
                              }} />
                            </div>
                          </div>
                          <span className="theme-name">{theme.name}</span>
                          {settings.theme === key && (
                            <Check size={16} className="theme-check" />
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Colors */}
                  <div className="setting-group">
                    <h4>رنگ‌های سفارشی</h4>
                    <div className="color-grid">
                      {Object.entries(settings.customColors).map(([key, value]) => (
                        <div key={key} className="color-item">
                          <label>{key}</label>
                          <div className="color-input-group">
                            <input
                              type="color"
                              value={value}
                              onChange={(e) => updateColor(key, e.target.value)}
                            />
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => updateColor(key, e.target.value)}
                              className="color-hex-input"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Glass Effect */}
                  <div className="setting-group">
                    <h4>افکت شیشه‌ای</h4>
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={settings.glassEffect}
                        onChange={(e) => updateSettings({ glassEffect: e.target.checked })}
                      />
                      <span className="toggle-slider" />
                      <span>فعال‌سازی Glassmorphism</span>
                    </label>
                  </div>

                  {/* Border Radius */}
                  <div className="setting-group">
                    <h4>گردی گوشه‌ها</h4>
                    <input
                      type="range"
                      min="0"
                      max="24"
                      value={settings.borderRadius}
                      onChange={(e) => updateSettings({ borderRadius: parseInt(e.target.value) })}
                      className="range-slider"
                    />
                    <span>{settings.borderRadius}px</span>
                    <div className="border-radius-preview" style={{
                      borderRadius: `${settings.borderRadius}px`,
                      background: settings.customColors.primary,
                      width: '60px',
                      height: '60px',
                      marginTop: '10px'
                    }} />
                  </div>
                </div>
              )}

              {/* ===== TYPOGRAPHY ===== */}
              {activeTab === 'typography' && (
                <div className="settings-section">
                  <h3>فونت و تایپوگرافی</h3>

                  {/* Font Family */}
                  <div className="setting-group">
                    <h4>فونت</h4>
                    <div className="font-grid">
                      {availableFonts.map(font => (
                        <button
                          key={font.name}
                          className={`font-card ${settings.font.family === font.family ? 'active' : ''}`}
                          onClick={() => updateSettings({
                            font: { ...settings.font, family: font.family }
                          })}
                          style={{ fontFamily: font.family }}
                        >
                          <span className="font-sample">آ ب پ</span>
                          <span className="font-name">{font.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Size */}
                  <div className="setting-group">
                    <h4>{t('settings.appearance.font_size')}</h4>
                    <div className="size-options">
                      {['small', 'medium', 'large', 'xlarge'].map(size => (
                        <button
                          key={size}
                          className={`size-btn ${settings.font.size === size ? 'active' : ''}`}
                          onClick={() => updateSettings({
                            font: { ...settings.font, size }
                          })}
                          style={{ fontSize: size === 'small' ? '14px' : size === 'medium' ? '16px' : size === 'large' ? '18px' : '20px' }}
                        >
                          {t(`settings.appearance.font_sizes.${size}`)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Line Height */}
                  <div className="setting-group">
                    <h4>فاصله خطوط</h4>
                    <input
                      type="range"
                      min="1.2"
                      max="2.5"
                      step="0.1"
                      value={settings.font.lineHeight}
                      onChange={(e) => updateSettings({
                        font: { ...settings.font, lineHeight: parseFloat(e.target.value) }
                      })}
                      className="range-slider"
                    />
                    <span>{settings.font.lineHeight}</span>
                  </div>
                </div>
              )}

              {/* ===== LANGUAGE ===== */}
              {activeTab === 'language' && (
                <div className="settings-section">
                  <h3>{t('settings.language.title')}</h3>

                  <div className="setting-group">
                    <h4>{t('settings.language.language')}</h4>
                    <div className="language-grid">
                      {availableLanguages.map(lang => (
                        <motion.button
                          key={lang.code}
                          className={`language-card ${settings.language === lang.code ? 'active' : ''}`}
                          onClick={() => changeLanguage(lang.code)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="lang-flag">
                            {lang.code === 'fa' ? '🇮🇷' :
                             lang.code === 'en' ? '🇺🇸' :
                             lang.code === 'ar' ? '🇸🇦' :
                             lang.code === 'de' ? '🇩🇪' :
                             lang.code === 'fr' ? '🇫🇷' :
                             lang.code === 'es' ? '🇪🇸' : '🌐'}
                          </span>
                          <span className="lang-name">{lang.native}</span>
                          <span className="lang-code">{lang.code.toUpperCase()}</span>
                          {settings.language === lang.code && (
                            <Check size={16} className="lang-check" />
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="setting-group">
                    <h4>جهت</h4>
                    <div className="direction-options">
                      <button
                        className={settings.direction === 'rtl' ? 'active' : ''}
                        onClick={() => updateSettings({ direction: 'rtl' })}
                      >
                        <AlignLeft size={16} /> راست به چپ
                      </button>
                      <button
                        className={settings.direction === 'ltr' ? 'active' : ''}
                        onClick={() => updateSettings({ direction: 'ltr' })}
                      >
                        <AlignLeft size={16} className="flip" /> چپ به راست
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== LAYOUT ===== */}
              {activeTab === 'layout' && (
                <div className="settings-section">
                  <h3>چیدمان</h3>

                  <div className="setting-group">
                    <h4>تراکم</h4>
                    <div className="density-options">
                      {['compact', 'comfortable', 'spacious'].map(density => (
                        <button
                          key={density}
                          className={`density-card ${settings.density === density ? 'active' : ''}`}
                          onClick={() => updateSettings({ density })}
                        >
                          <Grid size={20} />
                          <span>{t(`settings.appearance.densities.${density}`)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="setting-group">
                    <h4>موقعیت نوار کناری</h4>
                    <div className="direction-options">
                      <button
                        className={settings.sidebarPosition === 'right' ? 'active' : ''}
                        onClick={() => updateSettings({ sidebarPosition: 'right' })}
                      >
                        راست
                      </button>
                      <button
                        className={settings.sidebarPosition === 'left' ? 'active' : ''}
                        onClick={() => updateSettings({ sidebarPosition: 'left' })}
                      >
                        چپ
                      </button>
                    </div>
                  </div>

                  <div className="setting-group">
                    <h4>انیمیشن‌ها</h4>
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={settings.animations}
                        onChange={(e) => updateSettings({ animations: e.target.checked })}
                      />
                      <span className="toggle-slider" />
                      <span>فعال‌سازی انیمیشن‌ها</span>
                    </label>
                    <label className="toggle-label" style={{ marginTop: '15px' }}>
                      <input
                        type="checkbox"
                        checked={settings.reducedMotion}
                        onChange={(e) => updateSettings({ reducedMotion: e.target.checked })}
                      />
                      <span className="toggle-slider" />
                      <span>کاهش حرکت</span>
                    </label>
                  </div>
                </div>
              )}

              {/* ===== PRIVACY ===== */}
              {activeTab === 'privacy' && (
                <div className="settings-section">
                  <h3>{t('settings.privacy.title')}</h3>

                  <div className="setting-group">
                    <h4>نمایش پروفایل</h4>
                    <select
                      value={settings.profileVisibility || 'public'}
                      onChange={(e) => updateSettings({ profileVisibility: e.target.value })}
                      className="settings-select"
                    >
                      <option value="public">عمومی</option>
                      <option value="members">فقط اعضا</option>
                      <option value="private">خصوصی</option>
                    </select>
                  </div>

                  <div className="setting-group">
                    <label className="toggle-label">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider" />
                      <span>نمایش ایمیل در پروفایل</span>
                    </label>
                  </div>

                  <div className="setting-group">
                    <button className="btn-outline">
                      <Download size={16} /> دریافت داده‌های من
                    </button>
                    <button className="btn-outline btn-danger" style={{ marginTop: '15px' }}>
                      حذف حساب کاربری
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Settings;