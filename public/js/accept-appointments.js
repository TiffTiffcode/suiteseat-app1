// At the very top of your JS file (outside DOMContentLoaded)
let currentUserId = null;

//Menu Global
let allBusinesses = [];
let selectedBusinessNameElement;

//Business Global
let openBusinessPopupButton; 
let addBusinessPopup;        
let popupOverlay; 

let currentEditBusinessId = null;

//Calendar Global 
let currentEditCalendarId = null;

//Category Global 
let currentEditCategoryId = null;

//Server Global
let currentEditingServiceId = null;


document.addEventListener("DOMContentLoaded", async () => {
 const loginStatus = document.getElementById("login-status-text");
    const openLoginBtn = document.getElementById("open-login-popup-btn");
    const logoutBtn = document.getElementById("logout-btn");
    
    // 🔒 Check login status and show/hide logout button
fetch("/check-login")
  .then(res => res.json())
  .then(data => {
    if (data.loggedIn) {
      loginStatus.textContent = `Hi, ${data.firstName} 👋`;
      logoutBtn.style.display = "inline-block";
      openLoginBtn.style.display = "none";  
    } else {
      loginStatus.textContent = "Not logged in";
      logoutBtn.style.display = "none";
      openLoginBtn.style.display = "inline-block";
    }
  });

  // 🔓 Handle logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        const res = await fetch("/logout");
        const result = await res.json();

        if (res.ok) {
          alert("👋 Logged out!");
          window.location.href = "signup.html"; // Redirect to homepage
        } else {
          alert(result.message || "Logout failed.");
        }
      } catch (err) {
        console.error("Logout error:", err);
        alert("Something went wrong during logout.");
      }
    });
  }
    
    

  // Check if the user is logged in
 async function checkLogin() {
  try {
    const res    = await fetch("/check-login");
    const result = await res.json();

    if (result.loggedIn) {
      currentUserId = result.userId;      // ← set the global here
      // …logout binding…
    }
  } catch (err) {
    console.error("Login check failed:", err);
  }
}


  await checkLogin();
await loadUserBusinesses();
await loadBusinessDropdown();
await loadCalendars();
await loadCategoryList();
await loadServiceList();

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

  setTimeout(() => {
  const openBtn = document.getElementById("open-service-popup-button");
  const updateBtn = document.getElementById("update-service-button");
  const deleteBtn = document.getElementById("delete-service-button");

  if (openBtn) {
    openBtn.addEventListener("click", openAddServicePopup);
  }

  if (updateBtn) {
    updateBtn.addEventListener("click", handleUpdateService);
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", handleDeleteService); // if you have this
  }
}, 0);

//Menu Section
document.getElementById("business-dropdown").addEventListener("change", async (e) => {
  const selectedBusinessId = e.target.value;

 const serviceCalDropdownWrapper = document.getElementById("service-section-calendar-dropdown-wrapper");
 
 if (!selectedBusinessId) {
    document.getElementById("selected-business-name").textContent = "Choose business to manage";
    document.getElementById("calendar-dropdown-wrapper").style.display = "none";
    serviceCalDropdownWrapper.style.display = "none";
    return;
  }

 // ✅ Show both calendar dropdowns now
  document.getElementById("calendar-dropdown-wrapper").style.display = "block";
  serviceCalDropdownWrapper.style.display = "block";

  // Update header
  const selectedName = e.target.options[e.target.selectedIndex]?.textContent;
  document.getElementById("selected-business-name").textContent = selectedName || "Choose business to manage";

  // 🟢 2. Load related sections
  loadCalendars(selectedBusinessId);
  loadCategoryList(selectedBusinessId);
  loadServiceList(selectedBusinessId);
  populateCategoryCalendarDropdown(selectedBusinessId);
 populateMainCategoryCalendarDropdown(selectedBusinessId);
populateServiceSectionCalendarDropdown(selectedBusinessId);
});




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

    // ⬇️ NEW: If Booking tab is clicked, bind Save Template logic
    if (targetId === "booking-section") {
      attachSaveTemplateLogic();
    }
  });
});

  //////////////////////////////////////////////////////////////////////////////////////
                                //Menu Section 
 async function loadBusinessDropdown() {
  try {
    const res = await fetch("/get-records/Business");
    const businesses = await res.json();

    const dropdown = document.getElementById("business-dropdown");
    const nameDisplay = document.getElementById("selected-business-name");

    dropdown.innerHTML = '<option value="">-- Choose Business --</option>';
    const businessMap = {};

    businesses.forEach(biz => {
      const option = document.createElement("option");
      option.value = biz._id;
      option.textContent = biz.values?.businessName || "(Unnamed Business)";
      dropdown.appendChild(option);
      businessMap[biz._id] = biz;
    });

  } catch (err) {
    console.error("❌ Failed to load business dropdown:", err);
    alert("Could not load businesses for dropdown.");
  }
}

//////////////////////////////////////////////////////////////////////////////////////
                                //Business 
  const openPopupButton = document.getElementById('open-business-popup-button');
    const popup = document.getElementById('popup-add-business');
    const closePopupButton = document.querySelector('#popup-add-business .business-section-header button'); // Select the close button by its parent and type
    const popupForm = document.getElementById('popup-add-business-form'); // Get the form itself
    const saveButton = document.getElementById('save-button'); // The save button
    const imageUploadInput = document.getElementById('image-upload'); // The file input


 //Show Add Business Popup 
