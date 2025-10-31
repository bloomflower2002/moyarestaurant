document.addEventListener("DOMContentLoaded", () => {
  const nameEl   = document.getElementById("user-name");
  const emailEl  = document.getElementById("user-email");
  const avatarEl = document.getElementById("avatar-img");

  // Load stored data if any
  nameEl.textContent  = localStorage.getItem("userName")  || "Guest User";
  emailEl.textContent = localStorage.getItem("userEmail") || "guest@example.com";
  const savedAvatar   = localStorage.getItem("userAvatar");
  if (savedAvatar) avatarEl.src = savedAvatar;

  // --- Toggle Forms ---
  document.getElementById("show-edit-form").addEventListener("click", () => {
    document.getElementById("edit-form").classList.toggle("hidden");
  });

  document.getElementById("show-avatar-form").addEventListener("click", () => {
    document.getElementById("avatar-form").classList.toggle("hidden");
  });

  // --- Save New Name/Email ---
  document.getElementById("save-details").addEventListener("click", () => {
    const newName  = document.getElementById("edit-name").value.trim();
    const newEmail = document.getElementById("edit-email").value.trim();

    if (newName)  { nameEl.textContent  = newName;  localStorage.setItem("userName", newName); }
    if (newEmail) { emailEl.textContent = newEmail; localStorage.setItem("userEmail", newEmail); }

    document.getElementById("edit-form").classList.add("hidden");
  });

  // --- Save New Avatar ---
  document.getElementById("save-avatar").addEventListener("click", () => {
    const fileInput = document.getElementById("avatar-file");
    if (fileInput.files && fileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = e => {
        avatarEl.src = e.target.result;
        localStorage.setItem("userAvatar", e.target.result);
      };
      reader.readAsDataURL(fileInput.files[0]);
    }
    document.getElementById("avatar-form").classList.add("hidden");
  });

  // --- Logout ---
  document.querySelector(".logout-btn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "signin.html";
  });
});
document.addEventListener("DOMContentLoaded", () => {
  // redirect to sign-in if not logged in
  if (localStorage.getItem("loggedIn") !== "true") {
    window.location.href = "signin.html";
    return;
  }

  // populate user info
  document.getElementById("user-name").textContent  =
      localStorage.getItem("userName")  || "Guest User";
  document.getElementById("user-email").textContent =
      localStorage.getItem("userEmail") || "guest@example.com";

  // logout button clears data
  document.querySelector(".logout-btn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "signin.html";
  });
});

