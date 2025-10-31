// Load total from cart and initialize payment (Static Version)
// Stripe is removed since we can't process real payments without backend

function initializePayment() {
    console.log('💰 Initializing payment system (Static Version)...');
    loadCartTotal();
    setupPaymentMethods();
    setupEventListeners();
    setupEnhancedEventListeners();
    loadOrderSummary();
}

// Load total from cart
function loadCartTotal() {
    const cart = getCart();
    const subtotal = calculateCartSubtotal(cart);
    const tax = subtotal * 0.085; // 8.5% tax
    const total = subtotal + tax;
    const totalAmount = total.toFixed(2);
    
    console.log('📊 Cart total calculated:', totalAmount);
    
    // Update all total displays
    const amountElement = document.getElementById('amount');
    if (amountElement) {
        amountElement.textContent = totalAmount;
    }
    
    updatePaymentButton(totalAmount);
    updatePaymentMethodLabels(totalAmount);
    
    // Store for later use
    localStorage.setItem('cartTotal', totalAmount);
    localStorage.setItem('cartSubtotal', subtotal.toFixed(2));
    localStorage.setItem('cartTax', tax.toFixed(2));
    
    return totalAmount;
}

// Get cart from localStorage
function getCart() {
    const cart = localStorage.getItem('moya_cart');
    return cart ? JSON.parse(cart) : [];
}

// Calculate cart subtotal
function calculateCartSubtotal(cart) {
    return cart.reduce((sum, item) => {
        return sum + (parseFloat(item.price) * parseInt(item.quantity));
    }, 0);
}

// Update payment button with total
function updatePaymentButton(amount) {
    const payButton = document.getElementById('payButton');
    if (payButton) {
        payButton.innerHTML = `<i class="fas fa-lock"></i> Complete Order $${amount}`;
    }
}

// Update payment method labels with total
function updatePaymentMethodLabels(amount) {
    document.querySelectorAll('.payment-method').forEach(method => {
        const methodType = method.getAttribute('data-method');
        const methodLabel = method.querySelector('.method-label');
        if (methodLabel) {
            methodLabel.textContent = `${methodType.charAt(0).toUpperCase() + methodType.slice(1)} · $${amount}`;
        }
    });
}

// Payment method selection
function setupPaymentMethods() {
    const paymentMethods = document.querySelectorAll('.payment-method');
    
    console.log('💳 Setting up payment methods:', paymentMethods.length);
    
    paymentMethods.forEach(method => {
        method.addEventListener('click', () => {
            paymentMethods.forEach(m => m.classList.remove('active'));
            method.classList.add('active');
            const selectedMethod = method.getAttribute('data-method');
            console.log('✅ Payment method selected:', selectedMethod);
            handlePaymentMethodChange(selectedMethod);
        });
    });
    
    // Auto-select first payment method if none selected
    if (!document.querySelector('.payment-method.active') && paymentMethods.length > 0) {
        paymentMethods[0].classList.add('active');
        const defaultMethod = paymentMethods[0].getAttribute('data-method');
        console.log('🔘 Auto-selected payment method:', defaultMethod);
        handlePaymentMethodChange(defaultMethod);
    }
}

function handlePaymentMethodChange(method) {
    const totalAmount = parseFloat(localStorage.getItem('cartTotal') || '0.00').toFixed(2);
    const cardForm = document.getElementById('cardForm');
    const payButton = document.getElementById('payButton');
    
    console.log('🔄 Handling payment method change to:', method);
    
    if (cardForm) {
        cardForm.style.display = method === 'card' ? 'block' : 'none';
    }
    
    if (payButton) {
        payButton.style.display = 'flex';
        if (method === 'card') {
            payButton.innerHTML = `<i class="fas fa-lock"></i> Complete Order $${totalAmount}`;
        } else {
            payButton.innerHTML = `<i class="fas fa-lock"></i> Complete Order $${totalAmount} with ${method.charAt(0).toUpperCase() + method.slice(1)}`;
        }
    }
}

