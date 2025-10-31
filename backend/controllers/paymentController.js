// controllers/paymentController.js
const db = require('../db');
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ Create payment intent (for real payments)
exports.createPayment = async (req, res) => {
  const { user_id, amount, currency = 'usd', method } = req.body;

  try {
    // 1️⃣ Create a Stripe Payment Intent (real payment)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: { user_id, method },
    });

    // 2️⃣ Store pending payment in MySQL
    const [result] = await db.execute(
      'INSERT INTO payments (user_id, amount, method, status) VALUES (?, ?, ?, ?)',
      [user_id, amount, method, 'Pending']
    );

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      payment_id: result.insertId,
      message: '✅ Payment initialized. Complete it on frontend.'
    });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ message: '❌ Failed to create payment intent', error });
  }
};

// ✅ Retrieve all payment records
exports.getPayments = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM payments ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '❌ Could not retrieve payments' });
  }
};

// Frontend payment processing function
async function processPayment(method) {
    payButton.classList.add('loading');
    payButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processing...`;
    
    try {
        const user = JSON.parse(localStorage.getItem('moya_current_user'));
        const amount = window.paymentTotal; // Use the stored total
        
        // Call your backend payment API
        const response = await fetch('/api/payment/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: user.id,
                amount: amount,
                method: method
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            document.getElementById('successMessage').style.display = 'block';
            payButton.style.display = 'none';
            
            // Clear cart after successful payment
            await clearCart();
        } else {
            throw new Error(result.message || 'Payment failed');
        }
    } catch (error) {
        console.error('Payment error:', error);
        alert('Payment failed: ' + error.message);
    } finally {
        payButton.classList.remove('loading');
        payButton.innerHTML = `<i class="fas fa-lock"></i> Pay $${window.paymentTotal.toFixed(2)}`;
    }
}

// Add this function to clear cart after payment
async function clearCart() {
    try {
        const id = getActiveId();
        await fetch(`/api/cart/clear/${id}`, { method: 'DELETE' });
        console.log('🛒 Cart cleared after payment');
    } catch (error) {
        console.error('Error clearing cart:', error);
    }
}