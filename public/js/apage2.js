let currentUserId = null;
 let businesses = [];
let currentCalendarId = null;
let currentServiceId = null;
let currentBusinessId = null; // Used for business popup edit mode
let calendars = [];

// Global references for Category Popup elements
let currentCategoryId = null; // For Category edit mode
let saveCategoryButton;       // <-- ADD THIS
let categoryNameInput;        // <-- ADD THIS

let openServicePopupButton;
let addServicePopup;
let addServicePopupOverlay;
let servicePopupTitle;


// You'll likely need to store the fetched data globally as well
let allBusinesses = [];
let allCalendars = [];
let allCategories = [];
let allServices = [];
let serviceSection;

// Global variables for Service Popup form elements
let serviceNameInput;
let servicePriceInput;
let serviceDescriptionInput;
let serviceDurationInput;
let serviceImageInput;

let addServiceForm; // The service form itself
let serviceImageFileInput;
let serviceImageUrlInput; // If you have one for a URL input
let serviceImagePreview; // The <img> tag for preview


let dropdownServiceBusiness;
let dropdownServiceCalendar;
let dropdownServiceCategory;
let popupServiceNameInput; // Corresponds to popup-service-name-input
let popupServicePriceInput;
let popupServiceDescriptionInput;
let dropdownDuration;
let saveServiceButton;
let updateServiceButton;
let deleteServiceButton;

 // Service Popup element assignments (confirm these are present and correct)
    openServicePopupButton = document.getElementById("open-service-popup-button");
    addServicePopup = document.getElementById("popup-add-service");
    addServicePopupOverlay = document.getElementById("popup-add-service-overlay");
    servicePopupTitle = addServicePopup.querySelector(".section-title"); // To target the H2 title

    // Service Popup Dropdown assignments (and other form elements)
    dropdownServiceBusiness = document.getElementById("dropdown-service-business");
    dropdownServiceCalendar = document.getElementById("dropdown-service-calendar");
    dropdownServiceCategory = document.getElementById("dropdown-service-category");
    serviceNameInput = document.getElementById("popup-service-name-input");
    servicePriceInput = document.getElementById("popup-service-price-input");
    serviceDescriptionInput = document.getElementById("popup-service-description-input");
    serviceDurationInput = document.getElementById("dropdown-duration");
    serviceImageInput = document.getElementById("popup-service-image-input");
    saveServiceButton = document.getElementById("save-service-button");
    updateServiceButton = document.getElementById("update-service-button");
    deleteServiceButton = document.getElementById("delete-service-button");
    addServiceForm = document.getElementById("add-service-form");
    serviceListContainer = document.getElementById("service-display-area"); // Target the section itself

servicePopupTitle = document.querySelector("#popup-add-service .section-title");
    serviceImageFileInput = document.getElementById("popup-service-image-input");
    // serviceImageUrlInput = document.getElementById("service-image-url-input"); // Uncomment if you have this
    // serviceImagePreview = document.getElementById("service-image-preview"); // Uncomment if you have this
   
let popupAddService;
let popupOverlay; // If you're using an overlay


