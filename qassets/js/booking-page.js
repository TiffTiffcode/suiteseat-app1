// ---- Local date helpers (no timezone drift) ----
function parseYMDLocal(ymd){ const [y,m,d]=(ymd||"").split("-").map(Number); return new Date(y,(m||1)-1,d||1,0,0,0,0); }
function toYMDLocal(date){ const y=date.getFullYear(); const m=String(date.getMonth()+1).padStart(2,"0"); const d=String(date.getDate()).padStart(2,"0"); return `${y}-${m}-${d}`; }
function addDaysLocal(date,days){ return new Date(date.getFullYear(),date.getMonth(),date.getDate()+(days||0)); }

const STATE = {
  businessId: null,
  selected: { calendarId:null, categoryId:null, serviceIds:[], dateISO:null, timeHHMM:null, durationMin:0 },
  mode: { multiService:false },
  user: { loggedIn:false, userId:null, role:null },
};

// URL helper (keep ONE copy of this in the file)
window.toUrl = window.toUrl || function toUrl(v){
  if (!v) return "";
  if (Array.isArray(v)) v = v[0];
  if (typeof v === "object") v = v.url || v.path || v.src || v.filename || v.name || "";
  v = String(v);
  return (/^https?:\/\//i.test(v) || v.startsWith("/")) ? v : `/uploads/${v.replace(/^\/+/, "")}`;
};

document.addEventListener("DOMContentLoaded", async () => {
  const slug = location.pathname.replace(/^\/+/, "").split("/")[0];
  if (!slug) { showError("No business slug in URL."); return; }

  try {
    // fetch business by slug
    let resp = await fetch(`/${encodeURIComponent(slug)}.json`, {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
    if (!resp.ok) {
      resp = await fetch(
        `/public/records?dataType=Business&slug=${encodeURIComponent(slug)}`,
        { headers: { Accept: "application/json" }, credentials: "same-origin" }
      );
    }
    if (!resp.ok) throw new Error(`Business fetch ${resp.status}`);

    const data = await resp.json();
    const biz  = Array.isArray(data) ? data[0] : data;
    if (!biz) throw new Error("No business doc returned");

    const v = biz.values || {};
    window.businessData       = { _id: biz._id, ...v };
    window.selectedBusinessId = biz._id;
    STATE.businessId          = biz._id;

    // title + subtitle
    const bizName = v.businessName || v.name || v["Business Name"] || "Business";
    const subline = v.tagline || v.subtitle || "";
    document.title = bizName;
    const nameEl = document.getElementById("bizName");
    const subEl  = document.getElementById("bizSub");
    if (nameEl) nameEl.textContent = bizName;
    if (subEl)  subEl.textContent  = subline;

    // HERO: image if present, otherwise show the text block
    const heroUrl = toUrl(v.heroImageUrl ?? v.heroImage ?? v["Hero Image"] ?? v.hero_image ?? "");
    const hero    = document.getElementById("hero");
    const heroImg = document.getElementById("heroImg");
    const meta    = hero ? hero.querySelector(".hero__meta") : null;

    function showImageMode(url){
      if (!hero || !heroImg) return;
      hero.classList.add("hero--img", "hero--bleed");
      if (meta) meta.style.display = "none";
      heroImg.style.display = "block";
      heroImg.src = url;
    }
    function showTextMode(){
      if (!hero || !heroImg) return;
      hero.classList.remove("hero--img", "hero--bleed");
      heroImg.removeAttribute("src");
      heroImg.style.display = "none";
      if (meta) meta.style.display = ""; // show name/subtitle
    }

    if (heroUrl) {
      heroImg.onload  = () => showImageMode(heroUrl);
      heroImg.onerror = showTextMode;
      heroImg.src     = heroUrl; // triggers onload/onerror
    } else {
      showTextMode();
    }

 // ---- Calendars load with auto-advance when there is exactly one ----
let calendars = await loadCalendarsForBusiness(biz._id); // your function
if (!Array.isArray(calendars)) calendars = [];

if (calendars.length === 1) {
  // pick the only calendar
  const onlyCal = calendars[0];
  const calId = onlyCal._id || onlyCal.id || onlyCal.calendarId;

  // hide the whole calendar section
  hide(getCalendarSectionEl());

  // set selection
  window.STATE = window.STATE || {};
  window.STATE.selected = window.STATE.selected || {};
  window.STATE.selected.calendarId = calId;

  // load categories for the only calendar
  const categories = await getCategoriesForCalendar(biz._id, calId);

  if (typeof renderCategories === 'function') {
    renderCategories(categories);
    show(document.getElementById('section-cats'));
  } else {
    simpleRenderCategories(categories);
  }

  // (Optional) If there is exactly one category, skip that step too:
  /*
  if (categories.length === 1) {
    const onlyCat = categories[0];
    window.STATE.selected.categoryId = onlyCat._id || onlyCat.id;
    if (typeof onCategorySelected === 'function') {
      await onCategorySelected(window.STATE.selected.categoryId);
    }
    // hide(document.getElementById('section-cats'));
  }
  */

} else {
  // multiple calendars → make sure the calendar section is visible
  show(getCalendarSectionEl());
  // NOTE: loadCalendarsForBusiness already called renderCalendars,
  // so we DON'T call renderCalendars again here.
}


    const avail = document.getElementById("section-availability") ||
                  document.getElementById("availability-section");
    if (avail) avail.scrollIntoView({ behavior: "smooth", block: "start" });

  } catch (err) {
    console.error("Business fetch error:", err);
    showError("Business not found. Check your URL slug (e.g., /thebusinessname).");
    const h = document.getElementById("bizName") || document.getElementById("business-title");
    if (h) h.textContent = "Business not found";
  }
});







// ---- helpers ----
function toUrl(val) {
  if (!val) return "";
  if (Array.isArray(val)) val = val[0];
  if (typeof val === "object") val = val.url || val.path || val.src || val.filename || val.name || "";
  if (!val) return "";
  if (/^https?:\/\//i.test(val) || val.startsWith("/")) return val;
  return `/uploads/${String(val).replace(/^\/+/, "")}`;
}
function showError(msg) {
  const el = document.getElementById("page-error");
  if (el) { el.textContent = msg; el.style.display = "block"; } else { alert(msg); }
}



// ------- CONFIG / STATE -------
const API = {
  list: (dataType, filters = {}) => {
    const params = new URLSearchParams({ dataType });
    for (const [k, v] of Object.entries(filters)) {
    params.append(k, v);

    }
    return fetch(`/public/records?${params.toString()}`, {
      headers: { Accept: "application/json" },
    }).then((r) => r.json());
  },

// in your CONFIG / STATE API object
create: (dataType, values) => {
  return fetch(`/api/records/${encodeURIComponent(dataType)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    credentials: "include",
    body: JSON.stringify({ values })
  }).then(async (r) => {
    if (!r.ok) {
      const body = await r.text();
      console.error(`[API.create] ${dataType} → ${r.status}`, body); // ⬅️ keep this
      throw new Error(`${r.status} ${body}`);
    }
    return r.json();
  });
},


  login: (email, password) => {
    return fetch(`/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password }),
    }).then(async (r) => {
      if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
      return r.json();
    });
  },
};

// Use /public/records with plain query keys (no filters[...])
async function publicList(dataType, filters = {}) {
  const params = new URLSearchParams({ dataType });
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== "") params.append(k, v);
  }
  const r = await fetch(`/public/records?${params.toString()}`, {
    headers: { Accept: "application/json" },
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!r.ok) {
    console.warn(`[publicList] ${dataType} HTTP ${r.status}`);
    return [];
  }
  const rows = await r.json();
  return Array.isArray(rows) ? rows : [];
}

