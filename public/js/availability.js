

document.addEventListener("DOMContentLoaded", async () => {

  const loginStatus = document.getElementById("user-greeting");
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

        // ✅ Load businesses once user is confirmed logged in
        loadUserBusinessesIntoDropdown();


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
          closeLoginPopup();
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


                    //Menu section 
const sidebar = document.getElementById("calendar-sidebar");
const openBtn = document.getElementById("open-sidebar-btn");
const closeBtn = document.getElementById("close-sidebar-btn");
const calendarContainer = document.querySelector(".calendar-container");

closeBtn.addEventListener("click", () => {
  sidebar.classList.add("hidden");
  calendarContainer.classList.add("full-width");
  openBtn.style.display = "block";
  closeBtn.style.display = "none";
});

openBtn.addEventListener("click", () => {
  sidebar.classList.remove("hidden");
  calendarContainer.classList.remove("full-width");
  openBtn.style.display = "none";
  closeBtn.style.display = "block";
});


  // ✅ Load businesses into dropdown
 async function loadUserBusinessesIntoDropdown() {
  try {
    const res = await fetch("/get-records/Business");
    const businesses = await res.json();

    const businessDropdown = document.getElementById("dropdown-category-business");
    businessDropdown.innerHTML = '<option value="">-- Select --</option>';

    if (!Array.isArray(businesses) || businesses.length === 0) return;

    // Pick the last business
    const lastBusiness = businesses[businesses.length - 1];
    const businessId = lastBusiness._id;

    businesses.forEach(biz => {
      const option = document.createElement("option");
      option.value = biz._id;
      option.textContent = biz.businessName || biz.values?.businessName || "Unnamed Business";
      businessDropdown.appendChild(option);
    });

    // Auto-select last business
    businessDropdown.value = businessId;

    // Fetch calendars for that business
    const calRes = await fetch(`/get-calendars?businessId=${businessId}`);
    const calendars = await calRes.json();

    const calendarDropdown = document.getElementById("dropdown-availability-calendar");
    calendarDropdown.innerHTML = '<option value="">-- Select --</option>';
    calendarDropdown.disabled = false;

    if (!Array.isArray(calendars) || calendars.length === 0) return;

    // Pick last calendar
    const lastCalendar = calendars[calendars.length - 1];
    const calendarId = lastCalendar._id;

    calendars.forEach(cal => {
      const option = document.createElement("option");
      option.value = cal._id;
      option.textContent = cal.calendarName || cal.name || "Unnamed Calendar";
      calendarDropdown.appendChild(option);
    });

    // Auto-select last calendar
    calendarDropdown.value = calendarId;

    // ✅ Trigger calendar loading
    window.currentYear = new Date().getFullYear();
    window.currentMonth = new Date().getMonth();
    loadAndGenerateCalendar();

  } catch (err) {
    console.error("❌ Failed to preselect business/calendar:", err);
  }
}


//Load calendars in dropdown 
document.getElementById("dropdown-category-business").addEventListener("change", async (e) => {
  const businessId = e.target.value;
  const calendarDropdown = document.getElementById("dropdown-availability-calendar");

  // Reset calendar dropdown
  calendarDropdown.innerHTML = '<option value="">-- Select --</option>';
  calendarDropdown.disabled = true;

  if (!businessId) return;

  try {
    const res = await fetch(`/get-calendars?businessId=${businessId}`);
    const calendars = await res.json();

    if (!calendars.length) {
      console.warn("📭 No calendars found for business:", businessId);
    }

 calendars.forEach(cal => {
  console.log("🔍 Calendar object:", cal); // 👈 Add this to inspect

  const name = cal.calendarName;
  if (!name) {
    console.warn("⚠️ Calendar is missing name:", cal);
    return;
  }

  const option = document.createElement("option");
  option.value = cal._id;
  option.textContent = name;
  calendarDropdown.appendChild(option);
});


    calendarDropdown.disabled = false;
    console.log("✅ Calendars loaded:", calendars);
  } catch (err) {
    console.error("❌ Failed to load calendars:", err);
    alert("Could not load calendars for this business.");
  }
});

//Show times on calendar for Upcoming Hours 
document.getElementById("dropdown-availability-calendar")?.addEventListener("change", () => {
  loadAndGenerateCalendar();
});

document.getElementById("dropdown-category-business")?.addEventListener("change", () => {
  loadAndGenerateCalendar();
});


       /////Tab Switching 
 const calendarTabs = document.querySelectorAll(".calendarOptions");
const calendarSections = document.querySelectorAll(".content-area > div");

calendarTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    const targetId = tab.getAttribute("data-target");

    // Hide all sections
    calendarSections.forEach(section => {
      section.style.display = "none";
    });

    // Remove active class from all tabs
    calendarTabs.forEach(t => t.classList.remove("active-tab"));

    // Show selected section and mark tab as active
    const targetSection = document.getElementById(targetId);
    if (targetSection) targetSection.style.display = "block";
    tab.classList.add("active-tab");
  });
});

 
////////////Manage Availability Section 
//Show Availability in the weekly availability group
document.getElementById("dropdown-availability-calendar").addEventListener("change", async (e) => {
  const calendarId = e.target.value;
  const businessId = document.getElementById("dropdown-category-business").value;

  if (!calendarId || !businessId) return;

  try {
    const res = await fetch(`/get-weekly-availability?calendarId=${calendarId}&businessId=${businessId}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to fetch availability");
    }

    const summaryList = document.getElementById("availability-summary-list");
    summaryList.innerHTML = "";

    const allDays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    // Create a map to access saved availability by day
    const availabilityMap = {};
    (data.availability || []).forEach(item => {
      availabilityMap[item.day] = item;
    });

    allDays.forEach(day => {
      const toggle = document.getElementById(`toggle-${day}`);
      const startSelect = document.getElementById(`start-${day}`);
      const endSelect = document.getElementById(`end-${day}`);
      const timeRow = document.querySelector(`.${day}-times`);

      const saved = availabilityMap[day];

      if (saved) {
        // Show row, check toggle, and select times
        toggle.checked = true;
        timeRow.style.display = "flex";
        startSelect.value = saved.start;
        endSelect.value = saved.end;

        const li = document.createElement("li");
        li.textContent = `${capitalize(day)}: ${saved.start} – ${saved.end}`;
        summaryList.appendChild(li);
      } else {
        // Hide row and uncheck toggle
        toggle.checked = false;
        timeRow.style.display = "none";
        startSelect.value = "";
        endSelect.value = "";
      }
    });

    console.log("✅ Availability prefilled:", availabilityMap);
  } catch (err) {
    console.error("❌ Error loading availability:", err);
    alert("Could not load weekly availability.");
  }
});

// Capitalize helper
function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Attach toggle behavior to all day toggles
document.querySelectorAll(".day-toggle").forEach(toggle => {
  toggle.addEventListener("change", () => {
    const targetClass = toggle.getAttribute("data-target"); // e.g., "sunday-times"
    const timeRow = document.querySelector(`.${targetClass}`);
    
    if (toggle.checked) {
      timeRow.style.display = "flex"; // or "block" depending on your layout
    } else {
      timeRow.style.display = "none";
    }
  });
});


// 🔄 On page load: hide time rows if toggles are unchecked
document.querySelectorAll(".day-toggle").forEach(toggle => {
  const targetClass = toggle.getAttribute("data-target");
  const timeRow = document.querySelector(`.${targetClass}`);
  if (!toggle.checked && timeRow) {
    timeRow.style.display = "none";
  }
});

// ✅ When toggles are changed: show/hide time rows
document.querySelectorAll(".day-toggle").forEach(toggle => {
  toggle.addEventListener("change", () => {
    const targetClass = toggle.getAttribute("data-target");
    const timeRow = document.querySelector(`.${targetClass}`);
    if (toggle.checked) {
      timeRow.style.display = "flex"; // Or "block" depending on layout
    } else {
      timeRow.style.display = "none";
    }
  });
});



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

//Save Weekly Availability 
document.getElementById("save-availability-btn").addEventListener("click", async () => {
  const businessId = document.getElementById("dropdown-category-business").value;
  const calendarId = document.getElementById("dropdown-availability-calendar").value;

  if (!businessId || !calendarId) {
    return alert("Please select both a business and a calendar.");
  }

  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const availability = [];

  days.forEach(day => {
    const toggle = document.getElementById(`toggle-${day}`);
    const start = document.getElementById(`start-${day}`).value;
    const end = document.getElementById(`end-${day}`).value;

    if (toggle.checked && start && end) {
      availability.push({ day, start, end });
    }
  });

  if (availability.length === 0) {
    return alert("You must select at least one day with start and end times.");
  }

  try {
    const res = await fetch("/save-weekly-availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, calendarId, availability }),
    });

    const result = await res.json();
    if (res.ok) {
      alert("✅ Weekly availability saved!");
    } else {
      alert(result.message || "Something went wrong.");
    }
  } catch (err) {
    console.error("❌ Save error:", err);
    alert("Could not save availability.");
  }
});


//Upcoming Hours 
initializeAllTimeSelects(); // Call this to populate all time dropdowns

// Initialize currentWeekStart for the upcoming hours section
currentWeekStart = getStartOfWeek(new Date());

// Initial display setup for "Adjust Upcoming Hours" tab
// This will set up the week display AND attempt to load data (from temp or server)
// This needs to be called AFTER dropdowns might have loaded their values.
updateWeekDisplay(); // Call updateWeekDisplay on initial load


// Event listener for the "Previous Week" button in Upcoming Hours
document.getElementById("prev-week")?.addEventListener("click", async () => {
    const calendarId = document.getElementById("dropdown-availability-calendar")?.value;
    const businessId = document.getElementById("dropdown-category-business")?.value;

    if (calendarId && businessId) {
        // SAVE the CURRENT week's data BEFORE changing currentWeekStart
        saveCurrentUpcomingWeekToTemp(calendarId, businessId, currentWeekStart);
    }

    currentWeekStart.setDate(currentWeekStart.getDate() - 7); // Go back one week
    await updateWeekDisplay(); // Update the UI for the new week (will load from temp or fetch)
});

// Event listener for the "Next Week" button in Upcoming Hours
document.getElementById("next-week")?.addEventListener("click", async () => {
    const calendarId = document.getElementById("dropdown-availability-calendar")?.value;
    const businessId = document.getElementById("dropdown-category-business")?.value;

    if (calendarId && businessId) {
        // SAVE the CURRENT week's data BEFORE changing currentWeekStart
        saveCurrentUpcomingWeekToTemp(calendarId, businessId, currentWeekStart);
    }

    currentWeekStart.setDate(currentWeekStart.getDate() + 7); // Go forward one week
    await updateWeekDisplay(); // Update the UI for the new week (will load from temp or fetch)
});

// Event listener for the "Save Upcoming Hours" button
document.getElementById("save-upcoming-hours-btn")?.addEventListener("click", async () => {
    const businessId = document.getElementById("dropdown-category-business")?.value;
    const calendarId = document.getElementById("dropdown-availability-calendar")?.value;
    // Use the currently displayed week for saving
    const weekStartDateStr = currentWeekStart.toISOString().split("T")[0];

    if (!businessId || !calendarId) {
        return alert("Please select both a business and a calendar to save upcoming hours.");
    }

    // Ensure the current week's state is saved to tempWeeklyHours before collecting all data
    saveCurrentUpcomingWeekToTemp(calendarId, businessId, currentWeekStart);

    // Collect ALL saved weeks from tempWeeklyHours that belong to the current business/calendar
    const allWeeksToSave = [];
    for (const key in tempWeeklyHours) {
        if (tempWeeklyHours.hasOwnProperty(key)) {
            // Key format: calendarId_businessId_YYYY-MM-DD
            const [cachedCalendarId, cachedBusinessId, cachedDateStr] = key.split('_');

            if (cachedCalendarId === calendarId && cachedBusinessId === businessId) {
                const weekData = tempWeeklyHours[key];
                // Only include weeks that have at least one 'available' entry or are explicitly set
                const hasAvailable = weekData.some(day => day.isAvailable);
                const hasUnavailable = weekData.some(day => !day.isAvailable); // Consider saving explicit unavailable
                
                if (hasAvailable || hasUnavailable) { // Save even if all days are explicitly unavailable
                    allWeeksToSave.push({
                        weekStartDate: cachedDateStr,
                        upcomingHours: weekData
                    });
                }
            }
        }
    }

    if (allWeeksToSave.length === 0) {
        return alert("No upcoming hours to save across all weeks. Please set at least one available slot in any week.");
    }
console.log("🧪 Sending weeks data:", allWeeksToSave);
    try {
        const res = await fetch("/save-upcoming-hours", { // *** NEW ENDPOINT SUGGESTION ***
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                businessId,
                calendarId,
                weeksData: allWeeksToSave // Sending an array of weeks
            }),
        });

        const result = await res.json();
        if (res.ok) {
            alert("✅ All upcoming hours saved!");
            // Clear the entire temp cache for this business/calendar after successful save
            for (const key in tempWeeklyHours) {
                if (tempWeeklyHours.hasOwnProperty(key)) {
                    const [cachedCalendarId, cachedBusinessId] = key.split('_');
                    if (cachedCalendarId === calendarId && cachedBusinessId === businessId) {
                        delete tempWeeklyHours[key];
                    }
                }
            }
            // Re-load the current week after clearing cache to reflect saved state from server
            await updateWeekDisplay();

        } else {
            alert(result.message || "Something went wrong saving upcoming hours.");
        }
    } catch (err) {
        console.error("❌ Save upcoming hours error:", err);
        alert("Could not save upcoming hours.");
    }
});


// Attach toggle behavior for upcoming hours (show/hide time rows)
document.querySelectorAll('#upcomingHours-section .day-toggle').forEach(toggle => {
    toggle.addEventListener("change", () => {
        const dayName = toggle.id.replace('toggle-upcoming-', ''); // e.g., 'sunday'
        const timeRow = document.querySelector(`.${dayName}-times`);

        if (timeRow) {
            timeRow.style.display = toggle.checked ? "flex" : "none";
            if (!toggle.checked) {
                // Clear time inputs if the day is toggled off
                const startSelect = document.getElementById(`start-upcoming-${dayName}`);
                const endSelect = document.getElementById(`end-upcoming-${dayName}`);
                if (startSelect) startSelect.value = "";
                if (endSelect) endSelect.value = "";
            }
        }
    });
});

// Initial display state of upcoming hours day toggles (e.g., if unchecked, hide time rows)
// This runs once on page load.
document.querySelectorAll('#upcomingHours-section .day-toggle').forEach(toggle => {
    const dayName = toggle.id.replace('toggle-upcoming-', '');
    const timeRow = document.querySelector(`.${dayName}-times`);
    if (timeRow && !toggle.checked) {
        timeRow.style.display = "none";
    }
});


// Add these event listeners if you haven't already, as they are crucial for logic
// IMPORTANT: If you have a tab switching mechanism, ensure that when the
// "Adjust Upcoming Hours" tab is clicked, you call `updateWeekDisplay()`.
// This will ensure the correct week's data is loaded and displayed.
document.querySelectorAll(".calendarOptions").forEach(option => {
    option.addEventListener("click", async () => { // Make async
        const label = option.textContent.trim();
        // ... (your existing tab switching logic) ...

        if (label === "Adjust Upcoming Hours") {
            const businessId = document.getElementById("dropdown-category-business")?.value;
            const calendarId = document.getElementById("dropdown-availability-calendar")?.value;
            if (businessId && calendarId) {
                currentWeekStart = getStartOfWeek(new Date()); // Reset to current week
                await updateWeekDisplay(); // Await this call
            } else {
                // Clear upcoming hours UI if tab is opened with no selection
                // (This logic is already in updateWeekDisplay for no selection,
                // but you might want to force it here if you hide the whole section too)
            }
        }
    });
});

// Additionally, when the `dropdown-availability-calendar` changes value,
// you should also trigger `updateWeekDisplay()` to load the upcoming
// hours for the newly selected calendar.
document.getElementById("dropdown-availability-calendar")?.addEventListener("change", async (event) => { // Make async
    // ... (your existing calendar change logic for availability section) ...

    // After updating availability, update upcoming hours
    const businessId = document.getElementById("dropdown-category-business")?.value;
    const calendarId = event.target.value;
    if (businessId && calendarId) {
        currentWeekStart = getStartOfWeek(new Date()); // Reset to current week
        await updateWeekDisplay(); // Await this call
    } else {
        // Clear upcoming hours UI if no calendar selected
        const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        days.forEach(day => {
            const toggle = document.getElementById(`toggle-upcoming-${day}`);
            const timeRow = document.querySelector(`.${day}-times`);
            const startSelect = document.getElementById(`start-upcoming-${day}`);
            const endSelect = document.getElementById(`end-upcoming-${day}`);
            if (toggle) toggle.checked = false;
            if (timeRow) timeRow.style.display = "none";
            if (startSelect) startSelect.value = "";
            if (endSelect) endSelect.value = "";
        });
    }
});



//Upcoming Hours Calendar 
// Get references to DOM elements
        const monthYearDisplay = document.getElementById('monthYear');
        const calendarDaysGrid = document.getElementById('calendarDays');
        const prevMonthBtn = document.getElementById('prevMonth');
        const nextMonthBtn = document.getElementById('nextMonth');

        // Initialize current date
        let currentDate = new Date();
        let currentMonth = currentDate.getMonth();
        let currentYear = currentDate.getFullYear();
        const today = new Date(); // ✅ To highlight today's date


        /**
         * Generates and displays the calendar for a given year and month.
         * @param {number} year - The year to display.
         * @param {number} month - The month to display (0-indexed: 0 for January, 11 for December).
         */



async function loadAndGenerateCalendar() {
  let savedHoursMap = {};
  const businessId = document.getElementById("dropdown-category-business")?.value;
  const calendarId = document.getElementById("dropdown-availability-calendar")?.value;

  if (businessId && calendarId) {
    try {
      // ✅ NEW startDate logic
      const startDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;

      // ✅ Updated fetch line with `start` param
      const res = await fetch(`/get-all-upcoming-hours?businessId=${businessId}&calendarId=${calendarId}&start=${startDate}`);
      const data = await res.json();
      console.log("📅 Loaded upcoming hours:", data);

   data.upcomingHours.forEach(entry => {
const iso = entry.date.split("T")[0];


  savedHoursMap[iso] = {
    start: entry.start,
    end: entry.end
  };
});

console.log("🧩 Saved Hours Map keys:", Object.keys(savedHoursMap));

    } catch (err) {
      console.error("❌ Failed to fetch availability:", err);
    }
  }

  console.log("📅 Loaded availability:", savedHoursMap);
  generateCalendar(currentYear, currentMonth, savedHoursMap); // ⬅️ still here
}



function generateCalendar(year, month, savedHoursMap = {}) {
  console.log("🧭 Inside generateCalendar:", savedHoursMap);
  calendarDaysGrid.innerHTML = '';

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  monthYearDisplay.textContent = `${monthNames[month]} ${year}`;

  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Add empty cells before the 1st
  for (let i = 0; i < startDayOfWeek; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.classList.add('day-cell', 'empty');
    calendarDaysGrid.appendChild(emptyCell);
  }

  // 🔁 Add day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = document.createElement('div');
    dayCell.classList.add('day-cell');
    dayCell.textContent = day;

    // Highlight today
    if (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    ) {
      dayCell.classList.add('current-day');
    }

  const isoDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
console.log("🔍 Checking day:", isoDate, "→", savedHoursMap[isoDate]);
console.log("🔍 Checking", isoDate, "→", savedHoursMap[isoDate] ? "✅ found" : "❌ not found");

if (savedHoursMap[isoDate]) {
  const timeDiv = document.createElement("div");
  timeDiv.classList.add("availability-time");

  const start = savedHoursMap[isoDate].start;
  const end = savedHoursMap[isoDate].end;

  timeDiv.textContent = `${start} – ${end}`;
  timeDiv.style.fontSize = "10px";
  timeDiv.style.marginTop = "4px";

  dayCell.classList.add("has-availability");
  dayCell.appendChild(timeDiv);
}




    // 👆 Popup click
    dayCell.addEventListener("click", () => {
      openAvailabilityPopup(year, month, day);
    });

    calendarDaysGrid.appendChild(dayCell);
  }
}

        // Event listener for previous month button
        prevMonthBtn.addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11; // Wrap around to December
                currentYear--;     // Go to previous year
            }
           loadAndGenerateCalendar();

        });

        // Event listener for next month button
        nextMonthBtn.addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0; // Wrap around to January
                currentYear++;     // Go to next year
            }
            loadAndGenerateCalendar();

        });

        // Initial calendar generation on page load
      window.onload = () => {
  loadAndGenerateCalendar();
};

//Gerate  times in dropdowns 
function convert24To12(time24) {
  if (!time24) return "";
  const [hourStr, minute] = time24.split(":");
  let hour = parseInt(hourStr, 10);
  const ampm = hour < 12 ? "AM" : "PM";
  hour = hour % 12 || 12; // Convert 0 to 12
  return `${hour}:${minute} ${ampm}`;
}


//Open Availability popup 
async function openAvailabilityPopup(year, month, day) {
  const popup = document.getElementById("availability-popup");
  const dateLabel = document.getElementById("popup-date-label");

  const selectedDate = new Date(year, month, day);
  const isoDate = selectedDate.toISOString().split("T")[0];

  dateLabel.textContent = `Availability for ${selectedDate.toDateString()}`;
  popup.setAttribute("data-date", isoDate);

  const businessId = document.getElementById("dropdown-category-business").value;
  const calendarId = document.getElementById("dropdown-availability-calendar").value;

  if (!businessId || !calendarId) {
    alert("Please select a business and calendar first.");
    return;
  }

  try {
    const res = await fetch(`/get-day-availability?businessId=${businessId}&calendarId=${calendarId}&date=${isoDate}`);
    const data = await res.json();

    if (data && data.start && data.end) {
      document.getElementById("current-day-start").value = data.start;
      document.getElementById("current-day-end").value = data.end;
    } else {
      document.getElementById("current-day-start").value = "";
      document.getElementById("current-day-end").value = "";
    }

  } catch (err) {
    console.error("Error loading availability:", err);
    document.getElementById("current-day-start").value = "";
    document.getElementById("current-day-end").value = "";
  }

  popup.style.display = "block";
}


//Save upcoming Availability 
document.getElementById("save-upcoming-day-availability").addEventListener("click", async () => {
  const popup = document.getElementById("availability-popup");
  const date = popup.getAttribute("data-date");
  const start = document.getElementById("current-day-start").value;
  const end = document.getElementById("current-day-end").value;
  const businessId = document.getElementById("dropdown-category-business").value;
  const calendarId = document.getElementById("dropdown-availability-calendar").value;

  const isAvailable = true; // ✅ Assume user clicked save with toggle ON

  if (!businessId || !calendarId || !date || !start || !end) {
    return alert("Missing required fields.");
  }

  try {
    const response = await fetch("/save-upcoming-hours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId,
        calendarId,
        weekStartDate: date, // 👈 Just reuse the same day for single-date saves
        upcomingHours: [
          {
            date,
            start,
            end,
            isAvailable,
          },
        ],
      }),
    });

    if (!response.ok) throw new Error("Failed to save");

    const result = await response.json();
    alert("✅ Saved successfully!");
    popup.style.display = "none";

    // ✅ Refresh calendar UI
    await loadAndGenerateCalendar();

  } catch (err) {
    console.error("❌ Error saving availability:", err);
    alert("❌ Error saving availability.");
  }
});




});/////////End of dom 
//Outside the Dom

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
// --- GLOBAL VARIABLES (Place these OUTSIDE your DOMContentLoaded block) ---
let currentWeekStart; // Will be initialized in DOMContentLoaded
let tempWeeklyHours = {}; // Client-side cache for unsaved upcoming hours data

// --- Upcoming Hours Specific Functions (No changes needed here from previous version, just for context) ---

// Function to save the CURRENTLY DISPLAYED week's data to tempWeeklyHours cache
function saveCurrentUpcomingWeekToTemp(calendarId, businessId, weekStartDate) {
    if (!calendarId || !businessId || !weekStartDate) {
        return;
    }
    const key = `${calendarId}_${businessId}_${weekStartDate.toISOString().split("T")[0]}`;
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const data = [];

    days.forEach(day => {
        const toggle = document.getElementById(`toggle-upcoming-${day}`);
        const start = document.getElementById(`start-upcoming-${day}`)?.value;
        const end = document.getElementById(`end-upcoming-${day}`)?.value;

        if (toggle?.checked && start && end) {
            data.push({ day, start, end, isAvailable: true });
        } else if (toggle && !toggle.checked) {
            data.push({ day, start: "", end: "", isAvailable: false });
        }
    });
    tempWeeklyHours[key] = data;
    // console.log(`Saved week ${key} to temp cache.`, tempWeeklyHours[key]);
}

// Function to fetch and render upcoming hours (for "Adjust Upcoming Hours" tab)
async function fetchAndRenderUpcomingHours(businessId, calendarId, weekStartDateStr) {
    try {
        const res = await fetch(`/get-all-upcoming-hours?businessId=${businessId}&calendarId=${calendarId}&start=${weekStartDateStr}`);
        const data = await res.json();

        const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        let fetchedHoursForCache = [];

        if (res.ok && data.upcomingHours && data.upcomingHours.length > 0) {
            data.upcomingHours.forEach(entry => {
                const entryDate = new Date(entry.date);
                const dayIndex = entryDate.getDay();
                const day = days[dayIndex];

                const toggleEl = document.getElementById(`toggle-upcoming-${day}`);
                const startEl = document.getElementById(`start-upcoming-${day}`);
                const endEl = document.getElementById(`end-upcoming-${day}`);
                const timeRow = document.querySelector(`.${day}-times`);

                if (entry.isAvailable) {
                    if(toggleEl) toggleEl.checked = true;
                    if(startEl) startEl.value = entry.start || "";
                    if(endEl) endEl.value = entry.end || "";
                    if (timeRow) timeRow.style.display = "flex";
                } else {
                    if(toggleEl) toggleEl.checked = false;
                    if(startEl) startEl.value = "";
                    if(endEl) endEl.value = "";
                    if (timeRow) timeRow.style.display = "none";
                }
                fetchedHoursForCache.push({
                    day: day,
                    start: entry.start || "",
                    end: entry.end || "",
                    isAvailable: entry.isAvailable
                });
            });
        } else {
            // console.warn("No upcoming hours found from server for this week, or response not OK.");
            // If no data from server, ensure fetchedHoursForCache is an empty array
            fetchedHoursForCache = days.map(day => ({
                day: day,
                start: "",
                end: "",
                isAvailable: false
            }));
        }

        const key = `${calendarId}_${businessId}_${weekStartDateStr}`;
        tempWeeklyHours[key] = fetchedHoursForCache;
        // console.log(`Fetched week ${key} from server and cached it.`, tempWeeklyHours[key]);

    } catch (err) {
        console.error("❌ Failed to fetch and render upcoming hours:", err);
        const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        days.forEach(day => {
            const toggle = document.getElementById(`toggle-upcoming-${day}`);
            const timeRow = document.querySelector(`.${day}-times`);
            const startSelect = document.getElementById(`start-upcoming-${day}`);
            const endSelect = document.getElementById(`end-upcoming-${day}`);

            if (toggle) toggle.checked = false;
            if (timeRow) timeRow.style.display = "none";
            if (startSelect) startSelect.value = "";
            if (endSelect) endSelect.value = "";
        });
        // On error, also reset fetchedHoursForCache for the current week in tempWeeklyHours
        const key = `${calendarId}_${businessId}_${weekStartDateStr}`;
        tempWeeklyHours[key] = days.map(day => ({
            day: day,
            start: "",
            end: "",
            isAvailable: false
        }));
    }
}

// Function to restore a week's data from tempWeeklyHours cache or fetch from server
async function restoreUpcomingWeekFromTempOrFetch(calendarId, businessId, weekStartDate) {
    const weekStartDateStr = weekStartDate.toISOString().split("T")[0];
    const key = `${calendarId}_${businessId}_${weekStartDateStr}`;
    const savedData = tempWeeklyHours[key];

    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    // Clear current UI state first
    days.forEach(day => {
        const toggle = document.getElementById(`toggle-upcoming-${day}`);
        const timeRow = document.querySelector(`.${day}-times`);
        const startSelect = document.getElementById(`start-upcoming-${day}`);
        const endSelect = document.getElementById(`end-upcoming-${day}`);

        if (toggle) toggle.checked = false;
        if (timeRow) timeRow.style.display = "none";
        if (startSelect) startSelect.value = "";
        if (endSelect) endSelect.value = "";
    });

    if (savedData && savedData.length > 0) {
        // Restore from client-side cache
        // console.log(`Restoring week ${key} from temp cache.`, savedData);
        savedData.forEach(item => {
            const day = item.day.toLowerCase();
            const toggle = document.getElementById(`toggle-upcoming-${day}`);
            const timeRow = document.querySelector(`.${day}-times`);
            const startSelect = document.getElementById(`start-upcoming-${day}`);
            const endSelect = document.getElementById(`end-upcoming-${day}`);

            if (toggle) toggle.checked = item.isAvailable !== false;
            if (timeRow) timeRow.style.display = (toggle?.checked) ? "flex" : "none";
            if (startSelect) startSelect.value = item.start || "";
            if (endSelect) endSelect.value = item.end || "";
        });
    } else {
        // No client-side cache, fetch from server
        // console.log(`No temp cache for week ${key}, fetching from server.`);
        await fetchAndRenderUpcomingHours(businessId, calendarId, weekStartDateStr);
    }
}

// Function to update the entire Upcoming Hours display (dates, and data)
// This function now ASSUMES currentWeekStart is already set to the target week.
async function updateWeekDisplay() { // Made async because it calls async restoreUpcomingWeekFromTempOrFetch
    const calendarId = document.getElementById("dropdown-availability-calendar")?.value;
    const businessId = document.getElementById("dropdown-category-business")?.value;

    const start = new Date(currentWeekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const rangeEl = document.getElementById("week-range-display");
    if (rangeEl) {
        rangeEl.textContent = formatDateRange(start, end);
    }

    const dayDateElements = document.querySelectorAll("#upcomingHours-section .day-date");
    dayDateElements.forEach(el => {
        const offset = parseInt(el.getAttribute("data-day"), 10);
        const dayDate = new Date(currentWeekStart);
        dayDate.setDate(currentWeekStart.getDate() + offset);
        el.textContent = dayDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    });

    if (businessId && calendarId) {
        await restoreUpcomingWeekFromTempOrFetch(calendarId, businessId, currentWeekStart);
    } else {
        // Clear UI if no valid selection
        const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        days.forEach(day => {
            const toggle = document.getElementById(`toggle-upcoming-${day}`);
            const timeRow = document.querySelector(`.${day}-times`);
            const startSelect = document.getElementById(`start-upcoming-${day}`);
            const endSelect = document.getElementById(`end-upcoming-${day}`);

            if (toggle) toggle.checked = false;
            if (timeRow) timeRow.style.display = "none";
            if (startSelect) startSelect.value = "";
            if (endSelect) endSelect.value = "";
        });
    }
}
