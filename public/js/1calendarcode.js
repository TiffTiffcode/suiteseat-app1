// ─── Globals ─────────────────────────────────────────────────────
let currentUserId     = null;
let currentCalendarId = null;

// ─── Entry Point ─────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  // 1) Login check
  const loginStatus = document.getElementById("login-status");
  try {
    const res  = await fetch("/check-login");
    const data = await res.json();
    if (data.loggedIn) {
      currentUserId = data.userId;
      loginStatus.innerHTML = `Welcome back, <strong>${data.firstName}</strong> 👋`;
    }
  } catch (err) {
    console.error("Login check failed:", err);
  }

  // 2) Initial data load
  await fetchBusinesses();            // your existing business list
  await fetchCalendars();             // calendar list
  await populateBusinessMenuDropdown();

  // 3) Calendar popup open
  const openCalBtn  = document.getElementById("open-calendar-button");
  const popupOverlay = document.getElementById("popup-overlay");
  openCalBtn.addEventListener("click", async () => {
    await populateCalendarBusinessDropdown();
    // reset for create
    document.getElementById("popup-calendar-name-input").value = "";
    document.getElementById("dropdown-calendar-business").value = "";
    // toggle buttons
    document.getElementById("save-calendar-button").style.display   = "inline-block";
    document.getElementById("update-calendar-button").style.display = "none";
    document.getElementById("delete-calendar-button").style.display = "none";
    openAddCalendarPopup();
  });
  popupOverlay.addEventListener("click", closeAddCalendarPopup);

  // 4) Calendar form buttons
  const saveCalBtn   = document.getElementById("save-calendar-button");
  const updateCalBtn = document.getElementById("update-calendar-button");
  const deleteCalBtn = document.getElementById("delete-calendar-button");

  saveCalBtn.addEventListener("click", async e => {
    e.preventDefault();
    await saveCalendar();
  });

  updateCalBtn.addEventListener("click", async e => {
    e.preventDefault();
    await updateCalendar();
  });

  deleteCalBtn.addEventListener("click", async e => {
    e.preventDefault();
    if (!currentCalendarId) return alert("No calendar selected.");
    if (!confirm("Delete this calendar?")) return;
    await deleteCalendar();
  });
});

// ─── Helpers: Popup Controls ─────────────────────────────────────
function openAddCalendarPopup() {
  document.getElementById("popup-add-calendar").style.display = "block";
  document.getElementById("popup-overlay")     .style.display = "block";
  document.body.classList.add("popup-open");
}
function closeAddCalendarPopup() {
  document.getElementById("popup-add-calendar").style.display = "none";
  document.getElementById("popup-overlay")     .style.display = "none";
  document.body.classList.remove("popup-open");
}

// ─── Fetch & Render Calendars ───────────────────────────────────
async function fetchCalendars() {
  try {
    const res       = await fetch("/get-calendars");
    if (!res.ok) throw new Error("Failed to load calendars");
    const calendars = await res.json();

    const nameCol  = document.getElementById("calendar-name-column");
    const countCol = document.getElementById("calendars-column");
    nameCol.innerHTML  = "";
    countCol.innerHTML = "";

    if (calendars.length) {
      calendars.forEach(cal => {
        // a) render row
        const nameDiv = document.createElement("div");
        const rawName = cal.calendarName ?? cal.values?.calendarName;
        nameDiv.textContent = rawName || "Untitled";
        nameCol.appendChild(nameDiv);

        const countDiv = document.createElement("div");
        countDiv.textContent = (cal.values?.appointments?.length ?? 0);
        countCol.appendChild(countDiv);

        // b) click → edit mode
        nameDiv.addEventListener("click", async () => {
          currentCalendarId = cal._id;
          await populateCalendarBusinessDropdown();
          document.getElementById("dropdown-calendar-business").value      = cal.businessId;
          document.getElementById("popup-calendar-name-input").value     = rawName;
          document.getElementById("save-calendar-button").style.display   = "none";
          document.getElementById("update-calendar-button").style.display = "inline-block";
          document.getElementById("delete-calendar-button").style.display = "inline-block";
          openAddCalendarPopup();
        });
      });
    } else {
      nameCol.textContent  = "No calendars available";
      countCol.textContent = "";
    }

    document.getElementById("calendar-section").style.display = "block";
  } catch (err) {
    console.error("Error fetching calendars:", err);
  }
}

