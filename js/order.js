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
/* ===== Global Variables ===== */
let currentModalItem = null;
let currentUser = null;

const menuItems = {
  breakfast: {
    title: "Breakfast Combo",
    price: "17",
    foods: ["Ful", "Chechebsa", "Enkulal Firfir", "Dabo Firfir", "Yetsom Firfir", "Pasta"]
  },
  lunch: {
    title: "Lunch Combo",
    price: "25",
    foods: ["Firfir", "Tibs", "Dullet", "Kuanta Firfir", "Yetashe Kitfo", "Kitfo"]
  }
};

/* ===== Dynamic ID Management for Soda & Combo ===== */
let dynamicItemIds = {
  'breakfast_combo': null,
  'lunch_combo': null,
  'soda': null
};

/* ===== User & Session Management ===== */
function getCurrentUser() {
  return JSON.parse(localStorage.getItem('moya_current_user')) || null;
}

function setCurrentUser(user) {
  currentUser = user;
  localStorage.setItem('moya_current_user', JSON.stringify(user));
  // When user logs in, merge their session cart to user cart
  if (user) {
    mergeSessionCartToUser(user.id);
  }
}

function clearCurrentUser() {
  currentUser = null;
  localStorage.removeItem('moya_current_user');
}

function getSessionId() {
  let sessionId = localStorage.getItem('moya_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('moya_session_id', sessionId);
    console.log('🆕 New session created:', sessionId);
  }
  return sessionId;
}

function getCartIdentifier() {
  const user = getCurrentUser();
  if (user) {
    return { user_id: user.id, session_id: null };
  } else {
    return { user_id: null, session_id: getSessionId() };
  }
}

/* ===== Header scroll effect ===== */
window.addEventListener('scroll', () => {
  const header = document.querySelector('header');
  if (!header) return;
  header.classList.toggle('scrolled', window.scrollY > 50);
});