// pull an id out of either a string or a { _id } ref
function refId(x) { return (x && typeof x === "object" && x._id) ? x._id : x; }

// tolerant value getter: tries a bunch of possible label spellings (incl. trailing space)
function pick(v, keys) {
  for (const k of keys) {
    if (v[k] !== undefined) return v[k];
    // also try trimmed version (handles accidental trailing spaces in labels)
    const t = Object.keys(v).find(kk => kk.trim() === k);
    if (t && v[t] !== undefined) return v[t];
  }
  return undefined;
}

// find YYYY-MM-DD in values regardless of label; normalize to YYYY-MM-DD
// Normalize any "date-ish" value to "YYYY-MM-DD"
function toISODateOnly(x) {
  if (!x) return "";
  if (x instanceof Date) {
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, "0");
    const d = String(x.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(x).trim();

  // Already YYYY-MM-DD (optionally followed by time)
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];

  // ISO with T
  if (s.includes("T")) return s.split("T")[0];

  // Last resort: try Date parsing (handles things like "8/20/2025")
  const dt = new Date(s);
  return isNaN(dt) ? "" : toISODateOnly(dt);
}

// Pull a YYYY-MM-DD date out of various shapes stored in the DB
function pickISODate(v) {
  // Try common labels first
  const cand =
    v?.Date ??
    v?.date ??
    v?.dateISO ??
    v?.["Date "] ?? // (sometimes people add a space)
    v?.startISO;     // e.g., "2025-08-20T09:00:00Z"

  return toISODateOnly(cand);
}


// Try public query in a few ways, then fallback to _compat, then fetch-all and filter client-side
// Simple public query — your /public/records already normalizes labels
// REPLACE with this robust version
async function getUpcomingHoursRows(businessId, calendarId) {
  // Try exact filter first (fast path)
  let rows = await publicList("Upcoming Hours", {
    Business: businessId,
    Calendar: calendarId,
    "is Available": true
  });
  if (Array.isArray(rows) && rows.length) return rows;

  // Fallback: fetch all and filter client-side (handles refs stored as objects)
  rows = await publicList("Upcoming Hours");
  return (rows || []).filter(r => {
    const v = r.values || r;
    const bizRef = refId(v.Business ?? v.business ?? v.businessId ?? v["Business Id"]);
    const calRef = refId(v.Calendar ?? v.calendar ?? v.calendarId ?? v["Calendar Id"]);
    const avail  = v["is Available"] ?? v.available ?? v.Available;
    return String(bizRef) === String(businessId) &&
           String(calRef) === String(calendarId) &&
           (avail === true || String(avail) === "true" || avail === 1);
  });
}



