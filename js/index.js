// Authentication functions for homepage (static version)
function checkAuth() {
    const user = localStorage.getItem('user');
    
    console.log('🔐 Auth check - User:', user);
    
    if (user) {
        const userData = JSON.parse(user);
        console.log('✅ User is logged in:', userData.email);
        
        // Update UI to show logged in state
        updateUIForLoggedInUser(userData);
        return true;
    } else {
        console.log('❌ No user logged in');
        updateUIForLoggedOutUser();
        return false;
    }
}

function updateUIForLoggedInUser(user) {
    // Hide sign-in section
    const signinSection = document.querySelector('.signin');
    if (signinSection) {
        signinSection.style.display = 'none';
    }
    
    // Show profile section
    const profileSection = document.getElementById('profile-section');
    if (profileSection) {
        profileSection.style.display = 'block';
    }
    
    // Update user info in dropdown
    const userAvatar = document.getElementById('user-avatar-circle');
    const dropdownUsername = document.querySelector('.dropdown-username');
    const dropdownWelcome = document.querySelector('.dropdown-welcome');
    
    if (userAvatar) {
        userAvatar.textContent = user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();
    }
    
    if (dropdownUsername) {
        dropdownUsername.textContent = user.email;
    }
    
    if (dropdownWelcome) {
        dropdownWelcome.textContent = `Welcome, ${user.name || user.email}`;
    }
}

function updateUIForLoggedOutUser() {
    // Show sign-in section
    const signinSection = document.querySelector('.signin');
    if (signinSection) {
        signinSection.style.display = 'flex';
    }
    
    // Hide profile section
    const profileSection = document.getElementById('profile-section');
    if (profileSection) {
        profileSection.style.display = 'none';
    }
}

function toggleDropdown() {
    const dropdownMenu = document.getElementById('dropdownMenu');
    if (dropdownMenu) {
        dropdownMenu.classList.toggle('show');
    }
}

function logout() {
    console.log('🚪 Logging out...');
    
    // Clear local storage only (no API call)
    localStorage.removeItem('user');
    
    // Update UI immediately
    updateUIForLoggedOutUser();
    
    // Redirect to home page
    window.location.href = 'index.html';
}

// Simple login function for demo purposes
function demoLogin(email, name) {
    const userData = {
        email: email,
        name: name || email.split('@')[0]
    };
    
    localStorage.setItem('user', JSON.stringify(userData));
    checkAuth();
    
    // Show success message
    alert(`Welcome back, ${userData.name}! (This is a demo login)`);
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdownMenu = document.getElementById('dropdownMenu');
    const profileDropdown = document.querySelector('.profile-dropdown');
    
    if (dropdownMenu && profileDropdown && !profileDropdown.contains(event.target)) {
        dropdownMenu.classList.remove('show');
    }
});

// Check authentication when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏠 Homepage loaded - checking authentication...');
    checkAuth();
});

// Existing homepage functionality
document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.hero-slider .slide');
  const hero = document.querySelector('.hero-slider');
  let currentIndex = 0;
  let intervalId = null;
  const INTERVAL = 5000;

  function showSlide(index) {
    if (index === currentIndex) return;
    const prev = slides[currentIndex];
    const next = slides[index];
    // Add next first so we get a smooth crossfade, then remove prev shortly after
    next.classList.add('active');
    setTimeout(() => {
      prev.classList.remove('active');
      currentIndex = index;
    }, 40); // small delay lets browser paint next before fading out prev
  }

  function startSlider() {
    stopSlider();
    intervalId = setInterval(() => {
      showSlide((currentIndex + 1) % slides.length);
    }, INTERVAL);
  }

  function stopSlider() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  // Pause on hover / touch
  hero.addEventListener('mouseenter', stopSlider);
  hero.addEventListener('mouseleave', startSlider);
  hero.addEventListener('touchstart', stopSlider, {passive:true});
  hero.addEventListener('touchend', startSlider, {passive:true});

  // Hamburger toggle
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('show');
      hamburger.setAttribute('aria-expanded', isOpen);
    });
  }

  // Header scroll effect
  const header = document.querySelector('.about');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  // Start slider
  startSlider();
});

//clickable menu
function openDish(id) {
  // For static version, just go to order page without specific dish
  window.location.href = `order.html`;
}

// Slide functionality for menu
function scrollMenu(button, direction) {
  const track = button.parentElement.querySelector('.menu-track');
  if (track) {
    const scrollAmount = track.clientWidth;
    track.scrollBy({
      left: direction * scrollAmount,
      behavior: "smooth"
    });
  }
}

// Review slider
let currentReview = 0;
const reviews = document.querySelectorAll('.review');

function showNextReview() {
  if (reviews.length > 0) {
    reviews[currentReview].classList.remove('active');
    currentReview = (currentReview + 1) % reviews.length;
    reviews[currentReview].classList.add('active');
  }
}

if (reviews.length > 0) {
  setInterval(showNextReview, 4000);
}

// Map functionality (only if map element exists)
const mapElement = document.getElementById('mapid');
if (mapElement) {
  const map = L.map('mapid').setView([38.8439, -77.1200], 16);

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // Add a marker with popup
  L.marker([38.8439, -77.1200])
    .addTo(map)
    .bindPopup(
      "<b>MOYA CAFE AND KITCHENS LLC</b><br>3819 S George Mason Dr Suite A,<br>Bailey's Crossroads, VA 22041<br>Open 07:00 AM – 09:00 PM"
    )
    .openPopup();
}

// Contact form (static version)
const form = document.getElementById("contactForm");
const thankYouMessage = document.getElementById("thankYouMessage");

if (form && thankYouMessage) {
  form.addEventListener("submit", function(event) {
    event.preventDefault(); // Stop page refresh

    if (form.checkValidity()) {
      // Show success message
      thankYouMessage.style.display = "block"; 
      form.reset(); 

      // Hide message after 3 seconds
      setTimeout(() => {
        thankYouMessage.style.display = "none";
      }, 3000);
    }
  });
}

// Demo login buttons (add these to your HTML if needed)
function setupDemoLogin() {
  const demoLoginBtn = document.getElementById('demo-login-btn');
  if (demoLoginBtn) {
    demoLoginBtn.addEventListener('click', function() {
      demoLogin('demo@example.com', 'Demo User');
    });
  }
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
  checkAuth();
  setupDemoLogin();
});