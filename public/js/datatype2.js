let currentUserId = null;
let currentCalendarId = null;


document.addEventListener("DOMContentLoaded", async () => {
  const loginStatus = document.getElementById("login-status");
  const openLoginBtn = document.getElementById("open-login-popup-btn");
  const logoutBtn = document.getElementById("logout-btn");

    // Define businesses globally within the event listener scope
  let businesses = []; // Make businesses a global variable inside the scope
 let calendars = [];


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
  await fetchBusinesses()
await fetchCalendars();
await populateBusinessMenuDropdown();
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

// Function to clear the popup form fields
function clearPopupForm() {
  const form = document.getElementById('popup-add-business-form');

  // Clear all form inputs
  form.reset();  // This clears the form fields

  // Hide the hero image preview
  document.getElementById('business-hero-preview').style.display = 'none';

  // Hide the update and delete buttons, show the save button
  document.getElementById('save-button').style.display = 'inline-block';
  document.getElementById('update-button').style.display = 'none';
  document.getElementById('delete-button').style.display = 'none';
}

// Function to open the popup and clear the form before showing
function openBusinessPopup() {
  clearPopupForm();  // Clear the form before opening
  document.getElementById('popup-add-business').style.display = 'block';  // Show the popup
  document.getElementById('popup-overlay').style.display = 'block';  // Show the overlay
  document.body.classList.add('popup-open');  // Optional: Add a class for styling (optional)
}

// Add event listener to the "Add Business" button to open the popup
document.getElementById('open-business-popup-button').addEventListener('click', openBusinessPopup);


  // Fetch businesses and populate the business section
    async function fetchBusinesses() {
    try {
      const res = await fetch("/get-records/Business");
      businesses = await res.json();  // Store businesses in global variable

      const businessNameColumn = document.getElementById('business-name-column');
      const servicesColumn = document.getElementById('services-column');
      const clientsColumn = document.getElementById('clients-column');

      // Clear any existing content
      businessNameColumn.innerHTML = '';
      servicesColumn.innerHTML = '';
      clientsColumn.innerHTML = '';

      businesses.forEach(business => {
        const businessNameDiv = document.createElement('div');
        businessNameDiv.textContent = business.values.businessName || 'No name available';
        businessNameDiv.dataset.businessId = business._id; // Attach business ID to the div
        businessNameColumn.appendChild(businessNameDiv);

        const servicesDiv = document.createElement('div');
        servicesDiv.textContent = business.values.services?.length || 0;
        servicesColumn.appendChild(servicesDiv);

        const clientsDiv = document.createElement('div');
        clientsDiv.textContent = business.values.clients?.length || 0;
        clientsColumn.appendChild(clientsDiv);

        // Add event listener for opening the edit popup
        businessNameDiv.addEventListener('click', () => openBusinessPopupForEdit(business._id));
      });
    } catch (err) {
      console.error('Error fetching businesses:', err);
    }
  }

// Populate the “Manage Business” menu dropdown
async function populateBusinessMenuDropdown() {
  if (!currentUserId) return;

  try {
    const res         = await fetch("/get-records/Business");
    const businesses  = await res.json();
    const select      = document.getElementById("business-dropdown");

    // reset the list
    select.innerHTML = '<option value="">-- Choose Business --</option>';

    // filter by your user’s ID (uses the same .createdBy field)
    businesses
      .filter(biz => biz.createdBy === currentUserId)
      .forEach(biz => {
        const opt       = document.createElement("option");
        opt.value       = biz._id;
        opt.textContent = biz.values.businessName;
        select.appendChild(opt);
      });
  } catch (err) {
    console.error("Could not load businesses for menu:", err);
  }
}






  // Open Business Popup in Edit Mode
  function openBusinessPopupForEdit(businessId) {
    const business = businesses.find(b => b._id === businessId);

    if (business) {
      // Set the popup title and display it
      document.getElementById("popup-title").textContent = `Edit Business: ${business.values.businessName}`;
      document.getElementById('popup-add-business').style.display = 'block';
      document.getElementById('popup-overlay').style.display = 'block';
      document.body.classList.add("popup-open");

      // Fill in the form with business data
      document.getElementById('business-id').value = business._id;
      document.getElementById('popup-business-name-input').value = business.values.businessName;
      document.getElementById('popup-your-name-input').value = business.values.yourName;
      document.getElementById('popup-business-phone-number-input').value = business.values.phoneNumber;
      document.getElementById('popup-business-location-name-input').value = business.values.locationName;
      document.getElementById('popup-business-address-input').value = business.values.businessAddress;
      document.getElementById('popup-business-email-input').value = business.values.businessEmail;

      // If the business has a hero image, show it
      if (business.values.heroImage) {
        document.getElementById('business-hero-preview').style.display = 'block';
        document.getElementById('business-hero-preview').src = business.values.heroImage;
      }

      // Show the 'Update' & 'Delete' buttons, hide the 'Save' button
      document.getElementById('save-button').style.display = 'none';
      document.getElementById('update-button').style.display = 'inline-block';
      document.getElementById('delete-button').style.display = 'inline-block';
    }
  }

  // Handle the Update button click
  document.getElementById('update-button').addEventListener('click', async (e) => {
    e.preventDefault(); // Prevent form submission

    // Get the form data
    const form = new FormData(document.getElementById('popup-add-business-form'));

    const businessData = {
      businessName: form.get('businessName'),
      yourName: form.get('yourName'),
      phoneNumber: form.get('phoneNumber'),
      locationName: form.get('locationName'),
      businessAddress: form.get('businessAddress'),
      businessEmail: form.get('businessEmail'),
      heroImage: form.get('heroImage') ? form.get('heroImage') : '', // Handle image
    };

    const businessId = document.getElementById('business-id').value; // Get business ID

    try {
      const res = await fetch(`/update-business/${businessId}`, {
        method: 'PUT', // Use PUT to update
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(businessData), // Send updated data
      });

      const result = await res.json();
      if (res.ok) {
        alert('Business updated successfully!');
        closeAddBusinessPopup(); // Close the popup after update
        await fetchBusinesses(); // Re-fetch businesses to reflect changes
      } else {
        alert(result.message || 'Failed to update business');
      }
    } catch (err) {
      console.error('Error updating business:', err);
      alert('Something went wrong');
    }
  });

  // Close the business popup
  function closeAddBusinessPopup() {
    document.getElementById('popup-add-business').style.display = 'none';
    document.getElementById('popup-overlay').style.display = 'none';
    document.body.classList.remove('popup-open');
  }

  // Close the popup when clicking the overlay
  document.getElementById('popup-overlay').addEventListener('click', closeAddBusinessPopup);

  // Initialize by fetching businesses
  await fetchBusinesses();
 await populateBusinessMenuDropdown();
  await fetchCalendars();

  //Open Add Business Popup 
    const openBusinessPopupButton = document.getElementById("open-business-popup-button");
  const businessPopup = document.getElementById("popup-add-business");


  // Open the business popup when the "Add Business" button is clicked
  openBusinessPopupButton.addEventListener("click", () => {
    businessPopup.style.display = "block";  // Show the popup
    popupOverlay.style.display = "block";  // Show the overlay
    document.body.classList.add("popup-open");  // Optionally add class to the body for styling
  });

  
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



//////////////////////////////////////////////////////////////////////////////
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
// ─── Fetch & Render Businesses ─────────────────────────────────
async function fetchBusinesses() {
  try {
    // 1) grab the data
    const res = await fetch("/get-records/Business");
    if (!res.ok) throw new Error("Failed to load businesses");
    businesses = await res.json();  // fills your outer-scope `businesses` array

    // 2) grab your columns
    const nameCol     = document.getElementById("business-name-column");
    const servicesCol = document.getElementById("services-column");
    const clientsCol  = document.getElementById("clients-column");

    // 3) clear old rows
    nameCol.innerHTML     = "";
    servicesCol.innerHTML = "";
    clientsCol.innerHTML  = "";

    // 4) render each business
    businesses.forEach(biz => {
      // a) name cell
      const nameDiv = document.createElement("div");
      nameDiv.textContent = biz.values.businessName || "Untitled";
      nameDiv.dataset.businessId = biz._id;
      nameCol.appendChild(nameDiv);

      // b) services count
      const svcDiv = document.createElement("div");
      svcDiv.textContent = (biz.values.services?.length ?? 0);
      servicesCol.appendChild(svcDiv);

      // c) clients count
      const cliDiv = document.createElement("div");
      cliDiv.textContent = (biz.values.clients?.length ?? 0);
      clientsCol.appendChild(cliDiv);

      // d) clicking a business goes into edit mode:
      nameDiv.addEventListener("click", () => openBusinessPopupForEdit(biz._id));
    });

  } catch (err) {
    console.error("Error fetching businesses:", err);
    alert("Could not load your businesses. Please try again.");
  }
}


// ─── Populate the “Manage Business” Menu Dropdown ───────────────────
async function populateBusinessMenuDropdown() {
  if (!currentUserId) return;  // don’t run until we know who’s logged in

  try {
    // 1) Fetch all of this user’s businesses
    const res = await fetch("/get-records/Business");
    if (!res.ok) throw new Error("Failed to load businesses for menu");
    const businesses = await res.json();

    // 2) Grab the <select> and reset it
    const select = document.getElementById("business-dropdown");
    select.innerHTML = '<option value="">-- Choose Business --</option>';

    // 3) Add an <option> for each business that they own
    businesses
      .filter(biz => biz.createdBy === currentUserId)
      .forEach(biz => {
        const opt = document.createElement("option");
        opt.value = biz._id;
        opt.textContent = biz.values.businessName || "Untitled";
        select.appendChild(opt);
      });

  } catch (err) {
    console.error("Could not load businesses for menu:", err);
    alert("Unable to load your businesses in the dropdown.");
  }
}

// ─── Populate the Calendar Popup’s Business Dropdown ────────────────
async function populateCalendarBusinessDropdown() {
  if (!currentUserId) return;  // don’t run until we know who’s logged in

  try {
    // 1. Fetch all businesses for this user
    const res = await fetch("/get-records/Business");
    if (!res.ok) throw new Error("Failed to load businesses");
    const businesses = await res.json();

    // 2. Grab & reset the calendar popup’s <select>
    const select = document.getElementById("dropdown-calendar-business");
    select.innerHTML = '<option value="">-- Select --</option>';

    // 3. Add an <option> per business
    businesses
      .filter(biz => biz.createdBy === currentUserId)
      .forEach(biz => {
        const opt = document.createElement("option");
        opt.value       = biz._id;
        opt.textContent = biz.values.businessName || "Untitled";
        select.appendChild(opt);
      });

  } catch (err) {
    console.error("Could not load businesses for calendar dropdown:", err);
    alert("Failed to load businesses into calendar popup.");
  }
}

// ─── Open the “Add Business” Popup ───────────────────────────────
function openBusinessPopup() {
  clearPopupForm();  // reset all fields & buttons back to “create” mode
  document.getElementById('popup-add-business').style.display = 'block';
  document.getElementById('popup-overlay').style.display      = 'block';
  document.body.classList.add('popup-open');
}

function closeAddBusinessPopup() {
  document.getElementById('popup-add-business').style.display = 'none';
  document.getElementById('popup-overlay').style.display      = 'none';
  document.body.classList.remove('popup-open');
}

function openBusinessPopupForEdit(id) { /* … */ }