document.addEventListener("DOMContentLoaded", async () => {
  const loginStatus = document.getElementById("login-status");
  const openLoginBtn = document.getElementById("open-login-popup-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const openCatBtn   = document.getElementById("open-category-popup-button");
  const popupOverlay = document.getElementById("popup-overlay");
  const bizSelect    = document.getElementById("dropdown-category-business");
  const calSelect    = document.getElementById("dropdown-business-calendar");
const openBusinessPopupButton = document.getElementById("open-business-popup-button");
const saveBizBtn              = document.getElementById("save-button");
const updateBizBtn            = document.getElementById("update-button");
const deleteBizBtn            = document.getElementById("delete-button");
const nameCol    = document.getElementById("category-name-column");
const calCol     = document.getElementById("category-column");
const serviceCalSel = document.getElementById("dropdown-service-calendar");
const serviceCatSel = document.getElementById("dropdown-service-category");
const serviceBizSel = document.getElementById("dropdown-service-business");
  // --- IMPORTANT: Initialize ALL GLOBAL CATEGORY POPUP ELEMENTS HERE ---
    openCategoryPopupButton = document.getElementById("open-category-popup-button");
    addCategoryPopup = document.getElementById("popup-add-category");
    addCategoryPopupOverlay = document.getElementById("popup-add-category-overlay");
    saveCategoryButton = document.getElementById("save-category-button");
    updateCategoryButton = document.getElementById("update-category-button");
    deleteCategoryButton = document.getElementById("delete-category-button");
    categoryNameInput = document.getElementById("popup-category-name-input");
    categoryBusinessSelect = document.getElementById("dropdown-category-business");
    businessCalendarSelect = document.getElementById("dropdown-business-calendar");
    categoryPopupTitle = document.querySelector("#popup-add-category .section-title"); // Using querySelector for title
deleteCategoryButton = document.getElementById("delete-category-button"); 


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
    await fetchCategories();
    await fetchServices();

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
///////////////////////////////////////////////////
                            //Business 
//Open Add business Popup using button 
    // Check if the button exists before adding an event listener
    if (openBusinessPopupButton) {
        // When the button is clicked, call our simple function to open the popup
        openBusinessPopupButton.addEventListener('click', openAddBusinessPopup);
        console.log("Event listener attached to 'Add Business' button.");
    } else {
        console.error("Error: 'open-business-popup-button' not found in the HTML.");
    }

///Save Business
// Get a reference to the "Save Business" button
    const saveButton = document.getElementById("save-button");

    // Add an event listener to the "Save Business" button
    if (saveButton) {
        saveButton.addEventListener("click", async (e) => {
            e.preventDefault(); // Prevent the default form submission behavior (which would reload the page)
            await saveBusiness(); // Call our asynchronous saveBusiness function
        });
        console.log("Event listener attached to 'Save Business' button.");
    } else {
        console.error("Error: 'save-button' not found in the HTML.");
    }

    // You also need to handle the form submission if the user presses Enter in an input field.
    // Attach an event listener to the form itself.
    const businessForm = document.getElementById("popup-add-business-form");
    if (businessForm) {
        businessForm.addEventListener("submit", async (e) => {
            e.preventDefault(); // Prevent default form submission (page reload)
            // Ensure we are in "save" mode (not update/delete)
            if (saveButton && saveButton.style.display !== 'none') { // Only if save button is visible
                await saveBusiness();
            }
        });
        console.log("Event listener attached to 'popup-add-business-form' for submit.");
    } else {
        console.error("Error: 'popup-add-business-form' not found in the HTML.");
    }
///Update Business
  const updateButton = document.getElementById("update-button");

    // Add an event listener to the "Update Business" button
    if (updateButton) {
        updateButton.addEventListener("click", async (e) => {
            e.preventDefault(); // Prevent default button behavior
            await updateBusiness(); // Call our asynchronous updateBusiness function
        });
        console.log("Event listener attached to 'Update Business' button.");
    } else {
        console.error("Error: 'update-button' not found in the HTML.");
    }



    if (businessForm) {
        businessForm.addEventListener("submit", async (e) => {
            e.preventDefault(); // Always prevent default form submission

            if (saveButton && saveButton.style.display !== 'none') {
                // If the save button is visible, it's 'add' mode
                await saveBusiness();
            } else if (updateButton && updateButton.style.display !== 'none') {
                // If the update button is visible, it's 'edit' mode
                await updateBusiness();
            }
        });
        console.log("Updated form submit listener to handle both save and update.");
    }

//Delete Business
 const deleteButton = document.getElementById("delete-button");

    // Add an event listener to the "Delete Business" button
    if (deleteButton) {
        deleteButton.addEventListener("click", async (e) => {
            e.preventDefault(); // Prevent default button behavior
            await deleteBusiness(); // Call our asynchronous deleteBusiness function
        });
        console.log("Event listener attached to 'Delete Business' button.");
    } else {
        console.error("Error: 'delete-button' not found in the HTML.");
    }

//////////////////////////////////////////////////////////////////////////////////////
                                //Calendar 
//Open Add Calendar Popup 
    const openCalendarButton = document.getElementById("open-calendar-button");
    if (openCalendarButton) {
        openCalendarButton.addEventListener('click', openAddCalendarPopup);
    }

    // Overlay click listener
    if (popupOverlay) {
        popupOverlay.addEventListener("click", () => {
            const calendarPopup = document.getElementById("popup-add-calendar");
            if (calendarPopup && calendarPopup.style.display === 'block') {
                closeAddCalendarPopup();
            }
            const businessPopup = document.getElementById("popup-add-business");
            if (businessPopup && businessPopup.style.display === 'block') {
                closeAddBusinessPopup();
            }
            const loginPopup = document.getElementById("popup-login");
            if (loginPopup && loginPopup.style.display === 'block') {
                closeLoginPopup(); // Assuming you have a closeLoginPopup()
            }
        });
    }
//Save Calendar 
    
    const saveCalendarButton = document.getElementById("save-calendar-button"); // <-- Get this button
    const updateCalendarButton = document.getElementById("update-calendar-button");
    const deleteCalendarButton = document.getElementById("delete-calendar-button");
    
 if (openCalendarButton) {
        openCalendarButton.addEventListener('click', () => {
            openAddCalendarPopup();
            // When opening for a NEW calendar, ensure Update and Delete are hidden, Save is visible
            if (saveCalendarButton) saveCalendarButton.style.display = 'inline-block';
            if (updateCalendarButton) updateCalendarButton.style.display = 'none';
            if (deleteCalendarButton) deleteCalendarButton.style.display = 'none';
            // Also, clear the form fields when opening for 'add'
            document.getElementById("dropdown-calendar-business").value = "";
            document.getElementById("popup-calendar-name-input").value = "";
        });
    }

    if (saveCalendarButton) {
        saveCalendarButton.addEventListener("click", async (e) => {
            e.preventDefault(); // Prevent default button behavior (e.g., form submission if it were part of a form)
            await saveCalendar(); // Call our asynchronous saveCalendar function
        });
       
    } else {
        console.error("Error: 'save-calendar-button' not found in the HTML.");
    }

if (updateCalendarButton) {
    updateCalendarButton.addEventListener("click", async (e) => {
        e.preventDefault();
        await updateCalendar();
    });
  
}

if (deleteCalendarButton) {
    deleteCalendarButton.addEventListener("click", async (e) => {
        e.preventDefault();
        await deleteCalendar();
    });
  
}


//////////////////////////////////////////////////////////////////////////////////////
                                //Category
  
    //Open Add Category Popup 
    // --- Event listener for opening Add Category popup ---
   if (openCategoryPopupButton) {
    openCategoryPopupButton.addEventListener('click', () => {
        openCategoryPopup(); // This is the CORRECT function call
    });
    console.log("Event listener attached to 'Add Category' button.");
}

    // --- Event listener for closing Category popup via overlay click ---
    if (addCategoryPopupOverlay) {
        addCategoryPopupOverlay.addEventListener('click', closeCategoryPopup); // This function does not exist.
                                                                                // It should be closeCategoryPopup()
        console.log("Event listener attached to 'Category Popup Overlay'.");
    }

    //load Calendars in dropdown 
    // --- Get references for Category-related dropdowns ---
    const categoryBusinessDropdown = document.getElementById("dropdown-category-business");
    const businessCalendarDropdown = document.getElementById("dropdown-business-calendar"); // This is the target calendar dropdown

    // --- Initial state: Disable the calendar dropdown ---
    if (businessCalendarDropdown) {
        businessCalendarDropdown.disabled = true;
        console.log("'Choose Calendar' dropdown initialized as disabled.");
    }

    // --- Event listener for when a Business is selected in the Category popup's dropdown ---
    if (categoryBusinessDropdown && businessCalendarDropdown) {
        categoryBusinessDropdown.addEventListener('change', async () => {
            const selectedBusinessId = categoryBusinessDropdown.value; // Get the ID of the selected business

            if (selectedBusinessId) {
                // If a business is selected (not "-- Select --")
                console.log("Business selected in category dropdown:", selectedBusinessId);
                const calendarsForBusiness = await fetchCalendarsForDropdown(selectedBusinessId);
                populateCalendarDropdown(businessCalendarDropdown, calendarsForBusiness);
            } else {
                // If "-- Select --" is chosen, clear and disable the calendar dropdown
                console.log("No business selected, clearing calendar dropdown.");
                populateCalendarDropdown(businessCalendarDropdown, []); // Pass an empty array to clear and disable
            }
        });
        console.log("Event listener attached to 'Choose Business' dropdown for categories.");
    }

    //save Category 
    categoryNameInput = document.getElementById("popup-category-name-input"); // Get reference to input // REPEATED
    saveCategoryButton = document.getElementById("save-category-button");     // Get reference to button // REPEATED

    // --- Event listener for Save Category button ---
    if (saveCategoryButton) {
        saveCategoryButton.addEventListener('click', saveCategory);
        console.log("Event listener attached to 'Save Category' button.");
    }

    //iono
    // --- Event listener for opening Add Category popup (Add mode) ---
    if (openCategoryPopupButton) {
        openCategoryPopupButton.addEventListener('click', () => {
            openCategoryPopup(); // No arguments for Add mode. Correct.
        });
        console.log("Event listener attached to 'Add Category' button.");
    }

    // --- Event listener for closing Category popup via overlay click ---
    if (addCategoryPopupOverlay) {
        addCategoryPopupOverlay.addEventListener('click', closeCategoryPopup); // Correct function name.
        console.log("Event listener attached to 'Category Popup Overlay'.");
    }
    //Update Category 
     if (updateCategoryButton) {
        updateCategoryButton.addEventListener('click', updateCategory); // Call the new updateCategory function
        console.log("Event listener attached to 'Update Category' button.");
    }

//Delete Category 
 if (deleteCategoryButton) {
        deleteCategoryButton.addEventListener('click', deleteCategory); // Calls the deleteCategory function
        console.log("Event listener attached to 'Delete Category' button.");
    }
///////////////////////////////////////////////////////////////////////////////////
                                 //Service Section 
   //Open Add Service Popup 
    if (openServicePopupButton) {
        openServicePopupButton.addEventListener('click', () => {
            // When "Add Service" is clicked, call openServicePopup without arguments
            // This will open it in "Add" mode.
            openServicePopup();
        });
        console.log("Event listener attached to 'Add Service' button.");
    }

    // --- Event Listener for Service Popup Overlay (to close popup by clicking outside) ---
    // This is good to keep
    if (addServicePopupOverlay) {
        addServicePopupOverlay.addEventListener('click', closeAddServicePopup);
        console.log("Event listener attached to 'Service Popup Overlay'.");
    }

 // --- Event Listeners for Chained Dropdown Selection (IMPORTANT for filtering) ---
    // When the Business dropdown changes, update the Calendar dropdown
    if (dropdownServiceBusiness) {
        dropdownServiceBusiness.addEventListener('change', async () => {
            const selectedBusinessId = dropdownServiceBusiness.value;
            let calendarsForService = [];

            if (selectedBusinessId) {
                calendarsForService = await fetchCalendarsForDropdown(selectedBusinessId);
            }
            populateCalendarDropdown(dropdownServiceCalendar, calendarsForService);

            // Also clear and disable the category dropdown until a calendar is selected
            if (dropdownServiceCategory) {
                dropdownServiceCategory.innerHTML = '<option value="">-- Select --</option>';
                dropdownServiceCategory.disabled = true;
            }
        });
    }

    // When the Calendar dropdown changes, update the Category dropdown
    if (dropdownServiceCalendar) {
        dropdownServiceCalendar.addEventListener('change', async () => {
            const selectedCalendarId = dropdownServiceCalendar.value;
            let categoriesForService = [];

            if (selectedCalendarId) {
                categoriesForService = await fetchCategoriesForDropdown(null, selectedCalendarId); // Pass businessId as null if only filtering by calendarId
            }
            populateCategoryDropdown(dropdownServiceCategory, categoriesForService); // You'll need to create this function
        });
    }

if (addServiceForm) {
    addServiceForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission (page reload)

        // Determine if we're in "save" or "update" mode
        if (saveServiceButton && saveServiceButton.style.display === 'block') {
            await saveService();
        } else if (updateServiceButton && updateServiceButton.style.display === 'block') {
            // This is where your updateService() function will be called later
            // await updateService();
            console.log("Update Service functionality not yet implemented.");
        }
    });
    console.log("Event listener attached to 'Add Service' form for submission.");
}

//Update Service 
  // Add the event listener for the update button
    if (updateServiceButton) { // Always check if the element exists
        updateServiceButton.addEventListener('click', handleUpdateService);
    }

//Delete Service 
 // Add the event listener for the delete button
    if (deleteServiceButton) { // Always check if the element exists
        deleteServiceButton.addEventListener('click', handleDeleteService);
    }



////////////////////////////End of DOM //////////////////////////////////////////////////
   });
 
                        //Business
  //Open add business popup 
   function openAddBusinessPopup() {
    console.log("Opening Add Business popup for new entry...");

    const businessPopup = document.getElementById("popup-add-business");
    const popupOverlay = document.getElementById("popup-overlay");

    if (!businessPopup || !popupOverlay) {
        console.error("Error: Could not find 'popup-add-business' or 'popup-overlay' elements.");
        return;
    }

    // --- 1. Clear all form fields ---
    document.getElementById("popup-business-name-input").value = '';
    document.getElementById("popup-your-name-input").value = '';
    document.getElementById("popup-business-phone-number-input").value = '';
    document.getElementById("popup-business-location-name-input").value = '';
    document.getElementById("popup-business-address-input").value = '';
    document.getElementById("popup-business-email-input").value = '';
    document.getElementById("image-upload").value = ''; // Crucial for file inputs

    // --- 2. Reset image preview state ---
    const currentHeroImage = document.getElementById("current-hero-image");
    const noImageText = document.getElementById("no-image-text");
    if (currentHeroImage) currentHeroImage.style.display = 'none';
    if (noImageText) noImageText.style.display = 'inline-block';

    // --- 3. Reset the global currentBusinessId ---
    currentBusinessId = null; // Important: signifies we are adding a NEW business

    // --- 4. Set popup title ---
    document.getElementById("popup-title").textContent = "Add Business";

    // --- 5. Adjust button visibility for 'Save' mode ---
    document.getElementById("save-button").style.display = "inline-block"; // Show Save
    document.getElementById("update-button").style.display = "none";     // Hide Update
    document.getElementById("delete-button").style.display = "none";     // Hide Delete

    // --- 6. Show the popup and overlay ---
    businessPopup.style.display = 'block';
    popupOverlay.style.display = 'block';
    document.body.classList.add("popup-open");
    console.log("Add Business popup opened and cleared.");
}

