// frontend/src/components/common/ThemeSwitcher.jsx
// MahAI round-10 — نسخه فشرده: یک دکمه + منوی کشویی
// round-11 — بخش انتخاب فونت فارسی هم به همین منو اضافه شد تا نوار بالا شلوغ نشود

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../contexts/SettingsContext';
import { Sun, Moon, Zap, Sunset, Palette, Check, Type } from 'lucide-react';

const icons = {
  dark: Moon,
  light: Sun,
  cyberpunk: Zap,
  sunset: Sunset,
};

const ThemeSwitcher = () => {
  const { theme, changeTheme, availableThemes } = useTheme();
  const { settings, updateSettings, availableFonts } = useSettings();
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

  const pickFont = (f) => {
    updateSettings({ font: { ...settings.font, family: f.family, name: f.name } });
  };

  return (
    <div className="theme-switcher ts-compact" ref={wrapRef}>
      <button type="button" className="ts-btn-cur" onClick={() => setOpen(o => !o)}
              title="تم و فونت" aria-label="تم و فونت" aria-expanded={open}>
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
                        onClick={() => { changeTheme(t.id); }}>
                  <span className="ts-item-ic"><Ic size={15} /></span>
                  <span className="ts-item-name">{t.name}</span>
                  {theme === t.id && <Check size={14} className="ts-item-check" />}
                </button>
              );
            })}

            {/* ===== round-11: انتخاب فونت فارسی ===== */}
            <div className="ts-divider" role="separator" />
            <div className="ts-cap"><Type size={12} /> فونت فارسی</div>
            {availableFonts.map(f => {
              const active = settings.font.family === f.family;
              return (
                <button type="button" key={f.name}
                        className={'ts-item ts-font-item' + (active ? ' active' : '')}
                        style={{ fontFamily: f.family }}
                        onClick={() => pickFont(f)}
                        title={f.desc || ''}>
                  <span className="ts-item-name">{f.label}</span>
                  {active && <Check size={14} className="ts-item-check" />}
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
