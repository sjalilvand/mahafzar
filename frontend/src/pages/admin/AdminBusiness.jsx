import React, { useEffect, useState } from 'react';
import client from '../../api/client';

const fmt = n => new Intl.NumberFormat('fa-IR').format(n || 0);
const fdate = s => s ? new Date(s).toLocaleString('fa-IR') : '-';

const TABS = [
  { k: 'overview', t: 'نمای کلی' },
  { k: 'tickets', t: 'تیکت‌ها' },
  { k: 'coupons', t: 'کدهای تخفیف' },
  { k: 'tx', t: 'تراکنش‌ها' },
  { k: 'security', t: 'امنیت' },
];

export default function AdminBusiness() {
  const [tab, setTab] = useState('overview');
  const [denied, setDenied] = useState(false);
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [txs, setTxs] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [reply, setReply] = useState('');
  const [cForm, setCForm] = useState({ code: '', percent: 10, max_uses: 100 });
  const [pw, setPw] = useState({ current_password: '', new_password: '' });
  const [msg, setMsg] = useState('');

  const loadAll = async () => {
    try {
      const [s, t, c, x] = await Promise.all([
        client.get('/business/admin/stats'),
        client.get('/business/admin/tickets'),
        client.get('/business/admin/coupons'),
        client.get('/business/admin/transactions'),
      ]);
      setStats(s.data);
      setTickets(t.data.tickets || []);
      setCoupons(c.data.coupons || []);
      setTxs(x.data.transactions || []);
    } catch (e) {
      if (e.response && [401, 403, 422].includes(e.response.status)) setDenied(true);
    }
  };
  useEffect(() => { loadAll(); }, []);

  const openTicket = async (id) => {
    if (openId === id) { setOpenId(null); return; }
    setOpenId(id); setDetail(null);
    try { const r = await client.get('/business/tickets/' + id); setDetail(r.data); } catch {}
  };
  const sendReply = async (id) => {
    if (!reply.trim()) return;
    try {
      await client.post('/business/tickets/' + id, { message: reply });
      setReply('');
      const r = await client.get('/business/tickets/' + id);
      setDetail(r.data); loadAll();
    } catch { setMsg('خطا در ارسال پاسخ'); }
  };
  const setStatus = async (id, status) => {
    try { await client.post('/business/tickets/' + id + '/status', { status }); loadAll(); }
    catch { setMsg('خطا در تغییر وضعیت'); }
  };
  const makeCoupon = async (ev) => {
    ev.preventDefault(); setMsg('');
    try {
      const r = await client.post('/business/admin/coupons', cForm);
      setMsg('✅ کد ساخته شد: ' + r.data.code + ' (' + r.data.percent + '٪)');
      setCForm({ code: '', percent: 10, max_uses: 100 }); loadAll();
    } catch (e) { setMsg((e.response && e.response.data && e.response.data.message) || 'خطا در ساخت کد'); }
  };
  const changePw = async (ev) => {
    ev.preventDefault(); setMsg('');
    try {
      await client.post('/business/admin/password', pw);
      setMsg('✅ رمز عبور تغییر کرد — از این پس با رمز جدید وارد شوید');
      setPw({ current_password: '', new_password: '' });
    } catch (e) { setMsg((e.response && e.response.data && e.response.data.message) || 'خطا در تغییر رمز'); }
  };

  if (denied) return (
    <div className="biz-page"><div className="biz-card" style={{ textAlign: 'center' }}>
      <p>این بخش فقط برای مدیران سیستم است.</p>
      <a href="/" style={{ color: '#22d3ee' }}>بازگشت به خانه</a>
    </div></div>
  );

  return (
    <div className="biz-page">
      <h1 className="biz-title">پنل مدیریت تجاری</h1>
      <p className="biz-sub">پشتیبانی، تخفیف‌ها، تراکنش‌ها و امنیت — آدرس: /admin/business</p>

      <div className="biz-tabs">
        {TABS.map(x => (
          <button key={x.k} className={'biz-tab' + (tab === x.k ? ' active' : '')}
                  onClick={() => setTab(x.k)}>{x.t}</button>
        ))}
      </div>
      {msg && <p style={{ color: '#22d3ee' }}>{msg}</p>}

      {tab === 'overview' && stats && (
        <div className="biz-stats">
          <div className="biz-stat"><span className="biz-sub">تیکت باز</span><b>{fmt(stats.open_tickets)}</b></div>
          <div className="biz-stat"><span className="biz-sub">کل تیکت‌ها</span><b>{fmt(stats.total_tickets)}</b></div>
          <div className="biz-stat"><span className="biz-sub">کاربران</span><b>{fmt(stats.users)}</b></div>
          <div className="biz-stat"><span className="biz-sub">شارژ موفق</span><b>{fmt(stats.deposits)}</b></div>
          <div className="biz-stat"><span className="biz-sub">حجم (تومان)</span><b>{fmt(stats.volume)}</b></div>
        </div>
      )}

      {tab === 'tickets' && (
        <div className="biz-card">
          <b>همه تیکت‌ها ({tickets.length})</b>
          {tickets.length === 0 && <p className="biz-sub">تیکتی وجود ندارد.</p>}
          {tickets.map(t => (
            <div key={t.id} style={{ borderTop: '1px solid rgba(148,163,184,.15)', padding: '12px 0' }}>
              <div className="biz-row" style={{ border: 'none', padding: 0 }}>
                <span style={{ cursor: 'pointer' }} onClick={() => openTicket(t.id)}>
                  #{t.id} — {t.subject}
                  <small style={{ color: '#64748b', display: 'block' }}>{t.user_email}</small>
                </span>
                <span className={'biz-chip biz-' + t.status}>
                  {t.status === 'open' ? 'باز' : t.status === 'answered' ? 'پاسخ داده شد' : 'بسته'}
                </span>
              </div>
              {openId === t.id && (
                <div style={{ marginTop: 10 }}>
                  {((detail && detail.messages) || []).map((m, i) => (
                    <div key={i} className={'biz-msg ' + (m.sender === 'admin' ? 'biz-msg-admin' : '')}>
                      <small style={{ color: '#94a3b8' }}>
                        {m.sender === 'admin' ? 'پشتیبانی' : 'کاربر'} — {fdate(m.created_at)}
                      </small>
                      <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{m.body}</p>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    <input className="biz-input" style={{ margin: 0, flex: 1, minWidth: 200 }}
                           placeholder="پاسخ پشتیبانی..." value={reply}
                           onChange={e => setReply(e.target.value)} />
                    <button className="biz-btn" onClick={() => sendReply(t.id)}>ارسال پاسخ</button>
                  </div>
                  <div className="biz-actions" style={{ marginTop: 8 }}>
                    <button className="biz-btn-sm" onClick={() => setStatus(t.id, 'answered')}>علامت پاسخ‌داده‌شده</button>
                    <button className="biz-btn-sm" onClick={() => setStatus(t.id, 'open')}>بازگشایی</button>
                    <button className="biz-btn-sm danger" onClick={() => setStatus(t.id, 'closed')}>بستن تیکت</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'coupons' && (
        <>
          <form className="biz-card" onSubmit={makeCoupon}>
            <b>ساخت کد تخفیف جدید</b>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10 }}>
              <div><small>کد (خالی = تصادفی)</small>
                <input className="biz-input" value={cForm.code} placeholder="مثلا VIP10"
                       onChange={e => setCForm({ ...cForm, code: e.target.value })} /></div>
              <div><small>درصد (۱ تا ۹۰)</small>
                <input className="biz-input" type="number" min="1" max="90" value={cForm.percent}
                       onChange={e => setCForm({ ...cForm, percent: Number(e.target.value) })} /></div>
              <div><small>حداکثر استفاده</small>
                <input className="biz-input" type="number" min="1" value={cForm.max_uses}
                       onChange={e => setCForm({ ...cForm, max_uses: Number(e.target.value) })} /></div>
            </div>
            <button className="biz-btn">ساخت کد</button>
          </form>
          <div className="biz-card">
            <b>کدهای موجود ({coupons.length})</b>
            {coupons.map(c => (
              <div key={c.id} className="biz-row">
                <span><b style={{ color: '#22d3ee' }}>{c.code}</b> — {c.percent}٪
                  <small style={{ color: '#64748b', display: 'block' }}>
                    استفاده: {c.used}/{c.max} {c.active ? '' : '(غیرفعال)'}
                  </small></span>
                <span className={'biz-chip ' + (c.active ? 'biz-open' : 'biz-closed')}>
                  {c.active ? 'فعال' : 'غیرفعال'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'tx' && (
        <div className="biz-card">
          <b>همه تراکنش‌های کیف پول ({txs.length})</b>
          {txs.map(t => (
            <div key={t.id} className="biz-row">
              <span>
                {fmt(t.amount)} تومان
                <small style={{ color: '#64748b', display: 'block' }}>
                  {t.user} — {t.ref_code} — {fdate(t.created_at)}
                </small>
              </span>
              <span className={'biz-chip ' + (t.status === 'done' ? 'biz-answered' : 'biz-open')}>
                {t.status === 'done' ? 'تسویه' : 'در انتظار'}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === 'security' && (
        <form className="biz-card" onSubmit={changePw}>
          <b>🔒 تغییر رمز عبور مدیر</b>
          <p className="biz-sub" style={{ marginTop: 4 }}>
            مهم: رمز پیش‌فرض نصب (123456) ناامن است — همین ابتدا عوضش کنید.
          </p>
          <input className="biz-input" type="password" placeholder="رمز فعلی" value={pw.current_password}
                 onChange={e => setPw({ ...pw, current_password: e.target.value })} required />
          <input className="biz-input" type="password" placeholder="رمز جدید (حداقل ۸ کاراکتر)" value={pw.new_password}
                 onChange={e => setPw({ ...pw, new_password: e.target.value })} required minLength={8} />
          <button className="biz-btn">تغییر رمز</button>
        </form>
      )}
    </div>
  );
}


