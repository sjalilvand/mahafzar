/* فروشگاه مقایسه محصولات — الگوی همان cartStore/wishlistStore، مبتنی بر localStorage
   حداکثر ۴ محصول به‌طور همزمان قابل مقایسه هستند */
const KEY = "mahai-compare";
const MAX = 4;
let slugs = [];
try { slugs = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { slugs = []; }
if (!Array.isArray(slugs)) slugs = [];
const listeners = new Set();
const emit = () => {
  try { localStorage.setItem(KEY, JSON.stringify(slugs)); } catch (e) {}
  listeners.forEach(l => l(slugs));
};

export const compareApi = {
  max: MAX,
  get: () => slugs,
  subscribe(l) { listeners.add(l); return () => listeners.delete(l); },
  count: () => slugs.length,
  has: (slug) => slugs.includes(slug),
  /* خروجی: true=اضافه شد، false=حذف شد، "full"=ظرفیت پر است */
  toggle(slug) {
    if (this.has(slug)) {
      slugs = slugs.filter(s => s !== slug);
      emit();
      return false;
    }
    if (slugs.length >= MAX) return "full";
    slugs = [...slugs, slug];
    emit();
    return true;
  },
  remove(slug) { slugs = slugs.filter(s => s !== slug); emit(); },
  clear() { slugs = []; emit(); },
};
