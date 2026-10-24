import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const SettingsContext = createContext();

const defaultSettings = {
  theme: 'dark',
  customColors: {
    primary: '#8b5cf6',
    secondary: '#6366f1',
    accent: '#d946ef',
    background: '#0b0917',
    surface: '#181230',
    text: '#e2e8f0',
    textMuted: '#94a3b8',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  font: {
    family: "'Estedad', sans-serif",   // round-11: فونت پیش‌فرض جدید
    name: 'Estedad',
    size: 'medium',
    lineHeight: 1.8,
    letterSpacing: 0,
  },
  density: 'comfortable',
  animations: true,
  reducedMotion: false,
  borderRadius: 12,
  glassEffect: true,
  sidebarPosition: 'right',
  language: 'fa',
  direction: 'rtl',
  calendar: 'jalali',
  timezone: 'Asia/Tehran',
  numberFormat: 'fa-IR',
};

// round-11: فقط فونت‌هایی که واقعاً در برنامه لود شده‌اند (index.html / index.css)
// round-12: ۵ فونت جدید (گندم، تنها، پرستو، گلزار نستعلیق، نسخ) — مجموع ۱۲ فونت فارسی
const availableFonts = [
  { name: 'Estedad',     family: "'Estedad', sans-serif",      label: 'استعداد',     desc: 'مدرن و خوانا — پیش‌فرض' },
  { name: 'Vazirmatn',   family: "'Vazirmatn', sans-serif",    label: 'وزیرمتن',     desc: 'استاندارد و رسمی' },
  { name: 'Shabnam',     family: "'Shabnam', sans-serif",      label: 'شبنم',        desc: 'لطیف و مدرن' },
  { name: 'Sahel',       family: "'Sahel', sans-serif",        label: 'ساحل',        desc: 'سبک و ساده' },
  { name: 'Samim',       family: "'Samim', sans-serif",        label: 'صمیم',        desc: 'گرم و دوستانه' },
  { name: 'Gandom',      family: "'Gandom', sans-serif",       label: 'گندم',        desc: 'خوش‌فرم و مطالعاتی' },
  { name: 'Tanha',       family: "'Tanha', sans-serif",        label: 'تنها',        desc: 'ظریف و مینیمال' },
  { name: 'Parastoo',    family: "'Parastoo', sans-serif",     label: 'پرستو',       desc: 'ادبی و شاعرانه' },
  { name: 'Lalezar',     family: "'Lalezar', cursive",         label: 'لاله‌زار',    desc: 'نمایشی و پررنگ' },
  { name: 'Gulzar',      family: "'Gulzar', serif",            label: 'گلزار نستعلیق', desc: 'نستعلیق و هنری' },
  { name: 'Noto Naskh Arabic', family: "'Noto Naskh Arabic', serif", label: 'نسخ',    desc: 'نسخ کلاسیک و خوانا' },
  { name: 'Markazi Text', family: "'Markazi Text', serif",     label: 'مرکزی',       desc: 'کلاسیک و مطالعاتی' },
];

// فونت‌های قدیمی که هیچ‌وقت واقعاً لود نمی‌شدند در migrateFont به فونت جدید نگاشت می‌شوند
const migrateFont = (font) => {
  if (!font || !font.family) return { ...defaultSettings.font };
  const known = availableFonts.some(f => f.family === font.family);
  if (known) return font;
  const legacyName = availableFonts.find(f => f.name === font.name);
  if (legacyName) return { ...font, family: legacyName.family, name: legacyName.name };
  return { ...font, family: defaultSettings.font.family, name: defaultSettings.font.name };
};

const predefinedThemes = {
  dark: {
    name: 'تاریک',
    colors: {
      primary: '#8b5cf6',
      secondary: '#6366f1',
      accent: '#d946ef',
      background: '#0b0917',
      surface: '#181230',
      text: '#e2e8f0',
      textMuted: '#94a3b8',
    },
  },
  light: {
    name: 'روشن',
    colors: {
      primary: '#7c3aed',
      secondary: '#6366f1',
      accent: '#d946ef',
      background: '#f6f7fb',
      surface: '#ffffff',
      text: '#1e293b',
      textMuted: '#64748b',
    },
  },
  cyberpunk: {
    name: 'سایبرپانک',
    colors: {
      primary: '#00ffff',
      secondary: '#ff00ff',
      accent: '#ffff00',
      background: '#0d0221',
      surface: '#150533',
      text: '#00ffff',
      textMuted: '#ff6600',
    },
  },
  nature: {
    name: 'طبیعت',
    colors: {
      primary: '#10b981',
      secondary: '#059669',
      accent: '#f59e0b',
      background: '#0f1a0f',
      surface: '#1a2f1a',
      text: '#d1fae5',
      textMuted: '#6ee7b7',
    },
  },
  ocean: {
    name: 'اقیانوس',
    colors: {
      primary: '#0ea5e9',
      secondary: '#0284c7',
      accent: '#38bdf8',
      background: '#0c1929',
      surface: '#162d4a',
      text: '#e0f2fe',
      textMuted: '#7dd3fc',
    },
  },
  sunset: {
    name: 'غروب',
    colors: {
      primary: '#f97316',
      secondary: '#ef4444',
      accent: '#fbbf24',
      background: '#1a0a0a',
      surface: '#2d1515',
      text: '#fef3c7',
      textMuted: '#fdba74',
    },
  },
  midnight: {
    name: 'نیمه‌شب',
    colors: {
      primary: '#8b5cf6',
      secondary: '#6366f1',
      accent: '#a78bfa',
      background: '#0f0720',
      surface: '#1a1035',
      text: '#ede9fe',
      textMuted: '#a78bfa',
    },
  },
  rose: {
    name: 'رز',
    colors: {
      primary: '#f43f5e',
      secondary: '#e11d48',
      accent: '#fb7185',
      background: '#1a0508',
      surface: '#2d0d12',
      text: '#ffe4e6',
      textMuted: '#fda4af',
    },
  },
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('app_settings');
      if (!saved) return defaultSettings;
      const parsed = { ...defaultSettings, ...JSON.parse(saved) };
      // round-11: مهاجرت فونت‌های قدیمی/ناشناخته به فونت جدید
      parsed.font = migrateFont(parsed.font);
      return parsed;
    } catch (e) {
      return defaultSettings;
    }
  });

  useEffect(() => {
    applySettings(settings);
  }, [settings]);

  const applySettings = (s) => {
    const root = document.documentElement;

    // Apply colors
    Object.entries(s.customColors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Apply typography (هم‌گام با سیستم appearance قدیمی تا دو سیستم نجنگند)
    root.style.setProperty('--font-family', s.font.family);
    root.style.setProperty('--ap-font', s.font.family);
    root.style.setProperty('--font-size', getFontSize(s.font.size));
    root.style.setProperty('--line-height', s.font.lineHeight);
    root.style.setProperty('--letter-spacing', `${s.font.letterSpacing}px`);
    // round-12: فونت نمودارهای Chart.js هم هم‌گام شود (رویداد سراسری + مقدار سراسری)
    try {
      window.dispatchEvent(new CustomEvent('mahafzar:font-changed', { detail: { family: s.font.family } }));
      window.__mahafzarFontFamily = s.font.family;
    } catch (e) { /* noop */ }

    // Apply density
    root.style.setProperty('--spacing-unit', getSpacingUnit(s.density));

    // Apply animations
    root.style.setProperty('--animation-duration', s.animations ? '0.3s' : '0s');
    root.style.setProperty('--transition-duration', s.reducedMotion ? '0s' : '0.3s');

    // Apply border radius
    root.style.setProperty('--border-radius', `${s.borderRadius}px`);

    // Apply direction
    document.dir = s.direction;

    // Set body class (use font.name which is now guaranteed)
    const fontName = s.font.name ? s.font.name.toLowerCase() : 'vazir';
    // تم از منبع واحد می‌آید: ThemeSwitcher آن را در localStorage.theme ذخیره می‌کند
    // تا دو سیستم تم (SettingsContext و ThemeContext) با هم نجنگند
    let uiTheme = s.theme;
    try {
      const lsTheme = localStorage.getItem('theme');
      if (lsTheme && predefinedThemes[lsTheme]) uiTheme = lsTheme;
    } catch (e) { /* noop */ }
    document.body.className = `theme-${uiTheme} font-${fontName} density-${s.density}`;

    // Save (تم واقعی اعمال‌شده ذخیره شود تا بعد از رفرش هم درست بماند)
    localStorage.setItem('app_settings', JSON.stringify({ ...s, theme: uiTheme }));
  };

  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => {
      // اگر font.family تغییر کرد، name هم بر اساس availableFonts به‌روز شود
      if (newSettings.font && newSettings.font.family) {
        const matched = availableFonts.find(f => f.family === newSettings.font.family);
        if (matched) {
          newSettings.font.name = matched.name;
        }
      }
      return { ...prev, ...newSettings };
    });
  }, []);

  const updateColor = useCallback((colorKey, value) => {
    setSettings(prev => ({
      ...prev,
      customColors: { ...prev.customColors, [colorKey]: value },
    }));
  }, []);

  const setTheme = useCallback((themeName) => {
    const theme = predefinedThemes[themeName];
    if (theme) {
      setSettings(prev => ({
        ...prev,
        theme: themeName,
        customColors: { ...prev.customColors, ...theme.colors },
      }));
    }
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  const exportSettings = useCallback(() => {
    const dataStr = JSON.stringify(settings, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mahafzar-settings.json';
    a.click();
  }, [settings]);

  const importSettings = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        // اطمینان از وجود font.name
        if (!imported.font || !imported.font.name) {
          imported.font = { ...imported.font, name: 'Vazir' };
        }
        setSettings({ ...defaultSettings, ...imported });
      } catch (err) {
        console.error('Invalid settings file');
      }
    };
    reader.readAsText(file);
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        updateColor,
        setTheme,
        resetSettings,
        exportSettings,
        importSettings,
        availableFonts,
        predefinedThemes,
        availableLanguages: [
          { code: 'fa', name: 'فارسی', native: 'فارسی', direction: 'rtl' },
          { code: 'en', name: 'English', native: 'English', direction: 'ltr' },
          { code: 'ar', name: 'Arabic', native: 'العربية', direction: 'rtl' },
          { code: 'de', name: 'German', native: 'Deutsch', direction: 'ltr' },
          { code: 'fr', name: 'French', native: 'Français', direction: 'ltr' },
          { code: 'es', name: 'Spanish', native: 'Español', direction: 'ltr' },
          { code: 'tr', name: 'Turkish', native: 'Türkçe', direction: 'ltr' },
          { code: 'ru', name: 'Russian', native: 'Русский', direction: 'ltr' },
        ],
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

// Helper functions
function getFontSize(size) {
  const sizes = {
    small: '14px',
    medium: '16px',
    large: '18px',
    xlarge: '20px',
  };
  return sizes[size] || sizes.medium;
}

function getSpacingUnit(density) {
  const units = {
    compact: '4px',
    comfortable: '8px',
    spacious: '12px',
  };
  return units[density] || units.comfortable;
}