    // ------------------- GLOBAL -------------------
let currentEditId = null; // Track which business is being edited

document.addEventListener("DOMContentLoaded", async () => {
 console.log("✅ DOM fully loaded");
 await loadBusinessList();

 // ✅ Setup dropdown change to show public URL
 const dropdown = document.getElementById("business-dropdown");
 if (dropdown) {
  dropdown.addEventListener("change", () => {
   const selectedOption = dropdown.options[dropdown.selectedIndex];
   const slug = selectedOption.dataset.slug;

   if (!slug) return;

   const fullUrl = `${window.location.origin}/${slug}`;
   const urlContainer = document.getElementById("public-url-container");
   const urlSpan = document.getElementById("public-url");
   const viewBtn = document.getElementById("view-public-page-button");

   if (urlContainer && urlSpan && viewBtn) {
    urlSpan.textContent = fullUrl;
    viewBtn.onclick = () => window.open(fullUrl, "_blank");
    urlContainer.style.display = "flex";
   }
  });
 }

 
 // ✅ Handle login
 const loginForm = document.getElementById("login-form");
 if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
   e.preventDefault();
   const email = document.getElementById("login-email").value.trim();
   const password = document.getElementById("login-password").value.trim();
   if (!email || !password) return alert("Enter both email and password.");

   try {
    const res = await fetch("/login", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ email, password }),
    });

    const result = await res.json();
    if (result.success) {
     alert("✅ Logged in!");
     closeLoginPopup();
     location.reload();
    } else {
     alert("❌ Invalid login.");
    }
   } catch (err) {
    console.error("❌ Login error:", err);
   }
  });
 }

 // ✅ Greeting
 try {
  const res = await fetch("/check-login");
  const data = await res.json();
  if (data.loggedIn && data.firstName) {
   const greetingEl = document.getElementById("user-greeting");
   if (greetingEl) {
    greetingEl.textContent = `Hey ${data.firstName} 👋`;
   }
  }
 } catch (err) {
  console.error("⚠️ Failed to fetch login info:", err);
 }
});



// ✅ Add Business
document.getElementById("popup-add-business-form").addEventListener("submit", async function (e) {
 e.preventDefault();

 const businessName = document.getElementById("popup-business-name-input").value.trim();
 const yourName = document.getElementById("popup-your-name-input").value.trim();
 const phone = document.getElementById("popup-business-phone-number-input").value.trim();
 const locationName = document.getElementById("popup-business-location-name-input").value.trim();
 const address = document.getElementById("popup-business-address-input").value.trim();
 const email = document.getElementById("popup-business-email-input").value.trim();

 if (!businessName || !yourName || !locationName || !address) {
   document.body.classList.remove("popup-open");
  return alert("❌ Please fill in all required fields.");
 }

 const slug = businessName.toLowerCase()
  .replace(/\s+/g, "-")
  .replace(/[^a-z0-9\-]/g, "")
  .slice(0, 100);

 try {
  const check = await fetch("/get-records", {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({
    dataType: "Business",
    filter: { "values.slug": slug }
   })
  });

  const matches = await check.json();
  if (matches.length > 0) {
   return alert("❌ A business with this name already exists.");
  }

  const res = await fetch("/add-record", {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({
    dataType: "Business",
    values: {
     businessName,
     yourName,
     phone,
     locationName,
     address,
     email,
     slug,
     headerImage: "",
     isDeleted: false
    }
   })
   
  });

  const result = await res.json();

  if (result.record) {
   alert("✅ Business saved!");
   closeAddBusinessPopup();
   await loadBusinessList();
  } else {
   alert(result.message || "❌ Failed to save business.");
  }

 } catch (err) {
  console.error("❌ Error saving business:", err);
  alert("Something went wrong.");
 }
});


