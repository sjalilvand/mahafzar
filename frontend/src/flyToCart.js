/*
 * flyToCart — پرواز تصویر/گوی محصول تا آیکون سبد خرید در ناوبار
 * مسیر bezier درجه-۲ + WAAPI؛ در پایان به badge آیکون سبد ضربه (bump) می‌زند.
 * prefers-reduced-motion → فقط bump بدون پرواز.
 */

let reduceMotion = false;
try {
  reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
} catch (e) { /* noop */ }

function findTarget() {
  const els = Array.from(document.querySelectorAll('.icon-btn.cart-ic, .cart-ic'));
  return els.find((el) => el.getClientRects().length > 0) || els[0] || null;
}

function bump(t) {
  if (!t) return;
  t.classList.remove('cart-bump');
  void t.offsetWidth; /* restart animation */
  t.classList.add('cart-bump');
  setTimeout(() => t.classList.remove('cart-bump'), 750);
}

function sourceCenter(el) {
  if (!el) return null;
  const img = el.matches('img') ? el : el.querySelector && el.querySelector('img');
  const r = (img || el).getBoundingClientRect();
  if (!r || (!r.width && !r.height)) return null;
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export function flyToCart(sourceEl, imageUrl) {
  const target = findTarget();
  bump(target);
  if (reduceMotion || !target) return;

  const s = sourceCenter(sourceEl);
  const tr = target.getBoundingClientRect();
  if (!s || !tr.width) return;
  const e = { x: tr.left + tr.width / 2, y: tr.top + tr.height / 2 };
  /* اگر هدف بیرون دید است (ناوبار چسبان بالای صفحه است ولی کاربر پایین اسکرول کرده) */
  if (e.y < -40 || e.y > window.innerHeight + 40) return;

  const chip = document.createElement('div');
  chip.className = 'fly-chip' + (imageUrl ? ' has-img' : '');
  if (imageUrl) {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = '';
    chip.appendChild(img);
  }
  chip.style.left = s.x + 'px';
  chip.style.top = s.y + 'px';
  document.body.appendChild(chip);

  /* bezier درجه ۲: نقطه کنترل بالای midpoint */
  const c = {
    x: (s.x + e.x) / 2 + (s.x < e.x ? -1 : 1) * Math.min(120, Math.abs(e.x - s.x) * 0.18),
    y: Math.min(s.y, e.y) - Math.max(110, Math.abs(e.x - s.x) * 0.2),
  };
  const STEPS = 24, DUR = 700;
  const frames = [];
  for (let i = 0; i <= STEPS; i++) {
    const u = i / STEPS;
    const x = (1 - u) * (1 - u) * s.x + 2 * (1 - u) * u * c.x + u * u * e.x;
    const y = (1 - u) * (1 - u) * s.y + 2 * (1 - u) * u * c.y + u * u * e.y;
    const sc = 1.05 - 0.6 * u;
    frames.push({
      transform: `translate(-50%,-50%) translate(${x - s.x}px, ${y - s.y}px) scale(${sc})`,
      opacity: u > 0.82 ? Math.max(0, 1 - (u - 0.82) / 0.18) : 1,
      offset: u,
    });
  }
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    chip.remove();
    bump(target);
  };
  try {
    const anim = chip.animate(frames, { duration: DUR, easing: 'cubic-bezier(.32,.72,.35,1)', fill: 'forwards' });
    anim.onfinish = finish;
    anim.oncancel = finish;
  } catch (err) {
    finish();
  }
  setTimeout(finish, DUR + 250); /* safety */
}