const openBusinessPopupButton = document.getElementById("open-business-popup-button");
const addBusinessPopup = document.getElementById("popup-add-business");
const popupOverlay = document.getElementById("popup-overlay");

    // --- Event Listener ---
    // Add this event listener anywhere after the element assignments,
    // preferably grouped with other event listeners.
    if (openBusinessPopupButton) {
        openBusinessPopupButton.addEventListener("click", () => {
            // Check if the elements exist before trying to change their style
            if (addBusinessPopup) {
                addBusinessPopup.style.display = 'block'; // Show the popup
            }
            if (popupOverlay) {
                popupOverlay.style.display = 'block'; // Show the background overlay
            }
            document.body.classList.add("popup-open"); // Add a class to body to prevent scrolling
        });
    }

    async function loadUserBusinesses() {
  try {
    const res = await fetch("/get-records/Business");
    const businesses = await res.json();

    // ✅ Grab all the column containers first
    const nameCol = document.getElementById("business-name-column");
    const servicesCol = document.getElementById("services-column");
    const clientsCol = document.getElementById("clients-column");
    const gotoCol = document.getElementById("goto-column");

    // ✅ Clear all columns
    nameCol.innerHTML = "";
    servicesCol.innerHTML = "";
    clientsCol.innerHTML = "";
    gotoCol.innerHTML = "";

    // ✅ If there are no businesses, show the full-screen popup
    if (businesses.length === 0) {
      const popup = document.getElementById("popup-add-business");
      const overlay = document.getElementById("popup-overlay");

      popup.classList.add("fullscreen");
      popup.setAttribute("data-force", "true");
      popup.style.display = "block";
      overlay.style.display = "block";
      document.body.classList.add("popup-open");
      return;
    }

    // ✅ Render each business
for (const biz of businesses) {
  const values = biz.values || {};

  // 👉 Business Name
  const nameDiv = document.createElement("div");
  nameDiv.textContent = values.businessName || "(No name)";
  nameDiv.classList.add("business-name-entry");
  nameDiv.addEventListener("click", () => {
    openBusinessEditPopup(biz);
  });

  // 👉 Number of Services
  const servicesDiv = document.createElement("div");
  try {
    const serviceRes = await fetch(`/get-service-count?businessId=${biz._id}`);
    const { count: serviceCount } = await serviceRes.json();
    servicesDiv.textContent = serviceCount ?? 0;
  } catch (err) {
    console.error("Error fetching services:", err);
    servicesDiv.textContent = "0";
  }

  // 👉 Number of Clients
  const clientsDiv = document.createElement("div");
  try {
    const clientRes = await fetch(`/get-client-count?businessId=${biz._id}`);
    const { count: clientCount } = await clientRes.json();
    clientsDiv.textContent = clientCount ?? 0;
  } catch (err) {
    console.error("Error fetching clients:", err);
    clientsDiv.textContent = "0";
  }

  // 👉 Go To ↗️ Button
  const gotoDiv = document.createElement("div");
  gotoDiv.classList.add("goto-arrow");
  gotoDiv.innerHTML = "↗️";
  gotoDiv.title = "Visit Booking Page";

  gotoDiv.addEventListener("click", () => {
    const rawName = values.businessName || "";
    const businessSlug = rawName
      .toLowerCase()
      .replace(/'/g, "")         
      .replace(/\s+/g, "-")      
      .replace(/[^a-z0-9\-]/g, ""); 

    window.open(`/${businessSlug}`, "_blank");
  });

  // ✅ Append to columns
  nameCol.appendChild(nameDiv);
  servicesCol.appendChild(servicesDiv);
  clientsCol.appendChild(clientsDiv);
  gotoCol.appendChild(gotoDiv);
}



  } catch (err) {
    console.error("❌ Failed to load businesses:", err);
    alert("Could not load businesses.");
  }
}

///Stops duplicate business names 
 document.getElementById("popup-business-name-input").addEventListener("blur", () => {
  const nameInput = document.getElementById("popup-business-name-input").value.trim().toLowerCase();
  const dropdown = document.getElementById("business-dropdown");
  const options = Array.from(dropdown.options).map(opt => opt.textContent.toLowerCase());

  const warning = document.getElementById("business-name-warning");

  if (options.includes(nameInput)) {
    warning.style.display = "block";
  } else {
    warning.style.display = "none";
  }
});

               //Booking Page Section 
 
  

//Save Business 
const form = document.getElementById("popup-add-business-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
const businessNameInput = document.getElementById("popup-business-name-input").value.trim().toLowerCase();
const dropdownOptions = Array.from(document.getElementById("business-dropdown").options).map(opt =>
  opt.textContent.toLowerCase()
);
const warning = document.getElementById("business-name-warning");

if (dropdownOptions.includes(businessNameInput)) {
  warning.style.display = "block";
  document.getElementById("popup-business-name-input").focus();
  return;
} else {
  warning.style.display = "none";
}


   const formData = new FormData();
const values = {
  businessName: document.getElementById("popup-business-name-input").value.trim(),
  yourName: document.getElementById("popup-your-name-input").value.trim(),
  phoneNumber: document.getElementById("popup-business-phone-number-input").value.trim(),
  locationName: document.getElementById("popup-business-location-name-input").value.trim(),
  businessAddress: document.getElementById("popup-business-address-input").value.trim(),
  businessEmail: document.getElementById("popup-business-email-input").value.trim(),
};

// Append as a JSON string so your server can parse it
formData.append("values", JSON.stringify(values));

// Add the image file
const fileInput = document.getElementById("image-upload");
if (fileInput.files.length > 0) {
  formData.append("heroImage", fileInput.files[0]);
}
 // this automatically grabs all fields and file inputs
    const saveBtn = document.getElementById("save-button");
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    try {
      const res = await fetch("/create-business", {
        method: "POST",
        body: formData, // includes all form inputs and the file
      });

      const result = await res.json();

      if (res.ok) {
        alert("✅ Business saved!");
        document.getElementById("popup-add-business").removeAttribute("data-force");
        closeAddBusinessPopup();
        form.reset();
        loadUserBusinesses(); // refresh your list of businesses (if you already have this)
 await populateBusinessDropdown(true);

// Auto-select the latest option (last <option> added)
const dropdown = document.getElementById("business-dropdown");
const lastOption = dropdown.options[dropdown.options.length - 1];

if (lastOption && lastOption.value) {
  dropdown.value = lastOption.value;
  document.getElementById("selected-business-name").textContent = lastOption.textContent;
}

    } else {
        alert("❌ Error: " + (result.message || "Could not save business."));
      }
    } catch (err) {
      console.error("❌ Failed to save business:", err);
      alert("❌ Server error. Please try again.");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Business";
    }
  });

  //Show image preview im Add Business popup 
  document.getElementById("image-upload").addEventListener("change", function () {
  const file = this.files[0];
  const preview = document.getElementById("current-hero-image");
  const noImageText = document.getElementById("no-image-text");

  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      preview.src = e.target.result;
      preview.style.display = "block";
      noImageText.style.display = "none";
    };
    reader.readAsDataURL(file);
  } else {
    preview.src = "";
    preview.style.display = "none";
    noImageText.style.display = "block";
  }
});


  //Update Businesses 
// ✅ Update Businesses
document.getElementById("update-button").addEventListener("click", async () => {
  if (!currentEditBusinessId) {
    return alert("No business selected to update.");
  }

  const form = document.getElementById("popup-add-business-form");
  const formData = new FormData(form); // captures all fields including file input

  const updateBtn = document.getElementById("update-button");
  updateBtn.disabled = true;
  updateBtn.textContent = "Updating...";

  try {
    const res = await fetch(`/update-business/${currentEditBusinessId}`, {
      method: "PUT",
      body: formData,
    });

    const result = await res.json();

    if (res.ok) {
      alert("✅ Business updated!");
      closeAddBusinessPopup();
      form.reset();
      await populateBusinessDropdown(true);
      loadUserBusinesses(); // refresh list

      // ✅ Check if the slug changed and update URL (no redirect)
      const updatedSlug = result.slug;
      const oldSlug = window.location.pathname.slice(1);
      if (updatedSlug && updatedSlug !== oldSlug) {
        console.log("🔁 Updating slug in address bar:", oldSlug, "→", updatedSlug);
        window.history.replaceState(null, "", `/${updatedSlug}`);
      }

    } else {
      alert("❌ " + (result.message || "Update failed."));
    }
  } catch (err) {
    console.error("❌ Error updating business:", err);
    alert("Server error while updating.");
  } finally {
    updateBtn.disabled = false;
    updateBtn.textContent = "Update";
  }
});


//Delete Business
document.getElementById("delete-button").addEventListener("click", async () => {
  if (!currentEditBusinessId) {
    return alert("No business selected to delete.");
  }

  const confirmDelete = confirm("Are you sure you want to delete this business? This will also delete its calendars, categories, and services.");
  if (!confirmDelete) return;

  const deleteBtn = document.getElementById("delete-button");
  deleteBtn.disabled = true;
  deleteBtn.textContent = "Deleting...";

  try {
    const res = await fetch(`/delete-business/${currentEditBusinessId}`, {
      method: "DELETE",
    });

    const result = await res.json();

    
    if (res.ok && result.success) {
      alert("🗑️ Business deleted successfully!");
      closeAddBusinessPopup();
      await populateBusinessDropdown(true);
      loadUserBusinesses(); // refresh business list
 // ✅ Set new selected business ID from dropdown
  const dropdown = document.getElementById("business-dropdown");
  const newSelectedBusinessId = dropdown.value;

  document.getElementById("selected-business-name").textContent =
    dropdown.options[dropdown.selectedIndex]?.textContent || "Choose business to manage";

  // ✅ Refresh related sections
  loadCalendars(newSelectedBusinessId);
  loadCategoryList(newSelectedBusinessId);
  loadServiceList(newSelectedBusinessId);


    } else {
      alert("❌ Failed to delete business: " + (result.message || "Unknown error."));
    }
  } catch (err) {
    console.error("❌ Error deleting business:", err);
    alert("Server error while deleting.");
  } finally {
    deleteBtn.disabled = false;
    deleteBtn.textContent = "Delete";
  }
});


 //////////////////////////////////////////////////////////////////////////////////////
                                //Calendar 
//Open Add Calendar Popup 
document.getElementById("open-calendar-button").addEventListener("click", () => {
  openAddCalendarPopup();
});

