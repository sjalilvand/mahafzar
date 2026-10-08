# ================================================================
#  SCRIPT 37 - CART BUG FIX (immutable) + SHOP GLAM v3 + v17
# ================================================================
 $ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
 $ProjectPath = "E:\mahafzar-portal"
 $FE  = "$ProjectPath\frontend"
 $Bak = "$ProjectPath\_Analysis_Reports\Backups"
 $Stamp = Get-Date -Format 'yyyyMMdd_HHmm'
New-Item -ItemType Directory -Path $Bak -Force | Out-Null

# ---------- 1) cartStore.js — IMMUTABLE FIX (the real bug) ----------
Copy-Item "$FE\src\cartStore.js" "$Bak\cartStore.js.bak_$Stamp" -Force
@'
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
'@ | Set-Content "$FE\src\cartStore.js" -Encoding UTF8
Write-Host "[OK] cartStore.js -> immutable (cart now updates LIVE)" -ForegroundColor Green

# ---------- 2) Shop.jsx — add-button feedback ----------
Copy-Item "$FE\src\pages\shop\Shop.jsx" "$Bak\Shop.jsx.bak_$Stamp" -Force
 $sh = Get-Content "$FE\src\pages\shop\Shop.jsx" -Raw
if ($sh -notmatch 'addedId') {
    $sh = $sh -replace [regex]::Escape('const [loading, setLoading] = useState(true);'),
        "const [loading, setLoading] = useState(true);`r`n  const [addedId, setAddedId] = useState(null);"
    $sh = $sh -replace [regex]::Escape('useEffect(() => { client.get("/shop/categories").then(r => setCats(r.data.categories || [])).catch(() => {}); }, []);'),
        "useEffect(() => { client.get(`"/shop/categories`").then(r => setCats(r.data.categories || [])).catch(() => {}); }, []);`r`n`r`n  const addToCart = (p) => {`r`n    cartApi.add(p);`r`n    setAddedId(p.id);`r`n    setTimeout(() => setAddedId(null), 1400);`r`n  };"
    $sh = $sh -replace [regex]::Escape('<button className="shop-add" onClick={() => cartApi.add(p)}>`r`n                <ShoppingBag size={16} /> افزودن به سبد`r`n              </button>'),
        "<button className={'shop-add' + (addedId === p.id ? ' ok' : '')} onClick={() => addToCart(p)}>`r`n                {addedId === p.id ? <>✓ به سبد اضافه شد</> : <><ShoppingBag size={17} /> افزودن به سبد</>}`r`n              </button>"
    $sh | Set-Content "$FE\src\pages\shop\Shop.jsx" -Encoding UTF8
    Write-Host "[OK] Shop.jsx -> add-feedback button" -ForegroundColor Green
} else { Write-Host "[SKIP] Shop.jsx already has feedback" -ForegroundColor Yellow }

# ---------- 3) SHOP CSS v2 -> v3 (bigger badges + effects) ----------
 $ac = "$FE\src\App.css"
Copy-Item $ac "$Bak\App.css.bak_$Stamp" -Force
 $c = Get-Content $ac -Raw
 $newBlock = @'
/* ==== MAHAI SHOP UI v3 (glam+) ==== */
.shop-hero{position:relative;overflow:hidden;border-radius:22px;padding:40px 34px;margin-bottom:26px;
  background:linear-gradient(120deg, color-mix(in srgb,var(--accent,#22d3ee) 22%, #0b1220), #0b1220 50%, color-mix(in srgb,#6366f1 26%, #0b1220));
  background-size:170% 170%;animation:heroShift 11s ease-in-out infinite;
  border:1px solid rgba(148,163,184,.2)}
@keyframes heroShift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
.shop-hero h1{margin:10px 0 8px;font-size:34px;font-weight:900;color:#f1f5f9;letter-spacing:-.01em}
.shop-hero p{margin:0;color:#a8b6cc;font-size:14.5px}
.shop-hero-kicker{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:800;color:var(--accent,#22d3ee);
  background:color-mix(in srgb,var(--accent,#22d3ee) 14%,transparent);border:1px solid color-mix(in srgb,var(--accent,#22d3ee) 40%,transparent);
  padding:7px 15px;border-radius:999px}
.shop-hero-glow{position:absolute;inset-inline-end:26px;bottom:-46px;color:var(--accent,#22d3ee);opacity:.16;pointer-events:none;
  animation:heroSpark 4s ease-in-out infinite}
@keyframes heroSpark{0%,100%{opacity:.10;transform:scale(1) rotate(0deg)}50%{opacity:.22;transform:scale(1.12) rotate(12deg)}}
.theme-light .shop-hero{background:linear-gradient(120deg, color-mix(in srgb,var(--accent,#22d3ee) 16%, #f8fafc), #f8fafc 50%, color-mix(in srgb,#6366f1 14%, #f8fafc));border-color:rgba(15,23,42,.08)}
.theme-light .shop-hero h1{color:#0f172a}
.theme-light .shop-hero p{color:#475569}

.shop-toolbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px}
.shop-cats{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px}
.shop-cats .biz-chip{cursor:pointer;font-size:13.5px;padding:8px 18px;transition:.2s}
.shop-cats .biz-chip:hover{transform:translateY(-2px)}

.shop-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:22px;align-items:stretch}
.shop-card{position:relative;display:flex;flex-direction:column;gap:11px;padding:16px;border-radius:20px;
  background:linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02));
  border:1px solid rgba(148,163,184,.16);transition:transform .28s,box-shadow .28s,border-color .28s}
.shop-card:hover{transform:translateY(-7px);border-color:color-mix(in srgb,var(--accent,#22d3ee) 60%,transparent);
  box-shadow:0 24px 52px rgba(0,0,0,.45), 0 0 26px color-mix(in srgb,var(--accent,#22d3ee) 18%,transparent)}
.theme-light .shop-card{background:#ffffff;border-color:rgba(15,23,42,.09);box-shadow:0 3px 16px rgba(15,23,42,.06)}
.theme-light .shop-card:hover{box-shadow:0 20px 42px rgba(15,23,42,.14)}

.shop-thumb{position:relative;height:140px;border-radius:15px;display:flex;align-items:center;justify-content:center;color:#fff;overflow:hidden}
.shop-thumb::after{content:'';position:absolute;inset:0;background:radial-gradient(circle at 28% 18%, rgba(255,255,255,.3), transparent 55%)}
.shop-thumb svg{position:relative;z-index:1;filter:drop-shadow(0 5px 12px rgba(0,0,0,.3));transition:transform .3s}
.shop-card:hover .shop-thumb svg{transform:scale(1.14) rotate(-4deg)}
.shop-thumb::before{content:'';position:absolute;top:0;inset-inline-start:-80%;width:55%;height:100%;z-index:2;
  background:linear-gradient(100deg, transparent, rgba(255,255,255,.35), transparent);transform:skewX(-18deg);transition:none}
.shop-card:hover .shop-thumb::before{animation:thumbShine .85s ease}
@keyframes thumbShine{to{inset-inline-start:130%}}
.t-0{background:linear-gradient(135deg,#0ea5e9,#6366f1)}
.t-1{background:linear-gradient(135deg,#8b5cf6,#ec4899)}
.t-2{background:linear-gradient(135deg,#10b981,#0ea5e9)}
.t-3{background:linear-gradient(135deg,#f59e0b,#ef4444)}
.t-4{background:linear-gradient(135deg,#06b6d4,#10b981)}
.feat-badge{position:absolute;bottom:10px;inset-inline-start:10px;z-index:2;display:inline-flex;align-items:center;gap:5px;
  background:rgba(0,0,0,.5);backdrop-filter:blur(6px);color:#fbbf24;font-size:12px;font-weight:900;padding:5px 12px;border-radius:999px}

.shop-card .flash-badge{position:absolute;top:28px;inset-inline-start:12px;z-index:3;display:inline-flex;align-items:center;gap:5px;
  font-size:12.5px;font-weight:900;padding:6px 15px;border-radius:999px;color:#fff;overflow:hidden;position:absolute;
  background:linear-gradient(135deg,#f59e0b,#ef4444);animation:flashPulse 1.8s ease-in-out infinite}
.shop-card .flash-badge::after{content:'';position:absolute;top:0;inset-inline-start:-90%;width:50%;height:100%;
  background:linear-gradient(100deg, transparent, rgba(255,255,255,.5), transparent);transform:skewX(-18deg);animation:badgeShine 2.4s ease infinite}
@keyframes badgeShine{to{inset-inline-start:140%}}
@keyframes flashPulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.5)}50%{box-shadow:0 0 22px 4px rgba(239,68,68,.45)}}
.shop-card .disc-badge{position:absolute;top:28px;inset-inline-end:12px;z-index:3;font-size:12.5px;font-weight:900;
  padding:6px 14px;border-radius:999px;background:#0b1220;color:var(--accent,#22d3ee);
  border:1.5px solid color-mix(in srgb,var(--accent,#22d3ee) 50%,transparent);box-shadow:0 4px 14px rgba(0,0,0,.35)}
.theme-light .shop-card .disc-badge{background:#0f172a}

.shop-card-body{text-decoration:none;color:inherit;flex:1}
.shop-card-body h3{color:#f1f5f9;font-size:17px;font-weight:800;margin:2px 0 7px}
.shop-card-body p{color:#94a3b8;font-size:13.5px;line-height:1.8;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.theme-light .shop-card-body h3{color:#0f172a}
.theme-light .shop-card-body p{color:#64748b}

.shop-meta{display:flex;gap:6px;flex-wrap:wrap}
.shop-meta .chip{display:inline-flex;align-items:center;gap:4px;font-size:11.5px;color:#a8b6cc;
  background:rgba(148,163,184,.12);padding:4px 12px;border-radius:999px}
.theme-light .shop-meta .chip{background:#f1f5f9;color:#64748b}

.shop-card-foot{display:flex;justify-content:flex-end;align-items:baseline;gap:8px;padding:0 2px}
.price-box del{color:#64748b;font-size:13px;margin-inline-end:8px}
.price-box b{color:var(--accent,#22d3ee);font-size:22px;font-weight:900}
.price-box small{color:#64748b;font-size:11.5px;margin-inline-start:4px}

.shop-add{width:100%;display:flex;align-items:center;justify-content:center;gap:9px;padding:14px;border:none;border-radius:14px;
  background:linear-gradient(135deg,var(--accent,#22d3ee),color-mix(in srgb,var(--accent,#22d3ee) 45%,#6366f1));
  background-size:150% 150%;color:#04121d;font-weight:900;font-family:inherit;font-size:15px;cursor:pointer;
  transition:filter .2s,transform .15s,box-shadow .25s,background-position .6s;box-shadow:0 6px 18px color-mix(in srgb,var(--accent,#22d3ee) 28%,transparent)}
.shop-add:hover{filter:brightness(1.13);background-position:100% 50%;box-shadow:0 10px 28px color-mix(in srgb,var(--accent,#22d3ee) 45%,transparent)}
.shop-add:active{transform:scale(.96)}
.shop-add.ok{background:linear-gradient(135deg,#10b981,#0ea5e9);color:#fff}

.cart-badge{position:absolute;top:-7px;inset-inline-end:-8px;z-index:5;background:#ef4444;color:#fff;font-size:11.5px;font-weight:900;
  min-width:20px;height:20px;border-radius:999px;display:flex;align-items:center;justify-content:center;padding:0 5px;
  box-shadow:0 3px 10px rgba(239,68,68,.5);animation:cartPop .35s ease}
@keyframes cartPop{0%{transform:scale(.5)}70%{transform:scale(1.25)}100%{transform:scale(1)}}
/* ==== END SHOP UI v3 ==== */
'@
if ($c -match '(?s)/\* ==== MAHAI SHOP UI v2 \(glam\) ==== \*/.*?/\* ==== END SHOP UI v2 ==== \*/') {
    $c = [regex]::Replace($c, '(?s)/\* ==== MAHAI SHOP UI v2 \(glam\) ==== \*/.*?/\* ==== END SHOP UI v2 ==== \*/', $newBlock.Replace('$','$$'))
    Write-Host "[OK] SHOP CSS v2 -> v3 replaced" -ForegroundColor Green
} else {
    $c = $c + "`r`n" + $newBlock
    Write-Host "[OK] v3 block appended" -ForegroundColor Yellow
}
 $c | Set-Content $ac -Encoding UTF8

# ---------- 4) Build + proof + v17 ----------
Push-Location $FE; npm run build; $ok = ($LASTEXITCODE -eq 0); Pop-Location
if (-not $ok) {
    Write-Host "[FAIL] build failed -> restoring..." -ForegroundColor Red
    Copy-Item "$Bak\cartStore.js.bak_$Stamp" "$FE\src\cartStore.js" -Force
    Copy-Item "$Bak\Shop.jsx.bak_$Stamp" "$FE\src\pages\shop\Shop.jsx" -Force
    Copy-Item "$Bak\App.css.bak_$Stamp" "$FE\src\App.css" -Force
    return
}
 $b = Get-ChildItem "$FE\dist\assets\index-*.js" | Sort-Object Length -Descending | Select-Object -First 1
if ((Select-String -Path $b.FullName -Pattern 'به سبد اضافه شد' -List -Quiet)) { Write-Host "[PROOF] add-feedback in bundle" -ForegroundColor Green }
 $css = Get-ChildItem "$FE\dist\assets\index-*.css" | Select-Object -First 1
if ((Select-String -Path $css.FullName -Pattern 'heroShift' -List -Quiet) -and (Select-String -Path $css.FullName -Pattern 'cart-badge' -List -Quiet)) {
    Write-Host "[PROOF] glam v3 CSS (incl cart-badge restored) in bundle" -ForegroundColor Green
}

 $Stage = "$env:TEMP\mahai_stage_$Stamp"
New-Item -ItemType Directory -Path "$Stage\backend","$Stage\frontend" -Force | Out-Null
Copy-Item "$FE\dist\*" "$Stage\frontend\" -Recurse -Force
robocopy "$ProjectPath\backend" "$Stage\backend" /E /XD __pycache__ .venv node_modules instance /XF *.pyc backend.log /NFL /NDL /NJH /NJS /NP | Out-Null
Copy-Item "$ProjectPath\deploy" "$Stage\deploy" -Recurse -Force -ErrorAction SilentlyContinue
foreach ($f in @("README.md","DEPLOY_GUIDE.md")) { Copy-Item "$ProjectPath\$f" "$Stage\" -Force -ErrorAction SilentlyContinue }
Compress-Archive -Path "$Stage\*" -DestinationPath "E:\mahai_release_v17_$Stamp.zip" -Force
Write-Host "`n[OK] PACKAGE: E:\mahai_release_v17_$Stamp.zip" -ForegroundColor Green
if (Get-Command git -ErrorAction SilentlyContinue) { Push-Location $ProjectPath; git add .; git commit -m "fix: cart immutable store + ui: shop glam v3 (big badges, shine, animated hero)" | Out-Null; Pop-Location -ErrorAction SilentlyContinue }
Write-Host "SCRIPT 37 FINISHED" -ForegroundColor Magenta