/* ===== Enhanced Add to Cart - Proper Quantity Handling ===== */
async function addToCart(menu_item_id, name, price, img, desc, variant = null, quantity = 1) {
  console.log('🎯 Adding to cart:', { menu_item_id, name, price, variant, quantity });

  const numericPrice = Number(price);
  if (!name || isNaN(numericPrice)) {
    showToast(' Invalid item - please try again');
    return;
  }

  try {
    const { user_id, session_id } = getCartIdentifier();
    
    const requestBody = {
      menu_item_id: parseInt(menu_item_id),
      quantity: quantity
    };

    // Add user_id or session_id based on login status
    if (user_id) {
      requestBody.user_id = user_id;
    } else {
      requestBody.session_id = session_id;
    }

    // Only add variant for specific items that need customization
    const itemsWithVariants = ['Chechebsa', 'Soda', 'Breakfast Combination', 'Lunch Combination', 'Breakfast Combo', 'Lunch Combo'];
    const needsVariant = itemsWithVariants.some(itemName => name.includes(itemName));

    if (needsVariant && variant && variant.trim() !== '') {
      requestBody.variant = variant;
    }

    console.log('🚨 SENDING REQUEST BODY:', JSON.stringify(requestBody, null, 2));

    showToast(`🔄 Adding ${name} to cart...`, 1000);

    const response = await fetch("/api/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);

    const result = await response.json();
    console.log('📡 Response data:', result);

    if (response.ok) {
      // Success message with item name and quantity
      let successMessage = ` ${name}`;
      if (quantity > 1) {
        successMessage += ` (${quantity} items)`;
      }
      successMessage += ' added to cart!';
      
      if (variant) {
        successMessage += ` (${variant})`;
      }
      showToast(successMessage);
      updateCartCount(); // Refresh cart count
    } else {
      console.error('❌ Server error:', result);
      showToast(`❌ Failed to add ${name} to cart: ${result.error || 'Unknown error'}`);
    }

  } catch (err) {
    console.error('❌ Network error:', err);
    showToast('❌ Network error - please check your connection');
  }
}

/* ===== Update Cart Count - Handles Both Guest & Logged-in Users ===== */
/* ===== Update Cart Count - Fixed Version ===== */
async function updateCartCount() {
  try {
    const { user_id, session_id } = getCartIdentifier();
    const identifier = user_id || session_id;
    
    console.log('🔄 Updating cart count for:', identifier);
    
    const response = await fetch(`/api/cart/${identifier}`);
    
    if (response.ok) {
      const cartItems = await response.json();
      console.log('📊 Cart items from API:', cartItems);
      
      // Debug log to see the actual structure
      if (cartItems.length > 0) {
        console.log('🔍 First cart item structure:', cartItems[0]);
      }
      
      const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      const counter = document.getElementById('cart-count');
      if (counter) {
        counter.innerText = totalItems;
        counter.style.display = totalItems > 0 ? 'flex' : 'none';
        console.log('✅ Cart count updated:', totalItems);
      } else {
        console.log('❌ Cart count element not found');
      }
    } else {
      console.error('❌ Failed to fetch cart count, status:', response.status);
    }
  } catch (err) {
    console.error('❌ Error fetching cart count:', err);
  }
}

/* ===== Load Menu Items from Backend ===== */
async function loadMenuItems() {
  const menuContainer = document.getElementById('menu-container');
  const loadingSpinner = document.getElementById('loading-spinner');
  
  try {
    loadingSpinner.style.display = 'flex';
    
    const response = await fetch('/api/menu');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const menuItems = await response.json();
    
    // Group items by category
    const itemsByCategory = {};
    menuItems.forEach(item => {
      const category = item.category_name || 'Other';
      if (!itemsByCategory[category]) {
        itemsByCategory[category] = [];
      }
      itemsByCategory[category].push(item);
    });
    
    // Render menu items
    renderMenuItems(itemsByCategory);
    
    console.log('Menu items loaded and rendered successfully');
    
  } catch (error) {
    console.error('Error loading menu items:', error);
    showToast('Error loading menu. Please refresh the page.');
    initializeStaticMenu();
  } finally {
    loadingSpinner.style.display = 'none';
  }
}

/* ===== Render Menu Items Dynamically ===== */
function renderMenuItems(itemsByCategory) {
  const menuContainer = document.getElementById('menu-container');
  if (!menuContainer) return;
  
  menuContainer.innerHTML = '';
  
  // Define the order of categories for display
  const categoryOrder = [
    'Breakfast', 'Lunch', 'Combination', 'Vegetarian', 
    'Sea Food', 'Kitfo', 'Side Dish', 'Extra', 'Beverage'
  ];
  
  categoryOrder.forEach(category => {
    if (!itemsByCategory[category]) return;
    
    // Create category heading
    const heading = document.createElement('h2');
    heading.className = 'menu-heading';
    heading.id = category.toLowerCase().replace(/\s+/g, '');
    heading.textContent = category;
    menuContainer.appendChild(heading);
    
    // Create items grid
    const itemsGrid = document.createElement('div');
    itemsGrid.className = 'items-grid';
    
    itemsByCategory[category].forEach(item => {
      const itemElement = createMenuItemElement(item);
      itemsGrid.appendChild(itemElement);
    });
    
    menuContainer.appendChild(itemsGrid);
  });
}

/* ===== Create Individual Menu Item Element ===== */
function createMenuItemElement(item) {
  const itemElement = document.createElement('div');
  itemElement.className = 'item';
  
  // Handle special items with custom modals
  if (item.name === 'Chechebsa') {
    itemElement.onclick = () => openChechebsaModal(item);
  } else if (item.name === 'Soda') {
    itemElement.onclick = () => openDrinkModal();
  } else if (item.name.includes('Combination')) {
    // Only look for "Combination" now
    const comboType = item.name.toLowerCase().includes('breakfast') ? 'breakfast' : 'lunch';
    itemElement.onclick = () => openComboModal(comboType);
  } else {
    itemElement.onclick = () => openModal(item);
  }
  
  // Set image with error handling
  const imgSrc = item.image_url || 'image/placeholder.jpg';
  
  itemElement.innerHTML = `
    <img src="${imgSrc}" alt="${item.name}" onerror="this.src='image/placeholder.jpg'">
    <div class="dish-name">${item.name}</div>
    <div class="desc">${item.description}</div>
    <div class="price">$${parseFloat(item.price).toFixed(2)}</div>
  `;
  
  return itemElement;
}

/* ===== Initialize Static Menu (Fallback) ===== */
function initializeStaticMenu() {
  const menuContainer = document.getElementById('menu-container');
  menuContainer.innerHTML = `
    <div class="error-message">
      <p>Unable to load menu. Please check your connection and refresh the page.</p>
    </div>
  `;
}

/* ===== Modal Functions ===== */
function openModal(item) {
  currentModalItem = item;
  
  document.getElementById('modal-img').src = item.image_url || 'image/placeholder.jpg';
  document.getElementById('modal-title').textContent = item.name;
  document.getElementById('modal-desc').textContent = item.description;
  document.getElementById('modal-price').textContent = `$${parseFloat(item.price).toFixed(2)}`;
  
  // Set data attributes for modal cart button
  const modalCartBtn = document.getElementById('modal-cart');
  modalCartBtn.setAttribute('data-id', item.id);
  modalCartBtn.setAttribute('data-name', item.name);
  modalCartBtn.setAttribute('data-price', item.price);
  modalCartBtn.setAttribute('data-img', item.image_url);
  modalCartBtn.setAttribute('data-desc', item.description);
  
  document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  currentModalItem = null;
}

function addToCartModal() {
  const modalCartBtn = document.getElementById('modal-cart');
  const menu_item_id = modalCartBtn.getAttribute('data-id');
  const name = modalCartBtn.getAttribute('data-name');
  const price = modalCartBtn.getAttribute('data-price');
  const img = modalCartBtn.getAttribute('data-img');
  const desc = modalCartBtn.getAttribute('data-desc');
  
  // Regular items don't get variants
  addToCart(menu_item_id, name, price, img, desc);
  closeModal();
}

/* ===== Search Functionality ===== */
function initSearch() {
  const input = document.getElementById('menu-search');
  if (!input) return;

  input.addEventListener('input', () => {
    const query = input.value.toLowerCase().trim();
    const items = document.querySelectorAll('.item');
    
    items.forEach(item => {
      const name = (item.querySelector('.dish-name')?.textContent || '').toLowerCase();
      const desc = (item.querySelector('.desc')?.textContent || '').toLowerCase();
      const shouldShow = !query || name.includes(query) || desc.includes(query);
      
      item.style.display = shouldShow ? '' : 'none';
      
      // Show/hide category headings based on visible items
      if (shouldShow) {
        const categoryHeading = item.closest('.items-grid')?.previousElementSibling;
        if (categoryHeading && categoryHeading.classList.contains('menu-heading')) {
          categoryHeading.style.display = '';
        }
      }
    });
    
    // Hide empty categories
    document.querySelectorAll('.menu-heading').forEach(heading => {
      const itemsGrid = heading.nextElementSibling;
      if (itemsGrid && itemsGrid.classList.contains('items-grid')) {
        const visibleItems = itemsGrid.querySelectorAll('.item[style=""]');
        heading.style.display = visibleItems.length > 0 ? '' : 'none';
      }
    });
  });
}

/* ===== Initialize Dynamic IDs from Menu Data ===== */
async function initializeDynamicIds() {
  try {
    const response = await fetch('/api/menu');
    if (!response.ok) throw new Error('Failed to fetch menu');
    
    const menuItems = await response.json();
    
    menuItems.forEach(item => {
      const name = item.name.toLowerCase();
      
      if (name.includes('breakfast combo') || name.includes('breakfast combination')) {
        dynamicItemIds.breakfast_combo = item.id;
        console.log('✅ Found Breakfast Combo ID:', item.id);
      } 
      else if (name.includes('lunch combo') || name.includes('lunch combination')) {
        dynamicItemIds.lunch_combo = item.id;
        console.log('✅ Found Lunch Combo ID:', item.id);
      }
      else if (name.includes('soda') || name.includes('drink')) {
        dynamicItemIds.soda = item.id;
        console.log('✅ Found Soda ID:', item.id);
      }
    });
    
    // Log any missing IDs
    Object.entries(dynamicItemIds).forEach(([key, value]) => {
      if (!value) {
        console.warn(`⚠️ Could not find ID for: ${key}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error initializing dynamic IDs:', error);
  }
}

/* ===== Get Dynamic ID with Fallback ===== */
function getDynamicId(itemKey, fallbackName) {
  const id = dynamicItemIds[itemKey];
  
  if (!id) {
    console.error(`❌ No ID found for ${itemKey}. Using fallback for: ${fallbackName}`);
    showToast(`Error loading ${fallbackName}. Please refresh the page.`);
    return null;
  }
  
  return id;
}

/* ===== Combo Modal Functions ===== */
function openComboModal(type) {
  const comboId = getDynamicId(`${type}_combo`, `${type} combo`);
  if (!comboId) return;

  const comboTitleEl = document.getElementById("comboTitle");
  const comboPriceEl = document.getElementById("comboPrice");
  const optionsContainer = document.getElementById("comboOptions");
  const comboImgEl = document.getElementById("comboImg");

  // Store the type and ID for later use
  comboTitleEl.setAttribute('data-combo-type', type);
  comboTitleEl.setAttribute('data-combo-id', comboId);

  comboTitleEl.innerText = type === "breakfast" ? "Choose 2 Breakfast for $17" : "Choose 2 Lunch for $25";
  comboPriceEl.innerText = menuItems[type].price;
  optionsContainer.innerHTML = "";

  menuItems[type].foods.forEach(item => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" name="comboItem" value="${item}"> ${item}`;
    optionsContainer.appendChild(label);
    optionsContainer.appendChild(document.createElement("br"));
  });

  // Limit to 2 checkboxes
  const checkboxes = optionsContainer.querySelectorAll("input[type='checkbox']");
  checkboxes.forEach(cb => {
    cb.addEventListener("change", () => {
      const checked = [...checkboxes].filter(c => c.checked);
      checkboxes.forEach(c => c.disabled = checked.length >= 2 && !c.checked);
    });
  });

  // Set combo image
  comboImgEl.src = type === "breakfast" ? "image/combobreakfast.jpg" : "image/combolunch.webp";

  document.getElementById("comboModal").style.display = "flex";
}

function closeComboModal() {
  document.getElementById("comboModal").style.display = "none";
}

function addComboToCart(event) {
  event.preventDefault();

  const selected = [...document.querySelectorAll("#comboOptions input:checked")]
    .map(cb => cb.value);

  if (selected.length !== 2) {
    showToast("Please select exactly 2 items.");
    return;
  }

  const comboTitleEl = document.getElementById("comboTitle");
  const comboType = comboTitleEl.getAttribute('data-combo-type');
  const menu_item_id = comboTitleEl.getAttribute('data-combo-id');

  if (!menu_item_id) {
    showToast("Error: Could not find combo item. Please refresh the page.");
    return;
  }

  const comboInfo = menuItems[comboType];
  const comboName = comboInfo.title;
  const comboPrice = parseFloat(comboInfo.price);
  const comboDesc = `Combo includes 2 items`;
  const comboImg = comboType === "breakfast" ? "image/combobreakfast.jpg" : "image/combolunch.webp";
  const variant = selected.join(" + ");

  addToCart(menu_item_id, comboName, comboPrice, comboImg, comboDesc, variant);
  closeComboModal();
}

/* ===== Debug Combo Items ===== */
function debugComboItems() {
  console.log('🔍 Debugging combo items...');
  
  // Check what items are in the Combination category
  const menuItems = document.querySelectorAll('.item');
  menuItems.forEach(item => {
    const name = item.querySelector('.dish-name')?.textContent;
    if (name && (name.includes('Combination') || name.includes('Combo'))) {
      console.log('✅ Found combo item:', name);
      console.log('   onclick:', item.onclick ? 'Set' : 'Not set');
    }
  });
}

// Call this in browser console to test
window.debugComboItems = debugComboItems;

/* ===== Drink Modal Functions ===== */
function openDrinkModal() {
  const sodaId = getDynamicId('soda', 'soda');
  if (!sodaId) return;

  // Store the ID for later use
  document.getElementById("drinkModal").setAttribute('data-soda-id', sodaId);
  document.getElementById("drinkModal").style.display = "flex";
}

function closeDrinkModal() {
  document.getElementById("drinkModal").style.display = "none";
}

function addDrinksToCart() {
  const sodaId = document.getElementById("drinkModal").getAttribute('data-soda-id');
  
  if (!sodaId) {
    showToast("Error: Could not find soda item. Please refresh the page.");
    return;
  }

  const checkboxes = document.querySelectorAll("#drinkOptions input[type='checkbox']");
  const selected = [...checkboxes].filter(cb => cb.checked).map(cb => cb.value);

  if (selected.length === 0) {
    showToast("Please select at least one drink.");
    return;
  }

  const basePrice = 3.17;
  const img = "image/Soda.jpeg";
  const variant = selected.join(", ");
  const quantity = selected.length;
  const desc = `Soda selection: ${variant} (${quantity} drink${quantity > 1 ? "s" : ""})`;

  addToCart(sodaId, "Soda", basePrice, img, desc, variant, quantity);

  checkboxes.forEach(cb => (cb.checked = false));
  closeDrinkModal();
}

/* ===== Chechebsa Modal Functions ===== */
const basePrice = 10.99;
const teffPrice = 1.99;

function openChechebsaModal(item) {
  currentModalItem = item;
  
  document.getElementById("chechebsa-img").src = item.image_url || "image/Chechebsa.jpg";
  document.getElementById("chechebsa-title").innerText = item.name;
  document.getElementById("chechebsa-desc").innerText = item.description;
  
  const checkbox = document.getElementById("chechebsa-teff");
  const priceDisplay = document.getElementById("chechebsa-price");

  if (!checkbox || !priceDisplay) {
    console.error("Missing element: #chechebsa-teff or #chechebsa-price");
    return;
  }
  checkbox.checked = false;
  priceDisplay.innerText = basePrice.toFixed(2);

  checkbox.onchange = () => {
    const newPrice = basePrice + (checkbox.checked ? teffPrice : 0);
    priceDisplay.innerText = newPrice.toFixed(2);
  };

  document.getElementById("chechebsaModal").style.display = "flex";
}

function closeChechebsaModal() {
  document.getElementById("chechebsaModal").style.display = "none";
  currentModalItem = null;
}

function addChechebsaToCart() {
  const checkbox = document.getElementById("chechebsa-teff");
  const variant = checkbox.checked ? "Black Teff" : "Standard";
  const finalPrice = basePrice + (checkbox.checked ? teffPrice : 0);

  const item = currentModalItem;
  const desc = item.description;

  addToCart(item.id, item.name, finalPrice, item.image_url, desc, variant);
  closeChechebsaModal();
}

/* ===== Toast Function ===== */
function showToast(message, duration = 3000) {
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

/* ===== User Authentication Helpers ===== */
async function mergeSessionCartToUser(userId) {
  const sessionId = localStorage.getItem('moya_session_id');
  if (!sessionId) return;

  try {
    const response = await fetch('/api/cart/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, user_id: userId })
    });

    if (response.ok) {
      console.log('Session cart merged to user cart');
      // Don't remove session_id - it's still needed for future guest sessions
      updateCartCount();
    } else {
      console.error('Failed to merge cart');
    }
  } catch (err) {
    console.error('Error merging cart:', err);
  }
}

function updateUserInterface() {
  const user = getCurrentUser();
  const userIcon = document.querySelector('a[href="signin.html"] img');
  
  if (user && userIcon) {
    // Change icon or text to indicate logged in status
    userIcon.src = "https://cdn-icons-png.flaticon.com/512/1077/1077114.png"; // Different icon for logged in
    userIcon.alt = "My Account";
    
    // You could also update the link to go to account page instead of signin
    const userLink = userIcon.closest('a');
    userLink.href = "account.html";
  }
}

/* ===== Enhanced Initialization ===== */
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize current user
  currentUser = getCurrentUser();
  console.log('👤 Current user:', currentUser ? 'Logged in' : 'Guest');
  
  // Update UI based on login status
  updateUserInterface();
  
  // Load menu items first, then initialize dynamic IDs for soda and combo
  await loadMenuItems();
  await initializeDynamicIds();
  
  // Update cart count on load
  updateCartCount();
  
  // Initialize search functionality
  initSearch();
  
  // Close modals when clicking outside
  window.addEventListener('click', (event) => {
    const modal = document.getElementById('modal');
    const comboModal = document.getElementById('comboModal');
    const drinkModal = document.getElementById('drinkModal');
    const chechebsaModal = document.getElementById('chechebsaModal');
    
    if (event.target === modal) closeModal();
    if (event.target === comboModal) closeComboModal();
    if (event.target === drinkModal) closeDrinkModal();
    if (event.target === chechebsaModal) closeChechebsaModal();
  });
  
  // Add event listeners for cart buttons (for items loaded dynamically)
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('cart') && !e.target.hasAttribute('onclick')) {
      e.preventDefault();
      e.stopPropagation();
      
      const menu_item_id = e.target.dataset.id;
      const price = parseFloat(e.target.dataset.price);
      const name = e.target.dataset.name;
      
      // Special items that need customization
      const specialItems = ['Soda', 'Breakfast Combination', 'Lunch Combination', 'Breakfast Combo', 'Lunch Combo'];
      const isSpecialItem = specialItems.some(itemName => name.includes(itemName));
      
      if (isSpecialItem) {
        if (name.includes('Combination') || name.includes('Combo')) {
          const comboType = name.toLowerCase().includes('breakfast') ? 'breakfast' : 'lunch';
          openComboModal(comboType);
        } else if (name === 'Soda') {
          openDrinkModal();
        }
      } else {
        // Regular items and Chechebsa - no variant needed or use their own modal
        if (name === 'Chechebsa') {
          const item = {
            id: menu_item_id, // Use the item's own ID
            name: name,
            price: price,
            image_url: e.target.dataset.img,
            description: e.target.dataset.desc
          };
          openChechebsaModal(item);
        } else {
          // Regular items
          addToCart(menu_item_id, name, price, e.target.dataset.img, e.target.dataset.desc);
        }
      }
    }
  });
});

