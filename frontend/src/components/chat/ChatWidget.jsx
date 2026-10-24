// frontend/src/components/chat/ChatWidget.jsx
// round-12: چت آنلاین با حافظه مکالمه — خرید کامل داخل چت (افزودن به سبد/تسویه) + نظرسنجی گرافیکی
// • session_id پایدار → بک‌اند محصولات قبلی را به‌خاطر می‌سپارد («همینو بگذار تو سبد» کار می‌کند)
// • تاریخچه چت در localStorage ذخیره می‌شود و با رفرش صفحه ادامه پیدا می‌کند
// • نظرسنجی: ستاره/ایموجی + نتیجه نمودار میله‌ای گرافیکی (api/chat/feedback)

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, Bot, User, ShoppingCart, ExternalLink,
         Video, FileText, Package, Tag, GraduationCap, Newspaper,
         Star, Trash2, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cartApi } from '../../cartStore';
import { playPop } from '../../sound';
import axios from 'axios';
import './ChatWidget.css';

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api';

const fa = (n) => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
const toman = (n) => fa(Number(n || 0).toLocaleString('en-US')).replace(/,/g, '٬') + ' تومان';

const HISTORY_KEY = 'mahafzar_chat_history';
const SESSION_KEY = 'mahafzar_chat_session';
const VOTED_KEY = 'mahafzar_chat_voted';

const WELCOME = {
  type: 'bot',
  text: 'سلام! من دستیار هوشمند ماه‌افزار هستم 🌙\nمی‌تونید همین‌جا قیمت بگیرید، محصول رو بخرید و برید پرداخت — و آخرش هم به من امتیاز بدید 😊\nمثلا بنویسید: «قیمت ربات تلگرام چنده؟» بعد «بگذارش تو سبد»',
  actions: [
    { label: 'فروشگاه', type: 'link', to: '/shop' },
    { label: 'دوره‌های آموزشی', type: 'link', to: '/courses' },
    { label: 'مقالات', type: 'link', to: '/blog' },
  ],
};

const QUICK_REPLIES = [
  { label: 'قیمت محصولات', text: 'قیمت محصولات پرفروش چنده؟' },
  { label: 'می‌خوام سفارش بدم', text: 'می‌خوام یک محصول سفارش بدم' },
  { label: 'درخواست آموزش', text: 'دنبال دوره آموزشی هستم' },
  { label: 'مقالات', text: 'مقالات جدید رو نشون بده' },
  { label: 'نظرسنجی', text: 'نظرسنجی' },
];

// ---------- helpers: session / history / voted ----------
const getSessionId = () => {
  try {
    let s = localStorage.getItem(SESSION_KEY);
    if (!s) {
      s = 's_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      localStorage.setItem(SESSION_KEY, s);
    }
    return s;
  } catch { return 's_anon'; }
};
const newSessionId = () => {
  const s = 's_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  try { localStorage.setItem(SESSION_KEY, s); } catch { /* noop */ }
  return s;
};
const loadHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [WELCOME];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) && arr.length ? arr : [WELCOME];
  } catch { return [WELCOME]; }
};
const saveHistory = (msgs) => {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(msgs.slice(-40))); } catch { /* noop */ }
};
const getVoted = () => {
  try { return new Set(JSON.parse(localStorage.getItem(VOTED_KEY) || '[]')); }
  catch { return new Set(); }
};
const markVoted = (id) => {
  try {
    const set = getVoted();
    set.add(id);
    localStorage.setItem(VOTED_KEY, JSON.stringify([...set].slice(-100)));
  } catch { /* noop */ }
};