//Load Calendar List 
async function loadCalendars(businessId = "") {
  try {
    const url = businessId
      ? `/get-calendars?businessId=${businessId}`
      : `/get-calendars`;

    const res = await fetch(url);
    const calendars = await res.json();

const nameCol = document.getElementById("calendar-name-column");
const allCalCol = document.getElementById("calendar-default-column"); // was calendars-column ❌


    nameCol.innerHTML = "";
    allCalCol.innerHTML = "";

    if (!calendars.length) {
      const emptyDiv = document.createElement("div");
      emptyDiv.textContent = "(No calendars found)";
      nameCol.appendChild(emptyDiv);
      return;
    }

  calendars.forEach(cal => {
  const name = cal.calendarName || "(Unnamed Calendar)";
  const businessId = cal.businessId?._id || cal.businessId; // Ensure businessId is present

  const nameDiv = document.createElement("div");
  nameDiv.textContent = name;
  nameDiv.classList.add("calendar-name-entry");

  const calDiv = document.createElement("div");
  calDiv.classList.add("calendar-toggle-entry");

  // ✅ Default toggle
  const toggle = document.createElement("input");
  toggle.type = "radio";
  toggle.name = `default-calendar-${businessId}`; // Only one per business
  toggle.checked = cal.isDefault || false;
  toggle.title = "Set as Default Calendar";
  toggle.addEventListener("change", () => setDefaultCalendar(cal._id, businessId));

  const label = document.createElement("label");
  label.textContent = "Default";
  label.style.marginLeft = "6px";

  calDiv.appendChild(toggle);
  calDiv.appendChild(label);

  nameCol.appendChild(nameDiv);
  allCalCol.appendChild(calDiv);

  // Edit popup logic
  nameDiv.addEventListener("click", async () => {
    await populateCalendarBusinessDropdown();  
    openCalendarEditPopup(cal);
  });
});


  } catch (err) {
    console.error("❌ Failed to load calendars:", err);
    alert("Could not load calendars.");
  }
}

// Save Calendar 
document.getElementById("save-calendar-button").addEventListener("click", async () => {
  const businessId = document.getElementById("dropdown-calendar-business").value.trim();
  const calendarName = document.getElementById("popup-calendar-name-input").value.trim();

  if (!businessId || !calendarName) {
    alert("Please select a business and enter a calendar name.");
    return;
  }

  const saveBtn = document.getElementById("save-calendar-button");
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try {
    const res = await fetch("/create-calendar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ businessId, calendarName })
    });

    const result = await res.json();

    if (res.ok) {
      alert("✅ Calendar created!");

      // ✅ Clear fields before closing
      document.getElementById("popup-calendar-name-input").value = "";
      document.getElementById("dropdown-calendar-business").value = "";

      // ✅ Close popup
      closeAddCalendarPopup();

      // ✅ Refresh calendar list for the currently selected business in dropdown
      const selectedBusinessId = document.getElementById("business-dropdown").value;
      loadCalendars(selectedBusinessId);
    } else {
      alert("❌ Failed to create calendar: " + (result.message || "Unknown error"));
    }
  } catch (err) {
    console.error("❌ Error saving calendar:", err);
    alert("Server error while saving calendar.");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Calendar";
  }
});


//Update Calendar 
document.getElementById("update-calendar-button").addEventListener("click", async () => {
  if (!currentEditCalendarId) {
    return alert("No calendar selected to update.");
  }

  const businessId = document.getElementById("dropdown-calendar-business").value.trim();
  const calendarName = document.getElementById("popup-calendar-name-input").value.trim();

  if (!businessId || !calendarName) {
    alert("Please select a business and enter a calendar name.");
    return;
  }

  const updateBtn = document.getElementById("update-calendar-button");
  updateBtn.disabled = true;
  updateBtn.textContent = "Updating...";

  try {
    const res = await fetch(`/update-calendar/${currentEditCalendarId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ businessId, calendarName })
    });

    const result = await res.json();

    if (res.ok) {
      alert("✅ Calendar updated!");
      closeAddCalendarPopup();

      // Reload calendar list based on currently selected business
      const selectedBusinessId = document.getElementById("business-dropdown").value;
      loadCalendars(selectedBusinessId);
    } else {
      alert("❌ Failed to update calendar: " + (result.message || "Unknown error."));
    }
  } catch (err) {
    console.error("❌ Error updating calendar:", err);
    alert("Server error while updating.");
  } finally {
    updateBtn.disabled = false;
    updateBtn.textContent = "Update";
  }
});

//Delete Calendar 
document.getElementById("delete-calendar-button").addEventListener("click", async () => {
  if (!currentEditCalendarId) {
    return alert("No calendar selected to delete.");
  }

  const confirmDelete = confirm("Are you sure you want to delete this calendar?");
  if (!confirmDelete) return;

  const deleteBtn = document.getElementById("delete-calendar-button");
  deleteBtn.disabled = true;
  deleteBtn.textContent = "Deleting...";

  try {
    const res = await fetch(`/delete-calendar/${currentEditCalendarId}`, {
      method: "DELETE"
    });

    if (res.ok) {
      alert("🗑️ Calendar deleted successfully!");
      closeAddCalendarPopup();

      // Reload calendars for the currently selected business
      const selectedBusinessId = document.getElementById("business-dropdown").value;
      loadCalendars(selectedBusinessId);
    } else {
      alert("❌ Failed to delete calendar.");
    }
  } catch (err) {
    console.error("❌ Error deleting calendar:", err);
    alert("Server error while deleting.");
  } finally {
    deleteBtn.disabled = false;
    deleteBtn.textContent = "Delete";
  }
});


   //////////////////////////////////////////////////////////////////////////////////////
                                //Category
 //Open Add Category Popup 
 document.getElementById("open-category-popup-button").addEventListener("click", () => {
  openCategoryPopup();
});

//load calendars in dropdown 
   const bizDropdown = document.getElementById("dropdown-category-business");

  bizDropdown.addEventListener("change", (e) => {
    const selectedBusinessId = e.target.value;
  
  if (!selectedBusinessId) return;

  // 🔄 Update everything related to this business
  populateCalendarDropdownForCategory(selectedBusinessId); // dropdown in category popup
  loadCategoryList(selectedBusinessId);                    // category section
  loadCalendars(selectedBusinessId);                       // calendar section
  
});

  // Load full list by default
  loadCategoryList(); 
   loadCalendars();
});

//Show all Calendars in dropdown 
async function populateCategoryCalendarDropdown(businessId) {
  const dropdown = document.getElementById("dropdown-business-calendar");
  dropdown.innerHTML = `<option value="">-- Choose Calendar --</option>`;

  if (!businessId) return;

  try {
    const res = await fetch(`/get-calendars?businessId=${businessId}`);
    const calendars = await res.json();

    calendars.forEach(cal => {
      const option = document.createElement("option");
      option.value = cal._id;
      option.textContent = cal.calendarName || "(Unnamed)";
      dropdown.appendChild(option);
    });
  } catch (err) {
    console.error("❌ Failed to load calendars for category dropdown:", err);
  }
}

//Load Category List 
async function loadCategoryList(businessId = "", calendarId = "") {
  try {
    let url = `/get-records/Category`;

    if (businessId && calendarId) {
      url += `?businessId=${businessId}&calendarId=${calendarId}`;
    } else if (businessId) {
      url += `?businessId=${businessId}`;
    }

    const res = await fetch(url);
    const categories = await res.json();

    const nameCol = document.getElementById("category-name-column");
    const calendarCol = document.getElementById("category-calendar-column");

    nameCol.innerHTML = "";
    calendarCol.innerHTML = "";

    if (!categories.length) {
      const emptyDiv = document.createElement("div");
      emptyDiv.textContent = "(No categories found)";
      nameCol.appendChild(emptyDiv);
      return;
    }

    categories.forEach(cat => {
      const name = cat.categoryName || "(Unnamed Category)";
      const calendar = cat.calendarId?.calendarName || "(No calendar)";

      const nameDiv = document.createElement("div");
      nameDiv.textContent = name;
      nameDiv.classList.add("category-result");

      const calendarDiv = document.createElement("div");
      calendarDiv.textContent = calendar;

      nameCol.appendChild(nameDiv);
      calendarCol.appendChild(calendarDiv);

      // ✅ Edit support
      nameDiv.addEventListener("click", async () => {
        try {
          const res = await fetch(`/get-record/Category/${cat._id}`);
          const fullCategory = await res.json();
          openCategoryEditPopup(fullCategory);
        } catch (err) {
          console.error("Failed to load category for editing:", err);
          alert("Could not load category.");
        }
      });
    });

  } catch (err) {
    console.error("❌ Failed to load categories:", err);
    alert("Server error while loading categories.");
  }
}

// Save Category
document.getElementById("save-category-button").addEventListener("click", async () => {
  const businessId = document.getElementById("dropdown-category-business").value.trim();
  const calendarId = document.getElementById("dropdown-business-calendar").value.trim();
  const categoryName = document.getElementById("popup-category-name-input").value.trim();

  if (!businessId || !calendarId || !categoryName) {
    alert("Please select a business, calendar, and enter a category name.");
    return;
  }

  const saveBtn = document.getElementById("save-category-button");
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try {
    const res = await fetch("/create-category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, calendarId, categoryName })
    });

    const result = await res.json();

    if (res.ok) {
      alert("✅ Category saved!");

      // ✅ Clear inputs
      document.getElementById("popup-category-name-input").value = "";
      document.getElementById("dropdown-category-business").value = "";
      document.getElementById("dropdown-business-calendar").innerHTML = '<option value="">-- Select --</option>';
      document.getElementById("dropdown-business-calendar").disabled = true;

      // ✅ Close popup
      closeCategoryPopup();

      // ✅ Refresh list
      loadCategoryList();
    } else {
      alert("❌ Failed to save category: " + (result.message || "Unknown error"));
    }
  } catch (err) {
    console.error("❌ Error saving category:", err);
    alert("Server error while saving category.");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Category";
  }
});


// ✅ Update Category
document.getElementById("update-category-button").addEventListener("click", async () => {
  console.log("🟢 Update button clicked");

  if (!currentEditCategoryId) return alert("No category selected to update.");

  const name = document.getElementById("popup-category-name-input").value.trim();
  const businessId = document.getElementById("dropdown-category-business").value;
  const calendarId = document.getElementById("dropdown-business-calendar").value;

  if (!name || !businessId || !calendarId) {
    return alert("Please fill in all fields.");
  }

  try {
    console.log("Sending PUT request to:", `/update-record/Category/${currentEditCategoryId}`);

    const res = await fetch(`/update-record/Category/${currentEditCategoryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryName: name, businessId, calendarId }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Update failed:", data);
      return alert(data.message || "Failed to update category.");
    }

    alert("Category updated successfully!");
    closeCategoryPopup();
    loadCategoryList(businessId);

  } catch (err) {
    console.error("Unexpected error during update:", err);
  }
});


