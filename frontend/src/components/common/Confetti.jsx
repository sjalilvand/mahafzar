import React, { useEffect, useRef } from 'react';

/*
 * Confetti — جشن کانفاس هنگام موفقیت خرید (بدون وابستگی)
 * ذرات rect/circle با گرانش، رنگ‌های پالت Nebula Aurora؛ پس از پایان خود پاک می‌شود.
 */
const COLORS = ['#8b5cf6', '#d946ef', '#22d3ee', '#fbbf24', '#f43f5e', '#a78bfa', '#34d399'];

export default function Confetti() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* noop */ }
    if (reduce) return;

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = (canvas.width = window.innerWidth * dpr);
    const H = (canvas.height = window.innerHeight * dpr);

    const parts = [];
    const cx = W / 2;
    const cy = H * 0.34;
    for (let i = 0; i < 150; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.0;
      const v = (0.32 + Math.random() * 0.68) * 16 * dpr;
      parts.push({
        x: cx + (Math.random() - 0.5) * 140 * dpr,
        y: cy + (Math.random() - 0.5) * 40 * dpr,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        w: (4 + Math.random() * 6) * dpr,
        h: (7 + Math.random() * 9) * dpr,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.32,
        c: COLORS[i % COLORS.length],
        life: 1,
        decay: 0.005 + Math.random() * 0.009,
        shape: Math.random() < 0.35 ? 'circle' : 'rect',
      });
    }

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      let alive = false;
      for (const p of parts) {
        p.vy += 0.3 * dpr;
        p.vx *= 0.992;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        p.life -= p.decay;
        if (p.life <= 0 || p.y > H + 60) continue;
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, 6.2832);
          ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
      }
      if (alive) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, W, H);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} className="confetti-canvas" aria-hidden="true" />;
}
