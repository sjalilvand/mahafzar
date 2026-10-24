import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Phone, Mail, MapPin, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_URL = (import.meta.env.VITE_API_URL|| '')+'/api';

const Contact = () => {
  const { user, token } = useAuth();
  const [suggestion, setSuggestion] = useState({
    subject: '',
    content: '',
    category: 'general'
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setStatus({ type: 'error', msg: 'لطفاً ابتدا وارد حساب کاربری خود شوید' });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/suggestions/`,
        suggestion,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatus({ type: 'success', msg: 'نظر/پیشنهاد شما با موفقیت ثبت شد' });
      setSuggestion({ subject: '', content: '', category: 'general' });
    } catch (err) {
      setStatus({ type: 'error', msg: 'خطا در ثبت پیشنهاد' });
    }
    setLoading(false);
  };

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <section className="contact-hero">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="contact-hero-content"
        >
          <h1>تماس با ما</h1>
          <p>ما همیشه آماده شنیدن نظرات، پیشنهادات و سوالات شما هستیم</p>
        </motion.div>
      </section>

      <section className="section">
        <div className="container">
          <div className="contact-wrapper">
            {/* Contact Information */}
            <motion.div
              className="contact-info glass-card"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h3>اطلاعات تماس</h3>
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
                    <strong>تهران، پارک فناوری، ساختمان نوآوری</strong>
                  </div>
                </div>
              </div>

              <div className="contact-hours">
                <h4>ساعات کاری</h4>
                <p>شنبه تا چهارشنبه: ۸:۰۰ - ۱۷:۰۰</p>
                <p>پنجشنبه: ۸:۰۰ - ۱۲:۰۰</p>
              </div>
            </motion.div>

            {/* Suggestion Form */}
            <motion.form
              className="contact-form glass-card"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleSubmit}
            >
              <h3>
                <Send size={24} style={{ marginLeft: '10px' }} />
                ارسال نظر/پیشنهاد
              </h3>

              {!user && (
                <div className="login-alert">
                  <p>برای ارسال نظر یا پیشنهاد، لطفاً ابتدا وارد حساب کاربری خود شوید.</p>
                </div>
              )}

              <div className="form-group">
                <label>موضوع</label>
                <input
                  type="text"
                  placeholder="موضوع نظر یا پیشنهاد"
                  value={suggestion.subject}
                  onChange={(e) => setSuggestion({...suggestion, subject: e.target.value})}
                  required
                  disabled={!user}
                />
              </div>

              <div className="form-group">
                <label>دسته‌بندی</label>
                <select
                  value={suggestion.category}
                  onChange={(e) => setSuggestion({...suggestion, category: e.target.value})}
                  disabled={!user}
                >
                  <option value="general">عمومی</option>
                  <option value="technical">فنی</option>
                  <option value="courses">آموزش‌ها</option>
                  <option value="support">پشتیبانی</option>
                  <option value="other">سایر</option>
                </select>
              </div>

              <div className="form-group">
                <label>متن نظر/پیشنهاد</label>
                <textarea
                  placeholder="متن خود را بنویسید..."
                  value={suggestion.content}
                  onChange={(e) => setSuggestion({...suggestion, content: e.target.value})}
                  rows={5}
                  required
                  disabled={!user}
                />
              </div>

              <motion.button
                type="submit"
                className="btn-submit"
                disabled={loading || !user}
                whileHover={{ scale: user ? 1.02 : 1 }}
                whileTap={{ scale: user ? 0.98 : 1 }}
              >
                {loading ? <span className="spinner"></span> : "ارسال"}
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
      </section>
    </div>
  );
};

export default Contact;

