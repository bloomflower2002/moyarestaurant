function checkAuth() {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    console.log('🔐 Cart Page - Auth check');
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
    }
    
    // Show profile section
    const profileSection = document.getElementById('profile-section');
    if (profileSection) {
        profileSection.style.display = 'block';
        console.log('✅ Showing profile section');
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
    const welcomeName = user.name || user.email.split('@')[0];
    
    if (userAvatar) userAvatar.textContent = userInitial;
    if (dropdownUsername) dropdownUsername.textContent = user.email;
    if (dropdownWelcome) dropdownWelcome.textContent = `Welcome, ${welcomeName}`;
    if (dropdownAvatar) dropdownAvatar.textContent = userInitial;
}

function toggleDropdown() {
    const dropdownMenu = document.getElementById('dropdownMenu');
    if (dropdownMenu) {
        dropdownMenu.classList.toggle('show');
    }
}

function logout() {
    console.log('🚪 Logging out...');
    
    // Clear all auth-related data (no API call)
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('moya_current_user');
    
    updateUIForLoggedOutUser();
    
    // Redirect to home page after a brief delay
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 500);
}

// Enhanced click outside to close dropdown
document.addEventListener('click', function(event) {
    const dropdownMenu = document.getElementById('dropdownMenu');
    const profileDropdown = document.querySelector('.profile-dropdown');
    const signinIcon = document.getElementById('signin-icon');
    
    if (dropdownMenu && profileDropdown && 
        !profileDropdown.contains(event.target) && 
        event.target !== signinIcon) {
        dropdownMenu.classList.remove('show');
    }
});

// Check authentication when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🛒 Cart page loaded - checking authentication...');
    checkAuth();
    
    // Listen for storage changes (if user logs in/out in another tab)
    window.addEventListener('storage', function(e) {
        if (e.key === 'user' || e.key === 'token') {
            checkAuth();
        }
    });
});

// ===== Header scroll effect =====
window.addEventListener('scroll', () => {
  const header = document.querySelector('header');
  if (header) {
    if (window.scrollY > 50) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
});

/* ===== Cart Management (Local Storage Only) ===== */
function getCart() {
    const cart = localStorage.getItem('moya_cart');
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem('moya_cart', JSON.stringify(cart));
    updateCartCount();
    updateTotals();
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('user')) || null;
}