// Your closeAddBusinessPopup function remains the same:
function closeAddBusinessPopup() {
    // ... (your existing close function code) ...
    const businessPopup = document.getElementById("popup-add-business");
    const popupOverlay = document.getElementById("popup-overlay");

    if (businessPopup && popupOverlay) {
        businessPopup.style.display = 'none';
        popupOverlay.style.display = 'none';
        document.body.classList.remove("popup-open");
        console.log("Business popup closed.");
    }
}
///Save Business
async function saveBusiness() {
    console.log("Attempting to save business...");

    // 1. Get references to all form input elements
    const businessNameInput = document.getElementById("popup-business-name-input");
    const yourNameInput = document.getElementById("popup-your-name-input");
    const phoneNumberInput = document.getElementById("popup-business-phone-number-input");
    const locationNameInput = document.getElementById("popup-business-location-name-input");
    const businessAddressInput = document.getElementById("popup-business-address-input");
    const businessEmailInput = document.getElementById("popup-business-email-input");
    const imageUploadInput = document.getElementById("image-upload"); // The file input

    // 2. Basic client-side validation for required fields (matching your HTML 'required' attribute)
    if (!businessNameInput.value.trim() || !yourNameInput.value.trim() ||
        !phoneNumberInput.value.trim() || !locationNameInput.value.trim() ||
        !businessAddressInput.value.trim()) {
        alert("Please fill in all required fields (marked with *).");
        console.warn("Validation failed: Required fields are empty.");
        return; // Stop the function if validation fails
    }

    // 3. Create a FormData object
    // FormData is crucial for sending files along with other form data.
    const formData = new FormData();

    // Append all text input values to the FormData object
    formData.append('businessName', businessNameInput.value.trim());
    formData.append('yourName', yourNameInput.value.trim());
    formData.append('phoneNumber', phoneNumberInput.value.trim());
    formData.append('locationName', locationNameInput.value.trim());
    formData.append('businessAddress', businessAddressInput.value.trim());
    formData.append('businessEmail', businessEmailInput.value.trim());

    // Append the selected file (if any) to the FormData object
    // req.file in your backend expects 'heroImage' as the field name
    if (imageUploadInput.files.length > 0) {
        formData.append('heroImage', imageUploadInput.files[0]);
        console.log("Image file selected for upload:", imageUploadInput.files[0].name);
    } else {
        console.log("No image file selected for upload.");
    }

    try {
        // 4. Send the data to your server using the Fetch API
        // Your server route is app.post('/create-business', ...)
        const response = await fetch("/create-business", {
            method: "POST", // Use POST for creating new resources
            body: formData, // When using FormData, the browser automatically sets the correct 'Content-Type: multipart/form-data' header. DO NOT manually set 'Content-Type: application/json'.
        });

        // 5. Handle the server's response
        if (!response.ok) { // Check if the HTTP status code indicates an error (e.g., 4xx or 5xx)
            const errorData = await response.json(); // Parse error message from server
            throw new Error(errorData.message || "Failed to save business due to a server error.");
        }

        const newBusiness = await response.json(); // Parse the successful response
        alert("✅ Business saved successfully!");
        console.log("New business saved:", newBusiness);

        // 6. Close the popup after successful submission
        closeAddBusinessPopup();

        // 7. IMPORTANT: After saving, you'll want to refresh your list of businesses.
        // We'll need a fetchBusinesses() and renderBusinesses() for this later.
        // For now, you might just see the popup close.
        // await fetchBusinesses(); // Uncomment this line when you implement fetchBusinesses() and renderBusinesses()
        
    } catch (error) {
        console.error("Error saving business:", error);
        alert(`Error saving business: ${error.message}`);
    }
}

///Show Business in business section
async function fetchBusinesses() {
    console.log("Fetching businesses from server...");
    if (!currentUserId) {
        console.warn("Not logged in. Skipping business fetch and dropdown population.");
        businesses = [];
        renderBusinesses(); // Ensure the main business list is cleared
        populateBusinessDropdowns(); // Ensure dropdown is cleared
        return;
    }

    try {
        const res = await fetch("/get-records/Business");

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        businesses = data;
        console.log("Businesses fetched successfully:", businesses);

        renderBusinesses();         // Renders the list in the Business tab
        populateBusinessDropdowns(); // Renders the options in the dropdown
    } catch (error) {
        console.error("Error fetching businesses:", error);
    }
}


// ─── Data Rendering Functions ────────────────────────────────────
// This function will display the businesses in your HTML
function renderBusinesses() {
    console.log("Rendering businesses...");

    const businessNameColumn = document.getElementById("business-name-column");
    const servicesColumn = document.getElementById("services-column");
    const clientsColumn = document.getElementById("clients-column");

    if (!businessNameColumn || !servicesColumn || !clientsColumn) {
        console.error("Error: One or more business display columns not found in HTML.");
        return;
    }

    businessNameColumn.innerHTML = '';
    servicesColumn.innerHTML = '';
    clientsColumn.innerHTML = '';

    if (!businesses || businesses.length === 0) {
        businessNameColumn.innerHTML = `
            <div class="list-column-item no-data-message" style="grid-column: span 3; text-align: center; padding: 20px; color: #777;">
                No businesses found. Click 'Add Business' to create your first one!
            </div>
        `;
        servicesColumn.innerHTML = '';
        clientsColumn.innerHTML = '';
        console.log("No businesses to render.");
        return;
    }

    businesses.forEach(business => {
        // --- Business Name Column ---
        const nameItem = document.createElement('div');
        nameItem.classList.add('list-column-item');
        nameItem.textContent = business.values.businessName || 'Unnamed Business';
        nameItem.dataset.businessId = business._id; // Store the ID
        nameItem.classList.add('clickable-item');

        // *** THIS IS THE NEW PART: Add event listener to open in edit mode ***
        nameItem.addEventListener('click', () => openEditBusinessPopup(business._id));
        // *******************************************************************

        businessNameColumn.appendChild(nameItem);

        // --- # of Services Column ---
        const servicesCountItem = document.createElement('div');
        servicesCountItem.classList.add('list-column-item');
        servicesCountItem.textContent = '0'; // Placeholder
        servicesColumn.appendChild(servicesCountItem);

        // --- # of Clients Column ---
        const clientsCountItem = document.createElement('div');
        clientsCountItem.classList.add('list-column-item');
        clientsCountItem.textContent = '0'; // Placeholder
        clientsColumn.appendChild(clientsCountItem);
    });
    console.log("Businesses rendered successfully.");
}

///Open Add business in edit mode 
async function openEditBusinessPopup(businessId) {
    console.log("Opening Business Popup in Edit Mode for ID:", businessId);

    // 1. Get references to the popup elements and overlay
    const businessPopup = document.getElementById("popup-add-business");
    const popupOverlay = document.getElementById("popup-overlay");

    if (!businessPopup || !popupOverlay) {
        console.error("Error: Business popup ('popup-add-business') or 'popup-overlay' not found.");
        return;
    }

    // 2. Store the ID of the business currently being edited globally
    // This is crucial for your Update and Delete functions later
    currentBusinessId = businessId;

    // 3. Find the business data from your globally stored 'businesses' array
    // The 'businesses' array should be populated by your fetchBusinesses() function
    const businessToEdit = businesses.find(b => b._id === businessId);

    if (!businessToEdit) {
        alert("Business data not found for editing. Please try refreshing the page.");
        console.error("Business with ID", businessId, "not found in global 'businesses' array.");
        return;
    }

    // 4. Populate the form fields with the business's current data
    document.getElementById("popup-business-name-input").value = businessToEdit.values.businessName || '';
    document.getElementById("popup-your-name-input").value = businessToEdit.values.yourName || '';
    document.getElementById("popup-business-phone-number-input").value = businessToEdit.values.phoneNumber || '';
    document.getElementById("popup-business-location-name-input").value = businessToEdit.values.locationName || '';
    document.getElementById("popup-business-address-input").value = businessToEdit.values.businessAddress || '';
    document.getElementById("popup-business-email-input").value = businessToEdit.values.businessEmail || '';
    document.getElementById("image-upload").value = ''; // Always clear file input for security/clarity; user will re-select if needed

    // 5. Display current image preview or "No image" text
    const currentHeroImage = document.getElementById("current-hero-image");
    const noImageText = document.getElementById("no-image-text");
    if (businessToEdit.values.heroImage) {
        currentHeroImage.src = businessToEdit.values.heroImage;
        currentHeroImage.style.display = 'inline-block';
        noImageText.style.display = 'none';
        // Add alt text for accessibility if not already present
        if (!currentHeroImage.alt) currentHeroImage.alt = businessToEdit.values.businessName + " Hero Image";
    } else {
        currentHeroImage.style.display = 'none';
        noImageText.style.display = 'inline-block';
    }

    // 6. Set the popup title for "Edit" mode
    document.getElementById("popup-title").textContent = "Edit Business";

    // 7. Adjust button visibility: Show "Update" and "Delete", Hide "Save"
    document.getElementById("save-button").style.display = "none";
    document.getElementById("update-button").style.display = "inline-block";
    document.getElementById("delete-button").style.display = "inline-block";

    // 8. Open the business popup and overlay
    businessPopup.style.display = 'block';
    popupOverlay.style.display = 'block';
    document.body.classList.add("popup-open");
    console.log("Business popup opened in edit mode successfully.");
}

//Update Business 
async function updateBusiness() {
    console.log("Attempting to update business...");

    // Check if we actually have a business ID to update
    if (!currentBusinessId) {
        console.error("No business ID found for update. This should not happen in edit mode.");
        alert("Error: No business selected for update.");
        return;
    }

    // 1. Get references to all form input elements
    const businessNameInput = document.getElementById("popup-business-name-input");
    const yourNameInput = document.getElementById("popup-your-name-input");
    const phoneNumberInput = document.getElementById("popup-business-phone-number-input");
    const locationNameInput = document.getElementById("popup-business-location-name-input");
    const businessAddressInput = document.getElementById("popup-business-address-input");
    const businessEmailInput = document.getElementById("popup-business-email-input");
    const imageUploadInput = document.getElementById("image-upload"); // The file input

    // 2. Basic client-side validation for required fields
    if (!businessNameInput.value.trim() || !yourNameInput.value.trim() ||
        !phoneNumberInput.value.trim() || !locationNameInput.value.trim() ||
        !businessAddressInput.value.trim()) {
        alert("Please fill in all required fields (marked with *).");
        console.warn("Validation failed: Required fields are empty.");
        return;
    }

    // 3. Find the original business data to compare the name (for slug update)
    const originalBusiness = businesses.find(b => b._id === currentBusinessId);
    let originalBusinessName = originalBusiness ? originalBusiness.values.businessName : '';

    // 4. Create a FormData object for sending multi-part data (text + file)
    const formData = new FormData();

    // Append the business ID (crucial for backend to know which record to update)
    formData.append('businessId', currentBusinessId);

    // Append all current text input values
    const newBusinessName = businessNameInput.value.trim();
    formData.append('businessName', newBusinessName); // New name
    formData.append('yourName', yourNameInput.value.trim());
    formData.append('phoneNumber', phoneNumberInput.value.trim());
    formData.append('locationName', locationNameInput.value.trim());
    formData.append('businessAddress', businessAddressInput.value.trim());
    formData.append('businessEmail', businessEmailInput.value.trim());

    // 5. Handle Image Upload:
    // If a new file is selected, append it.
    if (imageUploadInput.files.length > 0) {
        formData.append('heroImage', imageUploadInput.files[0]);
        console.log("New image file selected for upload:", imageUploadInput.files[0].name);
    } else {
        // If no new file, and an original image exists, you might want to tell the backend to keep it.
        // Or if you allow removing images, this is where you'd send a flag for that.
        // For simplicity now, if no new file, the backend will assume to keep the old one
        // UNLESS the old one was explicitly deleted (which isn't implemented yet).
        console.log("No new image file selected. Current image (if any) will be kept.");
    }

    // 6. Handle Slug Update Logic (Frontend side only checks if name changed)
    // The actual slug generation and uniqueness check will happen on the backend.
    if (newBusinessName !== originalBusinessName) {
        console.log("Business name changed. New slug will be generated on server.");
        // We don't append a 'slug' field directly here. The server generates it.
    } else {
        console.log("Business name is the same. Slug will not be regenerated unless backend logic dictates.");
    }

    try {
        // 7. Send the update request to your server using a PUT method
        // You'll need a new route on your server for this (e.g., /update-business)
        const response = await fetch(`/update-business/${currentBusinessId}`, {
            method: "PUT", // Use PUT for updating existing resources
            body: formData, // FormData automatically sets 'Content-Type: multipart/form-formdata'
        });

        // 8. Handle the server's response
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const updatedBusiness = await response.json();
        alert("✅ Business updated successfully!");
        console.log("Business updated:", updatedBusiness);

        // 9. Close the popup and refresh the list of businesses
        closeAddBusinessPopup();
        await fetchBusinesses(); // Re-fetch and re-render the list to show changes

    } catch (error) {
        console.error("Error updating business:", error);
        alert(`Error updating business: ${error.message}`);
    }
}

