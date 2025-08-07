let currentWeekDates = [];
let currentEditAppointmentId = null;
let lastEditedBusinessId = null;

// Login Popup
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

window.closeLoginPopup = closeLoginPopup;

const loginBtn = document.getElementById("open-login-popup-btn"); // ✅ Keep this ONE
if (loginBtn) {
  loginBtn.addEventListener("click", () => openLoginPopup());
}

// Handle login form submission
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

// Show user name after login
const logoutBtn = document.getElementById("logout-btn"); // Only if it exists in your HTML
const headerRight = document.querySelector(".right-group");

fetch("/check-login")
  .then(res => res.json())
  .then(data => {
    if (data.loggedIn) {
      headerRight.innerHTML = `
        Hi, ${data.firstName} 👋 
        <button id="logout-btn">Logout</button>
      `;

document.getElementById("logout-btn").addEventListener("click", async () => {
  const res = await fetch("/logout");
  if (res.ok) {
    alert("👋 Logged out!");
    window.location.href = "/signup.html"; // ⬅️ Redirects to signup page
  }
});

    }
  });


  ////////////////////Menu Section/////////////////////
 //show busineesses in dropdown 
  document.addEventListener("DOMContentLoaded", () => {
  loadUserBusinesses(); // Call it on page load

    const dropdown = document.getElementById("business-dropdown");
const addApptBtn = document.getElementById("open-appointment-popup-btn");

if (dropdown && addApptBtn) {
  dropdown.addEventListener("change", () => {
    if (dropdown.value === "all") {
      addApptBtn.disabled = true;
      addApptBtn.title = "Select a specific business to add appointments";
    } else {
      addApptBtn.disabled = false;
      addApptBtn.title = "";
    }
  });

  // ✅ Optional: default to disabled if "all" is default
  if (dropdown.value === "all" || !dropdown.value) {
    addApptBtn.disabled = true;
    addApptBtn.title = "Select a specific business to add appointments";
  }
}

});

//change the name in the menu section 
document.getElementById("business-dropdown").addEventListener("change", (e) => {
  const selectedOption = e.target.options[e.target.selectedIndex];
  const businessName = selectedOption.textContent;

  const heading = document.getElementById("selected-business-name");

if (e.target.value === "all") {
  heading.textContent = "📅 All Appointments";
} else if (e.target.value) {
  heading.textContent = ` ${businessName}`;
} else {
  heading.textContent = "Choose business to manage";
}


  loadAppointments(); // still needed to refresh appointments
});

// Function to fetch and display user's businesses
async function loadUserBusinesses() {
  try {
    const res = await fetch("/get-records/Business");
    const businesses = await res.json();

    const dropdown = document.getElementById("business-dropdown");

    // Clear previous options
    dropdown.innerHTML = `
  <option value="all">📅 All Appointments</option>
`;


    businesses.forEach(biz => {
      // Make sure business has a name and is not deleted
      if (!biz.values?.businessName || biz.values.isDeleted) return;

      const option = document.createElement("option");
      option.value = biz._id;
      option.textContent = biz.values.businessName;
      dropdown.appendChild(option);
    });

  } catch (err) {
    console.error("❌ Failed to load businesses:", err);
    alert("Could not load your businesses.");
  }
}


//////////////////////Calendar/////////////////////////////////
// ---------------- Load Appointments Function ----------------
async function loadAppointments() {
const selectedBusinessId = document.getElementById("business-dropdown").value;
const url = selectedBusinessId && selectedBusinessId !== "all"
  ? `/get-appointments?businessId=${encodeURIComponent(selectedBusinessId)}`
  : "/get-appointments";


  try {
    const res = await fetch(url);
    const appointments = await res.json();

    renderAppointmentsOnGrid(appointments); // calendar view
  } catch (err) {
    console.error("❌ Failed to load appointments:", err);
  }
}



//Buid Calendar ////////
 // render months  
function updateMonthYear() {
  const monthYearDisplay = document.getElementById("month-year");
  if (!monthYearDisplay) return;

  const options = { month: 'long', year: 'numeric' };
  const formattedDate = currentWeekStart.toLocaleDateString(undefined, options);
  monthYearDisplay.textContent = formattedDate;
}


 //  Add the functions to build the grid 