/* ===== Test Function ===== */
function testAddToCart() {
  console.log('🧪 Testing add to cart...');
  
  // Test with a simple menu item (Ful - ID should be from your database)
  addToCart(1, 'Ful', 10.99, 'image/ful.jpeg', 'Fava beans cooked with minced onions and tomatoes');
}

// Call this in browser console to test
window.testAddToCart = testAddToCart;

// Debug function to check current state
function debugAuthState() {
  console.log('🔍 Auth Debug:');
  console.log('Current User:', getCurrentUser());
  console.log('Session ID:', getSessionId());
  console.log('Cart Identifier:', getCartIdentifier());
}

/* ===== Debug Helper ===== */
function debugDynamicIds() {
  console.log('🔍 Dynamic IDs Debug:');
  console.log('Breakfast Combo ID:', dynamicItemIds.breakfast_combo);
  console.log('Lunch Combo ID:', dynamicItemIds.lunch_combo);
  console.log('Soda ID:', dynamicItemIds.soda);
  
  // Test if we can find the items in the menu
  const menuItems = document.querySelectorAll('.item');
  menuItems.forEach(item => {
    const name = item.querySelector('.dish-name')?.textContent;
    if (name && (name.includes('Combo') || name.includes('Combination') || name.includes('Soda'))) {
      console.log('📋 Found in menu:', name);
    }
  });
}

// Call this in browser console to test
window.debugDynamicIds = debugDynamicIds;
}