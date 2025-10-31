function checkAuth() {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    console.log('🔐 Order Page - Auth check');
    console.log('User:', user);
    console.log('Token:', token);
    
    if (user && token) {
        try {
            const userData = JSON.parse(user);
            console.log('✅ User is logged in:', userData.email);
            updateUIForLoggedInUser(userData);
            return true;
        } catch (error) {
            console.error('❌ Error parsing user data:', error);
            updateUIForLoggedOutUser();
            return false;
        }
    } else {
        console.log('❌ No user logged in');
        updateUIForLoggedOutUser();
        return false;
    }
}

function updateUIForLoggedInUser(user) {
    console.log('🔄 Updating UI for logged in user:', user.email);
    
    // Hide the sign-in icon
    const signinIcon = document.getElementById('signin-icon');
    if (signinIcon) {
        signinIcon.style.display = 'none';
        console.log('✅ Hidden sign-in icon');
    } else {
        console.log('❌ Sign-in icon not found');
    }
    
    // Show profile section
    const profileSection = document.getElementById('profile-section');
    if (profileSection) {
        profileSection.style.display = 'block';
        console.log('✅ Showing profile section');
    } else {
        console.log('❌ Profile section not found');
    }
    
    // Update user info in profile dropdown
    updateProfileInfo(user);
}

function updateUIForLoggedOutUser() {
    console.log('🔄 Updating UI for logged out user');
    
    // Show the sign-in icon
    const signinIcon = document.getElementById('signin-icon');
    if (signinIcon) {
        signinIcon.style.display = 'block';
        console.log('✅ Showing sign-in icon');
    }
    
    // Hide profile section
    const profileSection = document.getElementById('profile-section');
    if (profileSection) {
        profileSection.style.display = 'none';
        console.log('✅ Hiding profile section');
    }
}

function updateProfileInfo(user) {
    const userAvatar = document.getElementById('user-avatar-circle');
    const dropdownUsername = document.querySelector('.dropdown-username');
    const dropdownWelcome = document.querySelector('.dropdown-welcome');
    const dropdownAvatar = document.querySelector('.dropdown-avatar');
    
    const userInitial = user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();
    const welcomeName = user.name || user.email.split('@')[0]; // Use name or first part of email
    
    if (userAvatar) {
        userAvatar.textContent = userInitial;
        console.log('✅ Updated user avatar:', userInitial);
    }
    if (dropdownUsername) {
        dropdownUsername.textContent = user.email;
        console.log('✅ Updated dropdown username:', user.email);
    }
    if (dropdownWelcome) {
        dropdownWelcome.textContent = `Welcome, ${welcomeName}`;
        console.log('✅ Updated welcome message:', welcomeName);
    }
    if (dropdownAvatar) {
        dropdownAvatar.textContent = userInitial;
        console.log('✅ Updated dropdown avatar:', userInitial);
    }
}

function toggleDropdown() {
    const dropdownMenu = document.getElementById('dropdownMenu');
    if (dropdownMenu) {
        dropdownMenu.classList.toggle('show');
        console.log('🔽 Dropdown toggled');
    }
}

function logout() {
    console.log('🚪 Logging out...');
    
    // Clear all auth-related data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('moya_current_user');
    
    // Optional: Clear session ID if you want fresh session on next visit
    // localStorage.removeItem('moya_session_id');
    
    fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
    }).catch(err => console.log('Logout API call failed:', err));
    
    updateUIForLoggedOutUser();
    
    // Redirect to home page after a brief delay
    setTimeout(() => {
        window.location.href = '/';
    }, 500);
}

// Enhanced click outside to close dropdown
document.addEventListener('click', function(event) {
    const dropdownMenu = document.getElementById('dropdownMenu');
    const profileDropdown = document.querySelector('.profile-dropdown');
    const signinIcon = document.getElementById('signin-icon');
    
    // Close dropdown if clicking outside
    if (dropdownMenu && profileDropdown && 
        !profileDropdown.contains(event.target) && 
        event.target !== signinIcon) {
        dropdownMenu.classList.remove('show');
    }
});

// Check authentication when page loads and also when storage changes (for multiple tabs)
document.addEventListener('DOMContentLoaded', function() {
    console.log('🛒 Order page loaded - checking authentication...');
    checkAuth();
    
    // Listen for storage changes (if user logs in/out in another tab)
    window.addEventListener('storage', function(e) {
        if (e.key === 'user' || e.key === 'token') {
            console.log('🔄 Storage changed, rechecking auth...');
            checkAuth();
        }
    });
});
// ===== Header scroll effect =====
window.addEventListener('scroll', () => {
  const header = document.querySelector('header');
  if (window.scrollY > 50) header.classList.add('scrolled');
  else header.classList.remove('scrolled');
});