function generateHourColumn() {
  const hourColumn = document.querySelector(".hour-column");
  if (!hourColumn) return;

  hourColumn.innerHTML = ""; // Clear old content

  for (let i = 0; i < 24; i++) {
    const label = document.createElement("div");
    label.classList.add("hour-label");
    label.textContent = i === 0 ? "12 AM" :
                        i < 12 ? `${i} AM` :
                        i === 12 ? "12 PM" :
                        `${i - 12} PM`;
    label.style.height = "60px"; // 4 x 15 min
    hourColumn.appendChild(label);
  }
}
 //  Add the functions to build the grid 
function generateTimeGrid() {
  const container = document.querySelector(".time-slots-container");
  if (!container) return;

  container.innerHTML = ""; // Clear previous

  for (let d = 0; d < 7; d++) {
    const column = document.createElement("div");
    column.classList.add("time-column");

    for (let t = 0; t < 96; t++) {
      const slot = document.createElement("div");
      slot.classList.add("time-slot");

      // Optional: add a border for horizontal lines
      slot.style.borderBottom = "1px solid #eee";
      slot.style.height = "15px";
      
      column.appendChild(slot);
    }

    // Optional: vertical line between day columns
    column.style.borderRight = "1px solid #ddd";

    container.appendChild(column);
  }
}

 //  let arrows change week in calendar
document.getElementById("prev-week").addEventListener("click", () => {
  currentWeekStart.setDate(currentWeekStart.getDate() - 7);
  updateWeekDates(currentWeekStart);
  loadAppointments(); // ✅
  updateWeekOffsetLabel(); 
});

document.getElementById("next-week").addEventListener("click", () => {
  currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  updateWeekDates(currentWeekStart);  // ✅ FIXED
   loadAppointments();
    updateWeekOffsetLabel();
});

document.getElementById("today-btn").addEventListener("click", () => {
  currentWeekStart = new Date();
  updateWeekDates(currentWeekStart);  // ✅ FIXED
   loadAppointments();
    updateWeekOffsetLabel();
});

let currentWeekStart = new Date(); // Tracks which week you're on

function updateWeekDates(startDate) {
  currentWeekDates = [];

  const baseDate = new Date(startDate);
  const dayOfWeek = baseDate.getDay(); // 0 (Sun) - 6 (Sat)
  baseDate.setDate(baseDate.getDate() - dayOfWeek); // Back up to Sunday
  baseDate.setHours(0, 0, 0, 0); // Normalize time

  for (let i = 0; i < 7; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    d.setHours(0, 0, 0, 0); // Normalize time again

    currentWeekDates.push(d);

    const dayCell = document.querySelector(`.day-date[data-day="${i}"]`);
    if (dayCell) {
      dayCell.textContent = d.getDate();
    }
  }

  // 🧠 Update the label after updating week
  updateMonthYear();
}
//add 1 week or weeks out under months 
function updateWeekOffsetLabel() {
  const label = document.getElementById("week-offset-label");

  const today = new Date();
  const startOfThisWeek = getStartOfWeek(today);
  const startOfViewedWeek = getStartOfWeek(currentWeekDates[0]);

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weekDiff = Math.round((startOfViewedWeek - startOfThisWeek) / msPerWeek);

  if (weekDiff === 0) {
    label.textContent = ""; // current week, no label
  } else if (weekDiff > 0) {
    label.textContent = `${weekDiff} Week${weekDiff > 1 ? "s" : ""} Out`;
  } else {
    const absDiff = Math.abs(weekDiff);
    label.textContent = `${absDiff} Week${absDiff > 1 ? "s" : ""} Ago`;
  }
}

// Helper: Get the start of the week (Sunday)
function getStartOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  return d;
}

//
function buildHourLabels() {
  const hourCol = document.querySelector(".hour-column");
  if (!hourCol) return;

  hourCol.innerHTML = ""; // Clear old labels

  for (let hour = 0; hour < 24; hour++) {
    const label = document.createElement("div");
    label.className = "hour-label";
    label.textContent = formatHourLabel(hour); // e.g., 12 AM, 1 AM, etc.
    hourCol.appendChild(label);
  }
}

