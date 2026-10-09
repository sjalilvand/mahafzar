                            import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Brain, Shield, Database, Activity, Server, Cpu,
  Phone, Mail, MapPin, CheckCircle, Zap, ArrowRight,
  MessageCircle
} from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL|| '')+'/api';

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

// ============= MAIN HOME COMPONENT =============
const Home = () => {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [missions, setMissions] = useState([]);

  useEffect(() => {
    fetchMissions();
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
            <Cpu size={80} className="core-icon" color="#00f2ff" />
            <motion.div
              className="pulse-ring"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

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
                  <Phone className="contact-icon" size={24} color="#00f2ff" />
                  <div>
                    <small>تلفن</small>
                    <strong>۰۲۱-۸۸۸۸۸۸۸۸</strong>
                  </div>
                </div>
                <div className="contact-item">
                  <Mail className="contact-icon" size={24} color="#00f2ff" />
                  <div>
                    <small>ایمیل</small>
                    <strong>info@mah-afzar.ir</strong>
                  </div>
                </div>
                <div className="contact-item">
                  <MapPin className="contact-icon" size={24} color="#00f2ff" />
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