// ---------- نظرسنجی گرافیکی (ستاره/ایموجی + نتیجه میله‌ای) ----------
const SurveyBlock = ({ survey, sessionId, onVoted }) => {
  const [voted, setVoted] = useState(() => getVoted().has(survey.id));
  const [hover, setHover] = useState(0);
  const [result, setResult] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (voted && !result) fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voted]);

  const fetchSummary = async () => {
    try {
      const res = await axios.get(`${API_URL}/chat/feedback/summary?survey_id=${encodeURIComponent(survey.id)}`);
      setResult(res.data);
    } catch { setResult(null); }
  };

  const vote = async (value) => {
    if (voted || sending) return;
    setSending(true);
    try {
      const res = await axios.post(`${API_URL}/chat/feedback`, {
        survey_id: survey.id, rating: value, question: survey.question, session_id: sessionId,
      });
      markVoted(survey.id);
      setVoted(true);
      await fetchSummary();
      if (onVoted && res.data) onVoted(res.data);
    } catch { /* بی‌صدا */ }
    setSending(false);
  };

  // نتیجه گرافیکی بعد از رأی
  if (voted) {
    return (
      <div className="cw-survey done">
        <div className="cw-survey-thanks">
          <BarChart3 size={14} /> نتیجه نظرسنجی
        </div>
        {result && result.count > 0 && (
          <div className="cw-bars">
            {['5', '4', '3', '2', '1'].map(k => {
              const pct = Math.round((result.dist[k] / result.count) * 100);
              return (
                <div className="cw-bar-row" key={k}>
                  <span className="cw-bar-label">{fa(k)} ★</span>
                  <span className="cw-bar-track">
                    <span className="cw-bar-fill" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="cw-bar-pct">{fa(pct)}٪</span>
                </div>
              );
            })}
            <div className="cw-bars-foot">
              میانگین {fa(result.avg)} از ۵ — {fa(result.count)} رأی
            </div>
          </div>
        )}
        {(!result || result.count === 0) && <div className="cw-bars-foot">ممنون از نظرتون! 🌸</div>}
      </div>
    );
  }

  // ورودی گرافیکی رأی
  return (
    <div className="cw-survey">
      <div className="cw-survey-q">{survey.question}</div>
      {survey.style === 'emoji' && survey.options && (
        <div className="cw-emoji-row">
          {survey.options.map(o => (
            <button key={o.value} className="cw-emoji-btn" title={o.label}
                    disabled={sending} onClick={() => vote(o.value)}>
              <span className="cw-emoji">{o.emoji}</span>
              <small>{o.label}</small>
            </button>
          ))}
        </div>
      )}
      {survey.style === 'stars' && (
        <div className="cw-stars" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map(v => (
            <button key={v} className="cw-star-btn" disabled={sending}
                    aria-label={`${v} ستاره`}
                    onMouseEnter={() => setHover(v)}
                    onClick={() => vote(v)}>
              <Star size={22} fill={v <= hover ? '#fbbf24' : 'transparent'}
                    color={v <= hover ? '#fbbf24' : '#94a3b8'} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ChatWidget = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState(getSessionId);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(loadHistory);
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

  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  // ---------- افزودن واقعی محصول به سبد (خارج از setState)
  const doAddToCart = (p) => {
    if (!p) return false;
    try {
      cartApi.add({ id: p.id, name: p.name, slug: p.slug,
                    final_price: p.final_price, image_url: p.image_url });
      playPop();
      return true;
    } catch { return false; }
  };

  // ---------- send (توسط رویداد خارجی هم صدا زده می‌شود)
  const send = useCallback(async (text) => {
    const userMessage = (text || '').trim();
    if (!userMessage) return;
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setIsTyping(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(`${API_URL}/chat/`,
        { message: userMessage, session_id: sessionId }, { headers });

      const botMsg = {
        type: 'bot',
        text: res.data.response,
        items: res.data.items || [],
        actions: res.data.actions || [],
        sources: res.data.sources || [],
        survey: res.data.survey || null,
      };

      // round-12: افزودن خودکار به سبد (وقتی بک‌اند گفت «انجام شد»)
      const autoActs = botMsg.actions.filter(a => a.type === 'add_to_cart' && a.auto && a.product);
      if (autoActs.length) {
        let ok = 0;
        autoActs.forEach(a => { if (doAddToCart(a.product)) ok += 1; });
        botMsg.actions = botMsg.actions.filter(a => !(a.type === 'add_to_cart' && a.auto));
        if (ok > 0) {
          botMsg.items = autoActs.map(a => a.product).filter(Boolean);
        }
      }

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        type: 'bot',
        text: 'متاسفانه خطایی رخ داد. لطفا دوباره تلاش کنید.',
      }]);
    }
    setIsTyping(false);
  }, [token, sessionId]);

  // ---------- درخواست پرسش از بیرون ویجت (مثلا صفحه محصول)
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

  // وقتی سوال بعدی نظرسنجی (step 1) از feedback endpoint برگشت
  const handleSurveyVoted = (res) => {
    const nextMsgs = [];
    if (res.thanks && res.next) nextMsgs.push({ type: 'bot', text: res.thanks, survey: res.next });
    else if (res.thanks) nextMsgs.push({ type: 'bot', text: res.thanks });
    if (nextMsgs.length) setMessages(prev => [...prev, ...nextMsgs]);
  };

  // گفتگوی جدید — پاکسازی کامل
  const clearChat = () => {
    const sid = newSessionId();
    setSessionId(sid);
    setMessages([WELCOME]);
    setIsTyping(false);
  };

  const handleAction = (act) => {
    if (!act) return;
    if (act.type === 'link' && act.to) {
      setIsOpen(false);
      navigate(act.to);
    } else if (act.type === 'add_to_cart') {
      const p = act.product ||
        messages.flatMap(m => (m.items || [])).find(i => i.kind === 'product' && i.slug === act.slug);
      if (p) {
        doAddToCart(p);
        setMessages(prev => [...prev, { type: 'bot',
          text: `«${p.name}» به سبد خرید اضافه شد ✅ برای تکمیل خرید به سبد بروید.`,
          actions: [{ label: '🛒 رفتن به سبد خرید', type: 'link', to: '/cart' },
                    { label: '💳 تسویه حساب و پرداخت', type: 'link', to: '/checkout' },
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
                  <span><i className="chat-online-dot" /> آنلاین — خرید و نظرسنجی داخل چت</span>
                </div>
              </div>
              <div className="chat-header-actions">
                <button onClick={clearChat} className="chat-clear" title="گفتگوی جدید" aria-label="گفتگوی جدید">
                  <Trash2 size={17} />
                </button>
                <button onClick={() => setIsOpen(false)} className="chat-close" aria-label="بستن">
                  <X size={20} />
                </button>
              </div>
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

                    {msg.survey && msg.survey.id && (
                      <SurveyBlock survey={msg.survey} sessionId={sessionId} onVoted={handleSurveyVoted} />
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
                placeholder="مثلا: قیمت ربات تلگرام چنده؟ بعدش: بگذارش تو سبد"
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