//Delete Business
async function deleteBusiness() {
    console.log("Attempting to delete business with ID:", currentBusinessId);

    // 1. Confirm with the user before deleting
    const confirmDelete = confirm("Are you sure you want to delete this business and all its associated data (calendars, categories, services)? This action cannot be undone!");
    if (!confirmDelete) {
        console.log("Business deletion cancelled by user.");
        return; // Stop if the user cancels
    }

    // 2. Check if we have a business ID to delete
    if (!currentBusinessId) {
        console.error("No business ID found for deletion. This should not happen in edit mode.");
        alert("Error: No business selected for deletion.");
        return;
    }

    try {
        // 3. Send the DELETE request to your server
        // The ID is passed in the URL, matching your server's route: /delete-business/:id
        const response = await fetch(`/delete-business/${currentBusinessId}`, {
            method: "DELETE", // Use the DELETE HTTP method
        });

        // 4. Handle the server's response
        if (!response.ok) { // Check if the HTTP status code indicates an error
            const errorData = await response.json(); // Get error message from server
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json(); // Parse the successful response (e.g., { success: true })
        if (result.success) {
            alert("✅ Business deleted successfully!");
            console.log("Business deleted:", currentBusinessId);

            // 5. Close the popup and refresh the list of businesses
            closeAddBusinessPopup();
            await fetchBusinesses(); // Re-fetch and re-render the list to show changes
             await fetchCalendars();
          } else {
            // This might happen if server sends success: false explicitly, though your server sends { success: true } on success
            alert("Failed to delete business as expected.");
        }

    } catch (error) {
        console.error("Error deleting business:", error);
        alert(`Error deleting business: ${error.message}`);
    }
}

//////////////////////////////////////////////////////////////////////////////////////
                                                       //Calendar 
//Open popup when button is clicked 
function openAddCalendarPopup() {
   

    const calendarPopup = document.getElementById("popup-add-calendar");
    const popupOverlay = document.getElementById("popup-overlay"); // Ensure this element exists in your HTML!

    if (calendarPopup && popupOverlay) {
        calendarPopup.style.display = 'block';
        popupOverlay.style.display = 'block';
        document.body.classList.add("popup-open"); // Optional: Add class to body to prevent scrolling
       
    } else {
        console.error("Error: Could not find 'popup-add-calendar' or 'popup-overlay' elements. Cannot open popup.");
    }
}

// Function to close the 'Add Calendar' popup (for the 'x' button's onclick)
function closeAddCalendarPopup() {
    // These variables *must* be correctly assigned in your DOMContentLoaded
    // or fetched directly here if they are not global.

    // Let's assume you have global variables for these.
    // If not, you'd need to getElementById directly inside this function.
    const calendarPopup = document.getElementById("popup-add-calendar");
    const popupOverlay = document.getElementById("popup-overlay"); // The general overlay

    if (calendarPopup) {
        calendarPopup.style.display = 'none';
    } else {
        console.error("Could not find 'popup-add-calendar' element. Cannot close popup.");
    }

    if (popupOverlay) {
        popupOverlay.style.display = 'none';
        document.body.classList.remove("popup-open"); // Assuming you add this class for body scrolling
    } else {
        console.error("Could not find 'popup-overlay' element. Cannot close popup.");
    }
    // You might also reset currentCalendarId here if you have one
    // currentCalendarId = null;
}

//Show Businesses in the dropdown 
function populateBusinessDropdowns() {
    console.log("Populating business dropdowns...");

    // Get references to all the dropdowns you want to populate
    const calendarDropdown = document.getElementById("dropdown-calendar-business");
    const categoryDropdown = document.getElementById("dropdown-category-business"); // <-- NEW: Get the category dropdown

    // Clear existing options for the calendar dropdown
    if (calendarDropdown) {
        calendarDropdown.innerHTML = '<option value="">-- Select --</option>';
    }
    // Clear existing options for the category dropdown
    if (categoryDropdown) { // <-- NEW: Clear the new dropdown too
        categoryDropdown.innerHTML = '<option value="">-- Select --</option>';
    }

    if (!businesses || businesses.length === 0) {
        console.log("No businesses to populate dropdowns.");
        return;
    }

    // Iterate over the fetched businesses
    businesses.forEach(business => {
        // Only include businesses that have not been soft-deleted
        if (business.isDeleted === false) {
            const option = document.createElement('option');
            option.value = business._id;
            option.textContent = business.values.businessName || 'Unnamed Business';

            // Append the option to the calendar dropdown
            if (calendarDropdown) {
                // Use .cloneNode(true) if appending the same option element to multiple parents
                calendarDropdown.appendChild(option.cloneNode(true));
            }

            // Append the option to the category dropdown
            if (categoryDropdown) { // <-- NEW: Append to the new dropdown
                categoryDropdown.appendChild(option.cloneNode(true));
            }
        }
    });
    console.log("Business dropdowns populated successfully.");
}

///Save Calendar 
async function saveCalendar() {
   

    const businessSelect = document.getElementById("dropdown-calendar-business");
    const calendarNameInput = document.getElementById("popup-calendar-name-input");

    const businessId = businessSelect.value;
    const calendarName = calendarNameInput.value.trim();

    if (!businessId) {
        alert("Please select a business for the calendar.");
        console.warn("Validation failed: No business selected.");
        return;
    }
    if (!calendarName) {
        alert("Please enter a calendar name.");
        console.warn("Validation failed: Calendar name is empty.");
        return;
    }

    try {
        const response = await fetch("/create-calendar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ businessId, calendarName }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const newCalendar = await response.json();
        alert("✅ Calendar saved successfully!");
       

        // Clear the form fields after successful save
        businessSelect.value = ""; // Reset dropdown to default "-- Select --"
        calendarNameInput.value = ""; // Clear calendar name input

        // Close the calendar popup
        closeAddCalendarPopup();

        // ----------------------------------------------------
        // ADD OR UNCOMMENT THIS LINE TO REFRESH THE CALENDAR LIST
        await fetchCalendars(); // <-- This will re-fetch and re-render the list!
        // ----------------------------------------------------

       

    } catch (error) {
        console.error("Error saving calendar:", error);
        alert(`Error saving calendar: ${error.message}`);
    }
}

///Get Calendars 
async function fetchCalendars() {

    if (!currentUserId) {
        console.warn("Not logged in. Skipping calendar fetch.");
        calendars = []; // Clear existing calendars if not logged in
        renderCalendars(); // Ensure the list is cleared
        return;
    }

    try {
        // CHANGE THIS LINE: Match the client-side URL to your server's GET route
        const res = await fetch("/get-calendars"); // Corrected URL

        if (!res.ok) {
            const errorData = await res.json(); // This might still throw an error if the server sends non-JSON on certain 4xx/5xx, but it's the right attempt.
            throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        calendars = data; // Store fetched calendars in the global array
       
        renderCalendars(); // Render them after fetching
    } catch (error) {
        console.error("Error fetching calendars:", error);
    }
}

function renderCalendars() {
  
    const calendarNameColumn = document.getElementById("calendar-name-column");
    const calendarsColumn = document.getElementById("calendars-column");

    if (!calendarNameColumn) {
        console.error("Error: 'calendar-name-column' element not found.");
        return;
    }

    calendarNameColumn.innerHTML = '';
    if (calendarsColumn) calendarsColumn.innerHTML = '';

    if (!calendars || calendars.length === 0) {
        calendarNameColumn.innerHTML = `
            <div class="list-column-item no-data-message" style="grid-column: span 1; text-align: center; padding: 20px; color: #777;">
                No calendars found. Add one to get started!
            </div>
        `;
        if (calendarsColumn) calendarsColumn.innerHTML = '';
      
        return;
    }

    calendars.forEach(calendar => {
        const calendarItem = document.createElement('div');
        calendarItem.classList.add('list-column-item');
        const businessName = calendar.businessId?.values?.businessName || 'N/A';
        calendarItem.textContent = `${calendar.calendarName} (${businessName})`;
        calendarItem.dataset.calendarId = calendar._id;
        calendarItem.classList.add('clickable-item');

        // ADD THIS EVENT LISTENER:
        calendarItem.addEventListener('click', () => openEditCalendarPopup(calendar._id)); // <-- New

        calendarNameColumn.appendChild(calendarItem);

        if (calendarsColumn) {
            const placeholderItem = document.createElement('div');
            placeholderItem.classList.add('list-column-item');
            placeholderItem.textContent = '...';
            calendarsColumn.appendChild(placeholderItem);
        }
    });
  
}

//Open add Calenadar popup in edit mode 
async function openEditCalendarPopup(calendarId) {
    

    // 1. Store the ID of the calendar being edited globally
    currentCalendarId = calendarId;

    // 2. Open the popup first (reusing existing logic)
    openAddCalendarPopup(); // This just makes it visible. We'll populate it next.

    // 3. Get references to the buttons inside the popup
    const saveCalendarButton = document.getElementById("save-calendar-button");
    const updateCalendarButton = document.getElementById("update-calendar-button");
    const deleteCalendarButton = document.getElementById("delete-calendar-button");
    const calendarPopupTitle = document.querySelector("#popup-add-calendar .section-title"); // Get the title element

    // Adjust button visibility for Edit mode: Hide Save, Show Update/Delete
    if (saveCalendarButton) saveCalendarButton.style.display = 'none';
    if (updateCalendarButton) updateCalendarButton.style.display = 'inline-block';
    if (deleteCalendarButton) deleteCalendarButton.style.display = 'inline-block';
    if (calendarPopupTitle) calendarPopupTitle.textContent = 'Edit Calendar'; // Change popup title

    // Get references to the form fields
    const businessSelect = document.getElementById("dropdown-calendar-business");
    const calendarNameInput = document.getElementById("popup-calendar-name-input");

    // 4. Fetch the specific calendar's data from the server
    try {
        const response = await fetch(`/get-calendar/${calendarId}`); // This assumes a new server route (see Step 3)
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to fetch calendar: ${response.status}`);
        }
        const calendar = await response.json();
     

        // 5. Populate the form fields with the fetched data
        // Make sure to use optional chaining for businessId's _id in case it's null/undefined
        businessSelect.value = calendar.businessId?._id || ''; // Use _id if populated, otherwise empty string
        calendarNameInput.value = calendar.calendarName || '';

    } catch (error) {
        console.error("Error opening calendar for edit:", error);
        alert(`Failed to load calendar for editing: ${error.message}`);
        closeAddCalendarPopup(); // Close popup if data fetch fails
    }
}

//Update Calendar 
async function updateCalendar() {
    

    if (!currentCalendarId) {
        alert("No calendar selected for update.");
        console.warn("Update failed: currentCalendarId is null.");
        return;
    }

    const businessSelect = document.getElementById("dropdown-calendar-business");
    const calendarNameInput = document.getElementById("popup-calendar-name-input");

    const businessId = businessSelect.value;
    const calendarName = calendarNameInput.value.trim();

    if (!businessId || !calendarName) {
        alert("Please ensure a business is selected and the calendar name is entered.");
        console.warn("Validation failed for update: Missing businessId or calendarName.");
        return;
    }

    try {
        const response = await fetch(`/update-calendar/${currentCalendarId}`, { // Use PUT method
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ businessId, calendarName }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const updatedCalendar = await response.json();
        alert("✅ Calendar updated successfully!");
      

        closeAddCalendarPopup();
        await fetchCalendars(); // Refresh the list to show changes
        currentCalendarId = null; // Clear current ID after update

    } catch (error) {
        console.error("Error updating calendar:", error);
        alert(`Error updating calendar: ${error.message}`);
    }
}

// ─── Delete Calendar Function ──────────────────────────────────
async function deleteCalendar() {
 

    if (!currentCalendarId) {
        alert("No calendar selected for deletion.");
        console.warn("Delete failed: currentCalendarId is null.");
        return;
    }

    if (!confirm("Are you sure you want to delete this calendar? This action cannot be undone.")) {
        return; // User cancelled the deletion
    }

    try {
        const response = await fetch(`/delete-calendar/${currentCalendarId}`, { // Use DELETE method
            method: "DELETE",
            headers: { "Content-Type": "application/json" }, // Good practice, though often not strictly needed for DELETE
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        alert("🗑️ Calendar deleted successfully!");
       

        closeAddCalendarPopup();
        await fetchCalendars(); // Refresh the list after deletion
        currentCalendarId = null; // Clear current ID after deletion

    } catch (error) {
        console.error("Error deleting calendar:", error);
        alert(`Error deleting calendar: ${error.message}`);
    }
}

//////////////////////////////////////////////////////////////////////////////////////
                                //Category
  //Show calendars in dropdown 
  // Function to fetch calendars, optionally filtered by a specific business ID, for use in dropdowns
async function fetchCalendarsForDropdown(businessId = null) {
    let url = '/get-calendars'; // Your existing endpoint to get all calendars
    if (businessId) {
        url += `?businessId=${businessId}`; // Add businessId as a query parameter
    }

    try {
        const res = await fetch(url);
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        return data; // Return the fetched calendar data
    } catch (error) {
        console.error("Error fetching calendars for dropdown:", error);
        return []; // Return an empty array on error to prevent issues
    }
}                              

function populateCalendarDropdown(dropdownElement, calendarsData) {
    // Clear existing options, always keep the default "-- Select --"
    dropdownElement.innerHTML = '<option value="">-- Select --</option>';

    if (!calendarsData || calendarsData.length === 0) {
        dropdownElement.disabled = true; // Disable if no calendars are found
        return;
    }

    // Populate with actual calendar options
    calendarsData.forEach(calendar => {
        const option = document.createElement('option');
        option.value = calendar._id;
        option.textContent = calendar.calendarName; // Display the calendar's name
        dropdownElement.appendChild(option);
    });

    dropdownElement.disabled = false; // Enable the dropdown if calendars were added
}


  //Open Category Popup 
 let openCategoryPopupButton;
let addCategoryPopup;
let addCategoryPopupOverlay;
let categories = [];
 let categoryBusinessSelect; // Ref for dropdown-category-business
 let businessCalendarSelect; // Ref for dropdown-business-calendar
let categoryPopupTitle; 
let deleteCategoryButton;
let updateCategoryButton; 


// --- Open Category Popup Function ---
async function openCategoryPopup(categoryData = null) { // Now correctly takes an optional category object

    // Ensure all necessary global elements are referenced.
    // These should already be initialized in your DOMContentLoaded.
    // (e.g., addCategoryPopup, addCategoryPopupOverlay, categoryNameInput,
    // categoryBusinessSelect, businessCalendarSelect,
    // saveCategoryButton, updateCategoryButton, deleteCategoryButton, categoryPopupTitle)

    if (!addCategoryPopup || !addCategoryPopupOverlay || !categoryNameInput ||
        !categoryBusinessSelect || !businessCalendarSelect ||
        !saveCategoryButton || !updateCategoryButton || !deleteCategoryButton || !categoryPopupTitle) {
        console.error("One or more category popup elements not found. Cannot open popup.");
        return;
    }

    // Display the popup and overlay
    addCategoryPopup.style.display = 'block';
    addCategoryPopupOverlay.style.display = 'block';

    if (categoryData) { // === EDIT MODE: A category object was passed ===
        currentCategoryId = categoryData._id; // Store the ID of the category being edited
        categoryPopupTitle.textContent = 'Edit Category'; // Change popup title
        saveCategoryButton.style.display = 'none'; // Hide Save button
        updateCategoryButton.style.display = 'inline-block'; // Show Update button
        deleteCategoryButton.style.display = 'inline-block'; // Show Delete button

        // 1. Populate the Category Name input
        categoryNameInput.value = categoryData.categoryName || '';

        // 2. Select the correct Business in the Business dropdown
        // Check if businessId exists and has an _id (populated reference)
        if (categoryData.businessId && categoryData.businessId._id) {
            categoryBusinessSelect.value = categoryData.businessId._id;

            // 3. Trigger the 'change' event on the Business dropdown programmatically.
            // This is CRUCIAL. It tells your event listener (the one we reviewed that fetches calendars)
            // that a selection has been made, prompting it to fetch and populate
            // the 'Choose Calendar' dropdown based on the selected business.
            const changeEvent = new Event('change', { bubbles: true });
            categoryBusinessSelect.dispatchEvent(changeEvent);

            // 4. After triggering the business change, we need to wait a bit
            // for the asynchronous fetchCalendarsForDropdown and populateCalendarDropdown
            // to complete their work. Then, we can select the correct calendar.
            setTimeout(() => {
                if (categoryData.calendarId && categoryData.calendarId._id) {
                    businessCalendarSelect.value = categoryData.calendarId._id;
                } else {
                    // If calendarId is missing or corrupted, ensure calendar dropdown is reset
                    businessCalendarSelect.innerHTML = '<option value="">-- Select --</option>';
                    businessCalendarSelect.disabled = true;
                }
            }, 200); // 200ms delay is usually sufficient, but can be adjusted if needed

        } else {
            // If businessId is missing or corrupted in the fetched data,
            // reset both dropdowns to their default state.
            categoryBusinessSelect.value = ''; // Reset to "-- Select --"
            businessCalendarSelect.innerHTML = '<option value="">-- Select --</option>';
            businessCalendarSelect.disabled = true; // Disable calendar dropdown
        }

    } else { // === ADD MODE: No category object was passed ===
        currentCategoryId = null; // Clear any previously edited ID
        categoryPopupTitle.textContent = 'Add a Category'; // Change popup title
        saveCategoryButton.style.display = 'inline-block'; // Show Save button
        updateCategoryButton.style.display = 'none'; // Hide Update button
        deleteCategoryButton.style.display = 'none'; // Hide Delete button

        // Clear all form fields for a new entry
        categoryNameInput.value = '';
        categoryBusinessSelect.value = ''; // Reset business dropdown
        businessCalendarSelect.innerHTML = '<option value="">-- Select --</option>'; // Clear calendar dropdown
        businessCalendarSelect.disabled = true; // Disable calendar dropdown initially
    }
    console.log("Opened Category popup in", categoryData ? "EDIT" : "ADD", "mode. Current Category ID:", currentCategoryId);
}
// --- Close Category Popup Function ---
function closeCategoryPopup() {
    if (addCategoryPopup) addCategoryPopup.style.display = 'none';
    if (addCategoryPopupOverlay) addCategoryPopupOverlay.style.display = 'none';
    currentCategoryId = null; // Clear the currentCategoryId when the popup closes
    console.log("Closed Category popup. currentCategoryId reset to null.");
}
//Save Category 
async function saveCategory() {
    console.log("Attempting to save new category...");

    // Get values from the form fields
    const businessId = document.getElementById("dropdown-category-business").value;
    const calendarId = document.getElementById("dropdown-business-calendar").value;
    const categoryName = document.getElementById("popup-category-name-input").value.trim();

    // Client-Side Validation - ALL THREE ARE REQUIRED based on your server/model
    if (!businessId) {
        alert("Please select a business for the category.");
        return;
    }
    if (!calendarId) {
        alert("Please select a calendar for the category.");
        return;
    }
    if (!categoryName) {
        alert("Please enter a category name.");
        return;
    }

    try {
        const response = await fetch('/create-category', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                businessId,
                calendarId, // Send directly, as it's required by the server
                categoryName
            }),
        });

        // Check if the response was successful (HTTP status 2xx)
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to save category: ${response.status}`);
        }

        // Server responds with the newCat object directly, so no 'result.success' to check
        const savedCategory = await response.json(); // Parse the successful response
        alert('✅ Category saved successfully!');
        console.log('New category saved:', savedCategory);

        // 1. Close the category popup
        closeCategoryPopup();
        await fetchCategories();

        // 2. If you later implement a list of categories in your UI,
        //    you would call a function like this to refresh it:
        //    await fetchCategories(); // Assuming you'll create this function later

    } catch (error) {
        console.error('Error saving category:', error);
        alert(`Error saving category: ${error.message}`);
    }
}

//Get Categories
async function fetchCategories() {
    console.log("Fetching categories from server...");
    if (!currentUserId) {
        console.warn("Not logged in. Skipping category fetch.");
        categories = []; // Clear categories if not logged in
        renderCategories(); // Ensure UI is cleared
        return;
    }

    try {
        const res = await fetch("/get-records/Category"); // Calls your server route
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        categories = data; // Store the fetched categories
        console.log("Categories fetched successfully:", categories);
        renderCategories(); // Render them to the UI
    } catch (error) {
        console.error("Error fetching categories:", error);
    }
}

function renderCategories() {
    console.log("Rendering categories...");
    const categoryNameColumn = document.getElementById("category-name-column");
    const categoryCalendarColumn = document.getElementById("category-column");

    if (!categoryNameColumn || !categoryCalendarColumn) {
        console.error("Error: One or more category display columns not found in HTML.");
        return;
    }

    categoryNameColumn.innerHTML = '';
    categoryCalendarColumn.innerHTML = '';

    if (!categories || categories.length === 0) {
        const noDataMessage = document.createElement('div');
        noDataMessage.classList.add('list-column-item', 'no-data-message');
        noDataMessage.style.gridColumn = 'span 2';
        noDataMessage.style.textAlign = 'center';
        noDataMessage.style.padding = '20px';
        noDataMessage.style.color = '#777';
        noDataMessage.textContent = 'No categories found. Click \'Add Category\' to create your first one!';
        
        categoryNameColumn.parentNode.appendChild(noDataMessage);
        return;
    }

    categories.forEach(category => {
        // --- Category Name Column ---
        const nameItem = document.createElement('div');
        nameItem.classList.add('list-column-item');
        nameItem.textContent = category.categoryName || 'Unnamed Category';
        nameItem.dataset.categoryId = category._id; // Store ID on the element
        
        // --- NEW: Make category names clickable to open in edit mode ---
        nameItem.classList.add('clickable-item'); // Add a class for visual cue (e.g., cursor: pointer)
        nameItem.addEventListener('click', () => openCategoryPopup(category)); // Pass the full category object

        categoryNameColumn.appendChild(nameItem);

        // --- Associated Calendar (and Business) Name Column (no changes here) ---
        const calendarInfoItem = document.createElement('div');
        calendarInfoItem.classList.add('list-column-item');

        let displayCalendarName = 'N/A';
        let displayBusinessName = '';

        if (category.calendarId && category.calendarId.calendarName) {
            displayCalendarName = category.calendarId.calendarName;
        } else {
            displayCalendarName = 'N/A (Calendar Missing)';
            calendarInfoItem.style.fontStyle = 'italic';
            calendarInfoItem.style.color = '#aaa';
        }

        if (category.businessId && category.businessId.values && category.businessId.values.businessName) {
            displayBusinessName = ` (${category.businessId.values.businessName})`;
        } else {
            displayBusinessName = ' (Business Missing)';
            calendarInfoItem.style.fontStyle = 'italic';
            calendarInfoItem.style.color = '#aaa';
        }
        
        calendarInfoItem.textContent = displayCalendarName + displayBusinessName;
        categoryCalendarColumn.appendChild(calendarInfoItem);
    });
    console.log("Categories rendered successfully.");
}
//Update Category 
// --- Update Category Function ---
async function updateCategory() {
    // Ensure currentCategoryId is set (it should be when openCategoryPopup is called in edit mode)
    if (!currentCategoryId) {
        alert('Error: No category selected for update. Please reopen the category popup.');
        return;
    }

    const categoryName = categoryNameInput.value.trim();
    const businessId = categoryBusinessSelect.value;
    const calendarId = businessCalendarSelect.value;

    // Basic Client-Side Validation (optional but recommended)
    if (!categoryName) {
        alert('Category Name cannot be empty.');
        return;
    }
    if (!businessId) {
        alert('Please select a Business.');
        return;
    }
    if (!calendarId) {
        alert('Please select a Calendar.');
        return;
    }

    try {
        const response = await fetch(`/update-record/Category/${currentCategoryId}`, { // Use your backend endpoint
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                categoryName,
                businessId,
                calendarId
            }),
        });

        if (response.ok) {
            const data = await response.json();
            alert(data.message || 'Category updated successfully!');
            closeCategoryPopup(); // Close the popup
            await fetchCategories(); // Re-fetch and re-render categories to show updates
            console.log("Category updated:", data.category);
        } else {
            const errorData = await response.json();
            alert(`Error updating category: ${errorData.message || response.statusText}`);
            console.error('Error updating category:', errorData);
        }
    } catch (error) {
        console.error('Network error during category update:', error);
        alert('A network error occurred. Please try again.');
    }
}

