<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>راهنمای جامع و کاربردی شبکه | از مفاهیم تا دستورات</title>
<link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;700;800;900&display=swap" rel="stylesheet">
<style>
/* ============ متغیرهای رنگ ============ */
:root{
  --bg:#f1f5f9; --card:#ffffff; --text:#0f172a; --muted:#64748b;
  --border:#e2e8f0; --primary:#4f46e5; --primary2:#7c3aed;
  --accent:#0891b2; --green:#059669; --red:#dc2626; --amber:#d97706;
  --term-bg:#0d1117; --term-text:#c9d1d9; --term-cmd:#7ee787; --term-out:#8b949e;
  --shadow:0 4px 20px rgba(15,23,42,.08);
  --shadow-lg:0 12px 40px rgba(79,70,229,.15);
}
body.dark{
  --bg:#0b1120; --card:#151d30; --text:#e2e8f0; --muted:#94a3b8;
  --border:#28324a; --shadow:0 4px 20px rgba(0,0,0,.35);
  --shadow-lg:0 12px 40px rgba(0,0,0,.5);
}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  font-family:'Vazirmatn',Tahoma,sans-serif;
  background:var(--bg); color:var(--text);
  line-height:1.9; transition:background .3s,color .3s;
}
.container{max-width:1150px;margin:0 auto;padding:0 20px}

