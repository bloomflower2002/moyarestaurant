document.addEventListener("DOMContentLoaded", () => {
  console.log("👤 User profile page loaded");
  
  // DEBUG: Check authentication status
  console.log("🔐 Auth check - user:", localStorage.getItem("user"));
  console.log("🔐 Auth check - token:", localStorage.getItem("token"));
  
  // Check authentication using the new system (user/token)
  const user = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  
  if (!user || !token) {
    console.log("❌ User not authenticated, redirecting to signin");
    window.location.href = "signin.html?returnUrl=user.html";
    return;
  }

  console.log("✅ User authenticated, loading profile");
  
  // Initialize the application
  initProfilePage();
  setupEventListeners();
  initLoyaltyProgram();
});

function initProfilePage() {
  try {
    const userData = JSON.parse(localStorage.getItem("user"));
    const userName = localStorage.getItem("userName") || userData.name || "Guest User";
    const userEmail = localStorage.getItem("userEmail") || userData.email || "guest@example.com";
    
    console.log("📝 Initializing profile for:", userName, userEmail);
    
    // Populate user info
    const nameEl = document.getElementById("user-name");
    const emailEl = document.getElementById("user-email");
    const avatarEl = document.getElementById("avatar-img");

    if (nameEl) nameEl.textContent = userName;
    if (emailEl) emailEl.textContent = userEmail;
    
    // Load avatar
    const savedAvatar = localStorage.getItem("userAvatar");
    if (savedAvatar && avatarEl) {
      avatarEl.src = savedAvatar;
    } else if (avatarEl) {
      // Set default avatar based on user name
      const defaultAvatar = generateDefaultAvatar(userName);
      avatarEl.src = defaultAvatar;
    }

    // Load preferences
    loadUserPreferences();

    // Load order history
    loadOrderHistory();
    
  } catch (error) {
    console.error("❌ Error initializing profile:", error);
    showNotification("Error loading profile data");
  }
}

function generateDefaultAvatar(name) {
  // Create a simple colored circle with user initial
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  
  // Background color based on name
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
  const color = colors[name.length % colors.length];
  
  // Draw circle
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(50, 50, 45, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw initial
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 40px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name.charAt(0).toUpperCase(), 50, 50);
  
  return canvas.toDataURL();
}

function loadUserPreferences() {
  const preferences = JSON.parse(localStorage.getItem("moyaPreferences") || "{}");
  const newsletterCheckbox = document.getElementById("newsletter");
  
  if (newsletterCheckbox) {
    newsletterCheckbox.checked = preferences.newsletter !== false;
  }
}

function setupEventListeners() {
  console.log("🔧 Setting up event listeners...");
  
  // Toggle Forms
  const showEditFormBtn = document.getElementById("show-edit-form");
  const showAvatarFormBtn = document.getElementById("show-avatar-form");
  
  if (showEditFormBtn) {
    showEditFormBtn.addEventListener("click", () => {
      document.getElementById("edit-form").classList.toggle("hidden");
      document.getElementById("avatar-form").classList.add("hidden");
    });
  }

  if (showAvatarFormBtn) {
    showAvatarFormBtn.addEventListener("click", () => {
      document.getElementById("avatar-form").classList.toggle("hidden");
      document.getElementById("edit-form").classList.add("hidden");
    });
  }

  // Save New Name/Email
  const saveDetailsBtn = document.getElementById("save-details");
  if (saveDetailsBtn) {
    saveDetailsBtn.addEventListener("click", saveUserDetails);
  }

  // Save New Avatar
  const saveAvatarBtn = document.getElementById("save-avatar");
  if (saveAvatarBtn) {
    saveAvatarBtn.addEventListener("click", saveUserAvatar);
  }

  // Newsletter preference
  const newsletterCheckbox = document.getElementById("newsletter");
  if (newsletterCheckbox) {
    newsletterCheckbox.addEventListener("change", function() {
      const preferences = JSON.parse(localStorage.getItem("moyaPreferences") || "{}");
      preferences.newsletter = this.checked;
      localStorage.setItem("moyaPreferences", JSON.stringify(preferences));
      showNotification("Preferences updated!");
    });
  }

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

  // Demo order button (for testing)
  const demoOrderBtn = document.getElementById("demo-order-btn");
  if (demoOrderBtn) {
    demoOrderBtn.addEventListener("click", addDemoOrder);
  }

  // Redeem reward button
  const redeemBtn = document.getElementById("redeem-btn");
  if (redeemBtn) {
    redeemBtn.addEventListener("click", redeemFreeMeal);
  }
}