//Delete Category 
async function deleteCategory() {
    // Ensure currentCategoryId is set from the openCategoryPopup (edit mode)
    if (!currentCategoryId) {
        alert('Error: No category selected for deletion.');
        return;
    }

    // Confirmation dialog for the user
    const confirmDelete = confirm('Are you sure you want to delete this category? This action cannot be undone for the user.'); // Clarified message
    if (!confirmDelete) {
        return; // User clicked "Cancel"
    }

    try {
        const response = await fetch(`/delete-record/Category/${currentCategoryId}`, { // Use your backend endpoint
            method: 'DELETE', // Specify DELETE method
            headers: {
                'Content-Type': 'application/json', // Good practice, though not strictly needed for simple DELETE
            }
            // No request body is typically needed for a DELETE by ID
        });

        if (response.ok) { // Check if the response status is 2xx
            const data = await response.json();
            alert(data.message || 'Category deleted successfully!'); // Show success message
            closeCategoryPopup(); // Close the category editing popup
            await fetchCategories(); // Re-fetch and re-render categories to update the list
            console.log("Category deleted (soft delete):", data.category);
        } else {
            // Handle HTTP error responses (e.g., 404, 401, 500)
            const errorData = await response.json();
            alert(`Error deleting category: ${errorData.message || response.statusText}`);
            console.error('Error deleting category:', errorData);
        }
    } catch (error) {
        // Handle network errors (e.g., server unreachable)
        console.error('Network error during category deletion:', error);
        alert('A network error occurred. Please try again.');
    }
}

