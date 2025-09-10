// define once, only if not already defined
// --- DEV ONLY: make this tab "admin" so /api/records works ---
(async () => {
  try { await fetch('/dev/admin-on', { method:'POST', credentials:'include' }); } catch {}
})();

// --- Admin API constants (define once) ---
const TYPE_UPCOMING = "Upcoming Hours";
const API_ADMIN = (type) => `/api/records/${encodeURIComponent(type)}`;


document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // LOGIN 
  // =========================
  const loginStatus  = document.getElementById("user-greeting"); // make sure this id is unique in HTML
  const openLoginBtn = document.getElementById("open-login-popup-btn");
  const logoutBtn    = document.getElementById("logout-btn");
  const loginForm    = document.getElementById("login-form");
// Put this near the top of your file (above initLogin)
// ---- Name helper (put above initLogin) ----
function displayNameFrom(d) {
  const first =
    d?.firstName || d?.first_name || d?.user?.firstName || d?.user?.first_name;
  const last =
    d?.lastName  || d?.last_name  || d?.user?.lastName  || d?.user?.last_name;

  if (first && last) return `${first} ${last}`;

  const candidates = [
    d?.name,
    d?.user?.name,
    d?.fullName,
    d?.full_name,
    d?.displayName,
    d?.display_name,
    first,
    d?.email ? d.email.split('@')[0] : ''
  ];

  return candidates.find(Boolean) || '';
}

// ---- Login init (replace your initLogin with this) ----
async function initLogin() {
  try {
    const res  = await fetch("/check-login", { credentials: "include", cache: "no-store" });
    const data = await res.json();
    console.log("check-login →", data);

    if (data.loggedIn) {
   const name = displayNameFrom(data) 
          || (data.email ? data.email.split('@')[0] : '')
          || (data.userId ? `User ${String(data.userId).slice(-4)}` : '');

if (loginStatus) {
  loginStatus.textContent = name ? `Hi, ${name} 👋` : `Hi 👋`;
}

      if (logoutBtn)    logoutBtn.style.display = "inline-block";
      if (openLoginBtn) openLoginBtn.style.display = "none";

      // After login → initialize dropdowns (business first, then calendar)
      await initBusinessDropdown();
      await initCalendarDropdown();
    } else {
      if (loginStatus)  loginStatus.textContent = "Not logged in";
      if (logoutBtn)    logoutBtn.style.display = "none";
      if (openLoginBtn) openLoginBtn.style.display = "inline-block";
    }
  } catch (e) {
    console.error("check-login failed:", e);
  }
}


  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        const res = await fetch("/logout");
        const result = await res.json();
        if (res.ok) {
          alert("👋 Logged out!");
          window.location.href = "index.html";
        } else {
          alert(result.message || "Logout failed.");
        }
      } catch (err) {
        console.error("Logout error:", err);
        alert("Something went wrong during logout.");
      }
    });
  }

  if (openLoginBtn) {
    openLoginBtn.addEventListener("click", () => {
      document.getElementById("popup-login")?.style?.setProperty("display", "block");
      document.getElementById("popup-overlay")?.style?.setProperty("display", "block");
      document.body.classList.add("popup-open");
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value.trim();
      if (!email || !password) return alert("Please enter both email and password.");
      try {
        const res = await fetch("/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const result = await res.json();
        if (res.ok) {
          alert("✅ Logged in!");
          window.closeLoginPopup?.();
          location.reload();
        } else {
          alert(result.message || "Login failed.");
        }
      } catch (err) {
        console.error("Login error:", err);
        alert("Something went wrong.");
      }
    });
  }

  //////////////////////////////////////////////////////////////////////////////
                       //Menu Section

  // =========================
  // BUSINESS DROPDOWN (together)
  // =========================
  const bizSel = document.getElementById('dropdown-category-business');

  async function initBusinessDropdown() {
    await loadBusinessOptions('dropdown-category-business', { placeholder: '-- Select --' });

    if (bizSel && !bizSel.dataset.bound) {
      bizSel.addEventListener('change', async () => {
        sessionStorage.setItem('selectedBusinessId', bizSel.value || '');
        // Refresh calendars whenever business changes
        await initCalendarDropdown();
      });
      bizSel.dataset.bound = '1';
    }
  }

  // =========================
  // CALENDAR DROPDOWN (together)
  // =========================
  const calSel = document.getElementById('dropdown-availability-calendar');

  async function initCalendarDropdown() {
    const bizId =
      bizSel?.value ||
      sessionStorage.getItem('selectedBusinessId') ||
      '';

    await loadCalendarOptions(
      'dropdown-availability-calendar',
      bizId,
      { placeholder: '-- Select --', rememberKey: 'selectedAvailabilityCalendarId' }
    );

    if (calSel && !calSel.dataset.bound) {
      calSel.addEventListener('change', () => {
        sessionStorage.setItem('selectedAvailabilityCalendarId', calSel.value || '');
      });
      calSel.dataset.bound = '1';
    }
  }

  // =========================
  // TABS (together)
  // =========================
  const calendarTabs     = document.querySelectorAll(".calendarOptions");
  const calendarSections = document.querySelectorAll(".content-area > div");

  calendarTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetId = tab.getAttribute("data-target");
      calendarSections.forEach(s => s.style.display = "none");
      calendarTabs.forEach(t => t.classList.remove("active-tab"));
      document.getElementById(targetId)?.style?.setProperty("display", "block");
      tab.classList.add("active-tab");
    });
  });

  // =========================
  // SIDEBAR TOGGLER (optional block)
  // =========================
  const sidebar           = document.getElementById("calendar-sidebar");
  const openBtn           = document.getElementById("open-sidebar-btn");   // ensure exists in HTML if you use it
  const closeBtn          = document.getElementById("close-sidebar-btn");
  const calendarContainer = document.querySelector(".calendar-container");

  if (closeBtn && sidebar && calendarContainer) {
    closeBtn.addEventListener("click", () => {
      sidebar.classList.add("hidden");
      calendarContainer.classList.add("full-width");
      if (openBtn)  openBtn.style.display = "block";
      closeBtn.style.display = "none";
    });
  }
  if (openBtn && sidebar && calendarContainer) {
    openBtn.addEventListener("click", () => {
      sidebar.classList.remove("hidden");
      calendarContainer.classList.remove("full-width");
      openBtn.style.display = "none";
      if (closeBtn) closeBtn.style.display = "block";
    });
  }

  // Kick things off
  initLogin();

  //