// Card input formatting
function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Card number formatting
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', e => {
            let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            e.target.value = value.match(/.{1,4}/g)?.join(' ') || value;
        });
    }
    
    // Expiry date formatting
    const expiryInput = document.getElementById('expiryDate');
    if (expiryInput) {
        expiryInput.addEventListener('input', e => {
            let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            if (value.length >= 2) value = value.substring(0, 2) + '/' + value.substring(2, 4);
            e.target.value = value;
        });
    }
    
    // ZIP code formatting
    const zipInput = document.getElementById('zipCode');
    if (zipInput) {
        zipInput.addEventListener('input', e => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 5) value = value.substring(0, 5);
            e.target.value = value;
        });
    }

    // Form submission
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', async e => {
            e.preventDefault();
            console.log('🔄 Form submission started...');
            
            const selectedMethod = document.querySelector('.payment-method.active')?.getAttribute('data-method');
            const totalAmount = parseFloat(localStorage.getItem('cartTotal') || '0.00').toFixed(2);
            
            console.log('Selected payment method:', selectedMethod);
            console.log('Total amount:', totalAmount);
            
            // Validate payment method is selected
            if (!selectedMethod) {
                alert('Please select a payment method');
                return;
            }
            
            // Validate cart has items
            if (parseFloat(totalAmount) <= 0) {
                alert('Your cart is empty. Please add items before proceeding to payment.');
                return;
            }
            
            console.log('🔍 Validating form...');
            if (validateForm()) { 
                console.log('✅ Form validation passed, processing order...');
                
                // Process order (static version - no real payment)
                await processOrder(selectedMethod, totalAmount);
            } else {
                console.log('❌ Form validation failed');
            }
        });
    } else {
        console.error('❌ Payment form (#paymentForm) not found!');
    }

    // Listen for cart updates from other tabs
    window.addEventListener('storage', (e) => {
        if (e.key === 'moya_cart') {
            loadCartTotal();
        }
    });
}

