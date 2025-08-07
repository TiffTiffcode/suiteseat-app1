let editingClientId = null;  // If this is null, it's a new client. If it has a value, you're editing.
let fullClientList = []; // stores the full list so we can filter without reloading


document.addEventListener("DOMContentLoaded", async () => {
  const loginStatus = document.getElementById("login-status-text");
  const openLoginBtn = document.getElementById("open-login-popup-btn");
  const logoutBtn = document.getElementById("logout-btn");

  // 🔒 Check login status and show/hide logout button
  async function checkLogin() {
    try {
      const res = await fetch("/check-login");
      const result = await res.json();

      if (result.loggedIn) {
        loginStatus.textContent = `Hi, ${result.firstName} 👋`;
        logoutBtn.style.display = "inline-block";
        openLoginBtn.style.display = "none";
        window.currentUserId = result.userId;
      } else {
        loginStatus.textContent = "Not logged in";
        logoutBtn.style.display = "none";
        openLoginBtn.style.display = "inline-block";
      }
    } catch (err) {
      console.error("Login check failed:", err);
    }
  }

  // 🔓 Handle logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        const res = await fetch("/logout");
        const result = await res.json();
        if (res.ok) {
          alert("👋 Logged out!");
          window.location.href = "signup.html";
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

document.addEventListener("DOMContentLoaded", () => {
  populateClientBusinessDropdown();
});


  // Load all clients associated with the user (created + booked)
  async function loadAllClients(businessId = "") {
  try {
    const url = businessId
      ? `/get-my-clients?businessId=${businessId}`
      : "/get-my-clients";

    const res = await fetch(url);
    const clients = await res.json();

    fullClientList = clients;
    renderClientList(clients); // ✅ Now this is defined!
  } catch (err) {
    console.error("Error loading clients:", err);
  }
}

// ✅ Then attach your DOMContentLoaded
document.addEventListener("DOMContentLoaded", async () => {
  await checkLogin();
  await populateBusinessDropdown(); // for the filter dropdown
  await loadBusinessOptions();      // ✅ for the client popup dropdown
  await loadAllClients();           // for showing clients
  
});


  

  // Populate business dropdown and add change listener
async function populateBusinessDropdown() {
  try {
    const res = await fetch("/get-records/Business");
    const businesses = await res.json();
    const dropdown = document.getElementById("business-filter");

    dropdown.innerHTML = ""; // clear existing

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "All Businesses";
    dropdown.appendChild(defaultOption);

    businesses.forEach((biz) => {
      const option = document.createElement("option");
      option.value = biz._id;
      option.textContent = biz.values?.businessName || "Unnamed Business";
      dropdown.appendChild(option);
    });

    // 🔁 Add change event to load filtered clients
    dropdown.addEventListener("change", () => {
      const selectedBusinessId = dropdown.value;
      loadAllClients(selectedBusinessId);
    });
  } catch (err) {
    console.error("Error populating business dropdown:", err);
  }
}


  // Run everything on load
  await checkLogin();
  await populateBusinessDropdown();
  await loadAllClients(); // default load = all clients
});

document.addEventListener("DOMContentLoaded", () => {
      setTimeout(loadAllClients, 0);
  const addClientBtn = document.getElementById("add-client-btn");
  const clientPopup = document.getElementById("popup-add-client");

  // 🟢 OPEN the popup when the + button is clicked
addClientBtn.addEventListener("click", () => {
  document.getElementById("popup-add-client").style.display = "block";
  document.body.classList.add("popup-open");

  loadBusinessOptions(); // ⬅️ Add this
});

//Save Client 
// Load Businesses in dropdown in Add Client Popup
async function populateClientBusinessDropdown() {
  const dropdown = document.getElementById("client-business");

  if (!dropdown) {
    console.warn("⚠️ client-business dropdown not found in DOM.");
    return;
  }

  dropdown.innerHTML = `<option value="">-- Choose Business --</option>`; // Reset

  try {
    const res = await fetch("/get-records/Business");
    if (!res.ok) throw new Error("Failed to fetch businesses");

    const businesses = await res.json();

    businesses.forEach((biz) => {
      const option = document.createElement("option");
      option.value = biz._id;
      option.textContent = biz.values?.businessName || "Unnamed Business";
      dropdown.appendChild(option);
    });

    console.log(`✅ Populated ${businesses.length} businesses in #client-business`);
  } catch (err) {
    console.error("❌ Error loading businesses:", err);
    alert("Failed to load businesses");
  }
}


//
document.getElementById("add-client-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const businessId = document.getElementById("client-business").value;
  const firstName = document.getElementById("client-name").value.trim();
  const lastName = document.getElementById("client-last-name").value.trim();
  const email = document.getElementById("client-email").value.trim();
  const phone = document.getElementById("client-phone").value.trim();

  const payload = { businessId, firstName, lastName, email, phone };

  try {
    let response;

    if (editingClientId) {
      // 🛠 Editing an existing client
      response = await fetch(`/update-client/${editingClientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      // ➕ Creating a new client
      response = await fetch("/add-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    const result = await response.json();

    if (!response.ok) throw new Error(result.message || "Something went wrong");

    alert(editingClientId ? "Client updated" : "Client created");
    closeClientPopup();
    await loadAllClients(); // reload clients
  } catch (err) {
    console.error("Error:", err);
    alert("❌ Failed to save client");
  }
});


document.getElementById("add-client-btn").addEventListener("click", () => {
  editingClientId = null; // 🚨 Reset
  resetClientForm();
  openClientPopup();
   loadBusinessOptions();
});

document.getElementById("open-add-client-popup-btn").addEventListener("click", () => {
  editingClientId = null; // 🚨 Reset
  resetClientForm();
  openClientPopup();
   loadBusinessOptions();
});

//Delete Client 
document.getElementById("delete-client-btn").addEventListener("click", async () => {
  if (!editingClientId) return;

  if (!confirm("Are you sure you want to delete this client?")) return;

  try {
    const res = await fetch(`/delete-client/${editingClientId}`, {
      method: "DELETE",
    });

    const result = await res.json();

    if (!res.ok) throw new Error(result.message || "Delete failed");

    alert("🗑️ Client deleted");
    closeClientPopup();
   await loadAllClients();
  } catch (err) {
    console.error("Delete error:", err);
    alert("❌ Failed to delete client");
  }
});

//Search Bar 
document.getElementById("client-search").addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase();

const filtered = fullClientList.filter(client => {
  const fullName = `${client.firstName || ""} ${client.lastName || ""}`.toLowerCase();
  const email = (client.email || "").toLowerCase();
  const phone = (client.phone || "").toLowerCase();
  return fullName.includes(query) || email.includes(query) || phone.includes(query);
});

  renderClientList(filtered); // show the filtered list
});

});//End Dom???????????????

// 🔴 You already have this in your HTML, but here's the CLOSE function for reference
function closeClientPopup() {
  document.getElementById("popup-add-client").style.display = "none";
  document.body.classList.remove("popup-open");
}

async function loadBusinessOptions() {
  const dropdown = document.getElementById("client-business");
  dropdown.innerHTML = `<option value="">-- Choose Business --</option>`; // Clear old options

  try {
    const res = await fetch("/get-records/Business");
    const businesses = await res.json();

    if (!Array.isArray(businesses)) throw new Error("Invalid response");

    businesses.forEach(biz => {
      const option = document.createElement("option");
      option.value = biz._id;
      option.textContent = biz.values?.businessName || "(Unnamed Business)";

      dropdown.appendChild(option);
    });
  } catch (err) {
    console.error("❌ Failed to load businesses:", err);
    alert("Could not load businesses. Please try again.");
  }
}

  // Render clients
 function renderClientList(clients) {
  const container = document.getElementById("client-list-container");
  container.innerHTML = "";

  if (!clients.length) {
    container.innerHTML = "<div class='client-row'>No clients found</div>";
    return;
  }

  // 🧠 Sort clients alphabetically by first name (then last name if needed)
  clients.sort((a, b) => {
    const nameA = (a.firstName + " " + (a.lastName || "")).toLowerCase();
    const nameB = (b.firstName + " " + (b.lastName || "")).toLowerCase();
    return nameA.localeCompare(nameB);
  });

  clients.forEach(client => {
    const row = document.createElement("div");
    row.className = "client-row";
    row.innerHTML = `
      <div class="client-name">${client.firstName} ${client.lastName || ""}</div>
      <button class="white-button add-info-btn" data-client-id="${client._id}">Add Info</button>
    `;
    container.appendChild(row);
  });

  // Attach click events
  document.querySelectorAll(".add-info-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const clientId = e.target.dataset.clientId;
      await openClientInfo(clientId);
    });
  });
}


//Reload Client List after saving 
async function loadAllClients(businessId = "") {
  try {
    const url = businessId
      ? `/get-my-clients?businessId=${businessId}`
      : "/get-my-clients";

    const res = await fetch(url);
    const clients = await res.json();

    // ✅ Sort clients alphabetically by full name (first + last)
    clients.sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName || ""}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName || ""}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    fullClientList = clients; // ⬅️ Store the full list in memory
    renderClientList(clients); // ⬅️ Render sorted list
  } catch (err) {
    console.error("Error loading clients:", err);
  }
}


document.querySelectorAll(".add-info-btn").forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    const clientId = e.target.dataset.clientId;
    await openClientInfo(clientId);  // ⬅️ this function opens the popup in edit mode
  });
});

//Open add new Client popup when add new client button is clicked 
 document.addEventListener("DOMContentLoaded", () => {
    const openBtn = document.getElementById("open-add-client-popup-btn");
    const popup = document.getElementById("popup-add-client");

    openBtn.addEventListener("click", () => {
      popup.style.display = "block";
      document.body.classList.add("popup-open"); // optional: lock scroll
    });
  });

  // Close popup function (you already have a button that calls this)
  function closeClientPopup() {
    const popup = document.getElementById("popup-add-client");
    popup.style.display = "none";
    document.body.classList.remove("popup-open"); // optional
  }

  //Open Add Client popup in edit mode when edit info button is clicked 
async function openClientInfo(clientId) {
  editingClientId = clientId;

  try {
    const res = await fetch(`/get-client/${clientId}`);
    const client = await res.json();

    await loadBusinessOptions(); // ✅ Make sure options are ready first

    document.getElementById("client-business").value = client.businessId;
    document.getElementById("client-name").value = client.firstName;
    document.getElementById("client-last-name").value = client.lastName || "";
    document.getElementById("client-email").value = client.email || "";
    document.getElementById("client-phone").value = client.phone || "";

    document.getElementById("client-popup-title").textContent = "Update Client";
    document.getElementById("save-client-btn").textContent = "Update Client";
    document.getElementById("delete-client-btn").style.display = "inline-block";

    openClientPopup();
  } catch (err) {
    console.error("Failed to load client:", err);
    alert("❌ Could not load client info");
  }
}


//Reset add client popup 
function openClientPopup() {
  document.getElementById("popup-add-client").style.display = "block";
  document.body.classList.add("popup-open");
}



function resetClientForm() {
  editingClientId = null;
  document.getElementById("add-client-form").reset();
  document.getElementById("client-popup-title").textContent = "Add New Client";
  document.getElementById("save-client-btn").textContent = "Save Client";
  document.getElementById("delete-client-btn").style.display = "none";
}
