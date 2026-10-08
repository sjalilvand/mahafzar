import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import client from "../../api/client";
import { cartApi } from "../../cartStore";

const fmt = n => new Intl.NumberFormat("fa-IR").format(n || 0);

export default function ProductDetail() {
  const { slug } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");
  useEffect(() => { client.get("/shop/products/" + slug).then(r => setData(r.data)).catch(() => setData({ nf: true })); }, [slug]);
  if (!data) return <div className="biz-page"><p className="biz-sub">در حال بارگذاری...</p></div>;
  if (data.nf) return <div className="biz-page"><p>محصول یافت نشد.</p><Link className="biz-btn" to="/shop">بازگشت به فروشگاه</Link></div>;
  const p = data.product;
  const buyNow = () => { cartApi.add(p); nav("/cart"); };

  return (
    <div className="biz-page" style={{ maxWidth: 950 }}>
      {p.flash_active && <span className="flash-badge">⚡ فروش فوق‌العاده — فرصت محدود!</span>}
      <h1 className="biz-title">{p.name}</h1>
      <p className="biz-sub">{p.category && "دسته: " + p.category + " • "} فروش: {fmt(p.sales_count)}</p>
      <div className="biz-card">
        <p style={{ color: "#e2e8f0", lineHeight: 1.9 }}>{p.description}</p>
        <div className="price-box" style={{ margin: "14px 0" }}>
          {p.discount_percent > 0 && <del style={{ marginLeft: 8 }}>{fmt(p.price)}</del>}
          <b style={{ fontSize: 24, color: "#22d3ee" }}>{fmt(p.final_price)} <small>تومان</small></b>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="biz-btn" onClick={() => { cartApi.add(p); setMsg("✅ به سبد اضافه شد"); }}>افزودن به سبد</button>
          <button className="btn-auth solid" onClick={buyNow}>خرید فوری</button>
          <Link className="btn-auth ghost" to="/shop">بازگشت</Link>
        </div>
        {msg && <p style={{ color: "#22d3ee", marginTop: 10 }}>{msg}</p>}
      </div>
      {data.related && data.related.length > 0 && (
        <>
          <h3 style={{ color: "#e2e8f0", margin: "22px 0 10px" }}>محصولات مرتبط</h3>
          <div className="shop-grid">
            {data.related.map(r => (
              <div key={r.id} className="shop-card">
                <Link to={"/product/" + r.slug} className="shop-card-body"><h3>{r.name}</h3></Link>
                <div className="shop-card-foot"><b style={{ color: "#22d3ee" }}>{fmt(r.final_price)}</b>
                  <button className="biz-btn" onClick={() => cartApi.add(r)}>افزودن</button></div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