// API Base URL - match your server port
const API_BASE = 'http://localhost:3000/api';

/* ===== User & Session Management ===== */
function getCurrentUser() {
  return JSON.parse(localStorage.getItem('moya_current_user')) || null;
}

function getSessionId() {
  let sessionId = localStorage.getItem('moya_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('moya_session_id', sessionId);
    console.log('🆕 New session created in cart:', sessionId);
  } else {
    console.log('📋 Existing session in cart:', sessionId);
  }
  return sessionId;
}

function getActiveId() {
  const user = getCurrentUser();
  if (user) {
    return user.id; // Return user_id for logged-in users
  } else {
    return getSessionId(); // Return session_id for guests
  }
}

function getCartIdentifier() {
  const user = getCurrentUser();
  if (user) {
    return { user_id: user.id, session_id: null };
  } else {
    return { user_id: null, session_id: getSessionId() };
  }
}

/* ===== Load Cart ===== */
async function loadCart() {
  try {
    const id = getActiveId(); // user or session
    console.log('📦 Loading cart for:', id);

    const response = await fetch(`/api/cart/${id}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const cartItems = await response.json();
    console.log('🛒 Cart items received:', cartItems);

    const container = document.getElementById("cart-items");
    container.innerHTML = "";
    let subtotal = 0;

    if (!cartItems.length) {
      container.innerHTML = `
        <div class="empty-cart">
          <p>Your cart is empty</p>
          <a href="order.html" class="continue-shopping" style="text-decoration:none;">Continue Shopping</a>
        </div>
      `;
      updateTotals(0);
      updateCartCount();
      return;
    }

 // In cart.js frontend - Update the cart item display part
// BEST SOLUTION - Use backend calculated total
cartItems.forEach((item) => {
  // Use the total_price if available from backend, otherwise calculate it
  const lineTotal = item.total_price 
    ? parseFloat(item.total_price)
    : (item.custom_price ? parseFloat(item.custom_price) : parseFloat(item.price)) * (item.quantity || 1);
  
  const unitPrice = item.unit_price ? parseFloat(item.unit_price) : 
                   (item.custom_price ? parseFloat(item.custom_price) : parseFloat(item.price));
  
  subtotal += lineTotal;

  const div = document.createElement("div");
  div.className = "cart-item";
  div.innerHTML = `
    <img src="${item.image_url || 'image/placeholder.jpg'}" 
         alt="${item.name}" 
         onerror="this.src='image/placeholder.jpg'">
    <div class="details">
      <h2>${item.name}${item.variant ? ` (${item.variant})` : ''}</h2>
      <p class="desc">${item.description || ''}</p>
      <div class="quantity">
        <button onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
        <span>${item.quantity}</span>
        <button onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
      </div>
      <p class="price">$${lineTotal.toFixed(2)}</p>
      <p class="unit-price"><small>$${unitPrice.toFixed(2)} each</small></p>
    </div>
    <button class="remove" onclick="removeItem(${item.id})">Remove</button>
  `;
  container.appendChild(div);
});

    updateTotals(subtotal);
    updateCartCount();

  } catch (error) {
    console.error('❌ Error loading cart:', error);
    document.getElementById("cart-items").innerHTML = `
      <div class="error">
        <p>Error loading cart. Please try again later.</p>
        <p><small>${error.message}</small></p>
      </div>
    `;
  }
}

/* ===== Update Quantity ===== */
/* ===== Update Quantity ===== */
async function updateQuantity(cartItemId, newQuantity) {
  if (newQuantity < 0) return;
  
  try {
    console.log('🔄 Updating quantity for cart item:', cartItemId, 'to:', newQuantity);
    
    const response = await fetch(`/api/cart/update/${cartItemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quantity: newQuantity
      })
    });

    if (response.ok) {
      loadCart();
      showToast('Quantity updated');
    } else {
      const error = await response.json();
      showToast(error.error || 'Failed to update quantity');
    }
  } catch (error) {
    console.error('Error updating quantity:', error);
    showToast('Error updating quantity');
  }
}
/* ===== Debug Cart Items ===== */
function debugCartItems() {
  console.log('🔍 Debugging cart items...');
  
  const cartItems = document.querySelectorAll('.cart-item');
  console.log(`Found ${cartItems.length} cart items in DOM`);
  
  cartItems.forEach((item, index) => {
    const removeBtn = item.querySelector('.remove');
    const quantityBtns = item.querySelectorAll('.quantity button');
    
    console.log(`Item ${index + 1}:`);
    console.log('  Remove button onclick:', removeBtn.getAttribute('onclick'));
    console.log('  Quantity buttons:', quantityBtns.length);
  });
}

