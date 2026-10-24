                            import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Link } from 'react-router-dom';
import axios from 'axios';
import client from '../api/client';
import { cartApi } from '../cartStore';
import { wishlistApi } from '../wishlistStore';
import Stars from '../components/common/Stars';
import {
  Brain, Shield, Database, Activity, Server, Cpu,
  Phone, Mail, MapPin, CheckCircle, Zap, ArrowRight,
  MessageCircle, ShieldCheck, Headset, RefreshCw, Wallet,
  Eye, ShoppingBag, Newspaper, ArrowLeft, Sparkles, TrendingUp, Heart
} from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL|| '')+'/api';
const fmt = n => new Intl.NumberFormat('fa-IR').format(n || 0);
const faNum = n => new Intl.NumberFormat('fa-IR').format(n);

// ============= ANIMATION VARIANTS =============
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

const scaleIn = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 }
  }
};

// ============= TYPING EFFECT =============
const TypingText = ({ text }) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayText(text.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [text]);

  return <span className="typing-text">{displayText}<span className="cursor">|</span></span>;
};

// ============= HELPER COMPONENTS =============
const AnimatedSection = ({ children, id, className }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <motion.section
      id={id}
      className={className}
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={staggerContainer}
    >
      {children}
    </motion.section>
  );
};

const FeatureCard = ({ icon, title }) => (
  <motion.div
    className="feature-card glass-card"
    variants={fadeInUp}
    whileHover={{ x: -10 }}
  >
    <div className="feature-icon">{icon}</div>
    <span>{title}</span>
  </motion.div>
);

const ServiceCard = ({ icon, title, desc }) => (
  <motion.div
    className="card"
    variants={scaleIn}
    whileHover={{ y: -15 }}
  >
    <motion.div
      className="service-icon"
      whileHover={{ rotate: 360 }}
      transition={{ duration: 0.6 }}
    >
      {icon}
    </motion.div>
    <h3>{title}</h3>
    <p>{desc}</p>
  </motion.div>
);

const StatCard = ({ number, label }) => (
  <motion.div className="stat" variants={scaleIn}>
    <strong>{number}</strong>
    <span>{label}</span>
  </motion.div>
);

// ============= ZHAKET-INSPIRED MARKETPLACE PIECES =============
const SectionHead = ({ title, desc, to }) => (
  <motion.div className="mh-sec-head" variants={fadeInUp}>
    <div>
      <h2 className="mh-sec-title">{title}</h2>
      {desc && <p className="mh-sec-desc">{desc}</p>}
    </div>
    {to && <Link to={to} className="mh-sec-more">مشاهده همه <ArrowLeft size={15} /></Link>}
  </motion.div>
);

const MarketCard = ({ p }) => (
  <motion.div className="mh-pcard" variants={fadeInUp} whileHover={{ y: -8 }}>
    <Link to={'/product/' + p.slug} className="mh-pcard-thumb">
      <div className={"shop-thumb t-" + (p.id % 5)}>
        <Sparkles size={30} strokeWidth={1.5} />
        {p.discount_percent > 0 && <span className="mh-pcard-disc">{p.discount_percent}٪</span>}
        {p.flash_active && <span className="mh-pcard-flash">فوق‌العاده</span>}
      </div>
    </Link>
    <button type="button"
            className={"mh-wish-btn mh-pcard-wish"}
            title="علاقه‌مندی"
            onClick={(e) => { e.preventDefault(); wishlistApi.toggle(p); }}>
      <Heart size={15} />
    </button>
    <div className="mh-pcard-body">
      <Link to={'/product/' + p.slug}><h3>{p.name}</h3></Link>
      <p>{p.short_desc}</p>
      <Stars rating={p.rating} count={p.rating_count} />
      <div className="mh-pcard-meta">
        <span><TrendingUp size={12} /> {fmt(p.sales_count)} فروش</span>
        {p.category && <span>{p.category}</span>}
      </div>
    </div>
    <div className="mh-pcard-price">
      {p.discount_percent > 0 && <del>{fmt(p.price)}</del>}
      <b>{fmt(p.final_price)}</b><small>تومان</small>
    </div>
    <div className="mh-pcard-actions">
      <Link to={'/product/' + p.slug} className="mh-pcard-preview"><Eye size={14} /> مشاهده</Link>
      <button onClick={() => cartApi.add(p)}><ShoppingBag size={14} /> خرید</button>
    </div>
  </motion.div>
);

