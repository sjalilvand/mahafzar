import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain, Mail, Phone, MapPin, Instagram, Send, Linkedin, Github,
  Gift, ShieldCheck, Headset, RefreshCw, CheckCircle2
} from 'lucide-react';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [ok, setOk] = useState(false);

  const subscribe = (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;
    try { localStorage.setItem('mahai-newsletter', email.trim()); } catch (err) {}
    setOk(true);
    setEmail('');
    setTimeout(() => setOk(false), 4000);
  };

  return (
    <footer className="footer">
      <div className="container">
        {/* trust band */}
        <div className="mh-f-trust">
          <div><ShieldCheck size={18} /><span>ضمانت بازگشت وجه</span></div>
          <div><Headset size={18} /><span>پشتیبانی حرفه‌ای ۶ ماهه</span></div>
          <div><RefreshCw size={18} /><span>به‌روزرسانی خودکار محصولات</span></div>
          <div><Gift size={18} /><span>تخفیف‌های ویژه اعضا</span></div>
        </div>

        <div className="footer-grid mh-footer-grid">
          <div className="footer-col">
            <div className="footer-logo">
              <Brain size={35} color="#00f2ff" />
              <h4>ماه‌افزار هوشمند رسا</h4>
            </div>
            <p className="footer-desc">
              توسعه‌دهنده راهکارهای نوین نرم‌افزاری با تمرکز بر هوش مصنوعی؛
              معماری سامانه‌هایی که فکر می‌کنند.
            </p>
            <div className="mh-social">
              <a href="#" title="اینستاگرام" aria-label="اینستاگرام"><Instagram size={17} /></a>
              <a href="#" title="تلگرام" aria-label="تلگرام"><Send size={17} /></a>
              <a href="#" title="لینکدین" aria-label="لینکدین"><Linkedin size={17} /></a>
              <a href="#" title="گیت‌هاب" aria-label="گیت‌هاب"><Github size={17} /></a>
            </div>
          </div>

          <div className="footer-col">
            <h4>دسترسی سریع</h4>
            <ul className="footer-links">
              <li><Link to="/about">درباره ما</Link></li>
              <li><Link to="/courses">آموزش‌ها</Link></li>
              <li><Link to="/members">اعضا</Link></li>
              <li><Link to="/forum">انجمن گفتگو</Link></li>
              <li><Link to="/support">پشتیبانی و تیکت</Link></li>
              <li><Link to="/contact">تماس با ما</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>فروشگاه</h4>
            <ul className="footer-links">
              <li><Link to="/shop">همه محصولات</Link></li>
              <li><Link to="/shop?sort=newest">جدیدترین‌ها</Link></li>
              <li><Link to="/shop?sort=popular">پرفروش‌ترین‌ها</Link></li>
              <li><Link to="/shop?sort=discount">پرتخفیف‌ها</Link></li>
              <li><Link to="/blog">مقالات و راهنماها</Link></li>
              <li><Link to="/wallet">کیف پول</Link></li>
            </ul>
          </div>

          <div className="footer-col mh-news-col">
            <h4>خبرنامه ماه‌افزار</h4>
            <p className="mh-news-desc">
              از جدیدترین محصولات، آموزش‌ها و تخفیف‌های ویژه باخبر شوید.
            </p>
            <form className="mh-news-form" onSubmit={subscribe}>
              <input type="email" placeholder="ایمیل شما" value={email}
                     onChange={e => setEmail(e.target.value)} required aria-label="ایمیل خبرنامه" />
              <button type="submit">عضویت</button>
            </form>
            {ok && <span className="mh-news-ok"><CheckCircle2 size={14} /> عضویت شما با موفقیت ثبت شد</span>}
            <ul className="footer-contact">
              <li><MapPin size={15} /><span>تهران، پارک فناوری</span></li>
              <li><Mail size={15} /><span>info@mah-afzar.ir</span></li>
              <li><Phone size={15} /><span>۰۲۱-۸۸۸۸۸۸۸۸</span></li>
            </ul>
          </div>
        </div>

        <div className="footer-divider"></div>
        <div className="footer-bottom">
          <p>© ۱۴۰۳ ماه‌افزار هوشمند رسا. تمامی حقوق محفوظ است.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
