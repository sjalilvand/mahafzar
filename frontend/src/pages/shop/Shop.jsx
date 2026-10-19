import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import client from "../../api/client";
import { cartApi } from "../../cartStore";
import Stars from "../../components/common/Stars";
import WishlistButton from "../../components/common/WishlistButton";
import {
  ShoppingBag, Sparkles, Bot, Puzzle, Code2, Package, Star, TrendingUp,
  Eye, Timer, X
} from "lucide-react";

const fmt = n => new Intl.NumberFormat("fa-IR").format(n || 0);
const SORTS = [
  { v: "newest", t: "جدیدترین" }, { v: "cheap", t: "ارزان‌ترین" },
  { v: "expensive", t: "گران‌ترین" }, { v: "discount", t: "بیشترین تخفیف" },
  { v: "popular", t: "پرفروش‌ترین" }, { v: "rating", t: "بهترین امتیاز" },
];

const catIcon = (name) => {
  const n = name || "";
  if (n.includes("هوش مصنوعی")) return <Bot size={34} strokeWidth={1.6} />;
  if (n.includes("پلاگین") || n.includes("افزونه")) return <Puzzle size={34} strokeWidth={1.6} />;
  if (n.includes("نرم")) return <Code2 size={34} strokeWidth={1.6} />;
  return <Package size={34} strokeWidth={1.6} />;
};

const pad2 = n => String(n).padStart(2, "0");
const fa = s => String(s).replace(/[0-9]/g, d => "۰۱۲۳۴۵۶۷۸۹"[+d]);
const remain = (iso) => {
  if (!iso) return 0;
  const ms = new Date(iso).getTime() - Date.now();
  return ms > 0 ? ms : 0;
};
const fmtDur = (ms) => {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  return fa(`${pad2(h)}:${pad2(m)}:${pad2(ss)}`);
};

function useCountdown(iso) {
  const [ms, setMs] = useState(() => remain(iso));
  useEffect(() => {
    setMs(remain(iso));
    const t = setInterval(() => setMs(remain(iso)), 1000);
    return () => clearInterval(t);
  }, [iso]);
  return ms;
}

/* ------- zhaket-style amazing-offer strip (flash sale) ------- */
function FlashStrip({ items, onAdd }) {
  const target = useMemo(() => {
    const ends = items.map(p => p.flash_until).filter(Boolean).sort();
    return ends[ends.length - 1] || null;
  }, [items]);
  const ms = useCountdown(target);
  if (!ms) return null;
  return (
    <div className="mh-flash">
      <div className="mh-flash-head">
        <span className="mh-flash-badge"><Sparkles size={15} /> فروش فوق‌العاده</span>
        <span className="mh-flash-timer"><Timer size={14} /> {fmtDur(ms)}</span>
      </div>
      <div className="mh-flash-row">
        {items.slice(0, 4).map(p => (
          <div key={p.id} className="mh-flash-item">
            <Link to={"/product/" + p.slug} className="mh-flash-thumb">⚡</Link>
            <div className="mh-flash-info">
              <Link to={"/product/" + p.slug} className="mh-flash-name">{p.name}</Link>
              <div className="mh-flash-price">
                {p.discount_percent > 0 && <del>{fmt(p.price)}</del>}
                <b>{fmt(p.final_price)}</b><small>تومان</small>
              </div>
            </div>
            <button className="mh-flash-add" onClick={() => onAdd(p)} title="افزودن به سبد">
              <ShoppingBag size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState(null);
  const [sp] = useSearchParams();

  /* sync filters from URL (mega-menu / navbar search links) */
  useEffect(() => {
    setQ(sp.get("q") || "");
    setCat(sp.get("cat") || "");
    const s = sp.get("sort");
    if (s && SORTS.some(x => x.v === s)) setSort(s);
  }, [sp]);

  const load = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (q) p.set("q", q); if (cat) p.set("category", cat); p.set("sort", sort);
      const r = await client.get("/shop/products?" + p.toString());
      setProducts(r.data.products || []);
    } catch (e) { console.error("SHOP_LOAD_ERR", e && e.message, e && e.response && e.response.status); }
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

  const flashItems = products.filter(p => p.flash_active);
  const hasFilter = !!(q || cat);

  return (
    <div className="biz-page" style={{ maxWidth: 1200 }}>

      <div className="shop-hero">
        <span className="shop-hero-kicker"><Sparkles size={14} /> محصولات رسمی ماه‌افزار</span>
        <h1>فروشگاه نرم‌افزارهای هوشمند</h1>
        <p>پرداخت امن از کیف پول • تحویل و دانلود فوری • ۶ ماه پشتیبانی رایگان</p>
        <Sparkles className="shop-hero-glow" size={150} strokeWidth={0.6} />
      </div>

      {flashItems.length > 0 && (
        <FlashStrip items={flashItems} onAdd={addToCart} />
      )}

      <div className="shop-toolbar">
        <input className="biz-input" style={{ margin: 0, flex: 1, minWidth: 220 }}
               placeholder="🔍 جستجو در محصولات..." value={q} onChange={e => setQ(e.target.value)} />
        <select className="biz-select" style={{ margin: 0, maxWidth: 180 }} value={sort}
                onChange={e => setSort(e.target.value)}>
          {SORTS.map(s => <option key={s.v} value={s.v}>{s.t}</option>)}
        </select>
        {hasFilter && (
          <button className="mh-clear-btn" onClick={() => { setQ(""); setCat(""); }}>
            <X size={13} /> حذف فیلترها
          </button>
        )}
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
              <WishlistButton p={p} className="shop-card-wish" />
              {p.flash_active && <span className="flash-badge"><Sparkles size={11} /> فروش فوق‌العاده</span>}
              {p.discount_percent > 0 && <span className="disc-badge">{p.discount_percent}٪ تخفیف</span>}

              <Link to={"/product/" + p.slug} className="shop-card-body">
                <h3>{p.name}</h3>
                <p>{p.short_desc}</p>
              </Link>

              <div className="shop-meta">
                <Stars rating={p.rating} count={p.rating_count} />
                <span className="chip"><TrendingUp size={11} /> {fmt(p.sales_count)} فروش</span>
                {p.category && <span className="chip">{p.category}</span>}
              </div>

              <div className="shop-card-foot">
                <div className="price-box">
                  {p.discount_percent > 0 && <del>{fmt(p.price)}</del>}
                  <b>{fmt(p.final_price)}</b><small>تومان</small>
                </div>
              </div>

              <div className="shop-card-actions">
                <Link to={"/product/" + p.slug} className="shop-preview"><Eye size={15} /> پیش‌نمایش</Link>
                <button className="shop-add" onClick={() => addToCart(p)}>
                  <ShoppingBag size={16} /> {addedId === p.id ? "✓ افزوده شد" : "افزودن به سبد"}
                </button>
              </div>
            </div>
          ))}
          {products.length === 0 && <p className="biz-sub">محصولی یافت نشد.</p>}
        </div>
      )}
    </div>
  );
}
