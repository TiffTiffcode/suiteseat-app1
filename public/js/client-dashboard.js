

document.addEventListener("DOMContentLoaded", async () => {
    

    // =========================================================
    // 1. LOGIN POPUP & AUTHENTICATION LOGIC
    // =========================================================
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
    // Expose closeLoginPopup globally if your HTML button uses it with window.closeLoginPopup()
    window.closeLoginPopup = closeLoginPopup;

    const loginBtn = document.getElementById("open-login-popup-btn");
    if (loginBtn) {
        loginBtn.addEventListener("click", () => openLoginPopup());
    }

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

    const headerRight = document.querySelector(".right-group");
    // Using an IIFE (Immediately Invoked Function Expression) for this fetch to keep it self-contained
    (async () => {
        try {
            const res = await fetch("/check-login");
            const data = await res.json();
            if (data.loggedIn) {
                headerRight.innerHTML = `
                    Hi, ${data.firstName} 👋
                    <button id="logout-btn">Logout</button>
                `;
                document.getElementById("logout-btn").addEventListener("click", async () => {
                    const resLogout = await fetch("/logout");
                    if (resLogout.ok) {
                        alert("👋 Logged out!");
                        location.reload();
                    }
                });
            }
        } catch (err) {
            console.error("Error checking login status:", err);
        }
    })();


    // After confirming user is logged in
    (async () => { // Another IIFE for fetching current user data
        try {
            const res = await fetch("/get-current-user");
            const user = await res.json();
            const profileImg = document.getElementById("client-profile-photo");
            if (profileImg) {
                if (user.profilePhoto) {
                    profileImg.src = user.profilePhoto;
                } else {
                    profileImg.src = "/uploads/default-avatar.png";
                }
            }
        } catch (err) {
            console.error("❌ Failed to load profile photo:", err);
        }
    })();


    // =========================================================
    // 2. TAB SWITCHING LOGIC
    // =========================================================
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            tabButtons.forEach(b => b.classList.remove("active"));
            tabContents.forEach(c => c.style.display = "none");

            btn.classList.add("active");
            const target = btn.getAttribute("data-tab");
            document.getElementById(target).style.display = "block";

            // --- IMPORTANT: If the 'appointments-tab' is activated, re-fetch appointments ---
            if (target === 'appointments-tab') {
                fetchAndRenderClientAppointments();
            }
            // --- END IMPORTANT ---
        });

        //Open Reset Password popup
document.getElementById("open-reset-password-popup-btn").addEventListener("click", () => {
  document.getElementById("popup-reset-password").style.display = "block";
  document.getElementById("popup-overlay").style.display = "block"; // Optional: if you have a dark background overlay
  document.body.classList.add("popup-open"); // Optional: prevent background scrolling
});
function closeResetPopup() {
  document.getElementById("popup-reset-password").style.display = "none";
  document.getElementById("popup-overlay").style.display = "none";
  document.body.classList.remove("popup-open");
}