function formatHourLabel(hour) {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour} ${period}`;
}

function buildTimeGrid() {
  const container = document.querySelector(".time-slots-container");
  if (!container) return;

  container.innerHTML = ""; // Clear old grid

  for (let day = 0; day < 7; day++) {
    const column = document.createElement("div");
    column.className = "time-column";

for (let i = 0; i < 96; i++) {
  const slot = document.createElement("div");
  slot.className = "time-slot";

  if (i % 4 === 0) {
    slot.classList.add("hour-start");
  } else if (i % 4 === 1) {
    slot.classList.add("slot-15");
  } else if (i % 4 === 2) {
    slot.classList.add("slot-30");
  } else if (i % 4 === 3) {
    slot.classList.add("slot-45");
  }

  column.appendChild(slot);
}




    container.appendChild(column);
  }
}

  /////////////////////Render Appointments as Cards on the Grid//////////
function renderAppointmentsOnGrid(appointments) {
  const grid = document.querySelector(".time-slots-container");
  if (!grid) return;

  // Remove previous appointments
  document.querySelectorAll(".appointment-card").forEach(el => el.remove());

  // Filter appointments to this week only
  const currentWeekDatesStr = currentWeekDates.map(d =>
    new Date(d).toISOString().split("T")[0]
  );

  appointments.forEach(appt => {
    const { date, time, clientName, serviceName } = appt;

    if (!date || !time) return;

    // Skip if appointment is not in the current week
    if (!currentWeekDatesStr.includes(date)) return;

    const dayIndex = getDayIndexFromDate(date);
    const topOffset = getTopOffsetFromTime(time);

    const card = document.createElement("div");
    card.className = "appointment-card";
    card.style.position = "absolute";
    card.style.top = `${Math.round(topOffset)}px`;
    card.style.left = `calc(${dayIndex} * 14.28%)`;

    card.innerHTML = `
      <strong>${formatTimeTo12Hour(time)}</strong><br>
      ${clientName}<br>
      ${serviceName}
    `;
     card.addEventListener("click", () => {
      openAppointmentPopup({
        _id: appt._id,
        time: appt.time,
        date: appt.date,
        clientId: appt.clientId,
        serviceId: appt.serviceId,
        duration: appt.duration,
        businessId: appt.businessId
      });
    });

    grid.appendChild(card);
  });
}




                                   // Popup
                                    // Add Client                                   
async function openClientPopup() {
  await populateClientBusinessDropdown();
  document.getElementById("popup-create-client").style.display = "block";
  document.getElementById("popup-overlay").style.display = "block";
  document.body.classList.add("popup-open");
}


function closeClientPopup() {
  document.getElementById("popup-create-client").style.display = "none";
  document.getElementById("popup-overlay").style.display = "none";
  document.body.classList.remove("popup-open");
}

//Show businesses in dropdown 
async function populateClientBusinessDropdown() {
  const dropdown = document.getElementById("client-business");
  if (!dropdown) return;

  try {
    const res = await fetch("/get-records/Business");
    const businesses = await res.json();
    dropdown.innerHTML = `<option value="">-- Choose Business --</option>`;

    const selectedOutside = document.getElementById("business-dropdown")?.value;

    businesses.forEach(biz => {
      if (biz.values?.businessName && !biz.values.isDeleted) {
        const option = document.createElement("option");
        option.value = biz._id;
        option.textContent = biz.values.businessName;

        if (selectedOutside && selectedOutside === biz._id) {
          option.selected = true;
        }

        dropdown.appendChild(option);
      }
    });
  } catch (err) {
    console.error("❌ Failed to load businesses:", err);
  }
}

//Save Client
document.getElementById("create-client-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const businessId = document.getElementById("client-business").value;
  const firstName = document.getElementById("client-name").value.trim();
  const lastName = document.getElementById("client-last-name").value.trim();
  const phone = document.getElementById("client-phone").value.trim();
  const email = document.getElementById("client-email").value.trim();

  if (!businessId || !firstName) {
    alert("Please enter First Name and choose a Business.");
    return;
  }

  try {
    const res = await fetch("/add-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId,
        firstName,
        lastName,
        phone,
        email
      }),
    });

    const result = await res.json();

   if (res.ok) {
  if (result.message === "Client already exists") {
    alert("ℹ️ This client is already in your list.");
  } else {
    alert("✅ Client added successfully!");
  }
      document.getElementById("create-client-form").reset();
      loadAllClients(); // Optional: refresh the client list
      closeClientPopup();
    } else {
      alert(result.message || "❌ Failed to add client.");
    }
  } catch (err) {
    console.error("❌ Error saving client:", err);
    alert("Something went wrong.");
  }
});


// Add Appointment popup 

async function openAppointmentPopup() {
  // Reset form fields first
  document.getElementById("create-appointment-form").reset();

  // Clear service & client dropdowns
  document.getElementById("appointment-service").innerHTML = `<option value="">-- Select Service --</option>`;
  document.getElementById("appointment-client").innerHTML = `<option value="">-- Select Client --</option>`;

  // Clear business dropdown and reload it
  const businessDropdown = document.getElementById("appointment-business");
  businessDropdown.innerHTML = `<option value="">-- Select Business --</option>`;
  await loadAppointmentBusinesses();

  // 👇 Only preselect a business if it's NOT "all"
  const mainBusinessDropdown = document.getElementById("business-dropdown");
if (
  mainBusinessDropdown &&
  mainBusinessDropdown.value &&
  mainBusinessDropdown.value !== "all"
) {
  const selectedBusinessId = mainBusinessDropdown.value;
  businessDropdown.value = selectedBusinessId;

  await loadAppointmentServices(selectedBusinessId);
  await loadAppointmentClients(selectedBusinessId);
} else {
  // Set warning state if "all" was selected
  businessDropdown.value = "";
  document.getElementById("appointment-service").innerHTML = `<option value="">-- Select Business First --</option>`;
  document.getElementById("appointment-client").innerHTML = `<option value="">-- Select Business First --</option>`;
}

  // Show popup
  document.getElementById("popup-create-appointment").style.display = "block";
  document.getElementById("popup-overlay").style.display = "block";
  document.body.classList.add("popup-open");
}


function closeAppointmentPopup() {
  document.getElementById("popup-create-appointment").style.display = "none";
  document.getElementById("popup-overlay").style.display = "none";
  document.body.classList.remove("popup-open");
}

// Render Businesses
async function loadAppointmentBusinesses() {
  try {
    const res = await fetch("/get-records/Business");
    const businesses = await res.json();

    const dropdown = document.getElementById("appointment-business");
    dropdown.innerHTML = `<option value="">-- Select Business --</option>`;

    businesses.forEach(biz => {
      if (!biz.values?.businessName || biz.values.isDeleted) return;
      const opt = document.createElement("option");
      opt.value = biz._id;
      opt.textContent = biz.values.businessName;
      dropdown.appendChild(opt);
    });
  } catch (err) {
    console.error("Error loading businesses:", err);
  }
}
document.getElementById("appointment-business").addEventListener("change", async function () {
  const businessId = this.value;
  const showAll = document.getElementById("show-all-clients").checked;

if (showAll) {
  await loadAllClientsForAppointments(); // ✅ Correct
} else {
  await loadAppointmentClients(businessId);
}

  await loadAppointmentServices(businessId);
});

document.getElementById("show-all-clients").addEventListener("change", async function () {
  const businessId = document.getElementById("appointment-business").value;

  if (this.checked) {
    await loadAllClients();
  } else {
    if (businessId) {
      await loadAppointmentClients(businessId);
    }
  }
});

async function loadAllClientsForAppointments() {
  try {
    const res = await fetch("/get-all-clients");
    const clients = await res.json();

    const dropdown = document.getElementById("appointment-client");
    dropdown.innerHTML = `<option value="">-- Select Client --</option>`;

    // Sort clients A–Z
    clients.sort((a, b) => a.firstName.localeCompare(b.firstName));

    clients.forEach(client => {
      const option = document.createElement("option");
      option.value = client._id;
      option.textContent = `${client.firstName} ${client.lastName || ""}`.trim();
      dropdown.appendChild(option);
    });
  } catch (err) {
    console.error("❌ Failed to load all clients for appointments:", err);
  }
}

// Render Services
async function loadAppointmentServices(businessId) {
  const dropdown = document.getElementById("appointment-service");

  // 🛑 Guard clause: stop if "all" is selected or no ID
  if (!businessId || businessId === "all") {
    console.warn("⛔ Skipping service load — 'all' selected");
    dropdown.innerHTML = `<option value="">-- Select Business First --</option>`;
    return [];
  }

  // ✅ Default reset
  dropdown.innerHTML = `<option value="">-- Select Service --</option>`;

  try {
    const res = await fetch(`/get-records/Service?businessId=${businessId}`);
    const services = await res.json();
    console.log("Services fetched:", services);

    services.forEach(svc => {
      const name = svc.serviceName || svc.values?.serviceName || "Unnamed Service";
      const duration = svc.duration || svc.values?.duration || 30;
      const calendarId = svc.calendarId?._id || svc.calendarId || "";

      const opt = document.createElement("option");
      opt.value = svc._id;
      opt.textContent = name;
      opt.setAttribute("data-duration", duration);
      opt.setAttribute("data-calendar-id", calendarId);
      dropdown.appendChild(opt);
    });

  } catch (err) {
    console.error("Error loading services:", err);
  }
}



// Render Clients
async function loadAppointmentClients(businessId) {
  const dropdown = document.getElementById("appointment-client");

  // 🛑 Guard clause: skip if "all"
  if (!businessId || businessId === "all") {
    console.warn("⛔ Skipping client load — 'all' selected");
    dropdown.innerHTML = `<option value="">-- Select Business First --</option>`;
    return [];
  }

  // ✅ Default reset
  dropdown.innerHTML = `<option value="">-- Select Client --</option>`;

  try {
    const res = await fetch(`/get-clients/${businessId}`);
    const clients = await res.json();

    clients.forEach(client => {
      const name = `${client.firstName} ${client.lastName || ""}`.trim();

      const opt = document.createElement("option");
      opt.value = client._id;
      opt.textContent = name;
      dropdown.appendChild(opt);
    });

  } catch (err) {
    console.error("Failed to load clients:", err);
  }
}





// auto-fill the duration
document.getElementById("appointment-service").addEventListener("change", function () {
  const selectedOption = this.options[this.selectedIndex];
  const duration = selectedOption.getAttribute("data-duration");

  if (duration) {
    document.getElementById("appointment-duration").value = duration;
  }
});

// New client section in add appointment popup 
document.addEventListener("DOMContentLoaded", () => {
  // Support either of your "Add New Client" buttons
  const newClientButtons = document.querySelectorAll("#btn-new-client, #toggle-new-client-btn");

  // Use the IDs that exist in your HTML
  const cancelNewClientBtn = document.getElementById("cancel-new-client-btn");
  const newClientFields = document.getElementById("new-client-fields");          // was "new-client-section" in your JS
  const existingClientSection = document.getElementById("existing-client-section");

  const showNewClientForm = () => {
    if (newClientFields) newClientFields.style.display = "block";
    if (existingClientSection) existingClientSection.style.display = "none";
    newClientButtons.forEach(btn => { if (btn) btn.style.display = "none"; });
  };

  const hideNewClientForm = () => {
    if (newClientFields) newClientFields.style.display = "none";
    if (existingClientSection) existingClientSection.style.display = "block";
    newClientButtons.forEach(btn => { if (btn) btn.style.display = "inline-block"; });

    // Clear inputs
    ["new-client-first-name","new-client-last-name","new-client-email","new-client-phone"]
      .forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
  };

  // Wire up listeners (with null-guards so nothing crashes)
  newClientButtons.forEach(btn => {
    if (btn) btn.addEventListener("click", showNewClientForm);
  });
  if (cancelNewClientBtn) cancelNewClientBtn.addEventListener("click", hideNewClientForm);
});


// Save Appointment
document.getElementById("create-appointment-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const businessId = document.getElementById("appointment-business").value;
  const serviceId = document.getElementById("appointment-service").value;
  const date = document.getElementById("appointment-date").value;
  const time = document.getElementById("appointment-time").value;
  const duration = document.getElementById("appointment-duration").value;

  // 🧑‍💼 Existing client selection
  const clientId = document.getElementById("appointment-client").value;

  // 🆕 New client fields
  const clientFirstName = document.getElementById("new-client-first-name").value.trim();
  const clientLastName = document.getElementById("new-client-last-name").value.trim();
  const clientEmail = document.getElementById("new-client-email").value.trim();
  const clientPhone = document.getElementById("new-client-phone").value.trim();

  const isCreatingNewClient = clientFirstName || clientLastName || clientEmail || clientPhone;

  // ✅ Validation check
  if (
    !businessId || !serviceId || !date || !time || !duration ||
    (!clientId && !isCreatingNewClient)
  ) {
    alert("Please fill in all required fields.");
    return;
  }

  const selectedServiceOption = document.getElementById("appointment-service").selectedOptions[0];
  const calendarId = selectedServiceOption.getAttribute("data-calendar-id");
  const serviceName = selectedServiceOption.textContent;
  const note = document.getElementById("appointment-note")?.value || "";

  if (!calendarId) {
    alert("No calendar linked to the selected service.");
    return;
  }

  try {
    const url = currentEditAppointmentId
      ? `/update-appointment/${currentEditAppointmentId}`
      : "/book-appointment";
    const method = currentEditAppointmentId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId,
        calendarId,
        serviceId,
        clientId,
        appointmentDate: date,
        appointmentTime: time,
        duration,
        serviceName,
        note,
        clientFirstName,
        clientLastName,
        clientEmail,
        clientPhone
      }),
    });

    const data = await res.json();

    if (res.ok) {
      alert(currentEditAppointmentId ? "✅ Appointment updated!" : "✅ Appointment saved!");
      closeAppointmentPopup();
      currentEditAppointmentId = null;
      await loadAppointments();
    } else {
      alert(`❌ ${data.message}`);
    }
  } catch (err) {
    console.error("❌ Failed to save appointment:", err);
    alert("Something went wrong saving the appointment.");
  }
});





// ✅ DOM ready logic
document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ DOM fully loaded");
  updateMonthYear();
  updateWeekDates();
  generateHourColumn();
  generateTimeGrid();
  updateWeekDates(currentWeekStart);
buildHourLabels();
buildTimeGrid();
   await loadAppointments();

    // 🕗 Auto-scroll to 8AM
  setTimeout(() => {
const wrapper = document.querySelector(".calendar-wrapper");
if (wrapper) {
  const slotHeight = 15;
  const eightAMOffset = 8 * 4 * slotHeight; // = 480px
  wrapper.scrollTop = eightAMOffset;
  console.log("🔃 Scrolled to 8AM:", eightAMOffset);
}

}, 100); // Delay ensures layout is complete


    document.getElementById("business-dropdown").addEventListener("change", () => {
    loadAppointments(); // Re-fetch appointments when business changes
  });

   // ⬇️ Fetch and render appointments after grid is built
  try {
    const res = await fetch("/get-appointments");
    const appointments = await res.json(); const newClientBtn = document.getElementById("btn-new-client");
    renderAppointmentsOnGrid(appointments);
  } catch (err) {
    console.error("❌ Failed to load appointments:", err);
  }
});

//Prevent appointment from submitting if new client is not selected and dropdown is not selected 
document.addEventListener("DOMContentLoaded", () => {
  const newClientBtn = document.getElementById("btn-new-client");
  const cancelNewClientBtn = document.getElementById("cancel-new-client-btn");
  const newClientFields = document.getElementById("new-client-fields");
  const clientDropdown = document.getElementById("appointment-client");
  const appointmentForm = document.getElementById("create-appointment-form");

  // ✚ Show new client form
  newClientBtn.addEventListener("click", () => {
    newClientFields.style.display = "block";
    clientDropdown.closest(".form-group").style.display = "none";
  });

  // ❌ Cancel new client form
  cancelNewClientBtn.addEventListener("click", () => {
    newClientFields.style.display = "none";
    clientDropdown.closest(".form-group").style.display = "block";
  });

  // 🧠 Prevent submission if no valid client info
  appointmentForm.addEventListener("submit", (e) => {
    const isNewClientVisible = newClientFields.style.display !== "none";

    const selectedClient = clientDropdown.value;
    const firstName = document.getElementById("new-client-first-name").value.trim();
    const lastName = document.getElementById("new-client-last-name").value.trim();
    const email = document.getElementById("new-client-email").value.trim();
    const phone = document.getElementById("new-client-phone").value.trim();

    if (!isNewClientVisible && !selectedClient) {
      alert("Please select an existing client or add a new one.");
      e.preventDefault();
      return;
    }

    if (isNewClientVisible && (!firstName || !email || !phone)) {
      alert("Please fill out at least first name, email, and phone to create a new client.");
      e.preventDefault();
      return;
    }

    // Optionally: auto-generate full name or validate formats
  });
});

//new appointment
async function openAppointmentPopup(appointment = null) {
  currentEditAppointmentId = appointment ? appointment._id : null;

  const deleteBtn = document.getElementById("delete-appointment-btn");
if (deleteBtn) {
  if (currentEditAppointmentId) {
    deleteBtn.style.display = "inline-block"; // ✅ Show delete in edit mode
  } else {
    deleteBtn.style.display = "none"; // 🚫 Hide delete in create mode
  }
}

  const titleEl = document.getElementById("appointment-popup-title");
  if (titleEl) {
    titleEl.textContent = currentEditAppointmentId ? "Edit Appointment" : "Add Appointment";
  }

  const popup = document.getElementById("popup-create-appointment");

  if (!appointment) {

    // Create mode
    document.getElementById("create-appointment-form").reset();
    document.getElementById("appointment-service").innerHTML = `<option value="">-- Select Service --</option>`;
    document.getElementById("appointment-client").innerHTML = `<option value="">-- Select Client --</option>`;
    document.getElementById("appointment-business").innerHTML = `<option value="">-- Select Business --</option>`;

    await loadAppointmentBusinesses();

    const mainBusiness = document.getElementById("business-dropdown").value;
    if (mainBusiness) {
      document.getElementById("appointment-business").value = mainBusiness;
      await loadAppointmentServices(mainBusiness);
      await loadAppointmentClients(mainBusiness);
    }
  } else {
    // Edit mode

    // Step 1: Extract correct IDs
    const businessId = appointment.businessId?._id || appointment.businessId;
    const serviceId = appointment.serviceId?._id || appointment.serviceId;
    const clientId = appointment.clientId?._id || appointment.clientId;

    // Step 2: Load businesses and pre-select
    await loadAppointmentBusinesses();
    document.getElementById("appointment-business").value = businessId;

    // Step 3: Load services/clients for that business
    await loadAppointmentServices(businessId);
    await loadAppointmentClients(businessId);

    // Step 4: Preselect dropdowns *after* options are loaded
    document.getElementById("appointment-service").value = serviceId;
    document.getElementById("appointment-client").value = clientId;

    // Step 5: Fill in the rest
    document.getElementById("appointment-date").value = appointment.date || "";
    document.getElementById("appointment-time").value = appointment.time || "";
    document.getElementById("appointment-duration").value = appointment.duration || "";
  }

  // Show popup
  popup.style.display = "block";
  document.getElementById("popup-overlay").style.display = "block";
  document.body.classList.add("popup-open");
}


//Delete appointment
document.getElementById("delete-appointment-btn").addEventListener("click", async () => {
  if (!currentEditAppointmentId) return;

  const confirmDelete = confirm("Are you sure you want to delete this appointment?");
  if (!confirmDelete) return;

  try {
    const res = await fetch(`/delete-appointment/${currentEditAppointmentId}`, {
      method: "DELETE"
    });

    const result = await res.json();

    if (res.ok) {
      alert("🗑️ Appointment deleted.");
      closeAppointmentPopup();
      currentEditAppointmentId = null;
      await loadAppointments();
    } else {
      alert(`❌ Failed to delete: ${result.message}`);
    }
  } catch (err) {
    console.error("❌ Error deleting appointment:", err);
    alert("Something went wrong.");
  }
});




////////helper functions 



function getDayIndexFromDate(dateStr) {
  const [targetYear, targetMonth, targetDay] = dateStr.split("-").map(Number);

  for (let i = 0; i < currentWeekDates.length; i++) {
    const date = new Date(currentWeekDates[i]);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    if (
      year === targetYear &&
      month === targetMonth &&
      day === targetDay
    ) {
      return i;
    }
  }

  return -1; // Not found
}



function getCurrentWeekStartDate() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // Sunday = 0
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);
  sunday.setHours(0, 0, 0, 0);
  return sunday;
}

function getTopOffsetFromTime(timeStr) {
  const [hourStr, minuteStr] = timeStr.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  // 15px per 15-minute block
  return (hour * 4 + minute / 15) * 15;
}


function formatTimeTo12Hour(timeStr) {
  const [hour, minute] = timeStr.split(":").map(Number);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute.toString().padStart(2, "0")} ${ampm}`;
}