// ✅ Delete Category
document.getElementById("delete-category-button").addEventListener("click", async () => {
  if (!currentEditCategoryId) {
    return alert("No category selected to delete.");
  }

  const confirmDelete = confirm("Are you sure you want to delete this category?");
  if (!confirmDelete) return;

  try {
    const res = await fetch(`/delete-record/Category/${currentEditCategoryId}`, {
      method: "DELETE"
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Delete failed:", data);
      return alert(data.message || "Failed to delete category.");
    }

    alert("Category deleted successfully.");
    closeCategoryPopup();
    loadCategoryList();

  } catch (err) {
    console.error("Error deleting category:", err);
    alert("An error occurred while deleting the category.");
  }


  //////////////////////////////////////////////////////////////////////////////////////
                                //Service  
 //Show image preview in popup 
     // Live preview for Service Image
document.getElementById("popup-service-image-input").addEventListener("change", function () {
  const file = this.files[0];
  const preview = document.getElementById("current-service-image");
  const noImageText = document.getElementById("no-service-image-text");

  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      preview.src = e.target.result;
      preview.style.display = "block";
      noImageText.style.display = "none";
    };
    reader.readAsDataURL(file);
  } else {
    preview.src = "";
    preview.style.display = "none";
    noImageText.style.display = "block";
  }
});
                           
//Open Add Service Popup
console.log("Checking button:", document.getElementById("open-service-popup-button"));

document.getElementById("open-service-popup-button").addEventListener("click", openAddServicePopup);

//Show Calendars in Dropdown for section
document.getElementById("service-section-calendar-dropdown").addEventListener("change", (e) => {
  const selectedCalendarId = e.target.value;
  const businessId = document.getElementById("business-dropdown").value;

  loadServiceList(businessId, selectedCalendarId); // 🔁 Filtered!
});

//show Calendars in dropdown
document.getElementById("dropdown-service-business").addEventListener("change", async (e) => {
  const selectedBusinessId = e.target.value;
  const calendarDropdown = document.getElementById("dropdown-service-calendar");

  console.log("🔄 Service popup business changed to:", selectedBusinessId);

  calendarDropdown.innerHTML = '<option value="">-- Select --</option>';
  calendarDropdown.disabled = true;

  if (selectedBusinessId) {
    await populateServiceCalendarDropdown(selectedBusinessId);
    calendarDropdown.disabled = false;
  }
});

//update section is business dropdown is changed 
document.getElementById("business-dropdown").addEventListener("change", () => {
  console.log("📌 Business dropdown changed");
  loadServiceList();
});

//Update Service 
document.getElementById("update-service-button").addEventListener("click", handleUpdateService);


    //Delete Service (This looks good and is consistent)
    document.getElementById("delete-service-button").addEventListener("click", async () => {
        if (!currentEditingServiceId) return alert("No service selected to delete.");

        const confirmDelete = confirm("Are you sure you want to delete this service?");
        if (!confirmDelete) return;

        try {
            const res = await fetch(`/delete-record/Service/${currentEditingServiceId}`, {
                method: "DELETE"
            });

            const result = await res.json();

            if (!res.ok) {
                return alert(result.message || "Failed to delete service.");
            }

            alert("✅ Service deleted!");
            closeAddServicePopup();
            await loadServiceList();

        } catch (err) {
            console.error("❌ Error deleting service:", err);
            alert("Something went wrong while deleting the service.");
        }
    });

               











///////////////////////End of DOM //////////////////////////////////////////////////
   });





































  //////////////////////////////////////////////////////////////////////////////////////
                                //Menu Section 
 
//Reload Business Dropdown
async function populateBusinessDropdown(selectLast = false) {
  try {
    const res = await fetch("/get-records/Business");
    const businesses = await res.json();

    const dropdown = document.getElementById("business-dropdown");
    dropdown.innerHTML = '<option value="">-- Choose Business --</option>'; // Reset

    businesses.forEach(biz => {
      const values = biz.values || {};
      if (values.businessName) {
        const option = document.createElement("option");
        option.value = biz._id;
        option.textContent = values.businessName;
        dropdown.appendChild(option);
      }
    });

    // 🟩 Auto-select the last business if selectLast = true
    if (selectLast && businesses.length > 0) {
      const lastBiz = businesses[businesses.length - 1];
      dropdown.value = lastBiz._id;
      document.getElementById("selected-business-name").textContent = lastBiz.values.businessName || "Business selected";
    } else {
      document.getElementById("selected-business-name").textContent =
        businesses.length > 0 ? "Choose business to manage" : "No businesses found";
    }

  } catch (err) {
    console.error("❌ Failed to populate business dropdown:", err);
  }
}


                                
//////////////////////////////////////////////////////////////////////////////////////
                                //Business 
 //Close Add Business Popup
