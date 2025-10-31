// Header scroll effect
window.addEventListener('scroll', () => {
  const header = document.querySelector('header');
  if (window.scrollY > 50) header.classList.add('scrolled');
  else header.classList.remove('scrolled');
});

/* ===== Helpers ===== */
function getCart() {
  try { return JSON.parse(localStorage.getItem("cart")) || []; } catch { return []; }
}
function saveCart(cart) { localStorage.setItem("cart", JSON.stringify(cart)); }
function updateCartCount() {
  const c = getCart();
  const counter = document.getElementById("cart-count");
  if (counter) counter.innerText = c.reduce((s,i)=>s+(i.qty||0),0);
}

/* ===== Cart ===== */
async function loadCart() {
  const res = await fetch("http://localhost:5000/api/cart");
  const cart = await res.json();
  const container = document.getElementById("cart-items");
  container.innerHTML = "";
  let subtotal = 0;

  if(cart.length === 0) {
    container.innerHTML = "<p>Cart is empty</p>";
    document.getElementById("subtotal").innerText = "$0.00";
    document.getElementById("tax").innerText = "$0.00";
    document.getElementById("total").innerText = "$0.00";
    updateCartCount();
    return;
  }

  cart.forEach((item,i)=>{
    const total = item.price * item.qty;
    subtotal += total;

    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <img src="${item.img}">
      <div class="details">
        <h2>${item.name}</h2>
        <p class="desc">${item.desc}</p>
        <div class="quantity">
          <button onclick="updateQty(${i},-1)">-</button>
          <span>${item.qty}</span>
          <button onclick="updateQty(${i},1)">+</button>
        </div>
        <p class="price">$${total.toFixed(2)}</p>
      </div>
      <button class="remove" onclick="removeItem(${i})">Remove</button>
    `;
    container.appendChild(div);
  });

  const tax = subtotal * 0.07;
  const total = subtotal + tax;

  document.getElementById("subtotal").innerText = "$" + subtotal.toFixed(2);
  document.getElementById("tax").innerText = "$" + tax.toFixed(2);
  document.getElementById("total").innerText = "$" + total.toFixed(2);
  updateCartCount();
}

function updateQty(i, change) {
  const cart = getCart();
  if(!cart[i]) return;
  cart[i].qty += change;
  if(cart[i].qty <= 0) cart.splice(i,1);
  saveCart(cart);
  loadCart();
}

function removeItem(i) {
  const cart = getCart();
  if(!cart[i]) return;
  cart.splice(i,1);
  saveCart(cart);
  loadCart();
}

function goToPayment() {
  const total = document.getElementById("total").innerText.replace("$","");
  alert("Redirect to payment: $" + total);
}

/* ===== Pickup Time ===== */
function formatTime(date) {
  let h = date.getHours();
  const m = date.getMinutes().toString().padStart(2,'0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function showPickupTime() {
  const now = new Date();
  const pickup = new Date(now.getTime() + 3600000); // +1 hour
  document.getElementById("pickup-info").innerHTML = `
    <p>Order Time: ${formatTime(now)}</p>
    <p>Pickup Time: ${formatTime(pickup)}</p>
  `;
}
 function goToPayment() {
      let total = document.getElementById("total").innerText.replace("$", "");
      window.location.href = `payment.html?total=${total}`;
    }

/* ===== Init ===== */
window.onload = function() {
  loadCart();
  showPickupTime();
  updateCartCount();
};
