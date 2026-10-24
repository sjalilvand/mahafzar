import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Globe, Menu, X, Wallet, LifeBuoy, LayoutDashboard,
  Trophy, BarChart3, Shield, Briefcase, User, LogOut, ChevronDown, Palette, Store,
  Search, Package, Bot, Puzzle, Code2, Sparkles, TrendingUp, Percent, ShoppingBag, Heart, Scale,
  GraduationCap, Newspaper, MessagesSquare, Users, Mail, Info, Volume2, VolumeX
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { soundApi } from '../../sound';
import ThemeSwitcher from '../common/ThemeSwitcher';
import NotificationSystem from '../common/NotificationSystem';
import './Navbar.css';
import CartIcon from '../common/CartIcon';
import WishlistIcon from '../common/WishlistIcon';
import CompareIcon from '../common/CompareIcon';
import client from '../../api/client';

/* ── MahAI round-10: منوی دسته‌بندی‌شده ─────────────────────────────
   ۸ لینک همیشه‌نمایان → ۵ آیتم مرتب: فروشگاه (مگا) + ۳ گروه کشویی + درباره ما */

const Navbar = () => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(null);
  const [sndOff, setSndOff] = useState(soundApi.isMuted());
  const [q, setQ] = useState('');
  const [cats, setCats] = useState([]);
  const userWrapRef = useRef(null);
  const megaRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (userWrapRef.current && !userWrapRef.current.contains(e.target)) setUserOpen(false);
      if (megaRef.current && !megaRef.current.contains(e.target)) setMegaOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    client.get('/shop/categories')
      .then(r => setCats(r.data.categories || []))
      .catch(() => {});
  }, []);

  const catIcon = (name) => {
    const n = name || '';
    if (n.includes('هوش مصنوعی')) return <Bot size={17} />;
    if (n.includes('پلاگین') || n.includes('افزونه')) return <Puzzle size={17} />;
    if (n.includes('نرم')) return <Code2 size={17} />;
    return <Package size={17} />;
  };

  const handleLogout = () => { setUserOpen(false); setMobileOpen(false); logout(); navigate('/'); };
  const toggleLanguage = () => {
    const next = i18n.language === 'fa' ? 'en' : 'fa';
    i18n.changeLanguage(next);
    localStorage.setItem('i18nextLng', next);
    document.dir = next === 'fa' ? 'rtl' : 'ltr';
  };
  const toggleSound = () => setSndOff(soundApi.toggle());
  const langLabel = i18n.language === 'fa' ? 'EN' : 'فا';
  const isAdmin = !!(user && (user.role === 'admin' || user.is_admin));

  const doSearch = (e) => {
    e.preventDefault();
    const term = q.trim();
    navigate('/shop' + (term ? '?q=' + encodeURIComponent(term) : ''));
    setMobileOpen(false);
    setMegaOpen(false);
  };

  /* ── گروه‌های منوی دسکتاپ ── */
  const navGroups = [
    { type: 'link', to: '/shop', label: 'فروشگاه', mega: true },
    {
      type: 'drop', label: 'آموزش و مقالات', match: ['/courses', '/blog'],
      items: [
        { to: '/courses', label: 'آموزش‌ها', desc: 'دوره‌های ویدیویی تخصصی', icon: <GraduationCap size={16} /> },
        { to: '/blog', label: 'مقالات', desc: 'آخرین نوشته‌ها و اخبار', icon: <Newspaper size={16} /> },
      ],
    },
    {
      type: 'drop', label: 'جامعه', match: ['/forum', '/members'],
      items: [
        { to: '/forum', label: 'انجمن', desc: 'پرسش و پاسخ با کارشناسان', icon: <MessagesSquare size={16} /> },
        { to: '/members', label: 'اعضا', desc: 'متخصصان ماه‌افزار', icon: <Users size={16} /> },
      ],
    },
    {
      type: 'drop', label: 'خدمات', match: ['/pricing', '/support', '/contact'],
      items: [
        { to: '/pricing', label: 'تعرفه خدمات', desc: 'پلن‌ها و قیمت‌ها', icon: <Percent size={16} /> },
        { to: '/support', label: 'پشتیبانی', desc: 'تیکت و راهنمای سایت', icon: <LifeBuoy size={16} /> },
        { to: '/contact', label: 'تماس با ما', desc: 'راه‌های ارتباطی', icon: <Mail size={16} /> },
      ],
    },
    { type: 'link', to: '/about', label: t('about', 'درباره ما') },
  ];

  /* ── منوی موبایل: فهرست منظم با سرتیتر بخش‌ها ── */
  const mobileLinks = [
    { to: '/shop', label: 'فروشگاه', icon: <ShoppingBag size={16} /> },
    { cap: 'محتوا و جامعه' },
    { to: '/courses', label: 'آموزش‌ها', icon: <GraduationCap size={16} /> },
    { to: '/blog', label: 'مقالات', icon: <Newspaper size={16} /> },
    { to: '/forum', label: 'انجمن', icon: <MessagesSquare size={16} /> },
    { to: '/members', label: 'اعضا', icon: <Users size={16} /> },
    { cap: 'خدمات و ارتباط' },
    { to: '/pricing', label: 'تعرفه خدمات', icon: <Percent size={16} /> },
    { to: '/support', label: 'پشتیبانی', icon: <LifeBuoy size={16} /> },
    { to: '/contact', label: 'تماس با ما', icon: <Mail size={16} /> },
    { to: '/about', label: 'درباره ما', icon: <Info size={16} /> },
  ];

  const megaQuick = [
    { to: '/shop', label: 'همه محصولات', icon: <ShoppingBag size={15} /> },
    { to: '/shop?q=&sort=newest', label: 'جدیدترین‌ها', icon: <Sparkles size={15} /> },
    { to: '/shop?q=&sort=popular', label: 'پرفروش‌ترین‌ها', icon: <TrendingUp size={15} /> },
    { to: '/shop?q=&sort=discount', label: 'پرتخفیف‌ها', icon: <Percent size={15} /> },
  ];

  const userMenuItems = [
    { to: '/dashboard', label: t('dashboard', 'داشبورد'), icon: <LayoutDashboard size={16} /> },
    { to: '/gamification', label: t('gamification', 'بازی‌سازی'), icon: <Trophy size={16} /> },
    { to: '/analytics', label: t('analytics', 'تحلیل'), icon: <BarChart3 size={16} /> },
    { to: '/profile', label: t('profile', 'پروفایل'), icon: <User size={16} /> },
    { to: '/wallet', label: 'کیف پول', icon: <Wallet size={16} /> },
    { to: '/appearance', label: 'شخصی‌سازی ظاهر', icon: <Palette size={16} /> },
    ...(isAdmin ? [{ to: '/admin/shop', label: 'مدیریت فروشگاه', icon: <Store size={16} /> }] : []),
    ...(isAdmin ? [{ to: '/admin', label: t('admin_panel', 'پنل ادمین'), icon: <Shield size={16} /> }] : []),
    ...(isAdmin ? [{ to: '/admin/business', label: 'مدیریت تجاری', icon: <Briefcase size={16} /> }] : []),
  ];

  const cls = ({ isActive }) => 'nv-link' + (isActive ? ' active' : '');

  return (
    <motion.nav className="navbar" initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.5 }}>
      <div className="nav-content">
        <Link to="/" className="nav-logo">
          <Brain className="logo-icon" size={26} color="#8b5cf6" />
          <span>{t('app_name', 'ماه‌افزار هوشمند رسا')}</span>
        </Link>

        <div className="nav-center">
          {navGroups.map(g => g.type === 'drop' ? (
            <div key={g.label} className="nv-drop-wrap"
                 onMouseEnter={() => setDropOpen(g.label)}
                 onMouseLeave={() => setDropOpen(null)}>
              <button type="button"
                      className={'nv-link nv-drop-btn' + (g.match.some(m => pathname.startsWith(m)) ? ' active' : '')}
                      onClick={() => setDropOpen(o => o === g.label ? null : g.label)}>
                {g.label}
                <ChevronDown size={13} className={dropOpen === g.label ? 'rot' : ''} />
              </button>
              <AnimatePresence>
                {dropOpen === g.label && (
                  <motion.div className="nv-dd"
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                    {g.items.map(it => (
                      <Link key={it.to} to={it.to} className="nv-dd-item" onClick={() => setDropOpen(null)}>
                        <span className="nv-dd-ic">{it.icon}</span>
                        <span className="nv-dd-txt"><b>{it.label}</b><small>{it.desc}</small></span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : g.mega ? (
            <div key={g.to} className="mh-mega-wrap" ref={megaRef}
                 onMouseEnter={() => setMegaOpen(true)}
                 onMouseLeave={() => setMegaOpen(false)}>
              <NavLink to={g.to} className={cls} onClick={() => setMegaOpen(false)}>
                {g.label}
                <ChevronDown size={13} className={megaOpen ? 'rot' : ''} style={{ marginInlineStart: 4 }} />
              </NavLink>
              <AnimatePresence>
                {megaOpen && (
                  <motion.div className="mh-mega"
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                    <div className="mh-mega-col">
                      <div className="mh-mega-title">دسترسی سریع</div>
                      {megaQuick.map(it => (
                        <Link key={it.label} to={it.to} className="mh-mega-item" onClick={() => setMegaOpen(false)}>
                          <span className="mh-mega-ic">{it.icon}</span><span>{it.label}</span>
                        </Link>
                      ))}
                    </div>
                    <div className="mh-mega-col">
                      <div className="mh-mega-title">دسته‌بندی محصولات</div>
                      {cats.length === 0 && <span className="mh-mega-empty">در حال بارگذاری...</span>}
                      {cats.map(c => (
                        <Link key={c.slug} to={'/shop?cat=' + c.slug} className="mh-mega-item" onClick={() => setMegaOpen(false)}>
                          <span className="mh-mega-ic">{catIcon(c.name)}</span>
                          <span>{c.name}</span>
                          <small className="mh-mega-count">{c.count}</small>
                        </Link>
                      ))}
                    </div>
                    <div className="mh-mega-cta">
                      <div className="mh-mega-cta-t"><Sparkles size={16} /> فروش فوق‌العاده ماه‌افزار</div>
                      <p>تا ۳۰٪ تخفیف روی محصولات منتخب + ۶ ماه پشتیبانی رایگان</p>
                      <Link to="/shop?sort=discount" className="mh-mega-cta-btn" onClick={() => setMegaOpen(false)}>مشاهده تخفیف‌ها</Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <NavLink key={g.to} to={g.to} className={cls}>{g.label}</NavLink>
          ))}
        </div>

        <form className="mh-nav-search" onSubmit={doSearch} role="search">
          <Search size={15} className="mh-ns-ic" />
          <input value={q} onChange={e => setQ(e.target.value)}
                 placeholder="جستجو در محصولات..." aria-label="search" />
          <button type="submit">جستجو</button>
        </form>

        <div className="nav-actions">
          <CartIcon />
          <WishlistIcon />
          <CompareIcon />
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
                    <button className="ud-item" onClick={toggleSound}>
                      {sndOff ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      <span>افکت صدا: {sndOff ? 'خاموش' : 'روشن'}</span>
                    </button>
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
            <form className="mh-nav-search mh-nav-search-m" onSubmit={doSearch} role="search">
              <Search size={15} className="mh-ns-ic" />
              <input value={q} onChange={e => setQ(e.target.value)}
                     placeholder="جستجو در محصولات و خدمات..." aria-label="search" />
              <button type="submit">جستجو</button>
            </form>
            {mobileLinks.map((l, i) => l.cap ? (
              <div key={'cap' + i} className="mm-cap">{l.cap}</div>
            ) : (
              <NavLink key={l.to} to={l.to} className={cls} onClick={() => setMobileOpen(false)}>
                {l.icon}<span>{l.label}</span>
              </NavLink>
            ))}
            <div className="mm-sep" />
            <Link to="/wishlist" className="mm-item" onClick={() => setMobileOpen(false)}><Heart size={16} /><span>علاقه‌مندی‌ها</span></Link>
            <Link to="/compare" className="mm-item" onClick={() => setMobileOpen(false)}><Scale size={16} /><span>مقایسه محصولات</span></Link>
            <Link to="/wallet" className="mm-item" onClick={() => setMobileOpen(false)}><Wallet size={16} /><span>کیف پول</span></Link>
            {user && userMenuItems.map(it => (
              <Link key={it.to} to={it.to} className="mm-item" onClick={() => setMobileOpen(false)}>{it.icon}<span>{it.label}</span></Link>
            ))}
            {user && (
              <button className="mm-item" onClick={toggleSound}>
                {sndOff ? <VolumeX size={16} /> : <Volume2 size={16} />}
                <span>افکت صدا: {sndOff ? 'خاموش' : 'روشن'}</span>
              </button>
            )}
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
