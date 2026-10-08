import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client";
import { cartApi } from "../../cartStore";

const fmt = n => new Intl.NumberFormat("fa-IR").format(n || 0);
const SORTS = [
  { v: "newest", t: "جدیدترین" }, { v: "cheap", t: "ارزان‌ترین" },
  { v: "expensive", t: "گران‌ترین" }, { v: "discount", t: "بیشترین تخفیف" },
  { v: "popular", t: "پرفروش‌ترین" },
];

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (q) p.set("q", q); if (cat) p.set("category", cat); p.set("sort", sort);
      const r = await client.get("/shop/products?" + p.toString());
      setProducts(r.data.products || []);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, [cat, sort]);
  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t); }, [q]);
  useEffect(() => { client.get("/shop/categories").then(r => setCats(r.data.categories || [])).catch(() => {}); }, []);

  return (
    <div className="biz-page" style={{ maxWidth: 1200 }}>
      <h1 className="biz-title">فروشگاه محصولات</h1>
      <p className="biz-sub">نرم‌افزارها و ابزارهای هوشمند ماه‌افزار — پرداخت امن از کیف پول، دانلود فوری پس از خرید</p>

      <div className="shop-toolbar">
        <input className="biz-input" style={{ margin: 0, flex: 1, minWidth: 220 }}
               placeholder="🔍 جستجو در محصولات..." value={q} onChange={e => setQ(e.target.value)} />
        <select className="biz-select" style={{ margin: 0, maxWidth: 180 }} value={sort}
                onChange={e => setSort(e.target.value)}>
          {SORTS.map(s => <option key={s.v} value={s.v}>{s.t}</option>)}
        </select>
      </div>

      <div className="shop-cats">
        <button className={"biz-chip " + (!cat ? "biz-open" : "biz-closed")}
                onClick={() => setCat("")}>همه</button>
        {cats.map(c => (
          <button key={c.slug} className={"biz-chip " + (cat === c.slug ? "biz-open" : "biz-closed")}
                  onClick={() => setCat(c.slug)}>{c.name} ({c.count})</button>
        ))}
      </div>

      {loading ? <p className="biz-sub">در حال بارگذاری...</p> : (
        <div className="shop-grid">
          {products.map(p => (
            <div key={p.id} className="shop-card">
              {p.flash_active && <span className="flash-badge">⚡ فروش فوق‌العاده</span>}
              {p.discount_percent > 0 && <span className="disc-badge">{p.discount_percent}٪ تخفیف</span>}
              <Link to={"/product/" + p.slug} className="shop-card-body">
                <h3>{p.name}</h3>
                <p>{p.short_desc}</p>
              </Link>
              <div className="shop-card-foot">
                <div className="price-box">
                  {p.discount_percent > 0 && <del>{fmt(p.price)}</del>}
                  <b>{fmt(p.final_price)} <small>تومان</small></b>
                </div>
                <button className="biz-btn" onClick={() => cartApi.add(p)}>افزودن</button>
              </div>
            </div>
          ))}
          {products.length === 0 && <p className="biz-sub">محصولی یافت نشد.</p>}
        </div>
      )}
    </div>
  );
}

