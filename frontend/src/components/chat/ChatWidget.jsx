// frontend/src/components/chat/ChatWidget.jsx
// round-11: چت آنلاین مبتنی بر دیتابیس — استعلام قیمت، سفارش، درخواست آموزش، مقالات
// پاسخ‌های ساختاریافته بک‌اند (items/actions) به کارت محصول/دوره/مقاله + دکمه عملی رندر می‌شوند

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, Bot, User, ShoppingCart, ExternalLink,
         Video, FileText, Package, Tag, GraduationCap, Newspaper } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cartApi } from '../../cartStore';
import axios from 'axios';
import './ChatWidget.css';

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api';

const fa = (n) => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
const toman = (n) => fa(Number(n || 0).toLocaleString('en-US')).replace(/,/g, '٬') + ' تومان';

const QUICK_REPLIES = [
  { label: 'قیمت محصولات', text: 'قیمت محصولات پرفروش چنده؟' },
  { label: 'می‌خوام سفارش بدم', text: 'می‌خوام یک محصول سفارش بدم' },
  { label: 'درخواست آموزش', text: 'دنبال دوره آموزشی هستم' },
  { label: 'مقالات', text: 'مقالات جدید رو نشون بده' },
];

const ChatWidget = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'سلام! من دستیار هوشمند ماه‌افزار هستم. چطور می‌تونم کمکتون کنم؟ 😊\nمی‌تونید قیمت محصول بگیرید، سفارش بدید یا آموزش درخواست کنید.',
      actions: [
        { label: 'فروشگاه', type: 'link', to: '/shop' },
        { label: 'دوره‌های آموزشی', type: 'link', to: '/courses' },
        { label: 'مقالات', type: 'link', to: '/blog' },
      ] }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // ---------- send (توسط رویداد خارجی هم صدا زده می‌شود)
  const send = useCallback(async (text) => {
    const userMessage = (text || '').trim();
    if (!userMessage) return;
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setIsTyping(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(`${API_URL}/chat/`, { message: userMessage }, { headers });
      setMessages(prev => [...prev, {
        type: 'bot',
        text: res.data.response,
        items: res.data.items || [],
        actions: res.data.actions || [],
        sources: res.data.sources || [],
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        type: 'bot',
        text: 'متاسفانه خطایی رخ داد. لطفا دوباره تلاش کنید.',
      }]);
    }
    setIsTyping(false);
  }, [token]);

  // ---------- round-11: درخواست پرسش از بیرون ویجت (مثلا صفحه محصول)
  useEffect(() => {
    const onAsk = (e) => {
      const detail = e.detail || {};
      setIsOpen(true);
      setTimeout(() => send(detail.message || ''), 350); // صبر برای باز شدن پنجره
      setTimeout(() => inputRef.current?.focus(), 600);
    };
    window.addEventListener('mahafzar:chat-ask', onAsk);
    return () => window.removeEventListener('mahafzar:chat-ask', onAsk);
  }, [send]);

  const handleSend = async (e) => {
    e.preventDefault();
    const t = input;
    setInput('');
    await send(t);
  };

  const handleAction = (act) => {
    if (!act) return;
    if (act.type === 'link' && act.to) {
      setIsOpen(false);
      navigate(act.to);
    } else if (act.type === 'add_to_cart') {
      // محصول از آیتم‌های پیام‌های موجود پیدا می‌شود (خارج از setState تا render ناشی باشد)
      const items = messages.flatMap(m => (m.items || []));
      const p = items.find(i => i.kind === 'product' && i.slug === act.slug);
      if (p) {
        cartApi.add({ id: p.id, name: p.name, slug: p.slug,
                      final_price: p.final_price, image_url: p.image_url });
        setMessages(prev => [...prev, { type: 'bot',
          text: `«${p.name}» به سبد خرید اضافه شد. برای تکمیل خرید به سبد بروید.`,
          actions: [{ label: 'رفتن به سبد خرید', type: 'link', to: '/cart' },
                    { label: 'ادامه دیدن فروشگاه', type: 'link', to: '/shop' }] }]);
      }
    }
  };

  // ---------- رندر کارت‌ها
  const renderItem = (item, idx) => {
    if (item.kind === 'product') {
      return (
        <div className="cw-card cw-product" key={idx}>
          <div className="cw-card-thumb">
            {item.image_url
              ? <img src={item.image_url} alt={item.name} loading="lazy" />
              : <Package size={26} />}
            {item.discount_percent > 0 && (
              <span className="cw-off"><Tag size={11} /> {fa(item.discount_percent)}٪</span>
            )}
          </div>
          <div className="cw-card-body">
            <div className="cw-card-title">{item.name}</div>
            {item.short_desc && <div className="cw-card-sub">{item.short_desc}</div>}
            <div className="cw-price-row">
              {item.discount_percent > 0 && <del>{toman(item.price)}</del>}
              <b>{toman(item.final_price)}</b>
            </div>
            <div className="cw-card-btns">
              <button className="cw-btn cw-btn-solid" onClick={() => handleAction({ type: 'add_to_cart', slug: item.slug })}>
                <ShoppingCart size={14} /> افزودن به سبد
              </button>
              <button className="cw-btn" onClick={() => handleAction({ type: 'link', to: `/product/${item.slug}` })}>
                <ExternalLink size={14} /> مشاهده
              </button>
            </div>
          </div>
        </div>
      );
    }
    if (item.kind === 'course') {
      return (
        <div className="cw-card cw-course" key={idx}>
          <div className="cw-card-thumb">
            {item.thumbnail_url
              ? <img src={item.thumbnail_url} alt={item.title} loading="lazy" />
              : <GraduationCap size={26} />}
          </div>
          <div className="cw-card-body">
            <div className="cw-card-title">{item.title}</div>
            <div className="cw-card-meta">
              {item.level && <span>سطح: {item.level}</span>}
              {item.duration && <span className="cw-dot">•</span>}
              {item.duration && <span>{item.duration}</span>}
            </div>
            {item.desc && <div className="cw-card-sub">{item.desc}</div>}
            <div className="cw-card-btns">
              <button className="cw-btn cw-btn-solid" onClick={() => handleAction({ type: 'link', to: '/courses' })}>
                <Video size={14} /> شروع یادگیری
              </button>
            </div>
          </div>
        </div>
      );
    }
    if (item.kind === 'article') {
      return (
        <div className="cw-card cw-article" key={idx}>
          <div className="cw-card-thumb">
            {item.cover_url
              ? <img src={item.cover_url} alt={item.title} loading="lazy" />
              : <FileText size={26} />}
          </div>
          <div className="cw-card-body">
            <div className="cw-card-title">{item.title}</div>
            {item.excerpt && <div className="cw-card-sub">{item.excerpt}</div>}
            <div className="cw-card-btns">
              <button className="cw-btn cw-btn-solid" onClick={() => handleAction({ type: 'link', to: `/blog/${item.slug}` })}>
                <Newspaper size={14} /> خواندن مقاله
              </button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            className="chat-fab"
            onClick={() => setIsOpen(true)}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            title="چت آنلاین"
          >
            <MessageCircle size={28} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chat-window"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
          >
            <div className="chat-header">
              <div className="chat-header-title">
                <Bot size={24} />
                <div>
                  <h4>دستیار هوشمند ماه‌افزار</h4>
                  <span><i className="chat-online-dot" /> آنلاین — پاسخ از دیتابیس</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="chat-close" aria-label="بستن">
                <X size={20} />
              </button>
            </div>

            <div className="chat-messages">
              {messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.type}`}>
                  <div className="message-avatar">
                    {msg.type === 'bot' ? <Bot size={20} /> : <User size={20} />}
                  </div>
                  <div className="message-content">
                    <p className="cw-text">{msg.text}</p>

                    {(msg.items || []).length > 0 && (
                      <div className="cw-cards">{msg.items.map(renderItem)}</div>
                    )}

                    {(msg.actions || []).length > 0 && (
                      <div className="cw-actions">
                        {msg.actions.map((a, i) => (
                          <button key={i} className="cw-action-chip" onClick={() => handleAction(a)}>
                            {a.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="message-sources">
                        <small>منابع:</small>
                        {msg.sources.map((s, i) => (
                          <span key={i} className="source-tag">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {messages.length <= 1 && !isTyping && (
                <div className="cw-quick">
                  {QUICK_REPLIES.map(q => (
                    <button key={q.label} className="cw-quick-chip" onClick={() => send(q.text)}>
                      {q.label}
                    </button>
                  ))}
                </div>
              )}

              {isTyping && (
                <div className="message bot">
                  <div className="message-avatar"><Bot size={20} /></div>
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="chat-input-area">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="مثلا: قیمت ربات ارسال مرسوله چنده؟"
              />
              <button type="submit" disabled={!input.trim()} aria-label="ارسال">
                <Send size={20} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
