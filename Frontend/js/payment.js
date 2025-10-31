// Load total from cart and initialize payment
// Stripe setup
const stripePublicKey = 'pk_test_51SKqaCCb8bUrtyvze9mR2Gmo0skAquUf2YxNpp7NwFfwtDWRdzmj75SLMHG7gfkyScZngYaBDuAsQpnLRsGSWaEr00FdeQMUVz';

// Initialize Stripe
const stripe = Stripe(stripePublicKey);
let elements, cardElement;

function initializePayment() {
    console.log('💰 Initializing payment system...');
    loadCartTotal();
    setupPaymentMethods();
    setupEventListeners();
    setupEnhancedEventListeners();
    loadOrderSummary();
    setupStripeElements();
}

// Load total from cart
function loadCartTotal() {
    const total = localStorage.getItem('cartTotal') || '0.00';
    const totalAmount = parseFloat(total).toFixed(2);
    
    console.log('📊 Cart total loaded:', totalAmount);
    
    // Update all total displays
    const amountElement = document.getElementById('amount');
    if (amountElement) {
        amountElement.textContent = totalAmount;
    }
    
    updatePaymentButton(totalAmount);
    updatePaymentMethodLabels(totalAmount);
    
    return totalAmount;
}

// Update payment button with total
function updatePaymentButton(amount) {
    const payButton = document.getElementById('payButton');
    if (payButton) {
        payButton.innerHTML = `<i class="fas fa-lock"></i> Pay $${amount}`;
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
            payButton.innerHTML = `<i class="fas fa-lock"></i> Pay $${totalAmount}`;
        } else {
            payButton.innerHTML = `<i class="fas fa-lock"></i> Pay $${totalAmount} with ${method.charAt(0).toUpperCase() + method.slice(1)}`;
        }
    }
}

// ========== STRIPE ELEMENTS ==========
function setupStripeElements() {
    const container = document.getElementById('payment-element');
    if (!container) {
        console.warn('⚠️ Stripe container (#payment-element) not found');
        return;
    }

    console.log('💳 Setting up Stripe Elements...');
    elements = stripe.elements();
    cardElement = elements.create('card', {
        style: {
            base: { fontSize: '16px', color: '#32325d', '::placeholder': { color: '#a0aec0' } },
            invalid: { color: '#fa755a' },
        },
    });
    cardElement.mount('#payment-element');
    console.log('✅ Stripe Elements mounted');
}

