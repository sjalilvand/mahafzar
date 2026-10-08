import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client";
import { cartApi } from "../../cartStore";
import {
  ShoppingBag, Sparkles, Bot, Puzzle, Code2, Package, Star, TrendingUp
} from "lucide-react";

const fmt = n => new Intl.NumberFormat("fa-IR").format(n || 0);
const SORTS = [
  { v: "newest", t: "جدیدترین" }, { v: "cheap", t: "ارزان‌ترین" },
  { v: "expensive", t: "گران‌ترین" }, { v: "discount", t: "بیشترین تخفیف" },
  { v: "popular", t: "پرفروش‌ترین" },
];

const catIcon = (name) => {
  const n = name || "";
  if (n.includes("هوش مصنوعی")) return <Bot size={34} strokeWidth={1.6} />;
  if (n.includes("پلاگین") || n.includes("افزونه")) return <Puzzle size={34} strokeWidth={1.6} />;
  if (n.includes("نرم")) return <Code2 size={34} strokeWidth={1.6} />;
  return <Package size={34} strokeWidth={1.6} />;
};

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState(null);

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

  const addToCart = (p) => {
    cartApi.add(p);
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1400);
  };

  return (
    <div className="biz-page" style={{ maxWidth: 1200 }}>

      <div className="shop-hero">
        <span className="shop-hero-kicker"><Sparkles size={14} /> محصولات رسمی ماه‌افزار</span>
        <h1>فروشگاه نرم‌افزارهای هوشمند</h1>
        <p>پرداخت امن از کیف پول • تحویل و دانلود فوری • ۶ ماه پشتیبانی رایگان</p>
        <Sparkles className="shop-hero-glow" size={150} strokeWidth={0.6} />
      </div>

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
              <div className={"shop-thumb t-" + (p.id % 5)}>
                {catIcon(p.category)}
                {p.featured && <span className="feat-badge"><Star size={11} /> ویژه</span>}
              </div>
              {p.flash_active && <span className="flash-badge"><Sparkles size={11} /> فروش فوق‌العاده</span>}
              {p.discount_percent > 0 && <span className="disc-badge">{p.discount_percent}٪ تخفیف</span>}

              <Link to={"/product/" + p.slug} className="shop-card-body">
                <h3>{p.name}</h3>
                <p>{p.short_desc}</p>
              </Link>

              <div className="shop-meta">
                <span className="chip"><TrendingUp size={11} /> {fmt(p.sales_count)} فروش</span>
                {p.category && <span className="chip">{p.category}</span>}
              </div>

              <div className="shop-card-foot">
                <div className="price-box">
                  {p.discount_percent > 0 && <del>{fmt(p.price)}</del>}
                  <b>{fmt(p.final_price)}</b><small>تومان</small>
                </div>
              </div>

              <button className="shop-add" onClick={() => cartApi.add(p)}>
                <ShoppingBag size={16} /> افزودن به سبد
              </button>
            </div>
          ))}
          {products.length === 0 && <p className="biz-sub">محصولی یافت نشد.</p>}
        </div>
      )}
    </div>
  );
}