//Show times on calendar for Upcoming Hours 
document.getElementById("dropdown-availability-calendar")?.addEventListener("change", () => {
  loadAndGenerateCalendar();
});

document.getElementById("dropdown-category-business")?.addEventListener("change", () => {
  loadAndGenerateCalendar();
});


//Reusable Show Times in dropdowns 

////Show times in dropdowns 
function generateTimeOptions() {
  const timeSelects = document.querySelectorAll(".time-select");
  const times = [];

  // Generate times in 15-minute intervals
  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += 15) {
      const hour12 = hour % 12 === 0 ? 12 : hour % 12;
      const ampm = hour  <12 ? "AM" : "PM";
    const formattedTime = `${hour12}:${min.toString().padStart(2, "0")} ${ampm}`;
 times.push(formattedTime);
    }
  }

  // Populate each dropdown
  timeSelects.forEach(select => {
    select.innerHTML = ""; // Clear existing options
    times.forEach(time => {
      const option = document.createElement("option");
      option.value = time;
      option.textContent = time;
      select.appendChild(option);
    });
  });
}
generateTimeOptions();

/////////////////////////////////////////////////////////////
            //Upcoming Hours    
 document.getElementById("popup-close")?.addEventListener("click", () => {
  document.getElementById("availability-popup").style.display = "none";
});

//Upcoming Hours Calendar 
// Get references to DOM elements



        /**
         * Generates and displays the calendar for a given year and month.
         * @param {number} year - The year to display.
         * @param {number} month - The month to display (0-indexed: 0 for January, 11 for December).
         */


// ===== Month calendar =====

// 12-hour formatter; accepts "HH:mm" or already "h:mm AM/PM"
// --- helpers you can keep near your other helpers ---
// ───── ONE-TIME GLOBALS (define once) ───────────────────────────
window.API ??= (type) => `/api/records/${encodeURIComponent(type)}`;
window.TYPE_UPCOMING ??= 'Upcoming Hours';

// helpers
function pad(n){ return String(n).padStart(2,'0'); }
function toYMD(d){
  const x = new Date(d); x.setHours(0,0,0,0);
  return `${x.getFullYear()}-${pad(x.getMonth()+1)}-${pad(x.getDate())}`;
}
function formatTime(t){
  if (!t) return '';
  if (/\b(AM|PM)\b/i.test(t)) return t;        // already 12-hour
  const [hStr, mStr='0'] = String(t).split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = ((h + 11) % 12) + 1;                     // 0/12 -> 12
  return `${h}:${String(m).padStart(2,'0')} ${ampm}`;
}