// ✅ Load Business List + Dropdown
async function loadBusinessList() {
 try {
  const res = await fetch("/get-records/Business");
  const businesses = await res.json();

  const nameCol = document.getElementById("business-name-column");
  const servicesCol = document.getElementById("services-column");
  const clientsCol = document.getElementById("clients-column");
  const dropdown = document.getElementById("business-dropdown");

  if (!nameCol || !servicesCol || !clientsCol || !dropdown) return;

  nameCol.innerHTML = "";
  servicesCol.innerHTML = "";
  clientsCol.innerHTML = "";
  dropdown.innerHTML = '<option value="">-- Select Business --</option>';

  for (const biz of businesses) {
   const bizId = biz._id;
   const bizName = biz.values.businessName || "Untitled";

   // Add to dropdown
   const option = document.createElement("option");
   option.value = bizId;
   option.textContent = bizName;
   option.dataset.slug = biz.values.slug;
   dropdown.appendChild(option);

   // Show in section
   const nameDiv = document.createElement("div");
nameDiv.textContent = bizName;
nameDiv.classList.add("clickable-business");
nameDiv.style.cursor = "pointer";

nameDiv.addEventListener("click", () => {
 openBusinessPopupWithData(biz);
});

nameCol.appendChild(nameDiv);




   // Service count
   const servicesRes = await fetch("/get-records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
     dataType: "Service",
     filter: { "values.businessId": bizId }
    })
   });
   const services = await servicesRes.json();
   const servicesDiv = document.createElement("div");
   servicesDiv.textContent = services.length;
   servicesCol.appendChild(servicesDiv);

   // Client count
   const clientsRes = await fetch("/get-records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
     dataType: "Client",
     filter: { "values.businessId": bizId }
    })
   });
   const clients = await clientsRes.json();
   const clientsDiv = document.createElement("div");
   clientsDiv.textContent = clients.length;
   clientsCol.appendChild(clientsDiv);
  }

  // Auto-select first business
  if (dropdown.options.length > 1) {
   dropdown.selectedIndex = 1;
   dropdown.dispatchEvent(new Event("change"));
  }

 } catch (err) {
  console.error("❌ Failed to load businesses:", err);
  alert("Could not load your businesses.");
 }
}
const options = document.querySelectorAll(".option");
const sections = document.querySelectorAll(".tab-section");

options.forEach(option => {
 option.addEventListener("click", () => {
  const selectedId = option.dataset.id;

  // Highlight active tab
  options.forEach(o => o.classList.remove("active"));
  option.classList.add("active");

  // Show selected section, hide others
  sections.forEach(section => {
   section.style.display = section.id === `${selectedId}-section` ? "block" : "none";
  });
 });



    
                                      // Popup
 // ✅ Open Business popup
 const openBusinessBtn = document.getElementById("open-business-popup-button");
 const businessPopup = document.getElementById("popup-add-business");

 if (openBusinessBtn && businessPopup) {
  openBusinessBtn.addEventListener("click", () => {
   openAddBusinessPopup();
  });
 }
// Resets Add Business Popup 
function openAddBusinessPopup() {
 currentEditId = null;

 document.getElementById("popup-business-name-input").value = "";
 document.getElementById("popup-your-name-input").value = "";
 document.getElementById("popup-business-phone-number-input").value = "";
 document.getElementById("popup-business-location-name-input").value = "";
 document.getElementById("popup-business-address-input").value = "";
 document.getElementById("popup-business-email-input").value = "";

 // Toggle buttons
 document.getElementById("save-button").style.display = "inline-block";
 document.getElementById("update-button").style.display = "none";
 document.getElementById("delete-button").style.display = "none";

 document.getElementById("popup-add-business").style.display = "block";
 document.getElementById("popup-overlay").style.display = "block";
 document.body.classList.add("popup-open");
}
document.getElementById("update-button").addEventListener("click", async () => {
 if (!currentEditId) return alert("No business selected for update.");

 const businessName = document.getElementById("popup-business-name-input").value.trim();
 const yourName = document.getElementById("popup-your-name-input").value.trim();
 const phone = document.getElementById("popup-business-phone-number-input").value.trim();
 const locationName = document.getElementById("popup-business-location-name-input").value.trim();
 const address = document.getElementById("popup-business-address-input").value.trim();
 const email = document.getElementById("popup-business-email-input").value.trim();

 if (!businessName || !yourName || !locationName || !address) {
   document.body.classList.remove("popup-open");
  return alert("❌ Please fill in all required fields.");
 }

 const slug = businessName.toLowerCase()
  .replace(/\s+/g, "-")
  .replace(/[^a-z0-9\-]/g, "")
  .slice(0, 100);

 try {
  const res = await fetch(`/update-record/${currentEditId}`, {
   method: "PUT",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({
    values: {
     businessName,
     yourName,
     phone,
     locationName,
     address,
     email,
     slug,
    }
   }),
  });

  const result = await res.json();

  if (result.record) {
      alert("✅ Business updated!");
      closeAddBusinessPopup();
      await loadUserBusinesses();
      await loadBusinessList();
        currentEditId = null;
   document.body.classList.remove("popup-open"); 
  } else {
   alert(result.message || "❌ Failed to update business.");
  }

 } catch (err) {
  console.error("❌ Error updating business:", err);
  alert("Something went wrong.");
 }
});

// DELETE BUSINESS
document.getElementById("delete-button").addEventListener("click", async () => {
   if (!currentEditId) return alert("No business selected to delete.");

  
   const confirmed = confirm("Are you sure you want to delete this business?");
if (!confirmed) return; // Don't do anything if not confirmed


 try {
  const res = await fetch(`/delete-record/${currentEditId}`, {
   method: "DELETE",
  });

  const result = await res.json();

if (result.message === "Record deleted") {
  document.body.classList.remove("popup-open"); // 👈 Add this line
  closeAddBusinessPopup();
   alert("✅ Business deleted!");
  await loadBusinessList();
  } else {
   alert(result.message || "❌ Failed to delete business.");
  }

 } catch (err) {
  console.error("❌ Error deleting business:", err);
  alert("Something went wrong.");
 }
});


// Open Calendar Popup
const openCalendarBtn = document.getElementById("open-calendar-popup-button");
const calendarPopup = document.getElementById("popup-add-calendar");
const overlay = document.getElementById("popup-overlay");

if (openCalendarBtn && calendarPopup && overlay) {
  openCalendarBtn.addEventListener("click", () => {
    loadBusinessOptionsForCalendar(); // ⬅️ Load businesses
    calendarPopup.style.display = "block";
    overlay.style.display = "block";
    document.body.classList.add("popup-open");
  });
}



// Inside Dom
});
// Outside of DOm
// ✅ Helpers
function closeLoginPopup() {
 const popup = document.getElementById("popup-login");
 popup.style.display = "none";
 document.body.classList.remove("popup-open");
}

