async function loadBusinesses() {
  const businessSelect = document.getElementById("business-select");
  try {
    const res = await fetch("/get-records/Business");
    const businesses = await res.json();

    businessSelect.innerHTML = `<option value="">-- Select Business --</option>`;
    businesses.forEach(biz => {
      const option = document.createElement("option");
      option.value = biz._id;
      option.textContent = biz.values?.businessName || "Unnamed Business";
      businessSelect.appendChild(option);
    });
  } catch (err) {
    console.error("❌ Failed to load businesses:", err);
  }
}

async function loadCalendarsForBusiness(businessId) {
  const calendarSelect = document.getElementById("calendar-select");
  calendarSelect.innerHTML = `<option value="">-- Select Calendar --</option>`;

  if (!businessId) return;

  try {
    const res = await fetch(`/get-calendars?businessId=${businessId}`);
    const calendars = await res.json();

    calendars.forEach(cal => {
      const option = document.createElement("option");
      option.value = cal._id;
      option.textContent = cal.calendarName || "Unnamed Calendar";
 calendarSelect.appendChild(option);
    });
  } catch (err) {
    console.error("❌ Failed to load calendars:", err);
  }
}

document.getElementById("business-select").addEventListener("change", (e) => {
  const businessId = e.target.value;
  loadCalendarsForBusiness(businessId);
});
function handleFetch() {
  const businessId = document.getElementById("business-select").value;
  const calendarId = document.getElementById("calendar-select").value;

  if (!businessId || !calendarId) {
    alert("Please select both a business and calendar.");
    return;
  }

  fetchAvailability(businessId, calendarId);
}

async function fetchAvailability(businessId, calendarId) {
  try {
    const res = await fetch(`/get-all-upcoming-hours?businessId=${businessId}&calendarId=${calendarId}`);
    const data = await res.json();
    console.log("📦 Availability Response:", data);

    const listDiv = document.getElementById("availability-list");
    listDiv.innerHTML = ""; // Clear previous

    if (!data.upcomingHours || data.upcomingHours.length === 0) {
      listDiv.innerHTML = `<p>❌ No upcoming availability found.</p>`;
      return;
    }

    data.upcomingHours.forEach(hour => {
      const dateStr = new Date(hour.date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric"
      });

      const item = document.createElement("div");
      item.classList.add("availability-item");

      item.innerHTML = `
        <strong>📅 ${dateStr}</strong><br>
        ⏰ ${hour.start || "—"} – ${hour.end || "—"}<br>
        🗓️ Calendar ID: ${hour.calendarId}
        <hr>
      `;

      listDiv.appendChild(item);
    });

  } catch (err) {
    console.error("❌ Failed to fetch availability:", err);
  }
}

// Initial load
loadBusinesses();