// tolerant mapper: pulls Date/Start/End regardless of exact label casing
function rowsToSavedHoursMap(rows){
  const map = {};
  (rows || []).forEach(r => {
    const v = r.values || {};
    const date  = v['Date'] || v.date || v['date'];
    if (!date) return;
    const ymd   = String(date).split('T')[0];
    const start = v['Start Time'] || v['Start'] || v.start || v['start'] || '';
    const end   = v['End Time']   || v['End']   || v.end   || v['end']   || '';
    if (ymd && (start || end)) map[ymd] = { start, end };
  });
  return map;
}

// ───── MONTH CALENDAR (keep your element refs) ──────────────────
const monthYearDisplay = document.getElementById('monthYear');
const calendarDaysGrid = document.getElementById('calendarDays');
const prevMonthBtn     = document.getElementById('prevMonth');
const nextMonthBtn     = document.getElementById('nextMonth');

let currentDate  = new Date();
let currentMonth = currentDate.getMonth();
let currentYear  = currentDate.getFullYear();
const today      = new Date();

async function loadAndGenerateCalendar(){
  const businessId = document.getElementById('dropdown-category-business')?.value || '';
  const calendarId = document.getElementById('dropdown-availability-calendar')?.value || '';
  let savedHoursMap = {};

  // visible month range
  const start = new Date(currentYear, currentMonth, 1);
  const end   = new Date(currentYear, currentMonth + 1, 0);

  // build WHERE; leave out filters if dropdowns are empty
  const where = { Date: { $gte: toYMD(start), $lte: toYMD(end) } };
  if (businessId) where['Business'] = businessId;
  if (calendarId) where['Calendar'] = calendarId;

  const url = `${API(TYPE_UPCOMING)}?where=${encodeURIComponent(JSON.stringify(where))}&limit=500&ts=${Date.now()}`;
  console.log('[Upcoming] GET', url);

  try{
    const res  = await fetch(url, { credentials: 'include', cache: 'no-store' });
    const rows = await res.json().catch(() => []);
    console.log('[Upcoming] status', res.status, 'rows', Array.isArray(rows)? rows.length : rows);

    if (res.ok && Array.isArray(rows)) {
      savedHoursMap = rowsToSavedHoursMap(rows);
      console.log('[Upcoming] keys', Object.keys(savedHoursMap));
    }
  } catch (e) {
    console.error('Failed to load upcoming hours:', e);
  }

  generateCalendar(currentYear, currentMonth, savedHoursMap);
}
window.loadAndGenerateCalendar = loadAndGenerateCalendar;

function generateCalendar(year, month, savedHoursMap = {}){
  calendarDaysGrid.innerHTML = '';
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  monthYearDisplay.textContent = `${monthNames[month]} ${year}`;

  const first = new Date(year, month, 1);
  const lead  = first.getDay();
  const days  = new Date(year, month + 1, 0).getDate();

  for (let i=0;i<lead;i++){
    const d = document.createElement('div');
    d.className = 'day-cell empty';
    calendarDaysGrid.appendChild(d);
  }

  for (let day=1; day<=days; day++){
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    cell.textContent = day;

    const iso = `${year}-${pad(month+1)}-${pad(day)}`;
    const avail = savedHoursMap[iso];
    if (avail && (avail.start || avail.end)){
      const timeDiv = document.createElement('div');
      timeDiv.className = 'availability-time';
      timeDiv.textContent = `${formatTime(avail.start)} – ${formatTime(avail.end)}`;
      cell.classList.add('has-availability');
      cell.appendChild(timeDiv);
    }

    if (day===today.getDate() && month===today.getMonth() && year===today.getFullYear()){
      cell.classList.add('current-day');
    }

    cell.addEventListener('click', () => openAvailabilityPopup(year, month, day));
    calendarDaysGrid.appendChild(cell);
  }
}

// nav buttons
prevMonthBtn?.addEventListener('click', () => {
  currentMonth--; if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  loadAndGenerateCalendar();
});
nextMonthBtn?.addEventListener('click', () => {
  currentMonth++; if (currentMonth > 11) { currentMonth = 0;  currentYear++; }
  loadAndGenerateCalendar();
});

// initial render
loadAndGenerateCalendar();



