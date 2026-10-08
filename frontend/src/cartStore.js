const KEY = "mahai-cart";
let items = [];
try { items = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { items = []; }
const listeners = new Set();
const emit = () => { localStorage.setItem(KEY, JSON.stringify(items)); listeners.forEach(l => l()); };

export const cartApi = {
  get: () => items,
  subscribe(l) { listeners.add(l); return () => listeners.delete(l); },
  add(p, qty = 1) {
    const ex = items.find(i => i.id === p.id);
    if (ex) ex.qty = Math.min(10, ex.qty + qty);
    else items.push({ id: p.id, name: p.name, slug: p.slug, price: p.final_price,
                      image: p.image_url, qty: Math.min(10, qty) });
    emit();
  },
  remove(id) { items = items.filter(i => i.id !== id); emit(); },
  setQty(id, q) { const it = items.find(i => i.id === id); if (it) { it.qty = Math.min(10, Math.max(1, q)); emit(); } },
  clear() { items = []; emit(); },
  count: () => items.reduce((s, i) => s + i.qty, 0),
  total: () => items.reduce((s, i) => s + i.price * i.qty, 0),
};
