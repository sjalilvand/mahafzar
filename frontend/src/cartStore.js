const KEY = "mahai-cart";
let items = [];
try { items = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { items = []; }
if (!Array.isArray(items)) items = [];
const listeners = new Set();
const emit = () => {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {}
  listeners.forEach(l => l(items));
};

export const cartApi = {
  get: () => items,
  subscribe(l) { listeners.add(l); return () => listeners.delete(l); },
  add(p, qty = 1) {
    const ex = items.find(i => i.id === p.id);
    if (ex) {
      items = items.map(i => i.id === p.id ? { ...i, qty: Math.min(10, i.qty + qty) } : i);
    } else {
      items = [...items, { id: p.id, name: p.name, slug: p.slug, price: p.final_price,
                           image: p.image_url, qty: Math.min(10, qty) }];
    }
    emit();
  },
  remove(id) { items = items.filter(i => i.id !== id); emit(); },
  setQty(id, q) {
    items = items.map(i => i.id === id ? { ...i, qty: Math.min(10, Math.max(1, q)) } : i);
    emit();
  },
  clear() { items = []; emit(); },
  count: () => items.reduce((s, i) => s + i.qty, 0),
  total: () => items.reduce((s, i) => s + i.price * i.qty, 0),
};
