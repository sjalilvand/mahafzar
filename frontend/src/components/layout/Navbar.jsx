import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Globe, Menu, X, Wallet, LifeBuoy, LayoutDashboard,
  Trophy, BarChart3, Shield, Briefcase, User, LogOut, ChevronDown, Palette
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import ThemeSwitcher from '../common/ThemeSwitcher';
import NotificationSystem from '../common/NotificationSystem';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userWrapRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (userWrapRef.current && !userWrapRef.current.contains(e.target)) setUserOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const handleLogout = () => { setUserOpen(false); setMobileOpen(false); logout(); navigate('/'); };
  const toggleLanguage = () => {
    const next = i18n.language === 'fa' ? 'en' : 'fa';
    i18n.changeLanguage(next);
    localStorage.setItem('i18nextLng', next);
    document.dir = next === 'fa' ? 'rtl' : 'ltr';
  };
  const langLabel = i18n.language === 'fa' ? 'EN' : 'فا';
  const isAdmin = !!(user && (user.role === 'admin' || user.is_admin));

  const mainLinks = [
    { to: '/about', label: t('about', 'درباره ما') },
    { to: '/courses', label: t('courses', 'آموزش‌ها') },
    { to: '/members', label: t('members', 'اعضا') },
    { to: '/forum', label: t('forum', 'انجمن') },
    { to: '/pricing', label: t('pricing', 'تعرفه') },
    { to: '/contact', label: t('contact', 'تماس با ما') },
  ];

  const userMenuItems = [
    { to: '/dashboard', label: t('dashboard', 'داشبورد'), icon: <LayoutDashboard size={16} /> },
    { to: '/gamification', label: t('gamification', 'بازی‌سازی'), icon: <Trophy size={16} /> },
    { to: '/analytics', label: t('analytics', 'تحلیل'), icon: <BarChart3 size={16} /> },
    { to: '/profile', label: t('profile', 'پروفایل'), icon: <User size={16} /> },
    { to: '/appearance', label: 'شخصی‌سازی ظاهر', icon: <Palette size={16} /> },
    ...(isAdmin ? [{ to: '/admin', label: t('admin_panel', 'پنل ادمین'), icon: <Shield size={16} /> }] : []),
    ...(isAdmin ? [{ to: '/admin/business', label: 'مدیریت تجاری', icon: <Briefcase size={16} /> }] : []),
  ];

  const cls = ({ isActive }) => 'nv-link' + (isActive ? ' active' : '');

  return (
    <motion.nav className="navbar" initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.5 }}>
      <div className="nav-content">
        <Link to="/" className="nav-logo">
          <Brain className="logo-icon" size={26} color="#00f2ff" />
          <span>{t('app_name', 'ماه‌افزار هوشمند رسا')}</span>
        </Link>

        <div className="nav-center">
          {mainLinks.map(l => <NavLink key={l.to} to={l.to} className={cls}>{l.label}</NavLink>)}
        </div>

        <div className="nav-actions">
          <Link to="/wallet" className="icon-btn" title="کیف پول"><Wallet size={18} /></Link>
          <Link to="/support" className="icon-btn" title="پشتیبانی"><LifeBuoy size={18} /></Link>
          <div className="ts-h"><ThemeSwitcher /></div>
          <button className="lang-btn" onClick={toggleLanguage} title="تغییر زبان">
            <Globe size={15} />{langLabel}
          </button>

          {user ? (
            <div className="user-menu-wrap" ref={userWrapRef}>
              <button className="user-btn" onClick={() => setUserOpen(o => !o)}>
                <img loading="lazy" decoding="async" src={user.avatar_url || '/default-avatar.png'} alt="" />
                <ChevronDown size={14} className={userOpen ? 'rot' : ''} />
              </button>
              <AnimatePresence>
                {userOpen && (
                  <motion.div className="user-dropdown"
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                    <div className="ud-head">
                      <b>{user.full_name || user.username || 'کاربر'}</b>
                      <small>{user.email || ''}</small>
                    </div>
                    {userMenuItems.map(it => (
                      <Link key={it.to} to={it.to} className="ud-item" onClick={() => setUserOpen(false)}>
                        {it.icon}<span>{it.label}</span>
                      </Link>
                    ))}
                    <button className="ud-item danger" onClick={handleLogout}>
                      <LogOut size={16} /><span>{t('logout', 'خروج')}</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-auth ghost">{t('login', 'ورود')}</Link>
              <Link to="/signup" className="btn-auth solid">{t('signup', 'ثبت‌نام')}</Link>
            </>
          )}

          {user && <span className="desktop-only notif-slot"><NotificationSystem /></span>}

          <button className="hamburger" onClick={() => setMobileOpen(o => !o)} aria-label="menu">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="mobile-menu"
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {mainLinks.map(l => (
              <NavLink key={l.to} to={l.to} className={cls} onClick={() => setMobileOpen(false)}>{l.label}</NavLink>
            ))}
            <div className="mm-sep" />
            <Link to="/wallet" className="mm-item" onClick={() => setMobileOpen(false)}><Wallet size={16} /><span>کیف پول</span></Link>
            <Link to="/support" className="mm-item" onClick={() => setMobileOpen(false)}><LifeBuoy size={16} /><span>پشتیبانی</span></Link>
            {user && userMenuItems.map(it => (
              <Link key={it.to} to={it.to} className="mm-item" onClick={() => setMobileOpen(false)}>{it.icon}<span>{it.label}</span></Link>
            ))}
            <div className="mm-sep" />
            <div className="mm-row">
              <div className="ts-h"><ThemeSwitcher /></div>
              <button className="lang-btn" onClick={toggleLanguage}><Globe size={15} />{langLabel}</button>
              {user ? (
                <button className="btn-auth solid" onClick={handleLogout}><LogOut size={15} />{t('logout', 'خروج')}</button>
              ) : (
                <Link to="/login" className="btn-auth ghost" onClick={() => setMobileOpen(false)}>{t('login', 'ورود')}</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;