function getWeekDifferenceFromToday(dateStr) {
  const currentWeekStart = getCurrentWeekStartDate();
  const targetDate = new Date(dateStr);
  const targetWeekStart = getStartOfWeek(targetDate);

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weekDiff = Math.round((targetWeekStart - currentWeekStart) / msPerWeek);
  return weekDiff;
}

function getStartOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // Sunday = 0
  d.setDate(d.getDate() - day);
  return d;
}

//////////////////////Sidebar////////////
//All Clients popup
// ✅ COMBINED version of openClientListPopup
async function openClientListPopup() {
  const dropdown = document.getElementById("inline-client-business");
  dropdown.innerHTML = `<option value="">-- Select Business --</option>`;

  try {
    const res = await fetch("/get-records/Business");
    const businesses = await res.json();

    businesses.forEach(biz => {
      const opt = document.createElement("option");
      opt.value = biz._id;
      opt.textContent = biz.values?.businessName || "Unnamed Business";
      dropdown.appendChild(opt);
    });

    const currentSelected = document.getElementById("business-dropdown").value;
    if (currentSelected) {
      dropdown.value = currentSelected;
    } else if (lastEditedBusinessId) {
      dropdown.value = lastEditedBusinessId;
    }
  } catch (err) {
    console.error("Failed to load businesses for client popup:", err);
  }

  // ✅ Make sure this is included to load the actual clients
  await loadClientList();

  // Show the popup
  document.getElementById("popup-view-clients").style.display = "block";
  document.getElementById("popup-overlay").style.display = "block";
  document.body.classList.add("popup-open");
}

