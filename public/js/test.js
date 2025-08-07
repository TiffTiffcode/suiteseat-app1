
document.addEventListener("DOMContentLoaded", () => {
    checkLogin();

    async function checkLogin() {
  try {
    const res = await fetch("/check-login");
    const result = await res.json();

    if (result.loggedIn) {
  document.getElementById("login-status").textContent = `Hi, ${result.firstName || "User"} 👋`;
  buildCalendarLayout();
updateMonthYear();
updateWeekDates();
await loadAll();   // ⬅️ Move this AFTER layout is ready
  await loadAppointments();

}

  } catch (err) {
    console.error("Login check failed:", err);
  }
}

async function refreshCalendar() {
  updateMonthYear();
  updateWeekDates();
  await loadAppointments(); // Load appointments for the new date
}


function updateMonthYear() {
  const monthYearEl = document.getElementById("month-year");
  const options = { month: 'long', year: 'numeric' };
  monthYearEl.textContent = currentDate.toLocaleDateString(undefined, options);
}

function updateWeekDates() {
  // Optional: You can expand this to show week range or render calendar days
  console.log("🗓️ Update week based on currentDate:", currentDate);
}


  // LOGIN
  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    if (!email || !password) return alert("Enter both email and password");

    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const result = await res.json();
    if (res.ok) {
  alert("✅ Login successful!");
  closeLoginPopup(); // ✅ Hide the popup
  
 buildCalendarLayout();
    updateMonthYear();
    updateWeekDates();

    await loadAll();   // ✅ Load businesses, services, appointments
    await loadAppointments();  // ⬅️ force re-render after DOM is ready
  } else {
    alert(result.message || "Login failed");
  }
});

document.getElementById("today-btn").addEventListener("click", () => {
  currentWeekStart = new Date();
  refreshCalendar();
});

document.getElementById("prev-week").addEventListener("click", () => {
  currentWeekStart.setDate(currentWeekStart.getDate() - 7);
  refreshCalendar();
});

document.getElementById("next-week").addEventListener("click", () => {
  currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  refreshCalendar();
});


// Calendar 
function buildCalendarLayout() {
  const hourCol = document.querySelector(".hour-column");
  const grid = document.querySelector(".time-slots-container");

  hourCol.innerHTML = "";
  grid.innerHTML = "";

 for (let h = 0; h < 24; h++) {
  const label = document.createElement("div");
  label.className = "hour-label";
  label.textContent = h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;
  label.style.height = "60px"; // 4 slots per hour
  hourCol.appendChild(label);
}


  for (let d = 0; d < 7; d++) {
    const col = document.createElement("div");
    col.className = "time-column";
    for (let t = 0; t < 96; t++) {
      const slot = document.createElement("div");
      slot.className = "time-slot";
      col.appendChild(slot);
    }
    grid.appendChild(col);
  }
}




  // LOAD EVERYTHING
  async function loadAll() {
    await Promise.all([
      loadBusinesses("client-business"),
      loadBusinesses("appt-business"),
      loadServices(),
      loadAppointments()
    ]);
  }

  // BUSINESS DROPDOWNS
  async function loadBusinesses(selectId) {
    const res = await fetch("/get-records/Business");
    const businesses = await res.json();
    const dropdown = document.getElementById(selectId);
    dropdown.innerHTML = `<option value="">-- Select Business --</option>`;
    businesses.forEach(b => {
      if (!b.values?.businessName) return;
      const opt = document.createElement("option");
      opt.value = b._id;
      opt.textContent = b.values.businessName;
      dropdown.appendChild(opt);
    });
  }

  // SERVICES
  async function loadServices(dropdownId = "appt-service") {
  const res = await fetch("/get-records/Service");
  const services = await res.json();
  const dropdown = document.getElementById(dropdownId);
  dropdown.innerHTML = `<option value="">-- Select Service --</option>`;
  services.forEach(s => {
    if (!s.values?.serviceName) return;
    const opt = document.createElement("option");
    opt.value = s._id;
    opt.textContent = s.values.serviceName;
    dropdown.appendChild(opt);
  });
}


  // LOAD CLIENTS WHEN BUSINESS SELECTED
  document.getElementById("appt-business").addEventListener("change", () => {
    loadClients();
    loadAppointments();
  });

  async function loadClients() {
    const businessId = document.getElementById("appt-business").value;
    const dropdown = document.getElementById("appt-client");
    dropdown.innerHTML = `<option value="">-- Select Client --</option>`;
    if (!businessId) return;

    const res = await fetch("/get-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dataType: "Business Client",
        filter: { "values.businessId": businessId }
      })
    });

    const clients = await res.json();
    clients.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c._id;
      opt.textContent = c.values?.firstName || "Unnamed";
      dropdown.appendChild(opt);
    });
  }


  // ADD CLIENT
  document.getElementById("add-client-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const firstName = document.getElementById("client-name").value.trim();
    const email = document.getElementById("client-email").value.trim();
    const phone = document.getElementById("client-phone").value.trim();
    const businessId = document.getElementById("client-business").value;

    const res = await fetch("/add-record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dataType: "Business Client",
        values: { firstName, email, phone, businessId, isDeleted: false }
      })
    });

    if (res.ok) {
      alert("✅ Client added!");
      document.getElementById("add-client-form").reset();
      if (document.getElementById("appt-business").value === businessId) {
        loadClients(); // Refresh appointment form dropdown only if same business selected
      }
    } else {
      alert("Failed to save client");
    }
  });

  // BOOK APPOINTMENT
  document.getElementById("appointment-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const businessId = document.getElementById("appt-business").value;
    const serviceId = document.getElementById("appt-service").value;
    const clientId = document.getElementById("appt-client").value;
    const date = document.getElementById("appt-date").value;
    const time = document.getElementById("appt-time").value;
    const duration = parseInt(document.getElementById("appt-duration").value);

    if (!businessId || !serviceId || !clientId || !date || !time || !duration) {
      return alert("Fill out all fields.");
    }

    const res = await fetch("/add-record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dataType: "Appointment",
        values: { businessId, serviceId, clientId, date, time, duration }
      })
    });

    if (res.ok) {
      alert("✅ Appointment booked!");
      document.getElementById("appointment-form").reset();
      loadAppointments();
    } else {
      alert("Error booking appointment");
    }
  });

  // SHOW APPOINTMENTS