function validateForm() {
    let isValid = true;
    const selectedMethod = document.querySelector('.payment-method.active')?.getAttribute('data-method');
    const totalAmount = parseFloat(localStorage.getItem('cartTotal') || '0.00').toFixed(2);
    
    console.log('🔍 Starting form validation...');
    console.log('Selected method:', selectedMethod);
    console.log('Total amount:', totalAmount);
    
    // Hide all error messages first
    document.querySelectorAll('.error-message').forEach(e => {
        if (e.style) e.style.display = 'none';
    });

    // ===== VALIDATE PAYMENT METHOD SELECTION =====
    if (!selectedMethod) {
        console.log('❌ No payment method selected');
        alert('Please select a payment method');
        return false;
    }

    // ===== VALIDATE CART =====
    if (parseFloat(totalAmount) <= 0) {
        console.log('❌ Cart is empty');
        alert('Your cart is empty. Please add items before proceeding to payment.');
        return false;
    }

    // ===== VALIDATE ORDER TYPE =====
    const orderType = document.getElementById('order-type')?.value;
    if (document.getElementById('order-type') && !orderType) {
        console.log('❌ No order type selected');
        alert('Please select an order type');
        return false;
    }

    // ===== VALIDATE DELIVERY ADDRESS IF DELIVERY IS SELECTED =====
    if (orderType === 'delivery') {
        console.log('🔍 Validating delivery address...');
        const deliveryStreet = document.getElementById('delivery-street')?.value?.trim();
        const deliveryCity = document.getElementById('delivery-city')?.value?.trim();
        const deliveryZip = document.getElementById('delivery-zip')?.value?.trim();
        
        if (document.getElementById('delivery-street') && !deliveryStreet) {
            console.log('❌ Missing delivery street');
            alert('Please enter delivery street address');
            return false;
        }
        
        if (document.getElementById('delivery-city') && !deliveryCity) {
            console.log('❌ Missing delivery city');
            alert('Please enter delivery city');
            return false;
        }
        
        if (document.getElementById('delivery-zip') && !deliveryZip) {
            console.log('❌ Missing delivery ZIP code');
            alert('Please enter delivery ZIP code');
            return false;
        }

        // Validate ZIP code format for delivery
        if (deliveryZip) {
            const zipRegex = /^\d{5}$/;
            if (!zipRegex.test(deliveryZip.replace(/\s/g, ''))) {
                console.log('❌ Invalid delivery ZIP code format:', deliveryZip);
                alert('Please enter a valid 5-digit ZIP code');
                return false;
            }
        }
    }

    // ===== VALIDATE CONTACT INFORMATION =====
    const emailInput = document.getElementById('email');
    const email = emailInput?.value?.trim();
    
    if (emailInput) {
        if (!email) {
            console.log('❌ Missing email');
            document.getElementById('emailError')?.style?.setProperty('display', 'block', 'important');
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            console.log('❌ Invalid email format:', email);
            document.getElementById('emailError')?.style?.setProperty('display', 'block', 'important');
            isValid = false;
        }
    }

    // ===== VALIDATE BILLING ADDRESS FIELDS (ONLY IF THEY EXIST) =====
    const addressInput = document.getElementById('address');
    const address = addressInput?.value?.trim();
    if (addressInput && !address) {
        console.log('❌ Missing billing address');
        document.getElementById('addressError')?.style?.setProperty('display', 'block', 'important');
        isValid = false;
    }
    
    const cityInput = document.getElementById('city');
    const city = cityInput?.value?.trim();
    if (cityInput && !city) {
        console.log('❌ Missing billing city');
        document.getElementById('cityError')?.style?.setProperty('display', 'block', 'important');
        isValid = false;
    }
    
    const stateInput = document.getElementById('state');
    const state = stateInput?.value;
    if (stateInput && !state) {
        console.log('❌ Missing billing state');
        document.getElementById('stateError')?.style?.setProperty('display', 'block', 'important');
        isValid = false;
    }
    
    const zipInput = document.getElementById('zipCode');
    const zip = zipInput?.value?.trim();
    if (zipInput && !zip) {
        console.log('❌ Missing billing ZIP code');
        document.getElementById('zipCodeError')?.style?.setProperty('display', 'block', 'important');
        isValid = false;
    } else if (zipInput && zip) {
        const zipRegex = /^\d{5}$/;
        if (!zipRegex.test(zip.replace(/\s/g, ''))) {
            console.log('❌ Invalid billing ZIP code format:', zip);
            document.getElementById('zipCodeError')?.style?.setProperty('display', 'block', 'important');
            document.getElementById('zipCodeError').textContent = 'Please enter a valid 5-digit ZIP code';
            isValid = false;
        }
    }

    // ===== VALIDATE CARD DETAILS IF CARD PAYMENT IS SELECTED =====
    if (selectedMethod === 'card') {
        console.log('🔍 Validating card details...');
        const cardNumberInput = document.getElementById('cardNumber');
        const expiryInput = document.getElementById('expiryDate');
        const cvvInput = document.getElementById('cvv');
        const nameInput = document.getElementById('cardholderName');
        
        const cardNumber = cardNumberInput?.value.replace(/\s/g, '') || '';
        const expiry = expiryInput?.value || '';
        const cvv = cvvInput?.value || '';
        const name = nameInput?.value?.trim() || '';
        
        console.log('Card validation - Number:', cardNumber ? '***' + cardNumber.slice(-4) : 'empty', 
                    'Expiry:', expiry || 'empty', 
                    'CVV:', cvv ? '***' : 'empty', 
                    'Name:', name || 'empty');
        
        // Validate card number (only if field exists)
        if (cardNumberInput) {
            if (!cardNumber) {
                console.log('❌ Missing card number');
                document.getElementById('cardNumberError')?.style?.setProperty('display', 'block', 'important');
                isValid = false;
            } else if (cardNumber.length < 13 || cardNumber.length > 19) {
                console.log('❌ Invalid card number length:', cardNumber.length);
                document.getElementById('cardNumberError')?.style?.setProperty('display', 'block', 'important');
                document.getElementById('cardNumberError').textContent = 'Card number must be between 13-19 digits';
                isValid = false;
            } else if (!/^\d+$/.test(cardNumber)) {
                console.log('❌ Card number contains non-digits');
                document.getElementById('cardNumberError')?.style?.setProperty('display', 'block', 'important');
                document.getElementById('cardNumberError').textContent = 'Card number must contain only digits';
                isValid = false;
            }
        }
        
        // Validate expiry date (only if field exists)
        if (expiryInput) {
            if (!expiry) {
                console.log('❌ Missing expiry date');
                document.getElementById('expiryDateError')?.style?.setProperty('display', 'block', 'important');
                isValid = false;
            } else if (!/^\d{2}\/\d{2}$/.test(expiry)) {
                console.log('❌ Invalid expiry date format:', expiry);
                document.getElementById('expiryDateError')?.style?.setProperty('display', 'block', 'important');
                document.getElementById('expiryDateError').textContent = 'Please use MM/YY format';
                isValid = false;
            }
        }
        
        // Validate CVV (only if field exists)
        if (cvvInput) {
            if (!cvv) {
                console.log('❌ Missing CVV');
                document.getElementById('cvvError')?.style?.setProperty('display', 'block', 'important');
                isValid = false;
            } else if (cvv.length < 3 || cvv.length > 4) {
                console.log('❌ Invalid CVV length:', cvv.length);
                document.getElementById('cvvError')?.style?.setProperty('display', 'block', 'important');
                document.getElementById('cvvError').textContent = 'CVV must be 3-4 digits';
                isValid = false;
            } else if (!/^\d+$/.test(cvv)) {
                console.log('❌ CVV contains non-digits');
                document.getElementById('cvvError')?.style?.setProperty('display', 'block', 'important');
                document.getElementById('cvvError').textContent = 'CVV must contain only digits';
                isValid = false;
            }
        }
        
        // Validate cardholder name (only if field exists)
        if (nameInput && !name) {
            console.log('❌ Missing cardholder name');
            document.getElementById('cardholderNameError')?.style?.setProperty('display', 'block', 'important');
            isValid = false;
        }
    }

    // ===== FINAL VALIDATION =====
    if (!isValid) {
        console.log('❌ Form validation failed - scrolling to first error');
        const firstError = document.querySelector('.error-message[style*="display: block"]');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return false;
    }

    console.log('✅ Form validation passed');
    return isValid;
}

