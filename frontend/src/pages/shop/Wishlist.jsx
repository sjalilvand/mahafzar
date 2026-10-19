import React, { useEffect, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { Heart, Eye, ShoppingBag, Sparkles, Trash2 } from "lucide-react";
import client from "../../api/client";
import { cartApi } from "../../cartStore";
import { wishlistApi } from "../../wishlistStore";
import Stars from "../../components/common/Stars";

const fmt = n => new Intl.NumberFormat("fa-IR").format(n || 0);

export default function Wishlist() {
  const saved = useSyncExternalStore(wishlistApi.subscribe, wishlistApi.get, () => []);
  const [fresh, setFresh] = useState({}); // به‌روزرسانی قیمت/امتیاز از سرور

  useEffect(() => {
    client.get("/shop/products")
      .then(r => {
        const map = {};
        (r.data.products || []).forEach(p => { map[p.id] = p; });
        setFresh(map);
      })
      .catch(() => {});
  }, []);

  const items = saved.map(s => fresh[s.id] || s);
  const [addedId, setAddedId] = useState(null);
  const addToCart = (p) => {
    cartApi.add(p);
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1400);
  };

  return (
    <div className="biz-page" style={{ maxWidth: 1200 }}>
      <div className="shop-hero" style={{ padding: "34px 24px" }}>
        <span className="shop-hero-kicker"><Heart size={14} /> فهرست شخصی شما</span>
        <h1>علاقه‌مندی‌های من</h1>
        <p>محصولاتی که برای خرید بعدی نشان کرده‌اید — قیمت‌ها همیشه به‌روز هستند.</p>
      </div>

      {items.length === 0 ? (
        <div className="biz-card" style={{ textAlign: "center", padding: "40px 20px" }}>
          <Heart size={44} style={{ color: "#22d3ee", marginBottom: 10 }} />
          <p>هنوز محصولی به علاقه‌مندی‌ها اضافه نکرده‌اید.</p>
          <p className="biz-sub">روی آیکون قلب ♡ هر محصول در فروشگاه بزنید تا اینجا ذخیره شود.</p>
          <Link to="/shop" className="biz-btn" style={{ textDecoration: "none", marginTop: 8 }}>
            <Sparkles size={15} /> رفتن به فروشگاه
          </Link>
        </div>
      ) : (
        <div className="shop-grid">
          {items.map(p => (
            <div key={p.id} className="shop-card">
              <Link to={"/product/" + p.slug} className={"shop-thumb t-" + (p.id % 5)} style={{ textDecoration: "none" }}>
                <Sparkles size={30} strokeWidth={1.6} />
                {p.discount_percent > 0 && <span className="disc-badge">{p.discount_percent}٪ تخفیف</span>}
              </Link>
              <button className="mh-wish-btn active shop-card-wish" title="حذف از علاقه‌مندی‌ها"
                      onClick={() => wishlistApi.remove(p.id)}>
                <Trash2 size={15} />
              </button>
              <Link to={"/product/" + p.slug} className="shop-card-body">
                <h3>{p.name}</h3>
                <p>{p.short_desc}</p>
              </Link>
              <div className="shop-meta">
                <Stars rating={p.rating} count={p.rating_count} />
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
        </div>
      )}
    </div>
  );
}