function closeAddBusinessPopup() {
 const popup = document.getElementById("popup-add-business");
 popup.style.display = "none";
 document.body.classList.remove("popup-open");
}

function closeAddCalendarPopup() {
  const popup = document.getElementById("popup-add-calendar");
  const overlay = document.getElementById("popup-overlay");

  popup.style.display = "none";
  overlay.style.display = "none";
  document.body.classList.remove("popup-open");
}

function openBusinessPopupWithData(biz) {
  currentEditId = biz._id;

  // Fill in all the inputs
  document.getElementById("popup-business-name-input").value = biz.values.businessName || "";
  document.getElementById("popup-your-name-input").value = biz.values.yourName || "";
  document.getElementById("popup-business-phone-number-input").value = biz.values.phone || "";
  document.getElementById("popup-business-location-name-input").value = biz.values.locationName || "";
  document.getElementById("popup-business-address-input").value = biz.values.address || "";
  document.getElementById("popup-business-email-input").value = biz.values.email || "";

  // Toggle buttons
  document.getElementById("save-button").style.display = "none";
  document.getElementById("update-button").style.display = "inline-block";
  document.getElementById("delete-button").style.display = "inline-block";

  // Show the popup
  document.getElementById("popup-add-business").style.display = "block";
  document.getElementById("popup-overlay").style.display = "block";
  document.body.classList.add("popup-open");
}

// filter Businesses in the Calendar popup 
async function loadBusinessOptionsForCalendar() {
  try {
    const res = await fetch("/get-records/Business");
    const businesses = await res.json();

    const dropdown = document.getElementById("dropdown-calendar-business");
    dropdown.innerHTML = '<option value="">-- Select --</option>'; // Reset first

    businesses.forEach(biz => {
      if (!biz.values?.businessName || biz.values?.isDeleted) return;

      const option = document.createElement("option");
      option.value = biz._id;
      option.textContent = biz.values.businessName;
      dropdown.appendChild(option);
    });
  } catch (err) {
    console.error("❌ Failed to load businesses for calendar:", err);
    alert("Could not load business options.");
  }
}

// Save Calendar to business 
document.getElementById("save-calendar-button").addEventListener("click", async () => {
  const businessId = document.getElementById("dropdown-calendar-business").value;
  const calendarName = document.getElementById("popup-calendar-name-input").value.trim();

  if (!businessId || !calendarName) {
    return alert("❌ Please select a business and enter a calendar name.");
  }

  try {
    
    const res = await fetch("/add-record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dataType: "Calendar",
        values: {
          businessId,
          calendarName,
          isDeleted: false
        }
      })
    });

    const result = await res.json();

    if (result.record) {
      alert("✅ Calendar saved!");
      closeAddCalendarPopup();
      await loadCalendarList();
    } else {
      alert(result.message || "❌ Failed to save calendar.");
    }
  } catch (err) {
    console.error("❌ Error saving calendar:", err);
    alert("Something went wrong.");
  }
});