/* ============ هدر ============ */
.hero{
  background:linear-gradient(135deg,#1e1b4b 0%,#312e81 40%,#4f46e5 75%,#7c3aed 100%);
  color:#fff; padding:70px 20px 90px; text-align:center; position:relative; overflow:hidden;
}
.hero::before{
  content:""; position:absolute; inset:0; opacity:.12;
  background-image:radial-gradient(circle at 20% 30%,#fff 2px,transparent 2px),
                   radial-gradient(circle at 70% 60%,#fff 2px,transparent 2px),
                   radial-gradient(circle at 45% 85%,#fff 2px,transparent 2px);
  background-size:90px 90px;
}
.hero h1{font-size:clamp(1.6rem,4vw,2.6rem);font-weight:900;position:relative}
.hero h1 span{color:#a5b4fc}
.hero p.sub{max-width:720px;margin:16px auto 0;color:#c7d2fe;font-size:1.05rem;position:relative}
.hero-stats{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:30px;position:relative}
.hero-stats .stat{
  background:rgba(255,255,255,.12); backdrop-filter:blur(6px);
  border:1px solid rgba(255,255,255,.25); border-radius:14px;
  padding:10px 22px; font-weight:700; font-size:.95rem;
}
.theme-btn{
  position:absolute; top:22px; left:22px; z-index:5;
  background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.3);
  color:#fff; border-radius:12px; padding:8px 16px; cursor:pointer;
  font-family:inherit; font-size:.9rem; transition:.2s;
}
.theme-btn:hover{background:rgba(255,255,255,.3)}

/* ============ منو ============ */
.topnav{
  position:sticky; top:0; z-index:100;
  background:var(--card); border-bottom:1px solid var(--border);
  box-shadow:0 2px 10px rgba(0,0,0,.06);
}
.topnav .inner{display:flex;gap:4px;overflow-x:auto;padding:10px 16px;justify-content:center}
.topnav a{
  color:var(--muted); text-decoration:none; font-weight:600; font-size:.88rem;
  padding:7px 15px; border-radius:99px; white-space:nowrap; transition:.2s;
}
.topnav a:hover,.topnav a.active{background:var(--primary);color:#fff}

/* ============ بخش‌ها ============ */
section{padding:60px 0 20px}
.sec-title{display:flex;align-items:center;gap:14px;margin-bottom:10px}
.sec-title .ico{
  width:52px;height:52px;border-radius:16px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;font-size:1.6rem;
  background:linear-gradient(135deg,var(--primary),var(--primary2));color:#fff;
  box-shadow:var(--shadow-lg);
}
.sec-title h2{font-size:1.6rem;font-weight:800}
.sec-desc{color:var(--muted);margin-bottom:28px;max-width:800px}
.divider{height:1px;background:var(--border);margin:50px 0 0}

/* ============ کارت مفاهیم ============ */
.grid{display:grid;gap:18px;margin-top:10px}
.grid-4{grid-template-columns:repeat(auto-fit,minmax(250px,1fr))}
.grid-2{grid-template-columns:repeat(auto-fit,minmax(320px,1fr))}
.concept-card{
  background:var(--card);border:1px solid var(--border);border-radius:18px;
  padding:22px;box-shadow:var(--shadow);transition:.25s;position:relative;overflow:hidden;
}
.concept-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg);border-color:var(--primary)}
.concept-card .c-ico{font-size:2rem;margin-bottom:8px}
.concept-card h3{font-size:1.05rem;margin-bottom:6px;color:var(--primary)}
.concept-card p{font-size:.92rem;color:var(--muted)}
.concept-card .analogy{
  margin-top:12px;background:linear-gradient(135deg,#eef2ff,#faf5ff);
  border-radius:10px;padding:8px 12px;font-size:.85rem;color:#4338ca;
}
body.dark .concept-card .analogy{background:rgba(99,102,241,.12);color:#a5b4fc}
.concept-card code{direction:ltr;unicode-bidi:embed;font-family:Consolas,monospace;
  background:var(--bg);padding:1px 7px;border-radius:6px;font-size:.85em;color:var(--accent)}

/* ============ کارت دستور ============ */
.cmd-card{
  background:var(--card);border:1px solid var(--border);border-radius:20px;
  padding:26px;margin-bottom:28px;box-shadow:var(--shadow);
}
.cmd-head{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:14px}
.cmd-icon{
  width:56px;height:56px;border-radius:16px;flex-shrink:0;font-size:1.7rem;
  background:linear-gradient(135deg,#0ea5e9,#6366f1);
  display:flex;align-items:center;justify-content:center;
}
.cmd-head h3{font-size:1.3rem;direction:ltr;font-family:Consolas,monospace;color:var(--primary)}
.cmd-head .sub{display:block;font-size:.88rem;color:var(--muted);font-family:'Vazirmatn'}
.badge{
  margin-right:auto;font-size:.78rem;font-weight:700;padding:4px 14px;border-radius:99px;
}
.badge.b-ess{background:#dcfce7;color:#15803d}
.badge.b-imp{background:#fef3c7;color:#b45309}
.badge.b-ext{background:#e0e7ff;color:#4338ca}
body.dark .badge.b-ess{background:rgba(34,197,94,.15);color:#4ade80}
body.dark .badge.b-imp{background:rgba(245,158,11,.15);color:#fbbf24}
body.dark .badge.b-ext{background:rgba(99,102,241,.15);color:#a5b4fc}
.cmd-desc{margin-bottom:16px}
.cmd-desc b{color:var(--primary)}

/* ============ ترمینال ============ */
.terminal{border-radius:14px;overflow:hidden;margin:16px 0;box-shadow:0 8px 30px rgba(0,0,0,.25)}
.term-bar{
  background:#161b22;padding:9px 14px;display:flex;align-items:center;gap:7px;
}
.term-bar .dot{width:12px;height:12px;border-radius:50%}
.dot.r{background:#ff5f57}.dot.y{background:#febc2e}.dot.g{background:#28c840}
.term-bar .tname{color:#8b949e;font-size:.78rem;margin:0 auto;direction:ltr}
.copy-btn{
  background:#21262d;color:#c9d1d9;border:1px solid #30363d;border-radius:7px;
  padding:3px 12px;cursor:pointer;font-family:'Vazirmatn';font-size:.75rem;transition:.2s;
}
.copy-btn:hover{background:#30363d;color:#fff}
.terminal pre{
  background:var(--term-bg);color:var(--term-text);
  padding:18px 20px;direction:ltr;text-align:left;overflow-x:auto;
  font-family:Consolas,'Courier New',monospace;font-size:.88rem;line-height:1.75;
}
.terminal pre .c{color:var(--term-cmd)}
.terminal pre .o{color:var(--term-out)}
.terminal pre .h{color:#79c0ff}
.terminal pre .e{color:#f85149}

/* ============ شبکه‌ی کاربردها ============ */
.usage{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin:16px 0}
.usage .u-item{
  background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:12px 14px;
}
.usage code{
  direction:ltr;unicode-bidi:embed;display:inline-block;
  font-family:Consolas,monospace;font-weight:700;color:var(--accent);font-size:.87rem;
  background:transparent;
}
.usage p{font-size:.85rem;color:var(--muted);margin-top:4px}

/* ============ کالوت ============ */
.callout{
  border-radius:12px;padding:14px 18px;margin:14px 0;font-size:.92rem;
  border-right:4px solid;display:flex;gap:10px;align-items:flex-start;
}
.callout.tip{background:#ecfdf5;border-color:var(--green);color:#065f46}
.callout.warn{background:#fffbeb;border-color:var(--amber);color:#92400e}
.callout.info{background:#eff6ff;border-color:var(--primary);color:#1e40af}
body.dark .callout.tip{background:rgba(16,185,129,.1);color:#6ee7b7}
body.dark .callout.warn{background:rgba(245,158,11,.1);color:#fcd34d}
body.dark .callout.info{background:rgba(59,130,246,.1);color:#93c5fd}

/* ============ جدول ============ */
.tbl-wrap{overflow-x:auto;border-radius:14px;border:1px solid var(--border);box-shadow:var(--shadow)}
table{width:100%;border-collapse:collapse;background:var(--card);font-size:.9rem;min-width:560px}
th{background:linear-gradient(135deg,var(--primary),var(--primary2));color:#fff;padding:13px 16px;text-align:right}
td{padding:11px 16px;border-top:1px solid var(--border)}
tr:nth-child(even) td{background:var(--bg)}
td code{direction:ltr;unicode-bidi:embed;font-family:Consolas,monospace;color:var(--accent);font-weight:700}

/* ============ دیاگرام SVG ============ */
.net-svg{width:100%;height:auto;background:var(--card);border:1px solid var(--border);border-radius:20px;box-shadow:var(--shadow)}
svg text{font-family:'Vazirmatn',Tahoma,sans-serif}

/* سفر بسته */
.journey{display:flex;align-items:center;justify-content:center;gap:0;flex-wrap:wrap;margin:26px 0}
.j-node{
  background:var(--card);border:2px solid var(--primary);border-radius:14px;
  padding:12px 16px;text-align:center;min-width:120px;box-shadow:var(--shadow);
}
.j-node .j-ico{font-size:1.7rem}
.j-node .j-t{font-weight:800;font-size:.88rem;margin-top:4px}
.j-node .j-s{font-size:.75rem;color:var(--muted)}
.j-arrow{color:var(--primary);font-size:1.5rem;font-weight:900;padding:0 8px}
.j-node.hop{border-color:var(--accent)}
.j-node.dest{border-color:var(--green)}

/* آناتومی IP */
.ip-anatomy{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;direction:ltr;margin:20px 0}
.ip-part{
  font-family:Consolas,monospace;font-size:clamp(1.2rem,4vw,2rem);font-weight:800;
  padding:14px 20px;border-radius:14px;border:3px solid;
}
.ip-part.net{background:#ede9fe;border-color:#8b5cf6;color:#6d28d9}
.ip-part.host{background:#dbeafe;border-color:#3b82f6;color:#1d4ed8}
.ip-label{font-family:'Vazirmatn';font-size:.85rem;display:block;text-align:center;margin-top:6px;direction:rtl}

/* ============ فلوشارت عیب‌یابی ============ */
.flow-step{
  background:var(--card);border:1px solid var(--border);border-right:5px solid var(--primary);
  border-radius:16px;padding:22px;margin-bottom:0;box-shadow:var(--shadow);
}
.flow-num{
  display:inline-flex;width:34px;height:34px;border-radius:50%;
  background:linear-gradient(135deg,var(--primary),var(--primary2));
  color:#fff;font-weight:800;align-items:center;justify-content:center;margin-left:10px;
}
.flow-q{font-weight:800;font-size:1.05rem}
.branches{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;margin-top:14px}
.branch{border-radius:12px;padding:13px 16px;font-size:.9rem}
.branch.ok{background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46}
.branch.bad{background:#fef2f2;border:1px solid #fecaca;color:#991b1b}
body.dark .branch.ok{background:rgba(16,185,129,.1);color:#6ee7b7}
body.dark .branch.bad{background:rgba(239,68,68,.1);color:#fca5a5}
.flow-arrow{text-align:center;font-size:1.8rem;color:var(--primary);margin:6px 0;animation:bounce 1.6s infinite}
@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(6px)}}

/* ============ سناریو ============ */
.scenario{
  background:var(--card);border:1px solid var(--border);border-radius:18px;
  padding:22px;margin-bottom:20px;box-shadow:var(--shadow);
}
.scenario h3{display:flex;gap:10px;align-items:center;font-size:1.08rem;margin-bottom:12px}
.scenario ol{margin:0 22px 12px 0;font-size:.93rem}
.scenario ol li{margin-bottom:6px}
.scenario ol code{direction:ltr;unicode-bidi:embed;font-family:Consolas,monospace;
  color:var(--accent);background:var(--bg);padding:1px 7px;border-radius:6px;font-size:.88em}

/* ============ نکات طلایی ============ */
.gold-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:14px}
.gold-item{
  background:var(--card);border:1px solid var(--border);border-radius:14px;
  padding:16px 18px;display:flex;gap:12px;box-shadow:var(--shadow);font-size:.92rem;
}
.gold-item .g-ico{font-size:1.4rem;flex-shrink:0}
.gold-item b{color:var(--amber)}

/* نحوه شروع */
.start-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}
.start-card{
  background:var(--card);border:1px solid var(--border);border-radius:16px;
  padding:18px;text-align:center;box-shadow:var(--shadow);
}
.start-card .os-ico{font-size:2.2rem}
.start-card h4{margin:6px 0}
.start-card .keys{
  direction:ltr;display:inline-block;font-family:Consolas,monospace;font-weight:700;
  background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:4px 12px;
  color:var(--primary);font-size:.9rem;margin-top:6px;
}

/* ============ فوتر ============ */
footer{
  margin-top:70px;background:linear-gradient(135deg,#1e1b4b,#312e81);
  color:#c7d2fe;text-align:center;padding:36px 20px;font-size:.92rem;
}
footer b{color:#fff}
#toTop{
  position:fixed;bottom:24px;left:24px;width:46px;height:46px;border-radius:50%;
  background:var(--primary);color:#fff;border:none;font-size:1.2rem;cursor:pointer;
  box-shadow:var(--shadow-lg);opacity:0;pointer-events:none;transition:.3s;z-index:99;
}
#toTop.show{opacity:1;pointer-events:auto}

/* انیمیشن ورود */
.reveal{opacity:0;transform:translateY(24px);transition:opacity .6s,transform .6s}
.reveal.visible{opacity:1;transform:none}

@media print{
  .topnav,#toTop,.theme-btn,.copy-btn{display:none!important}
  .cmd-card,.concept-card{break-inside:avoid;box-shadow:none}
}
</style>
</head>
<body>

<!-- ================= هدر ================= -->
<header class="hero">
  <button class="theme-btn" id="themeToggle">🌙 حالت شب</button>
  <h1>📡 راهنمای جامع و کاربردی <span>شبکه</span></h1>
  <p class="sub">از مفاهیم پایه شبکه محلی (LAN) و اینترنت تا دستورات حرفه‌ای خط فرمان — همراه با دیاگرام، مثال واقعی و سناریوهای عیب‌یابی</p>
  <div class="hero-stats">
    <div class="stat">⭐ ۱۸ دستور کاربردی</div>
    <div class="stat">🗺️ ۴ دیاگرام آموزشی</div>
    <div class="stat">🛠️ ۶ سناریوی عملی</div>
    <div class="stat">💡 ۱۰ نکته طلایی</div>
  </div>
</header>

<!-- ================= منو ================= -->
<nav class="topnav">
  <div class="inner">
    <a href="#start">🚀 شروع</a>
    <a href="#concepts">📚 مفاهیم پایه</a>
    <a href="#map">🗺️ نقشه شبکه</a>
    <a href="#anatomy">🧬 آناتومی IP</a>
    <a href="#win">🪟 دستورات ویندوز</a>
    <a href="#linux">🐧 دستورات لینوکس</a>
    <a href="#equiv">🔄 جدول معادل‌ها</a>
    <a href="#trouble">🩺 عیب‌یابی</a>
    <a href="#scenarios">🛠️ سناریوها</a>
    <a href="#ports">🚢 پورت‌ها</a>
    <a href="#gold">💡 نکات طلایی</a>
    <a href="#cheat">📋 چیت‌شیت</a>
  </div>
</nav>

<div class="container">

<!-- ================= شروع ================= -->
<section id="start" class="reveal">
  <div class="sec-title"><div class="ico">🚀</div><h2>قدم اول: خط فرمان را باز کن!</h2></div>
  <p class="sec-desc">تمام دستورات این راهنما در «خط فرمان» تایپ می‌شوند. برای باز کردن آن بر اساس سیستم‌عاملت:</p>
  <div class="start-strip">
    <div class="start-card">
      <div class="os-ico">🪟</div>
      <h4>ویندوز — CMD</h4>
      <p style="font-size:.85rem;color:var(--muted)">کلیدهای زیر را بزن و <code>cmd</code> را تایپ کن</p>
      <div class="keys">Win + R → cmd → Enter</div>
    </div>
    <div class="start-card">
      <div class="os-ico">🐧</div>
      <h4>لینوکس — Terminal</h4>
      <p style="font-size:.85rem;color:var(--muted)">ترمینال را با میانبر باز کن</p>
      <div class="keys">Ctrl + Alt + T</div>
    </div>
    <div class="start-card">
      <div class="os-ico">🍎</div>
      <h4>مک — Terminal</h4>
      <p style="font-size:.85rem;color:var(--muted)">از Spotlight جستجو کن</p>
      <div class="keys">Cmd + Space → Terminal</div>
    </div>
  </div>
</section>

<!-- ================= مفاهیم پایه ================= -->
<section id="concepts" class="reveal">
  <div class="sec-title"><div class="ico">📚</div><h2>مفاهیم کلیدی شبکه</h2></div>
  <p class="sec-desc">قبل از دستورات، این ۸ مفهوم را بشناس. هر مفهوم با یک «تشبیه ساده» تا همیشه در ذهنت بماند. 👇</p>
  <div class="grid grid-4">
    <div class="concept-card">
      <div class="c-ico">🏠</div><h3>IP Address (آدرس آی‌پی)</h3>
      <p>آدرس منطقی و منحصربه‌فرد هر دستگاه در شبکه. مثل <code>192.168.1.10</code></p>
      <div class="analogy">🏠 مثل <b>آدرس پستی خانه</b> — بدون آن، نامه (داده) به مقصد نمی‌رسد.</div>
    </div>
    <div class="concept-card">
      <div class="c-ico">🔌</div><h3>MAC Address</h3>
      <p>شناسه فیزیکی و ثابت کارت شبکه؛ مثال: <code>A4-5E-60-C3-1A-2B</code> — توسط کارخانه تعیین می‌شود.</p>
      <div class="analogy">🫵 مثل <b>اثر انگشت</b> — یکتا و غیرقابل تغییر (در حالت عادی).</div>
    </div>
    <div class="concept-card">
      <div class="c-ico">🚪</div><h3>Default Gateway</h3>
      <p>آدرس روتری که بسته‌ها برای خروج از شبکه محلی از آن عبور می‌کنند؛ معمولاً <code>192.168.1.1</code></p>
      <div class="analogy">🚪 مثل <b>دروازه خروج محله</b> — هر مسافری باید از آن رد شود.</div>
    </div>
    <div class="concept-card">
      <div class="c-ico">📖</div><h3>DNS</h3>
      <p>نام دامنه را به IP تبدیل می‌کند؛ مثل <code>google.com</code> ← <code>142.250.185.78</code></p>
      <div class="analogy">📖 مثل <b>دفترچه تلفن</b> — نام را داری، شماره را از آن می‌گیری.</div>
    </div>
    <div class="concept-card">
      <div class="c-ico">🎁</div><h3>DHCP</h3>
      <p>سرویسی که به دستگاه‌های جدید، <b>خودکار</b> IP، ماسک، گیت‌وی و DNS می‌دهد.</p>
      <div class="analogy">🎁 مثل <b>پذیرش هتل</b> — می‌رسی، اتاق (IP) تحویل می‌گیری.</div>
    </div>
    <div class="concept-card">
      <div class="c-ico">🎭</div><h3>Subnet Mask</h3>
      <p>مشخص می‌کند کدام بخش IP «شبکه» و کدام بخش «دستگاه» است؛ مثال: <code>255.255.255.0</code></p>
      <div class="analogy">🎭 مثل <b>کد شهر و شماره خیابان</b> در آدرس پستی — مرزها را جدا می‌کند.</div>
    </div>
    <div class="concept-card">
      <div class="c-ico">🚢</div><h3>Port (پورت)</h3>
      <p>شماره‌ی درگاه منطقی (۰ تا ۶۵۵۳۵) که مشخص می‌کند داده برای کدام برنامه است؛ وب = ۸۰/۴۴۳</p>
      <div class="analogy">🏢 مثل <b>شماره واحد در یک ساختمان</b> — ساختمان IP است، واحد پورت.</div>
    </div>
    <div class="concept-card">
      <div class="c-ico">🌍</div><h3>LAN / WAN / اینترنت</h3>
      <p><b>LAN:</b> شبکه محلی خانه یا اداره. <b>WAN:</b> اتصال شبکه‌های دور. <b>اینترنت:</b> بزرگ‌ترین WAN دنیا!</p>
      <div class="analogy">🏘️ LAN مثل <b>محله شماست</b> و اینترنت مثل <b>شبکه جاده‌های کل کشور</b>.</div>
    </div>
  </div>
</section>

<!-- ================= نقشه شبکه ================= -->
<section id="map" class="reveal">
  <div class="sec-title"><div class="ico">🗺️</div><h2>نقشه یک شبکه محلی خانگی</h2></div>
  <p class="sec-desc">این شکل، ساختار واقعی شبکه‌ی خانه‌ی شماست. با شکل زیر مسیر اینترنت تا دستگاه‌هایت را دنبال کن:</p>

  <svg class="net-svg" viewBox="0 0 920 500">
    <defs>
      <linearGradient id="gRouter" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#8b5cf6"/>
      </linearGradient>
      <linearGradient id="gSwitch" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#0ea5e9"/><stop offset="1" stop-color="#06b6d4"/>
      </linearGradient>
    </defs>

    <!-- ابر اینترنت -->
    <g>
      <ellipse cx="460" cy="65" rx="95" ry="40" fill="#94a3b8"/>
      <ellipse cx="405" cy="50" rx="45" ry="30" fill="#94a3b8"/>
      <ellipse cx="515" cy="48" rx="50" ry="32" fill="#94a3b8"/>
      <text x="460" y="72" text-anchor="middle" fill="#fff" font-size="17" font-weight="800">🌍 اینترنت</text>
    </g>

    <!-- خط WAN -->
    <line x1="460" y1="105" x2="460" y2="150" stroke="#64748b" stroke-width="3" stroke-dasharray="7 5"/>
    <text x="478" y="132" fill="#64748b" font-size="12" font-weight="700">خط WAN</text>

    <!-- روتر -->
    <rect x="365" y="150" width="190" height="66" rx="14" fill="url(#gRouter)"/>
    <text x="460" y="178" text-anchor="middle" fill="#fff" font-size="15" font-weight="800">📡 مودم / روتر</text>
    <text x="460" y="200" text-anchor="middle" fill="#e0e7ff" font-size="12">Gateway: 192.168.1.1</text>

    <!-- خط روتر به سوییچ -->
    <line x1="460" y1="216" x2="460" y2="252" stroke="#64748b" stroke-width="3"/>

    <!-- سوییچ -->
    <rect x="385" y="252" width="150" height="52" rx="12" fill="url(#gSwitch)"/>
    <text x="460" y="283" text-anchor="middle" fill="#fff" font-size="14" font-weight="800">🔀 سوییچ</text>

    <!-- خط اصلی (باس) -->
    <line x1="130" y1="365" x2="620" y2="365" stroke="#94a3b8" stroke-width="3"/>
    <line x1="460" y1="304" x2="460" y2="365" stroke="#94a3b8" stroke-width="3"/>

    <!-- اتصال عمودی دستگاه‌ها -->
    <line x1="130" y1="365" x2="130" y2="395" stroke="#94a3b8" stroke-width="2.5"/>
    <line x1="340" y1="365" x2="340" y2="395" stroke="#94a3b8" stroke-width="2.5"/>
    <line x1="550" y1="365" x2="550" y2="395" stroke="#94a3b8" stroke-width="2.5"/>
    <line x1="760" y1="278" x2="660" y2="278" stroke="#94a3b8" stroke-width="3"/>

    <!-- اکسس پوینت وای‌فای -->
    <circle cx="700" cy="278" r="30" fill="#f59e0b"/>
    <text x="700" y="273" text-anchor="middle" font-size="18">📶</text>
    <text x="700" y="290" text-anchor="middle" fill="#fff" font-size="9" font-weight="700">WiFi AP</text>
    <path d="M 660 250 Q 645 235 660 222" stroke="#f59e0b" stroke-width="2.5" fill="none"/>
    <path d="M 740 250 Q 755 235 740 222" stroke="#f59e0b" stroke-width="2.5" fill="none"/>
    <line x1="700" y1="308" x2="700" y2="330" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="5 4"/>
    <text x="700" y="348" text-anchor="middle" fill="#d97706" font-size="11" font-weight="700">موج وایرلس</text>

    <!-- گوشی -->
    <g>
      <line x1="700" y1="330" x2="760" y2="395" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="5 4"/>
      <rect x="745" y="395" width="30" height="52" rx="7" fill="#f59e0b"/>
      <line x1="752" y1="440" x2="768" y2="440" stroke="#fff" stroke-width="2"/>
      <text x="760" y="468" text-anchor="middle" font-size="12" font-weight="700">📱 گوشی</text>
      <text x="760" y="484" text-anchor="middle" fill="#64748b" font-size="10.5">192.168.1.20</text>
    </g>

    <!-- کامپیوتر -->
    <g>
      <rect x="100" y="395" width="60" height="42" rx="5" fill="#0ea5e9"/>
      <rect x="105" y="400" width="50" height="30" rx="3" fill="#e0f2fe"/>
      <rect x="122" y="437" width="16" height="7" fill="#0369a1"/>
      <rect x="112" y="444" width="36" height="4" rx="2" fill="#0369a1"/>
      <text x="130" y="468" text-anchor="middle" font-size="12" font-weight="700">🖥️ کامپیوتر</text>
      <text x="130" y="484" text-anchor="middle" fill="#64748b" font-size="10.5">192.168.1.10</text>
    </g>

    <!-- لپتاپ -->
    <g>
      <rect x="312" y="397" width="56" height="34" rx="4" fill="#0ea5e9"/>
      <rect x="317" y="401" width="46" height="26" rx="2" fill="#e0f2fe"/>
      <path d="M 305 431 L 375 431 L 383 441 L 297 441 Z" fill="#0369a1"/>
      <text x="340" y="468" text-anchor="middle" font-size="12" font-weight="700">💻 لپ‌تاپ</text>
      <text x="340" y="484" text-anchor="middle" fill="#64748b" font-size="10.5">192.168.1.15</text>
    </g>

    <!-- پرینتر -->
    <g>
      <rect x="522" y="402" width="56" height="34" rx="5" fill="#0ea5e9"/>
      <rect x="532" y="392" width="36" height="14" rx="2" fill="#e0f2fe"/>
      <rect x="530" y="418" width="40" height="10" rx="2" fill="#e0f2fe"/>
      <text x="550" y="468" text-anchor="middle" font-size="12" font-weight="700">🖨️ پرینتر</text>
      <text x="550" y="484" text-anchor="middle" fill="#64748b" font-size="10.5">192.168.1.30</text>
    </g>
  </svg>

  <div class="grid grid-2" style="margin-top:22px">
    <div class="concept-card">
      <h3>🧩 هر قطعه چه‌کار می‌کند؟</h3>
      <p>
      <b>مودم:</b> سیگنال شرکت مخابرات (فیبر/DSL) را به دیتای شبکه تبدیل می‌کند.<br>
      <b>روتر:</b> بین شبکه داخلی و اینترنت «مسیریابی» می‌کند + سرویس DHCP و فایروال دارد.<br>
      <b>سوییچ:</b> چند دستگاه را با کابل به هم وصل می‌کند و داده را فقط به مقصد می‌فرستد.<br>
      <b>اکسس‌پوینت:</b> شبکه کابلی را به موج وای‌فای تبدیل می‌کند.</p>
    </div>
    <div class="concept-card">
      <h3>⚖️ مقایسه LAN و اینترنت</h3>
      <p>
      <b>سرعت LAN:</b> معمولاً ۱۰۰ مگابیت تا ۱ گیگابیت<br>
      <b>تأخیر LAN:</b> کمتر از ۱ تا ۲ میلی‌ثانیه<br>
      <b>مالکیت:</b> LAN متعلق به خودتان است، اینترنت متعلق به ISPها<br>
      <b>IP در LAN:</b> خصوصی (مثل 192.168.1.x) — <b>در اینترنت:</b> عمومی<br>
      <b>نکته:</b> روتر با تکنیک <b>NAT</b> یک IP عمومی را بین همه دستگاه‌های خانه به اشتراک می‌گذارد.</p>
    </div>
  </div>
</section>

<!-- ================= آناتومی IP ================= -->
<section id="anatomy" class="reveal">
  <div class="sec-title"><div class="ico">🧬</div><h2>آناتومی یک آدرس IP</h2></div>
  <p class="sec-desc">هر IP خصوصی دو بخش دارد: بخش «شبکه» که محل زندگی را مشخص می‌کند و بخش «میزبان» که خود دستگاه را. ماسک <code style="direction:ltr;unicode-bidi:embed">255.255.255.0</code> می‌گوید سه عدد اول مربوط به شبکه‌اند:</p>

  <div class="ip-anatomy">
    <div class="ip-part net">192 . 168 . 1<span class="ip-label">🏠 بخش شبکه (Network)</span></div>
    <div class="ip-part host">. 10<span class="ip-label">💻 بخش میزبان (Host)</span></div>
  </div>

  <div class="tbl-wrap">
    <table>
      <tr><th>رنج خصوصی</th><th>محدوده</th><th>ظرفیت تقریبی</th><th>کاربرد رایج</th></tr>
      <tr><td><code>10.0.0.0/8</code></td><td>10.0.0.0 – 10.255.255.255</td><td>~۱۶ میلیون</td><td>شرکت‌های بزرگ</td></tr>
      <tr><td><code>172.16.0.0/12</code></td><td>172.16.0.0 – 172.31.255.255</td><td>~۱ میلیون</td><td>سازمان‌های متوسط</td></tr>
      <tr><td><code>192.168.0.0/16</code></td><td>192.168.0.0 – 192.168.255.255</td><td>~۶۵ هزار</td><td>خانه و دفتر کار ⭐</td></tr>
    </table>
  </div>
  <div class="callout info">💡 <div><b>IP های خصوصی</b> فقط داخل شبکه محلی معتبرند و در اینترنت مسیریابی نمی‌شوند. برای «بیرون رفتن»، روتر آن‌ها را به IP عمومی ترجمه می‌کند (NAT).</div></div>
</section>

<!-- ================= سفر بسته ================= -->
<section id="journey" class="reveal">
  <div class="sec-title"><div class="ico">✈️</div><h2>سفر یک بسته داده (درک دستور tracert)</h2></div>
  <p class="sec-desc">وقتی <code style="direction:ltr;unicode-bidi:embed">ping google.com</code> می‌زنی، بسته‌ات مثل نامه پستی از چند «ایستگاه» (Hop / روتر) عبور می‌کند. دستور tracert دقیقاً همین ایستگاه‌ها را نشان می‌دهد:</p>
  <div class="journey">
    <div class="j-node"><div class="j-ico">💻</div><div class="j-t">دستگاه شما</div><div class="j-s">192.168.1.10</div></div>
    <div class="j-arrow">←</div>
    <div class="j-node hop"><div class="j-ico">📡</div><div class="j-t">روتر شما</div><div class="j-s">Hop 1</div></div>
    <div class="j-arrow">←</div>
    <div class="j-node hop"><div class="j-ico">🏢</div><div class="j-t">ISP شما</div><div class="j-s">Hop 2 و 3</div></div>
    <div class="j-arrow">←</div>
    <div class="j-node hop"><div class="j-ico">🌍</div><div class="j-t">اینترنت</div><div class="j-s">چند Hop</div></div>
    <div class="j-arrow">←</div>
    <div class="j-node dest"><div class="j-ico">🔎</div><div class="j-t">سرور گوگل</div><div class="j-s">مقصد نهایی</div></div>
  </div>
  <div class="callout tip">💡 <div><b>TTL چیست؟</b> هر بسته یک شمارنده TTL دارد (ویندوز: ۱۲۸، لینوکس: ۶۴). هر روتر یکی از آن کم می‌کند. اگر در خروجی ping عدد TTL=۱۱۵ دیدی، یعنی حدود <b>۱۳ روتر</b> بین شما و مقصد بوده است (۱۲۸ − ۱۱۵ = ۱۳)!</div></div>
</section>

<!-- ================= دستورات ویندوز ================= -->
<section id="win" class="reveal">
  <div class="sec-title"><div class="ico">🪟</div><h2>دستورات کاربردی ویندوز (CMD)</h2></div>
  <p class="sec-desc">مهم‌ترین دستورات به ترتیب اهمیت. برای هر دستور: کاربرد، مثال واقعی با خروجی، و نکات کلیدی.</p>

  <!-- ping -->
  <div class="cmd-card">
    <div class="cmd-head">
      <div class="cmd-icon">🏓</div>
      <div><h3>ping</h3><span class="sub">تست اتصال و سلامت شبکه — پرمصرف‌ترین دستور دنیای شبکه</span></div>
      <span class="badge b-ess">⭐ ضروری</span>
    </div>
    <p class="cmd-desc">یک بسته کوچک به مقصد می‌فرستد و منتظر «پاسخ» می‌ماند. با آن می‌فهمیم: <b>آیا مقصد زنده است؟</b>، <b>چقدر تأخیر (ms) داریم؟</b> و <b>آیا بسته‌ای گم می‌شود؟</b></p>
    <div class="terminal">
      <div class="term-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="tname">CMD — Windows</span><button class="copy-btn">📋 کپی</button></div>
      <pre><span class="c">C:\&gt; ping 8.8.8.8</span>

<span class="o">Pinging 8.8.8.8 with 32 bytes of data:</span>
<span class="h">Reply from 8.8.8.8: bytes=32 time=15ms TTL=115</span>
<span class="h">Reply from 8.8.8.8: bytes=32 time=14ms TTL=115</span>
<span class="h">Reply from 8.8.8.8: bytes=32 time=16ms TTL=115</span>
<span class="h">Reply from 8.8.8.8: bytes=32 time=14ms TTL=115</span>

<span class="o">Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)</span></pre>
    </div>
    <div class="usage">
      <div class="u-item"><code>ping 8.8.8.8</code><p>تست اینترنت با DNS گوگل — سریع‌ترین بررسی سلامت</p></div>
      <div class="u-item"><code>ping google.com</code><p>علاوه بر اتصال، سرویس DNS را هم می‌آزماید</p></div>
      <div class="u-item"><code>ping 192.168.1.1</code><p>تست اتصال به روتر (Gateway) خودت</p></div>
      <div class="u-item"><code>ping -t google.com</code><p>ping بی‌وقفه؛ با <b>Ctrl+C</b> متوقفش کن</p></div>
      <div class="u-item"><code>ping -n 20 google.com</code><p>ارسال ۲۰ بسته برای تست پایداری</p></div>
      <div class="u-item"><code>ping -l 1500 8.8.8.8</code><p>ارسال بسته ۱۵۰۰ بایتی (تست MTU)</p></div>
    </div>
    <div class="callout tip">💡 <div><b>تحلیل خروجی:</b> <code style="direction:ltr;unicode-bidi:embed">time=15ms</code> یعنی تأخیر — زیر ۵۰ms عالی، بالای ۱۵۰ms آزاردهنده (مخصوصاً بازی آنلاین). <code style="direction:ltr;unicode-bidi:embed">Request timed out</code> یعنی پاسخی نرسید، ولی <code style="direction:ltr;unicode-bidi:embed">Destination host unreachable</code> یعنی اصلاً مسیری به مقصد پیدا نشد.</div></div>
  </div>

  <!-- ipconfig -->
  <div class="cmd-card">
    <div class="cmd-head">
      <div class="cmd-icon">🪪</div>
      <div><h3>ipconfig</h3><span class="sub">مشاهده و مدیریت تنظیمات IP کارت شبکه</span></div>
      <span class="badge b-ess">⭐ ضروری</span>
    </div>
    <p class="cmd-desc">شناسنامه‌ی شبکه‌ی دستگاهت را نشان می‌دهد: <b>IP، ماسک، گیت‌وی و DNS</b>. اولین دستوری که در عیب‌یابی می‌زنیم!</p>
    <div class="terminal">
      <div class="term-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="tname">CMD — Windows</span><button class="copy-btn">📋 کپی</button></div>
      <pre><span class="c">C:\&gt; ipconfig /all</span>

<span class="o">Wireless LAN adapter Wi-Fi:</span>
   <span class="h">IPv4 Address. . . . . . . : 192.168.1.10</span>
   <span class="h">Subnet Mask . . . . . . . : 255.255.255.0</span>
   <span class="h">Default Gateway . . . . . : 192.168.1.1</span>
   <span class="h">DNS Servers . . . . . . . : 8.8.8.8</span>
   <span class="o">DHCP Enabled. . . . . . . : Yes</span></pre>
    </div>
    <div class="usage">
      <div class="u-item"><code>ipconfig</code><p>نمایش خلاصه تنظیمات IP</p></div>
      <div class="u-item"><code>ipconfig /all</code><p>نمایش کامل + MAC + سرور DHCP</p></div>
      <div class="u-item"><code>ipconfig /release</code><p>پس دادن IP فعلی به DHCP</p></div>
      <div class="u-item"><code>ipconfig /renew</code><p>گرفتن IP تازه — حل تداخل IP</p></div>
      <div class="u-item"><code>ipconfig /flushdns</code><p>پاک‌سازی کش DNS — وقتی سایتی باز نمی‌شود!</p></div>
      <div class="u-item"><code>ipconfig /displaydns</code><p>دیدن محتوای کش DNS</p></div>
    </div>
    <div class="callout warn">⚠️ <div>اگر در خروجی، IP با <b>169.254.x.x</b> شروع شد یعنی دستگاه نتوانسته از DHCP آدرس بگیرد (خودش یک IP اضطراری به نام APIPA ساخته) — معمولاً مشکل از کابل، وای‌فای یا روتر است.</div></div>
  </div>

  <!-- tracert -->
  <div class="cmd-card">
    <div class="cmd-head">
      <div class="cmd-icon">🧭</div>
      <div><h3>tracert</h3><span class="sub">ردیابی مسیر بسته از مبدا تا مقصد، روتر به روتر</span></div>
      <span class="badge b-ess">⭐ ضروری</span>
    </div>
    <p class="cmd-desc">نشان می‌دهد بسته‌ی شما از <b>کدام ایستگاه‌ها</b> عبور می‌کند و در کدام ایستگاه «گیر» می‌کند. برای پیدا کردن اینکه مشکل از شماست، از ISP است، یا از مقصد — فوق‌العاده است.</p>
    <div class="terminal">
      <div class="term-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="tname">CMD — Windows</span><button class="copy-btn">📋 کپی</button></div>
      <pre><span class="c">C:\&gt; tracert google.com</span>

<span class="o">Tracing route to google.com [142.250.185.78]</span>
  <span class="h">1    2 ms   1 ms   2 ms   192.168.1.1</span>        <span class="o">← روتر خودتان</span>
  <span class="h">2   12 ms  11 ms  13 ms   10.10.0.1</span>          <span class="o">← شبکه ISP</span>
  <span class="h">3   24 ms  25 ms  24 ms   isp-core.net [85.15.1.1]</span>
  <span class="h">4   41 ms  43 ms  42 ms   * * * </span>            <span class="o">← روتری که جواب نمی‌دهد</span>
  <span class="h">8   45 ms  44 ms  46 ms   google.com [142.250.185.78]</span></pre>
    </div>
    <div class="usage">
      <div class="u-item"><code>tracert google.com</code><p>ردیابی مسیر تا گوگل</p></div>
      <div class="u-item"><code>tracert -d 8.8.8.8</code><p>بدون تبدیل نام (سریع‌تر)</p></div>
      <div class="u-item"><code>tracert -h 15 site.com</code><p>حداکثر ۱۵ ایستگاه (Hop)</p></div>
      <div class="u-item"><code>pathping google.com</code><p>ترکیب ping + tracert با آمار اتلاف بسته ✨</p></div>
    </div>
    <div class="callout tip">💡 <div><b>چگونه خواندن؟</b> هر سطر = یک روتر در مسیر. سه عدد زمان یعنی سه بسته‌ی تستی. اگر از یک سطر به بعد فقط <code style="direction:ltr;unicode-bidi:embed">* * *</code> دیدی، مشکل احتمالاً از همان نقطه به بعد است.</div></div>
  </div>

  <!-- nslookup -->
  <div class="cmd-card">
    <div class="cmd-head">
      <div class="cmd-icon">📖</div>
      <div><h3>nslookup</h3><span class="sub">پرس‌وجوی مستقیم از سرور DNS — «دفترچه تلفن» اینترنت</span></div>
      <span class="badge b-imp">🔥 مهم</span>
    </div>
    <p class="cmd-desc">بررسی می‌کند یک نام دامنه به چه IPای ترجمه می‌شود و از کدام DNS. اگر سایت باز نمی‌شود ولی اینترنت داری، اولین مظنون <b>DNS</b> است!</p>
    <div class="terminal">
      <div class="term-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="tname">CMD — Windows</span><button class="copy-btn">📋 کپی</button></div>
      <pre><span class="c">C:\&gt; nslookup google.com</span>
<span class="o">Server:  dns.google</span>
<span class="o">Address:  8.8.8.8</span>

<span class="o">Non-authoritative answer:</span>
<span class="h">Name:    google.com</span>
<span class="h">Address:  142.250.185.78</span></pre>
    </div>
    <div class="usage">
      <div class="u-item"><code>nslookup google.com</code><p>گرفتن IP یک دامنه از DNS پیش‌فرض</p></div>
      <div class="u-item"><code>nslookup google.com 8.8.8.8</code><p>پرس‌وجو از DNS خاص — مقایسه با DNS داخلی</p></div>
      <div class="u-item"><code>nslookup -type=mx gmail.com</code><p>دیدن سرورهای ایمیل (MX) یک دامنه</p></div>
      <div class="u-item"><code>nslookup -type=ns site.com</code><p>دیدن نام‌سرورهای (NS) دامنه</p></div>
    </div>
  </div>

  <!-- netstat -->
  <div class="cmd-card">
    <div class="cmd-head">
      <div class="cmd-icon">🕸️</div>
      <div><h3>netstat</h3><span class="sub">لیست تمام اتصالات فعال و پورت‌های باز سیستم</span></div>
      <span class="badge b-imp">🔥 مهم</span>
    </div>
    <p class="cmd-desc">نشان می‌دهد سیستم شما <b>همین الان به کجاها وصل است</b>، چه پورت‌هایی باز است و کدام برنامه (PID) مالک هر اتصال است. ابزار طلایی برای کشف بدافزار و پورت اشغالی.</p>
    <div class="terminal">
      <div class="term-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="tname">CMD — Windows</span><button class="copy-btn">📋 کپی</button></div>
      <pre><span class="c">C:\&gt; netstat -ano | findstr :443</span>

<span class="h">TCP  192.168.1.10:50412   142.250.185.78:443   ESTABLISHED  4210</span>
<span class="h">TCP  192.168.1.10:50455   13.107.42.14:443     ESTABLISHED  8804</span>
<span class="o">                                            (باید PID = 4210 را در Taskbar چک کنی)</span></pre>
    </div>
    <div class="usage">
      <div class="u-item"><code>netstat -ano</code><p>همه اتصالات + شماره برنامه (PID)</p></div>
      <div class="u-item"><code>netstat -b</code><p>نمایش نام برنامه‌ها (نیاز به Run as Admin)</p></div>
      <div class="u-item"><code>netstat -an | findstr LISTENING</code><p>فقط پورت‌های بازِ منتظر اتصال</p></div>
      <div class="u-item"><code>netstat -s</code><p>آمار کلی: چند بسته رسیده/گم شده</p></div>
    </div>
    <div class="callout warn">⚠️ <div>اتصالاتی که به IPهای خارجی با پورت‌های عجیب و حالت <code style="direction:ltr;unicode-bidi:embed">ESTABLISHED</code> دارند و برنامه‌شان را نمی‌شناسی، می‌توانند نشانه بدافزار باشند — با PID در Task Manager بررسی‌شان کن.</div></div>
  </div>

  <!-- arp -->
  <div class="cmd-card">
    <div class="cmd-head">
      <div class="cmd-icon">📇</div>
      <div><h3>arp -a</h3><span class="sub">مشاهده جدول ARP — نقشه IP به MAC در شبکه محلی</span></div>
      <span class="badge b-imp">🔥 مهم</span>
    </div>
    <p class="cmd-desc">جدول ARP حافظه‌ی شبکه محلی است: <b>کدام IP با کدام MAC</b> دیده شده. سریع‌ترین راه برای دیدن دستگاه‌های متصل به شبکه‌ات!</p>
    <div class="terminal">
      <div class="term-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="tname">CMD — Windows</span><button class="copy-btn">📋 کپی</button></div>
      <pre><span class="c">C:\&gt; arp -a</span>

<span class="o">Interface: 192.168.1.10 --- 0x4</span>
  <span class="o">Internet Address      Physical Address      Type</span>
  <span class="h">192.168.1.1           a4-5e-60-c3-1a-2b     dynamic</span>   <span class="o">← روتر</span>
  <span class="h">192.168.1.15          d8-f2-ca-9b-4e-77     dynamic</span>   <span class="o">← لپ‌تاپ</span>
  <span class="h">192.168.1.30          00-1b-44-11-3a-b7     dynamic</span>   <span class="o">← پرینتر</span></pre>
    </div>
    <div class="usage">
      <div class="u-item"><code>arp -a</code><p>نمایش همه دستگاه‌های دیده‌شده در LAN</p></div>
      <div class="u-item"><code>ping 192.168.1.255</code> + <code>arp -a</code><p>ترفند: پینگ broadcast، سپس لیست کامل دستگاه‌ها!</p></div>
      <div class="u-item"><code>arp -d *</code><p>پاک کردن جدول (شروع تازه)</p></div>
    </div>
    <div class="callout warn">⚠️ <div>اگر IP گیت‌وی ناگهان MAC عوض کرد و تغییرات مکرر داشت، ممکن است قربانی <b>ARP Spoofing / حملات Man-in-the-Middle</b> شده باشی.</div></div>
  </div>

  <!-- route -->
  <div class="cmd-card">
    <div class="cmd-head">
      <div class="cmd-icon">🛤️</div>
      <div><h3>route</h3><span class="sub">مشاهده و مدیریت جدول مسیریابی سیستم</span></div>
      <span class="badge b-ext">📦 تکمیلی</span>
    </div>
    <p class="cmd-desc">جدول مسیریابی، «GPS داخلی» ویندوز است: به کدام گیت‌وی برود تا به هر شبکه برسد.</p>
    <div class="usage">
      <div class="u-item"><code>route print</code><p>نمایش کامل جدول مسیریابی</p></div>
      <div class="u-item"><code>route print -4</code><p>فقط مسیرهای IPv4</p></div>
      <div class="u-item"><code>route add 10.5.0.0 mask 255.255.255.0 192.168.1.254</code><p>افزودن مسیر دستی به شبکه 10.5.0.0</p></div>
      <div class="u-item"><code>route delete 10.5.0.0</code><p>حذف آن مسیر</p></div>
    </div>
  </div>

  <!-- netsh -->
  <div class="cmd-card">
    <div class="cmd-head">
      <div class="cmd-icon">🛠️</div>
      <div><h3>netsh</h3><span class="sub">جعبه‌ابزار چندکاره: وای‌فای، IP، فایروال و ریست شبکه</span></div>
      <span class="badge b-imp">🔥 مهم</span>
    </div>
    <p class="cmd-desc">دستور چندلایه‌ای برای دیدن و تنظیم عمیق شبکه. مشهورترین کاربردش: <b>پیدا کردن پسورد وای‌فای ذخیره‌شده!</b></p>
    <div class="terminal">
      <div class="term-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="tname">CMD — Run as Administrator</span><button class="copy-btn">📋 کپی</button></div>
      <pre><span class="c">C:\&gt; netsh wlan show profile name="HomeWiFi" key=clear</span>

<span class="o">Profile: HomeWiFi</span>
   <span class="o">Authentication: WPA2-Personal</span>
   <span class="h">Key Content : MyPass1234</span>   <span class="o">← پسورد وای‌فای!</span></pre>
    </div>
    <div class="usage">
      <div class="u-item"><code>netsh wlan show profiles</code><p>لیست وای‌فای‌های ذخیره‌شده</p></div>
      <div class="u-item"><code>netsh wlan show networks</code><p>وای‌فای‌های در دسترس اطراف + قدرت سیگنال</p></div>
      <div class="u-item"><code>netsh wlan show drivers</code><p>قابلیت‌های کارت وای‌فای</p></div>
      <div class="u-item"><code>netsh int ip reset</code><p>ریست کامل TCP/IP — معجون آخرِ عیب‌یابی!</p></div>
      <div class="u-item"><code>netsh winsock reset</code><p>ریست کاتالوگ Winsock پس از بدافزار</p></div>
    </div>
  </div>

  <!-- getmac -->
  <div class="cmd-card">
    <div class="cmd-head">
      <div class="cmd-icon">🔖</div>
      <div><h3>getmac و hostname</h3><span class="sub">شناسه فیزیکی کارت شبکه و نام کامپیوتر</span></div>
      <span class="badge b-ext">📦 تکمیلی</span>
    </div>
    <div class="usage">
      <div class="u-item"><code>getmac /v</code><p>نمایش MAC همه کارت‌های شبکه با جزئیات</p></div>
      <div class="u-item"><code>hostname</code><p>نام کامپیوتر در شبکه</p></div>
      <div class="u-item"><code>nbtstat -A 192.168.1.15</code><p>نام ویندوزیِ یک دستگاه از روی IP آن</p></div>
      <div class="u-item"><code>telnet 192.168.1.5 80</code><p>تست اینکه پورت ۸۰ یک دستگاه باز است یا نه</p></div>
    </div>
    <div class="callout info">ℹ️ <div>چرا MAC مهم است؟ برای <b>فیلتر MAC</b> در روتر (اجازه فقط به دستگاه‌های خودت)، ردیابی دستگاه متصل و تنظیم DHCP رزرو (IP ثابت برای پرینتر و ...).</div></div>
  </div>
</section>

<!-- ================= دستورات لینوکس ================= -->
<section id="linux" class="reveal">
  <div class="sec-title"><div class="ico">🐧</div><h2>دستورات کاربردی لینوکس (Terminal)</h2></div>
  <p class="sec-desc">لینوکس قلب سرورها و تجهیزات شبکه است. بسیاری از دستورات به <code style="direction:ltr;unicode-bidi:embed">sudo</code> (دسترسی مدیر) نیاز دارند.</p>

  <div class="cmd-card">
    <div class="cmd-head">
      <div class="cmd-icon">🪪</div>
      <div><h3>ip</h3><span class="sub">جایگزین مدرن ifconfig ، route و arp — همه در یک دستور</span></div>
      <span class="badge b-ess">⭐ ضروری</span>
    </div>
    <div class="terminal">
      <div class="term-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="tname">Linux Terminal</span><button class="copy-btn">📋 کپی</button></div>
      <pre><span class="c">$ ip a</span>    <span class="o"># نمایش IP همه کارت‌های شبکه</span>
<span class="h">2: wlp3s0: &lt;BROADCAST,MULTICAST,UP&gt;</span>
    <span class="h">inet 192.168.1.10/24 brd 192.168.1.255</span>

<span class="c">$ ip r</span>    <span class="o"># جدول مسیریابی (Gateway)</span>
<span class="h">default via 192.168.1.1 dev wlp3s0</span>

<span class="c">$ ip neigh</span>  <span class="o"># جدول ARP (همتای arp -a)</span></pre>
    </div>
    <div class="usage">
      <div class="u-item"><code>ip a</code><p>نمایش IP و وضعیت کارت‌ها (معادل ipconfig)</p></div>
      <div class="u-item"><code>ip r</code><p>دیدن گیت‌وی پیش‌فرض</p></div>
      <div class="u-item"><code>ip link set wlp3s0 down</code><p>خاموش کردن کارت شبکه</p></div>
      <div class="u-item"><code>ip link set wlp3s0 up</code><p>روشن کردن کارت شبکه</p></div>
      <div class="u-item"><code>hostname -I</code><p>فقط IP های خود دستگاه — سریع!</p></div>
    </div>
  </div>

  <div class="cmd-card">
    <div class="cmd-head">
      <div class="cmd-icon">🏓</div>
      <div><h3>ping و traceroute</h3><span class="sub">تست اتصال و ردیابی مسیر — نسخه لینوکسی</span></div>
      <span class="badge b-ess">⭐ ضروری</span>
    </div>
    <div class="terminal">
      <div class="term-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="tname">Linux Terminal</span><button class="copy-btn">📋 کپی</button></div>
      <pre><span class="c">$ ping -c 4 8.8.8.8</span>        <span class="o"># فقط ۴ بسته (در لینوکس ping خودکار متوقف نمی‌شود!)</span>
<span class="c">$ traceroute google.com</span>    <span class="o"># معادل tracert ویندوز</span>
<span class="c">$ mtr google.com</span>           <span class="o"># traceroute زنده و تعاملی ✨ (نیاز: sudo apt install mtr)</span></pre>
    </div>
    <div class="usage">
      <div class="u-item"><code>ping -c 4 site.com</code><p>۴ بسته و توقف — برخلاف ویندوز</p></div>
      <div class="u-item"><code>ping -i 0.5 8.8.8.8</code><p>هر نیم‌ثانیه یک بسته</p></div>
      <div class="u-item"><code>tracepath site.com</code><p>بدون نیاز به دسترسی root</p></div>
      <div class="u-item"><code>mtr site.com</code><p>نمایش زنده اتلاف بسته در هر Hop — حرفه‌ای‌ترین ابزار</p></div>
    </div>
  </div>

  <div class="cmd-card">
    <div class="cmd-head">
      <div class="cmd-icon">📖</div>
      <div><h3>dig و host</h3><span class="sub">پرس‌وجوی DNS — دقیق‌تر و خواناتر از nslookup</span></div>
      <span class="badge b-imp">🔥 مهم</span>
    </div>
    <div class="terminal">
      <div class="term-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="tname">Linux Terminal</span><button class="copy-btn">📋 کپی</button></div>
      <pre><span class="c">$ dig google.com</span>
<span class="h">google.com.    300  IN  A  142.250.185.78</span>
<span class="o">;; Query time: 25 msec  ;; SERVER: 8.8.8.8#53</span>

<span class="c">$ dig +short google.com</span>     <span class="o"># فقط جواب خالص</span>
<span class="c">$ host gmail.com</span>            <span class="o"># نسخه ساده و جمع‌وجور</span></pre>
    </div>
    <div class="usage">
      <div class="u-item"><code>dig site.com</code><p>استعلام کامل با جزئیات و زمان پاسخ</p></div>
      <div class="u-item"><code>dig @1.1.1.1 site.com</code><p>پرس‌وجو از DNS کلودفلر</p></div>
      <div class="u-item"><code>dig +short site.com</code><p>خروجی تمیز برای اسکریپت‌ها</p></div>
      <div class="u-item"><code>dig -x 8.8.8.8</code><p>جستجوی معکوس: از IP به نام</p></div>
    </div>
  </div>

  <div class="cmd-card">
    <div class="cmd-head">
      <div class="cmd-icon">🕸️</div>
      <div><h3>ss</h3><span class="sub">جایگزین مدرن netstat — اتصالات و پورت‌های باز</span></div>
      <span class="badge b-imp">🔥 مهم</span>
    </div>
    <div class="terminal">
      <div class="term-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="tname">Linux Terminal</span><button class="copy-btn">📋 کپی</button></div>
      <pre><span class="c">$ ss -tulnp</span>
<span class="o">Netid State  Local Address:Port   Peer Address:Port</span>
<span class="h">tcp   LISTEN 0.0.0.0:22           0.0.0.0:*</span>  <span class="o">← SSH باز است</span>
<span class="h">tcp   LISTEN 0.0.0.0:80           0.0.0.0:*</span>  <span class="o">← وب‌سرور فعال</span></pre>
    </div>
    <div class="usage">
      <div class="u-item"><code>ss -tulnp</code><p>TCP+UDP، شنونده‌ها، با نام برنامه (با sudo)</p></div>
      <div class="u-item"><code>ss -t state established</code><p>فقط اتصالات برقرار</p></div>
      <div class="u-item"><code>ss -tnp | grep :443</code><p>فیلتر اتصالات پورت ۴۴۳</p></div>
    </div>
  </div>

  <div class="cmd-card">
    <div class="cmd-head">
      <div class="cmd-icon">🧰</div>
      <div><h3>curl و nmcli</h3><span class="sub">تست HTTP و مدیریت شبکه (NetworkManager)</span></div>
      <span class="badge b-ext">📦 تکمیلی</span>
    </div>
    <div class="terminal">
      <div class="term-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="tname">Linux Terminal</span><button class="copy-btn">📋 کپی</button></div>
      <pre><span class="c">$ curl -I https://google.com</span>   <span class="o"># فقط هدر HTTP — تست سلامت سایت</span>
<span class="h">HTTP/2 200</span>                      <span class="o">← سایت سالم است ✅</span>

<span class="c">$ nmcli device wifi list</span>        <span class="o"># لیست وای‌فای‌های اطراف + قدرت سیگنال</span>
<span class="c">$ nmcli device wifi connect "HomeWiFi" password "mypass"</span>
<span class="c">$ sudo systemctl restart NetworkManager</span>  <span class="o"># ریست سرویس شبکه</span></pre>
    </div>
    <div class="usage">
      <div class="u-item"><code>curl -I site.com</code><p>دیدن کد وضعیت HTTP (200 سالم، 404 پیدا نشد، 503 سرور شلوغ)</p></div>
      <div class="u-item"><code>nmcli device status</code><p>وضعیت همه کارت‌های شبکه</p></div>
      <div class="u-item"><code>nmcli con show</code><p>لیست اتصالات ذخیره‌شده</p></div>
    </div>
  </div>

  <div class="cmd-card">
    <div class="cmd-head">
      <div class="cmd-icon">🔍</div>
      <div><h3>nmap</h3><span class="sub">اسکنر حرفه‌ای شبکه — کشف دستگاه‌ها و پورت‌های باز</span></div>
      <span class="badge b-ext">📦 تکمیلی</span>
    </div>
    <p class="cmd-desc">قوی‌ترین ابزار کشف شبکه. برای مدیریت شبکه‌ی <b>خودت</b> عالی است؛ اسکن شبکه دیگران بدون اجازه غیرقانونی است!</p>
    <div class="terminal">
      <div class="term-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="tname">Linux Terminal</span><button class="copy-btn">📋 کپی</button></div>
      <pre><span class="c">$ sudo nmap -sn 192.168.1.0/24</span>   <span class="o"># چه دستگاه‌هایی روشن‌اند؟</span>
<span class="h">Nmap scan report for 192.168.1.1</span>
<span class="h">Nmap scan report for 192.168.1.15</span>

<span class="c">$ sudo nmap -sV 192.168.1.1</span>       <span class="o"># چه سرویس‌هایی روی روتر اجراست؟</span></pre>
    </div>
    <div class="usage">
      <div class="u-item"><code>nmap -sn 192.168.1.0/24</code><p>کشف همه دستگاه‌های زنده شبکه</p></div>
      <div class="u-item"><code>nmap -sV IP</code><p>شناسایی نسخه سرویس‌های یک دستگاه</p></div>
      <div class="u-item"><code>nmap -p 1-1000 IP</code><p>اسکن محدوده پورت‌ها</p></div>
    </div>
  </div>
</section>

<!-- ================= جدول معادل ================= -->
<section id="equiv" class="reveal">
  <div class="sec-title"><div class="ico">🔄</div><h2>جدول معادل‌ها: ویندوز ↔ لینوکس</h2></div>
  <p class="sec-desc">هر کاری را در هر دو سیستم‌عامل چطور انجام دهیم؟</p>
  <div class="tbl-wrap">
    <table>
      <tr><th>🎯 کاربرد</th><th>🪟 ویندوز</th><th>🐧 لینوکس</th></tr>
      <tr><td>نمایش IP کارت‌ها</td><td><code>ipconfig /all</code></td><td><code>ip a</code></td></tr>
      <tr><td>تست اتصال</td><td><code>ping -n 4 8.8.8.8</code></td><td><code>ping -c 4 8.8.8.8</code></td></tr>
      <tr><td>ردیابی مسیر</td><td><code>tracert</code></td><td><code>traceroute</code> / <code>mtr</code></td></tr>
      <tr><td>پرس‌وجوی DNS</td><td><code>nslookup</code></td><td><code>dig</code> / <code>host</code></td></tr>
      <tr><td>اتصالات و پورت‌ها</td><td><code>netstat -ano</code></td><td><code>ss -tulnp</code></td></tr>
      <tr><td>جدول ARP</td><td><code>arp -a</code></td><td><code>ip neigh</code></td></tr>
      <tr><td>جدول مسیریابی</td><td><code>route print</code></td><td><code>ip r</code></td></tr>
      <tr><td>MAC آدرس</td><td><code>getmac /v</code></td><td><code>ip link</code></td></tr>
      <tr><td>کش DNS</td><td><code>ipconfig /flushdns</code></td><td><code>sudo systemd-resolve --flush-caches</code></td></tr>
    </table>
  </div>
</section>

<!-- ================= عیب‌یابی ================= -->
<section id="trouble" class="reveal">
  <div class="sec-title"><div class="ico">🩺</div><h2>عیب‌یابی اینترنت — گام به گام</h2></div>
  <p class="sec-desc">اینترنت قطع است؟ این فلوشارت را از بالا به پایین اجرا کن؛ هر گام یک بخش از مسیر را آزمایش می‌کند و دقیقاً می‌گوید <b>مشکل کجاست</b>:</p>

  <div class="flow-step">
    <div class="flow-q"><span class="flow-num">۱</span>کارت شبکه و پشته TCP/IP سالم است؟</div>
    <div class="terminal">
      <div class="term-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="tname">CMD</span><button class="copy-btn">📋 کپی</button></div>
      <pre><span class="c">C:\&gt; ping 127.0.0.1</span>   <span class="o">← آدرس لوکال‌هاست: خودِ دستگاه</span></pre>
    </div>
    <div class="branches">
      <div class="branch ok">✅ <b>پاسخ آمد:</b> کارت شبکه و TCP/IP سالم است → برو گام ۲</div>
      <div class="branch bad">❌ <b>خطا:</b> درایور کارت شبکه خراب یا TCP/IP معیوب است → Device Manager و <code style="direction:ltr;unicode-bidi:embed">netsh int ip reset</code></div>
    </div>
  </div>
  <div class="flow-arrow">⬇</div>

  <div class="flow-step">
    <div class="flow-q"><span class="flow-num">۲</span>دستگاه یک IP معتبر گرفته؟</div>
    <div class="terminal">
      <div class="term-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="tname">CMD</span><button class="copy-btn">📋 کپی</button></div>
      <pre><span class="c">C:\&gt; ipconfig</span></pre>
    </div>
    <div class="branches">
      <div class="branch ok">✅ <b>IP مثل 192.168.1.x</b> داری → برو گام ۳</div>
      <div class="branch bad">❌ <b>IP با 169.254 شروع می‌شود:</b> DHCP جواب نداده → <code style="direction:ltr;unicode-bidi:embed">ipconfig /release</code> سپس <code style="direction:ltr;unicode-bidi:embed">ipconfig /renew</code> — یا کابل/وای‌فای را چک کن</div>
    </div>
  </div>
  <div class="flow-arrow">⬇</div>

  <div class="flow-step">
    <div class="flow-q"><span class="flow-num">۳</span>اتصال به روتر (Gateway) برقرار است؟</div>
    <div class="terminal">
      <div class="term-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="tname">CMD</span><button class="copy-btn">📋 کپی</button></div>
      <pre><span class="c">C:\&gt; ping 192.168.1.1</span>   <span class="o">← همان Default Gateway از گام قبل</span></pre>
    </div>
    <div class="branches">
      <div class="branch ok">✅ <b>پاسخ آمد:</b> شبکه محلی سالم است → برو گام ۴</div>
      <div class="branch bad">❌ <b>Timed out:</b> مشکل داخل خانه است → کابل را عوض کن، به وای‌فای نزدیک‌تر شو، روتر را ری‌استارت کن</div>
    </div>
  </div>
  <div class="flow-arrow">⬇</div>

  <div class="flow-step">
    <div class="flow-q"><span class="flow-num">۴</span>راه خروجی به اینترنت باز است؟</div>
    <div class="terminal">
      <div class="term-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="tname">CMD</span><button class="copy-btn">📋 کپی</button></div>
      <pre><span class="c">C:\&gt; ping 8.8.8.8</span>   <span class="o">← یک IP عمومی بدون واسطه DNS</span></pre>
    </div>
    <div class="branches">
      <div class="branch ok">✅ <b>پاسخ آمد:</b> اینترنت وصل است! مشکل احتمالاً DNS است → برو گام ۵</div>
      <div class="branch bad">❌ <b>Timed out:</b> روتر به اینترنت دسترسی ندارد → وضعیت چراغ‌های مودم را ببین یا با ISP تماس بگیر</div>
    </div>
  </div>
  <div class="flow-arrow">⬇</div>

  <div class="flow-step">
    <div class="flow-q"><span class="flow-num">۵</span>سرویس DNS کار می‌کند؟</div>
    <div class="terminal">
      <div class="term-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="tname">CMD</span><button class="copy-btn">📋 کپی</button></div>
      <pre><span class="c">C:\&gt; nslookup google.com</span></pre>
    </div>
    <div class="branches">
      <div class="branch ok">✅ <b>IP برگشت:</b> همه‌چیز سالم است؛ مشکل از خود سایت یا مرورگر است</div>
      <div class="branch bad">❌ <b>خطا:</b> DNS خراب است → <code style="direction:ltr;unicode-bidi:embed">ipconfig /flushdns</code> و تغییر DNS به 8.8.8.8 در تنظیمات کارت شبکه</div>
    </div>
  </div>
  <div class="flow-arrow">⬇</div>

  <div class="flow-step">
    <div class="flow-q"><span class="flow-num">۶</span>مسیر دقیقاً کجا قطع شده؟ (اختیاری و حرفه‌ای)</div>
    <div class="terminal">
      <div class="term-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="tname">CMD</span><button class="copy-btn">📋 کپی</button></div>
      <pre><span class="c">C:\&gt; tracert 8.8.8.8</span>   <span class="o">← آخرین سطرِ سالم = محل تقریبی مشکل</span></pre>
    </div>
    <div class="branches">
      <div class="branch ok">✅ <b>کامل تا مقصد:</b> مسیر شما کاملاً سالم است 🎉</div>
      <div class="branch bad">❌ <b>از Hop شماره ۲ به بعد قطع:</b> مشکل از ISP است — با tracert به‌عنوان مدرک تماس بگیر!</div>
    </div>
  </div>
</section>

<!-- ================= سناریوها ================= -->
<section id="scenarios" class="reveal">
  <div class="sec-title"><div class="ico">🛠️</div><h2>سناریوهای کاربردی واقعی</h2></div>
  <p class="sec-desc">موقعیت‌هایی که در دنیای واقعی پیش می‌آیند و راه‌حل گام‌به‌گامشان:</p>

  <div class="scenario">
    <h3>🎭 سناریو ۱: «سایت X برای من باز نمی‌شود، اما برای بقیه باز می‌شود!»</h3>
    <ol>
      <li>با <code>ping site.com</code> چک کن آیا اصلاً IP درست می‌گیرد</li>
      <li>با <code>nslookup site.com 8.8.8.8</code> آن را با DNS گوگل مقایسه کن — اگر متفاوت بود، کش DNS شما خراب/قدیمی است</li>
      <li>پاکش کن: <code>ipconfig /flushdns</code> و مرورگر را ری‌استارت کن</li>
      <li>اگر هنوز مشکل بود، DNS سیستم را به <code>8.8.8.8</code> یا <code>1.1.1.1</code> تغییر بده</li>
    </ol>
  </div>

  <div class="scenario">
    <h3>👀 سناریو ۲: «چه دستگاه‌هایی به وای‌فای من وصل‌اند؟»</h3>
    <ol>
      <li><code>ipconfig</code> را بزن و IP و Subnet خودت را ببین (مثلاً 192.168.1.10 با ماسک 255.255.255.0)</li>
      <li>کل رنج را پینگ کن: <code>for /L %i in (1,1,254) do @ping -n 1 -w 100 192.168.1.%i &gt;nul</code></li>
      <li>حالا لیست کامل را ببین: <code>arp -a</code> — هر سطر یک دستگاه زنده!</li>
      <li>در لینوکس: <code>sudo nmap -sn 192.168.1.0/24</code> یک‌خطه همه را پیدا می‌کند</li>
    </ol>
  </div>

  <div class="scenario">
    <h3>🚧 سناریو ۳: «برنامه‌ام اجرا نمی‌شود؛ می‌گوید پورت 8080 اشغال است»</h3>
    <ol>
      <li>پیدا کردن مقصر: <code>netstat -ano | findstr :8080</code></li>
      <li>در انتهای سطر، عدد PID را بردار (مثلاً 3456)</li>
      <li>در Task Manager → تب Details → با PID کالونی، برنامه را پیدا و ببند</li>
      <li>یا در CMD: <code>taskkill /PID 3456 /F</code></li>
    </ol>
  </div>

  <div class="scenario">
    <h3>🔑 سناریو ۴: «پسورد وای‌فای را فراموش کردم!»</h3>
    <ol>
      <li>CMD را <b>با Run as Administrator</b> باز کن</li>
      <li>اسم وای‌فای‌های ذخیره‌شده: <code>netsh wlan show profiles</code></li>
      <li>نمایش پسورد: <code>netsh wlan show profile name="HomeWiFi" key=clear</code></li>
      <li>جواب را در خط <code>Key Content</code> ببین 🎉</li>
    </ol>
  </div>

  <div class="scenario">
    <h3>🐌 سناریو ۵: «اینترنت کند شده؛ مقصر کیست؟»</h3>
    <ol>
      <li>تأخیر پایه را بسنج: <code>ping -t 192.168.1.1</code> — اگر به روترِ خودت هم تأخیر بالا/نوسان داری، مشکل <b>وای‌فای</b> است (فاصله، دیوار، تداخل کانال)</li>
      <li>اگر روتر سالم بود: <code>ping -t 8.8.8.8</code> — نوسان اینجا یعنی مشکل <b>خط مخابراتی/ISP</b></li>
      <li>اتلاف بسته را دقیق ببین: <code>pathping 8.8.8.8</code> (صبر کن، ۵ دقیقه طول می‌کشد)</li>
      <li>برنامه‌ی پرت‌مصرف را پیدا کن: <code>netstat -b</code> یا Task Manager → ستون Network</li>
    </ol>
  </div>
</section>

<!-- ================= پورت‌ها ================= -->
<section id="ports" class="reveal">
  <div class="sec-title"><div class="ico">🚢</div><h2>جدول پورت‌های معروف</h2></div>
  <p class="sec-desc">این پورت‌ها را حفظ باشی، خروجی netstat و nmap برایت مثل متن ساده خوانده می‌شود:</p>
  <div class="tbl-wrap">
    <table>
      <tr><th>پورت</th><th>سرویس</th><th>کاربرد</th></tr>
      <tr><td><code>80</code></td><td>HTTP</td><td>وب (بدون رمزنگاری)</td></tr>
      <tr><td><code>443</code></td><td>HTTPS</td><td>وب امن (قفل مرورگر 🔒)</td></tr>
      <tr><td><code>53</code></td><td>DNS</td><td>ترجمه نام دامنه به IP</td></tr>
      <tr><td><code>22</code></td><td>SSH</td><td>اتصال امن به سرور/روتر</td></tr>
      <tr><td><code>20-21</code></td><td>FTP</td><td>انتقال فایل</td></tr>
      <tr><td><code>25</code></td><td>SMTP</td><td>ارسال ایمیل</td></tr>
      <tr><td><code>67/68</code></td><td>DHCP</td><td>توزیع خودکار IP</td></tr>
      <tr><td><code>3389</code></td><td>RDP</td><td>دسکتاپ ریموت ویندوز</td></tr>
      <tr><td><code>445</code></td><td>SMB</td><td>اشتراک فایل و پرینتر ویندوز</td></tr>
    </table>
  </div>
</section>

<!-- ================= نکات طلایی ================= -->
<section id="gold" class="reveal">
  <div class="sec-title"><div class="ico">💡</div><h2>۱۰ نکته طلایی</h2></div>
  <div class="gold-list">
    <div class="gold-item"><div class="g-ico">⏱️</div><div><b>TTL را معنادار بخوان:</b> ۱۲۸ = ویندوز، ۶۴ = لینوکس. تفاوتش با TTL دریافتی = تعداد روترهای طی‌شده.</div></div>
    <div class="gold-item"><div class="g-ico">🚨</div><div><b>169.254.x.x = زنگ خطر DHCP.</b> این IP اضطراری است؛ یعنی روتر جواب نداده.</div></div>
    <div class="gold-item"><div class="g-ico">🔇</div><div><b>نبود جواب ping همیشه قطعی نیست!</b> فایروال‌ها معمولاً ICMP را بلاک می‌کنند. سرور ممکن است زنده باشد ولی ساکت.</div></div>
    <div class="gold-item"><div class="g-ico">🧹</div><div><b>بعد از هر تغییر DNS، کش را خالی کن:</b> <code style="direction:ltr;unicode-bidi:embed">ipconfig /flushdns</code></div></div>
    <div class="gold-item"><div class="g-ico">⛔</div><div><b>Timed out ≠ Unreachable:</b> اولی یعنی مسیر هست ولی پاسخ نیامد؛ دومی یعنی اصلاً راهی نیست!</div></div>
    <div class="gold-item"><div class="g-ico">↩️</div><div><b>Ctrl+C</b> هر دستور در حال اجرا (مثل ping -t) را متوقف می‌کند. با <b>F7</b> در CMD تاریخچه دستورات را ببین.</div></div>
    <div class="gold-item"><div class="g-ico">🛡️</div><div><b>دستورات مدیریتی (netstat -b و netsh) نیاز به Run as Administrator دارند</b> — کلیک راست روی CMD.</div></div>
    <div class="gold-item"><div class="g-ico">💾</div><div><b>قبل از هر تغییر، از وضعیت فعلی خروجی بگیر:</b> <code style="direction:ltr;unicode-bidi:embed">ipconfig /all &gt; backup.txt</code></div></div>
    <div class="gold-item"><div class="g-ico">🎯</div><div><b>ping به دامنه = تست همزمان DNS و مسیر.</b> اگر جواب نگرفتی، با IP خام (8.8.8.8) تست کن تا مقصر مشخص شود.</div></div>
    <div class="gold-item"><div class="g-ico">🧪</div><div><b>127.0.0.1 = خودت.</b> پینگ آن حتی بدون اینترنت هم جواب می‌دهد؛ پس فقط سلامت TCP/IP داخلی را می‌سنجد، نه اینترنت!</div></div>
  </div>
</section>

<!-- ================= چیت شیت ================= -->
<section id="cheat" class="reveal">
  <div class="sec-title"><div class="ico">📋</div><h2>چیت‌شیت: همه دستورات در یک نگاه</h2></div>
  <p class="sec-desc">این جدول را چاپ کن و کنار مانیتورت بچسبان! 🖨️</p>
  <div class="tbl-wrap">
    <table>
      <tr><th>دستور (ویندوز)</th><th>یک‌خطیِ کاربرد</th></tr>
      <tr><td><code>ping 8.8.8.8</code></td><td>اینترنت وصل است؟ تأخیر چقدر است؟</td></tr>
      <tr><td><code>ping 192.168.1.1</code></td><td>اتصال به روتر سالم است؟</td></tr>
      <tr><td><code>ipconfig /all</code></td><td>IP، ماسک، گیت‌وی، DNS و MAC من چیست؟</td></tr>
      <tr><td><code>ipconfig /flushdns</code></td><td>کش DNS را پاک کن</td></tr>
      <tr><td><code>ipconfig /release + /renew</code></td><td>IP تازه بگیر (رفع تداخل)</td></tr>
      <tr><td><code>tracert google.com</code></td><td>مسیر تا مقصد کدام است و کجا قطع شده؟</td></tr>
      <tr><td><code>nslookup site.com</code></td><td>IP این دامنه چیست؟ DNS کار می‌کند؟</td></tr>
      <tr><td><code>netstat -ano</code></td><td>سیستم من به کجاها وصل است؟</td></tr>
      <tr><td><code>arp -a</code></td><td>چه دستگاه‌هایی در شبکه محلی دیده‌ام؟</td></tr>
      <tr><td><code>netsh wlan show profiles</code></td><td>وای‌فای‌های ذخیره‌شده من</td></tr>
      <tr><td><code>netsh wlan show profile name="X" key=clear</code></td><td>پسورد وای‌فای ذخیره‌شده</td></tr>
      <tr><td><code>route print</code></td><td>جدول مسیریابی سیستم</td></tr>
      <tr><td><code>pathping site.com</code></td><td>تحلیل عمیق اتلاف بسته در مسیر</td></tr>
      <tr><td><code>getmac /v</code></td><td>MAC آدرس کارت‌های شبکه</td></tr>
      <tr><td><code>netsh int ip reset</code></td><td>ریست کامل TCP/IP (آخرین راه‌حل)</td></tr>
    </table>
  </div>
</section>

</div><!-- /container -->

<!-- ================= فوتر ================= -->
<footer>
  <p><b>📡 راهنمای کاربردی شبکه</b> — ساخته‌شده برای یادگیری سریع و عملی</p>
  <p style="margin-top:8px;font-size:.85rem">نکته: از دانش شبکه فقط برای مدیریت و امنیت شبکه‌ی <b>خودت</b> استفاده کن. تمرین، بهترین معلم است — همین حالا CMD را باز کن و شروع کن! 🚀</p>
</footer>

<button id="toTop" title="بازگشت به بالا">↑</button>

<script>
// ===== دکمه کپی =====
document.querySelectorAll('.copy-btn').forEach(function(btn){
  btn.addEventListener('click', function(){
    var pre = btn.closest('.terminal').querySelector('pre');
    var txt = pre.innerText;
    navigator.clipboard.writeText(txt).then(function(){
      var old = btn.textContent;
      btn.textContent = '✅ کپی شد';
      setTimeout(function(){ btn.textContent = old; }, 1500);
    });
  });
});

// ===== حالت شب / روز =====
var tBtn = document.getElementById('themeToggle');
tBtn.addEventListener('click', function(){
  document.body.classList.toggle('dark');
  var dark = document.body.classList.contains('dark');
  tBtn.textContent = dark ? '☀️ حالت روز' : '🌙 حالت شب';
});

// ===== دکمه بازگشت به بالا =====
var toTop = document.getElementById('toTop');
window.addEventListener('scroll', function(){
  toTop.classList.toggle('show', window.scrollY > 500);
});
toTop.addEventListener('click', function(){ window.scrollTo({top:0, behavior:'smooth'}); });

// ===== انیمیشن ورود بخش‌ها =====
var obs = new IntersectionObserver(function(entries){
  entries.forEach(function(e){
    if(e.isIntersecting){ e.target.classList.add('visible'); obs.unobserve(e.target); }
  });
},{threshold:0.06});
document.querySelectorAll('.reveal').forEach(function(el){ obs.observe(el); });

// ===== هایلایت منوی فعال =====
var sections = document.querySelectorAll('section[id]');
var navLinks = document.querySelectorAll('.topnav a');
window.addEventListener('scroll', function(){
  var cur = '';
  sections.forEach(function(s){
    if(window.scrollY >= s.offsetTop - 140){ cur = s.id; }
  });
  navLinks.forEach(function(a){
    a.classList.toggle('active', a.getAttribute('href') === '#' + cur);
  });
});
</script>
</body>
</html>