// ========== STRIPE PAYMENT ==========
async function processStripePayment(totalAmount) {
    console.log('💳 Stripe payment for $' + totalAmount);
    const payButton = document.getElementById('payButton');

    if (!validateForm()) {
        alert('Please fill in all required fields.');
        return;
    }

    try {
        payButton.disabled = true;
        payButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processing...`;

        const amountCents = Math.round(parseFloat(totalAmount) * 100);

        console.log('💰 Creating payment intent for:', amountCents + ' cents');
        
        const res = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: amountCents, currency: 'usd' })
        });

        console.log('📡 Stripe API response status:', res.status, res.statusText);

        // Check if response is JSON before parsing
        const contentType = res.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
            data = await res.json();
        } else {
            const textResponse = await res.text();
            console.error('❌ Stripe API returned non-JSON response:', textResponse.substring(0, 200));
            
            if (res.status === 404) {
                throw new Error('Payment service unavailable (Stripe endpoint not found). Please try cash payment.');
            } else {
                throw new Error('Payment service temporarily unavailable. Please try again later.');
            }
        }

        if (!data.clientSecret) throw new Error('Invalid Stripe response');

        const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
            payment_method: { card: cardElement }
        });

        if (error) throw new Error(error.message);
        if (paymentIntent.status === 'succeeded') {
            console.log('✅ Stripe success');
            await processPayment('card', totalAmount);
        }
    } catch (err) {
        alert('Payment failed: ' + err.message);
        console.error('❌ Stripe payment error:', err);
    } finally {
        payButton.disabled = false;
        payButton.innerHTML = `<i class="fas fa-lock"></i> Pay $${totalAmount}`;
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
    
    // ZIP code formatting - IMPROVED
    const zipInput = document.getElementById('zipCode');
    if (zipInput) {
        zipInput.addEventListener('input', e => {
            let value = e.target.value.replace(/\D/g, '');
            // Only allow 5 digits for basic ZIP code
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
                console.log('✅ Form validation passed, processing payment...');
                
                // Route to appropriate payment processor
                if (selectedMethod === 'card') {
                    await processStripePayment(totalAmount);
                } else {
                    await processPayment(selectedMethod, totalAmount);
                }
            } else {
                console.log('❌ Form validation failed');
            }
        });
    } else {
        console.error('❌ Payment form (#paymentForm) not found!');
    }

    // Listen for cart updates from other tabs
    window.addEventListener('storage', (e) => {
        if (e.key === 'cartTotal') {
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

        // Validate ZIP code format for delivery - SIMPLIFIED
        if (deliveryZip) {
            const zipRegex = /^\d{5}$/; // Only 5 digits required
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
    
    // Only validate email if the field exists
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
        // Validate ZIP code format only if field exists and has value - SIMPLIFIED
        const zipRegex = /^\d{5}$/; // Only require 5 digits
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
            } else {
                // Validate expiry date is not in the past
                const [month, year] = expiry.split('/');
                const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
                const currentDate = new Date();
                if (expiryDate < currentDate) {
                    console.log('❌ Card has expired');
                    document.getElementById('expiryDateError')?.style?.setProperty('display', 'block', 'important');
                    document.getElementById('expiryDateError').textContent = 'Card has expired';
                    isValid = false;
                }
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
        // Scroll to the first error
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

// ===== ENHANCED PAYMENT PROCESSING WITH ORDER CREATION =====
async function processPayment(paymentMethod, totalAmount) {
    console.log('💳 Processing payment:', paymentMethod);
    
    const payButton = document.getElementById('payButton');
    
    try {
        // Show processing state
        payButton.classList.add('loading');
        payButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processing $${totalAmount}...`;
        
        // Get cart data with better debugging
        const cartData = loadCartData();
        console.log('🛒 Cart data loaded:', cartData);
        
        if (!cartData || !cartData.items || cartData.items.length === 0) {
            throw new Error('Your cart is empty. Please add items to your cart before payment.');
        }

        // Get user and session info
        const user = JSON.parse(localStorage.getItem('user'));
        const sessionId = localStorage.getItem('moya_session_id');

        // ✅ FIXED: Get customer information from ACTUAL form fields
        const customerName = document.getElementById('customerName')?.value?.trim() || 'Guest Customer';
        const customerPhone = document.getElementById('customerPhone')?.value?.trim() || 'Not provided';
        const customerEmail = document.getElementById('email')?.value?.trim() || (user ? user.email : 'guest@example.com');

        console.log('👤 Customer info:', { customerName, customerPhone, customerEmail });

        // ✅ FIXED: Create order data with safe defaults
        const orderData = {
            items: cartData.items.map(item => ({
                id: item.menu_item_id,
                name: item.name,
                price: parseFloat(item.price || item.unit_price),
                quantity: parseInt(item.quantity),
                variant: item.variant || null,
                specialInstructions: item.special_instructions || '',
                total: parseFloat(item.total_price || (item.price * item.quantity))
            })),
            total: parseFloat(cartData.total),
            subtotal: parseFloat(cartData.subtotal),
            tax: parseFloat(cartData.tax),
            orderType: document.getElementById('order-type')?.value || 'dine-in',
            paymentMethod: paymentMethod,
            paymentStatus: 'paid',
            notes: document.getElementById('special-instructions')?.value || '',
            user_id: user ? user.id : null,
            session_id: sessionId || null,
            customerName: customerName,
            customerPhone: customerPhone,
            customerEmail: customerEmail
        };

        // Add delivery address if applicable
        if (orderData.orderType === 'delivery') {
            orderData.deliveryAddress = {
                street: document.getElementById('delivery-street')?.value || '',
                city: document.getElementById('delivery-city')?.value || '',
                zipCode: document.getElementById('delivery-zip')?.value || ''
            };
        }

        console.log('📦 COMPLETE order data being sent:', JSON.stringify(orderData, null, 2));

        console.log('📦 Sending order to server...');
       
        // ✅ Send to backend WITH DEBUGGING
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        console.log('📡 Response status:', response.status, response.statusText);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Order creation failed:', errorText);
            throw new Error(`Failed to save order: ${errorText}`);
        }

        const savedOrder = await response.json();
        console.log('✅ Order saved successfully:', savedOrder);

        // Show success message
        showSuccessMessage(savedOrder);

        // Store for confirmation page
        localStorage.setItem('lastOrder', JSON.stringify(savedOrder));

        // Clear cart after successful order
        await clearCartAfterPayment();
        
        // Redirect to confirmation page after 3 seconds
        setTimeout(() => {
            window.location.href = 'confirmation.html';
        }, 3000);
        
    } catch (error) {
        console.error('❌ Payment processing error:', error);
        
        // Reset payment button
        if (payButton) {
            payButton.classList.remove('loading');
            payButton.innerHTML = `<i class="fas fa-lock"></i> Pay $${totalAmount}`;
        }
        
        alert(`Payment failed: ${error.message}`);
    }
}