function saveUserDetails() {
  const newName = document.getElementById("edit-name")?.value.trim();
  const newEmail = document.getElementById("edit-email")?.value.trim();

  if (!newName && !newEmail) {
    showNotification("Please enter name or email to update");
    return;
  }

  try {
    // Update user data in localStorage
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    
    if (newName) {
      document.getElementById("user-name").textContent = newName;
      localStorage.setItem("userName", newName);
      currentUser.name = newName;
    }
    
    if (newEmail) {
      // Basic email validation
      if (!isValidEmail(newEmail)) {
        showNotification("Please enter a valid email address");
        return;
      }
      document.getElementById("user-email").textContent = newEmail;
      localStorage.setItem("userEmail", newEmail);
      currentUser.email = newEmail;
    }

    // Save updated user object
    localStorage.setItem("user", JSON.stringify(currentUser));

    document.getElementById("edit-form").classList.add("hidden");
    showNotification("Profile updated successfully!");
    
  } catch (error) {
    console.error("Error saving user details:", error);
    showNotification("Error updating profile");
  }
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function saveUserAvatar() {
  const fileInput = document.getElementById("avatar-file");
  
  if (!fileInput.files || !fileInput.files[0]) {
    showNotification("Please select an image file");
    return;
  }

  const file = fileInput.files[0];
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    showNotification("Please select an image file (JPEG, PNG, etc.)");
    return;
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    showNotification("Image size should be less than 2MB");
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById("avatar-img").src = e.target.result;
    localStorage.setItem("userAvatar", e.target.result);
    showNotification("Profile picture updated!");
  };
  
  reader.onerror = () => {
    showNotification("Error reading image file");
  };
  
  reader.readAsDataURL(file);
  document.getElementById("avatar-form").classList.add("hidden");
}

function initLoyaltyProgram() {
  // Load loyalty data from localStorage
  const loyaltyData = JSON.parse(localStorage.getItem("moyaloyaltyData") || "{}");
  
  // Initialize if not exists
  if (typeof loyaltyData.orderCount !== 'number') {
    loyaltyData.orderCount = 0;
    loyaltyData.freeMealsEarned = 0;
    loyaltyData.rewardsAvailable = 0;
    localStorage.setItem("moyaloyaltyData", JSON.stringify(loyaltyData));
  }
  
  // Update display
  updateLoyaltyDisplay(loyaltyData);
}

function updateLoyaltyDisplay(loyaltyData) {
  const orderCountEl = document.getElementById("order-count");
  const freeMealsEl = document.getElementById("free-meals");
  const progressBarEl = document.getElementById("progress-bar");
  const remainingOrdersEl = document.getElementById("remaining-orders");
  const redeemBtn = document.getElementById("redeem-btn");
  
  if (orderCountEl && freeMealsEl && progressBarEl && remainingOrdersEl) {
    const orderCount = loyaltyData.orderCount || 0;
    const freeMealsEarned = loyaltyData.freeMealsEarned || 0;
    const rewardsAvailable = loyaltyData.rewardsAvailable || 0;
    const progress = (orderCount % 4) * 25;
    const remainingOrders = 4 - (orderCount % 4);
    
    orderCountEl.textContent = orderCount;
    freeMealsEl.textContent = freeMealsEarned;
    progressBarEl.style.width = `${progress}%`;
    remainingOrdersEl.textContent = remainingOrders;
    
    // Update redeem button state
    if (redeemBtn) {
      if (rewardsAvailable > 0) {
        redeemBtn.disabled = false;
        redeemBtn.textContent = `Redeem Free Meal (${rewardsAvailable} available)`;
      } else {
        redeemBtn.disabled = true;
        redeemBtn.textContent = "No Rewards Available";
      }
    }
  }
}

function loadOrderHistory() {
  const orderHistory = document.getElementById("order-history");
  if (!orderHistory) return;
  
  const savedOrders = JSON.parse(localStorage.getItem("userOrders") || "[]");
  
  if (savedOrders.length === 0) {
    orderHistory.innerHTML = `
      <li class="no-orders">
        <i class="fas fa-shopping-bag"></i>
        <span>No orders yet. Start ordering to see your history here!</span>
      </li>
    `;
    return;
  }
  
  // Display saved orders
  orderHistory.innerHTML = "";
  savedOrders.forEach((order, index) => {
    const orderItem = document.createElement("li");
    orderItem.className = "order-item";
    orderItem.innerHTML = `
      <div class="order-header">
        <strong>${order.orderNumber || `Order #${1000 + index}`}</strong>
        <span class="order-date">${order.date || 'Unknown date'}</span>
      </div>
      <div class="order-details">
        <span>${order.itemCount || '?'} items</span>
        <strong>$${order.total || '0.00'}</strong>
      </div>
      ${order.status ? `<div class="order-status ${order.status}">${order.status}</div>` : ''}
    `;
    orderHistory.appendChild(orderItem);
  });
}

// Add a demo order for testing
function addDemoOrder() {
  const demoOrders = [
    {
      orderNumber: `MOYA-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      itemCount: 3,
      total: '45.50',
      status: 'completed'
    },
    {
      orderNumber: `MOYA-${Date.now() - 1000000}`,
      date: new Date(Date.now() - 86400000).toLocaleDateString(), // yesterday
      itemCount: 2,
      total: '28.75',
      status: 'completed'
    }
  ];

  demoOrders.forEach(order => {
    processOrder(order);
  });
  
  showNotification("Demo orders added! Check your order history and loyalty points.");
}