// ─── CRUD Helpers ────────────────────────────────────────────────
async function saveCalendar() {
  const businessId = document.getElementById("dropdown-calendar-business").value;
  const name       = document.getElementById("popup-calendar-name-input").value.trim();
  if (!businessId) return alert("Please choose a business.");
  if (!name)       return alert("Please enter a calendar name.");

  try {
    const res = await fetch("/create-calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, calendarName: name })
    });
    if (!res.ok) throw new Error(await res.text());
    alert("✅ Calendar saved!");
    closeAddCalendarPopup();
    await fetchCalendars();
  } catch (err) {
    console.error("Error saving calendar:", err);
    alert(err.message);
  }
}

async function updateCalendar() {
  if (!currentCalendarId) return alert("No calendar selected.");
  const businessId = document.getElementById("dropdown-calendar-business").value;
  const name       = document.getElementById("popup-calendar-name-input").value.trim();
  if (!businessId) return alert("Please choose a business.");
  if (!name)       return alert("Please enter a calendar name.");

  try {
    const res = await fetch(`/update-calendar/${currentCalendarId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, calendarName: name })
    });
    if (!res.ok) throw new Error((await res.json()).message);
    alert("✏️ Calendar updated!");
    closeAddCalendarPopup();
    await fetchCalendars();
  } catch (err) {
    console.error("Error updating calendar:", err);
    alert(err.message);
  }
}

async function deleteCalendar() {
  if (!currentCalendarId) return alert("No calendar selected.");
  try {
    const res = await fetch(`/delete-calendar/${currentCalendarId}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error((await res.json()).message);
    alert("🗑️ Calendar deleted!");
    closeAddCalendarPopup();
    await fetchCalendars();
  } catch (err) {
    console.error("Error deleting calendar:", err);
    alert(err.message);
  }
}

// ─── Business & Menu Helpers (your existing code) ───────────────
async function fetchBusinesses() { /* … */ }
async function populateBusinessMenuDropdown() { /* … */ }
async function populateCalendarBusinessDropdown() { /* … */ }
function openBusinessPopup() { /* … */ }
function openBusinessPopupForEdit(id) { /* … */ }







//////////////////////////////////////////Log In set up 
document.addEventListener("DOMContentLoaded", async () => {
  const loginStatus = document.getElementById("login-status");
  const openLoginBtn = document.getElementById("open-login-popup-btn");
  const logoutBtn = document.getElementById("logout-btn");


  

  // Tab Switching
  const optionTabs = document.querySelectorAll(".option");
  const tabSections = document.querySelectorAll("[id$='-section']");

  optionTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      optionTabs.forEach(t => t.classList.remove("active"));
      tabSections.forEach(section => section.style.display = "none");

      tab.classList.add("active");
      const targetId = `${tab.dataset.id}-section`;
      const section = document.getElementById(targetId);
      if (section) section.style.display = "block";
    });
  });

  // Check if the user is logged in
 async function checkLogin() {
  try {
    const res    = await fetch("/check-login");
    const result = await res.json();

    if (result.loggedIn) {
      currentUserId = result.userId;      // ← set the global here
      loginStatus.innerHTML = `
        Welcome back, <strong>${result.firstName}</strong> 👋
        <button id="logout-btn">Logout</button>
      `;
      // …logout binding…
    }
  } catch (err) {
    console.error("Login check failed:", err);
  }
}


  await checkLogin();

  // Open login popup
  if (openLoginBtn) {
    openLoginBtn.addEventListener("click", () => {
      document.getElementById("popup-login").style.display = "block";
      document.getElementById("popup-overlay").style.display = "block";
      document.body.classList.add("popup-open");
    });
  }

  // Handle login form submission
  const loginForm = document.getElementById("login-form");
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
          closeLoginPopup(); // Close the login popup
          location.reload(); // Refresh the page to update the UI
        } else {
          alert(result.message || "Login failed.");
        }
      } catch (err) {
        console.error("Login error:", err);
        alert("Something went wrong.");
      }
    });
  }
///////////////////////////////////////////////////
                           //Category

////////////////////////////End of DOM //////////////////////////////////////////////////
   });
  

