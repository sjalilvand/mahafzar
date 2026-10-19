import React, { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client";
import { cartApi } from "../../cartStore";
import { compareApi } from "../../compareStore";
import Stars from "../../components/common/Stars";
import {
  Scale, Trash2, ShoppingBag, Eye, Sparkles, X, TrendingUp, Percent, BadgeCheck
} from "lucide-react";

const fmt = n => new Intl.NumberFormat("fa-IR").format(n || 0);
const faNum = n => new Intl.NumberFormat("fa-IR").format(n);

/* صفحه مقایسه محصولات — سبک ژاکت: جدول ویژگی‌ها با برجسته‌سازی بهترین مقدار هر ردیف */
export default function Compare() {
  const slugs = useSyncExternalStore(compareApi.subscribe, compareApi.get, () => []);
  const [all, setAll] = useState([]);
  const [addedId, setAddedId] = useState(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    client.get("/shop/products").then(r => setAll(r.data.products || [])).catch(() => {});
  }, []);

  const items = useMemo(
    () => slugs.map(s => all.find(p => p.slug === s)).filter(Boolean),
    [slugs, all]);

  /* پیشنهاد سریع برای پر کردن جدول: پرفروش‌هایی که در مقایسه نیستند */
  const suggest = useMemo(() =>
    all.filter(p => !compareApi.has(p.slug)).sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0)).slice(0, 6),
    [all, slugs]);

  const toggle = (p) => {
    const res = compareApi.toggle(p.slug);
    if (res === "full") setNote(`حداکثر ${faNum(compareApi.max)} محصول می‌تواند همزمان مقایسه شود.`);
    else setNote("");
  };
  const addCart = (p) => {
    cartApi.add(p); setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1400);
  };

  const best = useMemo(() => {
    if (items.length < 2) return {};
    const by = (fn, dir = "min") => {
      const vals = items.map(fn);
      const target = dir === "min" ? Math.min(...vals) : Math.max(...vals);
      return new Set(items.filter((_, i) => vals[i] === target).map(p => p.id));
    };
    return {
      price: by(p => p.final_price, "min"),
      discount: by(p => p.discount_percent, "max"),
      rating: by(p => p.rating || 0, "max"),
      sales: by(p => p.sales_count || 0, "max"),
    };
  }, [items]);

  const rows = items.length ? [
    { k: "price", label: "قیمت نهایی", render: p => (
      <div className="cmp-price">
        {p.discount_percent > 0 && <del>{fmt(p.price)}</del>}
        <b>{fmt(p.final_price)}</b><small>تومان</small>
      </div>) },
    { k: "discount", label: "تخفیف", render: p => p.discount_percent > 0
      ? <span className="cmp-chip hot"><Percent size={12} /> {fmt(p.discount_percent)}٪</span>
      : <span className="cmp-dim">—</span> },
    { k: "rating", label: "امتیاز کاربران", render: p => <Stars rating={p.rating} count={p.rating_count} /> },
    { k: "sales", label: "فروش", render: p => (
      <span className="cmp-chip"><TrendingUp size={12} /> {fmt(p.sales_count)} فروش</span>) },
    { k: "category", label: "دسته", render: p => p.category || <span className="cmp-dim">—</span> },
    { k: "desc", label: "توضیح کوتاه", render: p => <p className="cmp-desc">{p.short_desc}</p> },
  ] : [];

  return (
    <div className="biz-page" style={{ maxWidth: 1200 }}>
      <div className="shop-hero" style={{ padding: "34px 24px" }}>
        <span className="shop-hero-kicker"><Scale size={14} /> تصمیم‌گیری آگاهانه</span>
        <h1>مقایسه محصولات</h1>
        <p>ویژگی‌های محصولات منتخب را کنار هم ببینید و بهترین انتخاب را داشته باشید (حداکثر {faNum(compareApi.max)} محصول).</p>
      </div>

      {note && <p className="cmp-note"><X size={13} onClick={() => setNote("")} /> {note}</p>}

      {items.length === 0 ? (
        <div className="biz-card" style={{ textAlign: "center", padding: "40px 20px" }}>
          <Scale size={44} style={{ color: "#22d3ee", marginBottom: 10 }} />
          <p>هنوز محصولی برای مقایسه انتخاب نکرده‌اید.</p>
          <p className="biz-sub">در فروشگاه، دکمه «⇄ مقایسه» روی هر محصول را بزنید تا اینجا نمایش داده شود.</p>
          <Link to="/shop" className="biz-btn" style={{ textDecoration: "none", marginTop: 8 }}>
            <Sparkles size={15} /> رفتن به فروشگاه
          </Link>
        </div>
      ) : (
        <>
          <div className="biz-card cmp-wrap">
            <div className="cmp-actions-top">
              <span><Scale size={15} /> {faNum(items.length)} محصول در مقایسه</span>
              <button className="biz-btn-sm danger" onClick={() => compareApi.clear()}>
                <Trash2 size={12} /> پاک کردن همه
              </button>
            </div>
            <div className="cmp-scroll">
              <div className="cmp-table" style={{ "--cmp-cols": items.length }}>
                {/* ---------- هدر ستون‌ها: تصویر و نام محصول ---------- */}
                <div className="cmp-cell cmp-head">
                  <div className="cmp-corner">ویژگی‌ها</div>
                </div>
                {items.map(p => (
                  <div key={"h" + p.id} className="cmp-cell cmp-head">
                    <button className="cmp-remove" title="حذف از مقایسه" onClick={() => compareApi.remove(p.slug)}>
                      <X size={14} />
                    </button>
                    <Link to={"/product/" + p.slug} className={"shop-thumb t-" + (p.id % 5)}>
                      <Sparkles size={26} strokeWidth={1.5} />
                    </Link>
                    <Link to={"/product/" + p.slug} className="cmp-name">{p.name}</Link>
                    {best.price.has(p.id) && <span className="cmp-best"><BadgeCheck size={12} /> کمترین قیمت</span>}
                  </div>
                ))}
                {/* ---------- ردیف‌های ویژگی ---------- */}
                {rows.map(row => (
                  <React.Fragment key={row.k}>
                    <div className="cmp-cell cmp-label">{row.label}</div>
                    {items.map(p => (
                      <div key={row.k + p.id} className={"cmp-cell cmp-val" + (best[row.k] && best[row.k].has(p.id) ? " is-best" : "")}>
                        {row.render(p)}
                        {best[row.k] && best[row.k].has(p.id) && (
                          <span className="cmp-best-inline"><BadgeCheck size={11} /> بهترین</span>
                        )}
                      </div>
                    ))}
                  </React.Fragment>
                ))}
                {/* ---------- ردیف عملیات ---------- */}
                <div className="cmp-cell cmp-label">اقدامات</div>
                {items.map(p => (
                  <div key={"a" + p.id} className="cmp-cell cmp-val">
                    <div className="cmp-act">
                      <button className="biz-btn" onClick={() => addCart(p)}>
                        <ShoppingBag size={14} /> {addedId === p.id ? "✓ افزوده شد" : "افزودن به سبد"}
                      </button>
                      <Link className="shop-preview" to={"/product/" + p.slug}><Eye size={14} /> جزئیات</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {suggest.length > 0 && (
            <div className="biz-card">
              <b>افزودن محصولات دیگر به مقایسه</b>
              <div className="cmp-suggest">
                {suggest.map(p => (
                  <button key={p.id} className="biz-chip biz-closed cmp-sug-chip" onClick={() => toggle(p)}>
                    <Scale size={12} /> {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
