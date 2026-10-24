// frontend/src/chartFontSync.js
// round-12 — سوییچ فونت فارسی روی نمودارهای Chart.js هم اعمال شود
// (فونت پیش‌فرض چارت از متغیر CSS --font-family خوانده می‌شود و با
//  رویداد سراسری mahafzar:font-changed چارت‌های باز هم به‌روز می‌شوند)

let _listening = false;

export function syncChartFont(ChartJS) {
  try {
    const fam = (window.__mahafzarFontFamily ||
      getComputedStyle(document.documentElement).getPropertyValue('--font-family') || '').trim();
    if (fam) {
      ChartJS.defaults.font.family = `${fam}, Vazirmatn, Tahoma, sans-serif`;
    }
  } catch (e) { /* noop */ }

  if (_listening) return;
  _listening = true;
  try {
    window.addEventListener('mahafzar:font-changed', () => {
      syncChartFont(ChartJS);
      // چارت‌های باز فوراً با فونت جدید بازکشیده شوند
      try {
        Object.values(ChartJS.instances || {}).forEach(c => { try { c.update(); } catch { /* noop */ } });
      } catch (e) { /* noop */ }
    });
  } catch (e) { /* noop */ }
}
