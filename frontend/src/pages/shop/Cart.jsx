import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useSyncExternalStore } from "react";
import client from "../api/client";
import { cartApi } from "../cartStore";

const fmt = n => new Intl.NumberFormat("fa-IR").format(n || 0);

export default function Cart() {
  const items = useSyncExternalStore(cartApi.subscribe, cartApi.get, () => []);
  const [coupon, setCoupon] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const total = cartApi.total();

  const checkout = async () => {
    setBusy(true); setMsg("");
    try {
      const r = await client.post("/shop/checkout", {
        items: items.map(i => ({ product_id: i.id, qty: i.qty })), coupon_code: coupon });
      setDone(r.data.order); cartApi.clear();
    } catch (e) { setMsg((e.response && e.response.data && e.response.data.message) || "خطا در پرداخت"); }
    setBusy(false);
  };

  if (done) return (
    <div className="biz-page" style={{ textAlign: "center" }}>
      <h1 className="biz-title">🎉 خرید موفق!</h1>
      <div className="biz-card">
        <p>کد سفارش: <b style={{ color: "#22d3ee" }}>{done.ref_code}</b></p>
        <p>مبلغ پرداخت‌شده: {fmt(done.total)} تومان {done.coupon_discount > 0 && "(تخفیف " + done.coupon_discount + "٪)"}</p>
        <b>لینک‌های دانلود:</b>
        {done.items.map((it, i) => (
          <div key={i} className="biz-row"><span>{it.title}</span>
            {it.file_url ? <a className="biz-btn" style={{ textDecoration: "none" }} href={it.file_url}>دانلود</a>
                         : <span className="biz-chip biz-answered">فایل به‌زودی</span>}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <Link to="/shop" className="biz-btn" style={{ textDecoration: "none" }}>ادامه خرید</Link>
        <Link to="/profile" className="btn-auth ghost" style={{ textDecoration: "none" }}>سفارش‌های من</Link>
      </div>
    </div>
  );

  return (
    <div className="biz-page" style={{ maxWidth: 850 }}>
      <h1 className="biz-title">سبد خرید</h1>
      {items.length === 0 ? (
        <div className="biz-card" style={{ textAlign: "center" }}>
          <p>سبد شما خالی است.</p><Link to="/shop" className="biz-btn" style={{ textDecoration: "none" }}>رفتن به فروشگاه</Link>
        </div>
      ) : (
        <>
          <div className="biz-card">
            {items.map(i => (
              <div key={i.id} className="biz-row">
                <span><b>{i.name}</b>
                  <small style={{ color: "#64748b", display: "block" }}>{fmt(i.price)} تومان</small></span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button className="biz-btn-sm" onClick={() => cartApi.setQty(i.id, i.qty - 1)}>−</button>
                  <b>{i.qty}</b>
                  <button className="biz-btn-sm" onClick={() => cartApi.setQty(i.id, i.qty + 1)}>+</button>
                  <button className="biz-btn-sm danger" onClick={() => cartApi.remove(i.id)}>حذف</button>
                </span>
              </div>
            ))}
            <div className="biz-row" style={{ fontWeight: 800, fontSize: 17 }}>
              <span>جمع کل</span><b style={{ color: "#22d3ee" }}>{fmt(total)} تومان</b>
            </div>
          </div>
          <div className="biz-card">
            <b>کد تخفیف</b>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input className="biz-input" style={{ margin: 0 }} placeholder="مثلا WELCOME20"
                     value={coupon} onChange={e => setCoupon(e.target.value)} />
            </div>
            <p className="biz-sub" style={{ marginTop: 8 }}>
              پرداخت از کیف پول انجام می‌شود — در صورت کمبود موجودی، از صفحه کیف پول شارژ کنید.
            </p>
            <button className="biz-btn" disabled={busy} onClick={checkout}>
              {busy ? "در حال پردازش..." : "پرداخت و ثبت سفارش"}
            </button>
            {msg && <p style={{ color: "#f87171", marginTop: 10 }}>{msg}</p>}
          </div>
        </>
      )}
    </div>
  );
}
