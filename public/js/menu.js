document.addEventListener("DOMContentLoaded", async () => {
  const loginStatus = document.getElementById("login-status-text");
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

  // Check if the user is logged in
  async function checkLogin() {
    try {
      const res = await fetch("/check-login");
      const result = await res.json();

      if (result.loggedIn) {
        currentUserId = result.userId;
      }
    } catch (err) {
      console.error("Login check failed:", err);
    }
  }

  await checkLogin();

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

  // ✅ Profile Section: Show/Hide Logic
  const openBtn = document.getElementById("open-profile-settings");
  const profileSection = document.querySelector(".update-profile");
  const menuGrid = document.querySelector(".menu-grid");
  const backBtn = document.getElementById("back-to-menu");

  if (openBtn && profileSection && menuGrid) {
    openBtn.addEventListener("click", () => {
      profileSection.style.display = "block";
      menuGrid.style.display = "none";
    });
  }

  if (backBtn && profileSection && menuGrid) {
    backBtn.addEventListener("click", () => {
      profileSection.style.display = "none";
      menuGrid.style.display = "flex";
    });
  }
});
document.addEventListener("DOMContentLoaded", async () => {
  const loginStatus = document.getElementById("login-status-text");
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

  // Check if the user is logged in
  async function checkLogin() {
    try {
      const res = await fetch("/check-login");
      const result = await res.json();

      if (result.loggedIn) {
        currentUserId = result.userId;
      }
    } catch (err) {
      console.error("Login check failed:", err);
    }
  }

  await checkLogin();

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



  // ✅ Profile Section: Show/Hide Logic
  const openBtn = document.getElementById("open-profile-settings");
  const profileSection = document.querySelector(".update-profile");
  const menuGrid = document.querySelector(".menu-grid");
  const backBtn = document.getElementById("back-to-menu");

  if (openBtn && profileSection && menuGrid) {
const noImageTextEl = document.getElementById("no-profile-image-text");

openBtn.addEventListener("click", async () => {
  try {
    const res = await fetch("/check-login");
    const data = await res.json();

    if (data.loggedIn) {
      document.getElementById("pro-first-name").value = data.firstName || "";
      document.getElementById("pro-last-name").value = data.lastName || "";
      document.getElementById("pro-signup-email").value = data.email || "";
      document.getElementById("update-phone-number").value = data.phone || "";

      const profileImgEl = document.getElementById("current-profile-image");
      const noImageTextEl = document.getElementById("no-profile-image-text");
if (data.profilePhoto) {
        profileImgEl.src = data.profilePhoto;
        profileImgEl.style.display = "block";
        noImageTextEl.style.display = "none";
      } else {
        profileImgEl.src = "/uploads/default-avatar.png";
        profileImgEl.style.display = "block";
        noImageTextEl.style.display = "none";
      }

      profileSection.style.display = "block";
      menuGrid.style.display = "none";
    } else {
      alert("Please log in first.");
    }
  } catch (err) {
    console.error("Error loading profile:", err);
    alert("Something went wrong while loading your profile.");
  }
});


  }

  if (backBtn && profileSection && menuGrid) {
    backBtn.addEventListener("click", () => {
      profileSection.style.display = "none";
      menuGrid.style.display = "flex";
    });
  }

// 📝 Handle profile update
document.getElementById("user-profile-image").addEventListener("change", function () {
  const file = this.files[0];
  const preview = document.getElementById("current-profile-image");
  const noImageText = document.getElementById("no-profile-image-text");

  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      preview.src = e.target.result;
      preview.style.display = "block";
      noImageText.style.display = "none";
    };
    reader.readAsDataURL(file);
  } else {
    preview.src = "/uploads/default-avatar.png"; // ← reset to default avatar
    preview.style.display = "block";
    noImageText.style.display = "none";
  }
});


//
const updateProfileForm = document.getElementById("update-profile-form");

if (updateProfileForm) {
updateProfileForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(updateProfileForm); // Collects all fields including image

try {
  const res = await fetch("/update-user-profile", {
    method: "PUT",
    body: formData,
  });

  const contentType = res.headers.get("content-type");
  const result = contentType.includes("application/json") 
    ? await res.json() 
    : await res.text(); // fallback for HTML error

  if (res.ok) {
    alert("✅ Profile updated!");
  } else {
    alert(result.message || "Something went wrong.");
    console.error("❌ Server response:", result);
  }
} catch (err) {
  console.error("Update error:", err);
  alert("An error occurred while updating.");
}

});

}




});
