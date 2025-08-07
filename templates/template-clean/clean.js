document.addEventListener("DOMContentLoaded", async () => {
  const slug = window.location.pathname.split("/").pop();

  // 📦 Fetch business
  const res = await fetch("/get-records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dataType: "Business",
      filter: { slug }
    })
  });

  const [business] = await res.json();
  if (!business) return alert("Business not found");

  document.getElementById("business-name").textContent = business.values.businessName;
  if (business.values.heroImage) {
    document.getElementById("hero-image").src = business.values.heroImage;
  }

  // Store business globally
  window.business = business;

  // 📅 Book Now button logic
  const bookBtn = document.getElementById("template-book-now");
  const overlay = document.getElementById("calendar-overlay");

  if (bookBtn && overlay) {
    bookBtn.addEventListener("click", async () => {
      overlay.classList.remove("hidden-overlay");
      overlay.classList.add("visible-overlay");

      document.querySelector(".hero-section").classList.add("blurred");

      // Fetch calendars
      const calRes = await fetch("/get-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataType: "Calendar",
          filter: { businessId: business._id }
        })
      });

      const calendars = await calRes.json();
      renderCalendars(calendars);
    });
  }

  // 📌 About tab popup logic
  const aboutBtn = document.getElementById("about-tab");
  const popup = document.getElementById("about-popup");
  const closeBtn = document.getElementById("close-popup");

  if (aboutBtn && popup && closeBtn) {
    aboutBtn.addEventListener("click", () => {
      popup.classList.remove("hidden");
    });

    closeBtn.addEventListener("click", () => {
      popup.classList.add("hidden");
    });
  } else {
    console.warn("❌ Missing About popup elements. Check IDs.");
  }
});

// 🧩 Render calendar buttons
function renderCalendars(calendars) {
  const container = document.getElementById("calendar-buttons");
  container.innerHTML = "<h2>Select a Calendar</h2>";

  calendars.forEach(cal => {
    const btn = document.createElement("button");
    btn.textContent = cal.calendarName || "Unnamed";
    btn.classList.add("calendar-btn");
    container.appendChild(btn);
  });
}
