import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSyncExternalStore } from "react";
import { ShoppingBag, Tag, Wallet, Download, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";
import client from "../../api/client";
import { cartApi } from "../../cartStore";

const fmt = n => new Intl.NumberFormat("fa-IR").format(n || 0);
const STEPS = ["سبد خرید", "تخفیف و بررسی", "پرداخت", "دریافت"];

export default function Cart() {
  const items = useSyncExternalStore(cartApi.subscribe, cartApi.get, () => []);
  const [step, setStep] = useState(0);
  const [coupon, setCoupon] = useState("");
  const [couponInfo, setCouponInfo] = useState(null);
  const [balance, setBalance] = useState(null);
  const [needLogin, setNeedLogin] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [bundles, setBundles] = useState([]);

  useEffect(() => {
    client.get("/business/wallet")
      .then(r => setBalance(r.data.balance))
      .catch(e => { if (e.response && [401,422].includes(e.response.status)) setNeedLogin(true); });
    client.get("/shop/bundles")
      .then(r => setBundles(r.data.bundles || []))
      .catch(() => {});
  }, []);

  const subtotal = cartApi.total();
  // ---- محاسبه تخفیف باندل: اگر همه اقلام یک باندل در سبد باشد ----
  const cartIds = new Set(items.map(i => i.id));
  const prices = new Map(items.map(i => [i.id, i.price]));
  const bundleApplies = [];
  let bundleDiscount = 0;
  bundles.forEach(b => {
    const bItems = (b.items || []).filter(it => cartIds.has(it.id));
    if (bItems.length && (b.items || []).every(it => cartIds.has(it.id))) {
      const bSum = bItems.reduce((s, it) => s + (prices.get(it.id) || 0), 0);
      const d = Math.round(bSum * (b.discount_percent || 0) / 100);
      if (d > 0) { bundleApplies.push({ title: b.title, percent: b.discount_percent, amount: d }); bundleDiscount += d; }
    }
  });
  const afterBundle = subtotal - bundleDiscount;
  const pct = couponInfo && couponInfo.valid ? couponInfo.percent : 0;
  const total = Math.round(afterBundle * (100 - pct) / 100);
  // MahAI round-4: باندل‌هایی که کوپن اختصاصی فعال دارند و اقلامشان کامل در سبد است
  const bundleCoupons = bundles.filter(b => b.coupon && (b.items || []).length &&
                                           (b.items || []).every(it => cartIds.has(it.id)));

  const checkCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      // MahAI round-4: ارسال اقلام سبد برای اعتبارسنجی کوپن اختصاصی باندل
      const r = await client.post("/business/coupons/validate", {
        code: coupon,
        items: items.map(i => ({ product_id: i.id, qty: i.qty })) });
      setCouponInfo(r.data);
    } catch { setCouponInfo({ valid: false, message: "خطا در بررسی کد" }); }
  };

  const pay = async () => {
    setBusy(true); setMsg("");
    try {
      const r = await client.post("/shop/checkout", {
        items: items.map(i => ({ product_id: i.id, qty: i.qty })), coupon_code: coupon });
      setDone(r.data.order); cartApi.clear(); setStep(3);
    } catch (e) { setMsg((e.response && e.response.data && e.response.data.message) || "خطا در پرداخت"); }
    setBusy(false);
  };

  if (needLogin) return (
    <div className="biz-page" style={{ maxWidth: 850 }}>
      <div className="co-steps">{STEPS.map((s,i)=>(<div key={s} className={"co-step"+(i===0?" active":"")}><span className="co-dot">{i+1}</span><small>{s}</small></div>))}</div>
      <div className="biz-card" style={{ textAlign: "center" }}>
        <p>برای تکمیل خرید ابتدا وارد حساب خود شوید.</p>
        <Link to="/login" className="biz-btn" style={{ textDecoration: "none" }}>ورود / ثبت‌نام</Link>
      </div>
    </div>
  );

  return (
    <div className="biz-page" style={{ maxWidth: 880 }}>
      <div className="co-steps">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={"co-step" + (i < step ? " done" : i === step ? " active" : "")}>
              <span className="co-dot">{i < step ? "✓" : i + 1}</span><small>{s}</small>
            </div>
            {i < STEPS.length - 1 && <div className={"co-line" + (i < step ? " filled" : "")} />}
          </React.Fragment>
        ))}
      </div>

      {step === 3 && done ? (
        <div className="biz-card co-final">
          <CheckCircle2 size={54} className="co-final-icon" />
          <h2>خرید شما با موفقیت انجام شد!</h2>
          <p>کد سفارش: <b className="co-ref">{done.ref_code}</b></p>
          <p>مبلغ پرداخت‌شده: <b>{fmt(done.total)} تومان</b> {done.coupon_discount > 0 && <span className="co-save">(صرفه‌جویی با کد تخفیف: {done.coupon_discount}٪)</span>}</p>
          <div className="co-downloads">
            <b><Download size={15} /> فایل‌های شما:</b>
            {done.items.map((it, i) => (
              <div key={i} className="biz-row">
                <span>{it.title}</span>
                {it.file_url ? <a className="biz-btn" style={{ textDecoration: "none" }} href={it.file_url}>دانلود</a>
                             : <span className="biz-chip biz-answered">فایل به‌زودی</span>}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
            <Link to="/shop" className="btn-auth ghost" style={{ textDecoration: "none" }}>ادامه خرید</Link>
            <Link to="/profile" className="biz-btn" style={{ textDecoration: "none" }}>سفارش‌های من</Link>
          </div>
        </div>
      ) : step === 0 ? (
        <>
          <div className="biz-card">
            <b><ShoppingBag size={16} /> اقلام سبد ({items.length})</b>
            {items.length === 0 && <p className="biz-sub">سبد شما خالی است — <Link to="/shop" style={{ color: "#22d3ee" }}>رفتن به فروشگاه</Link></p>}
            {items.map(i => (
              <div key={i.id} className="biz-row">
                <span><b>{i.name}</b><small style={{ color: "#64748b", display: "block" }}>{fmt(i.price)} تومان</small></span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button className="biz-btn-sm" onClick={() => cartApi.setQty(i.id, i.qty - 1)}>−</button>
                  <b>{i.qty}</b>
                  <button className="biz-btn-sm" onClick={() => cartApi.setQty(i.id, i.qty + 1)}>+</button>
                  <button className="biz-btn-sm danger" onClick={() => cartApi.remove(i.id)}>حذف</button>
                </span>
              </div>
            ))}
          </div>
          <div className="co-actions">
            <Link to="/shop" className="btn-auth ghost" style={{ textDecoration: "none" }}><ArrowRight size={15} /> بازگشت به فروشگاه</Link>
            <button className="biz-btn" disabled={items.length === 0} onClick={() => setStep(1)}>ادامه <ArrowLeft size={15} /></button>
          </div>
        </>
      ) : step === 1 ? (
        <>
          <div className="biz-card">
            <b><Tag size={16} /> کد تخفیف</b>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <input className="biz-input" style={{ margin: 0 }} placeholder="مثلا WELCOME20"
                     value={coupon} onChange={e => setCoupon(e.target.value)} />
              <button className="biz-btn" onClick={checkCoupon}>بررسی کد</button>
            </div>
            {couponInfo && <p style={{ marginTop: 10, color: couponInfo.valid ? "#10b981" : "#f87171", fontWeight: 700 }}>
              {couponInfo.valid ? "✅ " + couponInfo.message : "❌ " + (couponInfo.message || "کد نامعتبر")}</p>}
            {bundleCoupons.length > 0 && !pct && (
              <div style={{ marginTop: 10 }}>
                {bundleCoupons.map(b => (
                  <p key={b.id} className="co-bundle-coupon-hint" style={{ margin: "4px 0" }}>
                    🎟 برای باندل «{b.title}» کد اختصاصی <code>{b.coupon.code}</code> دارید
                    — با وارد کردن آن <b>٪{fmt(b.coupon.percent)}</b> تخفیف بیشتر بگیرید.
                  </p>
                ))}
              </div>
            )}
          </div>
          <div className="biz-card co-summary">
            <b>خلاصه سفارش</b>
            <div className="co-row"><span>جمع اقلام ({items.length} قلم)</span><b>{fmt(subtotal)} تومان</b></div>
            {bundleApplies.map((b, i) => (
              <div key={i} className="co-row green"><span>تخفیف باندل «{b.title}» ({b.percent}٪)</span><b>−{fmt(b.amount)} تومان</b></div>
            ))}
            {pct > 0 && <div className="co-row green"><span>تخفیف کد ({pct}٪)</span><b>−{fmt(afterBundle - total)} تومان</b></div>}
            <div className="co-row total"><span>قابل پرداخت</span><b>{fmt(total)} تومان</b></div>
          </div>
          <div className="biz-card">
            <b><Wallet size={16} /> کیف پول شما: {balance !== null ? fmt(balance) + " تومان" : "..."}</b>
            {balance !== null && balance < total && (
              <p style={{ color: "#f87171" }}>⚠ موجودی کافی نیست — <Link to="/wallet" style={{ color: "#22d3ee" }}>شارژ کیف پول</Link></p>
            )}
          </div>
          <div className="co-actions">
            <button className="btn-auth ghost" onClick={() => setStep(0)}><ArrowRight size={15} /> سبد خرید</button>
            <button className="biz-btn" disabled={balance !== null && balance < total} onClick={() => setStep(2)}>ادامه به پرداخت <ArrowLeft size={15} /></button>
          </div>
        </>
      ) : (
        <>
          <div className="biz-card co-summary">
            <b>تایید نهایی و پرداخت</b>
            {items.map(i => <div key={i.id} className="co-row"><span>{i.name} × {i.qty}</span><b>{fmt(i.price * i.qty)}</b></div>)}
            {bundleApplies.map((b, i) => (
              <div key={"bd" + i} className="co-row green"><span>تخفیف باندل «{b.title}» ({b.percent}٪)</span><b>−{fmt(b.amount)}</b></div>
            ))}
            {pct > 0 && <div className="co-row green"><span>کد تخفیف {coupon} ({pct}٪)</span><b>−{fmt(afterBundle - total)}</b></div>}
            <div className="co-row total"><span>مبلغ نهایی</span><b>{fmt(total)} تومان</b></div>
            <p className="biz-sub" style={{ marginTop: 8 }}>مبلغ از کیف پول شما کسر می‌شود. پس از پرداخت، لینک دانلود فورا فعال می‌شود.</p>
          </div>
          <div className="co-actions">
            <button className="btn-auth ghost" onClick={() => setStep(1)}><ArrowRight size={15} /> بازگشت</button>
            <button className="shop-add" style={{ maxWidth: 300 }} disabled={busy} onClick={pay}>
              {busy ? "در حال پردازش..." : <><Wallet size={17} /> پرداخت {fmt(total)} تومان</>}
            </button>
          </div>
          {msg && <p style={{ color: "#f87171", textAlign: "center", marginTop: 10 }}>{msg}</p>}
        </>
      )}
    </div>
  );
}
