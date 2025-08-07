// ------------------- GLOBAL -------------------
let currentEditId = null;
let userId = null;
let currentEditCalendarId = null;

document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ DOM fully loaded");

  // ✅ Check login and get userId
  const res = await fetch("/check-login");
  const result = await res.json();

  if (result.loggedIn) {
    userId = result.userId;

    // ✅ Show greeting
    const headerRight = document.querySelector(".group.right-group");
    if (headerRight) {
      const greeting = document.createElement("div");
      greeting.textContent = `Hey ${result.firstName}`;
      greeting.classList.add("greeting");
      headerRight.prepend(greeting);

      const logoutBtn = document.createElement("button");
      logoutBtn.textContent = "Logout";
      logoutBtn.onclick = async () => {
        await fetch("/logout", { method: "POST" });
        window.location.href = "/signup.html";
      };
      headerRight.appendChild(logoutBtn);
    }

    await loadUserBusinesses();
  }

  // ✅ LOGIN FORM
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value.trim();
      if (!email || !password) return alert("Enter both email and password");

      try {
        const res = await fetch("/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const result = await res.json();
        if (res.ok) {
          alert(`✅ Welcome back, ${result.firstName || "User"}!`);
          closeLoginPopup();
          await loadUserBusinesses();
        } else {
          alert(`❌ ${result.message}`);
        }
      } catch (err) {
        console.error("Login error:", err);
        alert("❌ Something went wrong during login.");
      }
    });
  }

  // ✅ OPEN LOGIN POPUP
  const loginBtn = document.getElementById("open-login-popup-btn");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      document.getElementById("popup-login").style.display = "block";
      document.getElementById("popup-overlay").style.display = "block";
      document.body.classList.add("popup-open");
    });
  }

  // ✅ OPEN ADD BUSINESS POPUP
  const openBizBtn = document.getElementById("open-business-popup-button");
  if (openBizBtn) {
    openBizBtn.addEventListener("click", () => {
      document.getElementById("popup-add-business").style.display = "block";
      document.getElementById("popup-overlay").style.display = "block";
      document.body.classList.add("popup-open");
    });
  }

  // ✅ DEFAULT TAB
  const defaultTab = document.querySelector('.option[data-id="business"]');
  if (defaultTab) defaultTab.click();
});

// ------------------- BUSINESS -------------------
async function loadUserBusinesses() {
  try {
    const res = await fetch("/get-user-businesses");
    const businesses = await res.json();

    const nameCol = document.getElementById("business-name-column");
    const serviceCol = document.getElementById("services-column");
    const clientCol = document.getElementById("clients-column");

    if (nameCol && serviceCol && clientCol) {
      nameCol.innerHTML = "";
      serviceCol.innerHTML = "";
      clientCol.innerHTML = "";

      businesses.forEach(biz => {
        if (!biz.values?.businessName || biz.values.isDeleted) return;

        nameCol.innerHTML += `<div class="clickable-biz-name" data-id="${biz._id}">${biz.values.businessName}</div>`;
        serviceCol.innerHTML += `<div>${biz.values.serviceCount || 0}</div>`;
        clientCol.innerHTML += `<div>${biz.values.clientCount || 0}</div>`;
      });

      document.querySelectorAll(".clickable-biz-name").forEach(el => {
        el.addEventListener("click", () => openEditBusinessPopup(el.dataset.id));
      });
    }

    const dropdowns = document.querySelectorAll(".business-dropdown");
    dropdowns.forEach(dropdown => {
      dropdown.innerHTML = '<option value="">-- Choose Business --</option>';
      businesses.forEach(biz => {
        if (!biz.values?.businessName || biz.values.isDeleted) return;
        const option = document.createElement("option");
        option.value = biz._id;
        option.textContent = biz.values.businessName;
        dropdown.appendChild(option);
      });
    });

  } catch (err) {
    console.error("❌ Failed to load businesses:", err);
  }
}

