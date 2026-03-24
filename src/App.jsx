import { useState, useEffect, useCallback } from "react";

const uid = () => Math.random().toString(36).slice(2, 10);
const nowISO = () => new Date().toISOString();
const isExpired = (dt) => new Date(dt) < new Date();
const hoursLeft = (dt) => (new Date(dt) - new Date()) / 3600000;
const fmtTime = (dt) => new Date(dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const fmtDate = (dt) => new Date(dt).toLocaleDateString([], { day: "numeric", month: "short" });
const fmtFull = (dt) => new Date(dt).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const fmtCur = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

// ─── Seed data ─────────────────────────────────────────────────────────────
const inHours = (h, mins = 0) => {
  const d = new Date(); d.setHours(d.getHours() + h, d.getMinutes() + mins, 0, 0);
  return d.toISOString().slice(0, 16);
};

const SEED_USERS = [
  { id: "u1", name: "Spice Garden", email: "spice@demo.com", password: "demo", role: "seller", avatar: "SG", city: "Kochi" },
  { id: "u2", name: "The Dosa House", email: "dosa@demo.com", password: "demo", role: "seller", avatar: "DH", city: "Alappuzha" },
  { id: "u3", name: "Priya Nair", email: "priya@demo.com", password: "demo", role: "buyer", avatar: "PN", city: "Kochi" },
  { id: "u4", name: "Rahul Menon", email: "rahul@demo.com", password: "demo", role: "buyer", avatar: "RM", city: "Alappuzha" },
];

const SEED_LISTINGS = [
  { id: "l1", sellerId: "u1", name: "Chicken Biryani", qty: 8, unit: "portions", originalPrice: 220, salePrice: 80, description: "Aromatic Malabar-style biryani with raita and pickle. Made fresh this evening.", category: "Rice & Biryani", pickupFrom: inHours(0, 30), pickupUntil: inHours(2), city: "Kochi", address: "MG Road, Ernakulam", createdAt: nowISO(), status: "active" },
  { id: "l2", sellerId: "u2", name: "Masala Dosa Platter", qty: 12, unit: "pieces", originalPrice: 90, salePrice: 35, description: "Crispy dosas with sambar and three chutneys. Perfect for a quick dinner.", category: "Breakfast & Snacks", pickupFrom: inHours(1), pickupUntil: inHours(3), city: "Alappuzha", address: "Canal Road, Alappuzha", createdAt: nowISO(), status: "active" },
  { id: "l3", sellerId: "u1", name: "Paneer Butter Masala + Rotis", qty: 6, unit: "portions", originalPrice: 180, salePrice: 70, description: "Rich, creamy paneer gravy with 3 butter rotis per portion.", category: "Curry & Sides", pickupFrom: inHours(0, 15), pickupUntil: inHours(1, 30), city: "Kochi", address: "MG Road, Ernakulam", createdAt: nowISO(), status: "active" },
  { id: "l4", sellerId: "u2", name: "Kerala Sadhya Meal", qty: 4, unit: "plates", originalPrice: 280, salePrice: 110, description: "Full sadhya with rice, avial, olan, thoran, pickle and papadum.", category: "Meals", pickupFrom: inHours(0, 45), pickupUntil: inHours(2, 30), city: "Alappuzha", address: "Canal Road, Alappuzha", createdAt: nowISO(), status: "active" },
  { id: "l5", sellerId: "u1", name: "Mutton Curry + Rice", qty: 5, unit: "portions", originalPrice: 260, salePrice: 100, description: "Slow-cooked Nadan mutton curry with steamed rice and papadum.", category: "Rice & Biryani", pickupFrom: inHours(1), pickupUntil: inHours(3), city: "Kochi", address: "MG Road, Ernakulam", createdAt: nowISO(), status: "active" },
];

const SEED_ORDERS = [];

// ─── Storage helpers (localStorage) ──────────────────────────────────────
const DB = {
  async get(key) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
  },
  async set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch { return false; }
  },
};

const KEYS = { users: "sfm_users", listings: "sfm_listings", orders: "sfm_orders", session: "sfm_session" };

// ─── CSS ──────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#f7f4ef;--surface:#ffffff;--surface2:#f2ede6;
  --orange:#e8610a;--orange-light:#fdf0e8;--orange-dark:#c24e06;
  --green:#1a7a4a;--green-light:#eaf5ef;--green-dark:#155f39;
  --amber:#d97706;--amber-light:#fffbeb;
  --red:#c0392b;--red-light:#fef2f2;
  --blue:#2563eb;--blue-light:#eff6ff;
  --ink:#1a1714;--ink2:#524f4a;--ink3:#8a8580;
  --border:#e5e0d8;--border2:#cfc9c0;
  --r:12px;--r-sm:8px;--r-lg:18px;--r-full:999px;
  --shadow:0 1px 4px rgba(0,0,0,.08),0 4px 16px rgba(0,0,0,.06);
  --shadow-lg:0 8px 32px rgba(0,0,0,.12);
}
body{font-family:'Sora',sans-serif;background:var(--bg);color:var(--ink);min-height:100vh;font-size:14px}
h1,h2,h3,h4{font-family:'Sora',sans-serif}
.serif{font-family:'Instrument Serif',serif}

