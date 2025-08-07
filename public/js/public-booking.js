if (!Array.isArray(window.selectedServices)) window.selectedServices = [];
if (typeof window.multiSelectMode === "undefined") window.multiSelectMode = false;


//Login 
let currentUser = null;
const socket = io();
const stripe = Stripe("pk_live_51OUNpKIQ1nIGUF4eTF7bnLg90u4IDbaHyrZ4wHrPAIjneesni2ZSd5a7hl92Cp32KtaYC646eZXifZp62WLwtivh003OiMqPmY"); // Use your PUBLISHABLE key here


socket.on("appointmentUpdated", ({ calendarId, date }) => {
  if (window.selectedCalendarId === calendarId && window.selectedDate === date) {
    console.log("📢 Slot update received — refreshing...");
    fetchAndRenderSlots(calendarId, date, window.selectedService); // ✅ Re-fetch updated slots
  }
});
async function checkLoginStatus() {
  try {
    const res = await fetch("/check-login");
    const data = await res.json();

    if (data.loggedIn) {
      window.currentUser = {
        userId: data.userId,
        clientId: data.clientId, // ✅ This MUST be here
        firstName: data.firstName,
        email: data.email,
        role: data.role
      };

      console.log("✅ Logged in as:", window.currentUser);
    } else {
      window.currentUser = null;
    }
  } catch (err) {
    console.error("Login check failed:", err);
  }
}