/////////////////////////////////////////////////////////////////////////////////
//Service 
async function openServicePopup(serviceData = null) {
    console.log("openServicePopup called. serviceData:", serviceData);

    // ... (Basic element existence checks as before) ...

    addServicePopup.style.display = 'block';
    addServicePopupOverlay.style.display = 'block';
    document.body.classList.add("popup-open");

    // Reset popup to "Add Service" mode defaults
    servicePopupTitle.textContent = 'Add a Service';
    saveServiceButton.style.display = 'block';
    updateServiceButton.style.display = 'none';
    deleteServiceButton.style.display = 'none';
    addServiceForm.reset();
    if (serviceImageInput) serviceImageInput.value = '';
    currentServiceId = null;

    // STEP 1: Load the Business dropdown first.
    // This function uses your global `businesses` array directly.
    loadServiceBusinessDropdown(); // No arguments for initial load in "Add" mode

    // Reset and disable dependent dropdowns initially
    dropdownServiceCalendar.innerHTML = '<option value="">-- Select --</option>';
    dropdownServiceCalendar.disabled = true;
    dropdownServiceCategory.innerHTML = '<option value="">-- Select --</option>';
    dropdownServiceCategory.disabled = true;


    // --- Handle 'Edit' mode if serviceData is provided ---
    if (serviceData) {
        console.log("Entering EDIT mode for service:", serviceData._id);
        servicePopupTitle.textContent = 'Edit Service';
        saveServiceButton.style.display = 'none';
        updateServiceButton.style.display = 'block';
        deleteServiceButton.style.display = 'block';
        currentServiceId = serviceData._id;

        // Populate other form fields
        serviceNameInput.value = serviceData.serviceName || '';
        servicePriceInput.value = serviceData.price || '';
        serviceDurationInput.value = serviceData.duration || ''; // This will be the <select> for duration
        serviceDescriptionInput.value = serviceData.description || '';

        // Pre-select the duration dropdown value
        if (serviceDurationInput) { // Ensure it exists
            serviceDurationInput.value = serviceData.duration || '';
        }

        // STEP 2: Pre-select Business and then chain load Calendar & Category
        if (serviceData.businessId) {
            // Re-load the business dropdown, but now with a pre-selected value
            loadServiceBusinessDropdown(serviceData.businessId._id || serviceData.businessId);

            // Now, fetch and load calendars for this specific business, and pre-select
            await loadServiceCalendarDropdown(
                serviceData.businessId._id || serviceData.businessId,
                serviceData.calendarId._id || serviceData.calendarId
            );

            // Finally, fetch and load categories for this specific calendar, and pre-select
            await loadServiceCategoryDropdown(
                serviceData.calendarId._id || serviceData.calendarId,
                serviceData.categoryId._id || serviceData.categoryId
            );
        }
    } else {
        // If in "Add" mode, ensure no business is pre-selected
        if (dropdownServiceBusiness) dropdownServiceBusiness.value = '';
    }
    console.log("Service popup display set.");
}

