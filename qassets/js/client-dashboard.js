// --- globals / fallbacks ---
window.STATE = window.STATE || {};
const DEFAULT_AVATAR = "/uploads/default-avatar.png"; // adjust path

function $(id){ return document.getElementById(id); }
function setVal(...args) {
  // setVal('idA','idB', value)
  const value = args.pop();
  for (const id of args) {
    const el = $(id);
    if (el) { el.value = value ?? ""; return el; }
  }
  return null;
}



// Use a configurable type name; falls back to "Appointment"
const APPOINTMENT_TYPE = (window.TYPES && window.TYPES.Appointment) || "Appointment";


document.addEventListener("DOMContentLoaded", async () => {
    

    // =========================================================
    // 1. LOGIN POPUP & AUTHENTICATION LOGIC
    // =========================================================
    function openLoginPopup() {
        document.getElementById("popup-login").style.display = "block";
        document.getElementById("popup-overlay").style.display = "block";
        document.body.classList.add("popup-open");
    }

    function closeLoginPopup() {
        document.getElementById("popup-login").style.display = "none";
        document.getElementById("popup-overlay").style.display = "none";
        document.body.classList.remove("popup-open");
    }
    // Expose closeLoginPopup globally if your HTML button uses it with window.closeLoginPopup()
    window.closeLoginPopup = closeLoginPopup;

    const loginBtn = document.getElementById("open-login-popup-btn");
    if (loginBtn) {
        loginBtn.addEventListener("click", () => openLoginPopup());
    }

    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("login-email").value.trim();
            const password = document.getElementById("login-password").value.trim();

            if (!email || !password) {
                alert("Please enter both email and password.");
                return;
            }

            try {
            const res = await fetch("/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",               // <-- important for session cookie
  body: JSON.stringify({ email, password }),
});

                const result = await res.json();
                if (res.ok) {
                    alert("✅ Logged in!");
                    closeLoginPopup();
                    window.location.reload();
                } else {
                    alert(result.message || "Login failed.");
                }
            } catch (err) {
                console.error("Login error:", err);
                alert("Something went wrong during login.");
            }
        });
    }

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

const headerRight = document.querySelector(".right-group");
(async () => {
  try {
    const res = await fetch("/check-login", { credentials: "include" });
    const data = await res.json();

    if (data.loggedIn && headerRight) {
      // Try a bunch of common fields; fallback to email username; final fallback "there"
      const displayName =
        data.firstName ||
        data.first_name ||
        data.name ||
        data.displayName ||
        (data.user && (data.user.firstName || data.user.name)) ||
        (data.email ? String(data.email).split("@")[0] : "") ||
        "there";

      headerRight.innerHTML = `
        Hi, ${escapeHtml(displayName)} 👋
        <button id="logout-btn">Logout</button>
      `;

      document.getElementById("logout-btn")?.addEventListener("click", async () => {
        // use the route your server actually exposes
        const resLogout = await fetch("/auth/logout", { method: "POST", credentials: "include" });
        if (resLogout.ok) {
          location.reload();
        } else {
          // fallback alias if you also have /logout
          await fetch("/logout", { credentials: "include" }).catch(()=>{});
          location.reload();
        }
      });
    }
  } catch (err) {
    console.error("Error checking login status:", err);
  }
})();