//Reset Password 
document.getElementById("change-password-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const currentPassword = document.getElementById("current-password").value.trim();
  const newPassword = document.getElementById("new-password").value.trim();
  const confirmPassword = document.getElementById("confirm-password").value.trim();

  if (newPassword !== confirmPassword) {
    alert("New passwords do not match.");
    return;
  }

  try {
    const res = await fetch("/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const result = await res.json();

    if (res.ok) {
      alert("✅ Password changed!");
    } else {
      alert("❌ " + result.message);
    }
  } catch (err) {
    console.error("Error:", err);
    alert("Something went wrong.");
  }
});








    });

    // =========================================================
    // 3. SETTINGS POPUP LOGIC
    // =========================================================
    async function openSettingsPopup() {
        document.getElementById("popup-settings").style.display = "block";
        document.getElementById("popup-overlay").style.display = "block";
        document.body.classList.add("popup-open");

        try {
            const res = await fetch("/get-current-user");
            const user = await res.json();
            console.log("🧠 Loaded user for settings:", user); // Added context to log

            document.getElementById("popup-First-name-input").value = user.firstName || "";
            document.getElementById("popup-Last-name-input").value = user.lastName || "";
            document.getElementById("popup-phone-number-input").value = user.phone || "";
            document.getElementById("popup--email-input").value = user.email || "";
            document.getElementById("popup-address-input").value = user.address || "";

            const img = document.getElementById("current-profile-photo");
            const text = document.getElementById("no-image-text");
            if (img) { // Add null check
                if (user.profilePhoto) {
                    img.src = user.profilePhoto;
                    img.style.display = "block";
                    text.style.display = "none";
                } else {
                    img.src = "/uploads/default-avatar.png";
                    img.style.display = "none";
                    text.style.display = "block";
                }
            }
        } catch (err) {
            console.error("Failed to load user info for settings:", err); // Added context to log
            alert("Could not load your profile info.");
        }
    }

    function closeSettingsPopup() {
        document.getElementById("popup-settings").style.display = "none";
        document.getElementById("popup-overlay").style.display = "none";
        document.body.classList.remove("popup-open");
    }

    // Expose globally if HTML needs to call them via onclick="..."
    window.openSettingsPopup = openSettingsPopup;
    window.closeSettingsPopup = closeSettingsPopup;

    const settingsBtn = document.getElementById("open-settings-popup-btn");
    if (settingsBtn) {
        settingsBtn.addEventListener("click", openSettingsPopup);
    }

    const imageUploadInput = document.getElementById("image-upload");
    const profileImgPreview = document.getElementById("current-profile-photo"); // Renamed variable

    if (imageUploadInput && profileImgPreview) { // Add null check
        imageUploadInput.addEventListener("change", () => {
            const file = imageUploadInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    profileImgPreview.src = e.target.result;
                    profileImgPreview.style.display = "block";
                    const noImageText = document.getElementById("no-image-text");
                    if (noImageText) noImageText.style.display = "none"; // Add null check
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const settingsForm = document.getElementById("popup-add-business-form"); // Assuming this is your settings form
    if (settingsForm) {
        settingsForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const firstName = document.getElementById("popup-First-name-input").value.trim();
            const lastName = document.getElementById("popup-Last-name-input").value.trim();
            const phone = document.getElementById("popup-phone-number-input").value.trim();
            const email = document.getElementById("popup--email-input").value.trim();
            const address = document.getElementById("popup-address-input").value.trim();
            const imageFile = document.getElementById("image-upload").files[0];

            const formData = new FormData();
            formData.append("firstName", firstName);
            formData.append("lastName", lastName);
            formData.append("phone", phone);
            formData.append("email", email);
            formData.append("address", address);
            if (imageFile) {
                formData.append("profilePhoto", imageFile);
            }

            try {
                const res = await fetch("/update-user-profile", {
                    method: "PUT",
                    body: formData
                });
                const result = await res.json();
                if (res.ok) {
                    alert("✅ Profile updated!");
                    closeSettingsPopup();
                    // If your profile update affects display name or photo, consider reloading
                    // window.location.reload(); // Uncomment if you want to force a full reload
                  
                  // ✅ Update name immediately

                    const greeting = document.getElementById("client-greeting");
        if (greeting) {
          greeting.textContent = `Hi, ${firstName} 👋`;
        }
        
  // ✅ Update profile photo immediately
  const profileImg = document.getElementById("client-profile-photo");
  if (profileImg) {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        profileImg.src = e.target.result;
      };
      reader.readAsDataURL(imageFile);
    } else {
      const updatedUser = await (await fetch("/get-current-user")).json();
      profileImg.src = updatedUser.profilePhoto || "/uploads/default-avatar.png";
    }
  }

     } else {
                    alert(result.message || "Save failed.");
                }
            } catch (err) {
                console.error("Update profile error:", err); // Added context to log
                alert("Something went wrong during profile update.");
            }
        });
    }

    // =========================================================
    // 4. APPOINTMENT LISTING LOGIC
    // =========================================================
    
   const appointmentsListDiv = document.getElementById('all-appointments');