// Call this in browser console to test
window.debugCartItems = debugCartItems;
/* ===== Remove Item ===== */
async function removeItem(cartItemId) {
  try {
    console.log('🗑️ Removing cart item ID:', cartItemId);
    
    const response = await fetch(`/api/cart/remove/${cartItemId}`, {
      method: "DELETE"
    });

    if (response.ok) {
      showToast('Item removed from cart');
      loadCart(); // Reload the cart to reflect changes
    } else {
      const error = await response.json();
      showToast(error.error || 'Failed to remove item');
    }
  } catch (error) {
    console.error('Error removing item:', error);
    showToast('Error removing item');
  }
}

/* ===== Update Cart Count ===== */
async function updateCartCount() {
  try {
    const id = getActiveId();
    const response = await fetch(`/api/cart/${id}`);
    if (!response.ok) return;

    const cartItems = await response.json();
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    // Update cart count in header
    const counter = document.getElementById("cart-count");
    if (counter) counter.textContent = totalItems;
    
  } catch (error) {
    console.error('Error updating cart count:', error);
  }
}

/* ===== Update Totals ===== */
function updateTotals(subtotal = 0) {
  const taxRate = 0.085;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const subtotalEl = document.getElementById("subtotal");
  const taxEl = document.getElementById("tax");
  const totalEl = document.getElementById("total");

  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}

/* ===== Toast Function ===== */
function showToast(message, duration = 2000) {
  // Create toast element if it doesn't exist
  let toastEl = document.getElementById('toast');
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'toast';
    toastEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #333;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 1000;
      display: none;
      transition: opacity 0.3s;
    `;
    document.body.appendChild(toastEl);
  }
  
  toastEl.textContent = message;
  toastEl.style.display = 'block';
  toastEl.style.opacity = '1';
  
  setTimeout(() => {
    toastEl.style.opacity = '0';
    setTimeout(() => {
      toastEl.style.display = 'none';
    }, 300);
  }, duration);
}

/* ===== Pickup Time ===== */
function formatTime(date) {
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

function showPickupTime() {
  const now = new Date();
  const pickup = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later
  const pickupInfo = document.getElementById("pickup-info");
  
  if (pickupInfo) {
    pickupInfo.innerHTML = `
      <h3>Pickup Information</h3>
      <p><strong>Order Time:</strong> ${formatTime(now)}</p>
      <p><strong>Estimated Pickup:</strong> ${formatTime(pickup)}</p>
    `;
  }
}

/* ===== Checkout Function - FIXED DATA PASSING ===== */
async function goToPayment() {
  try {
    const { user_id, session_id } = getCartIdentifier();
    
    // First check if cart has items
    const id = getActiveId();
    const response = await fetch(`/api/cart/${id}`);
    if (!response.ok) throw new Error('Failed to load cart');
    
    const cartItems = await response.json();
    if (cartItems.length === 0) {
      showToast('Your cart is empty');
      return;
    }

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => {
      return sum + (item.total_price ? parseFloat(item.total_price) : 
                   (item.custom_price ? parseFloat(item.custom_price) : parseFloat(item.price)) * item.quantity);
    }, 0);
    
    const taxRate = 0.085;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // Store ALL cart data for payment page
    const cartData = {
      items: cartItems,
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      user_id: user_id,
      session_id: session_id
    };

    console.log('💳 Passing to payment:', cartData);

    // Store in localStorage for payment page
    localStorage.setItem('cartTotal', total.toFixed(2));
    localStorage.setItem('cartSubtotal', subtotal.toFixed(2));
    localStorage.setItem('cartTax', tax.toFixed(2));
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    localStorage.setItem('cartData', JSON.stringify(cartData));

    const user = getCurrentUser();
    if (!user) {
      // User is NOT logged in - redirect to signin with return URL to payment
      console.log('🔐 User not logged in, redirecting to signin...');
      localStorage.setItem('pendingCartData', JSON.stringify(cartData)); // Save for after login
      window.location.href = 'signin.html?redirect=payment';
      return;
    }

    // User IS logged in - proceed directly to payment
    console.log('✅ User logged in, proceeding to payment...');
    window.location.href = 'payment.html';
    
  } catch (error) {
    console.error('Error proceeding to checkout:', error);
    showToast('Error proceeding to checkout');
  }
}
/* ===== Initialize ===== */
document.addEventListener('DOMContentLoaded', function() {
  console.log('🛒 Cart page initialized');
  
  // Load cart items
  loadCart();
  
  // Show pickup time estimate
  showPickupTime();
  
  // Update cart count
  updateCartCount();
});

// Debug function
function debugCart() {
  console.log('🔍 Cart Debug Info:');
  console.log('Current User:', getCurrentUser());
  console.log('Session ID:', getSessionId());
  console.log('Active ID:', getActiveId());
  console.log('Cart Identifier:', getCartIdentifier());
}