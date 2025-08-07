document.addEventListener("DOMContentLoaded", () => {
  const clientToggle = document.getElementById("clientToggle");
  const proToggle = document.getElementById("proToggle");
  const clientSection = document.getElementById("clientSection");
  const proSection = document.getElementById("proSection");

  // ✅ Set default state: show client, hide pro
  clientSection.style.display = "block";
  proSection.style.display = "none";
  clientToggle.classList.add("active");
  proToggle.classList.remove("active");

  // Toggle to Client
  clientToggle.addEventListener("click", () => {
    clientSection.style.display = "block";
    proSection.style.display = "none";
    clientToggle.classList.add("active");
    proToggle.classList.remove("active");
  });

  // Toggle to Pro
  proToggle.addEventListener("click", () => {
    proSection.style.display = "block";
    clientSection.style.display = "none";
    proToggle.classList.add("active");
    clientToggle.classList.remove("active");
  });

  // 🔄 Pro form toggle
  document.getElementById("showProLogin").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("proSignUpCard").style.display = "none";
    document.getElementById("proLoginCard").style.display = "block";
  });

  document.getElementById("showProSignup").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("proLoginCard").style.display = "none";
    document.getElementById("proSignUpCard").style.display = "block";
  });

  // 🔄 Client form toggle
  document.getElementById("showClientLogin").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("clientSignUpCard").style.display = "none";
    document.getElementById("clientLoginCard").style.display = "block";
  });

  document.getElementById("showClientSignup").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("clientLoginCard").style.display = "none";
    document.getElementById("clientSignUpCard").style.display = "block";
  });
});


//Show Pro Log in or sign up 
  // 🔄 Toggle Pro Sign Up / Log In forms
  const proSignUpCard = document.getElementById("proSignUpCard");
  const proLoginCard = document.getElementById("proLoginCard");

  document.getElementById("showProLogin").addEventListener("click", (e) => {
    e.preventDefault();
    proSignUpCard.style.display = "none";
    proLoginCard.style.display = "block";
  });

  document.getElementById("showProSignup").addEventListener("click", (e) => {
    e.preventDefault();
    proLoginCard.style.display = "none";
    proSignUpCard.style.display = "block";
  });

 // 👤 Client Toggle Logic
const clientSignUpCard = document.getElementById("clientSignUpCard");
const clientLoginCard = document.getElementById("clientLoginCard");

document.getElementById("showClientLogin").addEventListener("click", (e) => {
  e.preventDefault();
  clientSignUpCard.style.display = "none";
  clientLoginCard.style.display = "block";
});

document.getElementById("showClientSignup").addEventListener("click", (e) => {
  e.preventDefault();
  clientLoginCard.style.display = "none";
  clientSignUpCard.style.display = "block";
});
 


// === PRO SIGN UP ===
document.getElementById('proSignUpForm')?.addEventListener('submit', async function (e) {
  e.preventDefault();

  const payload = {
    email: document.getElementById('pro-signup-email').value,
    password: document.getElementById('pro-signup-password').value,
    firstName: document.getElementById('pro-first-name').value,
    lastName: document.getElementById('pro-last-name').value,
    phone: document.getElementById('signup-phone-number').value,
    role: 'business'
  };

  const res = await fetch('/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (res.ok) {
    window.location.href = data.redirect;
  } else {
    alert(data.message);
  }
});


// === PRO LOG IN (New Page IDs) ===
document.getElementById('proLoginForm')?.addEventListener('submit', async function (e) {
  e.preventDefault();

  const payload = {
    email: document.getElementById('pro-log-in-email').value,
    password: document.getElementById('pro-log-in-password').value,
  };

  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (res.ok) {
    window.location.href = data.redirect;
  } else {
    alert(data.message);
  }
});

// === CLIENT SIGN UP ===
document.getElementById('clientSignUpForm')?.addEventListener('submit', async function (e) {
  e.preventDefault();

  const password = document.getElementById('client-signup-password').value;
  const confirmPassword = document.getElementById('client-signup-reenter-password').value;

  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  const payload = {
    email: document.getElementById('client-signup-email').value,
    password: password,
    firstName: document.getElementById('client-first-name').value,
    lastName: document.getElementById('client-last-name').value,
    phone: document.getElementById('client-signup-phone-number').value,
    role: 'client'
  };

  const res = await fetch('/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (res.ok) {
    window.location.href = data.redirect;
  } else {
    alert(data.message);
  }
});

// === CLIENT LOG IN ===
document.getElementById('clientLoginForm')?.addEventListener('submit', async function (e) {
  e.preventDefault();

  const payload = {
    email: document.getElementById('client-log-in-email').value,
    password: document.getElementById('client-log-in-password').value,
  };

  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (res.ok) {
    window.location.href = data.redirect;
  } else {
    alert(data.message);
  }
});

//Show Password
document.getElementById("toggleClientSignupPassword")?.addEventListener("click", function () {
  const passwordInput = document.getElementById("client-signup-password");
  const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
  passwordInput.setAttribute("type", type);
});
document.getElementById("toggleClientPassword")?.addEventListener("click", function () {
  const passwordInput = document.getElementById("client-log-in-password");
  const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
  passwordInput.setAttribute("type", type);
});
const eyeIcon = document.getElementById("toggleClientPassword");
eyeIcon?.addEventListener("click", function () {
  const input = document.getElementById("client-log-in-password");
  const isHidden = input.type === "password";
  input.type = isHidden ? "text" : "password";
  eyeIcon.textContent = isHidden ? "🙈" : "👁️";
});

//SHow Password for Pro 
document.getElementById("toggleProSignupPassword")?.addEventListener("click", function () {
  const passwordInput = document.getElementById("pro-signup-password");
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";
  this.textContent = isHidden ? "🙈" : "👁️";
});
document.getElementById("toggleProPassword")?.addEventListener("click", function () {
  const passwordInput = document.getElementById("pro-log-in-password");
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";
  this.textContent = isHidden ? "🙈" : "👁️";
});

//Forgot Password