fetchAndRenderClientAppointments();

    async function fetchAndRenderClientAppointments() {
           console.log("Frontend: fetchAndRenderClientAppointments is being called.");
  
        // Ensure appointmentsListDiv exists before trying to modify it
        if (!appointmentsListDiv) {
            console.error("Appointments list div not found!");
            return;
        }

        appointmentsListDiv.innerHTML = 'Loading your appointments...';

        try {
            const response = await fetch('/get-client-appointments');
            const appointments = await response.json();
            //Sort by dates 
            appointments.sort((a, b) => {
  const aDateTime = new Date(`${a.date}T${a.time}`);
  const bDateTime = new Date(`${b.date}T${b.time}`);
  return aDateTime - bDateTime; // ascending order
});

console.log("📦 Appointments returned from server:", appointments);

            if (!response.ok) {
                throw new Error(appointments.message || 'Failed to fetch appointments');
            }

            if (appointments.length === 0) {
                appointmentsListDiv.innerHTML = '<p>You have no upcoming appointments.</p>';
                return;
            }

           renderAppointments(appointments);

        } catch (error) {
            console.error('Error fetching client appointments:', error);
            appointmentsListDiv.innerHTML = `<p style="color: red;">Error loading appointments: ${error.message}</p>`;
        }
    }