// ------- UTIL -------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function fmtMoney(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return "";
  return `$${num.toFixed(2)}`;
}
function minutesBetween(hhmmStart, hhmmEnd) {
  const [h1, m1] = hhmmStart.split(":").map(Number);
  const [h2, m2] = hhmmEnd.split(":").map(Number);
  return h2 * 60 + m2 - (h1 * 60 + m1);
}
function addMinutesHHMM(hhmm, mins) {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + mins;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
function timeLT(a, b) {
  const [ah, am] = a.split(":").map(Number);
  const [bh, bm] = b.split(":").map(Number);
  return ah < bh || (ah === bh && am < bm);
}
function timeLTE(a, b) {
  const [ah, am] = a.split(":").map(Number);
  const [bh, bm] = b.split(":").map(Number);
  return ah < bh || (ah === bh && am <= bm);
}
function overlap(startA, endA, startB, endB) {
  return timeLT(startA, endB) && timeLT(startB, endA);
}
function slugFromPath() {
  const p = location.pathname.replace(/^\/+/, "").split("/")[0];
  return decodeURIComponent(p || "");
}
function show(el) {
  if (typeof el === "string") el = $(el);
  el.style.display = "block";
}
function hide(el) {
  if (typeof el === "string") el = $(el);
  el.style.display = "none";
}
function formatDatePretty(yyyy_mm_dd) {
  const [y, m, d] = yyyy_mm_dd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);  // ⬅️ local, not UTC
  return dt.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function scrollToTimeslots() {
  const el = document.getElementById('timeslots');
  if (!el) return;

  // If it's already on-screen, do nothing
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const visible = r.top >= 0 && r.top < vh * 0.6;
  if (visible) return;

  // Let layout update, then smooth scroll
  requestAnimationFrame(() => {
    el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
  });
}


// ------- INIT -------
let CURRENT_SERVICES = [];

// ------- RENDERERS -------
//New 
// ---- CALENDAR HELPERS ----
// ---- CALENDAR HELPERS (replace your versions with these) ----
async function loadCalendarsForBusiness(businessId) {
  // Try values.Business first, then values.businessId
  let calendars = await fetchCalendars("Business", businessId);
  if (!calendars.length) {
    calendars = await fetchCalendars("businessId", businessId);
  }
  console.log("📅 calendars loaded:", calendars.length);
  renderCalendars(calendars);
  return calendars;
}

async function fetchCalendars(key, val) {
  const url = `/public/records?dataType=Calendar&${encodeURIComponent(key)}=${encodeURIComponent(val)}`;
  console.log("➡️ calendar fetch:", url);
  const r = await fetch(url, { headers: { Accept: "application/json" }, credentials: "same-origin" });
  if (!r.ok) {
    console.warn("calendar fetch failed:", r.status, await r.text());
    return [];
  }
  const rows = await r.json();
  // flatten values for renderCalendars
  return Array.isArray(rows) ? rows.map(doc => ({ _id: doc._id, ...(doc.values || {}) })) : [];
}


function renderCalendars(calendars) {
  const wrap = document.getElementById("calendars");
  if (!wrap) return;
  wrap.innerHTML = "";

  if (!Array.isArray(calendars) || calendars.length === 0) {
    wrap.innerHTML = `<div class="muted" style="grid-column:1/-1;">No calendars found.</div>`;
    return;
  }

  calendars.forEach(cal => {
    const name =
      cal.name || cal.calendarName || cal["Calendar Name"] || "Calendar";
    const el = document.createElement("button");
    el.className = "card card--select";
    el.style.textAlign = "left";
    el.innerHTML = `
      <div class="card__title">${escapeHtml(name)}</div>
      <div class="card__sub muted">${cal.description ? escapeHtml(cal.description) : ""}</div>
    `;
    el.addEventListener("click", () => onSelectCalendar(cal));
    wrap.appendChild(el);
  });
}

///Back Button 
// --- Section helpers (you already have show/hide) ---
function getCalendarSectionEl() {
  return document.getElementById('calendars')?.closest('.section') || null;
}

// Inject a back button at the start of a section title
function injectBackBtn(sectionSelector, backTarget, label = "Back") {
  const sec = document.querySelector(sectionSelector);
  if (!sec) return;
  const h = sec.querySelector('.section__title');
  if (!h || h.querySelector('.back-btn')) return; // already added
  h.insertAdjacentHTML(
    'afterbegin',
    `<button type="button" class="back-btn" data-back="${backTarget}">← ${label}</button>`
  );
}

// Add buttons to each step
injectBackBtn('#section-cats', 'calendars');      // From Categories -> Calendars
injectBackBtn('#section-services', 'categories'); // From Services -> Categories
injectBackBtn('#section-availability', 'services'); // Availability -> Services
injectBackBtn('#section-confirm', 'availability');  // Confirm -> Availability

// --- Back navigation handlers ---
function backToCalendars() {
  // reset downstream
  STATE.selected.calendarId = null;
  STATE.selected.categoryId = null;
  STATE.selected.serviceIds = [];
  show(getCalendarSectionEl());
  hide('#section-cats');
  hide('#section-services');
  hide('#section-availability');
  hide('#section-confirm');
}

function backToCategories() {
  STATE.selected.categoryId = null;
  STATE.selected.serviceIds = [];
  show('#section-cats');
  hide('#section-services');
  hide('#section-availability');
  hide('#section-confirm');
}

function backToServices() {
  STATE.selected.dateISO = null;
  STATE.selected.timeHHMM = null;
  show('#section-services');
  hide('#section-availability');
  hide('#section-confirm');
}

function backToAvailability() {
  show('#section-availability');
  hide('#section-confirm');
}

// One delegated click listener for all back buttons
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.back-btn');
  if (!btn) return;

  switch (btn.dataset.back) {
    case 'calendars':     backToCalendars();   break;
    case 'categories':    backToCategories();  break;
    case 'services':      backToServices();    break;
    case 'availability':  backToAvailability();break;
  }
});


////////////////// ---- CATEGORIES: ////////////////////////////////////////////////
// fetch using many possible field names, with fallbacks ----
async function loadCategoriesForCalendar(businessId, calendarId) {
  // Most specific first
  let rows = await fetchCombo("Category", { Business: businessId, Calendar: calendarId });
  if (!rows.length) rows = await fetchCombo("Category", { Calendar: calendarId });
  if (!rows.length) rows = await fetchCombo("Category", { Business: businessId });
  if (!rows.length) rows = await fetchAll("Category");

  // Strict client-side filter to avoid bleed-through
  rows = rows.filter(doc => {
    const v = doc.values || {};
    const calRef = refId(v.calendarId ?? v.Calendar ?? v.calendar ?? v.calendarRef ?? v.CalendarId);
    const bizRef = refId(v.businessId ?? v.Business ?? v.business ?? v.businessRef ?? v.BusinessId ?? v["Business Id"]);
    return (!calendarId || String(calRef) === String(calendarId)) &&
           (!businessId || String(bizRef) === String(businessId));
  });

  // Flatten for renderer
  return rows.map(d => ({ _id: d._id, ...(d.values || {}) }));
}

//Show Categories if Pro only has 1 Calendar 
// --- Helpers to locate sections ---
// --- Section helpers (keep these) ---
function getCalendarSectionEl() {
  return document.getElementById('calendars')?.closest('.section') || null;
}
function show(el) {
  if (typeof el === "string") el = document.querySelector(el);
  if (!el) return;               // <-- guard
  el.style.display = "";          // empty = use stylesheet default
}

function hide(el) {
  if (typeof el === "string") el = document.querySelector(el);
  if (!el) return;               // <-- guard
  el.style.display = "none";
}