// ---- Client Dashboard avatar ----
document.addEventListener("DOMContentLoaded", async () => {
 const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
       <rect width='100%' height='100%' fill='#eee'/>
       <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
             font-family='sans-serif' font-size='18' fill='#999'>No Photo</text>
     </svg>`
  );

  const CANDIDATE_ME_ENDPOINTS = [
    "/api/users/me",     // v2 (preferred)
    "/get-current-user", // your older route
    "/check-login"       // fallback that returns { loggedIn, user? }
  ];

  async function fetchJson(url) {
    const res = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (!ct.includes("application/json")) throw new Error(`Expected JSON, got ${ct}`);
    return res.json();
  }

  async function getCurrentUser() {
    for (const url of CANDIDATE_ME_ENDPOINTS) {
      try {
        const data = await fetchJson(url);
        if (url.includes("check-login") && data?.loggedIn === false) continue;

        // Normalize possible shapes: {user:{...}} or {data:{...}} or {...}
        const u = data?.user || data?.data || data;

        // Some older shapes put id at top level as userId
        return {
          id: u?._id || u?.id || data?.userId || null,
          firstName: u?.firstName ?? u?.values?.firstName ?? "",
          lastName:  u?.lastName  ?? u?.values?.lastName  ?? "",
          email:     u?.email     ?? u?.values?.email     ?? "",
          phone:     u?.phone     ?? u?.values?.phone     ?? "",
          profilePhoto: u?.profilePhoto || u?.avatarUrl || ""
        };
      } catch {
        // try next endpoint
      }
    }
    return null;
  }
async function initClientAvatar() {
  const img = document.getElementById("client-profile-photo"); // ✅ correct selector
  if (!img) return;

  try {
    const me = await (window.getCurrentUserNormalized?.() || getCurrentUser());
    const raw = me?.profilePhoto || "";
    if (raw) {
      const absolute = new URL(raw, location.origin).href + `?t=${Date.now()}`; // cache-bust
      img.src = absolute;
      img.style.display = "block";
    } else {
      // Either hide or show the inline default
      img.src = DEFAULT_AVATAR;
      img.style.display = "block";
    }
  } catch {
    img.src = DEFAULT_AVATAR;
    img.style.display = "block";
  }
}
document.addEventListener("DOMContentLoaded", initClientAvatar);

document.addEventListener("DOMContentLoaded", () => {
  initClientAvatar();
});
});

async function getCurrentUser() {
  const tries = [
    { url: "/check-login", shape: "check" },
    { url: "/api/me",      shape: "flat"  },     // if you add it later
    { url: "/me",          shape: "flat"  }      // legacy fallback
  ];
  for (const { url, shape } of tries) {
    try {
      const res = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
      if (!res.ok) continue;
      const data = await res.json();

      if (shape === "check") {
        if (!data.loggedIn) return null;
        return {
          id:        data.userId || null,
          firstName: data.firstName || data.first_name || "",
          lastName:  data.lastName  || data.last_name  || "",
          email:     data.email || "",
          profilePhoto: data.profilePhoto || ""
        };
      } else {
        // “flat” generic normalizer
        const u = data.user || data;
        return {
          id:        u._id || u.id || null,
          firstName: u.firstName || u.values?.firstName || "",
          lastName:  u.lastName  || u.values?.lastName  || "",
          email:     u.email     || u.values?.email     || "",
          profilePhoto: u.profilePhoto || u.values?.profilePhoto || ""
        };
      }
    } catch (_) {}
  }
  return null;
}



    // =========================================================
    // 2. TAB SWITCHING LOGIC
    // =========================================================
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            tabButtons.forEach(b => b.classList.remove("active"));
            tabContents.forEach(c => c.style.display = "none");

            btn.classList.add("active");
            const target = btn.getAttribute("data-tab");
            document.getElementById(target).style.display = "block";

            // --- IMPORTANT: If the 'appointments-tab' is activated, re-fetch appointments ---
            if (target === 'appointments-tab') {
                fetchAndRenderClientAppointments();
            }
            // --- END IMPORTANT ---
        });

        //Open Reset Password popup
document.getElementById("open-reset-password-popup-btn").addEventListener("click", () => {
  document.getElementById("popup-reset-password").style.display = "block";
  document.getElementById("popup-overlay").style.display = "block"; // Optional: if you have a dark background overlay
  document.body.classList.add("popup-open"); // Optional: prevent background scrolling
});
function closeResetPopup(e) {
  e?.preventDefault();
  e?.stopPropagation();
  document.getElementById("popup-reset-password").style.display = "none";
  document.getElementById("popup-overlay").style.display = "none";
  document.body.classList.remove("popup-open");
}
window.closeResetPopup = closeResetPopup; // keep if you stay with inline onclick


//Reset Password 
document.getElementById("change-password-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const currentPassword = document.getElementById("current-password").value.trim();
  const newPassword = document.getElementById("new-password").value.trim();
  const confirmPassword = document.getElementById("confirm-password").value.trim();

  if (newPassword !== confirmPassword) {
    alert("New passwords do not match.");
    return;
  }

  try {
    const res = await fetch("/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const result = await res.json();

    if (res.ok) {
      alert("✅ Password changed!");
    } else {
      alert("❌ " + result.message);
    }
  } catch (err) {
    console.error("Error:", err);
    alert("Something went wrong.");
  }
});


//show image on page load 
// --- Hydrate header avatar on every page load (no popup involved) ---
async function hydrateHeaderAvatar() {
  const headerImg = document.getElementById("client-profile-photo");
  if (!headerImg) return;

  // If the saved path 404s, fall back to default
  headerImg.onerror = () => {
    headerImg.onerror = null; // prevent loop
    headerImg.src = "/uploads/default-avatar.png";
    headerImg.style.display = "block";
  };

  try {
    const res = await fetch("/api/users/me", { credentials: "include" });
    if (!res.ok) {
      // not logged in (401) → keep default
      return;
    }
    const data = await res.json();
    const src = data?.user?.profilePhoto;  // should be like "/uploads/169....png"
    if (src && typeof src === "string") {
      // cache-buster so you don't see an old cached file after uploads
      headerImg.src = src + (src.includes("?") ? "&" : "?") + "t=" + Date.now();
      headerImg.style.display = "block";
    }
  } catch (err) {
    // keep default
    console.warn("hydrateHeaderAvatar failed:", err);
  }
}

// Run after the DOM is ready (your script is defer'd, this is safe)
document.addEventListener("DOMContentLoaded", hydrateHeaderAvatar);






    });

    // =========================================================
    // 3. SETTINGS POPUP LOGIC
    // =========================================================

// =========================================================
// 3) SETTINGS POPUP LOGIC (drop-in, null-safe, no 404s)
// =========================================================
(() => {
  const $ = (id) => document.getElementById(id);
  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // Inline placeholder (no /uploads/default-avatar.png requests)
  const DEFAULT_AVATAR =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
         <rect width='100%' height='100%' fill='#eee'/>
         <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
               font-family='sans-serif' font-size='18' fill='#999'>No Photo</text>
       </svg>`
    );

  // Robust "who am I" getter
  async function getCurrentUserNormalized() {
    const ENDPOINTS = ["/api/users/me", "/get-current-user", "/check-login"];

    const fetchJson = async (url) => {
      const res = await fetch(url, { credentials: "include", headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
      const ct = (res.headers.get("content-type") || "").toLowerCase();
      if (!ct.includes("application/json")) throw new Error(`Expected JSON from ${url}`);
      return res.json();
    };

    const grab = (obj, keys) => {
      if (!obj) return undefined;
      for (const k of keys) if (obj[k] != null && obj[k] !== "") return obj[k];
      return undefined;
    };
    const pickFrom = (u, keys) => grab(u, keys) ?? grab(u?.values, keys);

    for (const url of ENDPOINTS) {
      try {
        const data = await fetchJson(url);
        if (url.includes("check-login") && data?.loggedIn === false) continue;

        const u = data?.user || data?.data || data || {};

        let firstName = pickFrom(u, ["firstName","first_name","First Name","firstname","given_name","first"]);
        let lastName  = pickFrom(u, ["lastName","last_name","Last Name","lastname","family_name","last","surname"]);
        const full    = pickFrom(u, ["name","fullName","Full Name"]);
        if ((!firstName || !lastName) && typeof full === "string") {
          const parts = full.trim().split(/\s+/);
          if (!firstName) firstName = parts[0] || "";
          if (!lastName)  lastName  = parts.slice(1).join(" ") || "";
        }

        const email        = pickFrom(u, ["email","Email"]) || "";
        const phone        = pickFrom(u, ["phone","phoneNumber","Phone","Phone Number","mobile","Mobile","cell","Cell"]) || "";
        const profilePhoto = pickFrom(u, ["profilePhoto","avatar","avatarUrl","photo","imageUrl","Image URL"]) || "";

        const addrObj = pickFrom(u, ["address","Address"]);
        const addressStr =
          typeof addrObj === "string"
            ? addrObj
            : addrObj
            ? [addrObj.street, addrObj.city, addrObj.state, addrObj.postalCode, addrObj.country]
                .filter(Boolean)
                .join(", ")
            : "";

        return {
          id: u._id || u.id || data.userId || null,
          firstName: firstName || "",
          lastName:  lastName  || "",
          email,
          phone,
          profilePhoto,
          addressStr,
        };
      } catch {
        // try next
      }
    }
    return null;
  }

  // expose for other modules that might call it
  window.getCurrentUserNormalized = getCurrentUserNormalized;


// Live image preview in the popup
document.getElementById("image-upload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  const preview = document.getElementById("client-profile-photo-preview");
  const noImg = document.getElementById("no-image-text");
  if (!file) return;
  preview.src = URL.createObjectURL(file);
  preview.style.display = "block";
  if (noImg) noImg.style.display = "none";
});


async function openSettingsPopup() {
  try {
    const res = await fetch("/api/users/me", { credentials: "include" });
    if (!res.ok) {
      if (res.status === 401) {
        alert("Please log in to edit your settings.");
        return;
      }
      const t = await res.text();
      throw new Error(`GET /api/users/me failed: ${res.status} ${t.slice(0,120)}`);
    }
    const data = await res.json();
    const u = data?.user || {};

    // Fill fields
    document.getElementById("popup-First-name-input").value = u.firstName || "";
    document.getElementById("popup-Last-name-input").value  = u.lastName  || "";
    document.getElementById("popup-phone-number-input").value = u.phone   || "";
    document.getElementById("popup-address-input").value = u.address || "";
    document.getElementById("popup--email-input").value  = u.email   || "";

    // Photo preview
const headerImg  = document.getElementById("client-profile-photo");           // header
const previewImg = document.getElementById("client-profile-photo-preview");   // popup
const noImg      = document.getElementById("no-image-text");

if (u.profilePhoto) {
  const src = u.profilePhoto;
  if (headerImg)  headerImg.src = src;
  if (previewImg) { previewImg.src = src; previewImg.style.display = "block"; }
  if (noImg) noImg.style.display = "none";
} else {
  if (previewImg) previewImg.style.display = "none";
  if (noImg) noImg.style.display = "block";
}


    // OPEN
    document.getElementById("popup-settings").style.display = "block";
    showOverlay(); // <-- this alone handles overlay + body class

  } catch (err) {
    console.error(err);
    alert("Couldn't load your settings.");
  }
}

function closeSettingsPopup() {
  document.getElementById("popup-settings").style.display = "none";
  hideOverlayIfNoModals(); // <-- this alone hides overlay if nothing else is open
}
function showOverlay() {
  const ov = document.getElementById("popup-overlay");
  if (ov) ov.style.display = "block";      // explicit
  document.body.classList.add("popup-open");
}

function hideOverlayIfNoModals() {
  const anyOpen = Array.from(
    document.querySelectorAll("#popup-settings, #popup-login, #popup-reset-password, #popup-reschedule")
  ).some(el => getComputedStyle(el).display !== "none");

  if (!anyOpen) {
    const ov = document.getElementById("popup-overlay");
    if (ov) ov.style.display = "none";     // explicit
    document.body.classList.remove("popup-open");
  }
}
document.getElementById("popup-overlay")?.addEventListener("click", () => {
  ["popup-settings","popup-login","popup-reset-password","popup-reschedule"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  hideOverlayIfNoModals();
});


  // expose for inline onclick (✏️ button)
  window.openSettingsPopup  = openSettingsPopup;
  window.closeSettingsPopup = closeSettingsPopup;

  // Wire the ✏️ button, if present
  const settingsBtn = $("open-settings-popup-btn");
  if (settingsBtn && !settingsBtn.dataset.bound) {
    settingsBtn.addEventListener("click", openSettingsPopup);
    settingsBtn.dataset.bound = "1";
  }



  // Submit handler (multipart -> /update-user-profile)
// IMPORTANT: keep id="popup-add-business-form" as in your HTML
const settingsForm = document.getElementById("popup-add-business-form");

settingsForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const saveBtn = document.getElementById("save-button");
  saveBtn.disabled = true;

  try {
    // Build FormData with the keys your server expects
    const fd = new FormData();
    fd.append("firstName", document.getElementById("popup-First-name-input").value.trim());
    fd.append("lastName",  document.getElementById("popup-Last-name-input").value.trim());
    fd.append("phone",     document.getElementById("popup-phone-number-input").value.trim());
    fd.append("address",   document.getElementById("popup-address-input").value.trim());
    fd.append("email",     document.getElementById("popup--email-input").value.trim());

    // File (make sure server expects "profilePhoto" as the field name — it does)
    const file = document.getElementById("image-upload").files[0];
    if (file) fd.append("profilePhoto", file);

    const res = await fetch("/update-user-profile", {
      method: "POST",
      body: fd,
      credentials: "include", // cookie session
      // NOTE: do NOT set Content-Type for FormData; the browser sets the boundary
    });

    const ct = res.headers.get("content-type") || "";
    const payload = ct.includes("application/json") ? await res.json() : { message: await res.text() };

    if (!res.ok) {
      throw new Error(payload?.message || "Update failed");
    }

    // Success — update preview + any greeting
   // ✅ After successful save: update header + popup images and hide 'no image'
const headerImg  = document.getElementById("client-profile-photo");           // header avatar
const previewImg = document.getElementById("client-profile-photo-preview");   // popup preview
const noImg      = document.getElementById("no-image-text");

const applySrc = (img, src) => {
  if (!img || !src) return;
  // cache-buster so the browser doesn't show an old file
  img.src = src + (src.includes('?') ? '&' : '?') + 't=' + Date.now();
  img.style.display = "block";
};

const newPhoto = payload?.user?.profilePhoto;

if (newPhoto) {
  applySrc(headerImg, newPhoto);
  applySrc(previewImg, newPhoto);
  if (noImg) noImg.style.display = "none";
} else {
  // fallback: re-fetch the latest profile to get the saved path
  try {
    const me = await fetch("/api/users/me", { credentials: "include" });
    if (me.ok) {
      const data = await me.json();
      const src = data?.user?.profilePhoto;
      if (src) {
        applySrc(headerImg, src);
        applySrc(previewImg, src);
        if (noImg) noImg.style.display = "none";
      }
    }
  } catch {}
}


    // Update greeting if you show “Hey [Name]”
    const fn = document.getElementById("popup-First-name-input").value.trim();
    const greet = document.getElementById("greeting-name"); // e.g. <span id="greeting-name"></span>
    if (greet) greet.textContent = fn || greet.textContent;

    alert("✅ Settings saved!");
    closeSettingsPopup();

  } catch (err) {
    console.error("Save settings error:", err);
    alert(err.message || "Couldn't save settings.");
  } finally {
    saveBtn.disabled = false;
  }
});

})();


    // =========================================================
    // 4. APPOINTMENT LISTING LOGIC
    // =========================================================
    
  // =========================================================