function renderAppointments(appointments) {
  const allContainer = document.getElementById("all-appointments");
  const upcomingContainer = document.getElementById("upcoming-appointments");
  const pastContainer = document.getElementById("past-appointments");

  allContainer.innerHTML = "";
  upcomingContainer.innerHTML = "";
  pastContainer.innerHTML = "";

  const now = new Date();

  appointments.forEach(appt => {
    const appointmentDateTime = new Date(`${appt.date}T${appt.time}`);
    const isPastAppointment = appointmentDateTime < now;

    console.log("🧪 Appointment Business ID:", appt.businessId);

   const cardHTML = `
  <div class="appointment-card">
    <div class="pro-card">
      <p><strong>Pro:</strong> ${appt.proName || "Unknown Pro"}</p>
    </div>
    <div class="appointment-info">
      <h3>${appt.serviceName}</h3>
      <p><strong>Date:</strong> ${formatDate(appt.date)}</p>
      <p><strong>Time:</strong> ${formatTime(appt.time)}</p>
      <p><strong>Duration:</strong> ${appt.duration} minutes</p>
      ${appt.businessSlug ? `<p><strong>Business:</strong> <a href="/${appt.businessSlug}">${appt.businessSlug}</a></p>` : ""}
    </div>
    <div class="appointment-actions">
      ${!isPastAppointment ? `
      
        <button class="cancel-appointment-btn" data-id="${appt._id}">Cancel</button>
      ` : ""}
    </div>
  </div>
`;


    // Insert into the appropriate section(s)
    allContainer.insertAdjacentHTML("beforeend", cardHTML);

    if (!isPastAppointment) {
      upcomingContainer.insertAdjacentHTML("beforeend", cardHTML);
    } else {
      pastContainer.insertAdjacentHTML("beforeend", cardHTML);
    }
  });

  attachCancelEventListeners();
  attachRescheduleListeners(); // (this will be used in next step)
}
//Cancel button
function attachCancelEventListeners() {
  document.querySelectorAll('.cancel-appointment-btn').forEach(button => {
    button.addEventListener('click', async (event) => {
      const appointmentId = event.target.dataset.id;
      if (!confirm('Are you sure you want to cancel this appointment?')) {
        return;
      }

      try {
        const response = await fetch(`/cancel-appointment/${appointmentId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (response.ok) {
          alert(result.message);
          fetchAndRenderClientAppointments(); // Re-fetch to update list
        } else {
          alert(`Error: ${result.message}`);
        }
      } catch (error) {
        console.error('Error cancelling appointment:', error);
        alert('Failed to cancel appointment. Please try again.');
      }
    });
  });
}


                               //Upcoming Appointments Tab

document.querySelectorAll(".sub-tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    // Highlight active button
    document.querySelectorAll(".sub-tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // Show relevant content
    const tabToShow = btn.dataset.tab;
    document.querySelectorAll(".sub-tab-content").forEach(section => {
      section.style.display = "none";
    });
    document.getElementById(`${tabToShow}-appointments`).style.display = "block";
  });
});

    // =========================================================
    // 5. HELPER FUNCTION (placed here as it's used by fetchAndRenderClientAppointments)
    // =========================================================
    function formatDate(dateStr) {
  const dateParts = dateStr.split('-'); // expecting "YYYY-MM-DD"
  const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]); // JS months are 0-indexed
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

    function formatTime(timeStr) {
        // Ensure timeStr is a string before splitting
        if (typeof timeStr !== 'string') {
            console.warn('formatTime received non-string input:', timeStr);
            return String(timeStr); // Return as string to avoid breaking display
        }
        const [hour, minute] = timeStr.split(":").map(Number);
        const ampm = hour >= 12 ? "PM" : "AM";
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minute.toString().padStart(2, "0")} ${ampm}`;
    }

    // =========================================================
    // 6. INITIAL CALLS WHEN DOM IS READY
    // =========================================================
    fetchAndRenderClientAppointments(); // Initial load of appointments
 
 
    // =========================================================
    // Reschedule 
    // =========================================================
//Attaches a click event to every .reschedule-appointment-btn
function attachRescheduleListeners() {
  document.querySelectorAll('.reschedule-appointment-btn').forEach(button => {
    button.addEventListener('click', async () => {
      const appointmentId = button.dataset.id;
      const serviceName = button.dataset.service;
      const date = button.dataset.date;
      const time = button.dataset.time;
      const duration = button.dataset.duration;
      const serviceId = button.dataset.serviceId;

      console.log("🛠 Reschedule button clicked for:", {
        appointmentId, serviceName, date, time, duration, serviceId
      });

      const businessId = button.dataset.business || (window.business?._id);

      if (!businessId) return alert("Business ID missing");

      // ⏬ Fetch categories and services
      const res = await fetch(`/get-categories-and-services/${businessId}`);
      const { categories, services } = await res.json();

      const categorySelect = document.getElementById("reschedule-category");
      const serviceSelect = document.getElementById("reschedule-service");

      // 🔄 Populate category dropdown
      categorySelect.innerHTML = `<option value="">-- Select Category --</option>`;
      categories.forEach(cat => {
        categorySelect.innerHTML += `<option value="${cat._id}">${cat.categoryName}</option>`;
      });

      // 🔄 Populate service dropdown when category changes
      categorySelect.addEventListener("change", () => {
        const selectedCategory = categorySelect.value;
        serviceSelect.innerHTML = `<option value="">-- Select Service --</option>`;
        const filtered = services.filter(svc => svc.categoryId === selectedCategory);
        filtered.forEach(svc => {
          serviceSelect.innerHTML += `<option value="${svc._id}" data-duration="${svc.duration}">
            ${svc.serviceName}
          </option>`;
        });
      });

      // 🧠 Preselect current category + service
      const currentService = services.find(svc => svc._id === serviceId);
      if (currentService) {
        categorySelect.value = currentService.categoryId;
        categorySelect.dispatchEvent(new Event("change"));
        setTimeout(() => {
          serviceSelect.value = currentService._id;
        }, 100);
      }

      // Set hidden fields
      document.getElementById("reschedule-appointment-id").value = appointmentId;
      document.getElementById("reschedule-date").value = date;
      document.getElementById("reschedule-time").value = time;

      // Show popup
      document.getElementById("popup-reschedule").style.display = "block";
    });
  });
}
document.getElementById("reschedule-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const appointmentId = document.getElementById("reschedule-appointment-id").value;
  const serviceId = document.getElementById("reschedule-service").value;
  const date = document.getElementById("reschedule-date").value;
  const time = document.getElementById("reschedule-time").value;

  console.log("🔁 Rescheduling to:", { appointmentId, serviceId, date, time });

  const res = await fetch("/reschedule-appointment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ appointmentId, serviceId, date, time })
  });

  const data = await res.json();

  if (res.ok) {
    alert("✅ Appointment rescheduled!");
    document.getElementById("popup-reschedule").style.display = "none";
    fetchAndRenderClientAppointments();
  } else {
    alert("❌ " + data.message);
  }
});


async function fetchRescheduleSlots() {
  const date = document.getElementById("reschedule-date").value;
  const serviceId = document.getElementById("reschedule-service").value;
  const calendarId = window.selectedCalendarId; // You'll need to store this on popup open
  if (!date || !serviceId || !calendarId) return;

  const service = appointment.businessServices.find(s => s._id === serviceId);
  const duration = service?.duration || 30;

  const res = await fetch("/get-available-timeslots", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ calendarId, date, serviceDuration: duration })
  });

  const result = await res.json();

  const container = document.getElementById("reschedule-timeslots");
  container.innerHTML = "";

  // Show the slots (you can format however you want)
  [...result.morning, ...result.afternoon, ...result.evening].forEach(time => {
    const btn = document.createElement("button");
    btn.textContent = time;
    btn.onclick = () => {
      document.getElementById("reschedule-time").value = time;
      highlightSelectedTime(btn); // optional styling function
    };
    container.appendChild(btn);
  });
}





//Generate calendar 
let rescheduleCurrentDate = new Date(); // Tracks the currently viewed month
function generateRescheduleCalendar() {
  const calendarGrid = document.getElementById("reschedule-calendar-grid");
  const monthLabel = document.getElementById("reschedule-month-label");
  calendarGrid.innerHTML = "";

  const year = rescheduleCurrentDate.getFullYear();
  const month = rescheduleCurrentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDayIndex = firstDay.getDay(); // Sunday = 0
  const daysInMonth = lastDay.getDate();

  // Update month label
  monthLabel.textContent = `${firstDay.toLocaleString("default", { month: "long" })} ${year}`;

  // Add empty boxes for padding
  for (let i = 0; i < startDayIndex; i++) {
    const empty = document.createElement("div");
    calendarGrid.appendChild(empty);
  }

  // Render days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const btn = document.createElement("button");
    btn.textContent = day;

    btn.addEventListener("click", () => {
      const isoDate = date.toISOString().split("T")[0];
      document.getElementById("reschedule-date").value = isoDate;

      console.log("📅 Selected reschedule date:", isoDate);

      // Optional: fetch new time slots here
      if (typeof fetchRescheduleTimeslots === "function") {
        fetchRescheduleTimeslots(isoDate);
      }
    });

    calendarGrid.appendChild(btn);
  }
}
document.getElementById("reschedule-prev-month").addEventListener("click", () => {
  rescheduleCurrentDate.setMonth(rescheduleCurrentDate.getMonth() - 1);
  generateRescheduleCalendar();
});