// ===== Weekly bridge (optional) =====
function getStartOfWeek(d) {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  return x;
}
function formatDateRange(start, end) {
  const opts = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}, ${end.getFullYear()}`;
}
let currentWeekStart = getStartOfWeek(new Date());
function updateWeekDisplay() {
  const weekLabelEl = document.querySelector('.week-label');
  if (weekLabelEl) {
    const start = new Date(currentWeekStart);
    const end   = new Date(start); end.setDate(end.getDate() + 6);
    weekLabelEl.textContent = formatDateRange(start, end);
  }
  window.loadAndGenerateCalendar?.();
}
window.updateWeekDisplay = updateWeekDisplay;

document.getElementById("prev-week")?.addEventListener("click", () => {
  currentWeekStart.setDate(currentWeekStart.getDate() - 7);
  updateWeekDisplay();
});
document.getElementById("next-week")?.addEventListener("click", () => {
  currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  updateWeekDisplay();
});

// time-selects (if you still use them)
if (typeof initializeAllTimeSelects === 'function') initializeAllTimeSelects();



//
// ──────────────────────────────────────────────
// Weekly Upcoming Hours (only if you still use it)
// Requires markup like:
//  <input type="checkbox" id="toggle-upcoming-sunday" class="day-toggle" />
//  <div class="sunday-times">... start-upcoming-sunday / end-upcoming-sunday ...</div>
// and a function updateWeekDisplay() you already had.
// ──────────────────────────────────────────────
(function initWeeklyUpcomingHoursOnce() {
  const section = document.getElementById('upcomingHours-section');
  if (!section || section.dataset.weeklyBound) return;

  // Show/hide time rows when a weekday toggle changes
  section.querySelectorAll('.day-toggle').forEach(toggle => {
    toggle.addEventListener('change', () => {
      const dayName = toggle.id.replace('toggle-upcoming-', ''); // 'sunday' etc.
      const timeRow = section.querySelector(`.${dayName}-times`);

      if (timeRow) {
        timeRow.style.display = toggle.checked ? 'flex' : 'none';
        if (!toggle.checked) {
          const startSelect = document.getElementById(`start-upcoming-${dayName}`);
          const endSelect   = document.getElementById(`end-upcoming-${dayName}`);
          if (startSelect) startSelect.value = '';
          if (endSelect)   endSelect.value   = '';
        }
      }
    });
  });

  // Initial hide for unchecked days
  section.querySelectorAll('.day-toggle').forEach(toggle => {
    const dayName = toggle.id.replace('toggle-upcoming-', '');
    const timeRow = section.querySelector(`.${dayName}-times`);
    if (timeRow && !toggle.checked) timeRow.style.display = 'none';
  });

  // Tab switching → refresh weekly view when "Adjust Upcoming Hours" tab is selected
  document.querySelectorAll('.calendarOptions').forEach(tab => {
    tab.addEventListener('click', async () => {
      const label = tab.textContent.trim();
      if (label !== 'Adjust Upcoming Hours') return;

      const businessId = document.getElementById('dropdown-category-business')?.value;
      const calendarId = document.getElementById('dropdown-availability-calendar')?.value;

      if (businessId && calendarId && typeof updateWeekDisplay === 'function') {
        // Reset to current week and refresh
        window.currentWeekStart = getStartOfWeek(new Date());
        await updateWeekDisplay();
      }
    });
  });

  // Calendar dropdown change → refresh weekly view (and monthly grid if you want)
  const calSel = document.getElementById('dropdown-availability-calendar');
  if (calSel && !calSel.dataset.weeklyBound) {
    calSel.addEventListener('change', async (e) => {
      const businessId = document.getElementById('dropdown-category-business')?.value;
      const calendarId = e.target.value;

      if (businessId && calendarId && typeof updateWeekDisplay === 'function') {
        window.currentWeekStart = getStartOfWeek(new Date());
        await updateWeekDisplay();
      } else {
        // Clear rows if nothing selected
        ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'].forEach(day => {
          const toggle = document.getElementById(`toggle-upcoming-${day}`);
          const row    = document.querySelector(`.${day}-times`);
          const s      = document.getElementById(`start-upcoming-${day}`);
          const e2     = document.getElementById(`end-upcoming-${day}`);
          if (toggle) toggle.checked = false;
          if (row)    row.style.display = 'none';
          if (s)      s.value = '';
          if (e2)     e2.value = '';
        });
      }

      // Optional: also refresh your monthly calendar grid
      if (typeof loadAndGenerateCalendar === 'function') {
        await loadAndGenerateCalendar();
      }
    });
    calSel.dataset.weeklyBound = '1';
  }

  section.dataset.weeklyBound = '1';
})();
























}); // END DOMContentLoaded
// Canonicalize: ignore spaces, punctuation, and case
const canon = (s) =>
  String(s ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\s\-_]+/g, '')      // drop spaces/underscores/dashes
    .replace(/[^a-z0-9]/g, '');    // drop other punctuation

// Get DataType by exact name OR canonical match
async function getDataTypeByNameLoose(typeName) {
  // Try your existing function first
  const exact = await getDataTypeByName(typeName);
  if (exact) return exact;

  // Fallback: scan by canonical (add an index/cached map later if needed)
  const all = await DataType.find({ /* scope as needed */ });
  const want = canon(typeName);
  return all.find(dt => canon(dt.name) === want) || null;
}

// Build quick lookup maps for field labels and option sets
function buildFieldMaps(dt) {
  const fields = Array.isArray(dt.fields) ? dt.fields : []; // adapt to your schema
  const byCanon = new Map();      // canon(label) -> original label
  const optionsByCanon = new Map(); // label -> Map(canon(optionLabel/value) -> storedValue)

  for (const f of fields) {
    const label = f.label || f.name; // whatever you store as the field label
    if (!label) continue;
    byCanon.set(canon(label), label);

    // Option sets: accept label/value variations
    if (Array.isArray(f.options)) {
      const m = new Map();
      for (const opt of f.options) {
        const stored = opt.value ?? opt.label;     // how you store in values
        m.set(canon(opt.label), stored);
        m.set(canon(opt.value ?? ''), stored);
      }
      optionsByCanon.set(label, m);
    }
  }
  return { byCanon, optionsByCanon };
}

// Map incoming {values} keys to real labels; normalize option-set values, booleans, etc.
function normalizeIncomingValues(dt, values) {
  const { byCanon, optionsByCanon } = buildFieldMaps(dt);
  const out = {};
  for (const [k, v] of Object.entries(values || {})) {
    const realLabel = byCanon.get(canon(k)) || k;      // fall back if unknown
    let val = v;

    // Option sets: map "available"/"Available" -> stored value (e.g., "Available")
    const optMap = optionsByCanon.get(realLabel);
    if (optMap && typeof v === 'string') {
      const mapped = optMap.get(canon(v));
      if (mapped !== undefined) val = mapped;
    }

    // Booleans: accept "true"/"1"/true
    if (typeof val === 'string' && ['true','false','1','0','yes','no'].includes(val.toLowerCase())) {
      const t = val.toLowerCase();
      val = (t === 'true' || t === '1' || t === 'yes');
    }

    out[realLabel] = val;
  }
  return out;
}

// Map `where` keys (values.*) from canonical to real labels
function normalizeWhere(dt, whereObj) {
  const { byCanon } = buildFieldMaps(dt);
  const q = {};
  for (const [k, v] of Object.entries(whereObj || {})) {
    const realLabel = byCanon.get(canon(k)) || k;
    q[`values.${realLabel}`] = v;
  }
  return q;
}

// Map `sort` keys (values.*) from canonical to real labels
function normalizeSort(dt, sortObj) {
  const { byCanon } = buildFieldMaps(dt);
  const out = {};
  for (const [k, dir] of Object.entries(sortObj || {})) {
    if (k.startsWith('values.')) {
      const raw = k.slice(7);
      const realLabel = byCanon.get(canon(raw)) || raw;
      out[`values.${realLabel}`] = dir;
    } else {
      out[k] = dir;
    }
  }
  return out;
}

// =========================
// REUSABLE HELPERS
// =========================

// Fill a <select> with the user's (non-deleted) Businesses
async function loadBusinessOptions(selectId, {
  defaultId  = null,
  remember   = true,
  placeholder= '-- Select --'
} = {}) {
  const sel = document.getElementById(selectId);
  if (!sel) return;

  sel.innerHTML = `<option value="">${placeholder}</option>`;
  sel.disabled = true;

  try {
    const res = await fetch(`/api/records/Business?ts=${Date.now()}`, {
      credentials: 'include',
      cache: 'no-store'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const businesses = (await res.json())
      .filter(b => !b.deletedAt)
      .sort((a,b) =>
        (a?.values?.businessName || a?.values?.Name || '').localeCompare(
          b?.values?.businessName || b?.values?.Name || ''
        )
      );

    sel.innerHTML = `<option value="">${placeholder}</option>`;
    for (const biz of businesses) {
      const label = biz?.values?.businessName ?? biz?.values?.Name ?? '(Untitled)';
      const opt = document.createElement('option');
      opt.value = biz._id;
      opt.textContent = label;
      sel.appendChild(opt);
    }

    const saved = remember ? (sessionStorage.getItem('selectedBusinessId') || '') : '';
    const want  = defaultId || saved;
    if (want && sel.querySelector(`option[value="${want}"]`)) sel.value = want;

  } catch (e) {
    console.error('loadBusinessOptions:', e);
    sel.innerHTML = `<option value="">${placeholder}</option>`;
  } finally {
    sel.disabled = false;
  }
}

// Fill a <select> with (non-deleted) Calendars for a Business
async function loadCalendarOptions(
  selectId,
  businessId,
  {
    placeholder = '-- Select --',
    defaultId   = null,
    rememberKey = null
  } = {}
) {
  const sel = document.getElementById(selectId);
  if (!sel) return;

  if (!businessId) {
    sel.innerHTML = `<option value="">${placeholder}</option>`;
    sel.disabled = true;
    return;
  }

  sel.innerHTML = '<option value="">Loading…</option>';
  sel.disabled = true;

  try {
    const res = await fetch(`/api/records/Calendar?ts=${Date.now()}`, {
      credentials: 'include',
      cache: 'no-store'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const rows = (await res.json())
      .filter(c => !c.deletedAt && c?.values?.businessId === businessId)
      .sort((a,b) =>
        (a?.values?.calendarName || a?.values?.name || '').localeCompare(
          b?.values?.calendarName || b?.values?.name || ''
        )
      );

    sel.innerHTML = `<option value="">${placeholder}</option>`;
    for (const cal of rows) {
      const label = cal?.values?.calendarName ?? cal?.values?.name ?? '(Untitled)';
      const opt = document.createElement('option');
      opt.value = cal._id;
      opt.textContent = label;
      sel.appendChild(opt);
    }

    const remembered = rememberKey ? (sessionStorage.getItem(rememberKey) || '') : '';
    const want = defaultId || remembered;
    if (want && sel.querySelector(`option[value="${want}"]`)) sel.value = want;

    sel.disabled = rows.length === 0;
  } catch (e) {
    console.error('loadCalendarOptions:', e);
    sel.innerHTML = `<option value="">${placeholder}</option>`;
    sel.disabled = true;
  }
}

// Optional: close helper for the login popup
function closeLoginPopup() {
  document.getElementById("popup-login")?.style?.setProperty("display", "none");
  document.getElementById("popup-overlay")?.style?.setProperty("display", "none");
  document.body.classList.remove("popup-open");
}


//////////////////////////////////////////////////////////////
        //End Upcoming Hours 
 


const pad2 = (n) => String(n).padStart(2, '0');
const toYMD = (d) => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;

function timeStrToMinutes(hhmm) {
  // supports "HH:MM" or "h:mm AM/PM"
  const ampm = /\s?(AM|PM)$/i.exec(hhmm);
  if (ampm) {
    let [h, m] = hhmm.replace(/\s?(AM|PM)/i,'').split(':').map(Number);
    if (/PM/i.test(ampm[1]) && h !== 12) h += 12;
    if (/AM/i.test(ampm[1]) && h === 12) h = 0;
    return h*60 + (m||0);
  }
  const [h, m] = hhmm.split(':').map(Number);
  return h*60 + (m||0);
}
      

 
// "HH:MM" OR "h:mm AM/PM" → minutes since midnight
function timeStrToMinutes(s) {
  if (!s) return NaN;
  s = s.trim();

  let m = s.match(/^(\d{1,2}):(\d{2})\s*([ap]m)$/i);
  if (m) {
    let hh = parseInt(m[1], 10) % 12;
    if (/pm/i.test(m[3])) hh += 12;
    return hh * 60 + parseInt(m[2], 10);
  }

  m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);

  return NaN;
}

// Fill a time <select> with 24h values + 12h labels
function populateTimeSelect24(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  // Reset and add the default placeholder
  select.innerHTML = "";
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "--:--";
  select.appendChild(defaultOption);

  // Build options: value = "HH:MM", label = "h:mm AM/PM"
  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += 15) {
      const value24 = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`; // "13:30"

      const hour12 = hour % 12 === 0 ? 12 : hour % 12;
      const ampm = hour < 12 ? "AM" : "PM";
      const label = `${hour12}:${String(min).padStart(2, "0")} ${ampm}`; // "1:30 PM"

      const option = document.createElement("option");
      option.value = value24;       // <--- VALUE used for saving (HH:MM)
      option.textContent = label;   // <--- LABEL users see (h:mm AM/PM)
      select.appendChild(option);
    }
  }
}

