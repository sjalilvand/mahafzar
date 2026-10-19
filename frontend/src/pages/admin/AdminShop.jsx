import React, { useEffect, useState } from "react";
import client from "../../api/client";
import { Gift, MessageSquareQuote, Pencil, Trash2, X, Check } from "lucide-react";

const fmt = n => new Intl.NumberFormat("fa-IR").format(n || 0);
const emptyP = { name: "", short_desc: "", description: "", price: 0, discount_percent: 0,
                 category_id: "", image_url: "", file_url: "", flash_hours: 0, featured: false };
const emptyA = { title: "", excerpt: "", body: "", is_published: true };
const emptyB = { title: "", description: "", discount_percent: 10, product_ids: [], is_active: true };
const stars = r => "★".repeat(r) + "☆".repeat(5 - r);

export default function AdminShop() {
  const [tab, setTab] = useState("products");
  const [denied, setDenied] = useState(false);
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [articles, setArticles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [pf, setPf] = useState(emptyP);
  const [af, setAf] = useState(emptyA);
  const [bf, setBf] = useState(emptyB);
  const [editBid, setEditBid] = useState(null);
  const [editRid, setEditRid] = useState(null);
  const [rf, setRf] = useState({ rating: 5, comment: "", username: "" });
  const [newCat, setNewCat] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const [p, c, a, o, b, rv] = await Promise.all([
        client.get("/shop/admin/products"), client.get("/shop/admin/categories"),
        client.get("/shop/admin/articles"), client.get("/shop/admin/orders"),
        client.get("/shop/admin/bundles"), client.get("/shop/admin/reviews")]);
      setProducts(p.data.products || []); setCats(c.data.categories || []);
      setArticles(a.data.articles || []); setOrders(o.data.orders || []);
      setBundles(b.data.bundles || []); setReviews(rv.data.reviews || []);
    } catch (e) { if (e.response && [401, 403, 422].includes(e.response.status)) setDenied(true); }
  };
  useEffect(() => { load(); }, []);

  const errText = (e) => (e.response && e.response.data && e.response.data.message) || "خطا";

  const saveProduct = async (ev) => {
    ev.preventDefault(); setMsg("");
    try {
      await client.post("/shop/admin/products", { ...pf, price: Number(pf.price),
        discount_percent: Number(pf.discount_percent), flash_hours: Number(pf.flash_hours) || 0 });
      setMsg("✅ محصول ساخته شد"); setPf(emptyP); load();
    } catch (e) { setMsg(errText(e)); }
  };
  const toggleFlash = async (p) => {
    await client.put("/shop/admin/products/" + p.id, { flash_hours: p.flash_active ? 0 : 48 });
    load();
  };
  const addCat = async () => {
    if (!newCat.trim()) return;
    try { await client.post("/shop/admin/categories", { name: newCat }); setNewCat(""); load(); } catch {}
  };
  const saveArticle = async (ev) => {
    ev.preventDefault(); setMsg("");
    try { await client.post("/shop/admin/articles", af); setMsg("✅ مقاله منتشر شد"); setAf(emptyA); setTab("articles"); load(); }
    catch (e) { setMsg(errText(e)); }
  };
  const unpublish = async (a) => { await client.delete("/shop/admin/articles/" + a.id); load(); };

  /* ---------------- باندل‌ها ---------------- */
  const togglePid = (id) => setBf(prev => {
    const has = prev.product_ids.includes(id);
    return { ...prev, product_ids: has ? prev.product_ids.filter(x => x !== id) : [...prev.product_ids, id] };
  });
  const pickedProducts = products.filter(p => bf.product_ids.includes(p.id));
  const bOrig = pickedProducts.reduce((s, p) => s + (p.final_price || 0), 0);
  const bFinal = Math.round(bOrig * (100 - Number(bf.discount_percent || 0)) / 100);

  const saveBundle = async (ev) => {
    ev.preventDefault(); setMsg("");
    try {
      if (editBid) {
        await client.put("/shop/admin/bundles/" + editBid, bf);
        setMsg("✅ باندل به‌روزرسانی شد");
      } else {
        await client.post("/shop/admin/bundles", bf);
        setMsg("✅ باندل ساخته شد");
      }
      setBf(emptyB); setEditBid(null); load();
    } catch (e) { setMsg(errText(e)); }
  };
  const editBundle = (b) => {
    setEditBid(b.id);
    setBf({ title: b.title, description: b.description || "",
            discount_percent: b.discount_percent || 0,
            product_ids: (b.items || []).map(i => i.id), is_active: !!b.is_active });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const toggleBundleActive = async (b) => {
    await client.put("/shop/admin/bundles/" + b.id, { is_active: !b.is_active }); load();
  };
  const delBundle = async (b) => {
    if (!window.confirm(`باندل «${b.title}» غیرفعال شود؟`)) return;
    await client.delete("/shop/admin/bundles/" + b.id); load();
  };

  /* ---------------- نظرات فروشگاه ---------------- */
  const startEditReview = (r) => {
    setEditRid(r.id);
    setRf({ rating: r.rating, comment: r.comment || "", username: r.username || "" });
  };
  const saveReview = async (rid) => {
    setMsg("");
    try { await client.put("/shop/admin/reviews/" + rid, rf); setMsg("✅ نظر به‌روزرسانی شد"); setEditRid(null); load(); }
    catch (e) { setMsg(errText(e)); }
  };
  const delReview = async (r) => {
    if (!window.confirm("این نظر حذف شود؟")) return;
    await client.delete("/shop/admin/reviews/" + r.id); load();
  };

  if (denied) return <div className="biz-page"><div className="biz-card"><p>این بخش فقط برای مدیران است.</p></div></div>;

  return (
    <div className="biz-page" style={{ maxWidth: 1050 }}>
      <h1 className="biz-title">مدیریت فروشگاه</h1>
      <div className="biz-tabs">
        {[["products", "محصولات"], ["cats", "دسته‌ها"], ["bundles", "باندل‌ها"],
          ["reviews", "نظرات"], ["articles", "مقالات"], ["orders", "سفارش‌ها"]].map(([k, t]) => (
          <button key={k} className={"biz-tab" + (tab === k ? " active" : "")} onClick={() => setTab(k)}>{t}</button>
        ))}
      </div>
      {msg && <p style={{ color: "#22d3ee" }}>{msg}</p>}

      {tab === "products" && (
        <>
          <form className="biz-card" onSubmit={saveProduct}>
            <b>محصول جدید</b>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
              <input className="biz-input" placeholder="نام محصول" value={pf.name} onChange={e => setPf({ ...pf, name: e.target.value })} required />
              <input className="biz-input" type="number" placeholder="قیمت (تومان)" value={pf.price} onChange={e => setPf({ ...pf, price: e.target.value })} required />
              <input className="biz-input" type="number" placeholder="تخفیف ٪" value={pf.discount_percent} onChange={e => setPf({ ...pf, discount_percent: e.target.value })} />
              <select className="biz-select" value={pf.category_id} onChange={e => setPf({ ...pf, category_id: e.target.value })}>
                <option value="">بدون دسته</option>
                {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input className="biz-input" type="number" placeholder="فروش فوق‌العاده (ساعت، ۰=خاموش)" value={pf.flash_hours} onChange={e => setPf({ ...pf, flash_hours: e.target.value })} />
              <input className="biz-input" placeholder="لینک فایل دانلود" value={pf.file_url} onChange={e => setPf({ ...pf, file_url: e.target.value })} />
            </div>
            <input className="biz-input" placeholder="توضیح کوتاه" value={pf.short_desc} onChange={e => setPf({ ...pf, short_desc: e.target.value })} />
            <textarea className="biz-textarea" placeholder="توضیحات کامل" value={pf.description} onChange={e => setPf({ ...pf, description: e.target.value })} />
            <label style={{ color: "#94a3b8", fontSize: 13 }}> <input type="checkbox" checked={pf.featured} onChange={e => setPf({ ...pf, featured: e.target.checked })} /> محصول ویژه</label>
            <br /><button className="biz-btn">ذخیره محصول</button>
          </form>
          <div className="biz-card">
            <b>محصولات ({products.length})</b>
            {products.map(p => (
              <div key={p.id} className="biz-row">
                <span><b>{p.name}</b>
                  <small style={{ color: "#64748b", display: "block" }}>
                    {fmt(p.final_price)} T • تخفیف {p.discount_percent}٪ • فروش {p.sales_count} {p.flash_active ? "• ⚡ فلش فعال" : ""}
                  </small></span>
                <span style={{ display: "flex", gap: 6 }}>
                  <button className="biz-btn-sm" onClick={() => toggleFlash(p)}>{p.flash_active ? "خاموش فلش" : "فلش ۴۸ساعت"}</button>
                  <button className="biz-btn-sm danger" onClick={async () => { await client.delete("/shop/admin/products/" + p.id); load(); }}>غیرفعال</button>
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "cats" && (
        <div className="biz-card">
          <b>دسته‌ها</b>
          <div style={{ display: "flex", gap: 8, margin: "10px 0" }}>
            <input className="biz-input" style={{ margin: 0 }} placeholder="نام دسته جدید" value={newCat} onChange={e => setNewCat(e.target.value)} />
            <button className="biz-btn" onClick={addCat}>افزودن</button>
          </div>
          {cats.map(c => <div key={c.id} className="biz-row"><span>{c.name}</span><small style={{ color: "#475569" }}>{c.slug}</small></div>)}
        </div>
      )}

      {tab === "bundles" && (
        <>
          <form className="biz-card" onSubmit={saveBundle}>
            <b style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Gift size={17} style={{ color: "#22d3ee" }} />
              {editBid ? "ویرایش باندل" : "باندل تخفیفی جدید"}
              {editBid && (
                <button type="button" className="biz-btn-sm danger" style={{ marginInlineStart: "auto" }}
                        onClick={() => { setEditBid(null); setBf(emptyB); }}>
                  <X size={12} /> لغو ویرایش
                </button>
              )}
            </b>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
              <input className="biz-input" placeholder="عنوان باندل" value={bf.title}
                     onChange={e => setBf({ ...bf, title: e.target.value })} required />
              <input className="biz-input" type="number" min={0} max={90} placeholder="درصد تخفیف"
                     value={bf.discount_percent}
                     onChange={e => setBf({ ...bf, discount_percent: e.target.value })} />
            </div>
            <input className="biz-input" placeholder="توضیح کوتاه باندل" value={bf.description}
                   onChange={e => setBf({ ...bf, description: e.target.value })} />

            <b style={{ display: "block", marginTop: 6, color: "#e2e8f0", fontSize: 13.5 }}>
              انتخاب محصولات (حداقل ۲ محصول):
            </b>
            <div className="mh-adm-pick">
              {products.map(p => (
                <label key={p.id} className={"mh-adm-pick-item" + (bf.product_ids.includes(p.id) ? " on" : "")}>
                  <input type="checkbox" checked={bf.product_ids.includes(p.id)}
                         onChange={() => togglePid(p.id)} />
                  <span className="mh-adm-pick-name">{p.name}</span>
                  <small>{fmt(p.final_price)} T</small>
                </label>
              ))}
              {products.length === 0 && <p className="biz-sub">ابتدا محصول بسازید.</p>}
            </div>

            <div className="mh-adm-sum">
              <span>جمع محصولات: <b>{fmt(bOrig)}</b> تومان</span>
              <span>با تخفیف {fmt(bf.discount_percent || 0)}٪: <b style={{ color: "#22d3ee" }}>{fmt(bFinal)}</b> تومان</span>
              <span className="mh-adm-save">صرفه‌جویی مشتری: <b>{fmt(bOrig - bFinal)}</b> تومان</span>
            </div>

            <button className="biz-btn" disabled={bf.product_ids.length < 2}>
              {editBid ? "ذخیره تغییرات باندل" : "ساخت باندل"}
            </button>
          </form>

          <div className="biz-card">
            <b>باندل‌ها ({bundles.length})</b>
            {bundles.map(b => (
              <div key={b.id} className="biz-row">
                <span>
                  <b>{b.title}</b>
                  <small style={{ color: "#64748b", display: "block" }}>
                    تخفیف {b.discount_percent}٪ • {fmt(b.final_total)} T
                    (بدون تخفیف {fmt(b.original_total)} T) • {(b.items || []).map(i => i.name).join(" + ")}
                  </small>
                </span>
                <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span className={"biz-chip " + (b.is_active ? "biz-answered" : "biz-closed")}>
                    {b.is_active ? "فعال" : "غیرفعال"}
                  </span>
                  <button className="biz-btn-sm" onClick={() => editBundle(b)}><Pencil size={11} /> ویرایش</button>
                  <button className="biz-btn-sm" onClick={() => toggleBundleActive(b)}>
                    {b.is_active ? "غیرفعال‌کن" : "فعال‌کن"}
                  </button>
                  <button className="biz-btn-sm danger" onClick={() => delBundle(b)}><Trash2 size={11} /></button>
                </span>
              </div>
            ))}
            {bundles.length === 0 && <p className="biz-sub">هنوز باندلی ساخته نشده است.</p>}
          </div>
        </>
      )}

      {tab === "reviews" && (
        <div className="biz-card">
          <b style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MessageSquareQuote size={17} style={{ color: "#22d3ee" }} />
            نظرات و امتیازهای محصولات ({reviews.length})
          </b>
          <p className="biz-sub">نظرات کاربران را ویرایش یا حذف کنید؛ امتیاز میانگین هر محصول بلافاصله به‌روز می‌شود.</p>
          {reviews.map(r => (
            <div key={r.id} className="mh-adm-review">
              <div className="mh-adm-review-head">
                <span>
                  <b>{r.product}</b>
                  <small style={{ color: "#64748b", display: "block" }}>
                    {r.username || "کاربر"} • {r.created_at && new Date(r.created_at).toLocaleDateString("fa-IR")}
                  </small>
                </span>
                {editRid !== r.id && (
                  <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="mh-adm-stars" title={r.rating + " از ۵"}>{stars(r.rating)}</span>
                    <button className="biz-btn-sm" onClick={() => startEditReview(r)}><Pencil size={11} /> ویرایش</button>
                    <button className="biz-btn-sm danger" onClick={() => delReview(r)}><Trash2 size={11} /> حذف</button>
                  </span>
                )}
              </div>

              {editRid === r.id ? (
                <div className="mh-adm-review-edit">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 }}>
                    <label style={{ color: "#94a3b8", fontSize: 13 }}>
                      امتیاز:
                      <select className="biz-select" value={rf.rating}
                              onChange={e => setRf({ ...rf, rating: Number(e.target.value) })}>
                        {[5, 4, 3, 2, 1].map(i => <option key={i} value={i}>{i} ستاره</option>)}
                      </select>
                    </label>
                    <label style={{ color: "#94a3b8", fontSize: 13 }}>
                      نام کاربر:
                      <input className="biz-input" value={rf.username}
                             onChange={e => setRf({ ...rf, username: e.target.value })} />
                    </label>
                  </div>
                  <textarea className="biz-textarea" rows={3} value={rf.comment}
                            placeholder="متن نظر"
                            onChange={e => setRf({ ...rf, comment: e.target.value })} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="biz-btn" onClick={() => saveReview(r.id)}><Check size={14} /> ذخیره</button>
                    <button className="biz-btn-sm danger" onClick={() => setEditRid(null)}><X size={12} /> انصراف</button>
                  </div>
                </div>
              ) : (
                r.comment && <p className="mh-adm-review-txt">{r.comment}</p>
              )}
            </div>
          ))}
          {reviews.length === 0 && <p className="biz-sub">هنوز نظری ثبت نشده است.</p>}
        </div>
      )}

      {tab === "articles" && (
        <>
          <form className="biz-card" onSubmit={saveArticle}>
            <b>مقاله جدید</b>
            <input className="biz-input" placeholder="عنوان" value={af.title} onChange={e => setAf({ ...af, title: e.target.value })} required />
            <input className="biz-input" placeholder="خلاصه" value={af.excerpt} onChange={e => setAf({ ...af, excerpt: e.target.value })} />
            <textarea className="biz-textarea" style={{ minHeight: 160 }} placeholder="متن کامل مقاله" value={af.body} onChange={e => setAf({ ...af, body: e.target.value })} />
            <button className="biz-btn">انتشار</button>
          </form>
          <div className="biz-card">
            <b>مقالات ({articles.length})</b>
            {articles.map(a => (
              <div key={a.id} className="biz-row"><span>{a.title}</span>
                <button className="biz-btn-sm danger" onClick={() => unpublish(a)}>پیش‌نویس</button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "orders" && (
        <div className="biz-card">
          <b>سفارش‌ها ({orders.length})</b>
          {orders.map(o => (
            <div key={o.ref_code} className="biz-row">
              <span><b style={{ color: "#22d3ee" }}>{o.ref_code}</b> — {fmt(o.total)} T
                <small style={{ color: "#64748b", display: "block" }}>
                  user#{o.user_id} • {o.items.map(i => i.title + "×" + i.qty).join("، ")}
                </small></span>
              <span className={"biz-chip " + (o.status === "paid" ? "biz-answered" : "biz-open")}>
                {o.status === "paid" ? "پرداخت‌شده" : o.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