document.getElementById("reschedule-next-month").addEventListener("click", () => {
  rescheduleCurrentDate.setMonth(rescheduleCurrentDate.getMonth() + 1);
  generateRescheduleCalendar();
});


//Open Rescheule popup
async function openReschedulePopup(appt) {
  const businessId = appt.businessId;
  if (!businessId) return alert("Business ID missing");

  // Show the popup
  document.getElementById("popup-reschedule").style.display = "block";

  // Save appointment ID
  document.getElementById("reschedule-appointment-id").value = appt._id;

  // Set date and time
  document.getElementById("reschedule-date").value = appt.date;
  document.getElementById("reschedule-time").value = appt.time;

  // Fetch categories and services together (use your combined route)
  const res = await fetch(`/get-categories-and-services/${businessId}`);
  const { categories, services } = await res.json();

  // Reference dropdowns
  const categoryDropdown = document.getElementById("reschedule-category");
  const serviceDropdown = document.getElementById("reschedule-service");

  // Clear and populate category dropdown
  categoryDropdown.innerHTML = `<option value="">-- Select Category --</option>`;
  categories.forEach(cat => {
    categoryDropdown.innerHTML += `<option value="${cat._id}">${cat.categoryName}</option>`;
  });

  // Find the selected service
  const currentService = services.find(s => s._id === appt.serviceId);
  const currentCategoryId = currentService?.categoryId || "";

  // Pre-select the category
  categoryDropdown.value = currentCategoryId;

  // Function to render services for a category
  function renderServices(categoryId) {
    const filtered = services.filter(s => s.categoryId === categoryId);
    serviceDropdown.innerHTML = filtered.map(service => `
      <option value="${service._id}" ${service._id === appt.serviceId ? "selected" : ""}>
        ${service.serviceName}
      </option>
    `).join("");
  }

  // Render initial services
  renderServices(currentCategoryId);

  // When category changes, re-render services
  categoryDropdown.addEventListener("change", () => {
    renderServices(categoryDropdown.value);
  });
  // ✅ Generate calendar
  generateRescheduleCalendar();
}