const ArticleCard = ({ a }) => (
  <motion.div className="mh-acard" variants={fadeInUp} whileHover={{ y: -8 }}>
    <div className="mh-acard-top">
      <span className="mh-acard-ic"><Newspaper size={18} /></span>
      <small>{new Date(a.created_at).toLocaleDateString('fa-IR')}</small>
    </div>
    <h3>{a.title}</h3>
    <p>{a.excerpt}</p>
    <Link to={'/blog/' + a.slug} className="mh-acard-more">مطالعه مقاله <ArrowLeft size={14} /></Link>
  </motion.div>
);

// ============= MAIN HOME COMPONENT =============
const Home = () => {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [missions, setMissions] = useState([]);
  const [latest, setLatest] = useState([]);
  const [best, setBest] = useState([]);
  const [discounted, setDiscounted] = useState([]);
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    fetchMissions();
    client.get('/shop/products?sort=newest').then(r => setLatest((r.data.products || []).slice(0, 4))).catch(() => {});
    client.get('/shop/best-sellers').then(r => setBest((r.data.products || []).slice(0, 4))).catch(() => {});
    client.get('/shop/products?sort=discount').then(r => setDiscounted((r.data.products || []).filter(p => p.discount_percent > 0).slice(0, 4))).catch(() => {});
    client.get('/shop/articles').then(r => setArticles((r.data.articles || []).slice(0, 3))).catch(() => {});
  }, []);

  const fetchMissions = async () => {
    try {
      const res = await axios.get(`${API_URL}/missions/`);
      setMissions(res.data);
    } catch (err) {
      console.error('Error fetching missions:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/signup`, {
        username: formData.email.split('@')[0],
        email: formData.email,
        password: 'temp123456',
        full_name: formData.name
      });
      setStatus({ type: 'success', msg: 'درخواست شما با موفقیت ثبت شد' });
      setFormData({ name: '', phone: '', email: '' });
    } catch (err) {
      setStatus({ type: 'error', msg: 'خطا در برقراری ارتباط' });
    }
    setLoading(false);
  };

  return (
    <div className="home-page">
      {/* ============= HERO SECTION ============= */}
      <section className="hero">
        <motion.div
          className="hero-content"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="hero-badge">
            <Zap size={16} />
            <span>پیشرو در توسعه سامانه‌های تصمیم‌یار</span>
          </motion.div>

          <motion.h1 variants={fadeInUp}>
            معماری سامانه‌هایی که <br />
            <span className="gradient-text">
              <TypingText text="فکر می‌کنند" />
            </span>
          </motion.h1>

          <motion.p variants={fadeInUp} className="hero-desc">
            تبدیل داده‌های خام به تصمیم‌های استراتژیک. ما در ماه‌افزار هوشمند رسا،
            هوش مصنوعی را با پایداری سازمانی ترکیب می‌کنیم تا آینده را شفاف‌تر ببینید.
          </motion.p>

          <motion.div variants={fadeInUp} className="hero-cta">
            <Link to="/courses" className="btn-primary">
              مشاهده آموزش‌ها
              <ArrowRight size={20} style={{ marginRight: '10px' }} />
            </Link>

            <motion.div
              className="status-indicator"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="status-dot"></span>
              <span>AI Core: وضعیت سیستم پایدار</span>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Hero Visual Animation */}
        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <div className="ai-core">
            <motion.div
              className="orbit orbit-1"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="orbit orbit-2"
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="orbit orbit-3"
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            />
            <Cpu size={80} className="core-icon" color="#8b5cf6" />
            <motion.div
              className="pulse-ring"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* ============= TRUST STRIP (zhaket-style) ============= */}
      <div className="mh-trust">
        <div className="mh-trust-row">
          <div className="mh-trust-item">
            <span className="mh-trust-ic"><Wallet size={20} /></span>
            <div><b>پرداخت امن</b><span>از کیف پول سایت</span></div>
          </div>
          <div className="mh-trust-item">
            <span className="mh-trust-ic"><ShieldCheck size={20} /></span>
            <div><b>ضمانت بازگشت وجه</b><span>تا ۷ روز بدون قید و شرط</span></div>
          </div>
          <div className="mh-trust-item">
            <span className="mh-trust-ic"><Headset size={20} /></span>
            <div><b>پشتیبانی حرفه‌ای</b><span>۶ ماه پشتیبانی رایگان</span></div>
          </div>
          <div className="mh-trust-item">
            <span className="mh-trust-ic"><RefreshCw size={20} /></span>
            <div><b>به‌روزرسانی خودکار</b><span>دریافت آخرین نسخه‌ها</span></div>
          </div>
        </div>
      </div>

      {/* ============= MISSION SECTION ============= */}
      <AnimatedSection id="about" className="section">
        <div className="container">
          <motion.div variants={fadeInUp}>
            <h2 className="section-title">ماموریت و رسالت ما</h2>
            <h3 className="subtitle">هوش قابل اتکا برای تصمیم‌های بزرگ</h3>
          </motion.div>

          <div className="missions-grid">
            {missions.map((mission, idx) => (
              <motion.div
                key={mission.id}
                className="mission-card glass-card"
                variants={fadeInUp}
                whileHover={{ y: -10 }}
              >
                <div className="mission-icon">{mission.icon}</div>
                <h3>{mission.title}</h3>
                <p>{mission.content}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ============= SERVICES SECTION ============= */}
      <AnimatedSection id="services" className="section">
        <div className="container">
          <motion.div variants={fadeInUp}>
            <h2 className="section-title">خدمات ماه‌افزار</h2>
            <h3 className="subtitle">پاسخ هوشمند به چالش‌های پیچیده</h3>
          </motion.div>

          <motion.div className="services-grid" variants={staggerContainer}>
            <ServiceCard
              icon={<Activity />}
              title="سامانه‌های تصمیم‌یار هوشمند"
              desc="جایی که شهود مدیریتی با دقت داده‌ها ترکیب می‌شود."
            />
            <ServiceCard
              icon={<Database />}
              title="تحلیل کلان داده (Big Data)"
              desc="استخراج الگوهای پنهان از انبوه داده‌های سازمانی."
            />
            <ServiceCard
              icon={<Server />}
              title="معماری سامانه‌های سازمانی"
              desc="طراحی زیرساخت‌های نرم‌افزاری یکپارچه و امن."
            />
            <ServiceCard
              icon={<Cpu />}
              title="اتوماسیون هوشمند (RPA)"
              desc="خودکارسازی فرآیندهای تکراری و آزادسازی نیرو."
            />
            <ServiceCard
              icon={<Brain />}
              title="راهکارهای سفارشی AI"
              desc="توسعه مدل‌های هوش مصنوعی اختصاصی بومی."
            />
            <ServiceCard
              icon={<Shield />}
              title="امنیت و حریم داده"
              desc="حفاظت جامع در برابر تهدیدات سایبری."
            />
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ============= LATEST PRODUCTS (zhaket-style) ============= */}
      <AnimatedSection className="section mh-market" id="market">
        <div className="container">
          <SectionHead title="جدیدترین محصولات ماه‌افزار"
                       desc="تازه‌ترین نرم‌افزارها، ابزارهای هوشمند و پلاگین‌های تیم ما را ببینید و سایت خود را مجهز کنید."
                       to="/shop" />
          <div className="mh-pgrid">
            {latest.map(p => <MarketCard key={p.id} p={p} />)}
          </div>
          {latest.length === 0 && <p className="section-desc">به‌زودی محصولات جدید در این بخش قرار می‌گیرند.</p>}
        </div>
      </AnimatedSection>

      {/* ============= BEST SELLERS (zhaket-style) ============= */}
      <AnimatedSection className="section mh-market">
        <div className="container">
          <SectionHead title="پرفروش‌ترین‌های ماه‌افزار"
                       desc="محصولاتی که کاربران بیشترین خرید را از آن‌ها داشته‌اند — انتخاب مطمئن."
                       to="/shop?sort=popular" />
          <div className="mh-pgrid mh-best-grid">
            {best.map((p, i) => (
              <div key={p.id} className="mh-best-wrap">
                <span className={'mh-rank' + (i < 3 ? ' top' : '')}>{faNum(i + 1)}</span>
                <MarketCard p={p} />
              </div>
            ))}
          </div>
          {best.length === 0 && <p className="section-desc">هنوز فروشی ثبت نشده است — به‌زودی این بخش پر می‌شود.</p>}
        </div>
      </AnimatedSection>

      {/* ============= TOP DISCOUNTS (zhaket-style) ============= */}
      <AnimatedSection className="section mh-market mh-market-alt">
        <div className="container">
          <SectionHead title="پرتخفیف‌های ماه‌افزار، همین حالا بخرید!"
                       desc="فرصت‌های محدود با تخفیف‌های استثنایی روی محصولات منتخب."
                       to="/shop?sort=discount" />
          <div className="mh-pgrid">
            {discounted.map(p => <MarketCard key={p.id} p={p} />)}
          </div>
          {discounted.length === 0 && <p className="section-desc">فعلاً تخفیف فعالی ثبت نشده است.</p>}
        </div>
      </AnimatedSection>

      {/* ============= STATS BANNER ============= */}
      <section className="stats-banner">
        <div className="container">
          <motion.div
            className="stats-grid"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <StatCard number="۲۰+" label="پروژه موفق سازمانی" />
            <StatCard number="۵+" label="سال تجربه تخصصی" />
            <StatCard number="۱۰۰٪" label="تعهد به امنیت داده" />
            <StatCard number="۲۴/۷" label="پشتیبانی فنی" />
          </motion.div>
        </div>
      </section>

      {/* ============= LATEST ARTICLES (zhaket-style) ============= */}
      <AnimatedSection className="section">
        <div className="container">
          <SectionHead title="آخرین مطالب وبلاگ، همیشه به‌روز باشید"
                       desc="دانش فنی و تجربه‌های اجرایی تیم ماه‌افزار را بخوانید."
                       to="/blog" />
          <div className="mh-agrid">
            {articles.map(a => <ArticleCard key={a.slug} a={a} />)}
          </div>
          {articles.length === 0 && <p className="section-desc">به‌زودی مقالات جدید منتشر می‌شوند.</p>}
        </div>
      </AnimatedSection>

      {/* ============= CTA BANNER (zhaket-style) ============= */}
      <section className="mh-cta">
        <div className="mh-cta-inner">
          <div className="mh-cta-text">
            <h2>دنبال راهکار نرم‌افزاری اختصاصی هستید؟</h2>
            <p>تیم ماه‌افزار با بیش از ۵ سال تجربه در طراحی سامانه‌های تصمیم‌یار و هوش مصنوعی، در کنار شماست.</p>
          </div>
          <div className="mh-cta-actions">
            <Link to="/contact" className="btn-primary">درخواست مشاوره رایگان</Link>
            <Link to="/pricing" className="mh-cta-ghost">مشاهده تعرفه‌ها</Link>
          </div>
        </div>
      </section>

      {/* ============= CONTACT SECTION ============= */}
      <AnimatedSection id="contact" className="section">
        <div className="container">
          <motion.h2 className="section-title" variants={fadeInUp}>
            آغاز یک همکاری هوشمند
          </motion.h2>
          <motion.p className="section-desc" variants={fadeInUp}>
            برای دریافت مشاوره تخصصی در زمینه توسعه سامانه‌های نرم‌افزاری و هوش مصنوعی، با ما در ارتباط باشید.
          </motion.p>

          <div className="contact-wrapper">
            <motion.div
              className="contact-info glass-card"
              variants={fadeInUp}
              whileHover={{ y: -10 }}
            >
              <h4>📞 راه‌های تماس مستقیم:</h4>
              <div className="contact-items">
                <div className="contact-item">
                  <Phone className="contact-icon" size={24} color="#8b5cf6" />
                  <div>
                    <small>تلفن</small>
                    <strong>۰۲۱-۸۸۸۸۸۸۸۸</strong>
                  </div>
                </div>
                <div className="contact-item">
                  <Mail className="contact-icon" size={24} color="#8b5cf6" />
                  <div>
                    <small>ایمیل</small>
                    <strong>info@mah-afzar.ir</strong>
                  </div>
                </div>
                <div className="contact-item">
                  <MapPin className="contact-icon" size={24} color="#8b5cf6" />
                  <div>
                    <small>آدرس</small>
                    <strong>تهران، پارک فناوری</strong>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.form
              className="contact-form glass-card"
              variants={fadeInUp}
              onSubmit={handleSubmit}
            >
              <h4>درخواست مشاوره رایگان</h4>
              <p className="form-hint">لطفاً اطلاعات خود را وارد کنید تا متخصصین ما با شما تماس بگیرند.</p>

              <input
                type="text"
                placeholder="نام و نام خانوادگی"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="شماره تماس"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
              />
              <input
                type="email"
                placeholder="ایمیل"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />

              <motion.button
                type="submit"
                className="btn-submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? <span className="spinner"></span> : "ارسال درخواست"}
              </motion.button>

              {status && (
                <motion.p
                  className={`status-msg ${status.type}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {status.msg}
                </motion.p>
              )}
            </motion.form>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
};

export default Home;