/* ── Layout ── */
.shell{display:flex;flex-direction:column;min-height:100vh}
.topbar{height:58px;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:0;padding:0 24px;position:sticky;top:0;z-index:100}
.logo{display:flex;align-items:center;gap:8px;margin-right:32px;text-decoration:none;cursor:pointer}
.logo-mark{width:32px;height:32px;background:var(--orange);border-radius:var(--r-sm);display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;font-weight:700;flex-shrink:0}
.logo-text{font-size:1.05rem;font-weight:700;color:var(--ink);letter-spacing:-.02em}
.logo-text span{color:var(--orange)}
.nav{display:flex;gap:2px;flex:1}
.nav-btn{padding:7px 14px;border:none;background:none;font-family:'Sora',sans-serif;font-size:.82rem;font-weight:500;color:var(--ink2);cursor:pointer;border-radius:var(--r-sm);transition:all .15s;display:flex;align-items:center;gap:6px}
.nav-btn:hover{background:var(--surface2);color:var(--ink)}
.nav-btn.on{background:var(--orange-light);color:var(--orange);font-weight:600}
.topbar-r{margin-left:auto;display:flex;align-items:center;gap:10px}
.avatar{width:34px;height:34px;border-radius:50%;background:var(--orange-light);color:var(--orange);font-size:.75rem;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.avatar.green{background:var(--green-light);color:var(--green)}
.chip{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:var(--r-full);font-size:.72rem;font-weight:600}
.chip-orange{background:var(--orange-light);color:var(--orange)}
.chip-green{background:var(--green-light);color:var(--green)}
.chip-amber{background:var(--amber-light);color:var(--amber)}
.chip-red{background:var(--red-light);color:var(--red)}
.chip-blue{background:var(--blue-light);color:var(--blue)}
.chip-gray{background:var(--surface2);color:var(--ink2)}
.notif-dot{width:7px;height:7px;background:var(--red);border-radius:50%;display:inline-block;margin-left:3px;vertical-align:middle}

.page{flex:1;padding:28px 24px;max-width:1140px;margin:0 auto;width:100%}
.ph{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:24px}
.ph h2{font-size:1.55rem;font-weight:700;letter-spacing:-.03em}
.ph p{color:var(--ink3);font-size:.84rem;margin-top:3px}

/* ── Buttons ── */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:9px 18px;border:none;border-radius:var(--r-sm);font-family:'Sora',sans-serif;font-size:.82rem;font-weight:600;cursor:pointer;transition:all .15s;white-space:nowrap}
.btn-orange{background:var(--orange);color:#fff}.btn-orange:hover{background:var(--orange-dark)}
.btn-green{background:var(--green);color:#fff}.btn-green:hover{background:var(--green-dark)}
.btn-outline{background:none;border:1.5px solid var(--border2);color:var(--ink2)}.btn-outline:hover{border-color:var(--orange);color:var(--orange)}
.btn-ghost{background:none;color:var(--ink3);padding:6px 10px}.btn-ghost:hover{background:var(--surface2);color:var(--ink)}
.btn-danger{background:var(--red-light);color:var(--red);border:1px solid #fcc}.btn-danger:hover{background:var(--red);color:#fff}
.btn-sm{padding:6px 13px;font-size:.77rem}
.btn-full{width:100%;padding:11px}
.btn:disabled{opacity:.45;cursor:not-allowed}

/* ── Form ── */
.field{margin-bottom:15px}
.field label{display:block;font-size:.75rem;font-weight:600;color:var(--ink2);text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px}
.field input,.field select,.field textarea{width:100%;padding:10px 13px;border:1.5px solid var(--border);border-radius:var(--r-sm);font-family:'Sora',sans-serif;font-size:.88rem;background:var(--surface);color:var(--ink);outline:none;transition:border-color .15s}
.field input:focus,.field select:focus,.field textarea:focus{border-color:var(--orange)}
.field textarea{resize:vertical;min-height:72px}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.three-col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
.err-msg{background:var(--red-light);border:1px solid #fcc;color:var(--red);padding:9px 13px;border-radius:var(--r-sm);font-size:.83rem;margin-bottom:14px}

/* ── Cards ── */
.card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:16px}
.listing-card{background:var(--surface);border-radius:var(--r-lg);border:1px solid var(--border);overflow:hidden;transition:box-shadow .2s,transform .15s;display:flex;flex-direction:column}
.listing-card:hover{box-shadow:var(--shadow);transform:translateY(-1px)}
.card-band{height:6px;background:linear-gradient(90deg,var(--orange),#f59e0b)}
.card-band.green{background:linear-gradient(90deg,var(--green),#34d399)}
.card-body-pad{padding:16px 18px;flex:1;display:flex;flex-direction:column;gap:10px}
.card-name{font-size:.98rem;font-weight:700;letter-spacing:-.02em;color:var(--ink)}
.card-rest{font-size:.78rem;color:var(--ink3);display:flex;align-items:center;gap:5px}
.price-row{display:flex;align-items:baseline;gap:8px;margin-top:2px}
.price-now{font-size:1.22rem;font-weight:700;color:var(--orange)}
.price-was{font-size:.82rem;color:var(--ink3);text-decoration:line-through}
.discount-tag{background:var(--green-light);color:var(--green);font-size:.7rem;font-weight:700;padding:2px 7px;border-radius:var(--r-full)}
.card-meta{display:flex;flex-direction:column;gap:5px}
.meta-item{font-size:.78rem;color:var(--ink2);display:flex;align-items:center;gap:6px}
.meta-item svg{flex-shrink:0;opacity:.6}
.card-desc{font-size:.8rem;color:var(--ink2);line-height:1.5;border-top:1px solid var(--border);padding-top:10px}
.card-foot{padding:12px 18px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:8px}
.qty-left{font-size:.77rem;font-weight:600;color:var(--ink2)}
.timer{font-size:.75rem;font-weight:600;display:flex;align-items:center;gap:4px}
.timer.urgent{color:var(--red)}
.timer.soon{color:var(--amber)}
.timer.ok{color:var(--green)}

/* ── Stat cards ── */
.stat-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:14px;margin-bottom:28px}
.stat-card{background:var(--surface);border-radius:var(--r-lg);border:1px solid var(--border);padding:18px 20px;display:flex;align-items:center;gap:14px}
.stat-icon{width:44px;height:44px;border-radius:var(--r-sm);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0}
.stat-val{font-size:1.7rem;font-weight:700;letter-spacing:-.04em;line-height:1}
.stat-lbl{font-size:.72rem;color:var(--ink3);text-transform:uppercase;letter-spacing:.05em;margin-top:2px}

/* ── Section heading ── */
.sec-head{font-size:.72rem;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border)}

/* ── Filter bar ── */
.filter-bar{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;align-items:center}
.search-wrap{flex:1;min-width:180px;position:relative}
.search-wrap input{padding-left:36px}
.search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--ink3);pointer-events:none}
select.flt{padding:10px 13px;border:1.5px solid var(--border);border-radius:var(--r-sm);font-family:'Sora',sans-serif;font-size:.85rem;background:var(--surface);color:var(--ink);outline:none;cursor:pointer}
select.flt:focus{border-color:var(--orange)}

/* ── Modal ── */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:200;padding:20px}
.modal{background:var(--surface);border-radius:var(--r-lg);width:100%;max-width:500px;max-height:90vh;overflow-y:auto;box-shadow:var(--shadow-lg);animation:mUp .18s ease}
.modal-head{padding:20px 24px 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border)}
.modal-head h3{font-size:1.05rem;font-weight:700}
.modal-body{padding:20px 24px}
.modal-foot{padding:14px 24px 20px;border-top:1px solid var(--border);display:flex;gap:9px;justify-content:flex-end}
@keyframes mUp{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}

/* ── Table ── */
.tbl{width:100%;border-collapse:collapse;background:var(--surface);border-radius:var(--r-lg);overflow:hidden;border:1px solid var(--border)}
.tbl th{background:var(--surface2);padding:10px 14px;text-align:left;font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:var(--ink2);font-weight:700}
.tbl td{padding:13px 14px;border-top:1px solid var(--border);font-size:.83rem;vertical-align:middle}
.tbl tr:hover td{background:#fdfcfb}
.act-row{display:flex;gap:6px}

/* ── Auth ── */
.auth-wrap{min-height:100vh;display:flex;align-items:stretch}
.auth-left{width:44%;background:var(--orange);display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:60px 56px;gap:20px;position:relative;overflow:hidden}
.auth-left::after{content:'';position:absolute;right:-60px;bottom:-60px;width:260px;height:260px;border-radius:50%;background:rgba(255,255,255,.07)}
.auth-left::before{content:'';position:absolute;top:-40px;left:-40px;width:180px;height:180px;border-radius:50%;background:rgba(0,0,0,.06)}
.auth-left h1{font-size:2.6rem;font-weight:700;color:#fff;line-height:1.1;letter-spacing:-.04em;position:relative}
.auth-left p{color:rgba(255,255,255,.82);font-size:.95rem;line-height:1.65;position:relative;max-width:360px}
.auth-left .a-stats{display:flex;gap:28px;position:relative}
.auth-left .a-stat span{display:block;font-size:1.7rem;font-weight:700;color:#fff;letter-spacing:-.04em}
.auth-left .a-stat small{font-size:.75rem;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.06em}
.auth-left .a-bullets{display:flex;flex-direction:column;gap:10px;position:relative}
.auth-left .a-bul{display:flex;align-items:flex-start;gap:10px;color:rgba(255,255,255,.9);font-size:.88rem}
.auth-left .a-bul::before{content:'✓';background:rgba(255,255,255,.2);width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.72rem;flex-shrink:0;margin-top:1px}
.auth-right{flex:1;display:flex;align-items:center;justify-content:center;padding:48px;background:var(--bg)}
.auth-box{width:100%;max-width:400px}
.auth-box h2{font-size:1.65rem;font-weight:700;letter-spacing:-.03em;margin-bottom:4px}
.auth-box .sub{color:var(--ink3);font-size:.85rem;margin-bottom:26px}
.tab-row{display:flex;background:var(--surface2);border-radius:var(--r-sm);padding:3px;margin-bottom:22px;gap:3px}
.tab-btn{flex:1;padding:8px;border:none;background:none;border-radius:6px;cursor:pointer;font-size:.82rem;font-family:'Sora',sans-serif;font-weight:500;color:var(--ink3);transition:all .15s}
.tab-btn.on{background:#fff;color:var(--ink);font-weight:600;box-shadow:0 1px 4px rgba(0,0,0,.08)}
.role-pick{display:flex;gap:10px;margin-bottom:18px}
.role-card{flex:1;border:1.5px solid var(--border);border-radius:var(--r-sm);padding:13px;text-align:center;cursor:pointer;transition:all .15s;background:var(--surface)}
.role-card:hover{border-color:var(--orange)}
.role-card.on{border-color:var(--orange);background:var(--orange-light)}
.role-card .ri{font-size:.82rem;font-weight:700;color:var(--ink);margin-bottom:2px}
.role-card .rd{font-size:.72rem;color:var(--ink3)}
.role-icon-wrap{font-size:1.5rem;margin-bottom:5px}

/* ── Toast ── */
.toast-stack{position:fixed;bottom:24px;right:24px;display:flex;flex-direction:column;gap:8px;z-index:999}
.toast{background:var(--ink);color:#fff;padding:11px 16px;border-radius:var(--r-sm);font-size:.83rem;display:flex;align-items:center;gap:9px;animation:tIn .2s ease;box-shadow:var(--shadow-lg);max-width:320px}
.toast.succ{background:var(--green)}
.toast.fail{background:var(--red)}
.toast.info{background:var(--orange)}
@keyframes tIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}

/* ── Banner ── */
.banner{background:var(--orange-light);border:1px solid #fcd8bc;border-radius:var(--r-lg);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:24px}
.banner-info{display:flex;align-items:center;gap:12px}
.banner-icon{font-size:1.4rem}
.banner-text b{display:block;font-size:.9rem;color:var(--ink)}
.banner-text span{font-size:.8rem;color:var(--ink2)}

/* ── Order confirm ── */
.qty-stepper{display:flex;align-items:center;gap:12px;margin:12px 0}
.qty-stepper button{width:32px;height:32px;border-radius:50%;border:1.5px solid var(--border2);background:var(--surface);cursor:pointer;font-size:1.1rem;font-weight:600;display:flex;align-items:center;justify-content:center;transition:all .15s}
.qty-stepper button:hover{border-color:var(--orange);color:var(--orange)}
.qty-num{font-size:1.1rem;font-weight:700;min-width:24px;text-align:center}
.price-preview{background:var(--surface2);border-radius:var(--r-sm);padding:14px;margin-top:12px}
.price-preview .row{display:flex;justify-content:space-between;font-size:.83rem;color:var(--ink2);padding:3px 0}
.price-preview .row.total{font-size:.92rem;font-weight:700;color:var(--ink);border-top:1px solid var(--border);padding-top:8px;margin-top:6px}

/* ── Empty ── */
.empty{text-align:center;padding:56px 24px}
.empty .e-ico{font-size:2.8rem;margin-bottom:14px;opacity:.5}
.empty h3{font-size:1rem;font-weight:700;margin-bottom:6px}
.empty p{font-size:.83rem;color:var(--ink3)}

/* ── Progress pill ── */
.pct-bar{height:4px;background:var(--surface2);border-radius:var(--r-full);overflow:hidden;margin-top:4px}
.pct-fill{height:100%;background:var(--orange);border-radius:var(--r-full);transition:width .3s}
.pct-fill.green{background:var(--green)}

/* ── Dashboard hero ── */
.hero-band{background:var(--orange);border-radius:var(--r-lg);padding:24px 28px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;gap:20px;overflow:hidden;position:relative}
.hero-band::after{content:'';position:absolute;right:-30px;top:-30px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,.07)}
.hero-band h3{font-size:1.35rem;font-weight:700;color:#fff;letter-spacing:-.02em;position:relative}
.hero-band p{font-size:.85rem;color:rgba(255,255,255,.82);margin-top:4px;position:relative}
.hero-band .hero-r{position:relative}

@media(max-width:680px){.auth-left{display:none}.auth-right{padding:24px}.two-col,.three-col{grid-template-columns:1fr}}
`;

// ─── Helpers ──────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((msg, type = "info") => {
    const id = uid();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);
  return { toasts, toast };
}

function Toasts({ toasts }) {
  return (
    <div className="toast-stack">
      {toasts.map(t => <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>)}
    </div>
  );
}

function Discount({ orig, sale }) {
  return <span className="discount-tag">{Math.round((1 - sale / orig) * 100)}% off</span>;
}

function Timer({ until }) {
  const [label, setLabel] = useState("");
  const [cls, setCls] = useState("ok");
  useEffect(() => {
    const update = () => {
      const h = hoursLeft(until);
      if (h <= 0) { setLabel("Expired"); setCls("urgent"); return; }
      if (h < 1) { setLabel(`${Math.ceil(h * 60)}m left`); setCls("urgent"); return; }
      if (h < 2) { setLabel(`${h.toFixed(1)}h left`); setCls("soon"); return; }
      setLabel(`Until ${fmtTime(until)}`); setCls("ok");
    };
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, [until]);
  return <span className={`timer ${cls}`}>⏰ {label}</span>;
}

// SVG icons
const IconPin = () => <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a5 5 0 0 0-5 5c0 3.5 5 9 5 9s5-5.5 5-9a5 5 0 0 0-5-5zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/></svg>;
const IconBag = () => <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M5 4a3 3 0 0 1 6 0v1h2l1 9H2L3 5h2V4zm2 0v1h2V4a1 1 0 0 0-2 0z"/></svg>;
const IconClock = () => <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm1 7.5H7V4h2v3.5h2v1.5H9z"/></svg>;

// ─── Main ─────────────────────────────────────────────────────────────────
export default function App() {
  const [users, setUsers] = useState(null);
  const [listings, setListings] = useState(null);
  const [orders, setOrders] = useState(null);
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("home");
  const [loading, setLoading] = useState(true);
  const { toasts, toast } = useToast();

  // Load from persistent storage
  useEffect(() => {
    (async () => {
      const [u, l, o, s] = await Promise.all([
        DB.get(KEYS.users), DB.get(KEYS.listings), DB.get(KEYS.orders), DB.get(KEYS.session)
      ]);
      const users = u ?? SEED_USERS;
      const listings = l ?? SEED_LISTINGS;
      const orders = o ?? SEED_ORDERS;
      setUsers(users);
      setListings(listings);
      setOrders(orders);
      if (s) setUser(users.find(x => x.id === s) ?? null);
      setLoading(false);
      if (!u) { await DB.set(KEYS.users, users); await DB.set(KEYS.listings, listings); await DB.set(KEYS.orders, orders); }
    })();
  }, []);

  const persist = useCallback(async (key, val) => { await DB.set(key, val); }, []);

  const updateListings = useCallback(async (fn) => {
    setListings(prev => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      persist(KEYS.listings, next);
      return next;
    });
  }, [persist]);

  const updateOrders = useCallback(async (fn) => {
    setOrders(prev => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      persist(KEYS.orders, next);
      return next;
    });
  }, [persist]);

  const updateUsers = useCallback(async (fn) => {
    setUsers(prev => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      persist(KEYS.users, next);
      return next;
    });
  }, [persist]);

  const login = (u) => { setUser(u); DB.set(KEYS.session, u.id); };
  const logout = () => { setUser(null); DB.set(KEYS.session, null); setPage("home"); };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Sora, sans-serif", color: "#8a8580" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🍽️</div>
        <div style={{ fontSize: "0.9rem" }}>Loading FoodClose…</div>
      </div>
    </div>
  );

  if (!user) return (
    <>
      <style>{CSS}</style>
      <AuthPage users={users} updateUsers={updateUsers} onLogin={login} toast={toast} />
      <Toasts toasts={toasts} />
    </>
  );

  const isSeller = user.role === "seller";
  const pendingCount = isSeller
    ? orders?.filter(o => listings?.some(l => l.sellerId === user.id && l.id === o.listingId) && o.status === "pending").length
    : orders?.filter(o => o.buyerId === user.id && o.status === "pending").length;

  const navItems = isSeller
    ? [
        { id: "home", label: "Dashboard" },
        { id: "my-listings", label: "My Listings" },
        { id: "orders", label: "Orders", badge: pendingCount },
      ]
    : [
        { id: "home", label: "Home" },
        { id: "browse", label: "Browse Deals" },
        { id: "my-orders", label: "My Orders", badge: pendingCount },
      ];

  return (
    <>
      <style>{CSS}</style>
      <div className="shell">
        <header className="topbar">
          <div className="logo" onClick={() => setPage("home")}>
            <div className="logo-mark">F</div>
            <div className="logo-text">Food<span>Close</span></div>
          </div>
          <nav className="nav">
            {navItems.map(n => (
              <button key={n.id} className={`nav-btn ${page === n.id ? "on" : ""}`} onClick={() => setPage(n.id)}>
                {n.label}{n.badge > 0 && <span className="notif-dot" />}
              </button>
            ))}
          </nav>
          <div className="topbar-r">
            <div className={`avatar ${isSeller ? "" : "green"}`}>{user.avatar}</div>
            <span style={{ fontSize: ".82rem", fontWeight: 600, color: "var(--ink2)" }}>{user.name.split(" ")[0]}</span>
            <span className={`chip ${isSeller ? "chip-orange" : "chip-green"}`}>{isSeller ? "Restaurant" : "Buyer"}</span>
            <button className="btn btn-outline btn-sm" onClick={logout}>Sign out</button>
          </div>
        </header>
        <main className="page">
          {page === "home" && isSeller && <SellerHome user={user} listings={listings} orders={orders} setPage={setPage} users={users} />}
          {page === "home" && !isSeller && <BuyerHome user={user} listings={listings} orders={orders} updateOrders={updateOrders} updateListings={updateListings} users={users} toast={toast} setPage={setPage} />}
          {page === "my-listings" && isSeller && <MyListings user={user} listings={listings} updateListings={updateListings} orders={orders} toast={toast} />}
          {page === "orders" && isSeller && <SellerOrders user={user} listings={listings} orders={orders} updateOrders={updateOrders} users={users} toast={toast} />}
          {page === "browse" && !isSeller && <BrowseDeals user={user} listings={listings} orders={orders} updateOrders={updateOrders} updateListings={updateListings} users={users} toast={toast} />}
          {page === "my-orders" && !isSeller && <MyOrders user={user} orders={orders} listings={listings} users={users} />}
        </main>
      </div>
      <Toasts toasts={toasts} />
    </>
  );
}

// ─── Auth ─────────────────────────────────────────────────────────────────
function AuthPage({ users, updateUsers, onLogin, toast }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "buyer", city: "" });
  const [err, setErr] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const login = () => {
    const u = users?.find(u => u.email === form.email && u.password === form.password);
    if (!u) { setErr("Incorrect email or password."); return; }
    onLogin(u); toast(`Welcome back, ${u.name}! 👋`, "succ");
  };

  const register = () => {
    if (!form.name || !form.email || !form.password || !form.city) { setErr("Please fill in all fields."); return; }
    if (users?.find(u => u.email === form.email)) { setErr("That email is already registered."); return; }
    const initials = form.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    const nu = { id: uid(), name: form.name, email: form.email, password: form.password, role: form.role, avatar: initials, city: form.city };
    updateUsers(u => [...(u || []), nu]);
    onLogin(nu);
    toast(`Welcome to FoodClose, ${nu.name}! 🎉`, "succ");
  };

  return (
    <div className="auth-wrap">
      <div className="auth-left">
        <h1>Great food,<br/>better prices,<br/>zero waste.</h1>
        <p>Restaurants list surplus food at closing time for deeply discounted prices. Grab a fantastic meal, save money, help the planet.</p>
        <div className="a-stats">
          <div className="a-stat"><span>60–80%</span><small>Off retail price</small></div>
          <div className="a-stat"><span>Same day</span><small>Pickup only</small></div>
        </div>
        <div className="a-bullets">
          <div className="a-bul">Freshly prepared food at fraction of cost</div>
          <div className="a-bul">Restaurants reduce food waste</div>
          <div className="a-bul">Pick up before closing time</div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-box">
          <h2>FoodClose</h2>
          <p className="sub">Surplus meals at surplus-low prices.</p>
          <div className="tab-row">
            <button className={`tab-btn ${tab === "login" ? "on" : ""}`} onClick={() => { setTab("login"); setErr(""); }}>Sign In</button>
            <button className={`tab-btn ${tab === "reg" ? "on" : ""}`} onClick={() => { setTab("reg"); setErr(""); }}>Register</button>
          </div>
          {err && <div className="err-msg">⚠ {err}</div>}
          {tab === "reg" && (
            <>
              <div className="field"><label>Full Name / Restaurant Name</label><input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Spice Garden or Priya Nair" /></div>
              <div className="field"><label>I am a…</label></div>
              <div className="role-pick">
                <div className={`role-card ${form.role === "buyer" ? "on" : ""}`} onClick={() => set("role", "buyer")}>
                  <div className="role-icon-wrap">🛍️</div>
                  <div className="ri">Buyer</div>
                  <div className="rd">Browse & buy surplus</div>
                </div>
                <div className={`role-card ${form.role === "seller" ? "on" : ""}`} onClick={() => set("role", "seller")}>
                  <div className="role-icon-wrap">🍽️</div>
                  <div className="ri">Restaurant</div>
                  <div className="rd">List surplus food</div>
                </div>
              </div>
              <div className="field"><label>City</label><input value={form.city} onChange={e => set("city", e.target.value)} placeholder="e.g. Kochi, Alappuzha" /></div>
            </>
          )}
          <div className="field"><label>Email</label><input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@example.com" /></div>
          <div className="field"><label>Password</label><input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && (tab === "login" ? login() : register())} /></div>
          {tab === "login" && (
            <p style={{ fontSize: ".75rem", color: "var(--ink3)", marginBottom: 12, lineHeight: 1.6 }}>
              Demo → <b>spice@demo.com</b> (restaurant) · <b>priya@demo.com</b> (buyer) · pw: <b>demo</b>
            </p>
          )}
          <button className="btn btn-orange btn-full" onClick={tab === "login" ? login : register}>
            {tab === "login" ? "Sign In →" : "Create Account →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Seller Home ──────────────────────────────────────────────────────────
function SellerHome({ user, listings, orders, setPage, users }) {
  const mine = listings?.filter(l => l.sellerId === user.id) ?? [];
  const active = mine.filter(l => !isExpired(l.pickupUntil) && l.status === "active");
  const myOrders = orders?.filter(o => mine.some(l => l.id === o.listingId)) ?? [];
  const pending = myOrders.filter(o => o.status === "pending");
  const completed = myOrders.filter(o => o.status === "confirmed");
  const revenue = completed.reduce((s, o) => s + o.total, 0);

  return (
    <div>
      <div className="hero-band">
        <div>
          <h3>Hello, {user.name} 👋</h3>
          <p>List tonight's surplus and let nearby buyers grab it.</p>
        </div>
        <div className="hero-r">
          <button className="btn" style={{ background: "#fff", color: "var(--orange)", fontWeight: 700 }} onClick={() => setPage("my-listings")}>
            + Add Listing
          </button>
        </div>
      </div>
      <div className="stat-row">
        <div className="stat-card"><div className="stat-icon" style={{ background: "var(--orange-light)" }}>🍽️</div><div><div className="stat-val">{active.length}</div><div className="stat-lbl">Active Listings</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: "var(--amber-light)" }}>⏳</div><div><div className="stat-val">{pending.length}</div><div className="stat-lbl">Pending Orders</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: "var(--green-light)" }}>✅</div><div><div className="stat-val">{completed.length}</div><div className="stat-lbl">Completed</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: "var(--blue-light)" }}>💰</div><div><div className="stat-val">{fmtCur(revenue)}</div><div className="stat-lbl">Earnings</div></div></div>
      </div>
      {pending.length > 0 && (
        <div className="banner">
          <div className="banner-info">
            <div className="banner-icon">📦</div>
            <div className="banner-text">
              <b>{pending.length} order{pending.length > 1 ? "s" : ""} awaiting confirmation</b>
              <span>Buyers are waiting — confirm or reject their orders</span>
            </div>
          </div>
          <button className="btn btn-orange btn-sm" onClick={() => setPage("orders")}>View Orders →</button>
        </div>
      )}
      <div className="sec-head">Your active listings</div>
      {active.length === 0
        ? <div className="empty"><div className="e-ico">🍽️</div><h3>No active listings</h3><p>Add tonight's surplus food to start receiving orders.</p></div>
        : <div className="card-grid">{active.map(l => <ListingCard key={l.id} listing={l} orders={orders} sellerView />)}</div>
      }
    </div>
  );
}

// ─── Buyer Home ───────────────────────────────────────────────────────────
function BuyerHome({ user, listings, orders, updateOrders, updateListings, users, toast, setPage }) {
  const available = (listings ?? []).filter(l => !isExpired(l.pickupUntil) && l.status === "active");
  const featured = available.sort((a, b) => (1 - b.salePrice / b.originalPrice) - (1 - a.salePrice / a.originalPrice)).slice(0, 6);
  const myOrders = (orders ?? []).filter(o => o.buyerId === user.id);

  return (
    <div>
      <div className="hero-band">
        <div>
          <h3>Today's Surplus Deals 🔥</h3>
          <p>Fresh food from nearby restaurants — pick up before they close.</p>
        </div>
        <div className="hero-r">
          <button className="btn" style={{ background: "#fff", color: "var(--orange)", fontWeight: 700 }} onClick={() => setPage("browse")}>
            See all deals →
          </button>
        </div>
      </div>
      <div className="stat-row">
        <div className="stat-card"><div className="stat-icon" style={{ background: "var(--orange-light)" }}>🛒</div><div><div className="stat-val">{available.length}</div><div className="stat-lbl">Deals Live Now</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: "var(--green-light)" }}>✅</div><div><div className="stat-val">{myOrders.filter(o => o.status === "confirmed").length}</div><div className="stat-lbl">Orders Confirmed</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: "var(--amber-light)" }}>💸</div><div><div className="stat-val">{fmtCur(myOrders.filter(o => o.status === "confirmed").reduce((s, o) => s + (o.originalTotal - o.total), 0))}</div><div className="stat-lbl">Total Saved</div></div></div>
      </div>
      {featured.length === 0
        ? <div className="empty"><div className="e-ico">🌾</div><h3>No deals right now</h3><p>Check back closer to restaurant closing times.</p></div>
        : (
          <>
            <div className="sec-head">Best deals right now</div>
            <div className="card-grid">
              {featured.map(l => {
                const seller = users?.find(u => u.id === l.sellerId);
                const myOrder = orders?.find(o => o.buyerId === user.id && o.listingId === l.id);
                return (
                  <BuyerListingCard key={l.id} listing={l} seller={seller} myOrder={myOrder}
                    onOrder={(qty) => {
                      const nr = { id: uid(), listingId: l.id, buyerId: user.id, qty, total: qty * l.salePrice, originalTotal: qty * l.originalPrice, status: "pending", createdAt: nowISO() };
                      updateOrders(o => [...(o ?? []), nr]);
                      toast(`Order placed for ${l.name}! 🎉`, "succ");
                    }}
                  />
                );
              })}
            </div>
          </>
        )
      }
    </div>
  );
}

// ─── Browse Deals ─────────────────────────────────────────────────────────
function BrowseDeals({ user, listings, orders, updateOrders, updateListings, users, toast }) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("");
  const [city, setCity] = useState("");

  const available = (listings ?? []).filter(l => !isExpired(l.pickupUntil) && l.status === "active");
  const cats = [...new Set(available.map(l => l.category))];
  const cities = [...new Set(available.map(l => l.city))];

  const filtered = available.filter(l => {
    const q = search.toLowerCase();
    return (!q || l.name.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q) || l.city.toLowerCase().includes(q))
      && (!cat || l.category === cat)
      && (!city || l.city === city);
  });

  return (
    <div>
      <div className="ph"><div><h2>Browse Deals</h2><p>Surplus food from restaurants near you</p></div></div>
      <div className="filter-bar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search food, restaurant, location…" />
        </div>
        <select className="flt" value={cat} onChange={e => setCat(e.target.value)}>
          <option value="">All categories</option>
          {cats.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="flt" value={city} onChange={e => setCity(e.target.value)}>
          <option value="">All cities</option>
          {cities.map(c => <option key={c}>{c}</option>)}
        </select>
        {(search || cat || city) && <button className="btn btn-outline btn-sm" onClick={() => { setSearch(""); setCat(""); setCity(""); }}>Clear</button>}
      </div>
      {filtered.length === 0
        ? <div className="empty"><div className="e-ico">🍽️</div><h3>No deals found</h3><p>Try different filters or check back later.</p></div>
        : (
          <div className="card-grid">
            {filtered.map(l => {
              const seller = users?.find(u => u.id === l.sellerId);
              const myOrder = orders?.find(o => o.buyerId === user.id && o.listingId === l.id);
              return (
                <BuyerListingCard key={l.id} listing={l} seller={seller} myOrder={myOrder}
                  onOrder={(qty) => {
                    const nr = { id: uid(), listingId: l.id, buyerId: user.id, qty, total: qty * l.salePrice, originalTotal: qty * l.originalPrice, status: "pending", createdAt: nowISO() };
                    updateOrders(o => [...(o ?? []), nr]);
                    toast(`Order placed! Pick up at ${l.address} 📍`, "succ");
                  }}
                />
              );
            })}
          </div>
        )
      }
    </div>
  );
}

// ─── My Listings (seller) ─────────────────────────────────────────────────
function MyListings({ user, listings, updateListings, orders, toast }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const mine = (listings ?? []).filter(l => l.sellerId === user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const del = (id) => { updateListings(ls => ls.filter(l => l.id !== id)); toast("Listing removed.", "info"); };

  return (
    <div>
      <div className="ph">
        <div><h2>My Listings</h2><p>Manage your surplus food listings</p></div>
        <button className="btn btn-orange" onClick={() => { setShowAdd(true); setEditItem(null); }}>+ New Listing</button>
      </div>
      {mine.length === 0
        ? <div className="empty"><div className="e-ico">📋</div><h3>No listings yet</h3><p>Add your first surplus listing to start selling.</p></div>
        : <div className="card-grid">{mine.map(l => <ListingCard key={l.id} listing={l} orders={orders} sellerView onEdit={() => setEditItem(l)} onDelete={() => del(l.id)} />)}</div>
      }
      {(showAdd || editItem) && (
        <ListingModal
          user={user} initial={editItem}
          onClose={() => { setShowAdd(false); setEditItem(null); }}
          onSave={(d) => {
            if (editItem) { updateListings(ls => ls.map(l => l.id === editItem.id ? { ...l, ...d } : l)); toast("Listing updated! ✏️", "succ"); }
            else { updateListings(ls => [...(ls ?? []), { id: uid(), sellerId: user.id, createdAt: nowISO(), status: "active", ...d }]); toast("Listing added! 🎉", "succ"); }
            setShowAdd(false); setEditItem(null);
          }}
        />
      )}
    </div>
  );
}

// ─── Listing Modal ─────────────────────────────────────────────────────────
function ListingModal({ user, initial, onClose, onSave }) {
  const def = initial ?? { name: "", qty: "", unit: "portions", originalPrice: "", salePrice: "", description: "", category: "Meals", city: user.city || "", address: "", pickupFrom: "", pickupUntil: "" };
  const [form, setForm] = useState(def);
  const [err, setErr] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const cats = ["Meals", "Rice & Biryani", "Curry & Sides", "Breakfast & Snacks", "Desserts", "Beverages", "Bakery", "Other"];

  const submit = () => {
    if (!form.name || !form.qty || !form.originalPrice || !form.salePrice || !form.pickupFrom || !form.pickupUntil || !form.address) { setErr("Please fill all required fields."); return; }
    if (Number(form.salePrice) >= Number(form.originalPrice)) { setErr("Sale price must be less than the original price."); return; }
    if (isExpired(form.pickupUntil)) { setErr("Pickup end time must be in the future."); return; }
    onSave({ ...form, qty: Number(form.qty), originalPrice: Number(form.originalPrice), salePrice: Number(form.salePrice) });
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head"><h3>{initial ? "Edit Listing" : "Add Surplus Listing"}</h3><button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          {err && <div className="err-msg">⚠ {err}</div>}
          <div className="field"><label>Food Name *</label><input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Chicken Biryani, Masala Dosa" /></div>
          <div className="two-col">
            <div className="field"><label>Quantity *</label><input type="number" min="1" value={form.qty} onChange={e => set("qty", e.target.value)} placeholder="e.g. 10" /></div>
            <div className="field"><label>Unit</label>
              <select value={form.unit} onChange={e => set("unit", e.target.value)}>
                {["portions","pieces","kg","plates","boxes","packets","litres"].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="two-col">
            <div className="field"><label>Original Price (₹) *</label><input type="number" min="1" value={form.originalPrice} onChange={e => set("originalPrice", e.target.value)} placeholder="e.g. 200" /></div>
            <div className="field"><label>Your Sale Price (₹) *</label><input type="number" min="1" value={form.salePrice} onChange={e => set("salePrice", e.target.value)} placeholder="e.g. 70" /></div>
          </div>
          {form.originalPrice && form.salePrice && Number(form.salePrice) < Number(form.originalPrice) && (
            <div style={{ background: "var(--green-light)", color: "var(--green)", borderRadius: "var(--r-sm)", padding: "8px 12px", fontSize: ".8rem", fontWeight: 600, marginBottom: 12 }}>
              ✓ {Math.round((1 - form.salePrice / form.originalPrice) * 100)}% discount — great deal for buyers!
            </div>
          )}
          <div className="field"><label>Category</label>
            <select value={form.category} onChange={e => set("category", e.target.value)}>
              {cats.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="two-col">
            <div className="field"><label>Pickup From *</label><input type="datetime-local" value={form.pickupFrom} onChange={e => set("pickupFrom", e.target.value)} /></div>
            <div className="field"><label>Pickup Until *</label><input type="datetime-local" value={form.pickupUntil} onChange={e => set("pickupUntil", e.target.value)} /></div>
          </div>
          <div className="field"><label>City</label><input value={form.city} onChange={e => set("city", e.target.value)} placeholder="e.g. Kochi" /></div>
          <div className="field"><label>Pickup Address *</label><input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Street / Area" /></div>
          <div className="field"><label>Description</label><textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="What's in the meal, any allergens, packaging details…" /></div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-orange" onClick={submit}>{initial ? "Save Changes" : "Publish Listing"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Seller Orders ─────────────────────────────────────────────────────────
function SellerOrders({ user, listings, orders, updateOrders, users, toast }) {
  const mine = listings?.filter(l => l.sellerId === user.id) ?? [];
  const myOrders = (orders ?? []).filter(o => mine.some(l => l.id === o.listingId)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const getName = id => users?.find(u => u.id === id)?.name || "Unknown";
  const getListingName = id => mine.find(l => l.id === id)?.name || "—";

  const respond = (oid, status) => {
    updateOrders(os => os.map(o => o.id === oid ? { ...o, status, updatedAt: nowISO() } : o));
    toast(status === "confirmed" ? "Order confirmed! 🤝" : "Order rejected.", status === "confirmed" ? "succ" : "info");
  };

  const statusMap = { pending: "chip-amber", confirmed: "chip-green", rejected: "chip-red", collected: "chip-blue" };

  return (
    <div>
      <div className="ph"><div><h2>Orders</h2><p>Confirm or reject buyer orders</p></div></div>
      {myOrders.length === 0
        ? <div className="empty"><div className="e-ico">📦</div><h3>No orders yet</h3><p>Orders will appear here when buyers place them.</p></div>
        : (
          <table className="tbl">
            <thead><tr><th>Food</th><th>Buyer</th><th>Qty</th><th>Amount</th><th>Ordered</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {myOrders.map(o => (
                <tr key={o.id}>
                  <td><b>{getListingName(o.listingId)}</b></td>
                  <td>{getName(o.buyerId)}</td>
                  <td>{o.qty}</td>
                  <td><b style={{ color: "var(--orange)" }}>{fmtCur(o.total)}</b><div style={{ fontSize: ".72rem", color: "var(--ink3)", textDecoration: "line-through" }}>{fmtCur(o.originalTotal)}</div></td>
                  <td style={{ color: "var(--ink3)", fontSize: ".78rem" }}>{fmtFull(o.createdAt)}</td>
                  <td><span className={`chip ${statusMap[o.status] || "chip-gray"}`}>{o.status}</span></td>
                  <td>
                    {o.status === "pending" && (
                      <div className="act-row">
                        <button className="btn btn-green btn-sm" onClick={() => respond(o.id, "confirmed")}>Confirm</button>
                        <button className="btn btn-danger btn-sm" onClick={() => respond(o.id, "rejected")}>Reject</button>
                      </div>
                    )}
                    {o.status === "confirmed" && (
                      <button className="btn btn-outline btn-sm" onClick={() => respond(o.id, "collected")}>Mark collected</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      }
    </div>
  );
}

// ─── My Orders (buyer) ────────────────────────────────────────────────────
function MyOrders({ user, orders, listings, users }) {
  const mine = (orders ?? []).filter(o => o.buyerId === user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const getListing = id => listings?.find(l => l.id === id);
  const getSeller = listingId => { const l = listings?.find(x => x.id === listingId); return l ? users?.find(u => u.id === l.sellerId)?.name : "—"; };
  const saved = mine.filter(o => o.status === "confirmed" || o.status === "collected").reduce((s, o) => s + (o.originalTotal - o.total), 0);
  const statusMap = { pending: "chip-amber", confirmed: "chip-green", rejected: "chip-red", collected: "chip-blue" };

  return (
    <div>
      <div className="ph"><div><h2>My Orders</h2><p>Track your surplus food orders</p></div></div>
      {saved > 0 && (
        <div style={{ background: "var(--green-light)", border: "1px solid #b6dfc4", borderRadius: "var(--r-lg)", padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: "1.3rem" }}>🎉</span>
          <div><b style={{ color: "var(--green)" }}>You've saved {fmtCur(saved)} so far!</b><div style={{ fontSize: ".8rem", color: "var(--green-dark)" }}>By choosing surplus food instead of full-price meals.</div></div>
        </div>
      )}
      {mine.length === 0
        ? <div className="empty"><div className="e-ico">🛒</div><h3>No orders yet</h3><p>Browse available deals and place your first order!</p></div>
        : (
          <table className="tbl">
            <thead><tr><th>Food</th><th>Restaurant</th><th>Qty</th><th>Paid</th><th>Saved</th><th>Pickup</th><th>Status</th></tr></thead>
            <tbody>
              {mine.map(o => {
                const l = getListing(o.listingId);
                return (
                  <tr key={o.id}>
                    <td><b>{l?.name || "Item removed"}</b><div style={{ fontSize: ".73rem", color: "var(--ink3)" }}>{l?.category}</div></td>
                    <td style={{ color: "var(--ink2)" }}>{getSeller(o.listingId)}</td>
                    <td>{o.qty} {l?.unit || ""}</td>
                    <td><b style={{ color: "var(--orange)" }}>{fmtCur(o.total)}</b></td>
                    <td style={{ color: "var(--green)", fontWeight: 600 }}>{fmtCur(o.originalTotal - o.total)}</td>
                    <td style={{ fontSize: ".78rem", color: "var(--ink3)" }}>{l ? `${fmtTime(l.pickupFrom)}–${fmtTime(l.pickupUntil)}` : "—"}<div>{l?.address || ""}</div></td>
                    <td><span className={`chip ${statusMap[o.status] || "chip-gray"}`}>{o.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )
      }
    </div>
  );
}

// ─── Listing Card (seller view) ───────────────────────────────────────────
function ListingCard({ listing: l, orders, sellerView, onEdit, onDelete }) {
  const expired = isExpired(l.pickupUntil);
  const ordCount = (orders ?? []).filter(o => o.listingId === l.id).length;
  const confirmedCount = (orders ?? []).filter(o => o.listingId === l.id && o.status === "confirmed").length;
  const pct = Math.round((confirmedCount / Math.max(l.qty, 1)) * 100);

  return (
    <div className="listing-card">
      <div className={`card-band ${expired ? "" : "green"}`} />
      <div className="card-body-pad">
        <div>
          <div className="card-name">{l.name}</div>
          <div className="card-rest"><IconPin /> {l.city} · <IconBag /> {l.qty} {l.unit}</div>
        </div>
        <div className="price-row">
          <div className="price-now">{fmtCur(l.salePrice)}</div>
          <div className="price-was">{fmtCur(l.originalPrice)}</div>
          <Discount orig={l.originalPrice} sale={l.salePrice} />
        </div>
        <div className="card-meta">
          <div className="meta-item"><IconClock /> Pickup: {fmtTime(l.pickupFrom)} – {fmtTime(l.pickupUntil)}</div>
          <div className="meta-item"><IconPin /> {l.address}</div>
        </div>
        {sellerView && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".75rem", color: "var(--ink3)", marginBottom: 4 }}>
              <span>{confirmedCount}/{l.qty} confirmed</span>
              <span>{ordCount} total orders</span>
            </div>
            <div className="pct-bar"><div className="pct-fill green" style={{ width: `${pct}%` }} /></div>
          </div>
        )}
      </div>
      {expired
        ? <div className="card-foot"><span className="chip chip-gray">Expired</span></div>
        : sellerView
          ? (
            <div className="card-foot">
              <Timer until={l.pickupUntil} />
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn btn-outline btn-sm" onClick={onEdit}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={onDelete}>Remove</button>
              </div>
            </div>
          )
          : <div className="card-foot"><Timer until={l.pickupUntil} /></div>
      }
    </div>
  );
}

// ─── Buyer Listing Card ───────────────────────────────────────────────────
function BuyerListingCard({ listing: l, seller, myOrder, onOrder }) {
  const [showModal, setShowModal] = useState(false);
  const [qty, setQty] = useState(1);
  const expired = isExpired(l.pickupUntil);
  const confirmed = (myOrder?.status === "confirmed") || (myOrder?.status === "collected");

  const statusMap = { pending: ["chip-amber", "Order pending"], confirmed: ["chip-green", "Confirmed!"], rejected: ["chip-red", "Rejected"], collected: ["chip-blue", "Collected"] };

  return (
    <>
      <div className="listing-card">
        <div className="card-band" />
        <div className="card-body-pad">
          <div>
            <div style={{ display: "flex", align: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <div className="card-name">{l.name}</div>
              <span className="chip chip-gray" style={{ flexShrink: 0, marginTop: 2 }}>{l.category}</span>
            </div>
            <div className="card-rest">{seller?.name || "Restaurant"} · <IconPin /> {l.city}</div>
          </div>
          <div className="price-row">
            <div className="price-now">{fmtCur(l.salePrice)}</div>
            <div className="price-was">{fmtCur(l.originalPrice)}</div>
            <Discount orig={l.originalPrice} sale={l.salePrice} />
          </div>
          <div className="card-meta">
            <div className="meta-item"><IconBag /> {l.qty} {l.unit} available</div>
            <div className="meta-item"><IconClock /> Pickup {fmtTime(l.pickupFrom)}–{fmtTime(l.pickupUntil)}</div>
            <div className="meta-item"><IconPin /> {l.address}</div>
          </div>
          {l.description && <div className="card-desc">{l.description}</div>}
        </div>
        <div className="card-foot">
          <Timer until={l.pickupUntil} />
          {expired
            ? <span className="chip chip-gray">Expired</span>
            : myOrder
              ? <span className={`chip ${statusMap[myOrder.status]?.[0] || "chip-gray"}`}>{statusMap[myOrder.status]?.[1] || myOrder.status}</span>
              : <button className="btn btn-orange btn-sm" onClick={() => setShowModal(true)}>Order Now →</button>
          }
        </div>
      </div>
      {showModal && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-head"><h3>Place Order</h3><button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="modal-body">
              <div style={{ background: "var(--surface2)", borderRadius: "var(--r-sm)", padding: "12px 14px", marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: ".95rem" }}>{l.name}</div>
                <div style={{ fontSize: ".8rem", color: "var(--ink3)", marginTop: 2 }}>{seller?.name} · Pickup {fmtTime(l.pickupFrom)}–{fmtTime(l.pickupUntil)}</div>
                <div style={{ fontSize: ".8rem", color: "var(--ink2)", marginTop: 4 }}>📍 {l.address}</div>
              </div>
              <div style={{ fontSize: ".85rem", fontWeight: 600, color: "var(--ink2)", marginBottom: 6 }}>How many {l.unit}?</div>
              <div className="qty-stepper">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <div className="qty-num">{qty}</div>
                <button onClick={() => setQty(q => Math.min(l.qty, q + 1))}>+</button>
                <span style={{ fontSize: ".78rem", color: "var(--ink3)" }}>max {l.qty}</span>
              </div>
              <div className="price-preview">
                <div className="row"><span>Original price</span><span style={{ textDecoration: "line-through" }}>{fmtCur(qty * l.originalPrice)}</span></div>
                <div className="row"><span>Discount ({Math.round((1 - l.salePrice / l.originalPrice) * 100)}%)</span><span style={{ color: "var(--green)" }}>−{fmtCur(qty * (l.originalPrice - l.salePrice))}</span></div>
                <div className="row total"><span>You pay</span><span style={{ color: "var(--orange)" }}>{fmtCur(qty * l.salePrice)}</span></div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-orange" onClick={() => { onOrder(qty); setShowModal(false); }}>Confirm Order →</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}