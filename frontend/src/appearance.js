const KEY = "mahai-appearance";
function apply(p) {
  if (!p) return;
  const r = document.documentElement.style;
  if (p.font) r.setProperty("--ap-font", p.font);
  if (p.size) r.setProperty("--ap-fsize", p.size + "px");
  if (p.lh) r.setProperty("--ap-lh", String(p.lh));
  if (p.ls !== undefined && p.ls !== null) r.setProperty("--ap-ls", p.ls + "px");
  if (p.radius !== undefined && p.radius !== null) r.setProperty("--ap-radius", p.radius + "px");
  if (p.accent) r.setProperty("--accent", p.accent);
}
try { apply(JSON.parse(localStorage.getItem(KEY) || "null")); } catch (e) {}
export const setAppearance = (p) => { localStorage.setItem(KEY, JSON.stringify(p)); apply(p); };
export const getAppearance = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } };
export const resetAppearance = () => {
  localStorage.removeItem(KEY);
  ["--ap-font","--ap-fsize","--ap-lh","--ap-ls","--ap-radius","--accent"].forEach(v => document.documentElement.style.removeProperty(v));
};
