/* فروشگاه علاقه‌مندی‌ها (wishlist) — الگوی همان cartStore، مبتنی بر localStorage */
const KEY = "mahai-wishlist";
let items = [];
try { items = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { items = []; }
if (!Array.isArray(items)) items = [];
const listeners = new Set();
const emit = () => {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {}
  listeners.forEach(l => l(items));
};

export const wishlistApi = {
  get: () => items,
  subscribe(l) { listeners.add(l); return () => listeners.delete(l); },
  count: () => items.length,
  has: (id) => items.some(i => i.id === id),
  toggle(p) {
    if (this.has(p.id)) {
      items = items.filter(i => i.id !== p.id);
      emit();
      return false; // حالا حذف شده
    }
    items = [{ id: p.id, name: p.name, slug: p.slug, price: p.price,
               final_price: p.final_price, discount_percent: p.discount_percent,
               image_url: p.image_url, rating: p.rating || 0,
               rating_count: p.rating_count || 0, category: p.category },
             ...items];
    emit();
    return true; // حالا اضافه شده
  },
  remove(id) { items = items.filter(i => i.id !== id); emit(); },
  clear() { items = []; emit(); },
};