// --- Updated 'closeAddServicePopup' Function (For resetting dropdowns) ---
function closeAddServicePopup() {
    console.log("closeServicePopup called.");
    if (addServicePopup) addServicePopup.style.display = 'none';
    if (addServicePopupOverlay) addServicePopupOverlay.style.display = 'none';
    document.body.classList.remove("popup-open");
    if (addServiceForm) {
        addServiceForm.reset();
        currentServiceId = null;
    }
    // IMPORTANT: Reset all service-related dropdowns to default state when closing
    if (dropdownServiceBusiness) dropdownServiceBusiness.value = ''; // Reset business selection
    if (dropdownServiceCalendar) {
        dropdownServiceCalendar.innerHTML = '<option value="">-- Select --</option>';
        dropdownServiceCalendar.disabled = true;
    }
    if (dropdownServiceCategory) {
        dropdownServiceCategory.innerHTML = '<option value="">-- Select --</option>';
        dropdownServiceCategory.disabled = true;
    }
    if (serviceDurationInput) serviceDurationInput.value = ''; // Also reset the duration dropdown
    console.log("Service popup closed and form reset.");
}
//Load DropDows
function loadServiceBusinessDropdown(selectedBusinessId = null) {
    console.log("Loading service business dropdown...");
    if (!dropdownServiceBusiness) {
        console.error("dropdownServiceBusiness element not found.");
        return;
    }

    dropdownServiceBusiness.innerHTML = '<option value="">-- Select --</option>'; // Always start with default
    if (businesses && businesses.length > 0) {
        businesses.forEach(business => {
            const option = document.createElement('option');
            option.value = business._id;
            // Access nested property for business name if your business model has it
            option.textContent = business.values ? business.values.businessName : business.businessName;
            dropdownServiceBusiness.appendChild(option);
        });
        dropdownServiceBusiness.disabled = false; // Enable if options are present
    } else {
        dropdownServiceBusiness.disabled = true; // Disable if no options
    }

    // Pre-select if an ID is provided (for edit mode)
    if (selectedBusinessId) {
        dropdownServiceBusiness.value = selectedBusinessId;
    }
}

// --- Function to Load the Service Calendar Dropdown ---
// Fetches calendars specifically for the selected business.
async function loadServiceCalendarDropdown(businessId, selectedCalendarId = null) {
    console.log("Loading service calendar dropdown for businessId:", businessId);
    if (!dropdownServiceCalendar) {
        console.error("dropdownServiceCalendar element not found.");
        return;
    }

    dropdownServiceCalendar.innerHTML = '<option value="">-- Select --</option>'; // Clear and reset
    dropdownServiceCalendar.disabled = true; // Disable by default

    // Also reset and disable the category dropdown since its dependency changed
    if (dropdownServiceCategory) {
        dropdownServiceCategory.innerHTML = '<option value="">-- Select --</option>';
        dropdownServiceCategory.disabled = true;
    }

    if (!businessId) {
        return; // No business selected, so no calendars to load
    }

    try {
        // Fetch only calendars associated with the provided businessId
        const res = await fetch(`/get-calendars?businessId=${businessId}`); // Backend must support this filter
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
        }
        const filteredCalendars = await res.json(); // Data specific to this business

        if (filteredCalendars && filteredCalendars.length > 0) {
            filteredCalendars.forEach(calendar => {
                const option = document.createElement('option');
                option.value = calendar._id;
                option.textContent = calendar.calendarName;
                dropdownServiceCalendar.appendChild(option);
            });
            dropdownServiceCalendar.disabled = false; // Enable if options are present
        } else {
            console.log(`No calendars found for businessId: ${businessId}`);
        }

        // Pre-select if an ID is provided (for edit mode)
        if (selectedCalendarId) {
            dropdownServiceCalendar.value = selectedCalendarId;
        }

    } catch (error) {
        console.error("Error loading service calendar dropdown:", error);
        // Optionally display user-friendly error
    }
}

// --- Function to Load the Service Category Dropdown ---
// Fetches categories specifically for the selected calendar.
async function loadServiceCategoryDropdown(calendarId, selectedCategoryId = null) {
    console.log("Loading service category dropdown for calendarId:", calendarId);
    if (!dropdownServiceCategory) {
        console.error("dropdownServiceCategory element not found.");
        return;
    }

    dropdownServiceCategory.innerHTML = '<option value="">-- Select --</option>'; // Clear and reset
    dropdownServiceCategory.disabled = true; // Disable by default

    if (!calendarId) {
        return; // No calendar selected, so no categories to load
    }

    try {
        // Fetch only categories associated with the provided calendarId
        const res = await fetch(`/get-records/Category?calendarId=${calendarId}`); // Backend must support this filter
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
        }
        const filteredCategories = await res.json(); // Data specific to this calendar

        if (filteredCategories && filteredCategories.length > 0) {
            filteredCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category._id;
                option.textContent = category.categoryName;
                dropdownServiceCategory.appendChild(option);
            });
            dropdownServiceCategory.disabled = false; // Enable if options are present
        } else {
            console.log(`No categories found for calendarId: ${calendarId}`);
        }

        // Pre-select if an ID is provided (for edit mode)
        if (selectedCategoryId) {
            dropdownServiceCategory.value = selectedCategoryId;
        }

    } catch (error) {
        console.error("Error loading service category dropdown:", error);
        // Optionally display user-friendly error
    }
}

//Save Service
async function saveService() {
    console.log("Attempting to save new service...");

    const serviceData = {
        serviceName: serviceNameInput.value.trim(),
        price: parseFloat(servicePriceInput.value),
        description: serviceDescriptionInput.value.trim(),
        duration: parseInt(serviceDurationInput.value, 10),
        imageUrl: serviceImageInput.value.trim(),
        businessId: dropdownServiceBusiness.value,
        calendarId: dropdownServiceCalendar.value,
        categoryId: dropdownServiceCategory.value
    };

    if (!serviceData.serviceName || isNaN(serviceData.price) || isNaN(serviceData.duration) ||
        !serviceData.businessId || !serviceData.calendarId || !serviceData.categoryId) {
        alert('Please fill in all required service fields: Name, Price, Duration, Business, Calendar, Category.');
        return;
    }
    if (serviceData.price < 0) {
        alert('Price cannot be negative.');
        return;
    }
    if (serviceData.duration <= 0) {
        alert('Duration must be at least 1 minute.');
        return;
    }

    try {
        const res = await fetch('/create-service', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(serviceData)
        });

        const result = await res.json();

        if (res.ok) {
            alert('✅ Service saved successfully!');
            closeAddServicePopup();
            await fetchServices();
        } else {
            console.error('Failed to save service. Server response:', result);
            alert(`Error: ${result.message || 'Failed to save service. Please try again.'}`);
        }
    } catch (error) {
        console.error('Network error during service save:', error);
        alert('An unexpected network error occurred. Please check your connection and try again.');
    }
}

async function fetchServices() {
    console.log("Fetching services from server...");
    if (!currentUserId) {
        console.warn("Not logged in. Skipping service fetch.");
        allServices = []; // Clear existing services if not logged in
        renderServices(); // Ensure UI is cleared
        return;
    }

    try {
        const res = await fetch("/get-records/Service"); // Call your new server route
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        allServices = data; // Store the fetched services in the global array
        console.log("Services fetched successfully:", allServices);
        renderServices(); // Render them to the UI after fetching
    } catch (error) {
        console.error("Error fetching services:", error);
    }
}

function renderServices() {
    console.log("Rendering services...");
    const serviceNameColumn = document.getElementById("service-name-column");
    const servicePriceColumn = document.getElementById("service-price-column");
    const serviceListContainer = document.getElementById("service-list-items-container"); // Your outer container

    // Clear existing content
    if (serviceNameColumn) serviceNameColumn.innerHTML = '';
    if (servicePriceColumn) servicePriceColumn.innerHTML = '';
    // If you plan to add the actions column later, clear that too.

    // If there's an outer container for the list items, clear it, or rebuild as needed
    // Your HTML currently has columns inside border-border, so we'll stick to that.

    if (!serviceNameColumn || !servicePriceColumn) {
        console.error("Error: One or more service display columns not found in HTML.");
        return;
    }

    if (!allServices || allServices.length === 0) {
        // Display a message if no services are found
        const noDataMessage = document.createElement('div');
        noDataMessage.classList.add('list-column-item', 'no-data-message');
        noDataMessage.style.gridColumn = 'span 2'; // Span across Name and Price columns
        noDataMessage.style.textAlign = 'center';
        noDataMessage.style.padding = '20px';
        noDataMessage.style.color = '#777';
        noDataMessage.textContent = 'No services found. Click \'Add Service\' to create your first one!';

        // Append to the parent of the columns, or adjust styling to fit
        // The current HTML has service-option-bar containing the columns.
        // Let's add it to the name column, which will likely push it visually.
        // A better approach would be to have a single "list-container" div.
        serviceNameColumn.innerHTML = ''; // Clear for message
        servicePriceColumn.innerHTML = ''; // Clear for message

        const serviceOptionBar = document.querySelector(".service-option-bar");
        if (serviceOptionBar) {
             // Clear existing content in the whole row container before appending message
            serviceOptionBar.innerHTML = '';
            serviceOptionBar.appendChild(noDataMessage);
        } else {
            // Fallback if service-option-bar isn't found
            serviceNameColumn.appendChild(noDataMessage);
        }

        console.log("No services to render.");
        return;
    }

    // Populate the columns with service data
    allServices.forEach(service => {
        // Service Name Column
        const nameItem = document.createElement('div');
        nameItem.classList.add('list-column-item', 'service-item'); // Add 'service-item' for styling
        nameItem.textContent = service.serviceName || 'Unnamed Service';
        nameItem.dataset.serviceId = service._id; // Store the ID for edit/delete
        nameItem.classList.add('clickable-item'); // Make it clickable for editing

        // Add event listener to open in edit mode (you'll implement openEditServicePopup later)
        nameItem.addEventListener('click', () => openEditServicePopup(service._id));

        serviceNameColumn.appendChild(nameItem);

        // Service Price Column
        const priceItem = document.createElement('div');
        priceItem.classList.add('list-column-item', 'service-item');
        // Format price as currency if needed, e.g., using toLocaleString
        priceItem.textContent = `$${service.price ? service.price.toFixed(2) : '0.00'}`;
        servicePriceColumn.appendChild(priceItem);

        // You'll likely need an "Actions" column or similar for edit/delete buttons
        // For now, the clickable name handles edit.
    });
    console.log("Services rendered successfully.");
}



