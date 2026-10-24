// frontend/src/sound.js
// MahAI round-10 — lightweight WebAudio SFX (no asset files, fully fail-safe)
// صافوت فشون‌پذیر: هر خطا نادیده گرفته می‌شود تا هرگز UI را نشکند

const MUTE_KEY = "mahafzar-sound";

let ctx = null;
function audio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

export const soundApi = {
  isMuted() {
    try { return localStorage.getItem(MUTE_KEY) === "off"; } catch { return false; }
  },
  /* خروجی: آیا حالا خاموش است؟ */
  toggle() {
    try {
      const nowOff = this.isMuted();
      localStorage.setItem(MUTE_KEY, nowOff ? "on" : "off");
      return !nowOff;
    } catch { return false; }
  },
};

/* یک نُت با پوش کوتاه — sine/triangle ملایم */
function note(c, { freq, at = 0, dur = 0.28, type = "sine", vol = 0.12, glide = null }) {
  const t0 = c.currentTime + at;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glide) osc.frequency.exponentialRampToValueAtTime(glide, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

/* افکت صوتی موفقیت — آرپژ صعودی C5→E5→G5→C6 برای لحظه پایان خرید */
export function playSuccess() {
  if (soundApi.isMuted()) return;
  const c = audio();
  if (!c) return;
  try {
    note(c, { freq: 523.25, dur: 0.30, type: "triangle", vol: 0.11 });   // C5
    note(c, { freq: 659.25, at: 0.09, dur: 0.30, type: "triangle", vol: 0.11 }); // E5
    note(c, { freq: 783.99, at: 0.18, dur: 0.34, type: "triangle", vol: 0.11 }); // G5
    note(c, { freq: 1046.5, at: 0.27, dur: 0.55, type: "sine", vol: 0.13 });     // C6
    note(c, { freq: 261.63, at: 0.27, dur: 0.60, type: "sine", vol: 0.05 });     // C4 pad
  } catch {}
}

/* پاپ کوتاه برای افزودن به سبد — با throttle تا در addAll باندل‌ها اسپم نشود */
let lastPop = 0;
export function playPop() {
  if (soundApi.isMuted()) return;
  const now = Date.now();
  if (now - lastPop < 140) return;
  lastPop = now;
  const c = audio();
  if (!c) return;
  try {
    note(c, { freq: 620, dur: 0.10, type: "sine", vol: 0.09, glide: 940 });
    note(c, { freq: 1240, at: 0.05, dur: 0.08, type: "triangle", vol: 0.045 });
  } catch {}
}