//Change time 
function convertTo24Hour(time12h) {
  // If already in 24-hour format, return as-is
  if (!/AM|PM/i.test(time12h)) return time12h;

  const [time, modifier] = time12h.trim().split(/(AM|PM)/i);
  let [hours, minutes] = time.split(":").map(Number);

  if (modifier.toUpperCase() === "PM" && hours !== 12) {
    hours += 12;
  }
  if (modifier.toUpperCase() === "AM" && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}


function convertTo12Hour(time24h) {
  const [hour, minute] = time24h.split(':').map(Number);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${ampm}`;

}
//////
document.addEventListener("DOMContentLoaded", async () => {
  const businessId = window.businessData._id;
  console.log("🌐 Booking for businessId:", businessId);

  try {
    await checkLoginStatus(); // Make sure this is defined
    await fetchCalendars(businessId); // Only now do we call this
  } catch (err) {
    console.error("❌ Failed to load calendars:", err);
  }

});




//////////////////////////////////////////////////////////////


function getLocalDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

document.addEventListener("DOMContentLoaded", async () => {
  const slug = window.location.pathname.slice(1);
window.slug = slug; // ⬅️ Makes it accessible in the browser console

  // 🔎 1. Fetch the business by slug
  const businessRes = await fetch("/get-records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dataType: "Business",
      filter: { slug }

    })
  });
const [business] = await businessRes.json();
window.business = business;
window.businessData = business;

// 📅 2. Fetch calendars for this business
try {
  const calRes = await fetch("/get-records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dataType: "Calendar",
      filter: { businessId: business._id }
    })
  });

 const calendarRes = await fetch("/get-records", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    dataType: "Calendar",
    filter: { businessId }
  })
});

const calendars = await calendarRes.json();
window.businessData.calendars = calendars;
renderCalendars(calendars);

  console.log("📅 Calendars loaded:", calendars);
} catch (err) {
  console.error("❌ Failed to load calendars:", err);
}

if (!business) return alert("Business not found");

const businessId = business._id;
window.selectedBusinessId = businessId;

// ✅ Try to show the uploaded hero image if available
const heroImage = business.values.heroImage;
if (heroImage) {
  document.getElementById("hero-image").src = heroImage;
} else {
  document.getElementById("hero-image").src = "default-header.jpg";
}


  // 📅 2. Load calendars for this business
  const calendarRes = await fetch("/get-records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dataType: "Calendar",
      filter: { businessId }

    })
  });

  const calendars = await calendarRes.json();
  renderCalendars(calendars); // ✅ render outside-scoped function
});


// ✅ Render calendar buttons and auto-open default calendar
function renderCalendars(calendars) {
  const list = document.getElementById("calendar-list");
  list.innerHTML = "<h2>Calendars</h2>"; // changed heading text

  const buttonGroup = document.createElement("div");
  buttonGroup.classList.add("calendar-buttons");

  // Find the default calendar (or fallback to first one)
  const activeCal = calendars.find(c => c.isDefault) || calendars[0];
  if (!activeCal) return;

  calendars
    .filter(cal => !cal.isDeleted)
    .forEach(cal => {
      const btn = document.createElement("button");
      btn.classList.add("calendar-button");
      btn.textContent = cal.calendarName || "Unnamed";

      // ✅ Highlight the default calendar
      if (cal._id === activeCal._id) {
        btn.classList.add("active-calendar");
      }

      btn.addEventListener("click", () => {
        // Remove previous active
        document.querySelectorAll(".calendar-button").forEach(b => b.classList.remove("active-calendar"));
        btn.classList.add("active-calendar");

        showCategories(cal._id);
      });

      buttonGroup.appendChild(btn);
    });

  list.appendChild(buttonGroup);

  // ✅ Automatically show categories for default calendar
  showCategories(activeCal._id);
}


// ✅ Show Categories
async function showCategories(calendarId) {
  document.getElementById("category-section").style.display = "block";
  document.getElementById("services-section").style.display = "none";
  document.getElementById("availability-section").style.display = "none";

  const res = await fetch("/get-records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dataType: "Category",
      filter: { calendarId }  // ✅ not inside values
    })
  });

  const categories = await res.json();
  const container = document.getElementById("category-options");
  container.innerHTML = "";

categories.forEach(cat => {
  const row = document.createElement("div");
  row.classList.add("category-row");

  const nameDiv = document.createElement("div");
  nameDiv.classList.add("category-name");
  nameDiv.textContent = cat.categoryName || "Unnamed Category";

  const selectBtn = document.createElement("button");
  selectBtn.classList.add("category-select-button");
  selectBtn.textContent = "See Times";
 selectBtn.addEventListener("click", () => {
  showServices(cat._id);

  // ✅ Hide the Category section
  document.getElementById("category-section").style.display = "none";

  // ✅ Show Service section (already handled by showServices)
});

  row.appendChild(nameDiv);
  row.appendChild(selectBtn);
  container.appendChild(row);
});

}
//update service box for multiple services 
function updateServiceCheckboxAndButtons() {
  // Show/hide checkboxes
  document.querySelectorAll(".service-checkbox").forEach(cb => {
    cb.style.display = window.multiSelectMode ? "inline-block" : "none";
    if (!window.multiSelectMode) cb.checked = false;
  });

  // Enable/disable the single select "Select" buttons
  document.querySelectorAll(".service-select-btn").forEach(btn => {
    btn.disabled = window.multiSelectMode;
    btn.style.opacity = window.multiSelectMode ? "0.4" : "1";
  });

  // Change the toggle text
  const multiToggle = document.getElementById("add-multi-toggle");
  if (multiToggle) {
    multiToggle.textContent = window.multiSelectMode
      ? "✔️ Done Selecting"
      : "➕ Add Multiple Services";
  }
   const clearBtn = document.getElementById("clear-selected-services");
  if (clearBtn) {
clearBtn.style.display = window.multiSelectMode ? "inline-block" : "none";

  }
}



// ✅ Show Services
// ✅ Show Services (single + multi select supported with <h2 id="add-multi-toggle">)
async function showServices(categoryId) {
  // remember last category so we can re-render when toggling
  window.lastCategoryId = categoryId;

  document.getElementById("services-section").style.display = "block";
  document.getElementById("availability-section").style.display = "none";

  // reset state every time we enter the screen
  // ✅ Only reset if entering services from category screen AND not already in multi-select
if (!window.selectedServices) {
  window.selectedServices = [];
}
if (typeof window.multiSelectMode === "undefined") {
  window.multiSelectMode = false;
}

  const res = await fetch("/get-records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dataType: "Service",
      filter: { categoryId }
    })
  });

  const services = await res.json();
  const container = document.getElementById("service-options");
  container.innerHTML = "";

  // 🔀 Toggle element is your <h2 id="add-multi-toggle">
  const multiToggle = document.getElementById("add-multi-toggle");
  if (multiToggle && !multiToggle.dataset.listenerAdded) {
    multiToggle.style.cursor = "pointer";

    multiToggle.addEventListener("click", () => {
      // flip the mode
      window.multiSelectMode = !window.multiSelectMode;

      if (window.multiSelectMode) {
        // entering multi mode
        window.selectedServices = [];
        multiToggle.textContent = "✔️ Done Selecting";

        // show checkboxes, disable single-select buttons
    updateServiceCheckboxAndButtons();

        // make sure we stay on the services screen
        document.getElementById("availability-section").style.display = "none";
        document.getElementById("services-section").scrollIntoView({ behavior: "smooth" });
       } else {
        // ✅ Exiting multi mode – "Done Selecting" clicked

        // Check if any services are selected
        if (!window.selectedServices || window.selectedServices.length === 0) {
          alert("Please select at least one service.");
          window.multiSelectMode = true; // stay in multi mode
          return;
        }

        const firstService = window.selectedServices[0];
        window.selectedCalendarId = firstService.calendarId;
        window.selectedBusinessId = firstService.businessId;

        // hide checkboxes, re-enable single buttons
        document.querySelectorAll(".service-checkbox").forEach(cb => {
          cb.style.display = "none";
        });
        document.querySelectorAll(".service-select-btn").forEach(btn => {
          btn.disabled = false;
          btn.style.opacity = "1";
        });

        // update toggle text
        multiToggle.textContent = "➕ Add Multiple Services";

        // show calendar and scroll
        document.getElementById("availability-section").style.display = "block";
        document.getElementById("services-section").style.display = "none";

        setTimeout(() => {
          document.getElementById("availability-section").scrollIntoView({ behavior: "smooth" });
        }, 50);

        // fetch available dates using total duration
        const totalDuration = window.selectedServices.reduce((sum, s) => sum + (s.duration || 0), 0);
        fetchAvailableDates(window.selectedBusinessId, window.selectedCalendarId, currentYear, currentMonth, totalDuration);
      }

    });

    multiToggle.dataset.listenerAdded = "true";
  }

  
// 🔁 Render services
services.forEach(service => {
  // show all services no matter what


  

    const wrapper = document.createElement("div");
    wrapper.className = "service-card";

    const topRow = document.createElement("div");
    topRow.className = "service-top-row";

    const namePriceWrapper = document.createElement("div");
    namePriceWrapper.className = "name-price-wrapper";

    // image
    const image = document.createElement("img");
    image.className = "service-image";
    image.src = service.imageUrl || "/uploads/default-placeholder.jpg";
    image.alt = service.serviceName || "Service Image";

    // name
    const name = document.createElement("div");
    name.className = "service-name";
    name.textContent = service.serviceName || "Unnamed Service";

    // price
    const price = document.createElement("div");
    price.className = "service-price";
    price.textContent = `$${parseFloat(service.price).toFixed(2)} for ${service.duration} minutes`;

    const namePriceText = document.createElement("div");
    namePriceText.className = "name-price-text";
    namePriceText.appendChild(name);
    namePriceText.appendChild(price);

    namePriceWrapper.appendChild(image);
    namePriceWrapper.appendChild(namePriceText);

    // ✅ single-select button
    const selectBtn = document.createElement("button");
    selectBtn.className = "service-select-btn";
    selectBtn.textContent = "Select";

    selectBtn.addEventListener("click", async () => {
      // don't allow single-select when in multi mode
      if (window.multiSelectMode) return;

      try {
        const res = await fetch(`/public/service/${service._id}`);
        const fullService = await res.json();

        if (!fullService.calendarId) return alert("No calendar linked to this service.");

        window.selectedService = { ...fullService, _id: fullService._id };
        window.selectedCalendarId = fullService.calendarId._id || fullService.calendarId;
        window.selectedBusinessId = fullService.businessId || (window.business?._id);

        document.getElementById("services-section").style.display = "none";
        document.getElementById("availability-section").style.display = "block";

        // clear slots
        document.getElementById("morning-slots").innerHTML = "";
        document.getElementById("afternoon-slots").innerHTML = "";
        document.getElementById("evening-slots").innerHTML = "";

        // fetch days for this single service duration
        fetchAvailableDates(
          window.selectedBusinessId,
          window.selectedCalendarId,
          currentYear,
          currentMonth,
          fullService.duration
        );
updateServiceCheckboxAndButtons(); 
        setTimeout(() => {
          document.getElementById("custom-calendar-container")?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } catch (err) {
        console.error("❌ Failed to load service:", err);
        alert("Could not load service info.");
      }
    });
      

    // ✅ checkbox (multi select)
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "service-checkbox";
    checkbox.style.marginLeft = "10px";
    checkbox.style.display = "none"; // shown only while in multi mode

// ✅ Set checked if already selected
const alreadySelected = window.selectedServices.some(s => s._id === service._id);
checkbox.checked = alreadySelected;

checkbox.addEventListener("change", async () => {
  console.log("📦 Checkbox clicked for service:", service._id);

  try {
    const res = await fetch(`/public/service/${service._id}`);
    const fullService = await res.json();

    console.log("🎯 Full service from server:", fullService);

    // ✅ Initialize array if it doesn't exist yet
    if (!Array.isArray(window.selectedServices)) {
      window.selectedServices = [];
    }

    if (checkbox.checked) {
      window.selectedService = null;

      // 🔁 Prevent duplicates
      const alreadyExists = window.selectedServices.some(s => s._id === fullService._id);
      if (!alreadyExists) {
        const parsedPrice = parseFloat(fullService.price || fullService.values?.price);
        console.log("💰 Parsed price for multi-select:", parsedPrice);

        window.selectedServices.push({
          ...fullService,
          price: parsedPrice || 0
        });
      }
    } else {
      window.selectedServices = window.selectedServices.filter(s => s._id !== fullService._id);
    }

    console.log("✅ Selected Services:", window.selectedServices);

  } catch (err) {
    console.error("❌ Failed to fetch service details:", err);
  }
});





    topRow.appendChild(namePriceWrapper);
    topRow.appendChild(selectBtn);
    topRow.appendChild(checkbox);

    // description
    const descriptionWrapper = document.createElement("div");
    descriptionWrapper.className = "description-wrapper";

    const desc = document.createElement("div");
    desc.className = "service-description";
    desc.textContent = service.description || "No description provided.";

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "toggle-description";
    toggleBtn.textContent = "Show All";
    toggleBtn.style.display = "none";

    toggleBtn.addEventListener("click", () => {
      const isExpanded = desc.classList.toggle("expanded");
      toggleBtn.textContent = isExpanded ? "Show Less" : "Show All";
    });

    descriptionWrapper.appendChild(desc);
    descriptionWrapper.appendChild(toggleBtn);

    setTimeout(() => {
      if (desc.scrollHeight > desc.offsetHeight + 5) {
        toggleBtn.style.display = "inline";
      }
    }, 0);

    wrapper.appendChild(topRow);
    wrapper.appendChild(descriptionWrapper);
      container.appendChild(wrapper);
  
  });

  // ensure we're on the services section
  document.getElementById("services-section").style.display = "block";
  document.getElementById("availability-section").style.display = "none";
  document.getElementById("services-section").scrollIntoView({ behavior: "smooth" });
}

//Helper to proceed with multi services
function proceedWithSelectedServices() {
  const totalDuration = window.selectedServices.reduce(
    (sum, s) => sum + (s.duration || 0), 0
  );

  if (window.selectedServices.length === 0) {
    alert("Please select at least one service.");
    return;
  }

  const calendarId = window.selectedServices[0].calendarId;
  const businessId = window.selectedServices[0].businessId;

  window.selectedCalendarId = calendarId;
  window.selectedBusinessId = businessId;

  document.getElementById("availability-section").style.display = "block";
  document.getElementById("services-section").style.display = "none";

  setTimeout(() => {
    document.getElementById("availability-section").scrollIntoView({ behavior: "smooth" });
  }, 50);

  fetchAvailableDates(businessId, calendarId, currentYear, currentMonth, totalDuration);
}

//Clear selected services 
const clearBtn = document.getElementById("clear-selected-services");
if (clearBtn) {
  clearBtn.addEventListener("click", () => {
window.selectedServices = [];
window.multiSelectMode = false;

// Uncheck all checkboxes manually
document.querySelectorAll(".service-checkbox").forEach(cb => cb.checked = false);

// Re-enable single-select mode
updateServiceCheckboxAndButtons();

    // Optional scroll
    document.getElementById("services-section").scrollIntoView({ behavior: "smooth" });
  });
}

//Arrow goes back to Categories 
document.addEventListener("DOMContentLoaded", () => {
  const backArrow = document.querySelector(".back-arrow");
  if (backArrow) {
    backArrow.addEventListener("click", () => {
      document.getElementById("services-section").style.display = "none";
      document.getElementById("category-section").style.display = "block";
    });
  }
});

//Change time to mm-dd-yyy


// ✅ Show Availability
//calendar code 
const calendarGrid = document.getElementById("calendar-grid");
const monthYear = document.getElementById("month-year");
let availableDates = []; // We'll fill this dynamically
 // Format: YYYY-MM-DD

function generateCalendar(year, month) {
  calendarGrid.innerHTML = "";

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const firstDay = start.getDay(); // Sunday = 0
  const daysInMonth = end.getDate();

  // Header (Sun–Sat)
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
  dayNames.forEach(d => {
    const dayEl = document.createElement("div");
    dayEl.textContent = d;
    dayEl.classList.add("day-name");
    calendarGrid.appendChild(dayEl);
  });

  // Empty cells before first day of the month
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.classList.add("empty-cell");
    calendarGrid.appendChild(emptyCell);
  }

  // Day cells
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    const dateStr = date.toISOString().split("T")[0];

    const cell = document.createElement("div");
    cell.classList.add("date-cell");
    cell.textContent = i;

    // ✅ Mark today
    const today = new Date();
    if (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    ) {
      cell.classList.add("today");
    }

    // ✅ Mark available dates
   if (availableDates.includes(dateStr)) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // remove time for comparison

  const cellDate = new Date(dateStr + "T00:00:00");

  if (cellDate >= today) {
    // Future or today ✅
    cell.classList.add("available");

    cell.addEventListener("click", () => {
   const selectedService = window.selectedService || {
  serviceName: window.selectedServices.map(s => s.serviceName).join(", "),
  duration: window.selectedServices.reduce((sum, s) => sum + (s.duration || 0), 0),
  description: window.selectedServices.map(s => s.serviceName).join(", "),
  _id: "multi"
};


      // 🧾 Show summary logic (your code below here stays the same)
      const summaryBox = document.getElementById("floating-summary");
      const summaryText = document.getElementById("summary-text");
      const showBtn = document.getElementById("show-summary-btn");

      let serviceNames = "";
      if (window.selectedServices && window.selectedServices.length > 0) {
        serviceNames = window.selectedServices.map(s => s.serviceName).join(", ");
      } else if (window.selectedService) {
        serviceNames = window.selectedService.serviceName;
      } else {
        serviceNames = "No service selected";
      }

      const formattedDate = new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
      });

      summaryText.textContent = `Selected: ${serviceNames} on ${formattedDate}`;
      summaryBox.style.display = "flex";
      showBtn.style.display = "none";
    });
  } else {
    // 🛑 Past date – dim and disable
 // Don't mark it available or styled at all
cell.classList.remove("available"); // remove black circle class
cell.style.pointerEvents = "none"; // still make it unclickable
cell.style.cursor = "default"; // normal cursor

  }



      cell.addEventListener("click", () => {
const selectedService = window.selectedService || {
  serviceName: window.selectedServices.map(s => s.serviceName).join(", "),
  duration: window.selectedServices.reduce((sum, s) => sum + (s.duration || 0), 0),
  description: window.selectedServices.map(s => s.serviceName).join(", "),
  _id: "multi"
};

   
        // Show floating summary when date is clicked

const summaryBox = document.getElementById("floating-summary");
const summaryText = document.getElementById("summary-text");
const showBtn = document.getElementById("show-summary-btn");

// Use selectedServices if multi-select is active, otherwise fallback to selectedService
let serviceNames = "";
if (window.selectedServices && window.selectedServices.length > 0) {
  serviceNames = window.selectedServices.map(s => s.serviceName).join(", ");
} else if (window.selectedService) {
  serviceNames = window.selectedService.serviceName;
} else {
  serviceNames = "No service selected";
}

// Format selected date if you have it, fallback to today
const selectedDate = dateStr || new Date();
const formattedDate = new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric"
});


summaryText.textContent = `Selected: ${serviceNames} on ${formattedDate}`;
summaryBox.style.display = "flex";
showBtn.style.display = "none";


// Make floating-summary draggable
(function makeDraggable() {
  const box = document.getElementById("floating-summary");
  let isDragging = false;
  let offsetX, offsetY;

  box.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - box.getBoundingClientRect().left;
    offsetY = e.clientY - box.getBoundingClientRect().top;
    box.style.transition = "none"; // disable smooth transition during drag
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      box.style.left = `${e.clientX - offsetX}px`;
      box.style.top = `${e.clientY - offsetY}px`;
      box.style.right = "auto"; // remove right so left overrides
      box.style.bottom = "auto";
      box.style.position = "fixed";
    }
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
    box.style.transition = ""; // restore transition if needed
  });
})();

        document.querySelectorAll(".date-cell").forEach(d => d.classList.remove("selected"));
        cell.classList.add("selected");
if (
  window.selectedCalendarId &&
  (window.selectedService || (Array.isArray(window.selectedServices) && window.selectedServices.length > 0))
) {
  // ✅ Make the time slots container visible BEFORE scrolling
  document.getElementById("time-slots-container").style.display = "block";

  // ✅ Now scroll into view after it's visible
  setTimeout(() => {
    document.querySelector(".time-group")?.scrollIntoView({ behavior: "smooth" });
  }, 100);

  // ✅ Create fullService depending on single or multi select
 const fullService = window.selectedService || (() => {
  const totalPrice = window.selectedServices.reduce((sum, s) => sum + parseFloat(s.price ?? s.values?.price ?? 0), 0);
  const totalDuration = window.selectedServices.reduce((sum, s) => sum + parseInt(s.duration ?? s.values?.duration ?? 0), 0);

  return {
  serviceName: window.selectedServices.map(s => s.serviceName).join(", "),

    duration: totalDuration,
    description: window.selectedServices.map(s => s.serviceName).join(", "),
    price: totalPrice,
    _id: "multi",
    businessName: window.business?.values?.businessName || "N/A",
    location: window.business?.values?.address || "N/A",
  };
})();
  fetchAndRenderSlots(window.selectedCalendarId, dateStr, fullService);
} else {
  console.warn("⚠️ Missing calendarId or selected service.");
}
   });
    }

    calendarGrid.appendChild(cell);
  }

  // ✅ Show current month and year at top
  const options = { month: "long", year: "numeric" };
  monthYear.textContent = start.toLocaleDateString(undefined, options);
}

// Setup initial calendar
let currentMonth = 6; // July is month 6 (0-indexed)
let currentYear = 2025;

// ✅ Wrap it inside an async function that runs immediately
(async () => {
  if (window.selectedBusinessId && window.selectedCalendarId) {
    await fetchAvailableDates(window.selectedBusinessId, window.selectedCalendarId, currentYear, currentMonth);
  } else {
    console.warn("⚠️ selectedBusinessId or selectedCalendarId not set yet");
  }
})();


// Add month switching
document.getElementById("prev-month").onclick = async () => {
  const today = new Date();
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();

  // 🛑 Block going to a past month
  if (
    (currentYear < thisYear) ||
    (currentYear === thisYear && currentMonth <= thisMonth)
  ) {
    console.log("⛔ Cannot go to a past month");
    return;
  }

  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }

  await fetchAvailableDates(window.selectedBusinessId, window.selectedCalendarId, currentYear, currentMonth);
};


document.getElementById("next-month").onclick = async () => {

  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
 await fetchAvailableDates(window.selectedBusinessId, window.selectedCalendarId, currentYear, currentMonth);

};


//
function formatTimeLabel(timeStr) {
  // 🔒 If already has AM or PM, don't add it again
  if (timeStr.toUpperCase().includes("AM") || timeStr.toUpperCase().includes("PM")) {
    return timeStr;
  }

  const [hourStr, minuteStr] = timeStr.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr;
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12; 
  return `${hour}:${minute} ${ampm}`;
}

//go back to services 
document.addEventListener("DOMContentLoaded", () => {
  const backToServices = document.querySelector(".back-to-services-arrow");
  if (backToServices) {
    backToServices.addEventListener("click", () => {
      document.getElementById("availability-section").style.display = "none";
      document.getElementById("services-section").style.display = "block";
      document.getElementById("services-section").scrollIntoView({ behavior: "smooth" });
    });
  }
});

async function fetchAvailableDates(businessId, calendarId, year, month) {
  const startOfMonth = new Date(year, month, 1).toISOString().split("T")[0];

  try {

       console.log("📤 Fetching availability from:", `/get-all-upcoming-hours?businessId=${businessId}&calendarId=${calendarId}&start=${startOfMonth}`);

    const res = await fetch(`/get-all-upcoming-hours?businessId=${businessId}&calendarId=${calendarId}&start=${startOfMonth}`);
    const data = await res.json();

     console.log("📦 Full data returned:", data);
    console.log("📋 Upcoming:", data.upcomingHours);

    const upcoming = data.upcomingHours || [];

    // ✅ Only include valid ones
    availableDates = upcoming
      .filter(d => d.isAvailable && d.start && d.end)
     .map(d => new Date(d.date).toISOString().split("T")[0]);

console.log("✅ Filtered availableDates array:", availableDates);
    console.log("✅ Updated availableDates:", availableDates);

    generateCalendar(year, month);
  } catch (err) {
    console.error("❌ Failed to fetch upcoming hours:", err);
    availableDates = [];
    generateCalendar(year, month);
  }
}


async function fetchAndRenderSlots(calendarId, date, fullService) {
  console.log("📥 Calling /get-available-timeslots with:", { calendarId, date, fullService });

  try {
    const res = await fetch("/get-available-timeslots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calendarId, date, fullService })
    });

    const data = await res.json();
    console.log("🧪 Raw data from server:", data);

    const slots = Array.isArray(data) ? data : data.slots || [...(data.morning || []), ...(data.afternoon || []), ...(data.evening || [])];
    console.log("📅 Available slots after refresh:", slots);

    // Clear old slots
    document.getElementById("morning-slots").innerHTML = "";
    document.getElementById("afternoon-slots").innerHTML = "";
    document.getElementById("evening-slots").innerHTML = "";

    if (!Array.isArray(slots) || slots.length === 0) {
      document.getElementById("morning-slots").innerHTML = "<div>No slots available.</div>";
      return;
    }

    slots.forEach(time => {
      const hour = parseInt(time.split(":")[0], 10);
      const slotDiv = document.createElement("div");
      slotDiv.className = "time-slot";
      slotDiv.textContent = time;  // ✅ Just use the string sent from server


      slotDiv.addEventListener("click", () => {
    openPopup("popup-add-calendar");

// ✅ Show services in confirmation popup


console.log("🧪 Incoming dateStr:", date);

const dateLabel = new Date(date + "T12:00:00").toLocaleDateString("en-US", {
  weekday: "long", month: "long", day: "numeric", year: "numeric"
});

        const formattedTime = formatTimeLabel(time);

        window.selectedCalendarId = calendarId;
        window.selectedTime = convertTo24Hour(time);  // ok here
        window.selectedDate = date;
        window.selectedServiceId = fullService._id;
        window.selectedServiceName = fullService.serviceName;
        window.selectedDuration = fullService.duration;
        window.selectedNote = fullService.description;
        window.selectedPrice = fullService.price ;
        window.selectedProviderName = window.business?.values?.businessName;
        window.selectedLocation = window.business?.values?.address || "N/A";

        document.getElementById("confirm-date-time").textContent = `${dateLabel} at ${formattedTime}`;
        document.getElementById("confirm-provider-name").textContent = fullService.businessName || "N/A";
       const locationName = window.business?.values?.locationName || "N/A";
const locationAddress = window.business?.values?.businessAddress || "N/A";

document.getElementById("confirm-location-name").textContent = locationName;
document.getElementById("confirm-location-address").textContent = locationAddress;


// ✅ Show selected services in the popup


          // 💡 Multi-service support
const confirmServiceList = document.getElementById("confirm-service-list");
confirmServiceList.innerHTML = "";

let totalPrice = 0;
let totalDuration = 0;

if (window.multiSelectMode && Array.isArray(window.selectedServices)) {
  window.selectedServices.forEach(service => {
    const price = parseFloat(service.price ?? service.values?.price ?? 0);
    const duration = parseInt(service.duration ?? service.values?.duration ?? 0);
    const name = service.serviceName || service.name || service.values?.name || "Unnamed";

    const li = document.createElement("li");
    li.className = "service-item";
    li.innerHTML = `
      <div class="service-name">${name}</div>
      <div class="service-details">${duration} mins – $${price.toFixed(2)}</div>
    `;

    confirmServiceList.appendChild(li);
    totalDuration += duration;
    totalPrice += price;
  });
} else {
  const price = parseFloat(fullService.price || 0);
  const li = document.createElement("li");
  li.className = "service-item";
  li.innerHTML = `
    <div class="service-name">${fullService.serviceName}</div>
    <div class="service-details">${fullService.duration || 0} mins – $${price.toFixed(2)}</div>
  `;
  confirmServiceList.appendChild(li);
  totalDuration = fullService.duration || 0;
  totalPrice = price;
}


document.getElementById("confirm-duration").textContent = `${totalDuration} mins`;
document.getElementById("confirm-note").textContent = "";

const priceRow = document.getElementById("confirm-price-row");

if (window.multiSelectMode && window.selectedServices?.length > 0) {
  // 🛑 Hide total price when multiple services are selected
  priceRow.style.display = "none";
} else {
  // ✅ Show price for single service
  priceRow.style.display = "block";
  document.getElementById("confirm-total-price").textContent = `$${totalPrice.toFixed(2)}`;
}

  });

      // Decide where to put it
      if (time.includes("AM") && hour < 12) {
        document.getElementById("morning-slots").appendChild(slotDiv);
      } else if (time.includes("PM") && hour < 5) {
        document.getElementById("afternoon-slots").appendChild(slotDiv);
      } else {
        document.getElementById("evening-slots").appendChild(slotDiv);
      }
    });

  } catch (err) {
    console.error("❌ Error loading slots:", err);
  }
}


//hide summary floating group
document.getElementById("hide-summary-btn").addEventListener("click", () => {
  document.getElementById("floating-summary").style.display = "none";
  document.getElementById("show-summary-btn").style.display = "block";
});

document.getElementById("show-summary-btn").addEventListener("click", () => {
  document.getElementById("floating-summary").style.display = "flex";
  document.getElementById("show-summary-btn").style.display = "none";
});








//SHow appointment confirmation popup 
//Open the popup 
function openPopup(popupId) {
  document.getElementById(popupId).style.display = "block";
  document.getElementById("popup-overlay").style.display = "block";
  document.body.classList.add("popup-open");
  setupStripeElements(); // ✅ Load Stripe card UI when popup opens

}

function closeAddCalendarPopup() {
  document.getElementById("popup-add-calendar").style.display = "none";
  document.getElementById("popup-overlay").style.display = "none";
  document.body.classList.remove("popup-open");
}

//Stripe Set up 

async function setupStripeElements() {
  // Replace with your actual publishable key
  if (!stripe) stripe = Stripe("your_publishable_key_here");

  const elements = stripe.elements();

  // Clear existing mount (if any)
  const cardContainer = document.getElementById("card-element");
  cardContainer.innerHTML = "";

  // Create new card element
  card = elements.create("card");
  card.mount("#card-element");

  card.on("change", (event) => {
    document.getElementById("card-errors").textContent = event.error?.message || "";
  });
}


//Utility function to format date and time in popup
function formatFullDateTime(dateStr, timeStr) {
  const [hour, minute] = timeStr.split(":").map(Number);
  const baseDate = new Date(dateStr + "T12:00:00");  // fixes date shifting
  baseDate.setHours(hour);
  baseDate.setMinutes(minute);

  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };

  return baseDate.toLocaleString("en-US", options); // ✅ fix typo here
}

//Stripe 



//Book Appointment 
document.getElementById("book-now-button").addEventListener("click", async () => {
  if (!currentUser) {
    // 👇 Save for after login
    window.pendingBooking = {
      calendarId: window.selectedCalendarId,
      businessId: window.business?._id,
      serviceId: window.selectedServiceId,
      appointmentDate: window.selectedDate,
      appointmentTime: window.selectedTime,
      duration: window.selectedDuration,
      serviceName: window.selectedServiceName,
      note: window.selectedNote || ""
    };

    document.getElementById("popup-login").style.display = "block";
    document.getElementById("popup-add-calendar").style.display = "none";
    return;
  }

  // ✅ STEP 1: Create payment intent from server
 const intentRes = await fetch("/create-payment-intent", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    amount: 100, // in cents
    businessName: window.business?.values?.businessName || "SUITESEAT"
  })
});

const intentData = await intentRes.json();
if (!intentData.clientSecret) {
  return alert("❌ Failed to initiate payment");
}

// 🔒 Disable the button to prevent double clicks
const bookNowBtn = document.getElementById("book-now-btn");
if (bookNowBtn) bookNowBtn.disabled = true;

// ✅ STEP 2: Confirm card payment
const { paymentIntent, error } = await stripe.confirmCardPayment(intentData.clientSecret, {
  payment_method: {
    card,
    billing_details: {
      name: currentUser.firstName || "Client"
    }
  }
});

// 🔓 Re-enable the button afterward
if (bookNowBtn) bookNowBtn.disabled = false;

if (error) {
  alert("❌ Payment failed: " + error.message);
  return;
}

// ✅ Payment successful — continue booking
alert("🎉 Payment successful!");


  // ✅ STEP 3: Payment succeeded – now book appointment
  const appointmentData = {
    calendarId: window.selectedCalendarId,
    businessId: window.business?._id,
  clientId: currentUser?.clientId || null,

    createdBy: currentUser.userId,
    serviceId: window.selectedServiceId,
    appointmentDate: window.selectedDate,
    appointmentTime: window.selectedTime,
    duration: window.selectedDuration,
    serviceName: window.selectedServiceName,
    note: window.selectedNote || ""
  };

  try {
   console.log("📤 Public Booking → Sending clientId to server:", currentUser.userId);

    const res = await fetch("/book-appointment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(appointmentData)
    });

    const result = await res.json();
    if (res.ok) {
      alert("✅ Appointment booked!");
      closeAddCalendarPopup();

      await fetchAndRenderSlots(window.selectedCalendarId, window.selectedDate, {
        _id: window.selectedServiceId,
        duration: window.selectedDuration,
        serviceName: window.selectedServiceName,
        description: window.selectedNote,
      });

// 🔁 Redirect to the client dashboard page
window.location.href = "/client-dashboard"; 
   
} else {
      alert("❌ " + result.message);
    }
  } catch (err) {
    console.error("Booking error:", err);
    alert("Something went wrong while booking.");
  }
});


//Log userin 
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  try {
    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (res.ok) {
      alert("✅ Logged in!");

      // ✅ Refresh login state
      await checkLoginStatus();

      // Hide login and reopen appointment popup
      document.getElementById("popup-login").style.display = "none";
      document.getElementById("popup-add-calendar").style.display = "block";
if (window.pendingBooking) {
  // 🔁 Restore selected info
  window.selectedCalendarId = window.pendingBooking.calendarId;
  window.selectedServiceId = window.pendingBooking.serviceId;
  window.selectedDate = window.pendingBooking.appointmentDate;
  window.selectedTime = window.pendingBooking.appointmentTime;
  window.selectedDuration = window.pendingBooking.duration;
  window.selectedServiceName = window.pendingBooking.serviceName;
  window.selectedNote = window.pendingBooking.note;
  window.business = { _id: window.pendingBooking.businessId };

  // 📝 Build appointment object
  const data = {
    ...window.pendingBooking,
 clientId: currentUser?.clientId || null, // no crash if it's missing
 createdBy: currentUser?.userId || null,
  };

  try {
    const bookRes = await fetch("/book-appointment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await bookRes.json();
    if (bookRes.ok) {
      alert("✅ Appointment booked!");
      closeAddCalendarPopup();

      await fetchAndRenderSlots(data.calendarId, data.appointmentDate, {
        _id: data.serviceId,
        duration: data.duration,
        serviceName: data.serviceName,
        description: data.note,
      });

      window.pendingBooking = null; // Clear the booking
    } else {
      alert("❌ " + result.message);
    }
  } catch (err) {
    console.error("Booking error after login:", err);
    alert("Something went wrong while booking.");
  }
}

    } else {
      const result = await res.json();
      alert(result.message || "Login failed");
    }
  } catch (err) {
    console.error("Login failed:", err);
    alert("Something went wrong.");
  }
});