// ✅ Unified category fetcher (no name conflict)
// Use this everywhere to get categories for a given business + calendar.
async function getCategoriesForCalendar(businessId, calendarId) {
  // Prefer stable public endpoint first
  const params = new URLSearchParams({ dataType: 'Category' });
  if (businessId) params.append('businessId', businessId);
  if (calendarId) params.append('calendarId', calendarId);

  let rows = [];
  try {
    const r = await fetch(`/public/records?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin'
    });
    rows = await r.json();
  } catch {}

  if (!Array.isArray(rows) || !rows.length) {
    // Optional: try your app loader if it exists (and won’t throw)
    if (typeof loadCategoriesForCalendar === 'function') {
      try { rows = await loadCategoriesForCalendar(businessId, calendarId); } catch {}
    } else if (typeof loadCategories === 'function') {
      try { rows = await loadCategories(calendarId); } catch {}
    }
  }

  return Array.isArray(rows) ? rows : [];
}


// Minimal renderer (only used if you don’t already have one)
function simpleRenderCategories(categories) {
  const wrap = document.getElementById('categories');
  if (!wrap) return;
  wrap.innerHTML = '';

  // helpful debug
  window.__cats = categories;

  categories.forEach(cat => {
    // support both flattened ({...values}) and nested ({values:{...}})
    const v = cat.values || cat;

    const label = pickKey(v, [
      "categoryName","Category Name","name","Name","title","Title","label","Label"
    ]) || "Category";

    const desc  = pickKey(v, ["description","Description","details","Details","subTitle","Subtitle"]);

    const id = cat._id || cat.id || v._id;

    const div = document.createElement('div');
    div.className = 'card';
    div.dataset.id = id;
    div.innerHTML = `
      <div class="card__title">${escapeHtml(String(label))}</div>
      ${desc ? `<div class="card__desc">${escapeHtml(String(desc))}</div>` : ''}
    `;
    div.addEventListener('click', () => {
      window.STATE = window.STATE || {};
      window.STATE.selected = window.STATE.selected || {};
      window.STATE.selected.categoryId = id;

      // proceed to services (adjust to your app’s flow)
      if (typeof onCategorySelected === 'function') {
        onCategorySelected(id);
      }
      show('#section-services');   // guarded show()
    });
    wrap.appendChild(div);
  });

  show('#section-cats');           // guarded show()
}



///////////////////// ---- SERVICES: ///////////////////////////////////
// fetch using many possible field names, with fallbacks ----

// generic helper: try multiple key=value queries against /public/records
async function fetchByKeys(dataType, pairs) {
  for (const [key, val] of pairs) {
    const url = `/public/records?dataType=${encodeURIComponent(dataType)}&${encodeURIComponent(key)}=${encodeURIComponent(val)}`;
    console.log("➡️", dataType, "fetch:", url);
    try {
      const r = await fetch(url, { headers: { Accept: "application/json" }, credentials: "same-origin" });
      if (!r.ok) continue;
      const rows = await r.json();
      if (Array.isArray(rows) && rows.length) {
        return rows.map(doc => ({ _id: doc._id, ...(doc.values || {}) }));
      }
    } catch {}
  }
  return [];
}
function onSelectCalendar(cal) {
  // remember the selected calendar
  STATE.selected.calendarId = cal._id || cal.id;

  // 🔑 hide the whole calendars section
  hide(getCalendarSectionEl());

  // reset downstream state/UI
  STATE.selected.categoryId = null;
  STATE.selected.serviceIds = [];
  CURRENT_SERVICES = [];
  $("#categories").innerHTML = "";
  $("#services").innerHTML = "";
  hide("#section-services");
  hide("#section-availability");
  hide("#section-confirm");

  // load categories strictly for this business + calendar
  const bizId = STATE.businessId || window.selectedBusinessId;
  loadCategoriesForCalendar(bizId, STATE.selected.calendarId)
    .then(cats => {
      renderCategories(cats);
      show("#section-cats");
    });
}

function pickKey(obj, keys) {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
    // also try a trimmed match for labels with stray spaces
    const t = Object.keys(obj).find(kk => kk.trim() === k);
    if (t && obj[t] !== undefined && obj[t] !== null && obj[t] !== "") return obj[t];
  }
  return undefined;
}

function escapeHtml(s=""){
  return String(s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}




async function onSelectCategory(categoryId) {
  STATE.selected.categoryId = categoryId;

  const bizId = STATE.businessId || window.selectedBusinessId;
  const calId = STATE.selected.calendarId;

  // robust fetch (tries many key names + fallback)
  const services = await loadServicesForCategory(bizId, calId, categoryId);

  CURRENT_SERVICES = services;        // store flattened objects
  renderServices(CURRENT_SERVICES);   // draw them

   // ⬇️ hide categories, show services
  hide('#section-cats');
  show('#section-services');
  hide('#section-availability');
  hide('#section-confirm');

  // optional: scroll to services
  document.getElementById('section-services')?.scrollIntoView({ behavior:'smooth' });
}

function renderCategories(categories) {
  const box = document.getElementById("categories");
  if (!box) return;
  box.innerHTML = "";

  if (!Array.isArray(categories) || !categories.length) {
    box.innerHTML = `<div class="muted" style="grid-column:1/-1;">No categories found.</div>`;
    return;
  }

  // handy to inspect the actual shape in DevTools
  window.__cats = categories;

  categories.forEach(cat => {
    // support both shapes: { _id, values:{...} } OR already flattened
    const v  = cat.values || cat;
    const id = cat._id || cat.id || v._id;

    // robust label picking (covers "Category Name", "name", etc., incl. stray spaces)
    const name = pickKey(v, [
      "categoryName","Category Name","name","Name","title","Title","label","Label","Category"
    ]) || "Category";

    const desc = pickKey(v, [
      "description","Description","details","Details","subTitle","Subtitle"
    ]);

    const el = document.createElement("button");
    el.className = "card card--select";
    el.style.textAlign = "left";
    el.innerHTML = `
      <div class="card__title">${escapeHtml(String(name))}</div>
      ${desc ? `<div class="card__sub muted">${escapeHtml(String(desc))}</div>` : ""}
    `;
     // ⬇️ HERE
    el.addEventListener("click", () => {
      hide("#section-cats");           // hide categories section
      onSelectCategory(id);            // proceed
    });

    box.appendChild(el);
  });
  show("#section-cats");  // guarded show()
}

// Load services for a calendar/category using many possible field names.
async function loadServicesForCategory(businessId, calendarId, categoryId) {
  // Most specific first
  let rows = await fetchCombo("Service", { Business: businessId, Calendar: calendarId, Category: categoryId });
  if (!rows.length) rows = await fetchCombo("Service", { Calendar: calendarId, Category: categoryId });
  if (!rows.length) rows = await fetchCombo("Service", { Business: businessId, Category: categoryId });
  if (!rows.length) rows = await fetchCombo("Service", { Business: businessId, Calendar: calendarId });
  if (!rows.length) rows = await fetchAll("Service");

  // Strict filter
  rows = rows.filter(doc => {
    const v = doc.values || {};
    const catRef = refId(v.categoryId ?? v.Category ?? v.category ?? v.categoryRef ?? v.CategoryId);
    const calRef = refId(v.calendarId ?? v.Calendar ?? v.calendar ?? v.calendarRef ?? v.CalendarId);
    const bizRef = refId(v.businessId ?? v.Business ?? v.business ?? v.businessRef ?? v.BusinessId ?? v["Business Id"]);
    const deleted = !!(v.isDeleted ?? v["is Deleted"]);
    return !deleted &&
           String(catRef) === String(categoryId) &&
           (!calendarId || String(calRef) === String(calendarId)) &&
           (!businessId || String(bizRef) === String(businessId));
  });

  // Normalize shape for your renderer
  return rows.map(doc => {
    const v = doc.values || {};
    return {
      _id: doc._id,
      values: v, // keep original too (in case other code expects it)
      serviceName: v.serviceName || v["Service Name"] || v.title || v.Title || v.name || v.Name || "Service",
      duration:    Number(String(v.duration ?? v.durationMinutes ?? v["Duration"] ?? v["Minutes"] ?? v.length ?? v["Service Duration"]).replace(/[^\d.]/g,"")) || 0,
      price:       Number(String(v.price ?? v.Price ?? v["Service Price"] ?? v.amount ?? v.cost ?? v.rate).replace(/[^\d.]/g,"")) || 0,
      imageUrl:    v.imageUrl || v["Image URL"] || v.image || v.Image || v.heroImage || v.photo || v.picture || "",
      businessId:  refId(v.businessId ?? v.Business ?? v.business ?? v.businessRef ?? v.BusinessId ?? v["Business Id"]),
      calendarId:  refId(v.calendarId ?? v.Calendar ?? v.calendar ?? v.calendarRef ?? v.CalendarId),
      categoryId:  refId(v.categoryId ?? v.Category ?? v.category ?? v.categoryRef ?? v.CategoryId),
    };
  });
}

// Returns a flat array like: {_id, serviceName, duration, price, businessId, calendarId, imageUrl, isDeleted}

function refId(x) {
  return (x && typeof x === "object" && x._id) ? x._id : x;
}

async function fetchCombo(dataType, kv) {
  const qs = new URLSearchParams({ dataType });
  for (const [k, v] of Object.entries(kv)) {
    if (v != null && v !== "") qs.append(k, v);
  }
  const r = await fetch(`/public/records?${qs.toString()}`, {
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  if (!r.ok) return [];
  const rows = await r.json();
  return Array.isArray(rows) ? rows : [];
}

async function fetchAll(dataType) {
  const r = await fetch(`/public/records?dataType=${encodeURIComponent(dataType)}`, {
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  if (!r.ok) return [];
  const rows = await r.json();
  return Array.isArray(rows) ? rows : [];
}


function renderServices(services) {
  const wrap = $("#services");
  wrap.innerHTML = "";
  const multi = $("#toggle-multi")?.checked;

  services.forEach((svc) => {
    const v = svc.values || svc;                 // support both shapes
    const id   = svc._id;
    const name = svc.serviceName || v["Service Name"] || v.name || v.Name || "Service";

    // duration + price through helpers (below)
    const dur   = svcDuration(svc);
    const price = svcPrice(svc);

    const img   = toUrl(
      svc.imageUrl || v["Image URL"] || v.image || v.Image || v.heroImage || ""
    );

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="service">
        ${img ? `<img class="service__img" src="${img}" alt="">` : ""}
        <div class="service__meta">
          <div class="service__name">${escapeHtml(name)}</div>
          <div class="service__sub">${dur} min${
            Number.isFinite(price) && price > 0 ? ` • ${fmtMoney(price)}` : ""
          }</div>
        </div>
        ${
          multi
            ? `<input type="checkbox" class="svc-check" data-id="${id}" style="margin-left:auto;margin-top:6px;">`
            : `<button class="btn btn--pill svc-pick" data-id="${id}" style="margin-left:auto;">Select</button>`
        }
      </div>
    `;
    wrap.appendChild(card);
  });
//Add Pro Name 
// ---- Pro name helpers (drop-in) ----
function getProNameForUI() {
  const cal = (window.selectedCalendar || {});
  const biz = (window.businessData || {});

  const fromCal =
    cal.proName || cal["Pro Name"] ||
    cal.staffName || cal["Staff Name"] ||
    cal.calendarName || cal["Calendar Name"] ||
    cal.name || cal.Name;

  const fromBiz =
    biz.proName || biz["Pro Name"] ||
    biz.ownerName || biz["Owner Name"] ||
    biz.businessName || biz["Business Name"] ||
    biz.name || biz.Name;

  return String(fromCal || fromBiz || "Your Pro");
}

// Put "Pro:" on top of the confirm summary card
function injectProIntoConfirm() {
  const box = document.getElementById("confirm-summary");
  if (!box) return;

  const pro = getProNameForUI();
  let line = box.querySelector('[data-proline]');
  if (!line) {
    line = document.createElement('div');
    line.setAttribute('data-proline','');
    box.insertBefore(line, box.firstChild);     // at the very top
  }
  line.innerHTML = `<strong>Pro:</strong> ${escapeHtml(pro)}`;
}

// Add "With {Pro}" under the success title + "Pro:" as the first detail row
function injectProIntoSuccess() {
  const pro = getProNameForUI();

  // Under the title
  const panel = document.querySelector('#successModal .modal__panel');
  if (panel) {
    let proline = panel.querySelector('#success-proline');
    if (!proline) {
      proline = document.createElement('div');
      proline.id = 'success-proline';
      proline.className = 'modal__proline';
      const title = panel.querySelector('.modal__title');
      title?.insertAdjacentElement('afterend', proline);
    }
    proline.textContent = `With ${pro}`;
  }

  // As first row inside the details list
  const details = document.getElementById('success-details');
  if (details) {
    let first = details.querySelector('[data-proline]');
    if (!first) {
      first = document.createElement('div');
      first.setAttribute('data-proline','');
      details.insertBefore(first, details.firstChild);
    }
    first.innerHTML = `<strong>Pro:</strong> ${escapeHtml(pro)}`;
  }
}

  // single-select (show availability immediately)
  wrap.onclick = (e) => {
    const btn = e.target.closest(".svc-pick");
    if (!btn) return;
    const id = btn.dataset.id;
    const svc = services.find(s => String(s._id) === String(id));
    if (!svc) return;

    STATE.selected.serviceIds = [id];
    window.selectedService = svc;

    const v = svc.values || svc;
    const calRef = svc.calendarId ?? v.Calendar ?? v.calendar ?? v.calendarRef ?? v.CalendarId;
    const bizRef = svc.businessId ?? v.Business ?? v.business ?? v.businessRef ?? v.BusinessId ?? v["Business Id"];
    if (!STATE.selected.calendarId && calRef) STATE.selected.calendarId = calRef;
    if (!STATE.businessId && bizRef) STATE.businessId = bizRef;

    recomputeDuration();
    if (!STATE.selected.durationMin || STATE.selected.durationMin <= 0) {
      STATE.selected.durationMin = svcDuration(svc) || 30; // sensible default
    }

    updateSummary();
    openAvailability(true);
  };

  // multi-select
  wrap.onchange = (e) => {
    const cb = e.target.closest(".svc-check");
    if (!cb) return;
    const id = cb.dataset.id;
    if (cb.checked) {
      if (!STATE.selected.serviceIds.includes(id)) STATE.selected.serviceIds.push(id);
    } else {
      STATE.selected.serviceIds = STATE.selected.serviceIds.filter((x) => x !== id);
    }
    recomputeDuration();
    updateSummary();
  };
}


