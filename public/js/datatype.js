document.addEventListener("DOMContentLoaded", function () {
  // Existing form elements
  const dataTypeForm = document.getElementById("new-data-type-form");
  const dataTypeInput = document.getElementById("new-data-type");
  const dataTypeList = document.getElementById("dataTypeList");
  const fieldForm = document.getElementById("field-form");
  const fieldInput = document.getElementById("new-field");
  const fieldTypeSelect = document.getElementById("field-type");
  const fieldList = document.getElementById("field-list");
  const typeNameDisplay = document.getElementById("type-name");
  const allowMultipleCheckbox = document.getElementById("allow-multiple");

  let selectedDataType = null;

  // Fetch data types on load
  async function fetchDataTypes() {
    try {
      const res = await fetch('/get-datatypes');  // API to fetch data types
      const dataTypes = await res.json();  // Parse the response to JSON

      // Clear any existing data
      dataTypeList.innerHTML = '';

      // Loop through and add data types to the list
      dataTypes.forEach(dataType => {
        const li = document.createElement('li');
        li.textContent = dataType.name;  // Assuming each data type has a 'name' property
        li.classList.add("datatype-item");

             // Add a delete button to each list item
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('delete-datatype-btn');
        deleteBtn.addEventListener('click', async () => {
          const confirmDelete = confirm(`Are you sure you want to delete ${dataType.name}?`);
          if (confirmDelete) {
            await deleteDataType(dataType._id); // Delete the data type
          }
        });

        // Append delete button to the list item
        li.appendChild(deleteBtn);

        // Event listener for selecting a data type
        li.addEventListener("click", () => {
          document.querySelectorAll("#dataTypeList li").forEach(item => item.classList.remove("active"));
          li.classList.add("active");
          selectDataType(dataType);
        });

        dataTypeList.appendChild(li);
      });
    } catch (error) {
      console.error('Error fetching data types:', error);
    }
  }

  // Call the function to fetch data types when the page loads
  fetchDataTypes();


// Function to delete a data type
async function deleteDataType(dataTypeId) {
  try {
    const res = await fetch(`/delete-datatype/${dataTypeId}`, {
      method: 'DELETE',
    });

    const result = await res.json();

    if (res.ok) {
      alert(result.message);
      fetchDataTypes();  // Refresh the data type list after deletion
    } else {
      alert(result.message || 'Failed to delete data type.');
    }
  } catch (error) {
    console.error('Error deleting data type:', error);
    alert('Error deleting data type.');
  }
}


  // Select a data type and show its fields
  function selectDataType(dataType) {
    selectedDataType = dataType;
    typeNameDisplay.textContent = dataType.name;
    renderFields(dataType.fields || []);
    showTab("tab2");
  }

  // Render fields for the selected data type
  function renderFields(fields) {
    fieldList.innerHTML = "";
    fields.forEach(field => {
      const li = document.createElement("li");

      let typeLabel = field.type;
      if (field.type === "Reference" && field.reference) {
        typeLabel = `Reference to ${field.reference}`;
      }
      if (field.multiple) {
        typeLabel = `List of ${typeLabel}`;
      }

      li.innerHTML = `
        ${field.name} (${typeLabel})
        <button class="delete-field-btn" data-id="${field._id}">❌</button>
      `;
      fieldList.appendChild(li);
    });

    document.querySelectorAll(".delete-field-btn").forEach(button => {
      button.addEventListener("click", async function () {
        const fieldId = this.dataset.id;
        const confirmDelete = confirm("Delete this field?");
        if (!confirmDelete || !selectedDataType) return;

        const res = await fetch(`/delete-field/${selectedDataType._id}/${fieldId}`, { method: "DELETE" });
        const result = await res.json();

        if (res.ok) {
          renderFields(result.fields || []);
        } else {
          alert(result.message || "Failed to delete field.");
        }
      });
    });
  }

  // Add a new field to the selected data type
  fieldForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!selectedDataType) return alert("Select a data type first.");

    const name = fieldInput.value.trim();
    const rawType = fieldTypeSelect.value;
    if (!name || !rawType) return alert("Enter field name and select type.");

    let fieldType = rawType;
    let reference = null;

    if (rawType.startsWith("Reference:")) {
      fieldType = "Reference";
      reference = rawType.split(":")[1];
    }

    const res = await fetch(`/add-field/${selectedDataType._id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fieldName: name,
        fieldType,
        reference,
        allowMultiple: allowMultipleCheckbox.checked
      }),
    });

    if (res.ok) {
      fieldInput.value = "";
      fieldTypeSelect.value = "";
      allowMultipleCheckbox.checked = false;

      const updatedRes = await fetch(`/get-datatype/${selectedDataType._id}`);
      const updatedType = await updatedRes.json();
      selectedDataType = updatedType;
      renderFields(updatedType.fields || []);
    } else {
      const result = await res.json();
      alert(result.message || "Failed to add field.");
    }
  });

  // Function to show specific tabs
  function showTab(tabId) {
    tabs.forEach(t => t.classList.remove("active"));
    contents.forEach(c => c.classList.remove("active"));

    document.getElementById(tabId).classList.add("active");
    document.getElementById("content" + tabId.charAt(tabId.length - 1)).classList.add("active");
  }

 




  // ✅ Tab Switching
  const tabs = document.querySelectorAll(".tab");
  const contents = document.querySelectorAll(".content");

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));

      tab.classList.add("active");
      contents[index].classList.add("active");

      if (tab.dataset.tab === "3") {
        fetchUsers(); // ✅ Load users on tab 3
      }
    });
  });

  // ✅ Define fetchDataTypes BEFORE calling it
 // ✅ Define fetchDataTypes BEFORE calling it
async function fetchDataTypes() {
  const res = await fetch("/get-datatypes"); // Fetch all data types
  const dataTypes = await res.json();

  dataTypeList.innerHTML = "";  // Clear any existing data types

  dataTypes.sort((a, b) => a.name.localeCompare(b.name));  // Sort data types alphabetically

  dataTypes.forEach(type => {
    const li = document.createElement("li");
    li.textContent = type.name;

    // Set click event to activate and select a data type
    li.addEventListener("click", () => {
      document.querySelectorAll("#dataTypeList li").forEach(item => item.classList.remove("active"));
      li.classList.add("active");
      selectDataType(type);
    });

    dataTypeList.appendChild(li);
  });

  // Populate reference options based on available data types
  populateReferenceOptions(dataTypes);
}



  function populateReferenceOptions(dataTypes) {
    const referenceGroup = document.getElementById("reference-options");
    referenceGroup.innerHTML = "";

  dataTypes.forEach(type => {
   
    if (type.name) {
      const option = document.createElement("option");
      option.value = `Reference:${type._id}`;
      option.textContent = type.name;
      referenceGroup.appendChild(option);
    }

   
});

  }

  // ✅ Call it now (after definition)
  fetchDataTypes();

  

  // ✅ Submit new data type
dataTypeForm.addEventListener("submit", async function (e) {
  e.preventDefault();  // Prevent page reload

  const name = dataTypeInput.value.trim();
  if (!name) return alert("Please enter a data type name.");

  const res = await fetch("/save-datatype", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),  // Send the name of the new data type
  });

  if (res.ok) {
    dataTypeInput.value = "";  // Clear the input field
    fetchDataTypes();  // Refresh the list of data types
  } else {
    alert("Failed to save data type.");
  }
});


function selectDataType(type) {
  selectedDataType = type;
  typeNameDisplay.textContent = type.name;
  renderFields(type.fields || []); // Ensure fields are rendered for selected data type
  showTab("tab2");  // Show the Fields tab for the selected data type
}

  function renderFields(fields) {
    fieldList.innerHTML = "";
    fields.forEach(field => {
      const li = document.createElement("li");

      let typeLabel = field.type;
      if (field.type === "Reference" && field.reference) {
        typeLabel = `Reference to ${field.reference}`;
      }
      if (field.multiple) {
        typeLabel = `List of ${typeLabel}`;
      }

      li.innerHTML = `
        ${field.name} (${typeLabel})
        <button class="delete-field-btn" data-id="${field._id}">❌</button>
      `;
      fieldList.appendChild(li);
    });

    document.querySelectorAll(".delete-field-btn").forEach(button => {
      button.addEventListener("click", async function () {
        const fieldId = this.dataset.id;
        const confirmDelete = confirm("Delete this field?");
        if (!confirmDelete || !selectedDataType) return;

        const res = await fetch(`/delete-field/${selectedDataType._id}/${fieldId}`, { method: "DELETE" });
        const result = await res.json();

        if (res.ok) {
          renderFields(result.fields || []);
        } else {
          alert(result.message || "Failed to delete field.");
        }
      });
    });
  }

  fieldForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  if (!selectedDataType) return alert("Select a data type first.");

  const name = fieldInput.value.trim();
  const rawType = fieldTypeSelect.value;
  if (!name || !rawType) return alert("Enter field name and select type.");

  let fieldType = rawType;
  let reference = null;

  if (rawType.startsWith("Reference:")) {
    fieldType = "Reference";
    reference = rawType.split(":")[1];  // Handle references to other data types
  }

  const res = await fetch(`/add-field/${selectedDataType._id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fieldName: name,
      fieldType,
      reference,
      allowMultiple: allowMultipleCheckbox.checked
    }),
  });

  if (res.ok) {
    fieldInput.value = "";
    fieldTypeSelect.value = "";
    allowMultipleCheckbox.checked = false;

    const updatedRes = await fetch(`/get-datatype/${selectedDataType._id}`);
    const updatedType = await updatedRes.json();
    selectedDataType = updatedType;
    renderFields(selectedDataType.fields || []);
  } else {
    const result = await res.json();
    alert(result.message || "Failed to add field.");
  }
});


  function showTab(tabId) {
    tabs.forEach(t => t.classList.remove("active"));
    contents.forEach(c => c.classList.remove("active"));

    document.getElementById(tabId).classList.add("active");
    document.getElementById("content" + tabId.charAt(tabId.length - 1)).classList.add("active");
  }

  // ✅ Combined user + business table rendering
  async function fetchUsers() {
    const [userRes, businessRes] = await Promise.all([
      fetch("/get-users"),
      fetch("/get-records/Business")
    ]);

    const users = await userRes.json();
    const businesses = await businessRes.json();

    const tbody = document.querySelector("#userTable tbody");
    tbody.innerHTML = "";

    users.forEach(user => {
      const userBusinesses = businesses.filter(b => String(b.createdBy) === String(user._id));

      const dropdownHTML = `
        <select>
          <option value="">-- Select Business --</option>
          ${userBusinesses.map(biz => `
            <option value="${biz._id}">${biz.values?.businessName || "(No Name)"}</option>
          `).join("")}
        </select>
      `;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${user.firstname || ""}</td>
        <td>${user.lastname || ""}</td>
        <td>${user.email}</td>
        <td>${user.role}</td>
        <td>${dropdownHTML}</td>
        <td><button class="delete-user-btn" data-id="${user._id}">❌</button></td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll(".delete-user-btn").forEach(button => {
      button.addEventListener("click", async function () {
        const userId = this.dataset.id;
        const confirmDelete = confirm("Are you sure you want to delete this user?");
        if (!confirmDelete) return;

        const res = await fetch(`/delete-user/${userId}`, {
          method: "DELETE"
        });

        const result = await res.json();
        if (res.ok) {
          fetchUsers();
        } else {
          alert(result.message || "Failed to delete user.");
        }
      });
    });
  }

function renderFormFromFields(fields) {
  const formContainer = document.getElementById("dynamic-form-container");
  formContainer.innerHTML = ""; // Clear old content

  fields.forEach(field => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("form-group");

    const label = document.createElement("label");
    label.textContent = field.name;
    wrapper.appendChild(label);

    let input;

    if (field.type === "Boolean") {
      input = document.createElement("select");

      const yesOption = document.createElement("option");
      yesOption.value = "true";
      yesOption.textContent = "Yes";

      const noOption = document.createElement("option");
      noOption.value = "false";
      noOption.textContent = "No";

      input.appendChild(yesOption);
      input.appendChild(noOption);
    } else {
      input = document.createElement("input");
      input.type = "text";
    }

    input.name = field.name;
    wrapper.appendChild(input);
    formContainer.appendChild(wrapper);
  });
}






});
