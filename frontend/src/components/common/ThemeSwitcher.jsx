// frontend/src/components/common/ThemeSwitcher.jsx
// MahAI round-10 — نسخه فشرده: یک دکمه + منوی کشویی (به‌جای ۴ دکمه همیشه‌نمایان)
// تا نوار بالا شلوغ نشود؛ همان ThemeContext قبلی، فقط UI جمع‌وجورتر

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon, Zap, Sunset, Palette, Check } from 'lucide-react';

const icons = {
  dark: Moon,
  light: Sun,
  cyberpunk: Zap,
  sunset: Sunset,
};

const ThemeSwitcher = () => {
  const { theme, changeTheme, availableThemes } = useTheme();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const CurIcon = icons[theme] || Palette;

  return (
    <div className="theme-switcher ts-compact" ref={wrapRef}>
      <button type="button" className="ts-btn-cur" onClick={() => setOpen(o => !o)}
              title="تغییر تم" aria-label="تغییر تم" aria-expanded={open}>
        <CurIcon size={17} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="ts-menu"
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}>
            {availableThemes.map(t => {
              const Ic = icons[t.id] || Palette;
              return (
                <button type="button" key={t.id}
                        className={'ts-item' + (theme === t.id ? ' active' : '')}
                        onClick={() => { changeTheme(t.id); setOpen(false); }}>
                  <span className="ts-item-ic"><Ic size={15} /></span>
                  <span className="ts-item-name">{t.name}</span>
                  {theme === t.id && <Check size={14} className="ts-item-check" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeSwitcher;