//Upcoming Hours Section


//close add upcoming hours popup 
document.getElementById("popup-close").addEventListener("click", () => {
  document.getElementById("availability-popup").style.display = "none";
});


// This function calculates the start of the week (Sunday) for a given date.
function getStartOfWeek(date) {
    const copy = new Date(date);
    const day = copy.getDay(); // 0 for Sunday, 1 for Monday, etc.
    copy.setDate(copy.getDate() - day);
    // Ensure it's the start of the day (00:00:00)
    return new Date(copy.getFullYear(), copy.getMonth(), copy.getDate());
}

// This function formats a date range for display (e.g., "Jan 1 – Jan 7, 2025").
function formatDateRange(startDate, endDate) {
    const options = { month: "short", day: "numeric" };
    const startStr = startDate.toLocaleDateString("en-US", options);
    const endStr = endDate.toLocaleDateString("en-US", options);
    const yearStr = endDate.getFullYear();
    return `${startStr} – ${endStr}, ${yearStr}`;
}

// This function populates time dropdowns (used by both availability and upcoming hours).
function populateTimeSelect(selectElementId) {
    const select = document.getElementById(selectElementId);
    if (!select) {
        return;
    }
    select.innerHTML = ""; // Clear existing options

    // Add a default blank option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "--:--";
    select.appendChild(defaultOption);

    const times = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let min = 0; min < 60; min += 15) {
            const hour12 = hour % 12 === 0 ? 12 : hour % 12;
            const ampm = hour < 12 ? "AM" : "PM";
            const formattedTime = `${hour12}:${min.toString().padStart(2, "0")} ${ampm}`;
            times.push(formattedTime);
        }
    }

    times.forEach(time => {
        const option = document.createElement("option");
        option.value = time;
        option.textContent = time;
        select.appendChild(option);
    });
}