function closeAddBusinessPopup() {
  const popup = document.getElementById("popup-add-business");

  // ⛔ Block close if forced
  if (popup.getAttribute("data-force") === "true") {
    alert("You must create a business to continue.");
    return;
  }

  popup.style.display = "none";
  document.getElementById("popup-overlay").style.display = "none";
  document.body.classList.remove("popup-open");



  // Reset form & state
  document.getElementById("popup-add-business-form").reset();
  currentEditBusinessId = null;

  // Reset buttons
  document.getElementById("save-button").style.display = "inline-block";
  document.getElementById("update-button").style.display = "none";
  document.getElementById("delete-button").style.display = "none";

  // Hide current image preview
  document.getElementById("current-hero-image").style.display = "none";
  document.getElementById("no-image-text").style.display = "none";
}
                      
 
//Open Business in edit mode 
function openBusinessEditPopup(biz) {
  const values = biz.values || {};

  // Pre-fill form inputs
  document.getElementById("popup-business-name-input").value = values.businessName || "";
  document.getElementById("popup-your-name-input").value = values.yourName || "";
  document.getElementById("popup-business-phone-number-input").value = values.phoneNumber || "";
  document.getElementById("popup-business-location-name-input").value = values.locationName || "";
  document.getElementById("popup-business-address-input").value = values.businessAddress || "";
  document.getElementById("popup-business-email-input").value = values.businessEmail || "";

  // Show current image if it exists
  if (values.heroImage) {
    document.getElementById("current-hero-image").src = values.heroImage;
    document.getElementById("current-hero-image").style.display = "block";
    document.getElementById("no-image-text").style.display = "none";
  } else {
    document.getElementById("current-hero-image").style.display = "none";
    document.getElementById("no-image-text").style.display = "block";
  }

  // Track which business is being edited
  currentEditBusinessId = biz._id;

  // Toggle button visibility
  document.getElementById("save-button").style.display = "none";
  document.getElementById("update-button").style.display = "inline-block";
  document.getElementById("delete-button").style.display = "inline-block";

  // Show the popup
  document.getElementById("popup-add-business").style.display = "block";
  document.getElementById("popup-overlay").style.display = "block";
  document.body.classList.add("popup-open");
}
 //////////////////////////////////////////////////////////////////////////////////////
                                //Calendar 
//Open Add calendar Popup 
function openAddCalendarPopup() {
    populateCalendarBusinessDropdown();
  document.getElementById("popup-add-calendar").style.display = "block";
  document.getElementById("popup-overlay").style.display = "block"; // optional overlay
  document.body.classList.add("popup-open");
}
function closeAddCalendarPopup() {
  document.getElementById("popup-add-calendar").style.display = "none";
  document.getElementById("popup-overlay").style.display = "none";
  document.body.classList.remove("popup-open");

  // Clear inputs
  document.getElementById("popup-calendar-name-input").value = "";
  document.getElementById("dropdown-calendar-business").value = "";

  // Reset buttons
  document.getElementById("save-calendar-button").style.display = "inline-block";
  document.getElementById("update-calendar-button").style.display = "none";
  document.getElementById("delete-calendar-button").style.display = "none";

  // Clear edit mode state
  currentEditCalendarId = null;
}

//show businesses in calendar popup dropdown
async function populateCalendarBusinessDropdown() {
  try {
    const res = await fetch("/get-records/Business");
    const businesses = await res.json();

    const dropdown = document.getElementById("dropdown-calendar-business");
    const selectedBusinessId = document.getElementById("business-dropdown").value;

    dropdown.innerHTML = '<option value="">-- Select --</option>';

    businesses.forEach(biz => {
      if (biz.isDeleted) return;

      const option = document.createElement("option");
      option.value = biz._id;
      option.textContent = biz.values?.businessName || "(Unnamed Business)";

      // ✅ Preselect the one that matches the main dropdown
      if (biz._id === selectedBusinessId) {
        option.selected = true;
      }

      dropdown.appendChild(option);
    });

  } catch (err) {
    console.error("❌ Failed to populate calendar business dropdown:", err);
    alert("Could not load businesses for calendar.");
  }
}

//Open Calendar in edit mode 
function openCalendarEditPopup(cal) {
  // Fill in the form
  document.getElementById("popup-calendar-name-input").value = cal.calendarName || "";
  document.getElementById("dropdown-calendar-business").value = cal.businessId?._id || cal.businessId || "";

  // Store the ID for updating
  currentEditCalendarId = cal._id;

  // Toggle buttons
  document.getElementById("save-calendar-button").style.display = "none";
  document.getElementById("update-calendar-button").style.display = "inline-block";
  document.getElementById("delete-calendar-button").style.display = "inline-block";

  // Show the popup
  document.getElementById("popup-add-calendar").style.display = "block";
  document.getElementById("popup-overlay").style.display = "block";
  document.body.classList.add("popup-open");
}

//Set Default Calendar 
async function setDefaultCalendar(calendarId, businessId) {
  try {
    const res = await fetch("/set-default-calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calendarId, businessId }),
    });

    if (res.ok) {
      alert("✅ Default calendar set!");
      loadCalendars(businessId); // Refresh to show updated toggle
    } else {
      alert("❌ Failed to set default calendar");
    }
  } catch (err) {
    console.error("Error setting default calendar:", err);
  }
}

   //////////////////////////////////////////////////////////////////////////////////////
                                //Category
 //Open Add Category Popup 
function openCategoryPopup() {
  const selectedBusinessId = document.getElementById("business-dropdown").value;

  // ✅ Reset fields
  document.getElementById("popup-category-name-input").value = "";
  document.getElementById("dropdown-category-business").value = selectedBusinessId || "";
  document.getElementById("dropdown-business-calendar").innerHTML = `<option value="">-- Choose Calendar --</option>`;
  document.getElementById("dropdown-business-calendar").disabled = true;

  // ✅ Reset buttons
  document.getElementById("save-category-button").style.display = "inline-block";
  document.getElementById("update-category-button").style.display = "none";
  document.getElementById("delete-category-button").style.display = "none";

  // ✅ Clear edit mode
  if (typeof currentEditCategoryId !== "undefined") {
    currentEditCategoryId = null;
  }

  // ✅ Populate dropdowns
  populateCategoryBusinessDropdown(selectedBusinessId);
  populateCalendarDropdownForCategory(selectedBusinessId);

  // ✅ Show popup
  document.getElementById("popup-add-category").style.display = "block";
  document.getElementById("popup-overlay").style.display = "block";
  document.body.classList.add("popup-open");
}


//Close add Category Popup 
function closeCategoryPopup() {
  document.getElementById("popup-add-category").style.display = "none";
  document.getElementById("popup-overlay").style.display = "none";
  document.body.classList.remove("popup-open");

 // Clear form fields
  document.getElementById("popup-category-name-input").value = "";
  document.getElementById("dropdown-category-business").value = "";
  document.getElementById("dropdown-business-calendar").innerHTML = '<option value="">-- Select --</option>';
  document.getElementById("dropdown-business-calendar").disabled = true;

  // Reset buttons
  document.getElementById("save-calendar-button").style.display = "inline-block";
  document.getElementById("update-calendar-button").style.display = "none";
  document.getElementById("delete-calendar-button").style.display = "none";

  // Reset edit mode
  currentEditCalendarId = null;
}

//Calendar Dropdown in Category Section 
// 🔄 Filter categories by selected calendar in main section
document.getElementById("category-calendar-dropdown").addEventListener("change", (e) => {
  const selectedCalendarId = e.target.value;
  const businessId = document.getElementById("business-dropdown").value;

  loadCategoryList(businessId, selectedCalendarId); // existing function
});

//Show Calendars in Dropdown Section
async function populateMainCategoryCalendarDropdown(businessId) {
  try {
    const dropdown = document.getElementById("category-calendar-dropdown");
    dropdown.innerHTML = '<option value="">-- Choose a Calendar --</option>';

    const res = await fetch(`/get-calendars?businessId=${businessId}`);
    const calendars = await res.json();

    calendars.forEach(calendar => {
      const option = document.createElement("option");
      option.value = calendar._id;
      option.textContent = calendar.calendarName || "(Unnamed Calendar)";
      dropdown.appendChild(option);
    });

  } catch (err) {
    console.error("❌ Failed to populate main calendar dropdown:", err);
    alert("Could not load calendar list.");
  }
}

