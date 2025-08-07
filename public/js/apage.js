// At the very top of your JS file (outside DOMContentLoaded)
let currentUserId = null;



//Business Section 
let allBusinesses = [];
let selectedBusinessNameElement;

//Calendar Section 


//Category Section

//Service Section


document.addEventListener("DOMContentLoaded", async () => {
 const loginStatus = document.getElementById("login-status");
    const openLoginBtn = document.getElementById("open-login-popup-btn");
    const logoutBtn = document.getElementById("logout-btn");
    // const openCatBtn = document.getElementById("open-category-popup-button"); // You've replaced this with the global openCategoryPopupButton
    const popupOverlay = document.getElementById("popup-overlay"); // This seems to be a general popup overlay, not specifically for category. Keep if used elsewhere.

    // Get references for Business section elements
    const openBusinessPopupButton = document.getElementById("open-business-popup-button");
    const saveBizBtn = document.getElementById("save-button");
    const updateBizBtn = document.getElementById("update-button");
    const deleteBizBtn = document.getElementById("delete-button");
    const nameCol = document.getElementById("category-name-column"); // This seems misnamed, if it's for category name column, it's correct.
    const calCol = document.getElementById("category-column"); // This seems misnamed, if it's for category calendar column, it's correct.
//Menu Section
const businessDropdown = document.getElementById("business-dropdown"); // <-- ADD THIS LINE HERE!
selectedBusinessNameElement = document.getElementById("selected-business-name"); 
//Business Section

//Calendar Section 


//Category Section

//Service Section

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
   await fetchBusinesses();

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

  //////////////////////////////////////////////////////////////////////////////////////
                                //Menu Section 
 //Change default business name section
  if (businessDropdown) { // Make sure the dropdown exists before adding listener
        businessDropdown.addEventListener("change", () => {
            const businessId = businessDropdown.value; // Get the ID of the selected option

            if (businessId) {
                // Find the selected business object in your allBusinesses array
                const selectedBusiness = allBusinesses.find(b => b._id === businessId);

                if (selectedBusiness) {
                    // Update the h2 with the selected business's name
                    // This assumes your business object has a 'values.businessName' property
                    selectedBusinessNameElement.textContent = selectedBusiness.values.businessName;
                } else {
                    console.warn(`Selected business ID ${businessId} not found in allBusinesses array.`);
                    selectedBusinessNameElement.textContent = "Business not found";
                }

            

            } else {
                
                selectedBusinessNameElement.textContent = "Parent group's business name"; // Reset to default text

                
            }
        });
    }


//////////////////////////////////////////////////////////////////////////////////////
                                //Business 
 
 //////////////////////////////////////////////////////////////////////////////////////
                                //Calendar 

   //////////////////////////////////////////////////////////////////////////////////////
                                //Category
 
  
   //////////////////////////////////////////////////////////////////////////////////////
                                //Service  


////////////////////////////End of DOM //////////////////////////////////////////////////
   });

  //////////////////////////////////////////////////////////////////////////////////////
                                //Menu Section 
 // Inside accept.js, but outside the DOMContentLoaded listener

// Function to fetch businesses from the backend
async function fetchBusinesses() {
    try {
        const res = await fetch("/get-records/Business"); // Call your new backend route
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        allBusinesses = data; // Store the fetched businesses in the global variable
        console.log("Businesses fetched:", allBusinesses);
        renderBusinesses(); // Call render function after fetching
    } catch (error) {
        console.error("Error fetching businesses:", error);
        // You might want to display an error message to the user
    }
}

// Function to populate the business dropdown
function renderBusinesses() {
    const businessDropdown = document.getElementById("business-dropdown");
    if (!businessDropdown) {
        console.error("Business dropdown element not found.");
        return;
    }

    // Clear existing options, keeping the default "Choose Business"
    businessDropdown.innerHTML = '<option value="">-- Choose Business --</option>';

    if (allBusinesses && allBusinesses.length > 0) {
        allBusinesses.forEach(business => {
            const option = document.createElement('option');
            option.value = business._id; // The value of the option should be the business's ID
            // Assuming your business document has a 'values.businessName' field
            option.textContent = business.values.businessName;
            businessDropdown.appendChild(option);
        });
        businessDropdown.disabled = false; // Enable the dropdown if there are businesses
    } else {
        // If no businesses, ensure it's disabled and shows only the default option
        businessDropdown.disabled = true;
        console.log("No businesses to render for this user.");
    }
}

// ... rest of your JS functions (saveService, fetchServices, etc. will come later)
                                
//////////////////////////////////////////////////////////////////////////////////////
                                //Business 
 
 //////////////////////////////////////////////////////////////////////////////////////
                                //Calendar 

   //////////////////////////////////////////////////////////////////////////////////////
                                //Category
 
  
   //////////////////////////////////////////////////////////////////////////////////////
                                //Service  