// --- Attach Event Listeners to Dynamically Created Edit Buttons ---
function attachServiceEditListeners() {
    // Correctly query within the serviceListContainer (which is now the section itself)
    // for all buttons that are descendants of a '.service-item' (your rows)
    const editButtons = serviceListContainer.querySelectorAll('.service-item .edit-service-button'); 
    
    editButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const serviceId = event.target.dataset.id;
            const serviceToEdit = allServices.find(s => s._id === serviceId);
            if (serviceToEdit) {
                openServicePopup(serviceToEdit); // Open popup in edit mode
            } else {
                console.error('Service not found for editing:', serviceId);
            }
        });
    });
    console.log("Service edit listeners attached.");
}


// --- Control Service Section Visibility ---
// You will need a function that determines when to show the service section.
// This might be tied to a navigation click, or after successful login.
// Example (adjust as per your app's navigation logic):
function showServiceSection() {
    if (serviceSection) {
        serviceSection.style.display = 'block'; // Or 'flex', 'grid' depending on your CSS layout
        console.log("Service section shown.");
    }
    // Also hide other sections if you have them
    // E.g., hideBusinessSection(); hideCalendarSection();
}

// function hideServiceSection() {
//     if (serviceSection) {
//         serviceSection.style.display = 'none';
//         console.log("Service section hidden.");
//     }
// }

async function loadServiceList() {
    console.log("🔄 loadServiceList() called");

    // Make sure the main service section is visible (as we did in the previous step)
    const serviceSection = document.getElementById("service-section");
    if (serviceSection) {
        serviceSection.style.display = "block"; // Or "flex", "grid", etc., depending on your CSS
    } else {
        console.error("Service section container not found.");
    }

    // Get references to the specific column containers by their IDs
    const nameCol = document.getElementById("service-name-column");
    const priceCol = document.getElementById("service-price-column");
    // *** REMOVE THIS LINE IF IT EXISTS IN YOUR CODE: ***
    // const actionsCol = document.getElementById("service-actions-column"); 

    // *** CHANGE THIS 'if' CONDITION: ***
    // It should now only check for the columns you actually have.
    if (!nameCol || !priceCol) {
        console.error("Service name or price column containers not found. Cannot render services.");
        return;
    }

    // Clear previous content in the columns
    nameCol.innerHTML = '';
    priceCol.innerHTML = '';
    // *** REMOVE THIS LINE IF IT EXISTS IN YOUR CODE: ***
    // actionsCol.innerHTML = ''; 

    try {
        const res = await fetch('/get-records/Service');
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
        }
        const services = await res.json();
        console.log("Services fetched:", services);

        if (services.length === 0) {
            nameCol.innerHTML = '<p class="no-records">No services added yet.</p>';
            priceCol.innerHTML = ''; // Keep consistent
            return;
        }

        // Loop through services and populate the columns
        services.forEach(service => {
    // Service Name
    const serviceNameDiv = document.createElement('div');
    serviceNameDiv.classList.add('service-item');
    serviceNameDiv.textContent = service.serviceName;
    serviceNameDiv.dataset.serviceId = service._id;

    // 🔥 Add this line to make the name clickable for editing
    serviceNameDiv.addEventListener("click", () => openEditServicePopup(service._id));

    nameCol.appendChild(serviceNameDiv);

    // Service Price
    const servicePriceDiv = document.createElement('div');
    servicePriceDiv.classList.add('service-item');
    servicePriceDiv.textContent = `$${service.price.toFixed(2)}`;
    priceCol.appendChild(servicePriceDiv);

            // IMPORTANT: If you had code here that created "Edit" or "Delete" buttons
            // and then appended them to `actionsCol`, that code will now need to be
            // either removed, or re-positioned if you want those buttons to appear
            // elsewhere (e.g., directly next to the name/price).
            // Since you explicitly said you don't want an "actions column,"
            // I'm assuming you don't want these buttons for now, or will place them differently.
            // If you still want the actions, but not in a separate column, we'll need another step for that.
        });

    } catch (error) {
        console.error('Error loading services:', error);
        nameCol.innerHTML = '<p class="error-message">Error loading services. Please try again.</p>';
        priceCol.innerHTML = '';
              
    }
}
//open Add service in edit mode
async function openEditServicePopup(serviceId) {
    currentServiceId = serviceId; // Set the global ID for update/delete operations

    try {
        const res = await fetch(`/get-records/Service/${serviceId}`);
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
        }
        const service = await res.json();
        console.log("Service data fetched for editing:", service);

        // THIS IS THE ONLY LINE YOU NEED TO ADD/REPLACE THE DELETED SECTION WITH:
        await openServicePopup(service); // This will handle showing the popup and populating it for editing.

    } catch (error) {
        console.error("Failed to load service for editing:", error);
        alert("Error loading service details: " + error.message);
        // Optionally close popup or keep it open with error message
        closeAddServicePopup(); // Close if unable to load details
    }
}
//
async function fetchCategoriesForDropdown(businessId = null, calendarId = null) {
    let url = '/get-records/Category?';
    const params = new URLSearchParams();
    if (businessId) params.append('businessId', businessId);
    if (calendarId) params.append('calendarId', calendarId);
    
    url += params.toString();

    try {
        const res = await fetch(url);
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        return data;
    } catch (error) {
        console.error("Error fetching categories for dropdown:", error);
        return [];
    }
}

// And a new populate function (outside DOMContentLoaded):
/**
 * Populates a given dropdown element with category options.
 * @param {HTMLSelectElement} dropdownElement The select element to populate.
 * @param {Array<Object>} categoriesData Array of category objects.
 */
function populateCategoryDropdown(dropdownElement, categoriesData) {
    dropdownElement.innerHTML = '<option value="">-- Select --</option>';
    if (!categoriesData || categoriesData.length === 0) {
        dropdownElement.disabled = true;
        return;
    }

    categoriesData.forEach(category => {
        const option = document.createElement('option');
        option.value = category._id;
        option.textContent = category.categoryName;
        dropdownElement.appendChild(option);
    });
    dropdownElement.disabled = false;
}

//Update Service 
async function handleUpdateService() {
    const serviceId = currentServiceId; // This global variable holds the ID of the service being edited

    if (!serviceId) {
        alert("No service selected for update. Please select a service to edit first.");
        console.error("Error: currentServiceId is null when attempting to update service.");
        return;
    }

    // 1. Collect updated data from the form fields
    const updatedData = {
        serviceName: serviceNameInput.value,
        // Ensure price is converted to a number (float or integer based on your needs)
        price: parseFloat(servicePriceInput.value),
        description: serviceDescriptionInput.value,
        duration: serviceDurationInput.value, // This is likely from a dropdown or input

        // Get IDs from the selected dropdown options
        businessId: dropdownServiceBusiness.value,
        calendarId: dropdownServiceCalendar.value,
        categoryId: dropdownServiceCategory.value,

        // If you have an image URL input, uncomment this:
        // imageUrl: serviceImageUrlInput.value,

        // If you handle file uploads for images, you'll need a different approach
        // and likely use FormData, which is more complex. For now, we assume URL or no change.
    };

    // Basic client-side validation (recommended)
    if (!updatedData.serviceName || isNaN(updatedData.price) || updatedData.price <= 0 || !updatedData.duration || !updatedData.businessId || !updatedData.calendarId || !updatedData.categoryId) {
        alert("Please fill in all required service fields correctly (Name, Price > 0, Duration, Business, Calendar, Category).");
        return;
    }

    console.log("Attempting to update service with ID:", serviceId, "Data:", updatedData);

    try {
        const res = await fetch(`/update-record/Service/${serviceId}`, {
            method: 'PUT', // Use the PUT method for updates
            headers: {
                'Content-Type': 'application/json', // Tell the server we're sending JSON
            },
            body: JSON.stringify(updatedData), // Send the data as a JSON string
        });

        if (!res.ok) {
            // If the response is not OK (e.g., 400, 401, 500), parse the error
            const errorData = await res.json();
            throw new Error(errorData.message || `HTTP error! Status: ${res.status}`);
        }

        const result = await res.json();
        console.log("Service updated successfully:", result);
        alert("Service updated successfully!");

        // 2. Close the popup and refresh the service list
        closeAddServicePopup(); // Use your existing close function
        loadServiceList();       // Refresh the list to show the updated data

    } catch (error) {
        console.error("Failed to update service:", error);
        alert("Error updating service: " + error.message);
    }
}

//Delete Service 
async function handleDeleteService() {
    const serviceId = currentServiceId; // Get the ID from the global variable set when editing

    if (!serviceId) {
        alert("No service selected for deletion.");
        console.error("Error: currentServiceId is null when attempting to delete service.");
        return;
    }

    // 1. Ask for user confirmation before proceeding
    const confirmDeletion = confirm("Are you absolutely sure you want to delete this service? This action cannot be undone.");

    if (!confirmDeletion) {
        console.log("Service deletion cancelled by user.");
        return; // User clicked "Cancel"
    }

    console.log("Attempting to delete service with ID:", serviceId);

    try {
        const res = await fetch(`/delete-record/Service/${serviceId}`, {
            method: 'DELETE', // Use the DELETE HTTP method
            headers: {
                'Content-Type': 'application/json', // Good practice, though not strictly needed for simple DELETE
            },
            // No body is typically needed for a DELETE request by ID
        });

        if (!res.ok) {
            // If the response is not OK, parse the error message from the server
            const errorData = await res.json();
            throw new Error(errorData.message || `HTTP error! Status: ${res.status}`);
        }

        const result = await res.json();
        console.log("Service deleted successfully:", result);
        alert("Service deleted successfully!");

        // 2. Close the popup and refresh the service list
        closeAddServicePopup(); // Use your existing popup closing function
        loadServiceList();       // Refresh the list to show changes (the item should now be gone)

    } catch (error) {
        console.error("Failed to delete service:", error);
        alert("Error deleting service: " + error.message);
    }
}