function closeReschedulePopup() {
  document.getElementById("reschedule-popup").style.display = "none";
}


//Even Lis6eners for reschedule 
document.getElementById("reschedule-date").addEventListener("change", fetchRescheduleSlots);
document.getElementById("reschedule-service").addEventListener("change", fetchRescheduleSlots);

document.getElementById("reschedule-submit-btn").addEventListener("click", async () => {
  const id = document.getElementById("reschedule-appointment-id").value;
  const date = document.getElementById("reschedule-date").value;
  const time = document.getElementById("reschedule-time").value;
  const serviceId = document.getElementById("reschedule-service").value;

const res = await fetch("/reschedule-appointment", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    appointmentId: id,
    serviceId,          // <-- not newServiceId
    date,               // <-- not newDate
    time                // <-- not newTime
  })
});

  const result = await res.json();
  if (res.ok) {
    alert("✅ Appointment updated!");
    document.getElementById("reschedule-popup").style.display = "none";
    await fetchAndRenderClientAppointments(); // reload new data
  } else {
    alert("❌ " + result.message);
  }
});




//New Calendar 
let newCalendarDate = new Date();

document.addEventListener("DOMContentLoaded", () => {
  buildNewCalendar();

  document.getElementById("new-prev-month").addEventListener("click", () => {
    newCalendarDate.setMonth(newCalendarDate.getMonth() - 1);
    buildNewCalendar();
  });

  document.getElementById("new-next-month").addEventListener("click", () => {
    newCalendarDate.setMonth(newCalendarDate.getMonth() + 1);
    buildNewCalendar();
  });
});

function buildNewCalendar() {
  const grid = document.getElementById("new-calendar-grid");
  const label = document.getElementById("new-month-label");
  const year = newCalendarDate.getFullYear();
  const month = newCalendarDate.getMonth();

  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const pad = first.getDay();
  const days = last.getDate();

  label.textContent = `${first.toLocaleString("default", { month: "long" })} ${year}`;
  grid.innerHTML = "";

  // Add padding
  for (let i = 0; i < pad; i++) {
    const blank = document.createElement("div");
    grid.appendChild(blank);
  }

  // Add days
  for (let day = 1; day <= days; day++) {
     console.log("👉 adding day", day); // 👈 check if this runs
    const date = new Date(year, month, day);
    const iso = date.toISOString().split("T")[0];
    const btn = document.createElement("button");
    btn.textContent = day;
 btn.classList.add("calendar-day-btn");
 
    btn.addEventListener("click", () => {
      document.getElementById("new-selected-date").value = iso;
      document.getElementById("new-date-display").textContent = `📅 New Date Selected: ${iso}`;

      document.querySelectorAll(".calendar-grid button").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");

      // Add timeslot logic or fetch if needed
    });

    grid.appendChild(btn);
  }
}










}); // <--- END OF THE *SINGLE* DOMContentLoaded LISTENER