function recomputeDuration() {
  const idSet = new Set(STATE.selected.serviceIds);
  let total = 0;
  for (const svc of CURRENT_SERVICES) {
    if (idSet.has(svc._id)) total += svcDuration(svc);
  }
  STATE.selected.durationMin = total;
}

function numeric(val) {
  if (val == null) return NaN;
  const n = Number(String(val).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : NaN;
}
function svcDuration(svc) {
  const v = svc.values || svc;
  return Math.round(
    numeric(svc.duration) ??
    numeric(v.duration) ??
    numeric(v.durationMinutes) ??
    numeric(v["Duration"]) ??
    numeric(v["Minutes"]) ??
    numeric(v.length) ??
    numeric(v["Service Duration"]) ??
    0
  ) || 0;
}
function svcPrice(svc) {
  const v = svc.values || svc;
  return numeric(
    svc.price ?? v.price ?? v.Price ?? v["Service Price"] ?? v.cost ?? v.amount ?? v.rate ?? v.fee
  ) || 0;
}


function updateSummary() {
  const has = STATE.selected.serviceIds.length > 0 && STATE.selected.durationMin > 0;
  const chip = $("#summary");
  if (!has) {
    chip.style.display = "none";
    return;
  }
  chip.textContent = `${STATE.selected.serviceIds.length} service(s) • ${STATE.selected.durationMin} min`;
  chip.style.display = "inline-flex";
}



// ===== MONTH CALENDAR (single source of truth) =====
const CAL = { year: null, month: null, available: new Set() };

function initCalState() {
  const now = new Date();
  if (CAL.year == null)  CAL.year  = now.getFullYear();
  if (CAL.month == null) CAL.month = now.getMonth(); // 0..11
}

function toISODate(year, month0, day) {
  return `${year}-${String(month0+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}

function monthLabel(year, month0) {
  return new Date(year, month0, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

async function buildAndRenderMonth() {
  const availableSet = await getAvailableDatesForMonth(CAL.year, CAL.month);
  CAL.available = availableSet;
  renderMonthCalendar(CAL.year, CAL.month, availableSet);
}

async function openAvailability(hideServicesAndScroll = false) {
  if (STATE.selected.durationMin <= 0) return;

  if (hideServicesAndScroll) {
    hide("#section-services");
    show("#section-availability");
    document.getElementById("section-availability")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    show("#section-availability");
  }
  hide("#section-confirm");
  $("#timeslots").innerHTML = "";

  initCalState();
  await buildAndRenderMonth();
}

async function getAvailableDatesForMonth(year, month) {
  const set = new Set();

  const bId = STATE.businessId;
  const cId = STATE.selected.calendarId;
  const dur = STATE.selected.durationMin;
  if (!bId || !cId || !dur) return set;

// Robust fetch that works even if fields are refs or labels differ
const rows = await getUpcomingHoursRows(bId, cId);
console.log("[booking] UH rows:", rows.length, { bId, cId, year, month });
if (rows.length) console.log("[booking] UH sample:", rows[0]);


const monthDates = new Set();
for (const r of rows) {
  const v = r.values || r;
  const iso = pickISODate(v);          // "YYYY-MM-DD"
  if (!iso) continue;
  const d = parseYMDLocal(iso);        // ⬅️ local parse, no UTC shift
  if (d.getFullYear() === year && d.getMonth() === month) {
    monthDates.add(iso);               // keep the original string
  }
}


  // Validate each candidate date by actually computing slots
  for (const iso of monthDates) {
    try {
      const slots = await computeTimeslotsForDate(iso);
      if (Array.isArray(slots) && slots.length) set.add(iso);
    } catch (e) {
      console.warn("slot calc failed for", iso, e);
    }
  }
  return set;
}

function renderMonthCalendar(year, month, availableSet) {
  const wrap = document.getElementById("datePicker");
  if (!wrap) return;
  wrap.innerHTML = "";

  const root = document.createElement("div");
  root.className = "cal";
  wrap.appendChild(root);

  // force centering in case other styles override
root.style.width = "max-content";
root.style.margin = "0 auto";

  // header
  root.innerHTML = `
    <div class="cal-head">
      <div class="cal-nav"><button id="cal-prev" class="cal-btn" aria-label="Prev month">‹</button></div>
      <div class="cal-title">${monthLabel(year, month)}</div>
      <div class="cal-nav"><button id="cal-next" class="cal-btn" aria-label="Next month">›</button></div>
    </div>
    <div class="cal-grid"></div>
  `;

  const grid = root.querySelector(".cal-grid");

  // DOW header
  ["S","M","T","W","T","F","S"].forEach(d => {
    const el = document.createElement("div");
    el.className = "cal-dow";
    el.textContent = d;
    grid.appendChild(el);
  });

  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const leading = first.getDay();
  const daysInMonth = last.getDate();
  const today = new Date();
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // leading blanks
  for (let i = 0; i < leading; i++) grid.appendChild(document.createElement("div"));

  // days
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const iso  = toISODate(year, month, d);
    const isPast  = date < todayMid;
    const isToday = date.getFullYear() === today.getFullYear()
                 && date.getMonth() === today.getMonth()
                 && date.getDate() === today.getDate();
    const isAvail = availableSet.has(iso) && !isPast;

    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "cal-cell";
    if (isAvail) cell.classList.add("cal-cell--available");
    if (isToday) cell.classList.add("cal-cell--today");
    if (isPast)  cell.classList.add("cal-cell--disabled");

    const num = document.createElement("div");
    num.className = "num";
    num.textContent = d;
    cell.appendChild(num);

    if (availableSet.has(iso)) {
      const dot = document.createElement("span");
      dot.className = "cal-dot";
      cell.appendChild(dot);
    }

    if (isAvail) {
      cell.addEventListener("click", () => onSelectDate(iso, cell));
    } else {
      cell.disabled = true;
    }

    grid.appendChild(cell);
  }

  // nav
  document.getElementById("cal-prev").onclick = () => {
    CAL.month--;
    if (CAL.month < 0) { CAL.month = 11; CAL.year--; }
    buildAndRenderMonth();
  };
  document.getElementById("cal-next").onclick = () => {
    CAL.month++;
    if (CAL.month > 11) { CAL.month = 0; CAL.year++; }
    buildAndRenderMonth();
  };
}

// When a date is clicked, fetch times and show them
async function onSelectDate(dateISO, cell) {
  document.querySelectorAll("#datePicker .cal-cell")
    .forEach(c => c.classList.remove("cal-cell--selected"));
  cell.classList.add("cal-cell--selected");

  STATE.selected.dateISO = dateISO;

  const slots = await computeTimeslotsForDate(dateISO);
  renderTimeslots(slots);

  scrollToTimeslots();  // 👈 scroll down to the slots
}

// --- normalize helpers ---
function refId(x) { return (x && typeof x === "object" && x._id) ? x._id : x; }

// Local-safe date-only helpers
function parseYMDLocal(ymd) {
  // ymd: "YYYY-MM-DD"
  const [y, m, d] = String(ymd).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0); // LOCAL midnight
}

function toYMDLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toISODateOnly(input) {
  // If it's already "YYYY-MM-DD", keep it (no UTC parse)
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  // Otherwise assume a Date and render as local Y-M-D
  return toYMDLocal(new Date(input));
}
//Change time to regular time
function to12h(hhmm) {
  if (!hhmm) return "";
  const [H, M] = String(hhmm).split(":");
  let h = parseInt(H, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${M} ${ampm}`;
}

// Pull a YYYY-MM-DD date out of various shapes stored in the DB

function isCanceled(v) {
  const flag = v?.["is Canceled"] ?? v?.isCanceled ?? v?.cancelled ?? v?.canceled;
  return flag === true || flag === "true";
}

// Robust public fetch for Appointments by business/calendar (no date filter here)
// Robust public fetch for Appointments (uses the same API.list helper)
// Pull all appointments for a calendar publicly; filter by date + canceled on the client
// Pull all appointments for a calendar publicly; filter by this day + not cancelled
async function getAppointmentsRows(calendarId, dateISO = null) {
  const rows = await publicList("Appointment", { Calendar: calendarId });

  return (rows || []).filter((r) => {
    const v = r.values || r;

    // Normalize day: accept Date, date, startISO, start
    const raw = (v.Date || v.date || v.startISO || v.start || "").toString();
    const day = raw.includes("T") ? raw.slice(0, 10) : raw;

    // Normalize canceled flag
    const canceled =
      v["is Canceled"] === true ||
      String(v["is Canceled"]).toLowerCase() === "true" ||
      String(v["Appointment Status"] || v.Status || "").toLowerCase() === "cancelled";

    return !canceled && (!dateISO || day === dateISO);
  });
}



// (you already have getUpcomingHoursRows; keep that as-is)

async function computeTimeslotsForDate(dateISO) {
  const bId = STATE.businessId;
  const cId = STATE.selected.calendarId;
  const dur = STATE.selected.durationMin;

  if (!bId || !cId || !dateISO || !dur) return [];

  // Upcoming Hours for this business/calendar/date (PUBLIC)
// pull all UH for this biz+cal, then filter to this day client-side
let uhAll = await getUpcomingHoursRows(bId, cId);
let uh = uhAll.filter(row => pickISODate(row.values || row) === dateISO);

// Existing appointments to avoid overlaps (PUBLIC by calendar; filter to this day)
const appts = await getAppointmentsRows(cId, dateISO);
console.log("[booking] Appts for", dateISO, "=>", appts.length);

const booked = appts
  .map((r) => {
    const v = r.values || r;
    const start =
      v.Time ||
      v["Start Time"] ||
      (v.startISO || v.start || "").slice(11, 16);  // "HH:MM"
    const dmin = Number(v.Duration ?? v.duration ?? 0);
    if (!start || !dmin) return null;
    return { start, end: addMinutesHHMM(start, dmin) };
  })
  .filter(Boolean);


  const slots = [];
  uh.forEach((row) => {
    const v = row.values || row;
    // prefer your admin labels; fall back to Start/End if needed
const enabled   = v.Enabled !== false && v.Enabled !== "false";
const available = v["is Available"] !== false && v["is Available"] !== "false";

const startOpen = v.Start || v["Start Time"];  // prefer Start, fallback if legacy
const endOpen   = v.End   || v["End Time"];    // prefer End, fallback if legacy

if (!startOpen || !endOpen || !enabled || !available) return;


    let cursor = startOpen;
    while (timeLTE(addMinutesHHMM(cursor, dur), endOpen)) {
      const candidateStart = cursor;
      const candidateEnd   = addMinutesHHMM(cursor, dur);
      const clash = booked.some(b => overlap(candidateStart, candidateEnd, b.start, b.end));
      if (!clash) slots.push({ start: candidateStart, end: candidateEnd });
      cursor = addMinutesHHMM(cursor, 15);
    }
  });

  slots.sort((a, b) => (timeLT(a.start, b.start) ? -1 : 1));
  return slots;
}


function bucketFor(hhmm) {
  const [h] = hhmm.split(":").map(Number);
  // tweak ranges if you like
  if (h >= 5 && h < 12)  return "Morning";    // 5:00–11:59
  if (h >= 12 && h < 17) return "Afternoon";  // 12:00–16:59
  return "Night";                              // 17:00–23:59 and 00:00–04:59
}

function renderTimeslots(slots) {
  const wrap = $("#timeslots");
  wrap.innerHTML = "";
  if (!Array.isArray(slots) || !slots.length) {
    wrap.innerHTML = `<div class="muted">No times available for this date.</div>`;
    hide("#section-confirm");
    return;
  }

  // group
  const groups = { Morning: [], Afternoon: [], Night: [] };
  slots.forEach(s => groups[bucketFor(s.start)].push(s));

  // render groups in fixed order
  ["Morning","Afternoon","Night"].forEach(label => {
    const list = groups[label];
    if (!list.length) return;

    const group = document.createElement("div");
    group.className = "times-group";

    const title = document.createElement("div");
    title.className = "times-group__title";
    title.textContent = label;
    group.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "times-grid";
    list.forEach(s => {
      const btn = document.createElement("button");
      btn.className = "timeslot";
      btn.textContent   = to12h(s.start); // 12h label
      btn.dataset.start = s.start;        // keep 24h for logic
      btn.dataset.end   = s.end;
      btn.onclick = () => onSelectTimeslot(s.start);
      grid.appendChild(btn);
    });

    group.appendChild(grid);
    wrap.appendChild(group);
  });

  // (optional) style hook
  wrap.classList.add("is-grouped");
}

function onSelectTimeslot(timeHHMM) {
  STATE.selected.timeHHMM = timeHHMM;
  $$(".timeslot").forEach((b) => b.classList.remove("timeslot--selected"));
  const match = $$(".timeslot").find((b) => b.dataset.start === timeHHMM); // ← changed
  match?.classList.add("timeslot--selected");

  const svcNames = STATE.selected.serviceIds
    .map((id) => {
      const s = CURRENT_SERVICES.find((x) => String(x._id) === String(id));
      const v = s?.values || s || {};
      return v.serviceName || v["Service Name"] || v.name || v.Name;
    })
    .filter(Boolean);

  $("#confirm-summary").innerHTML = `
    <div><strong>Date:</strong> ${formatDatePretty(STATE.selected.dateISO)}</div>
    <div><strong>Time:</strong> ${to12h(STATE.selected.timeHHMM)}</div>   <!-- ← formatted -->
    <div><strong>Services:</strong> ${svcNames.join(", ") || "—"}</div>
    <div><strong>Duration:</strong> ${STATE.selected.durationMin} min</div>
  `;
  show("#section-confirm");
  openConfirm();

}

function openConfirm() {
  const el = document.getElementById('section-confirm');
  if (!el) return;
  el.style.display = 'flex';     // modal layout
  document.body.classList.add('modal-open');
  setTimeout(() => el.querySelector('.modal__panel')?.focus(), 0);
}

function closeConfirm() {
  const el = document.getElementById('section-confirm');
  if (!el) return;
  el.style.display = 'none';
  document.body.classList.remove('modal-open');
}

// close on scrim / X / Esc
(() => {
  const el = document.getElementById('section-confirm');
  if (!el) return;

  el.addEventListener('click', (e) => {
    if (e.target.matches('[data-close], .modal__scrim')) closeConfirm();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && el.style.display !== 'none') closeConfirm();
  });
})();