function closeClientListPopup() {
  document.getElementById("popup-view-clients").style.display = "none";
  document.getElementById("popup-overlay").style.display = "none";
  document.body.classList.remove("popup-open");
}

//render client list
async function loadClientList() {
  const container = document.getElementById("client-list-container");
  container.innerHTML = "<p>Loading...</p>";

  try {
    const res = await fetch("/get-all-clients");
    const clients = await res.json();

    // Sort clients alphabetically by full name
    clients.sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName || ""}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName || ""}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    // Render the sorted list
    container.innerHTML = "";
  clients.forEach(client => {
  const name = `${client.firstName} ${client.lastName || ""}`.trim();
  const item = document.createElement("div");
  item.textContent = name;
  item.style.padding = "8px 0";
  item.classList.add("clickable-client");
  item.addEventListener("click", () => showClientDetail(client));
  container.appendChild(item);
});

  } catch (err) {
    console.error("Failed to load client list:", err);
    container.innerHTML = "<p>Error loading clients.</p>";
  }
}

//Show Client Detail 

function showClientDetail(client) {
  // Hide client list and add-client form
  document.getElementById("client-list-container").style.display = "none";
  document.getElementById("inline-add-client-section").style.display = "none";

  // Show the detail section
  const detailSection = document.getElementById("client-detail-section");
  detailSection.style.display = "block";

  // Fill in data
  document.getElementById("detail-name").textContent = `${client.firstName} ${client.lastName || ""}`;
  document.getElementById("detail-email").textContent = client.email ? `📧 ${client.email}` : "❌ No email";
  document.getElementById("detail-phone").textContent = client.phone ? `📞 ${client.phone}` : "❌ No phone";

  // Optional placeholder stats (replace later with real data if needed)
  document.getElementById("detail-stats").innerHTML = `
    <strong>Appointments:</strong> 0<br>
    <strong>Cancellations:</strong> 0<br>
    <strong>No Shows:</strong> 0
  `;

  // ✨ Style the toggle button to be transparent in detail mode
  const toggleBtn = document.getElementById("toggle-add-client-btn");
  toggleBtn.textContent = "Add New Client";
  toggleBtn.classList.add("no-background");
}