// This function initializes ALL time select dropdowns on the page.
function initializeAllTimeSelects() {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    days.forEach(day => {
        populateTimeSelect(`start-${day}`);
        populateTimeSelect(`end-${day}`);
        populateTimeSelect(`start-upcoming-${day}`);
        populateTimeSelect(`end-upcoming-${day}`);
    });
}       

//Open Availability Popup 

async function openAvailabilityPopup(year, month, day) {
  const popup = document.getElementById('availability-popup');
  const dateLabel = document.getElementById('popup-date-label');

  const jsDate = new Date(year, month, day);
  const ymd = toYMD(jsDate);

  // remember date for the Save handler
  window.upcomingSelectedDate = jsDate;
  popup.setAttribute('data-date', ymd);
  dateLabel.textContent = `Availability for ${jsDate.toDateString()}`;

  const businessId = document.getElementById('dropdown-category-business')?.value || '';
  const calendarId = document.getElementById('dropdown-availability-calendar')?.value || '';

  if (!businessId || !calendarId) {
    alert('Please select a business and calendar first.');
    return;
  }

  // clear current values
// clear current values (no 'row' yet)
setTimeSelect('current-day-start', '');
setTimeSelect('current-day-end', '');


  try {
    // Query by your field labels (canonicalization will also help)
    const where = encodeURIComponent(JSON.stringify({ "Calendar": calendarId, "Date": ymd }));
    const res = await fetch(
      `/api/records/${encodeURIComponent(TYPE_UPCOMING)}?where=${where}&ts=${Date.now()}`,
      { credentials: 'include', cache: 'no-store' }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = await res.json();
    const row = Array.isArray(items) ? items[0] : null;

if (row?.values) {
  const v = row.values;
  setTimeSelect('current-day-start', v.Start || v['Start Time'] || '');
  setTimeSelect('current-day-end',   v.End   || v['End Time']   || '');


    }
  } catch (err) {
    console.error('Error loading availability:', err);
  }

  popup.style.display = 'block';
}


// Save Upcoming Hours

function to24h(t) {
  if (!t) return '';
  // Already HH:MM?
  if (/^\d{2}:\d{2}$/.test(t)) return t;

  // Convert "h:mm AM/PM" -> "HH:MM"
  const m = String(t).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return t; // give up, return as-is
  let h = parseInt(m[1], 10);
  const mm = m[2];
  const ap = m[3].toUpperCase();
  if (h === 12) h = 0;
  if (ap === 'PM') h += 12;
  return `${String(h).padStart(2,'0')}:${mm}`;
}

function setTimeSelect(selectId, valueFromDb) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.value = to24h(valueFromDb);
}


