/* ===== Header scroll effect ===== */
window.addEventListener('scroll', () => {
  const header = document.querySelector('header');
  if (!header) return;
  header.classList.toggle('scrolled', window.scrollY > 50);
});

/* ===== Global Cart Functions ===== */
function getCart() {
  try { return JSON.parse(localStorage.getItem('cart')) || []; }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
  const cart = getCart();
  const counter = document.getElementById('cart-count');
  if (counter) counter.innerText = cart.reduce((s, it) => s + (it.qty || 0), 0);
}

/* ===== Toast Function ===== */
function showToast(message, duration = 2000) {
  const toastEl = document.getElementById('toast');
  if (!toastEl) { alert(message); return; }
  toastEl.textContent = message;
  toastEl.style.display = 'block';
  requestAnimationFrame(() => toastEl.classList.add('show'));
  setTimeout(() => {
    toastEl.classList.remove('show');
    setTimeout(() => toastEl.style.display = 'none', 220);
  }, duration);
}

/* ===== Add to Cart ===== */
async function addToCart(name, price, img, desc) {
  const numericPrice = Number(price);
  if (!name || isNaN(numericPrice)) return showToast('Invalid item');

  try {
    const response = await fetch("http://localhost:5000/api/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: 1, // change if you have login
        name,
        price: numericPrice,
        img,
        desc,
        qty: 1
      })
    });

    const result = await response.json();
    showToast(`${name} added to cart!`);
    console.log(result);
  } catch (err) {
    console.error(err);
    showToast("Error adding item to cart");
  }
}



/* ===== Modal Functions ===== */
function openModal(img, title, desc, price) {
  document.getElementById('modal-img').src = img;
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-desc').textContent = desc;
  document.getElementById('modal-price').textContent = price;
  document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

function addToCartModal() {
  const name = document.getElementById("modal-title").innerText.trim();
  const priceText = document.getElementById("modal-price").innerText.replace("$", "").trim();
  const price = parseFloat(priceText);
  const img = document.getElementById("modal-img").src;
  const desc = document.getElementById("modal-desc").innerText.trim();

  addToCart(name, price, img, desc);
  closeModal();
}

/* ===== Pickup Button ===== */
function handlePickup(mode) {
  const pickupInfo = document.getElementById('pickup-info');
  if (!pickupInfo) return;

  const now = new Date();
  const pickupTime = new Date(now.getTime() + 60*60*1000); // +1 hour
  pickupInfo.innerHTML = `<p>Order Mode: ${mode}</p>
                          <p>Order Time: ${formatTime(now)}</p>
                          <p>Pickup Time: ${formatTime(pickupTime)}</p>`;
}

function formatTime(date) {
  let h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

/* ===== Search Filter ===== */
function initSearch() {
  const input = document.getElementById('menu-search');
  if (!input) return;

  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    document.querySelectorAll('.menu .item').forEach(item => {
      const name = (item.querySelector('.dish-name')?.textContent || '').toLowerCase();
      const desc = (item.querySelector('.desc')?.textContent || '').toLowerCase();
      item.style.display = (!q || name.includes(q) || desc.includes(q)) ? '' : 'none';
    });
  });
}

/* ===== Initialize on DOMContentLoaded ===== */
document.addEventListener('DOMContentLoaded', () => {
  // Menu cart buttons
  document.querySelectorAll('.cart').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const price = parseFloat(btn.dataset.price.replace("$",""));
      addToCart(btn.dataset.name, price, btn.dataset.img, btn.dataset.desc);
    });
  });

  // Pickup buttons
  document.querySelectorAll('.pickup-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const mode = btn.dataset.mode || 'to-go';
      handlePickup(mode);
    });
  });

  // Search
  initSearch();

  // Update cart count on load
  updateCartCount();
});



//combo modal
const menuItems = {
  breakfast: {
    title: "Breakfast Combo",
    price: "$17",
    foods: ["Ful", "Chechebsa", "Enkulal Firfir", "Dabo Firfir", "Yetsom Firfir", "Pasta"]
  },
  lunch: {
    title: "Lunch Combo",
    price: "$25",
    foods: ["Firfir", "Tibs", "Dullet", "Kuanta Firfir", "Yetahse Kitfo", "Kitfo"]
  }
};