// 4) CLIENT APPOINTMENTS (v2 endpoint + fallbacks)
// =========================================================
// 4) CLIENT APPOINTMENTS via generic /api/me/records
(() => {
  const ALL_ID  = "all-appointments";
  const UPC_ID  = "upcoming-appointments";
  const PAST_ID = "past-appointments";

  const containerAll = document.getElementById(ALL_ID);
  const containerUpcoming = document.getElementById(UPC_ID);
  const containerPast = document.getElementById(PAST_ID);

  if (!containerAll) return;
  containerAll.textContent = "Loading your appointments…";

  const safeJson = async (res) => {
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (ct.includes("application/json")) return res.json();
    const txt = await res.text();
    throw new Error(`Expected JSON; got ${ct}. ${txt.slice(0,160)}`);
  };

  // Normalize one record {_id, values} -> the shape our renderer expects
  const normalize = ({ _id, values: v = {} }) => {
    const pick = (obj, keys) => {
      for (const k of keys) if (obj && obj[k] != null) return obj[k];
      return undefined;
    };

    const date  = pick(v, ['Date','date']) || '';
    const time  = pick(v, ['Time','Start Time','time']) || '';
    const dur   = Number(pick(v, ['Duration','duration'])) || undefined;

    let startAt = pick(v, ['startISO','start','startAt']) || (date && time ? `${date}T${time}` : '');
    let endAt   = pick(v, ['endISO','end','endAt']) || '';
    if (!endAt && startAt && dur) {
      const s = new Date(startAt);
      if (!Number.isNaN(s.getTime())) endAt = new Date(s.getTime() + dur*60000).toISOString();
    }

   const serviceName = pick(v, ['Service Name','serviceName','Name','name']) || 'Appointment';
const proNameFromAppt = pick(v, ['Pro Name','Stylist','proName','stylistName']);
const proNameFromBiz =
  (v.Business && (v.Business.values?.['Pro Name'] || v.Business['Pro Name'] || v.Business.proName)) || '';
const proName = proNameFromAppt || proNameFromBiz || '';

const businessId = (v.Business && (v.Business._id || v.Business)) || '';
const status = pick(v, ['Appointment Status','Status','status']) || 'booked';

return {
  _id,
  date,
  time,
  duration: dur,
  startAt,
  endAt,
  serviceName,
  proName,
  businessId,
  status
};

  };

  async function fetchAndRenderClientAppointments() {
    try {
      // Ask generically for the "Appointment" data type; include both createdBy + Client matches
      const url = `/api/me/records` +
        `?dataType=${encodeURIComponent('Appointment')}` +
        `&includeCreatedBy=1&includeRefField=1&myRefField=Client` +
        `&sort=${encodeURIComponent(JSON.stringify({ 'values.Date': 1, 'values.Time': 1, createdAt: 1 }))}`;

      const res = await fetch(url, { credentials: 'include', headers: { Accept: 'application/json' } });
      const payload = await safeJson(res);
      const raw = Array.isArray(payload) ? payload : (payload.data || []);
 let list = raw
  .map(normalize)
  .filter(a => a.startAt && !Number.isNaN(new Date(a.startAt).getTime()));

// Hide canceled rows
list = list.filter(a => {
  const s = String(a.status || "").toLowerCase();
  const canceledFlag =
    a._raw?.values?.["is Canceled"] === true ||
    s === "cancelled" || s === "canceled";
  return !canceledFlag;
});

list.sort((a, b) => new Date(a.startAt) - new Date(b.startAt));


      // Use your existing renderer if present
      if (typeof window.renderAppointments === 'function') {
        window.renderAppointments(list);
      } else {
        // Fallback minimal render
        containerAll.innerHTML = list.map(a => `
          <div class="appointment-card">
            <div class="appointment-info">
              <h3>${a.serviceName || 'Appointment'}</h3>
              <p><strong>Date:</strong> ${a.date}</p>
              <p><strong>Time:</strong> ${a.time}</p>
              ${a.duration ? `<p><strong>Duration:</strong> ${a.duration} min</p>` : ''}
              <p><strong>Status:</strong> ${a.status}</p>
            </div>
          </div>
        `).join('') || "<p>You have no upcoming appointments.</p>";
      }
    } catch (e) {
      console.error('Appointments load failed:', e);
      containerAll.innerHTML = `<p style="color:red;">Error loading appointments: ${e.message}</p>`;
    }
  }

  // Kick off and expose for refresh after cancel/reschedule
  fetchAndRenderClientAppointments();
  window.fetchAndRenderClientAppointments = fetchAndRenderClientAppointments;
})();

