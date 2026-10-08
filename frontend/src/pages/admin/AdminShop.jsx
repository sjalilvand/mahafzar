import React, { useEffect, useState } from "react";
import client from "../../api/client";

const fmt = n => new Intl.NumberFormat("fa-IR").format(n || 0);
const emptyP = { name: "", short_desc: "", description: "", price: 0, discount_percent: 0,
                 category_id: "", image_url: "", file_url: "", flash_hours: 0, featured: false };
const emptyA = { title: "", excerpt: "", body: "", is_published: true };

export default function AdminShop() {
  const [tab, setTab] = useState("products");
  const [denied, setDenied] = useState(false);
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [articles, setArticles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pf, setPf] = useState(emptyP);
  const [af, setAf] = useState(emptyA);
  const [newCat, setNewCat] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const [p, c, a, o] = await Promise.all([
        client.get("/shop/admin/products"), client.get("/shop/admin/categories"),
        client.get("/shop/admin/articles"), client.get("/shop/admin/orders")]);
      setProducts(p.data.products || []); setCats(c.data.categories || []);
      setArticles(a.data.articles || []); setOrders(o.data.orders || []);
    } catch (e) { if (e.response && [401, 403, 422].includes(e.response.status)) setDenied(true); }
  };
  useEffect(() => { load(); }, []);

  const saveProduct = async (ev) => {
    ev.preventDefault(); setMsg("");
    try {
      await client.post("/shop/admin/products", { ...pf, price: Number(pf.price),
        discount_percent: Number(pf.discount_percent), flash_hours: Number(pf.flash_hours) || 0 });
      setMsg("✅ محصول ساخته شد"); setPf(emptyP); load();
    } catch (e) { setMsg((e.response && e.response.data && e.response.data.message) || "خطا"); }
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
    catch (e) { setMsg((e.response && e.response.data && e.response.data.message) || "خطا"); }
  };
  const unpublish = async (a) => { await client.delete("/shop/admin/articles/" + a.id); load(); };

  if (denied) return <div className="biz-page"><div className="biz-card"><p>این بخش فقط برای مدیران است.</p></div></div>;

  return (
    <div className="biz-page" style={{ maxWidth: 1050 }}>
      <h1 className="biz-title">مدیریت فروشگاه</h1>
      <div className="biz-tabs">
        {[["products", "محصولات"], ["cats", "دسته‌ها"], ["articles", "مقالات"], ["orders", "سفارش‌ها"]].map(([k, t]) => (
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
