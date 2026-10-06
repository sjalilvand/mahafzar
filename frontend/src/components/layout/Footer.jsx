import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="footer-logo">
              <Brain size={35} color="#00f2ff" />
              <h4>ماه‌افزار هوشمند رسا</h4>
            </div>
            <p className="footer-desc">
              توسعه‌دهنده راهکارهای نوین نرم‌افزاری با تمرکز بر هوش مصنوعی
            </p>
          </div>
          <div className="footer-col">
            <h4>دسترسی سریع</h4>
            <ul className="footer-links">
              <li><Link to="/about">درباره ما</Link></li>
              <li><Link to="/courses">آموزش‌ها</Link></li>
              <li><Link to="/members">اعضا</Link></li>
              <li><Link to="/contact">تماس با ما</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>تماس</h4>
            <ul className="footer-contact">
              <li><MapPin size={18} /><span>تهران، پارک فناوری</span></li>
              <li><Mail size={18} /><span>info@mah-afzar.ir</span></li>
              <li><Phone size={18} /><span>۰۲۱-۸۸۸۸۸۸۸۸</span></li>
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