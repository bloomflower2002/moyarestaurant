document.addEventListener("DOMContentLoaded", () => {
  // DEBUG: Check what's in localStorage
  console.log("DEBUG - localStorage contents:");
  console.log("loggedIn:", localStorage.getItem("loggedIn"));
  console.log("token:", localStorage.getItem("token"));
  console.log("user:", localStorage.getItem("user"));
  console.log("userName:", localStorage.getItem("userName"));
  console.log("userEmail:", localStorage.getItem("userEmail"));
  
  // Check both authentication systems
  const loggedIn = localStorage.getItem("loggedIn");
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  
  console.log("Auth check - loggedIn:", loggedIn, "token:", token, "user:", user);
  
  // If not logged in with either system, redirect to signin
  if (loggedIn !== "true" && (!token || !user)) {
    console.log("Not authenticated, redirecting to signin");
    window.location.href = "signin.html?returnUrl=user.html";
    return;
  }

  // If using the new system (token/user), set up the old system for compatibility
  if (token && user && loggedIn !== "true") {
    try {
      const userData = JSON.parse(user);
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("userName", userData.name || "User");
      localStorage.setItem("userEmail", userData.email || "user@example.com");
      console.log("Migrated to old auth system");
    } catch (e) {
      console.error("Error parsing user data:", e);
    }
  }

  console.log("User authenticated, loading profile");
  // Initialize the application
  initProfilePage();
  setupEventListeners();
  initLoyaltyProgram();
});

function initProfilePage() {
  // Populate user info
  const nameEl = document.getElementById("user-name");
  const emailEl = document.getElementById("user-email");
  const avatarEl = document.getElementById("avatar-img");

  nameEl.textContent = localStorage.getItem("userName") || "Guest User";
  emailEl.textContent = localStorage.getItem("userEmail") || "guest@example.com";
  
  const savedAvatar = localStorage.getItem("userAvatar");
  if (savedAvatar) avatarEl.src = savedAvatar;

  // Load preferences
  const preferences = JSON.parse(localStorage.getItem("moyaPreferences") || "{}");
  document.getElementById("newsletter").checked = preferences.newsletter !== false;

  // Load order history
  loadOrderHistory();
}

function setupEventListeners() {
  // Toggle Forms
  document.getElementById("show-edit-form").addEventListener("click", () => {
    document.getElementById("edit-form").classList.toggle("hidden");
    document.getElementById("avatar-form").classList.add("hidden");
  });

  document.getElementById("show-avatar-form").addEventListener("click", () => {
    document.getElementById("avatar-form").classList.toggle("hidden");
    document.getElementById("edit-form").classList.add("hidden");
  });

  // Save New Name/Email
  document.getElementById("save-details").addEventListener("click", () => {
    const newName = document.getElementById("edit-name").value.trim();
    const newEmail = document.getElementById("edit-email").value.trim();

    if (newName) {
      document.getElementById("user-name").textContent = newName;
      localStorage.setItem("userName", newName);
    }
    if (newEmail) {
      document.getElementById("user-email").textContent = newEmail;
      localStorage.setItem("userEmail", newEmail);
    }

    document.getElementById("edit-form").classList.add("hidden");
    showNotification("Profile updated successfully!");
  });

  // Save New Avatar
  document.getElementById("save-avatar").addEventListener("click", () => {
    const fileInput = document.getElementById("avatar-file");
    if (fileInput.files && fileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = e => {
        document.getElementById("avatar-img").src = e.target.result;
        localStorage.setItem("userAvatar", e.target.result);
        showNotification("Profile picture updated!");
      };
      reader.readAsDataURL(fileInput.files[0]);
    } else {
      alert("Please select an image file.");
      return;
    }
    document.getElementById("avatar-form").classList.add("hidden");
  });

  // Newsletter preference
  document.getElementById("newsletter").addEventListener("change", function() {
    const preferences = JSON.parse(localStorage.getItem("moyaPreferences") || "{}");
    preferences.newsletter = this.checked;
    localStorage.setItem("moyaPreferences", JSON.stringify(preferences));
  });

  // Logout buttons
  const mainLogoutBtn = document.querySelector(".logout-btn");
  const headerLogoutBtn = document.getElementById("logout-btn");

  if (mainLogoutBtn) {
    mainLogoutBtn.addEventListener("click", logoutUser);
  }

  if (headerLogoutBtn) {
    headerLogoutBtn.addEventListener("click", function(e) {
      e.preventDefault();
      logoutUser();
    });
  }
}

function initLoyaltyProgram() {
  // Load loyalty data from localStorage
  const loyaltyData = JSON.parse(localStorage.getItem("moyaloyaltyData") || "{}");
  
  // Initialize if not exists
  if (!loyaltyData.orderCount) {
    loyaltyData.orderCount = 0;
    loyaltyData.freeMealsEarned = 0;
    loyaltyData.rewardsAvailable = 0;
  }
  
  // Only update display if loyalty elements exist
  updateLoyaltyDisplay(loyaltyData);
}

