import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

const themes = {
  dark: {
    name: 'تاریک',
    colors: {
      bg: '#0a0a0f',
      surface: 'rgba(15, 20, 35, 0.6)',
      text: '#e2e8f0',
      textMuted: '#94a3b8',
      primary: '#00f2ff',
      secondary: '#4d4dff',
      accent: '#ff006e',
      glow: '0 0 30px rgba(0, 242, 255, 0.5)',
    }
  },
  light: {
    name: 'روشن',
    colors: {
      bg: '#f0f4f8',
      surface: 'rgba(255, 255, 255, 0.9)',
      text: '#1a202c',
      textMuted: '#4a5568',
      primary: '#0066cc',
      secondary: '#5533ff',
      accent: '#ff006e',
      glow: '0 0 30px rgba(0, 102, 204, 0.3)',
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
    document.body.className = `theme-${currentTheme}`;
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