//Show Businesses in Category dropdown 
async function populateCategoryBusinessDropdown(preselectId = "") {
  try {
    const res = await fetch("/get-records/Business");
    const businesses = await res.json();

    const dropdown = document.getElementById("dropdown-category-business");
    dropdown.innerHTML = '<option value="">-- Select --</option>';

    businesses.forEach(biz => {
      if (biz.isDeleted) return;

      const option = document.createElement("option");
      option.value = biz._id;
      option.textContent = biz.values?.businessName || "(Unnamed Business)";

      if (biz._id === preselectId) {
        option.selected = true;
      }

      dropdown.appendChild(option);
    });

  } catch (err) {
    console.error("❌ Failed to populate category business dropdown:", err);
    alert("Could not load businesses.");
  }
}

//Load Calendars in dropdown for Category Popup 
async function populateCalendarDropdownForCategory(businessId, preselectId = "") {
  const dropdown = document.getElementById("dropdown-business-calendar");
  dropdown.innerHTML = '<option value="">-- Select --</option>';

  if (!businessId) {
    dropdown.disabled = true;
    return;
  }

  try {
    const res = await fetch(`/get-calendars?businessId=${businessId}`);
    const calendars = await res.json();

    if (!calendars.length) {
      dropdown.disabled = true;
      return;
    }

    calendars.forEach(cal => {
      const option = document.createElement("option");
      option.value = cal._id;
      option.textContent = cal.calendarName || "(Unnamed Calendar)";
      if (cal._id === preselectId) {
        option.selected = true;
      }
      dropdown.appendChild(option);
    });

    dropdown.disabled = false;
  } catch (err) {
    console.error("❌ Failed to load calendars:", err);
    alert("Could not load calendars.");
    dropdown.disabled = true;
  }
}

//open Add Category in edit mode 
async function openCategoryEditPopup(cat) {
  currentEditCategoryId = cat._id;
console.log("Editing category with ID:", currentEditCategoryId);

  // Open popup
  document.getElementById("popup-add-category").style.display = "block";
  document.getElementById("popup-add-category-overlay").style.display = "block";
  document.body.classList.add("popup-open");

  // Fill category name
  document.getElementById("popup-category-name-input").value = cat.categoryName || "";

  // ✅ Step 1: Fill business dropdown and preselect business
  await populateCategoryBusinessDropdown(); 
  const bizSel = document.getElementById("dropdown-category-business");
  bizSel.value = cat.businessId?._id || "";
  bizSel.dispatchEvent(new Event("change")); // ⬅️ Triggers calendar dropdown to refresh

  // ✅ Step 2: Populate calendar dropdown and preselect calendar
  await populateCalendarDropdownForCategory(cat.businessId?._id || "");
  document.getElementById("dropdown-business-calendar").value = cat.calendarId?._id || "";

  // Show Edit buttons
  document.getElementById("save-category-button").style.display = "none";
  document.getElementById("update-category-button").style.display = "inline-block";
  document.getElementById("delete-category-button").style.display = "inline-block";
}


//Close Add Category Popup 
function closeCategoryPopup() {
  // Hide the popup and overlay
  document.getElementById("popup-add-category").style.display = "none";
  document.getElementById("popup-overlay").style.display = "none";
  document.body.classList.remove("popup-open");

  // Reset form inputs (after popup closes to avoid UI glitches)
  setTimeout(() => {
    document.getElementById("popup-category-name-input").value = "";
    document.getElementById("dropdown-category-business").value = "";
    document.getElementById("dropdown-business-calendar").innerHTML = '<option value="">-- Select --</option>';
    document.getElementById("dropdown-business-calendar").disabled = true;

    // Reset buttons
    document.getElementById("save-calendar-button").style.display = "inline-block";
    document.getElementById("update-calendar-button").style.display = "none";
    document.getElementById("delete-calendar-button").style.display = "none";

    // Reset edit mode state
    currentEditCalendarId = null;
  }, 50); // Slight delay ensures DOM cleanup after popup is hidden
}


  
   //////////////////////////////////////////////////////////////////////////////////////
                                //Service  
// -------------------- SERVICE SECTION --------------------

function openAddServicePopup() {

  const popup = document.getElementById("popup-add-service");
  popup.style.display = "block";
  document.getElementById("popup-overlay").style.display = "block";
  document.body.classList.add("popup-open");

  
  // Clear fields
  document.getElementById("popup-service-name-input").value = "";
  document.getElementById("popup-service-price-input").value = "";
  document.getElementById("popup-service-description-input").value = "";
  document.getElementById("dropdown-duration").value = "";
  document.getElementById("popup-service-image-input").value = "";
document.getElementById("popup-service-image-input").value = ""; // clear file input
 document.getElementById("popup-service-visible-toggle").checked = true;


const preview = document.getElementById("current-service-image");
  preview.src = "";
  preview.style.display = "none";
 document.getElementById("no-service-image-text").style.display = "block";

  // Attach preview logic every time popup opens (safe fallback)
  const fileInput = document.getElementById("popup-service-image-input");
  fileInput.addEventListener("change", function () {
    const file = this.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        preview.src = e.target.result;
        preview.style.display = "block";
         document.getElementById("no-service-image-text").style.display = "none";
      };
     
      reader.readAsDataURL(file);
    } else {
      preview.src = "";
      preview.style.display = "none";
      noImageText.style.display = "block";
      document.getElementById("no-service-image-text").style.display = "block";
    }
}, { once: true }); // 🔁 Only attach the listener once

  // Reset dropdowns
  const calendarDropdown = document.getElementById("dropdown-service-calendar");
  const categoryDropdown = document.getElementById("dropdown-service-category");
  calendarDropdown.innerHTML = '<option value="">-- Select --</option>';
  categoryDropdown.innerHTML = '<option value="">-- Select --</option>';
  calendarDropdown.disabled = true;
  categoryDropdown.disabled = true;

  // Set popup title and button visibility for 'Add' mode
    document.querySelector('#popup-add-service .section-title').textContent = 'Add a Service';
    document.getElementById("save-service-button").style.display = "inline-block";
    document.getElementById("update-service-button").style.display = "none";
    document.getElementById("delete-service-button").style.display = "none";

  // 🟡 PREFILL: Grab selected business from global dropdown
  const selectedGlobalBusinessId = document.getElementById("business-dropdown").value;

  // ✅ Populate and preselect
  populateServiceBusinessDropdown(selectedGlobalBusinessId).then(() => {
    const serviceBizDropdown = document.getElementById("dropdown-service-business");

    if (selectedGlobalBusinessId) {
      serviceBizDropdown.value = selectedGlobalBusinessId;

      // ✅ Manually trigger calendar loading
      populateServiceCalendarDropdown(selectedGlobalBusinessId);
    }
  });

  // ✅ Add listener to business dropdown to load calendars
  const serviceBizDropdown = document.getElementById("dropdown-service-business");
  serviceBizDropdown.onchange = () => {
    const selectedBusinessId = serviceBizDropdown.value;
    populateServiceCalendarDropdown(selectedBusinessId);
  };

  // ✅ Add listener to calendar dropdown to load categories
  calendarDropdown.onchange = () => {
    const selectedCalendarId = calendarDropdown.value;
    populateServiceCategoryDropdown(selectedCalendarId);
  };
 // Reset current editing ID when opening for ADD
    currentEditingServiceId = null;

}