async function loadAppointments() {
  // Fetch all records in parallel
  const [apptRes, clientRes, serviceRes] = await Promise.all([
    fetch("/get-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataType: "Appointment" })
    }),
    fetch("/get-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataType: "Business Client" })
    }),
    fetch("/get-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataType: "Service" })
    }),
  ]);

  const appointments = await apptRes.json();
  const clients = await clientRes.json();
  const services = await serviceRes.json();


  document.querySelectorAll(".time-column .appointment-block").forEach(el => el.remove());

  appointments.forEach(a => {
    const { clientId, serviceId, date, time, duration = 30 } = a.values;

    const client = clients.find(c => c._id === clientId);
    const service = services.find(s => s._id === serviceId);

    const clientName = client?.values?.firstName || "Unnamed";
    const serviceName = service?.values?.serviceName || "Service";


    // 📆 Add to calendar
    const start = new Date(`${date}T${time}`);
    // ✅ FILTER by current week
const weekStart = new Date(currentWeekStart);
const weekEnd = new Date(currentWeekStart);
weekEnd.setDate(weekStart.getDate() + 7); // next Sunday

if (start < weekStart || start >= weekEnd) {
  return; // ❌ Skip appointment if not in current week
}
const day = start.getDay();  // Sunday = 0
const hour = start.getHours();
const minutes = start.getMinutes();
const index = (hour * 60 + minutes) / 15;

const col = document.querySelectorAll(".time-column")[day];
if (!col) return;

const block = document.createElement("div");
block.className = "appointment-block";
block.style.top = `${index * 15}px`;
block.style.height = `${(duration / 15) * 15}px`;
block.textContent = `${clientName} | ${serviceName}`;

block.addEventListener("click", () => {
  openEditPopup(a); // ⬅️ Pass the full appointment object
});

col.appendChild(block);


  });
}


  // Hook Login & Appointment Buttons
  document.getElementById("open-login-popup-btn")?.addEventListener("click", openLoginPopup);
  document.getElementById("open-appointment-popup-btn")?.addEventListener("click", openAppointmentPopup);
