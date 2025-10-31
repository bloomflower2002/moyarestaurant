/* ===== Header scroll effect ===== */
window.addEventListener("scroll", () => {
  const header = document.querySelector("header");
  if (!header) return;
  if (window.scrollY > 50) header.classList.add("scrolled");
  else header.classList.remove("scrolled");
});

// js/reserve.js
document.querySelector('.reservation-form').addEventListener('submit', function(e) {
  e.preventDefault(); // stop the form from submitting

  // redirect to signin.html
  window.location.href = 'signin.html';
});
