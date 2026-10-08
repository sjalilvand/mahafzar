import React, { useState } from "react";
import { setAppearance, getAppearance, resetAppearance } from "../appearance";

const FONTS = [
  { v: "'Vazirmatn'", t: "وزیرمتن (پیش‌فرض)" },
  { v: "Tahoma", t: "Tahoma" },
  { v: "'Segoe UI'", t: "Segoe UI" },
  { v: "system-ui", t: "سیستمی" },
];
const ACCENTS = ["#22d3ee", "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6", "#0ea5e9"];

export default function AppearanceSettings() {
  const saved = getAppearance();
  const [font, setFont] = useState(saved.font || "'Vazirmatn'");
  const [size, setSize] = useState(saved.size || 16);
  const [lh, setLh] = useState(saved.lh || 1.7);
  const [ls, setLs] = useState(saved.ls || 0);
  const [radius, setRadius] = useState(saved.radius !== undefined ? saved.radius : 12);
  const [accent, setAccent] = useState(saved.accent || "#22d3ee");
  const [saved_, setSavedMsg] = useState("");

  const commit = (next) => {
    setAppearance(next);
    setSavedMsg("✅ ذخیره شد");
    setTimeout(() => setSavedMsg(""), 1500);
  };
  const upd = (patch) => {
    const next = { font, size, lh, ls, radius, accent, ...patch };
    if (patch.font !== undefined) setFont(patch.font);
    if (patch.size !== undefined) setSize(patch.size);
    if (patch.lh !== undefined) setLh(patch.lh);
    if (patch.ls !== undefined) setLs(patch.ls);
    if (patch.radius !== undefined) setRadius(patch.radius);
    if (patch.accent !== undefined) setAccent(patch.accent);
    commit(next);
  };
  const doReset = () => {
    resetAppearance();
    setFont("'Vazirmatn'"); setSize(16); setLh(1.7); setLs(0); setRadius(12); setAccent("#22d3ee");
    setSavedMsg("به حالت پیش‌فرض برگشت");
    setTimeout(() => setSavedMsg(""), 1500);
  };

  return (
    <div className="biz-page">
      <h1 className="biz-title">شخصی‌سازی ظاهر</h1>
      <p className="biz-sub">فونت، اندازه متن، رنگ برند و گردی گوشه‌ها — تغییرات فوری اعمال و ذخیره می‌شوند</p>

      <div className="biz-card" style={{ borderColor: "rgba(34,211,238,.4)" }}>
        <b>پیش‌نمایش زنده</b>
        <div style={{
          marginTop: 10, padding: 16, borderRadius: radius, border: "1px solid rgba(148,163,184,.25)",
          fontFamily: font, fontSize: size, lineHeight: lh, letterSpacing: ls + "px", color: "#e2e8f0",
          background: "rgba(255,255,255,.04)"
        }}>
          <div style={{ color: accent, fontWeight: 800, marginBottom: 6 }}>ماه‌افزار هوشمند رسا</div>
          معماری سامانه‌هایی که فکر می‌کنند — نمونه متن برای ارزیابی خوانایی
          <div style={{ marginTop: 10 }}>
            <span style={{ background: "linear-gradient(135deg," + accent + ",#6366f1)", color: "#04121d", padding: "6px 14px", borderRadius: 999, fontWeight: 700, fontSize: 12 }}>دکمه نمونه</span>
          </div>
        </div>
      </div>

      <div className="biz-card">
        <b>رنگ اصلی برند</b>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0" }}>
          {ACCENTS.map(c => (
            <button key={c} onClick={() => upd({ accent: c })} title={c}
              style={{ width: 34, height: 34, borderRadius: 999, cursor: "pointer",
                       background: c, border: accent === c ? "3px solid #fff" : "2px solid rgba(148,163,184,.3)" }} />
          ))}
          <input type="color" value={accent} onChange={e => upd({ accent: e.target.value })}
                 title="رنگ دلخواه" style={{ width: 34, height: 34, border: "none", background: "none", cursor: "pointer" }} />
        </div>
        <small style={{ color: "#64748b" }}>رنگ روی دکمه‌ها، لینک فعال منو، موجودی کیف پول و ... اعمال می‌شود</small>
      </div>

      <div className="biz-card">
        <b>فونت و متن</b>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14, marginTop: 8 }}>
          <div>
            <small>خانواده فونت</small>
            <select className="biz-select" value={font} onChange={e => upd({ font: e.target.value })}>
              {FONTS.map(f => <option key={f.v} value={f.v}>{f.t}</option>)}
            </select>
          </div>
          <div>
            <small>اندازه فونت: {size}px</small>
            <input type="range" min="12" max="22" step="1" value={size} style={{ width: "100%" }}
                   onChange={e => upd({ size: Number(e.target.value) })} />
            <div style={{ display: "flex", justifyContent: "space-between" }}><small>ریز</small><small>درشت</small></div>
          </div>
          <div>
            <small>فاصله خطوط: {lh}</small>
            <input type="range" min="1.2" max="2.2" step="0.1" value={lh} style={{ width: "100%" }}
                   onChange={e => upd({ lh: Number(e.target.value) })} />
          </div>
          <div>
            <small>فاصله حروف: {ls}px</small>
            <input type="range" min="-0.5" max="2" step="0.1" value={ls} style={{ width: "100%" }}
                   onChange={e => upd({ ls: Number(e.target.value) })} />
          </div>
        </div>
      </div>

      <div className="biz-card">
        <b>گردی گوشه‌ها: {radius}px</b>
        <input type="range" min="0" max="24" step="1" value={radius} style={{ width: "100%", marginTop: 8 }}
               onChange={e => upd({ radius: Number(e.target.value) })} />
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button className="biz-btn" onClick={doReset}>بازگشت به پیش‌فرض</button>
        {saved_ && <span style={{ color: "#22d3ee" }}>{saved_}</span>}
      </div>

      <div className="biz-card" style={{ marginTop: 16 }}>
        <b>💡 تغییر تم روشن/تیره</b>
        <p className="biz-sub" style={{ margin: "6px 0 0" }}>
          تم از سه دکمه کوچک در نوار بالای سایت (خورشید/ماه/برق = هماهنگ با سیستم) تغییر می‌کند.
        </p>
      </div>
    </div>
  );
}