document.getElementById("open-client-popup-btn")?.addEventListener("click", openClientPopup);


  // Load Clients for Edit
  async function loadClientsForEdit(businessId) {
    const dropdown = document.getElementById("edit-client");
    dropdown.innerHTML = `<option value="">-- Select Client --</option>`;
    if (!businessId) return;

    const res = await fetch("/get-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dataType: "Business Client",
        filter: { "values.businessId": businessId }
      })
    });

    const clients = await res.json();
    clients.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c._id;
      opt.textContent = c.values?.firstName || "Unnamed";
      dropdown.appendChild(opt);
    });
  }

  // Open Edit Popup with Data
  function openEditPopup(appt) {
    document.getElementById("edit-appt-id").value = appt._id;
    document.getElementById("edit-date").value = appt.values.date;
    document.getElementById("edit-time").value = appt.values.time;
    document.getElementById("edit-duration").value = appt.values.duration || 30;

    loadBusinesses("edit-business").then(() => {
      document.getElementById("edit-business").value = appt.values.businessId;
    });

    loadClientsForEdit(appt.values.businessId).then(() => {
      document.getElementById("edit-client").value = appt.values.clientId;
    });

    loadServices("edit-service").then(() => {
      document.getElementById("edit-service").value = appt.values.serviceId;
    });

    document.getElementById("edit-popup").style.display = "block";
  }

  // Submit Edit Form
  document.getElementById("edit-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const apptId = document.getElementById("edit-appt-id").value;
    const businessId = document.getElementById("edit-business").value;
    const clientId = document.getElementById("edit-client").value;
    const serviceId = document.getElementById("edit-service").value;
    const date = document.getElementById("edit-date").value;
    const time = document.getElementById("edit-time").value;
    const duration = parseInt(document.getElementById("edit-duration").value);

    if (!apptId || !businessId || !clientId || !serviceId || !date || !time || !duration) {
      return alert("Please fill out all fields.");
    }

    const res = await fetch(`/update-record/${apptId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        values: { businessId, clientId, serviceId, date, time, duration }
      })
    });

    if (res.ok) {
      alert("✅ Appointment updated!");
      closeEditPopup();
      await loadAppointments(); // Refresh calendar
    } else {
      alert("❌ Failed to update appointment");
    }
  });



  // Update Header Dates
  function updateMonthYear() {
  const monthYearDisplay = document.getElementById("month-year");
  if (!monthYearDisplay) return;

  const options = { month: 'long', year: 'numeric' };
  monthYearDisplay.textContent = currentWeekStart.toLocaleDateString(undefined, options);
}


  let currentWeekStart = new Date();

  function updateWeekDates() {
    const startOfWeek = new Date(currentWeekStart);
    startOfWeek.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());

    document.querySelectorAll(".day-date").forEach((el, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      el.textContent = date.getDate();
    });

    const options = { month: 'long', year: 'numeric' };
    document.getElementById("month-year").textContent = startOfWeek.toLocaleDateString(undefined, options);
  }



  
                                         // Popups
  // Log In
  function openLoginPopup() {
    document.getElementById("popup-login").style.display = "block";
  }
 function closeLoginPopup() {
  document.getElementById("popup-login").style.display = "none";
  document.getElementById("popup-overlay").style.display = "none";
  document.body.classList.remove("popup-open");
}

window.closeLoginPopup = closeLoginPopup;


 // Add Client
  function openClientPopup() {
  document.getElementById("popup-client").style.display = "block";
  document.getElementById("popup-overlay").style.display = "block";
  document.body.classList.add("popup-open");
}

function closeClientPopup() {
  document.getElementById("popup-client").style.display = "none";
  document.getElementById("popup-overlay").style.display = "none";
  document.body.classList.remove("popup-open");
}

window.closeClientPopup = closeClientPopup; 

document.getElementById("open-client-popup-btn").addEventListener("click", openClientPopup);


// Add Appointment
  function openAppointmentPopup() {
    document.getElementById("popup-appointment").style.display = "block";
  }
  function closeAppointmentPopup() {
  document.getElementById("popup-appointment").style.display = "none";
  document.getElementById("popup-overlay").style.display = "none";
  document.body.classList.remove("popup-open");
}


  // Edit Appointment
 function closeEditPopup() {
  document.getElementById("edit-popup").style.display = "none";
  document.getElementById("popup-overlay").style.display = "none";
  document.body.classList.remove("popup-open");
}


window.closeLoginPopup = closeLoginPopup;
window.closeClientPopup = closeClientPopup;
window.closeAppointmentPopup = closeAppointmentPopup;
window.closeEditPopup = closeEditPopup;


});