// ===== ENHANCED EVENT LISTENERS WITH REAL-TIME VALIDATION =====
function setupEnhancedEventListeners() {
    // Real-time email validation
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const email = this.value.trim();
            const errorElement = document.getElementById('emailError');
            if (!errorElement) return;
            
            if (!email) {
                errorElement.textContent = 'Email is required';
                errorElement.style.display = 'block';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                errorElement.textContent = 'Please enter a valid email address';
                errorElement.style.display = 'block';
            } else {
                errorElement.style.display = 'none';
            }
        });
    }
    
    // Real-time card number validation
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('blur', function() {
            const cardNumber = this.value.replace(/\s/g, '');
            const errorElement = document.getElementById('cardNumberError');
            if (!errorElement) return;
            
            if (!cardNumber) {
                errorElement.textContent = 'Card number is required';
                errorElement.style.display = 'block';
            } else if (cardNumber.length < 13 || cardNumber.length > 19) {
                errorElement.textContent = 'Card number must be between 13-19 digits';
                errorElement.style.display = 'block';
            } else if (!/^\d+$/.test(cardNumber)) {
                errorElement.textContent = 'Card number must contain only digits';
                errorElement.style.display = 'block';
            } else {
                errorElement.style.display = 'none';
            }
        });
    }
    
    // Real-time expiry date validation
    const expiryInput = document.getElementById('expiryDate');
    if (expiryInput) {
        expiryInput.addEventListener('blur', function() {
            const expiry = this.value;
            const errorElement = document.getElementById('expiryDateError');
            if (!errorElement) return;
            
            if (!expiry) {
                errorElement.textContent = 'Expiry date is required';
                errorElement.style.display = 'block';
            } else if (!/^\d{2}\/\d{2}$/.test(expiry)) {
                errorElement.textContent = 'Please use MM/YY format';
                errorElement.style.display = 'block';
            } else {
                errorElement.style.display = 'none';
            }
        });
    }

    // Real-time ZIP code validation
    const zipInput = document.getElementById('zipCode');
    if (zipInput) {
        zipInput.addEventListener('blur', function() {
            const zip = this.value.trim();
            const errorElement = document.getElementById('zipCodeError');
            if (!errorElement) return;
            
            if (!zip) {
                errorElement.textContent = 'ZIP code is required';
                errorElement.style.display = 'block';
            } else if (!/^\d{5}$/.test(zip.replace(/\s/g, ''))) {
                errorElement.textContent = 'Please enter a valid 5-digit ZIP code';
                errorElement.style.display = 'block';
            } else {
                errorElement.style.display = 'none';
            }
        });
    }
}

