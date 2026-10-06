import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

const CATS = [
  { v: 'general', t: 'عمومی' },
  { v: 'course', t: 'دوره‌ها و آموزش' },
  { v: 'payment', t: 'پرداخت و مالی' },
  { v: 'technical', t: 'مشکل فنی' },
  { v: 'consult', t: 'درخواست مشاوره' },
];

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState({ subject: '', category: 'general', message: '' });
  const [openId, setOpenId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [reply, setReply] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);

  const load = async () => {
    try { const r = await client.get('/business/tickets'); setTickets(r.data.tickets || []); }
    catch (e) { if (e.response && [401, 422].includes(e.response.status)) setNeedLogin(true); }
  };
  useEffect(() => { load(); }, []);

  const create = async (ev) => {
    ev.preventDefault(); setBusy(true); setMsg('');
    try {
      await client.post('/business/tickets', form);
      setForm({ subject: '', category: 'general', message: '' });
      setMsg('✅ تیکت شما ثبت شد');
      load();
    } catch (e) { setMsg((e.response && e.response.data && e.response.data.message) || 'خطا در ثبت تیکت'); }
    setBusy(false);
  };

  const open = async (id) => {
    if (openId === id) { setOpenId(null); return; }
    setOpenId(id);
    try { const r = await client.get('/business/tickets/' + id); setDetail(r.data); } catch { setDetail(null); }
  };

  const sendReply = async () => {
    if (!reply.trim() || !openId) return;
    try {
      await client.post('/business/tickets/' + openId, { message: reply });
      setReply('');
      const r = await client.get('/business/tickets/' + openId);
      setDetail(r.data); load();
    } catch {}
  };

  if (needLogin) return (
    <div className="biz-page"><div className="biz-card" style={{ textAlign: 'center' }}>
      <p>برای استفاده از پشتیبانی ابتدا وارد حساب خود شوید.</p>
      <Link to="/login"><button className="biz-btn">ورود / ثبت‌نام</button></Link>
    </div></div>
  );

  return (
    <div className="biz-page">
      <h1 className="biz-title">پشتیبانی و پیگیری درخواست‌ها</h1>
      <p className="biz-sub">تیم ما در ساعات کاری پاسخ‌گوست — میانگین زمان پاسخ: کمتر از ۲۴ ساعت</p>

      <form className="biz-card" onSubmit={create}>
        <b>ثبت تیکت جدید</b>
        <input className="biz-input" placeholder="موضوع..." value={form.subject}
               onChange={e => setForm({ ...form, subject: e.target.value })} required />
        <select className="biz-select" value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}>
          {CATS.map(c => <option key={c.v} value={c.v}>{c.t}</option>)}
        </select>
        <textarea className="biz-textarea" placeholder="شرح درخواست یا مشکل..." value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })} required />
        <button className="biz-btn" disabled={busy}>{busy ? 'در حال ارسال...' : 'ارسال تیکت'}</button>
        {msg && <p style={{ color: '#22d3ee', margin: '10px 0 0' }}>{msg}</p>}
      </form>

      <div className="biz-card">
        <b>تیکت‌های من</b>
        {tickets.length === 0 && <p className="biz-sub">هنوز تیکتی ثبت نکرده‌اید.</p>}
        {tickets.map(t => (
          <div key={t.id} style={{ borderTop: '1px solid rgba(148,163,184,.15)', padding: '12px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => open(t.id)}>
              <span>#{t.id} — {t.subject}</span>
              <span className={'biz-chip biz-' + t.status}>
                {t.status === 'open' ? 'در انتظار پاسخ' : t.status === 'answered' ? 'پاسخ داده شد' : 'بسته شده'}
              </span>
            </div>
            {openId === t.id && (
              <div style={{ marginTop: 8 }}>
                {((detail && detail.messages) || []).map((m, i) => (
                  <div key={i} className={'biz-msg ' + (m.sender === 'admin' ? 'biz-msg-admin' : '')}>
                    <small style={{ color: '#94a3b8' }}>
                      {m.sender === 'admin' ? 'پشتیبانی' : 'شما'} — {new Date(m.created_at).toLocaleString('fa-IR')}
                    </small>
                    <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{m.body}</p>
                  </div>
                ))}
                {detail && detail.ticket && detail.ticket.status !== 'closed' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input className="biz-input" style={{ margin: 0 }} placeholder="پاسخ شما..." value={reply}
                           onChange={e => setReply(e.target.value)} />
                    <button className="biz-btn" onClick={sendReply}>ارسال</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