/* ===== Load Cart (Static Version) ===== */
function loadCart() {
    try {
        const cart = getCart();
        console.log('📦 Loading cart from localStorage:', cart);

        const container = document.getElementById("cart-items");
        if (!container) return;

        container.innerHTML = "";
        
        if (cart.length === 0) {
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

        let subtotal = 0;

        // Display cart items
        cart.forEach((item, index) => {
            const lineTotal = parseFloat(item.price) * parseInt(item.quantity);
            subtotal += lineTotal;

            const div = document.createElement("div");
            div.className = "cart-item";
            div.innerHTML = `
                <img src="${item.image || 'image/placeholder.jpg'}" 
                     alt="${item.name}" 
                     onerror="this.src='image/placeholder.jpg'">
                <div class="details">
                    <h2>${item.name}${item.variant ? ` (${item.variant})` : ''}</h2>
                    <p class="desc">${item.description || ''}</p>
                    <div class="quantity">
                        <button onclick="updateQuantity(${index}, ${item.quantity - 1})">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity(${index}, ${item.quantity + 1})">+</button>
                    </div>
                    <p class="price">$${lineTotal.toFixed(2)}</p>
                    <p class="unit-price"><small>$${parseFloat(item.price).toFixed(2)} each</small></p>
                </div>
                <button class="remove" onclick="removeItem(${index})">Remove</button>
            `;
            container.appendChild(div);
        });

        updateTotals(subtotal);
        updateCartCount();

    } catch (error) {
        console.error('❌ Error loading cart:', error);
        const container = document.getElementById("cart-items");
        if (container) {
            container.innerHTML = `
                <div class="error">
                    <p>Error loading cart. Please try again later.</p>
                </div>
            `;
        }
    }
}

/* ===== Update Quantity (Static Version) ===== */
function updateQuantity(itemIndex, newQuantity) {
    if (newQuantity < 0) return;
    
    try {
        console.log('🔄 Updating quantity for item index:', itemIndex, 'to:', newQuantity);
        
        const cart = getCart();
        
        if (itemIndex >= 0 && itemIndex < cart.length) {
            if (newQuantity === 0) {
                // Remove item if quantity becomes 0
                removeItem(itemIndex);
                return;
            }
            
            cart[itemIndex].quantity = newQuantity;
            saveCart(cart);
            showToast('Quantity updated');
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
        showToast('Error updating quantity');
    }
}

/* ===== Remove Item (Static Version) ===== */
function removeItem(itemIndex) {
    try {
        console.log('🗑️ Removing cart item at index:', itemIndex);
        
        const cart = getCart();
        
        if (itemIndex >= 0 && itemIndex < cart.length) {
            const removedItem = cart.splice(itemIndex, 1)[0];
            saveCart(cart);
            showToast(`${removedItem.name} removed from cart`);
        }
    } catch (error) {
        console.error('Error removing item:', error);
        showToast('Error removing item');
    }
}

/* ===== Update Cart Count (Static Version) ===== */
function updateCartCount() {
    try {
        const cart = getCart();
        const totalItems = cart.reduce((sum, item) => sum + parseInt(item.quantity), 0);
        
        // Update cart count in header
        const counter = document.getElementById("cart-count");
        if (counter) {
            counter.textContent = totalItems;
            counter.style.display = totalItems > 0 ? 'flex' : 'none';
        }
        
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

/* ===== Update Totals ===== */
function updateTotals(subtotal = null) {
    try {
        const cart = getCart();
        
        if (subtotal === null) {
            subtotal = cart.reduce((sum, item) => {
                return sum + (parseFloat(item.price) * parseInt(item.quantity));
            }, 0);
        }
        
        const taxRate = 0.085;
        const tax = subtotal * taxRate;
        const total = subtotal + tax;

        const subtotalEl = document.getElementById("subtotal");
        const taxEl = document.getElementById("tax");
        const totalEl = document.getElementById("total");

        if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
        
    } catch (error) {
        console.error('Error updating totals:', error);
    }
}

/* ===== Toast Function ===== */
function showToast(message, duration = 2000) {
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
            <p><em>Note: This is a demo. No real orders will be prepared.</em></p>
        `;
    }
}

/* ===== Checkout Function (Static Version) ===== */
function goToPayment() {
    try {
        const cart = getCart();
        
        if (cart.length === 0) {
            showToast('Your cart is empty');
            return;
        }

        // Calculate totals
        const subtotal = cart.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * parseInt(item.quantity));
        }, 0);
        
        const taxRate = 0.085;
        const tax = subtotal * taxRate;
        const total = subtotal + tax;

        // Store cart data for payment page
        const cartData = {
            items: cart,
            subtotal: subtotal.toFixed(2),
            tax: tax.toFixed(2),
            total: total.toFixed(2)
        };

        console.log('💳 Passing to payment:', cartData);

        // Store in localStorage for payment page
        localStorage.setItem('cartTotal', total.toFixed(2));
        localStorage.setItem('cartSubtotal', subtotal.toFixed(2));
        localStorage.setItem('cartTax', tax.toFixed(2));
        localStorage.setItem('cartData', JSON.stringify(cartData));

        const user = getCurrentUser();
        if (!user) {
            // User is NOT logged in - redirect to signin with return URL to payment
            console.log('🔐 User not logged in, redirecting to signin...');
            localStorage.setItem('pendingCartData', JSON.stringify(cartData));
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
    console.log('🛒 Cart page initialized (Static Version)');
    
    // Load cart items
    loadCart();
    
    // Show pickup time estimate
    showPickupTime();
    
    // Update cart count
    updateCartCount();
});

/* ===== Demo Functions for Testing ===== */
function addDemoItems() {
    const demoCart = [
        {
            menu_item_id: 1,
            name: 'Ful',
            price: 10.99,
            quantity: 2,
            image: 'image/ful.jpeg',
            description: 'Fava beans cooked with minced onions and tomatoes'
        },
        {
            menu_item_id: 2,
            name: 'Chechebsa',
            price: 12.99,
            quantity: 1,
            variant: 'With Teff',
            image: 'image/Chechebsa.jpg',
            description: 'Crispy fried dough with spiced butter and berbere'
        },
        {
            menu_item_id: 3,
            name: 'Soda',
            price: 3.17,
            quantity: 3,
            variant: 'Coke, Sprite, Fanta',
            image: 'image/Soda.jpeg',
            description: 'Assorted soft drinks'
        }
    ];
    
    localStorage.setItem('moya_cart', JSON.stringify(demoCart));
    loadCart();
    showToast('Demo items added to cart!');
}

function clearCart() {
    if (confirm('Are you sure you want to clear your cart?')) {
        localStorage.removeItem('moya_cart');
        loadCart();
        showToast('Cart cleared');
    }
}

// Make functions available globally for testing
window.addDemoItems = addDemoItems;
window.clearCart = clearCart;
window.debugCart = function() {
    console.log('🔍 Cart Debug Info:');
    console.log('Current Cart:', getCart());
    console.log('Current User:', getCurrentUser());
};