//If a day became fully booked, remove the dot on the month calendar without a page refresh:
async function refreshDayDot(dateISO) {
  // Recompute availability for the whole month and redraw once
  await buildAndRenderMonth();

  // Keep the clicked date visually selected (optional nicety)
  if (dateISO) {
    const d = new Date(dateISO);
    const dayNum = d.getDate();
    const cells = document.querySelectorAll('#datePicker .cal-cell .num');
    for (const num of cells) {
      if (Number(num.textContent) === dayNum) {
        num.parentElement.classList.add('cal-cell--selected');
        break;
      }
    }
  }
}

// ------- AUTH -------
function openAuth() {
  $("#authModal").classList.add("is-open");
}
function closeAuth() {
  $("#authModal").classList.remove("is-open");
}
async function onLoginClick() {
  try {
    const email = $("#auth-email").value.trim();
    const pass  = $("#auth-pass").value.trim();
    if (!email || !pass) return;

    const res = await API.login(email, pass);

    // mark user as logged in
    STATE.user.loggedIn = true;
    STATE.user.userId   = res.userId || res._id || res.id || null;
    STATE.user.role     = res.role || "client";

    // NEW: continue flow if we came here from "Book Now"
    const shouldContinue = !!STATE.user.continueAfterLogin;
    STATE.user.continueAfterLogin = false;

    closeAuth();

    if (shouldContinue) {
         confirmBookNow(); 
    }
  } catch (e) {
    alert("Login failed. Please check your credentials.");
    console.error(e);
  }
}