function updateLoyaltyDisplay(loyaltyData) {
  // Check if loyalty elements exist before updating
  const orderCountEl = document.getElementById("order-count");
  const freeMealsEl = document.getElementById("free-meals");
  const progressBarEl = document.getElementById("progress-bar");
  const remainingOrdersEl = document.getElementById("remaining-orders");
  
  if (orderCountEl && freeMealsEl && progressBarEl && remainingOrdersEl) {
    const orderCount = loyaltyData.orderCount || 0;
    const freeMealsEarned = loyaltyData.freeMealsEarned || 0;
    const progress = (orderCount % 4) * 25;
    const remainingOrders = 4 - (orderCount % 4);
    
    orderCountEl.textContent = orderCount;
    freeMealsEl.textContent = freeMealsEarned;
    progressBarEl.style.width = `${progress}%`;
    remainingOrdersEl.textContent = remainingOrders;
  }
}

function loadOrderHistory() {
  const orderHistory = document.getElementById("order-history");
  const savedOrders = JSON.parse(localStorage.getItem("userOrders") || "[]");
  
  if (savedOrders.length === 0) {
    orderHistory.innerHTML = "<li>No past orders yet.</li>";
    return;
  }
  
  // Display saved orders
  orderHistory.innerHTML = "";
  savedOrders.forEach(order => {
    const orderItem = document.createElement("li");
    orderItem.textContent = order;
    orderHistory.appendChild(orderItem);
  });
}

function addToOrderHistory() {
  const now = new Date();
  const orderDate = now.toLocaleDateString();
  const orderTime = now.toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"});
  const orderText = `Order #${1000 + document.getElementById("order-history").children.length} - ${orderDate} at ${orderTime}`;
  
  // Save to localStorage
  const savedOrders = JSON.parse(localStorage.getItem("userOrders") || "[]");
  savedOrders.unshift(orderText); // Add to beginning
  localStorage.setItem("userOrders", JSON.stringify(savedOrders));
  
  // Reload order history display
  loadOrderHistory();
}

// ===== LOYALTY PROGRAM FUNCTIONS FOR REAL ORDERS =====

// Call this function when a user completes a real order
function processOrder(orderDetails) {
  // Load current loyalty data
  const loyaltyData = JSON.parse(localStorage.getItem("moyaloyaltyData") || '{}');
  
  // Increment order count
  loyaltyData.orderCount++;
  
  // Check if user earned a free meal (every 4 orders)
  if (loyaltyData.orderCount % 4 === 0) {
    loyaltyData.freeMealsEarned++;
    loyaltyData.rewardsAvailable++;
    
    // Generate a random reward code
    const rewardCode = Math.floor(1000 + Math.random() * 9000);
    
    // Show reward message if element exists
    const rewardCodeEl = document.getElementById("reward-code");
    const rewardMessageEl = document.getElementById("reward-message");
    
    if (rewardCodeEl && rewardMessageEl) {
      rewardCodeEl.textContent = rewardCode;
      rewardMessageEl.classList.remove("hidden");
    }
    
    showNotification("Congratulations! You earned a free meal!");
  }
  
  // Update localStorage
  localStorage.setItem("moyaloyaltyData", JSON.stringify(loyaltyData));
  
  // Update display
  updateLoyaltyDisplay(loyaltyData);
  
  // Add to order history with real order details
  addRealOrderToHistory(orderDetails);
}

// Function to add real order details to history
function addRealOrderToHistory(orderDetails) {
  const now = new Date();
  const orderDate = now.toLocaleDateString();
  const orderTime = now.toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"});
  
  // Create order text with actual order details
  const orderText = `Order #${1000 + document.getElementById("order-history").children.length} - ${orderDate} at ${orderTime} - ${orderDetails.items.length} items - $${orderDetails.total}`;
  
  // Save to localStorage
  const savedOrders = JSON.parse(localStorage.getItem("userOrders") || "[]");
  savedOrders.unshift(orderText);
  localStorage.setItem("userOrders", JSON.stringify(savedOrders));
  
  // Reload order history display
  loadOrderHistory();
}

// Function to redeem a free meal
function redeemFreeMeal() {
  const loyaltyData = JSON.parse(localStorage.getItem("moyaloyaltyData") || '{}');
  
  if (loyaltyData.rewardsAvailable > 0) {
    loyaltyData.rewardsAvailable--;
    localStorage.setItem("moyaloyaltyData", JSON.stringify(loyaltyData));
    updateLoyaltyDisplay(loyaltyData);
    
    showNotification("Free meal redeemed! Enjoy your meal! 🎉");
    return true;
  } else {
    showNotification("No free meals available. Keep ordering to earn rewards!");
    return false;
  }
}

function logoutUser() {
  if (confirm("Are you sure you want to logout?")) {
    // Clear ALL login-related data
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userAvatar");
    localStorage.removeItem("moyaloyaltyData");
    localStorage.removeItem("userOrders");
    localStorage.removeItem("moyaPreferences");
    
    // Also clear the new system data
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    // Show logout notification
    showNotification("Logging out...");
    
    // Redirect to HOME PAGE
    setTimeout(() => {
      window.location.href = "index.html";
    }, 500);
  }
}

function showNotification(message) {
  // Create notification element
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.className = "notification";
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Header scroll effect
window.addEventListener("scroll", function() {
  const header = document.querySelector("header");
  if (window.scrollY > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});