(function bindUpcomingSaveOnce() {
  const btn = document.getElementById('save-upcoming-day-availability');
  if (!btn || btn.dataset.bound) return;

  btn.addEventListener('click', async () => {
    const businessId = document.getElementById('dropdown-category-business')?.value || '';
    const calendarId = document.getElementById('dropdown-availability-calendar')?.value || '';

  const start = to24h(document.getElementById('current-day-start')?.value || '');
  const end   = to24h(document.getElementById('current-day-end')?.value || '');

    // clear current values (no 'row' yet)
setTimeSelect('current-day-start', '');
setTimeSelect('current-day-end', '');


    let jsDate = window.upcomingSelectedDate;
    if (!jsDate) {
      const attr = document.getElementById('availability-popup')?.getAttribute('data-date');
      if (attr) jsDate = new Date(attr + 'T00:00:00');
    }

    if (!businessId)  return alert('Choose a business first.');
    if (!calendarId)  return alert('Choose a calendar first.');
    if (!jsDate)      return alert('Pick a date on the calendar.');
    if (!start || !end) return alert('Choose start and end time.');

    const ymd = toYMD(jsDate);

    const prev = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Saving…';

    try {
      // Match admin labels exactly
      const whereObj = { "Calendar": calendarId, "Date": ymd };
      const where = encodeURIComponent(JSON.stringify(whereObj));

      // Look for an existing record for this calendar+date
      const check = await fetch(`${API_ADMIN(TYPE_UPCOMING)}?where=${where}&ts=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-store'
      });
      if (!check.ok) throw new Error(`HTTP ${check.status}`);
      const existing = await check.json();

      // values must use your labels
      const values = {
        "Business":     businessId,
        "Calendar":     calendarId,
        "Date":         ymd,
        "Start":   start,
        "End":     end,
        "is Available": true
      };

      if (Array.isArray(existing) && existing.length) {
        // UPDATE
        const id = existing[0]._id;
        const up = await fetch(`${API_ADMIN(TYPE_UPCOMING)}/${id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ values })
        });
        if (!up.ok) throw new Error(`HTTP ${up.status}`);
        await up.json();
      } else {
        // CREATE
        const create = await fetch(API_ADMIN(TYPE_UPCOMING), {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ values })
        });
        if (!create.ok) throw new Error(`HTTP ${create.status}`);
        await create.json();
      }

      alert('Saved!');
      document.getElementById('availability-popup').style.display = 'none';

      // If you have a month-view refresh, call it here
      if (typeof window.loadAndGenerateCalendar === 'function') {
        await window.loadAndGenerateCalendar();
      }
    } catch (e) {
      console.error(e);
      alert('Error saving: ' + e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = prev;
    }
  });

  btn.dataset.bound = '1';
})();