// =========================================================
// 4. APPOINTMENT LISTING + CANCEL (delegated)
// =========================================================
(function () {
  const allContainer = document.getElementById("all-appointments");
  const upcomingContainer = document.getElementById("upcoming-appointments");
  const pastContainer = document.getElementById("past-appointments");
  if (!allContainer || !upcomingContainer || !pastContainer) return;

  // Use your formatters if present; otherwise safe fallbacks
  const fmtDate = (d) =>
    (typeof window.formatDate === "function")
      ? window.formatDate(d)
      : (d ? new Date(d).toLocaleDateString() : "");
  const fmtTime = (t) =>
    (typeof window.formatTime === "function")
      ? window.formatTime(t)
      : (t || "");

  const toStartDate = (appt) => {
    // Prefer full ISO (start/startAt). Else combine date+time.
    const iso = appt.start || appt.startAt || null;
    if (iso) {
      const d = new Date(iso);
      if (!Number.isNaN(d.getTime())) return d;
    }
    if (appt.date && appt.time) return new Date(`${appt.date}T${appt.time}`);
    if (appt.date) return new Date(appt.date);
    return new Date(NaN);
  };

  // Expose render so your fetch code can call it
  window.renderAppointments = function renderAppointments(appointments) {
    allContainer.innerHTML = "";
    upcomingContainer.innerHTML = "";
    pastContainer.innerHTML = "";

    const now = new Date();

    if (!Array.isArray(appointments) || appointments.length === 0) {
      allContainer.innerHTML = "<p>You have no upcoming appointments.</p>";
      return;
    }

    appointments.forEach((appt) => {
      const start = toStartDate(appt);
      const isValid = !Number.isNaN(start.getTime());
      const isPast = isValid ? start < now : false;

      // normalize fields (support both your old and normalized shapes)
      const dateStr = appt.date || (isValid ? start.toISOString().slice(0, 10) : "");
      const timeStr = appt.time || (isValid ? start.toTimeString().slice(0, 5) : "");
      const serviceName = appt.serviceName || appt.service?.name || "Appointment";
      const proName = appt.proName || appt.stylistName || appt.pro?.name || "Unknown Pro";
      const duration = appt.duration || appt.service?.duration; // may be undefined
      const businessSlug = appt.businessSlug || appt.business?.slug || "";
      const apptId = appt._id || appt.id || appt.appointmentId || "";

      const durationLine = duration ? `<p><strong>Duration:</strong> ${duration} minutes</p>` : "";
      const bizLine = businessSlug
        ? `<p><strong>Business:</strong> <a href="/${businessSlug}">${businessSlug}</a></p>`
        : "";

      const actions = !isPast
        ? `<button class="cancel-appointment-btn" data-id="${apptId}">Cancel</button>`
        : "";

      const cardHTML = `
        <div class="appointment-card" data-appt-id="${apptId}">
          <div class="pro-card">
            <p><strong>Pro:</strong> ${proName}</p>
          </div>
          <div class="appointment-info">
            <h3>${serviceName}</h3>
            <p><strong>Date:</strong> ${fmtDate(dateStr)}</p>
            <p><strong>Time:</strong> ${fmtTime(timeStr)}</p>
            ${durationLine}
            ${bizLine}
          </div>
          <div class="appointment-actions">
            ${actions}
          </div>
        </div>
      `;

      // Insert into sections
      allContainer.insertAdjacentHTML("beforeend", cardHTML);
      if (isPast) {
        pastContainer.insertAdjacentHTML("beforeend", cardHTML);
      } else {
        upcomingContainer.insertAdjacentHTML("beforeend", cardHTML);
      }
    });
  };

  // ---------- CANCEL (event delegation; set up once) ----------
  const onClick = async (evt) => {
    const btn = evt.target.closest(".cancel-appointment-btn");
    if (!btn) return;

    const appointmentId = btn.dataset.id || btn.closest(".appointment-card")?.dataset.apptId;
    if (!appointmentId) return;

    if (!confirm("Are you sure you want to cancel this appointment?")) return;

    try {
  const response = await fetch(
  `/api/records/${encodeURIComponent("Appointment")}/${encodeURIComponent(appointmentId)}`,
  {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      values: {
        "is Canceled": true,
        "Appointment Status": "cancelled",
      },
    }),
  }
);


      const ct = (response.headers.get("content-type") || "").toLowerCase();
      const result = ct.includes("application/json") ? await response.json() : { message: await response.text() };

      if (response.ok) {
        alert(result.message || "Appointment canceled.");
        // Re-fetch and re-render (assumes your fetch function exists globally)
        if (typeof window.fetchAndRenderClientAppointments === "function") {
          window.fetchAndRenderClientAppointments();
        } else {
          // fallback: remove card from DOM
          btn.closest(".appointment-card")?.remove();
        }
      } else {
        alert(`Error: ${result.message || "Failed to cancel."}`);
      }
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      alert("Failed to cancel appointment. Please try again.");
    }
  };

  // attach to a common ancestor (the three containers share the same parent in most layouts)
  const listRoot = allContainer.parentElement || document;
  if (!listRoot._cancelDelegationBound) {
    listRoot.addEventListener("click", onClick);
    listRoot._cancelDelegationBound = true;
  }

  // If you have reschedule buttons later, you can do a similar delegated handler:
  // listRoot.addEventListener("click", (e) => {
  //   const btn = e.target.closest(".reschedule-appointment-btn");
  //   if (!btn) return;
  //   // ... open reschedule flow
  // });
})();


                               //Upcoming Appointments Tab

