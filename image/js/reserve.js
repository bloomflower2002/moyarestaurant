/* ===== Header scroll effect ===== */
window.addEventListener("scroll", () => {
  const header = document.querySelector("header");
  if (!header) return;
  if (window.scrollY > 50) header.classList.add("scrolled");
  else header.classList.remove("scrolled");
});

/* ===== Login check ===== */
document.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = localStorage.getItem("loggedIn");

  if (isLoggedIn === "true") {
    // Show reservation form
    const reservationSection = document.getElementById("reservation-section");
    if (reservationSection) {
      reservationSection.style.display = "block";
    }
  } else {
    // Redirect to signin.html
    window.location.href = "signin.html";
  }
});