//Show upcoming hours in popup 
async function preloadUpcomingForDay(calendarId, jsDate) {
  // Use your admin labels exactly: Calendar / Date
  const where = encodeURIComponent(JSON.stringify({ "Calendar": calendarId, "Date": toYMD(jsDate) }));
  const res = await fetch(`${API_ADMIN(TYPE_UPCOMING)}?where=${where}&ts=${Date.now()}`, {
    credentials: 'include',
    cache: 'no-store'
  });
  if (!res.ok) return;

  const arr = await res.json();
  const row = Array.isArray(arr) ? arr[0] : null;
  if (!row) return;

  const v = row.values || {};
  // Prefer "Start Time" / "End Time", fallback to Start/End
  document.getElementById('current-day-start').value = v["Start Time"] || v.Start || '';
  document.getElementById('current-day-end').value   = v["End Time"]   || v.End   || '';
}

function openUpcomingPopupFor(jsDate) {
  window.upcomingSelectedDate = jsDate;
  document.getElementById('popup-date-label').textContent =
    `Availability for ${jsDate.toDateString()}`;

populateTimeSelect24('current-day-start');
populateTimeSelect24('current-day-end');


  const calId = document.getElementById('dropdown-availability-calendar')?.value || '';
  if (calId) preloadUpcomingForDay(calId, jsDate);

  document.getElementById('availability-popup').style.display = 'block';
}




///////////////////////////////////////////////////////////