// ===== STATIC ORDER PROCESSING (NO REAL PAYMENT) =====
async function processOrder(paymentMethod, totalAmount) {
    console.log('💳 Processing order (Static Demo):', paymentMethod);
    
    const payButton = document.getElementById('payButton');
    
    try {
        // Show processing state
        payButton.classList.add('loading');
        payButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processing Order...`;
        
        // Get cart data
        const cart = getCart();
        console.log('🛒 Cart items:', cart);
        
        if (!cart || cart.length === 0) {
            throw new Error('Your cart is empty. Please add items to your cart before placing an order.');
        }

        // Get customer information
        const customerName = document.getElementById('customerName')?.value?.trim() || 'Guest Customer';
        const customerPhone = document.getElementById('customerPhone')?.value?.trim() || 'Not provided';
        const customerEmail = document.getElementById('email')?.value?.trim() || 'guest@example.com';

        console.log('👤 Customer info:', { customerName, customerPhone, customerEmail });

        // Create order data
        const orderData = {
            order_number: 'MOYA-' + Date.now(),
            items: cart.map(item => ({
                id: item.menu_item_id,
                name: item.name,
                price: parseFloat(item.price),
                quantity: parseInt(item.quantity),
                variant: item.variant || null,
                total: parseFloat(item.price) * parseInt(item.quantity)
            })),
            total: parseFloat(totalAmount),
            subtotal: parseFloat(localStorage.getItem('cartSubtotal') || '0.00'),
            tax: parseFloat(localStorage.getItem('cartTax') || '0.00'),
            orderType: document.getElementById('order-type')?.value || 'dine-in',
            paymentMethod: paymentMethod,
            paymentStatus: 'demo_complete',
            notes: document.getElementById('special-instructions')?.value || '',
            customerName: customerName,
            customerPhone: customerPhone,
            customerEmail: customerEmail,
            timestamp: new Date().toISOString(),
            estimatedTime: '20-30 minutes',
            status: 'confirmed'
        };

        // Add delivery address if applicable
        if (orderData.orderType === 'delivery') {
            orderData.deliveryAddress = {
                street: document.getElementById('delivery-street')?.value || '',
                city: document.getElementById('delivery-city')?.value || '',
                zipCode: document.getElementById('delivery-zip')?.value || ''
            };
        }

        console.log('📦 Order data created:', orderData);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Show success message
        showSuccessMessage(orderData);

        // Store for confirmation page
        localStorage.setItem('lastOrder', JSON.stringify(orderData));

        // Clear cart after successful order
        clearCartAfterOrder();
        
        // Redirect to confirmation page after 3 seconds
        setTimeout(() => {
            window.location.href = 'confirmation.html';
        }, 3000);
        
    } catch (error) {
        console.error('❌ Order processing error:', error);
        
        // Reset payment button
        if (payButton) {
            payButton.classList.remove('loading');
            payButton.innerHTML = `<i class="fas fa-lock"></i> Complete Order $${totalAmount}`;
        }
        
        alert(`Order failed: ${error.message}`);
    }
}

// ===== SHOW SUCCESS MESSAGE =====
function showSuccessMessage(order) {
    const successHTML = `
        <div class="success-message" style="
            background: #d4edda;
            color: #155724;
            padding: 1.5rem;
            border-radius: 8px;
            border: 1px solid #c3e6cb;
            margin: 1rem 0;
            text-align: center;
        ">
            <h3 style="margin: 0 0 0.5rem 0; color: #155724;">
                <i class="fas fa-check-circle"></i> Order Placed Successfully! (Demo)
            </h3>
            <p style="margin: 0.25rem 0;">
                <strong>Order Number:</strong> ${order.order_number}
            </p>
            <p style="margin: 0.25rem 0;">
                <strong>Total:</strong> $${order.total.toFixed(2)}
            </p>
            <p style="margin: 0.25rem 0;">
                <strong>Payment Method:</strong> ${order.paymentMethod} (Demo)
            </p>
            <p style="margin: 0.25rem 0;">
                <strong>Estimated Ready:</strong> ${order.estimatedTime}
            </p>
            <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">
                <em>This is a demo order. No real payment was processed.</em>
            </p>
            <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">
                Redirecting to confirmation page...
            </p>
        </div>
    `;
    
    // Insert success message before the form
    const paymentContainer = document.querySelector('.payment-container');
    const form = document.getElementById('paymentForm');
    if (paymentContainer && form) {
        paymentContainer.insertAdjacentHTML('beforeend', successHTML);
    }
    
    // Hide the pay button
    const payButton = document.getElementById('payButton');
    if (payButton) {
        payButton.style.display = 'none';
    }
}

// Clear cart after successful order
function clearCartAfterOrder() {
    try {
        // Clear cart data
        localStorage.removeItem('moya_cart');
        localStorage.removeItem('cartTotal');
        localStorage.removeItem('cartSubtotal');
        localStorage.removeItem('cartTax');

        console.log('✅ Cart cleared successfully after order');
    } catch (error) {
        console.error('❌ Failed to clear cart after order:', error);
    }
}

// Load order summary
function loadOrderSummary() {
    const cart = getCart();
    const orderSummary = document.getElementById('orderSummary');
    
    if (orderSummary && cart.length > 0) {
        let html = '<h3>Order Summary</h3>';
        cart.forEach(item => {
            const itemTotal = parseFloat(item.price) * parseInt(item.quantity);
            html += `
                <div class="order-item" style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; padding: 0.5rem 0; border-bottom: 1px solid #eee;">
                    <div>
                        <strong>${item.name}</strong>
                        ${item.variant ? `<br><small>${item.variant}</small>` : ''}
                        <br><small>Qty: ${item.quantity}</small>
                    </div>
                    <div>$${itemTotal.toFixed(2)}</div>
                </div>
            `;
        });
        
        const subtotal = calculateCartSubtotal(cart);
        const tax = subtotal * 0.085;
        const total = subtotal + tax;
        
        html += `
            <div style="border-top: 2px solid #333; margin-top: 1rem; padding-top: 1rem;">
                <div style="display: flex; justify-content: space-between;">
                    <strong>Subtotal:</strong>
                    <span>$${subtotal.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <strong>Tax (8.5%):</strong>
                    <span>$${tax.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 1.2em; font-weight: bold; margin-top: 0.5rem;">
                    <strong>Total:</strong>
                    <span>$${total.toFixed(2)}</span>
                </div>
            </div>
        `;
        
        orderSummary.innerHTML = html;
    } else if (orderSummary) {
        orderSummary.innerHTML = '<p>Your cart is empty</p>';
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('💳 Payment page loaded (Static Version)');
    initializePayment();
});

// Demo function to test with sample data
function demoOrder() {
    // Add sample items to cart for testing
    const sampleCart = [
        {
            menu_item_id: 1,
            name: 'Ful',
            price: 10.99,
            quantity: 2,
            variant: null,
            image: 'image/ful.jpeg'
        },
        {
            menu_item_id: 2,
            name: 'Chechebsa',
            price: 12.99,
            quantity: 1,
            variant: 'With Teff',
            image: 'image/chechebsa.jpg'
        }
    ];
    
    localStorage.setItem('moya_cart', JSON.stringify(sampleCart));
    loadCartTotal();
    loadOrderSummary();
    alert('Demo cart loaded! You can now test the payment form.');
}

// Export functions for global access
window.loadCartTotal = loadCartTotal;
window.processOrder = processOrder;
window.demoOrder = demoOrder;