// Close Add Service Popup
function closeAddServicePopup() {
  // Hide the popup and overlay
  document.getElementById("popup-add-service").style.display = "none";
  document.getElementById("popup-overlay").style.display = "none";
  document.body.classList.remove("popup-open");

  // Remove lingering focus
  document.activeElement.blur();

  // Delay reset to avoid UI freezing/focus bugs
  setTimeout(() => {
    // Clear inputs
    document.getElementById("popup-service-name-input").value = "";
    document.getElementById("popup-service-description-input").value = "";
    document.getElementById("dropdown-duration").value = "";
    document.getElementById("popup-service-price-input").value = "";
    document.getElementById("dropdown-service-business").value = "";
    document.getElementById("dropdown-service-calendar").innerHTML = '<option value="">-- Select Calendar --</option>';
    document.getElementById("dropdown-service-calendar").disabled = true;
    document.getElementById("dropdown-service-category").innerHTML = '<option value="">-- Select Category --</option>';
    document.getElementById("dropdown-service-category").disabled = true;
document.getElementById("popup-service-visible-toggle").checked = true;

    // Reset buttons
    document.getElementById("save-service-button").style.display = "inline-block";
    document.getElementById("update-service-button").style.display = "none";
    document.getElementById("delete-service-button").style.display = "none";

    // Reset image preview
 
    document.getElementById("current-service-image").style.display = "none";
    document.getElementById("no-service-image-text").style.display = "block";

    // Reset edit mode
    currentEditServiceId = null;
  }, 50);
}

//Show Calendars in dropdown in service section
async function populateServiceSectionCalendarDropdown(businessId) {
  const dropdown = document.getElementById("service-section-calendar-dropdown");
  dropdown.innerHTML = `<option value="">-- Choose a Calendar --</option>`;

  if (!businessId) return;

  try {
const res = await fetch(`/get-calendars?businessId=${businessId}`);
    const calendars = await res.json();

    calendars.forEach(cal => {
      const option = document.createElement("option");
      option.value = cal._id;
      option.textContent = cal.calendarName || "Unnamed Calendar";
      dropdown.appendChild(option);
    });
  } catch (err) {
    console.error("❌ Failed to load calendars:", err);
    alert("Could not load calendars for service dropdown.");
  }
}
// 🟠 Listen for calendar selection in Service section
document.getElementById("service-section-calendar-dropdown").addEventListener("change", (e) => {
  const calendarId = e.target.value;
  const businessId = document.getElementById("business-dropdown").value;

  loadServiceList(businessId, calendarId); // ✅ Reload list with calendar filter
});

//Show Services in section
async function loadServiceList(businessId = null, calendarId = "") {

  if (!businessId) {
    businessId = document.getElementById("business-dropdown").value;
  }

  const nameCol = document.getElementById("service-name-column");
  const calendarCol = document.getElementById("service-calendar-column"); 
  const categoryCol = document.getElementById("service-category-column"); 
  const priceCol = document.getElementById("service-price-column");

  nameCol.innerHTML = "";
  calendarCol.innerHTML = ""; 
  categoryCol.innerHTML = ""; 
  priceCol.innerHTML = "";

  try {
    // 🔁 If businessId exists, include it as a query param — otherwise fetch all
  let url = `/get-records/Service?businessId=${businessId}`;
if (calendarId) {
  url += `&calendarId=${calendarId}`;
}

    const res = await fetch(url);
    const services = await res.json();
    console.log("📦 Services returned:", services);

    if (!services.length) {
      const msg = document.createElement("div");
      msg.textContent = "No services found.";
      msg.classList.add("service-result");
      nameCol.appendChild(msg);
        calendarCol.appendChild(document.createElement("div"));
      categoryCol.appendChild(document.createElement("div"));
      priceCol.appendChild(document.createElement("div")); // empty spacer
      return;
    }

    
  services.forEach(service => {
  const nameDiv = document.createElement("div");
  nameDiv.textContent = service.serviceName || "(Unnamed)";
  nameDiv.classList.add("service-result");

  // 👇 Add click event to open popup in edit mode
  nameDiv.addEventListener("click", () => {
    openEditServicePopup(service);
  });

  const priceDiv = document.createElement("div");
  priceDiv.textContent = `$${service.price || 0}`;
  priceDiv.classList.add("service-result");
  const calendarDiv = document.createElement("div");
      calendarDiv.textContent = service.calendarId?.calendarName || "—";
      calendarDiv.classList.add("service-result");

      const categoryDiv = document.createElement("div");
      categoryDiv.textContent = service.categoryId?.categoryName || "—";
      categoryDiv.classList.add("service-result");

  nameCol.appendChild(nameDiv);
   calendarCol.appendChild(calendarDiv);
      categoryCol.appendChild(categoryDiv);
  priceCol.appendChild(priceDiv);
});


  } catch (err) {
    console.error("❌ Failed to load services:", err);
    alert("Could not load services.");
  }
}


// Populate Business Dropdown
async function populateServiceBusinessDropdown(preselectId = "") {
  try {
    const res = await fetch("/get-records/Business");
    const businesses = await res.json();

    const dropdown = document.getElementById("dropdown-service-business");
    dropdown.innerHTML = '<option value="">-- Select --</option>';

    businesses.forEach(biz => {
      if (biz.values?.isDeleted) return;

      const option = document.createElement("option");
      option.value = biz._id;
      option.textContent = biz.values.businessName || "(Unnamed Business)";
      if (biz._id === preselectId) option.selected = true;
      dropdown.appendChild(option);
    });

  } catch (err) {
    console.error("❌ Failed to populate service business dropdown:", err);
    alert("Could not load businesses.");
  }
}

// Populate Calendars based on selected business
async function populateServiceCalendarDropdown(businessId, preselectId = "") {
  const dropdown = document.getElementById("dropdown-service-calendar");
  dropdown.innerHTML = '<option value="">-- Select --</option>';
  dropdown.disabled = true;

  if (!businessId) return;

  try {
    const res = await fetch(`/get-calendars?businessId=${businessId}`);
    const calendars = await res.json();

    if (!calendars.length) return;

    calendars.forEach(cal => {
      const option = document.createElement("option");
      option.value = cal._id;
      option.textContent = cal.calendarName || "(Unnamed Calendar)";
      if (cal._id === preselectId) option.selected = true;
      dropdown.appendChild(option);
    });

    dropdown.disabled = false;
  } catch (err) {
    console.error("❌ Error loading calendars for service popup:", err);
    dropdown.disabled = true;
  }
}

//Show category dropdown 
// Populate categories from selected calendar
async function populateServiceCategoryDropdown(calendarId, preselectId = "") {
  const dropdown = document.getElementById("dropdown-service-category");
  dropdown.innerHTML = '<option value="">-- Select --</option>';
  dropdown.disabled = true;

  if (!calendarId) return;

  try {
    const res = await fetch(`/get-records/Category?calendarId=${calendarId}`);
    const categories = await res.json();

    if (!categories.length) return;

    categories.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat._id;
      option.textContent = cat.categoryName || "(Unnamed Category)";
      if (cat._id === preselectId) option.selected = true;
      dropdown.appendChild(option);
    });

    dropdown.disabled = false;
  } catch (err) {
    console.error("❌ Failed to load categories:", err);
    dropdown.disabled = true;
  }
}

//Save Service 
document.getElementById("add-service-form").addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent default form reload

    // If currentEditingServiceId is set, it means we are in "edit" mode.
    // In this pattern, the 'submit' event is ONLY for new service creation.
    // The update logic will be handled by the 'update-service-button' click.
    if (currentEditingServiceId) {
        console.log("Form submitted in edit mode, but `submit` event is for 'add'. Ignoring.");
        return; // This prevents the form from also trying to update when in edit mode
    }

    const serviceName = document.getElementById("popup-service-name-input").value.trim();
    const price = parseFloat(document.getElementById("popup-service-price-input").value);
    const description = document.getElementById("popup-service-description-input").value.trim();
    const duration = parseInt(document.getElementById("dropdown-duration").value);
    const businessId = document.getElementById("dropdown-service-business").value;
    const calendarId = document.getElementById("dropdown-service-calendar").value;
    const categoryId = document.getElementById("dropdown-service-category").value;
    const imageInput = document.getElementById("popup-service-image-input");