document.getElementById("save-button").addEventListener("click", async () => {
  const businessName = document.getElementById("business-name").value.trim();
  const yourName = document.getElementById("your-name").value.trim();
  const email = document.getElementById("email").value.trim();

  if (!businessName) return alert("Business Name is required");

  const slug = businessName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "").slice(0, 100);

  const res = await fetch("/add-record", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dataType: "Business",
      values: {
        businessName,
        yourName,
        email,
        slug,
        userId,
        isDeleted: false,
      },
    }),
  });

  const result = await res.json();
  if (res.ok) {
    alert(`✅ Business created with slug: ${result.record.values.slug}`);
    closeAddBusinessPopup();
    await loadUserBusinesses();
  } else {
    alert(`❌ ${result.message}`);
  }
});

async function openEditBusinessPopup(id) {
  try {
    const res = await fetch(`/get-record/Business/${id}`);
    if (!res.ok) {
      const text = await res.text();
      console.error("❌ Failed to fetch business:", text);
      return alert("❌ Could not load business.");
    }

    const data = await res.json();
    const biz = data.record;
    currentEditId = id;

    document.getElementById("business-name").value = biz.values.businessName || "";
    document.getElementById("your-name").value = biz.values.yourName || "";
    document.getElementById("email").value = biz.values.email || "";
    document.getElementById("popup-business-phone-number-input").value = biz.values.phoneNumber || "";
    document.getElementById("popup-business-location-name-input").value = biz.values.locationName || "";
    document.getElementById("popup-business-address-input").value = biz.values.businessAddress || "";
    document.getElementById("popup-business-email-input").value = biz.values.businessEmail || "";

    document.getElementById("popup-title").textContent = "Edit Business";
    document.getElementById("save-button").style.display = "none";
    document.getElementById("update-button").style.display = "inline-block";
    document.getElementById("delete-button").style.display = "inline-block";

    document.getElementById("popup-add-business").style.display = "block";
    document.getElementById("popup-overlay").style.display = "block";
    document.body.classList.add("popup-open");
  } catch (err) {
    console.error("❌ Failed to open edit popup:", err);
    alert("Something went wrong.");
  }
}

// ------------------- CALENDAR -------------------
async function loadCalendarsForBusiness(businessId) {
  try {
    const res = await fetch("/get-records/Calendar");
    const calendars = await res.json();

    const calendarCol = document.getElementById("calendar-name-column");
    calendarCol.innerHTML = "";

    calendars.forEach(calendar => {
      if (!calendar.values?.calendarName || calendar.values.isDeleted) return;
      if (calendar.values.businessId === businessId) {
        calendarCol.innerHTML += `<div>${calendar.values.calendarName}</div>`;
      }
    });

  } catch (err) {
    console.error("❌ Failed to load calendars:", err);
  }
}

const bizDropdown = document.getElementById("business-dropdown");
if (bizDropdown) {
  bizDropdown.addEventListener("change", () => {
    const selectedId = bizDropdown.value;
    const selectedText = bizDropdown.options[bizDropdown.selectedIndex].text;
    document.getElementById("selected-business-name").textContent = selectedText;
    loadCalendarsForBusiness(selectedId);
  });
}

// ------------------- TAB SWITCHING -------------------
const tabs = document.querySelectorAll(".option");
const sections = {
  business: document.getElementById("business-section"),
  calendar: document.getElementById("calendar-section"),
  category: document.getElementById("category-section"),
  service: document.getElementById("service-section"),
  booking: document.getElementById("booking-section"),
};

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    const selectedId = tab.dataset.id;
    Object.values(sections).forEach(section => section.style.display = "none");
    tabs.forEach(t => t.classList.remove("active"));
    if (sections[selectedId]) {
      sections[selectedId].style.display = "block";
      tab.classList.add("active");
    }
  });
});

// ------------------- POPUP HELPERS -------------------
function closeLoginPopup() {
  document.getElementById("popup-login").style.display = "none";
  document.getElementById("popup-overlay").style.display = "none";
  document.body.classList.remove("popup-open");
}

function closeAddBusinessPopup() {
  document.getElementById("popup-add-business").style.display = "none";
  document.getElementById("popup-overlay").style.display = "none";
  document.body.classList.remove("popup-open");
}

window.closeLoginPopup = closeLoginPopup;
window.closeAddBusinessPopup = closeAddBusinessPopup;