// Handle form submission

document.getElementById("inline-add-client-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const businessId = document.getElementById("inline-client-business").value;
  const firstName = document.getElementById("inline-client-first-name").value.trim();
  const lastName = document.getElementById("inline-client-last-name").value.trim();
  const phone = document.getElementById("inline-client-phone").value.trim();
  const email = document.getElementById("inline-client-email").value.trim();

  if (!businessId || !firstName) {
    alert("Please provide at least a business and first name.");
    return;
  }

  try {
    const res = await fetch("/add-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, firstName, lastName, phone, email })
    });

    const data = await res.json();

    if (res.ok) {
      alert("✅ Client saved!");

      // Optional: Clear form
      document.getElementById("inline-add-client-form").reset();

      // Optional: Refresh the client list
      await loadClientList(); // or your existing list-loading function

      // Optional: Hide form, show list again
      document.getElementById("inline-add-client-section").style.display = "none";
      document.getElementById("client-list-container").style.display = "block";

    } else {
      alert(`❌ ${data.message}`);
    }
  } catch (err) {
    console.error("Failed to save client:", err);
    alert("Something went wrong.");
  }
});

function backToClientList() {
  document.getElementById("client-detail-section").style.display = "none";
  document.getElementById("client-list-container").style.display = "block";
}
//Show add client section 
function showAddClientSection() {
  const addSection = document.getElementById("inline-add-client-section");
  const clientList = document.getElementById("client-list-container");
  const clientDetail = document.getElementById("client-detail-section");
  const toggleBtn = document.getElementById("toggle-add-client-btn");

  const isHidden = addSection.style.display === "none";

  // Toggle visibility
  addSection.style.display = isHidden ? "block" : "none";
  clientList.style.display = isHidden ? "none" : "block";
  clientDetail.style.display = "none";

  // Change button text
  toggleBtn.textContent = isHidden ? "View All Clients" : "Add New Client";

  // Always reset background when toggling
  toggleBtn.classList.remove("no-background");
}