// ------- BOOKING -------
async function confirmBookNow() {
  try {
    if (
      !STATE.selected.calendarId ||
      !STATE.selected.serviceIds.length ||
      !STATE.selected.dateISO ||
      !STATE.selected.timeHHMM ||
      !STATE.selected.durationMin
    ) {
      alert("Please choose calendar, service(s), date, and time.");
      return;
    }
if (!STATE.user.loggedIn) {
  STATE.user.continueAfterLogin = true; // remember we came from Book Now
  openAuth();
  return;
}

  const svcNames = STATE.selected.serviceIds
  .map((id) => CURRENT_SERVICES.find((s) => s._id === id)?.values?.["Name"])
  .filter(Boolean);
const appointmentName = svcNames.join(" + ");

// === REPLACE START (build schema-friendly payload and create) ===
const values = {
  Business: STATE.businessId,              // Reference
  Calendar: STATE.selected.calendarId,     // Reference
  Date:     STATE.selected.dateISO,        // "YYYY-MM-DD"
  Time:     STATE.selected.timeHHMM,       // "HH:MM" 24h
  Duration: STATE.selected.durationMin     // Number (minutes) — use the exact label your type uses
};

// Optional fields (safe to include, remove if server complains)
if (STATE.user.userId) {
  // send reference as {_id: "..."} so the server can normalize it
  values.Client = { _id: STATE.user.userId };
}

if (STATE.selected.serviceIds?.length) {
  // if your field is literally "Service(s)" keep that label
  values["Service(s)"] = STATE.selected.serviceIds.map(id => ({ _id: id }));
}

// Nice-to-have metadata (comment these out if you still see a 500 and add back one by one)
values.Name = (
  STATE.selected.serviceIds
    .map(id => CURRENT_SERVICES.find(s => s._id === id))
    .map(s => (s?.values?.["Service Name"] || s?.values?.Name || s?.serviceName || "Service"))
    .filter(Boolean)
    .join(" + ")
) || "Appointment";

values["Appointment Status"] = "booked";
values["is Canceled"] = false;

// Fill Pro Name on the appointment from the Business record (denormalize)
if (!values["Pro Name"]) {
  try {
    const res = await fetch(`/${encodeURIComponent(slugFromPath())}.json`, {
      headers: { Accept: "application/json" }
    });
    if (res.ok) {
      const biz = await res.json();
      const pn =
        biz?.values?.["Pro Name"] ||
        biz?.values?.proName ||
        biz?.values?.stylistName ||
        "";
      if (pn) values["Pro Name"] = pn;
    }
  } catch (_) {
    /* ignore */
  }
}

// Persist to server
await API.create("Appointment", values);
// === REPLACE END ===



    $("#success-details").innerHTML = `
      <div><strong>Confirmed:</strong> ${appointmentName || "Appointment"}</div>
      <div><strong>Date:</strong> ${formatDatePretty(STATE.selected.dateISO)}</div>
      <div><strong>Time:</strong> ${STATE.selected.timeHHMM}</div>
      <div><strong>Duration:</strong> ${STATE.selected.durationMin} min</div>
    `;
    $("#successModal").classList.add("is-open");

// NEW: remove every slot that overlaps the booked block
const bookedStart = STATE.selected.timeHHMM;
const bookedEnd   = addMinutesHHMM(bookedStart, STATE.selected.durationMin);

$$(".timeslot").forEach((b) => {
  const btnStart = b.dataset.start || b.textContent;
  const btnEnd   = b.dataset.end   || addMinutesHHMM(btnStart, STATE.selected.durationMin);
  if (overlap(bookedStart, bookedEnd, btnStart, btnEnd)) {
    b.remove();
  }
});

if (!$("#timeslots").children.length) {
  $("#timeslots").innerHTML = `<div class="muted">No more times for this date.</div>`;
  hide("#section-confirm");
}
// NEW: update the calendar dots/availability for that day
await refreshDayDot(STATE.selected.dateISO);


  } catch (e) {
    alert("That time may have just been taken. Please pick another slot.");
    console.error("Book error", e);
  }
}






// ------- SUCCESS -------
function closeSuccess() {
  $("#successModal").classList.remove("is-open");
}
// Hook up the buttons once the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btn-confirm")?.addEventListener("click", confirmBookNow);
  document.getElementById("btn-login")?.addEventListener("click", onLoginClick);
});

