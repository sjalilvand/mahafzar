import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

const PRESETS = [100000, 500000, 1000000];
const fmt = n => new Intl.NumberFormat('fa-IR').format(n || 0);

export default function Wallet() {
  const [data, setData] = useState({ balance: 0, transactions: [] });
  const [amount, setAmount] = useState(500000);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);

  const load = async () => {
    try { const r = await client.get('/business/wallet'); setData(r.data); }
    catch (e) { if (e.response && [401, 422].includes(e.response.status)) setNeedLogin(true); }
  };
  useEffect(() => { load(); }, []);

  const deposit = async () => {
    setBusy(true); setMsg('');
    try {
      const r = await client.post('/business/wallet/deposit', { amount });
      setMsg('کد رهگیری: ' + r.data.ref_code + ' — پس از پرداخت، دکمه تایید را بزنید');
      load();
    } catch (e) { setMsg((e.response && e.response.data && e.response.data.message) || 'خطا'); }
    setBusy(false);
  };

  const confirm = async (ref) => {
    try {
      await client.post('/business/wallet/deposit/confirm', { ref_code: ref });
      setMsg('✅ کیف پول شارژ شد');
      load();
    } catch (e) { setMsg((e.response && e.response.data && e.response.data.message) || 'خطا'); }
  };

  if (needLogin) return (
    <div className="biz-page"><div className="biz-card" style={{ textAlign: 'center' }}>
      <p>برای مشاهده کیف پول ابتدا وارد حساب خود شوید.</p>
      <Link to="/login"><button className="biz-btn">ورود / ثبت‌نام</button></Link>
    </div></div>
  );

  return (
    <div className="biz-page">
      <h1 className="biz-title">کیف پول</h1>
      <p className="biz-sub">موجودی قابل استفاده برای خرید دوره‌ها و خدمات</p>

      <div className="biz-card" style={{ textAlign: 'center' }}>
        <div className="biz-sub" style={{ marginBottom: 4 }}>موجودی فعلی</div>
        <div className="biz-balance">{fmt(data.balance)} <small style={{ fontSize: 14 }}>تومان</small></div>
      </div>

      <div className="biz-card">
        <b>شارژ کیف پول</b>
        <div style={{ display: 'flex', gap: 8, margin: '10px 0', flexWrap: 'wrap' }}>
          {PRESETS.map(p => (
            <span key={p} className={'biz-chip ' + (amount === p ? 'biz-open' : 'biz-closed')}
                  style={{ cursor: 'pointer', fontSize: 14, padding: '6px 14px' }}
                  onClick={() => setAmount(p)}>{fmt(p)}</span>
          ))}
        </div>
        <input className="biz-input" type="number" value={amount} min={10000}
               onChange={e => setAmount(Number(e.target.value))} />
        <button className="biz-btn" disabled={busy} onClick={deposit}>{busy ? '...' : 'افزودن اعتبار'}</button>
        {msg && <p style={{ color: '#22d3ee', margin: '10px 0 0' }}>{msg}</p>}
        <small style={{ color: '#64748b', display: 'block', marginTop: 10 }}>
          پرداخت در این نسخه آزمایشی است؛ درگاه بانکی (زرین‌پال) در فاز بعد متصل می‌شود.
        </small>
      </div>

      <div className="biz-card">
        <b>تراکنش‌ها</b>
        {data.transactions.length === 0 && <p className="biz-sub">تراکنشی ثبت نشده است.</p>}
        {data.transactions.map(t => (
          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
               borderTop: '1px solid rgba(148,163,184,.15)', padding: '10px 0' }}>
            <span>
              {t.amount > 0 ? '+' : ''}{fmt(t.amount)} تومان
              <small style={{ color: '#64748b', display: 'block' }}>
                {t.ref_code} — {new Date(t.created_at).toLocaleString('fa-IR')}
              </small>
            </span>
            {t.status === 'pending'
              ? <button className="biz-btn" onClick={() => confirm(t.ref_code)}>تایید پرداخت</button>
              : <span className="biz-chip biz-answered">تسویه شده</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
