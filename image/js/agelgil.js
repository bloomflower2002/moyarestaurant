// DOM Elements (keeps your existing IDs)
const popupOverlay = document.getElementById('popupOverlay');
const openPopupBtn = document.getElementById('openPopupBtn');
const closeBtn = document.getElementById('closeBtn');
const agelgilTypes = document.querySelectorAll('.agelgil-type'); // unchanged
const agelgilTypeSelect = document.getElementById('agelgilType');
const sizeOptions = document.querySelectorAll('.size-option');
const decreaseQtyBtn = document.getElementById('decreaseQty');
const increaseQtyBtn = document.getElementById('increaseQty');
const quantityDisplay = document.getElementById('quantityDisplay');
const addToCartBtn = document.getElementById('addToCartBtn');
const cartNotification = document.getElementById('cartNotification');
const popupTitle = document.getElementById('popupTitle');

// Variables
let selectedType = agelgilTypeSelect ? agelgilTypeSelect.value : ''; // will be full dish name
let selectedSize = 'small';
let quantity = 1;

// Full menu price table extracted from the image (small/large where available)
const menuPrices = {
    "Misir Large Foil": { large: 150.00 },
    "Alicha Kik Large Foil": { large: 130.00 },
    "Gomen Besiga Large Foil": { large: 180.00 },
    "Gomen Large Foil": { large: 120.00 },
    "Key Wot Large Foil": { large: 180.00 },

    "Alicha Siga Large Foil": { large: 170.00 },
    "Minchet Large Foil": { large: 170.00 },
    "Shiro Large Foil": { large: 130.00 },
    "Misr Wot Small Foil": { small: 75.00 },
    "Alicha Kik Small Foil": { small: 65.00 },

    "Gomen Besiga Small Foil": { small: 90.00 },
    "Gomen Small Foil": { small: 60.00 },
    "Key Wot Small Foil": { small: 90.00 },
    "Alicha Siga Small Foil": { small: 85.00 },
    "Minchet Small Foil": { small: 85.00 },

    "Shiro Small Foil": { small: 65.00 },
    "Keysir Small Foil": { small: 60.00 },
    "Dulet Large Foil": { large: 220.00 },
    "Ayib Large Foil": { large: 0.00 },
    "Ayib Small Foil": { small: 0.00 },

    "Tibs Small Foil": { small: 110.00 },
    "Kitfo Small Foil": { small: 110.00 },
    "Dulet Small Foil": { small: 110.00 },
    "Small Foil Agelgil Yetsome": { small: 75.00 },
    "Doro Small Foil": { small: 100.00 },

    "Salad Small Foil": { small: 19.99 },
    "Agelgel Large foil": { large: 200.00 },
    "Custom Item": {} // keep for custom, empty price
};

// ---------- Popup open/close (unchanged) ----------
openPopupBtn.addEventListener('click', () => {
    popupOverlay.classList.add('active');
    // Ensure popup reflects the currently selected menu item
    selectedType = agelgilTypeSelect.value;
    // update size buttons visibility and title
    updateSizeButtons();
    updatePopupTitle();
    updateQuantityDisplay();
});

// Close popup
closeBtn.addEventListener('click', () => {
    popupOverlay.classList.remove('active');
});

// Close when clicking outside
popupOverlay.addEventListener('click', (e) => {
    if (e.target === popupOverlay) popupOverlay.classList.remove('active');
});

// If you have category tiles on page, keep behaviour (they update select)
agelgilTypes.forEach(type => {
    type.addEventListener('click', () => {
        agelgilTypes.forEach(t => t.classList.remove('active'));
        type.classList.add('active');
        // NOTE: previously data-type was 'traditional' or 'fasting'
        // we will *not* rely on that now — keep select in sync if value exists
        const value = type.getAttribute('data-type');
        // If data-type matches a select option value, set it — otherwise ignore
        const optionExists = Array.from(agelgilTypeSelect.options).some(opt => opt.value === value);
        if (optionExists) {
            agelgilTypeSelect.value = value;
            selectedType = value;
            updateSizeButtons();
            updatePopupTitle();
        }
    });
});

// When user changes dropdown selection, update internal state & UI
agelgilTypeSelect.addEventListener('change', () => {
    selectedType = agelgilTypeSelect.value;
    updateSizeButtons();
    updatePopupTitle();
});