const isVisible = document.getElementById("popup-service-visible-toggle").checked;


    if (!serviceName || isNaN(price) || !duration || !businessId || !calendarId || !categoryId) {
        alert("Please fill in all required fields correctly (Service Name, Price, Duration, Business, Calendar, Category).");
        return;
    }

    const formData = new FormData();
    formData.append("serviceName", serviceName);
    formData.append("price", price);
    formData.append("description", description);
    formData.append("duration", duration);
    formData.append("businessId", businessId);
    formData.append("calendarId", calendarId);
    formData.append("categoryId", categoryId);
formData.append("isVisible", isVisible);


    if (imageInput.files.length > 0) {
        formData.append("image", imageInput.files[0]);
    }

    try {
        // This is always a POST for creating new services
        const res = await fetch("/create-service", {
            method: "POST",
            body: formData,
        });

        const result = await res.json();

        if (!res.ok) {
            alert(result.message || "Failed to create service.");
            return;
        }

        alert(`✅ Service created!`);
        closeAddServicePopup(); // Close popup
        await loadServiceList(); // Reload services to show changes

    } catch (err) {
        console.error(`❌ Error creating service:`, err);
        alert(`Something went wrong while creating the service.`);
    }
});

//Add Service Add On
document.addEventListener("DOMContentLoaded", () => {
  const addonsContainer = document.getElementById("addons-container");
  const addAddonBtn = document.getElementById("add-addon-button");

  if (addAddonBtn) {
    addAddonBtn.addEventListener("click", () => {
      const addonBlock = document.createElement("div");
      addonBlock.className = "addon-block";

      addonBlock.innerHTML = `
        <input type="text" placeholder="Add-On Name" class="addon-name" required />
        <input type="number" placeholder="Price (e.g. 10)" class="addon-price" required />
        <select class="addon-duration" required>
          <option value="">Select Duration</option>
          <option value="15">15 minutes</option>
          <option value="30">30 minutes</option>
          <option value="45">45 minutes</option>
          <option value="60">1 hour</option>
          <option value="90">1 hour 30 minutes</option>
          <option value="120">2 hours</option>
        </select>
        <input type="text" placeholder="Optional Description" class="addon-description" />
        <button type="button" class="remove-addon-button">❌ Remove</button>
      `;

      // 🔴 Remove Add-On when clicked
      addonBlock.querySelector(".remove-addon-button").addEventListener("click", () => {
        addonsContainer.removeChild(addonBlock);
      });

      addonsContainer.appendChild(addonBlock);
    });
  }
});


// Open Add Service popup in edit mode
// This function needs to handle fetching the service if it's not passed as a full object,
// but your `loadServiceList` already passes the full object, which is good.
async function openEditServicePopup(service) {
    const popup = document.getElementById("popup-add-service");
    popup.style.display = "block";
    document.getElementById("popup-add-service-overlay").style.display = "block"; // Correct overlay ID
    document.body.classList.add("popup-open");

    // Set the global variable for the service being edited
    currentEditingServiceId = service._id;

    // Fill form fields with service data
    document.getElementById("popup-service-name-input").value = service.serviceName || "";
    document.getElementById("popup-service-price-input").value = service.price || "";
    document.getElementById("popup-service-description-input").value = service.description || "";
    document.getElementById("dropdown-duration").value = service.duration || "";
document.getElementById("popup-service-visible-toggle").checked = service.isVisible ?? true;

    // Show current image if it exists
if (service.imageUrl) {
  document.getElementById("current-service-image").src = service.imageUrl;
  document.getElementById("current-service-image").style.display = "block";
  document.getElementById("no-service-image-text").style.display = "none";
} else {
  document.getElementById("current-service-image").style.display = "none";
  document.getElementById("no-service-image-text").style.display = "block";
}

    // ✅ Populate and pre-select dropdowns
    // Extract IDs, handling cases where they might be objects or just IDs
    const businessIdToSelect = service.businessId?._id || service.businessId;
    const calendarIdToSelect = service.calendarId?._id || service.calendarId;
    const categoryIdToSelect = service.categoryId?._id || service.categoryId;

    // Populate business dropdown and select the correct one
    await populateServiceBusinessDropdown(businessIdToSelect);

    // Populate calendar dropdown and select the correct one
    // Only populate if a business is selected
    if (businessIdToSelect) {
        await populateServiceCalendarDropdown(businessIdToSelect, calendarIdToSelect);
        document.getElementById("dropdown-service-calendar").disabled = false; // Enable it
    }


    // Populate category dropdown and select the correct one
    // Only populate if a calendar is selected
    if (calendarIdToSelect) {
        await populateServiceCategoryDropdown(calendarIdToSelect, categoryIdToSelect);
        document.getElementById("dropdown-service-category").disabled = false; // Enable it
    }


    // Set popup title and button visibility for 'Edit' mode
    document.querySelector('#popup-add-service .section-title').textContent = 'Edit Service';
    document.getElementById("save-service-button").style.display = "none";
    document.getElementById("update-service-button").style.display = "inline-block";
    document.getElementById("delete-service-button").style.display = "inline-block";
}

//Update Service 
async function handleUpdateService() {
    console.log("🛠 Update button clicked for Service");

    if (!currentEditingServiceId) {
        alert("No service selected for update.");
        return;
    }

    const serviceName = document.getElementById("popup-service-name-input").value.trim();
    const price = parseFloat(document.getElementById("popup-service-price-input").value);
    const description = document.getElementById("popup-service-description-input").value.trim();
    const duration = parseInt(document.getElementById("dropdown-duration").value);
    const businessId = document.getElementById("dropdown-service-business").value;
    const calendarId = document.getElementById("dropdown-service-calendar").value;
    const categoryId = document.getElementById("dropdown-service-category").value;
    const imageInput = document.getElementById("popup-service-image-input");
const isVisible = document.getElementById("popup-service-visible-toggle").checked;

    if (!serviceName || isNaN(price) || !duration || !businessId || !calendarId || !categoryId) {
        alert("Please fill in all required fields correctly (Service Name, Price, Duration, Business, Calendar, Category).");
        return;
    }

    const formData = new FormData();
    formData.append("serviceName", serviceName);
    formData.append("price", price);
    formData.append("description", description);
    formData.append("duration", duration);
    formData.append("businessId", businessId);
    formData.append("calendarId", calendarId);
    formData.append("categoryId", categoryId);
formData.append("isVisible", isVisible);

    if (imageInput.files.length > 0) {
        formData.append("image", imageInput.files[0]);
    }

    try {
        const res = await fetch(`/update-service/${currentEditingServiceId}`, {
            method: "PUT", // Use PUT for updates as per your server endpoint
            body: formData,
        });

        const result = await res.json();

        if (!res.ok) {
            alert(result.message || "Failed to update service.");
            return;
        }

        alert("✅ Service updated successfully!");
        closeAddServicePopup(); // Close popup
        await loadServiceList(); // Reload services to show changes

    } catch (err) {
        console.error("❌ Error updating service:", err);
        alert("Something went wrong while updating the service.");
    }
}

//Delete Service 
async function handleDeleteService() {
  if (!currentEditingServiceId) return alert("No service selected to delete.");

  const confirmDelete = confirm("Are you sure you want to delete this service?");
  if (!confirmDelete) return;

  try {
    const res = await fetch(`/delete-record/Service/${currentEditingServiceId}`, {
      method: "DELETE",
    });

    const result = await res.json();

    if (!res.ok) {
      return alert(result.message || "Failed to delete service.");
    }

    alert("🗑️ Service deleted successfully.");
    closeAddServicePopup();
    loadServiceList(); // Refresh the service list
  } catch (err) {
    console.error("❌ Error deleting service:", err);
    alert("Something went wrong while deleting the service.");
  }
}