// Process a real order (called from payment page)
function processOrder(orderDetails) {
  console.log("📦 Processing order for loyalty program:", orderDetails);
  
  // Load current loyalty data
  const loyaltyData = JSON.parse(localStorage.getItem("moyaloyaltyData") || '{}');
  
  // Initialize if needed
  if (typeof loyaltyData.orderCount !== 'number') loyaltyData.orderCount = 0;
  if (typeof loyaltyData.freeMealsEarned !== 'number') loyaltyData.freeMealsEarned = 0;
  if (typeof loyaltyData.rewardsAvailable !== 'number') loyaltyData.rewardsAvailable = 0;
  
  // Increment order count
  loyaltyData.orderCount++;
  
  // Check if user earned a free meal (every 4 orders)
  if (loyaltyData.orderCount % 4 === 0) {
    loyaltyData.freeMealsEarned++;
    loyaltyData.rewardsAvailable++;
    
    showNotification("🎉 Congratulations! You earned a free meal!");
  }
  
  // Update localStorage
  localStorage.setItem("moyaloyaltyData", JSON.stringify(loyaltyData));
  
  // Update display
  updateLoyaltyDisplay(loyaltyData);
  
  // Add to order history
  addOrderToHistory(orderDetails);
}

function addOrderToHistory(orderDetails) {
  const savedOrders = JSON.parse(localStorage.getItem("userOrders") || "[]");
  
  const orderRecord = {
    orderNumber: orderDetails.order_number || `MOYA-${Date.now()}`,
    date: new Date().toLocaleDateString(),
    itemCount: orderDetails.items ? orderDetails.items.length : 1,
    total: orderDetails.total || '0.00',
    status: 'completed',
    timestamp: new Date().toISOString()
  };
  
  savedOrders.unshift(orderRecord);
  localStorage.setItem("userOrders", JSON.stringify(savedOrders));
  
  // Reload order history display
  loadOrderHistory();
}

function redeemFreeMeal() {
  const loyaltyData = JSON.parse(localStorage.getItem("moyaloyaltyData") || '{}');
  
  if (loyaltyData.rewardsAvailable > 0) {
    loyaltyData.rewardsAvailable--;
    localStorage.setItem("moyaloyaltyData", JSON.stringify(loyaltyData));
    updateLoyaltyDisplay(loyaltyData);
    
    showNotification("🎉 Free meal redeemed! Show this message at checkout.");
    return true;
  } else {
    showNotification("No free meals available. Keep ordering to earn rewards!");
    return false;
  }
}

function logoutUser() {
  if (confirm("Are you sure you want to logout?")) {
    console.log("🚪 Logging out user...");
    
    // Show logout notification
    showNotification("Logging out...");
    
    // Clear ALL user-related data
    const keysToKeep = ['moyaloyaltyData', 'userOrders', 'moyaPreferences']; // Keep these for if user signs back in
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    // Redirect to home page
    setTimeout(() => {
      window.location.href = "index.html";
    }, 500);
  }
}

function showNotification(message) {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(notification => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  });
  
  // Create notification element
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.className = "notification";
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #333;
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = "slideOut 0.3s ease";
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }
  }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  
  .notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #333;
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    z-index: 1000;
    animation: slideIn 0.3s ease;
  }
  
  .no-orders {
    text-align: center;
    padding: 2rem;
    color: #666;
  }
  
  .no-orders i {
    font-size: 2rem;
    margin-bottom: 1rem;
    display: block;
  }
  
  .order-item {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 0.5rem;
  }
  
  .order-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }
  
  .order-details {
    display: flex;
    justify-content: space-between;
  }
  
  .order-status {
    margin-top: 0.5rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    text-align: center;
  }
  
  .order-status.completed {
    background: #d4edda;
    color: #155724;
  }
`;
document.head.appendChild(style);

// Header scroll effect
window.addEventListener("scroll", function() {
  const header = document.querySelector("header");
  if (header && window.scrollY > 50) {
    header.classList.add("scrolled");
  } else if (header) {
    header.classList.remove("scrolled");
  }
});

// Make functions globally available for other pages
window.processOrder = processOrder;
window.redeemFreeMeal = redeemFreeMeal;