// ===== SHOW SUCCESS MESSAGE =====
function showSuccessMessage(order) {
    // Create success message element
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
                <i class="fas fa-check-circle"></i> Order Placed Successfully!
            </h3>
            <p style="margin: 0.25rem 0;">
                <strong>Order Number:</strong> ${order.order_number}
            </p>
            <p style="margin: 0.25rem 0;">
                <strong>Total:</strong> $${order.total}
            </p>
            <p style="margin: 0.25rem 0;">
                <strong>Status:</strong> ${order.status}
            </p>
            <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">
                Redirecting to confirmation page...
            </p>
        </div>
    `;
    
    // Insert success message before the form
    const paymentContainer = document.querySelector('.payment-container');
    const form = document.getElementById('paymentForm');
    paymentContainer.insertAdjacentHTML('beforeend', successHTML);
    
    // Hide the pay button
    const payButton = document.getElementById('payButton');
    if (payButton) {
        payButton.style.display = 'none';
    }
}

// Clear all cart data after successful order
async function clearCartAfterPayment() {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const sessionId = localStorage.getItem('moya_session_id');

    // Optional backend clear request if your API supports it
    await fetch('/api/cart/clear', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user ? user.id : null,
        session_id: sessionId || null
      })
    });

    // Clear local cart data
    localStorage.removeItem('cartItems');
    localStorage.removeItem('cartData');
    localStorage.removeItem('cartTotal');
    localStorage.removeItem('cartSubtotal');
    localStorage.removeItem('cartTax');
    localStorage.removeItem('pendingCartData');

    console.log('✅ Cart cleared successfully after payment');
  } catch (error) {
    console.error('❌ Failed to clear cart after payment:', error);
  }
  
}

// Load complete cart data - IMPROVED VERSION
function loadCartData() {
    try {
        console.log('🛒 Loading cart data from localStorage...');
        
        // Check all possible cart storage locations
        const cartData = JSON.parse(localStorage.getItem('cartData') || 'null');
        const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
        const pendingCartData = JSON.parse(localStorage.getItem('pendingCartData') || 'null');
        
        console.log('📦 cartData:', cartData);
        console.log('📦 cartItems:', cartItems);
        console.log('📦 pendingCartData:', pendingCartData);
        
        // Try cartData first (most complete)
        if (cartData && cartData.items && cartData.items.length > 0) {
            console.log('✅ Using cartData with', cartData.items.length, 'items');
            return cartData;
        }
        
        // Try cartItems array
        if (cartItems && cartItems.length > 0) {
            console.log('✅ Using cartItems with', cartItems.length, 'items');
            const subtotal = calculateSubtotal(cartItems);
            const taxRate = 0.085;
            const tax = subtotal * taxRate;
            const total = subtotal + tax;
            
            return {
                items: cartItems,
                subtotal: subtotal.toFixed(2),
                tax: tax.toFixed(2),
                total: total.toFixed(2)
            };
        }
        
        // Try pendingCartData
        if (pendingCartData && pendingCartData.items && pendingCartData.items.length > 0) {
            console.log('✅ Using pendingCartData with', pendingCartData.items.length, 'items');
            return pendingCartData;
        }
        
        console.log('❌ No cart data found in any storage location');
        return { items: [], subtotal: '0.00', tax: '0.00', total: '0.00' };
        
    } catch (error) {
        console.error('❌ Error loading cart data:', error);
        return { items: [], subtotal: '0.00', tax: '0.00', total: '0.00' };
    }
}

// Calculate subtotal from cart items
function calculateSubtotal(cartItems) {
    return cartItems.reduce((sum, item) => {
        const itemTotal = item.total_price ? parseFloat(item.total_price) : 
                         (item.custom_price ? parseFloat(item.custom_price) : parseFloat(item.price)) * item.quantity;
        return sum + itemTotal;
    }, 0);
}

// Load order summary from cart
async function loadOrderSummary() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const sessionId = localStorage.getItem('moya_session_id');
        
        let identifier;
        if (user && user.id) {
            identifier = user.id;
        } else if (sessionId) {
            identifier = sessionId;
        } else {
            return;
        }

        const response = await fetch(`/api/cart/${identifier}`);
        if (!response.ok) throw new Error('Failed to load cart');
        
        const cartItems = await response.json();
        displayOrderSummary(cartItems);
        
    } catch (error) {
        console.error('Error loading order summary:', error);
    }
}

function displayOrderSummary(cartItems) {
    // If you have an order summary section, update it here
    const orderSummary = document.getElementById('orderSummary');
    if (orderSummary) {
        let html = '<h3>Order Items:</h3>';
        cartItems.forEach(item => {
            const itemTotal = item.total_price || (item.price * item.quantity);
            html += `
                <div class="order-item">
                    <span>${item.name} x ${item.quantity}</span>
                    <span>$${parseFloat(itemTotal).toFixed(2)}</span>
                </div>
            `;
        });
        orderSummary.innerHTML = html;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('💳 Payment page loaded');
    initializePayment();
});

// Export functions for global access
window.loadCartTotal = loadCartTotal;
window.processPayment = processPayment;
window.processStripePayment = processStripePayment;