// Size selection: small / large buttons
sizeOptions.forEach(option => {
    option.addEventListener('click', () => {
        // ignore clicks on disabled sizes
        if (option.classList.contains('disabled')) return;

        sizeOptions.forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        selectedSize = option.getAttribute('data-size');
    });
});

// Quantity controls
decreaseQtyBtn.addEventListener('click', () => {
    if (quantity > 1) {
        quantity--;
        updateQuantityDisplay();
    }
});
increaseQtyBtn.addEventListener('click', () => {
    quantity++;
    updateQuantityDisplay();
});

function updateQuantityDisplay() {
    quantityDisplay.textContent = quantity;
}

// Update the popup title using the full dish name
function updatePopupTitle() {
    if (!selectedType) {
        popupTitle.textContent = 'Customize Your Agelgil';
        return;
    }
    popupTitle.textContent = `Customize — ${selectedType}`;
}

// Hide/disable size buttons that are not available for the selected dish
function updateSizeButtons() {
    const priceObj = menuPrices[selectedType] || {};
    sizeOptions.forEach(option => {
        const size = option.getAttribute('data-size'); // 'small' or 'large'
        if (priceObj && typeof priceObj[size] === 'number') {
            option.classList.remove('disabled');
            // ensure the small button remains active if it's available
            // if currently selected size not available, switch to any available
        } else {
            option.classList.add('disabled');
            option.classList.remove('active');
        }
    });

    // If selected size isn't available for this item, choose an available one
    const currentPriceObj = menuPrices[selectedType] || {};
    if (!currentPriceObj[selectedSize]) {
        // prefer small if available, otherwise large
        if (currentPriceObj.small) {
            selectedSize = 'small';
            sizeOptions.forEach(o => {
                if (o.getAttribute('data-size') === 'small') o.classList.add('active');
                else o.classList.remove('active');
            });
        } else if (currentPriceObj.large) {
            selectedSize = 'large';
            sizeOptions.forEach(o => {
                if (o.getAttribute('data-size') === 'large') o.classList.add('active');
                else o.classList.remove('active');
            });
        } else {
            // no size available (e.g. custom item) — clear selection
            selectedSize = null;
            sizeOptions.forEach(o => o.classList.remove('active'));
        }
    }

    // update live price display if you want (we keep calculatePrice usage later)
}

// Add to cart — uses your existing flow but now price comes from menuPrices
addToCartBtn.addEventListener('click', () => {
    const specialInstructions = document.getElementById('specialInstructions').value || '';

    // guard: if selectedType has no price mapping, treat as zero or custom
    const pricePerUnit = getPricePerUnit(selectedType, selectedSize);
    const itemPrice = pricePerUnit * quantity;

    const cartItem = {
        type: selectedType,
        size: selectedSize,
        quantity: quantity,
        instructions: specialInstructions,
        price: itemPrice,
        id: Date.now()
    };

    addToCart(cartItem);

    cartNotification.classList.add('active');
    setTimeout(() => cartNotification.classList.remove('active'), 3000);

    popupOverlay.classList.remove('active');
    resetForm();
});

// Helper: get price per unit for a dish + size
function getPricePerUnit(dishName, size) {
    if (!dishName || !size) return 0;
    const entry = menuPrices[dishName];
    if (!entry) return 0;
    const p = entry[size];
    return (typeof p === 'number') ? p : 0;
}

// original addToCart - kept as-is (saves to localStorage)
function addToCart(item) {
    console.log('Added to cart:', item);
    let cart = JSON.parse(localStorage.getItem('moyaCart')) || [];
    cart.push(item);
    localStorage.setItem('moyaCart', JSON.stringify(cart));
}

// Reset form to defaults
function resetForm() {
    quantity = 1;
    quantityDisplay.textContent = quantity;
    document.getElementById('specialInstructions').value = '';

    // reset size buttons to default small (if available)
    sizeOptions.forEach(option => {
        option.classList.remove('active');
        if (option.getAttribute('data-size') === 'small' && !option.classList.contains('disabled')) {
            option.classList.add('active');
            selectedSize = 'small';
        }
    });
    // reset selectedType to current select value (keeps UI consistent)
    selectedType = agelgilTypeSelect.value;
}
