import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Globe, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import ThemeSwitcher from '../common/ThemeSwitcher';
import NotificationSystem from '../common/NotificationSystem';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'fa' ? 'en' : 'fa';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('i18nextLng', nextLang);
    document.dir = nextLang === 'fa' ? 'rtl' : 'ltr';
  };

  // برچسب دکمه بر اساس زبان فعلی (نمایش زبان مقابل)
  const languageLabel = i18n.language === 'fa' ? 'English' : 'فارسی';

  return (
    <motion.nav
      className="navbar"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="nav-content">
        <Link to="/" className="logo">
          <Brain className="logo-icon" size={30} color="#00f2ff" />
          <span>{t('app_name')}</span>
        </Link>

        <div className="nav-links">
          <Link to="/about">{t('about')}</Link>
          <Link to="/courses">{t('courses')}</Link>
          <Link to="/members">{t('members')}</Link>
          <Link to="/forum">{t('forum')}</Link>
          <Link to="/pricing">{t('pricing')}</Link>
          <Link to="/contact">{t('contact')}</Link>

          {user ? (
            <>
              <Link to="/dashboard">{t('dashboard')}</Link>
              <Link to="/gamification">{t('gamification')}</Link>
              <Link to="/analytics">{t('analytics')}</Link>
              {user.role === 'admin' && <Link to="/admin">{t('admin_panel')}</Link>}
              <button onClick={handleLogout} className="btn-nav">{t('logout')}</button>
              <Link to="/profile" className="user-avatar-mini">
                <img loading="lazy" decoding="async" src={user.avatar_url || '/default-avatar.png'} alt={user.full_name} />
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-nav">{t('login')}</Link>
              <Link to="/signup" className="btn-nav">{t('signup')}</Link>
            </>
          )}

          {/* دکمهٔ یکپارچهٔ تغییر زبان */}
          <button onClick={toggleLanguage} className="btn-nav lang-toggle">
            <Globe size={18} style={{ marginRight: '5px' }} />
            {languageLabel}
          </button>

          <Link to="/support" className="nav-link">پشتیبانی</Link>
        <Link to="/wallet" className="nav-link">کیف پول</Link>
        <ThemeSwitcher />
          {user && <NotificationSystem />}
        </div>

        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ display: 'none' }}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <motion.div
          className="mobile-menu"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link to="/about">{t('about')}</Link>
          <Link to="/courses">{t('courses')}</Link>
          <Link to="/members">{t('members')}</Link>
          <Link to="/forum">{t('forum')}</Link>
          <Link to="/pricing">{t('pricing')}</Link>
          <Link to="/contact">{t('contact')}</Link>
          {user ? (
            <>
              <Link to="/dashboard">{t('dashboard')}</Link>
              <Link to="/gamification">{t('gamification')}</Link>
              <Link to="/analytics">{t('analytics')}</Link>
              {user.role === 'admin' && <Link to="/admin">{t('admin_panel')}</Link>}
              <button onClick={handleLogout} className="logout-btn-mobile">{t('logout')}</button>
            </>
          ) : (
            <>
              <Link to="/login">{t('login')}</Link>
              <Link to="/signup">{t('signup')}</Link>
            </>
          )}
          <button onClick={toggleLanguage} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginTop: '10px' }}>
            <Globe size={18} /> {languageLabel}
          </button>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;

