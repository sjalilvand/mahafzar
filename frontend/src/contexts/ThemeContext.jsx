import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

const themes = {
  dark: {
    name: 'تاریک',
    colors: {
      bg: '#0b0917',
      surface: 'rgba(24, 18, 46, 0.6)',
      text: '#e2e8f0',
      textMuted: '#94a3b8',
      primary: '#8b5cf6',
      secondary: '#6366f1',
      accent: '#d946ef',
      glow: '0 0 30px rgba(139, 92, 246, 0.5)',
    }
  },
  light: {
    name: 'روشن',
    colors: {
      bg: '#f6f7fb',
      surface: 'rgba(255, 255, 255, 0.92)',
      text: '#1e293b',
      textMuted: '#64748b',
      primary: '#7c3aed',
      secondary: '#6366f1',
      accent: '#d946ef',
      glow: '0 0 30px rgba(124, 58, 237, 0.3)',
    }
  },
  cyberpunk: {
    name: 'سایبرپانک',
    colors: {
      bg: '#0d0221',
      surface: 'rgba(20, 5, 40, 0.8)',
      text: '#ff00ff',
      textMuted: '#ff6600',
      primary: '#00ffff',
      secondary: '#ff00ff',
      accent: '#ffff00',
      glow: '0 0 40px rgba(255, 0, 255, 0.8)',
    }
  }
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    const theme = themes[currentTheme];
    const root = document.documentElement;

    root.style.setProperty('--bg', theme.colors.bg);
    root.style.setProperty('--surface', theme.colors.surface);
    root.style.setProperty('--text', theme.colors.text);
    root.style.setProperty('--text-muted', theme.colors.textMuted);
    root.style.setProperty('--primary', theme.colors.primary);
    root.style.setProperty('--secondary', theme.colors.secondary);
    root.style.setProperty('--accent', theme.colors.accent);
    root.style.setProperty('--glow', theme.colors.glow);

    localStorage.setItem('theme', currentTheme);
    // همگام‌سازی با SettingsContext تا دو سیستم تم با هم نجنگند
    try {
      const s = JSON.parse(localStorage.getItem('app_settings') || '{}');
      if (s.theme !== currentTheme) {
        s.theme = currentTheme;
        localStorage.setItem('app_settings', JSON.stringify(s));
      }
    } catch (e) { /* noop */ }
    // فقط کلاس تم را عوض می‌کنیم؛ کلاس‌های font/density حفظ می‌شوند
    const rest = document.body.className.replace(/theme-\w+/g, '').trim();
    document.body.className = `theme-${currentTheme}${rest ? ' ' + rest : ''}`;
  }, [currentTheme]);

  const changeTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  return (
    <ThemeContext.Provider value={{
      theme: currentTheme,
      themeData: themes[currentTheme],
      changeTheme,
      availableThemes: Object.keys(themes).map(key => ({
        id: key,
        name: themes[key].name
      }))
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);