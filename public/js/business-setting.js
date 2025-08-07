
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

  


});