document.querySelectorAll(".sub-tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    // Highlight active button
    document.querySelectorAll(".sub-tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // Show relevant content
    const tabToShow = btn.dataset.tab;
    document.querySelectorAll(".sub-tab-content").forEach(section => {
      section.style.display = "none";
    });
    document.getElementById(`${tabToShow}-appointments`).style.display = "block";
  });
});

    // =========================================================
    // 5. HELPER FUNCTION (placed here as it's used by fetchAndRenderClientAppointments)
    // =========================================================
    function formatDate(dateStr) {
  const dateParts = dateStr.split('-'); // expecting "YYYY-MM-DD"
  const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]); // JS months are 0-indexed
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

    function formatTime(timeStr) {
        // Ensure timeStr is a string before splitting
        if (typeof timeStr !== 'string') {
            console.warn('formatTime received non-string input:', timeStr);
            return String(timeStr); // Return as string to avoid breaking display
        }
        const [hour, minute] = timeStr.split(":").map(Number);
        const ampm = hour >= 12 ? "PM" : "AM";
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minute.toString().padStart(2, "0")} ${ampm}`;
    }

    // =========================================================
    // 6. INITIAL CALLS WHEN DOM IS READY
    // =========================================================
    fetchAndRenderClientAppointments(); // Initial load of appointments
 
 
    // =========================================================
    // Reschedule 
    // =========================================================
//Attaches a click event to every .reschedule-appointment-btn
function attachRescheduleListeners() {
  document.querySelectorAll('.reschedule-appointment-btn').forEach(button => {
    button.addEventListener('click', async () => {
      const appointmentId = button.dataset.id;
      const serviceName = button.dataset.service;
      const date = button.dataset.date;
      const time = button.dataset.time;
      const duration = button.dataset.duration;
      const serviceId = button.dataset.serviceId;

      console.log("🛠 Reschedule button clicked for:", {
        appointmentId, serviceName, date, time, duration, serviceId
      });

      const businessId = button.dataset.business || (window.business?._id);

      if (!businessId) return alert("Business ID missing");

      // ⏬ Fetch categories and services
      const res = await fetch(`/get-categories-and-services/${businessId}`);
      const { categories, services } = await res.json();

      const categorySelect = document.getElementById("reschedule-category");
      const serviceSelect = document.getElementById("reschedule-service");

      // 🔄 Populate category dropdown
      categorySelect.innerHTML = `<option value="">-- Select Category --</option>`;
      categories.forEach(cat => {
        categorySelect.innerHTML += `<option value="${cat._id}">${cat.categoryName}</option>`;
      });

      // 🔄 Populate service dropdown when category changes
      categorySelect.addEventListener("change", () => {
        const selectedCategory = categorySelect.value;
        serviceSelect.innerHTML = `<option value="">-- Select Service --</option>`;
        const filtered = services.filter(svc => svc.categoryId === selectedCategory);
        filtered.forEach(svc => {
          serviceSelect.innerHTML += `<option value="${svc._id}" data-duration="${svc.duration}">
            ${svc.serviceName}
          </option>`;
        });
      });

      // 🧠 Preselect current category + service
      const currentService = services.find(svc => svc._id === serviceId);
      if (currentService) {
        categorySelect.value = currentService.categoryId;
        categorySelect.dispatchEvent(new Event("change"));
        setTimeout(() => {
          serviceSelect.value = currentService._id;
        }, 100);
      }

      // Set hidden fields
      document.getElementById("reschedule-appointment-id").value = appointmentId;
      document.getElementById("reschedule-date").value = date;
      document.getElementById("reschedule-time").value = time;

      // Show popup
      document.getElementById("popup-reschedule").style.display = "block";
    });
  });
}
document.getElementById("reschedule-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const appointmentId = document.getElementById("reschedule-appointment-id").value;
  const serviceId = document.getElementById("reschedule-service").value;
  const date = document.getElementById("reschedule-date").value;
  const time = document.getElementById("reschedule-time").value;

  console.log("🔁 Rescheduling to:", { appointmentId, serviceId, date, time });

  const res = await fetch("/reschedule-appointment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ appointmentId, serviceId, date, time })
  });

  const data = await res.json();

  if (res.ok) {
    alert("✅ Appointment rescheduled!");
    document.getElementById("popup-reschedule").style.display = "none";
    fetchAndRenderClientAppointments();
  } else {
    alert("❌ " + data.message);
  }
});


async function fetchRescheduleSlots() {
  const date = document.getElementById("reschedule-date").value;
  const serviceId = document.getElementById("reschedule-service").value;
  const calendarId = window.selectedCalendarId; // You'll need to store this on popup open
  if (!date || !serviceId || !calendarId) return;

  const service = appointment.businessServices.find(s => s._id === serviceId);
  const duration = service?.duration || 30;

  const res = await fetch("/get-available-timeslots", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ calendarId, date, serviceDuration: duration })
  });

  const result = await res.json();

  const container = document.getElementById("reschedule-timeslots");
  container.innerHTML = "";

  // Show the slots (you can format however you want)
  [...result.morning, ...result.afternoon, ...result.evening].forEach(time => {
    const btn = document.createElement("button");
    btn.textContent = time;
    btn.onclick = () => {
      document.getElementById("reschedule-time").value = time;
      highlightSelectedTime(btn); // optional styling function
    };
    container.appendChild(btn);
  });
}





//Generate calendar 
let rescheduleCurrentDate = new Date(); // Tracks the currently viewed month
function generateRescheduleCalendar() {
  const calendarGrid = document.getElementById("reschedule-calendar-grid");
  const monthLabel = document.getElementById("reschedule-month-label");
  calendarGrid.innerHTML = "";

  const year = rescheduleCurrentDate.getFullYear();
  const month = rescheduleCurrentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDayIndex = firstDay.getDay(); // Sunday = 0
  const daysInMonth = lastDay.getDate();

  // Update month label
  monthLabel.textContent = `${firstDay.toLocaleString("default", { month: "long" })} ${year}`;

  // Add empty boxes for padding
  for (let i = 0; i < startDayIndex; i++) {
    const empty = document.createElement("div");
    calendarGrid.appendChild(empty);
  }

  // Render days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const btn = document.createElement("button");
    btn.textContent = day;

    btn.addEventListener("click", () => {
      const isoDate = date.toISOString().split("T")[0];
      document.getElementById("reschedule-date").value = isoDate;

      console.log("📅 Selected reschedule date:", isoDate);

      // Optional: fetch new time slots here
      if (typeof fetchRescheduleTimeslots === "function") {
        fetchRescheduleTimeslots(isoDate);
      }
    });

    calendarGrid.appendChild(btn);
  }
}



//Open Rescheule popup
async function openReschedulePopup(appt) {
  const businessId = appt.businessId;
  if (!businessId) return alert("Business ID missing");

  // Show the popup
  document.getElementById("popup-reschedule").style.display = "block";

  // Save appointment ID
  document.getElementById("reschedule-appointment-id").value = appt._id;

  // Set date and time
  document.getElementById("reschedule-date").value = appt.date;
  document.getElementById("reschedule-time").value = appt.time;

  // Fetch categories and services together (use your combined route)
  const res = await fetch(`/get-categories-and-services/${businessId}`);
  const { categories, services } = await res.json();

  // Reference dropdowns
  const categoryDropdown = document.getElementById("reschedule-category");
  const serviceDropdown = document.getElementById("reschedule-service");

  // Clear and populate category dropdown
  categoryDropdown.innerHTML = `<option value="">-- Select Category --</option>`;
  categories.forEach(cat => {
    categoryDropdown.innerHTML += `<option value="${cat._id}">${cat.categoryName}</option>`;
  });

  // Find the selected service
  const currentService = services.find(s => s._id === appt.serviceId);
  const currentCategoryId = currentService?.categoryId || "";

  // Pre-select the category
  categoryDropdown.value = currentCategoryId;

  // Function to render services for a category
  function renderServices(categoryId) {
    const filtered = services.filter(s => s.categoryId === categoryId);
    serviceDropdown.innerHTML = filtered.map(service => `
      <option value="${service._id}" ${service._id === appt.serviceId ? "selected" : ""}>
        ${service.serviceName}
      </option>
    `).join("");
  }

  // Render initial services
  renderServices(currentCategoryId);

  // When category changes, re-render services
  categoryDropdown.addEventListener("change", () => {
    renderServices(categoryDropdown.value);
  });
  // ✅ Generate calendar
  generateRescheduleCalendar();
}

function closeReschedulePopup() {
  document.getElementById("reschedule-popup").style.display = "none";
}


//Even Lis6eners for reschedule 
document.getElementById("reschedule-date").addEventListener("change", fetchRescheduleSlots);
document.getElementById("reschedule-service").addEventListener("change", fetchRescheduleSlots);

document.getElementById("reschedule-submit-btn").addEventListener("click", async () => {
  const id = document.getElementById("reschedule-appointment-id").value;
  const date = document.getElementById("reschedule-date").value;
  const time = document.getElementById("reschedule-time").value;
  const serviceId = document.getElementById("reschedule-service").value;

const res = await fetch("/reschedule-appointment", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    appointmentId: id,
    serviceId,          // <-- not newServiceId
    date,               // <-- not newDate
    time                // <-- not newTime
  })
});

  const result = await res.json();
  if (res.ok) {
    alert("✅ Appointment updated!");
    document.getElementById("reschedule-popup").style.display = "none";
    await fetchAndRenderClientAppointments(); // reload new data
  } else {
    alert("❌ " + result.message);
  }
});




//New Calendar 
let newCalendarDate = new Date();

document.addEventListener("DOMContentLoaded", () => {
  buildNewCalendar();

  document.getElementById("new-prev-month").addEventListener("click", () => {
    newCalendarDate.setMonth(newCalendarDate.getMonth() - 1);
    buildNewCalendar();
  });

  document.getElementById("new-next-month").addEventListener("click", () => {
    newCalendarDate.setMonth(newCalendarDate.getMonth() + 1);
    buildNewCalendar();
  });
});

function buildNewCalendar() {
  const grid = document.getElementById("new-calendar-grid");
  const label = document.getElementById("new-month-label");
  const year = newCalendarDate.getFullYear();
  const month = newCalendarDate.getMonth();

  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const pad = first.getDay();
  const days = last.getDate();

  label.textContent = `${first.toLocaleString("default", { month: "long" })} ${year}`;
  grid.innerHTML = "";

  // Add padding
  for (let i = 0; i < pad; i++) {
    const blank = document.createElement("div");
    grid.appendChild(blank);
  }

  // Add days
  for (let day = 1; day <= days; day++) {
     console.log("👉 adding day", day); // 👈 check if this runs
    const date = new Date(year, month, day);
    const iso = date.toISOString().split("T")[0];
    const btn = document.createElement("button");
    btn.textContent = day;
 btn.classList.add("calendar-day-btn");
 
    btn.addEventListener("click", () => {
      document.getElementById("new-selected-date").value = iso;
      document.getElementById("new-date-display").textContent = `📅 New Date Selected: ${iso}`;

      document.querySelectorAll(".calendar-grid button").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");

      // Add timeslot logic or fetch if needed
    });

    grid.appendChild(btn);
  }
}


}); // <--- END OF THE *SINGLE* DOMContentLoaded LISTENER
async function loadMyAppointments() {
  if (!STATE?.user?.loggedIn || !STATE.user.userId) return;
  const res = await API.list("Appointment", {
    Client: STATE.user.userId,
    "is Canceled": false,
    // optionally also: Business: STATE.businessId
  });
  const rows = Array.isArray(res) ? res : (res && res.records) || [];
  renderMyAppointments(rows);
}

function renderMyAppointments(appts) {
  const box = document.getElementById("my-appointments");
  if (!box) return;

  // sort by date/time ascending
  appts.sort((a, b) => {
    const va = a.values || a, vb = b.values || b;
    const da = new Date((va.Date || "") + "T" + (va.Time || "00:00"));
    const db = new Date((vb.Date || "") + "T" + (vb.Time || "00:00"));
    return da - db;
  });

  if (!appts.length) {
    box.innerHTML = `<div class="muted">No upcoming appointments.</div>`;
    return;
  }

  box.innerHTML = appts.map(r => {
    const v = r.values || r;
    const name = v.Name || "Appointment";
    const prettyDate = v.Date ? formatDatePretty(v.Date) : "—";
    const time = v.Time || "—";
    return `
      <div class="card" style="margin-bottom:8px;">
        <div><strong>${escapeHtml(name)}</strong></div>
        <div class="muted">${prettyDate} • ${time}</div>
      </div>
    `;
  }).join("");
}

// call after login or on page load if already logged-in
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("my-appointments")) {
    loadMyAppointments();
  }
});
