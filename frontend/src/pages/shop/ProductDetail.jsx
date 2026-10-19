import React, { useEffect, useState, useSyncExternalStore } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import client from "../../api/client";
import { cartApi } from "../../cartStore";
import { wishlistApi } from "../../wishlistStore";
import { compareApi } from "../../compareStore";
import Stars from "../../components/common/Stars";
import WishlistButton from "../../components/common/WishlistButton";
import {
  ShieldCheck, Headset, RefreshCw, Wallet, Package, Heart,
  ShoppingBag, MessageSquareQuote, Gift, Check, Scale
} from "lucide-react";

const fmt = n => new Intl.NumberFormat("fa-IR").format(n || 0);

/* ---------- بخش نظرات و امتیازدهی ---------- */
function ReviewsSection({ slug }) {
  const [data, setData] = useState(null);
  const [rating, setRating] = useState(0);      // ستاره انتخابی فرم
  const [hover, setHover] = useState(0);        // ستاره زیر نشانگر ماوس
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [logged, setLogged] = useState(!!localStorage.getItem("token"));

  const load = () => client.get(`/shop/products/${slug}/reviews`)
    .then(r => setData(r.data)).catch(() => setData({ reviews: [] }));
  useEffect(() => { load(); }, [slug]);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) { setMsg({ ok: false, t: "لطفا تعداد ستاره‌ها را انتخاب کنید" }); return; }
    setBusy(true); setMsg(null);
    try {
      const r = await client.post(`/shop/products/${slug}/reviews`,
        { rating, comment: comment.trim() });
      setMsg({ ok: true, t: r.data.message });
      setComment("");
      load();
    } catch (err) {
      const st = err.response && err.response.status;
      setMsg(st === 401 || st === 422
        ? { ok: false, t: "برای ثبت نظر ابتدا وارد حساب خود شوید." }
        : { ok: false, t: (err.response && err.response.data && err.response.data.message) || "خطا در ثبت نظر" });
    }
    setBusy(false);
  };

  if (!data) return null;
  const dist = data.distribution || {};
  const maxD = Math.max(1, ...Object.values(dist).map(Number));

  return (
    <div className="mh-reviews biz-card">
      <b className="mh-rv-title"><MessageSquareQuote size={18} /> امتیازها و نظرات کاربران</b>

      <div className="mh-rv-summary">
        <div className="mh-rv-avg">
          <b>{data.count ? fmt(data.rating) : "—"}</b>
          <Stars rating={data.rating} size={16} />
          <small>{data.count ? `${fmt(data.count)} نظر ثبت‌شده` : "هنوز نظری ثبت نشده است"}</small>
        </div>
        <div className="mh-rv-dist">
          {[5, 4, 3, 2, 1].map(i => (
            <div key={i} className="mh-rv-dist-row">
              <span>{fmt(i)} ★</span>
              <div className="mh-rv-bar"><i style={{ width: (100 * (Number(dist[String(i)]) || 0) / maxD) + "%" }} /></div>
              <small>{fmt(Number(dist[String(i)]) || 0)}</small>
            </div>
          ))}
        </div>
      </div>

      <form className="mh-rv-form" onSubmit={submit}>
        <b>دیدگاه خود را ثبت کنید</b>
        {logged ? (
          <>
            <div className="mh-rv-stars">
              {[1, 2, 3, 4, 5].map(i => (
                <button type="button" key={i} className="mh-star-btn" title={i + " ستاره"}
                        onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
                        onClick={() => setRating(i)}>
                  <span className={"mh-star-ic " + ((hover || rating) >= i ? "on" : "")}>★</span>
                </button>
              ))}
            </div>
            <textarea className="biz-input mh-rv-text" rows={3} maxLength={1500}
                      placeholder="تجربه خود از این محصول را بنویسید (اختیاری)..."
                      value={comment} onChange={e => setComment(e.target.value)} />
            <button className="biz-btn" disabled={busy}>
              {busy ? "در حال ثبت..." : "ثبت امتیاز و نظر"}
            </button>
          </>
        ) : (
          <p className="biz-sub">برای ثبت نظر ابتدا <Link to="/login" style={{ color: "#22d3ee" }}>وارد حساب</Link> شوید.</p>
        )}
        {msg && <p style={{ color: msg.ok ? "#10b981" : "#f87171", fontWeight: 700 }}>{msg.ok ? "✅ " : "⚠ "}{msg.t}</p>}
      </form>

      {data.reviews.length > 0 && (
        <div className="mh-rv-list">
          {data.reviews.map(r => (
            <div key={r.id} className="mh-rv-item">
              <div className="mh-rv-head">
                <span className="mh-rv-avatar">{(r.username || "ک").trim().charAt(0)}</span>
                <div>
                  <b>{r.username || "کاربر"}</b>
                  <Stars rating={r.rating} size={12} />
                </div>
                <small>{r.created_at && new Date(r.created_at).toLocaleDateString("fa-IR")}</small>
              </div>
              {r.comment && <p>{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- باکس باندل تخفیفی (خرید با هم) ---------- */
function BundleBox({ bundle, onAddAll }) {
  const [picked, setPicked] = useState(() => new Set(bundle.items.map(i => i.id)));
  const sel = bundle.items.filter(i => picked.has(i.id));
  const orig = sel.reduce((s, i) => s + i.final_price, 0);
  const allPicked = sel.length === bundle.items.length;
  const final = allPicked ? Math.round(orig * (100 - bundle.discount_percent) / 100) : orig;
  const save = orig - final;

  const toggle = (id) => setPicked(prev => {
    const n = new Set(prev);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  return (
    <div className="mh-bundle biz-card">
      <b className="mh-bd-title"><Gift size={18} /> {bundle.title}
        <span className="mh-bd-badge">{fmt(bundle.discount_percent)}٪ تخفیف خرید با هم</span>
      </b>
      {bundle.description && <p className="mh-bd-desc">{bundle.description}</p>}
      <div className="mh-bd-items">
        {bundle.items.map((it, idx) => (
          <React.Fragment key={it.id}>
            {idx > 0 && <span className="mh-bd-plus">+</span>}
            <label className={"mh-bd-item " + (picked.has(it.id) ? "on" : "")}>
              <input type="checkbox" checked={picked.has(it.id)} onChange={() => toggle(it.id)} />
              <span className={"shop-thumb t-" + (it.id % 5)}><Package size={20} /></span>
              <span className="mh-bd-name">{it.name}</span>
              <b className="mh-bd-price">{fmt(it.final_price)}</b>
            </label>
          </React.Fragment>
        ))}
      </div>
      <div className="mh-bd-foot">
        <div className="mh-bd-prices">
          {save > 0 && <del>{fmt(orig)}</del>}
          <b className="mh-bd-final">{fmt(final)} <small>تومان</small></b>
          {save > 0 && <span className="mh-bd-save">صرفه‌جویی: {fmt(save)} تومان</span>}
        </div>
        <button className="shop-add" disabled={sel.length === 0} onClick={() => onAddAll(sel)}>
          <ShoppingBag size={15} /> {sel.length === bundle.items.length
            ? "افزودن همه به سبد"
            : `افزودن ${new Intl.NumberFormat("fa-IR").format(sel.length)} مورد`}
        </button>
      </div>
      {!allPicked && sel.length > 0 &&
        <p className="mh-bd-hint">برای دریافت {fmt(bundle.discount_percent)}٪ تخفیف باندل، همه محصولات را انتخاب کنید.</p>}
    </div>
  );
}

/* ---------- صفحه جزئیات محصول ---------- */
export default function ProductDetail() {
  const { slug } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");
  const [bundles, setBundles] = useState([]);
  const [added, setAdded] = useState(false);
  const [inCmp, setInCmp] = useState(() => compareApi.has(slug));
  const toggleCompare = () => {
    const res = compareApi.toggle(slug);
    if (res === "full") { setMsg(`حداکثر ${new Intl.NumberFormat("fa-IR").format(compareApi.max)} محصول می‌تواند همزمان مقایسه شود.`); return; }
    setInCmp(!!res);
    setMsg(res ? "✅ به فهرست مقایسه اضافه شد" : "از فهرست مقایسه حذف شد");
  };
  useEffect(() => {
    setData(null);
    client.get("/shop/products/" + slug).then(r => setData(r.data)).catch(() => setData({ nf: true }));
    client.get(`/shop/products/${slug}/bundles`).then(r => setBundles(r.data.bundles || [])).catch(() => {});
    window.scrollTo({ top: 0 });
  }, [slug]);
  if (!data) return <div className="biz-page"><p className="biz-sub">در حال بارگذاری...</p></div>;
  if (data.nf) return <div className="biz-page"><p>محصول یافت نشد.</p><Link className="biz-btn" to="/shop">بازگشت به فروشگاه</Link></div>;
  const p = data.product;
  const buyNow = () => { cartApi.add(p); nav("/cart"); };
  const addAll = (list) => {
    list.forEach(x => cartApi.add(x));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="biz-page" style={{ maxWidth: 950 }}>
      {p.flash_active && <span className="flash-badge">⚡ فروش فوق‌العاده — فرصت محدود!</span>}
      <h1 className="biz-title">{p.name}</h1>
      <div className="mh-pd-topline">
        <Stars rating={p.rating} count={p.rating_count} size={16} />
        <span className="mh-pd-sep">•</span>
        <span>{p.category && "دسته: " + p.category + " • "}</span>
        <span> فروش: {fmt(p.sales_count)}</span>
        <WishlistButton p={p} size={17} className="mh-pd-wish" />
      </div>
      <div className="biz-card">
        <p style={{ color: "#e2e8f0", lineHeight: 1.9 }}>{p.description}</p>
        <div className="price-box" style={{ margin: "14px 0" }}>
          {p.discount_percent > 0 && <del style={{ marginLeft: 8 }}>{fmt(p.price)}</del>}
          <b style={{ fontSize: 24, color: "#22d3ee" }}>{fmt(p.final_price)} <small>تومان</small></b>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="biz-btn" onClick={() => { cartApi.add(p); setMsg("✅ به سبد اضافه شد"); }}>افزودن به سبد</button>
          <button className="btn-auth solid" onClick={buyNow}>خرید فوری</button>
          <button className={"btn-auth ghost" + (inCmp ? " mh-cmp-on" : "")} onClick={toggleCompare}>
            <Scale size={15} style={{ marginInlineEnd: 5 }} /> {inCmp ? "در مقایسه ✓" : "افزودن به مقایسه"}
          </button>
          <Link className="btn-auth ghost" to="/shop">بازگشت</Link>
        </div>
        {msg && <p style={{ color: "#22d3ee", marginTop: 10 }}>{msg}</p>}
        <div className="mh-pd-trust">
          <div><Wallet size={16} /><span>پرداخت امن از کیف پول</span></div>
          <div><ShieldCheck size={16} /><span>ضمانت بازگشت وجه تا ۷ روز</span></div>
          <div><Headset size={16} /><span>۶ ماه پشتیبانی رایگان</span></div>
          <div><RefreshCw size={16} /><span>به‌روزرسانی خودکار</span></div>
        </div>
      </div>

      {bundles.map(b => <BundleBox key={b.id} bundle={b} onAddAll={addAll} />)}
      {added && <p style={{ color: "#10b981", fontWeight: 700 }}><Check size={15} /> اقلام باندل به سبد اضافه شدند</p>}

      <ReviewsSection slug={slug} />

      {data.related && data.related.length > 0 && (
        <>
          <h3 style={{ color: "#e2e8f0", margin: "22px 0 10px" }}>محصولات مرتبط</h3>
          <div className="shop-grid">
            {data.related.map(r => (
              <div key={r.id} className="shop-card">
                <Link to={"/product/" + r.slug} className={"shop-thumb t-" + (r.id % 5)} style={{ textDecoration: "none" }}>
                  <Package size={30} strokeWidth={1.6} />
                </Link>
                <Link to={"/product/" + r.slug} className="shop-card-body"><h3>{r.name}</h3></Link>
                <div className="shop-meta"><Stars rating={r.rating} count={r.rating_count} /></div>
                <div className="shop-card-foot"><b style={{ color: "#22d3ee" }}>{fmt(r.final_price)} <small>تومان</small></b>
                  <button className="biz-btn" onClick={() => cartApi.add(r)}>افزودن</button></div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
