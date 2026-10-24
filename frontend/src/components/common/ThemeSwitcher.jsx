// frontend/src/components/common/ThemeSwitcher.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon, Zap, Sunset } from 'lucide-react';

const ThemeSwitcher = () => {
  const { theme, changeTheme, availableThemes } = useTheme();

  const icons = {
    dark: <Moon size={20} />,
    light: <Sun size={20} />,
    cyberpunk: <Zap size={20} />,
    sunset: <Sunset size={20} />
  };

  return (
    <div className="theme-switcher">
      {availableThemes.map(t => (
        <motion.button
          key={t.id}
          className={`theme-btn ${theme === t.id ? 'active' : ''}`}
          onClick={() => changeTheme(t.id)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title={t.name}
        >
          {icons[t.id]}
        </motion.button>
      ))}
    </div>
  );
};

export default ThemeSwitcher;