function openComboModal(type) {
  const comboTitleEl = document.getElementById("comboTitle");
  const comboPriceEl = document.getElementById("comboPrice");
  const optionsContainer = document.getElementById("comboOptions");
  const comboImgEl = document.getElementById("comboImg");

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
  comboImgEl.src = type === "breakfast" ? "../image/combobreakfast.jpg" : "../image/combolunch.webp";

  // Show modal
  document.getElementById("comboModal").style.display = "flex";
}


function closeComboModal() {
  document.getElementById("comboModal").style.display = "none";
}

//add to cart
function addComboToCart(event) {
  event.preventDefault();

  const selected = [...document.querySelectorAll("#comboOptions input:checked")]
    .map(cb => cb.value);

  if (selected.length !== 2) {
    showToast("Please select exactly 2 items.");
    return;
  }

  // Detect which combo type is open
  const comboTitleText = document.getElementById("comboTitle").innerText.toLowerCase();
  const isBreakfast = comboTitleText.includes("breakfast");
  const comboType = isBreakfast ? "breakfast" : "lunch";

  // Use info from your menuItems object
  const comboInfo = menuItems[comboType];
  const comboName = `${comboInfo.title} (${selected.join(" & ")})`; // 👈 unique per selection
  const comboPrice = parseFloat(comboInfo.price.replace("$", ""));
  const comboDesc = `Includes: ${selected.join(" & ")}`;
  const comboImg = isBreakfast ? "../image/combobreakfast.jpg" : "../image/combolunch.webp";

  // Add to cart
  addToCart(comboName, comboPrice, comboImg, comboDesc);

  closeComboModal();
  showToast(`${comboInfo.title} added to cart`);
}

// soda modal
function openDrinkModal() {
  document.getElementById("drinkModal").style.display = "flex";
}

function closeDrinkModal() {
  document.getElementById("drinkModal").style.display = "none";
}

function addDrinksToCart() {
  const checkboxes = document.querySelectorAll("#drinkOptions input[type='checkbox']");
  const selected = [...checkboxes].filter(cb => cb.checked).map(cb => cb.value);

  if (selected.length === 0) {
    alert("Please select at least one drink.");
    return;
  }

  const price = 3.17; // per drink
  const img = "../image/Soda.jpeg"; // default drink image
  const desc = `Drinks selected: ${selected.join(", ")}`;

  selected.forEach(drink => {
    addToCart(drink, price, img, desc); // your existing addToCart()
  });

  // Clear selections
  checkboxes.forEach(cb => cb.checked = false);

  closeDrinkModal();
  showToast(`${selected.join(", ")} added to cart!`);
}

// chechebsa modal
const basePrice = 10.99;
const teffPrice = 1.99;

function openChechebsaModal() {
  document.getElementById("chechebsa-img").src = "../image/Chechebsa.jpg";
  document.getElementById("chechebsa-title").innerText = "Chechebsa";
  document.getElementById("chechebsa-desc").innerText =
    "Toasted flatbread pieces heated with berbere and spiced butter or olive oil.";
  
  // Reset checkbox and price
  const checkbox = document.getElementById("chechebsa-teff");
  checkbox.checked = false;
  document.getElementById("chechebsa-price").innerText = basePrice.toFixed(2);

  // Update price when checkbox changes
  checkbox.onchange = () => {
    const newPrice = basePrice + (checkbox.checked ? teffPrice : 0);
    document.getElementById("chechebsa-price").innerText = newPrice.toFixed(2);
  };

  document.getElementById("chechebsaModal").style.display = "flex";
}

function closeChechebsaModal() {
  document.getElementById("chechebsaModal").style.display = "none";
}

function addChechebsaToCart() {
  const checkbox = document.getElementById("chechebsa-teff");
  const selectedOptions = checkbox.checked ? " + Black Teff" : "";
  const finalPrice = basePrice + (checkbox.checked ? teffPrice : 0);

  const img = document.getElementById("chechebsa-img").src;
  const desc = "Chechebsa" + selectedOptions;

  addToCart("Chechebsa" + selectedOptions, finalPrice, img, desc);
  closeChechebsaModal();
  showToast(`Chechebsa${selectedOptions} added to cart!`);
}


