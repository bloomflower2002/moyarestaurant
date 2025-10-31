const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../db');

module.exports = router;
// 1️⃣ CREATE PAYMENT INTENT
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency, metadata } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency || 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: metadata || {},
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('❌ Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2️⃣ SAVE ORDER AFTER PAYMENT SUCCESS
router.post('/payment-success', async (req, res) => {
  try {
    const { paymentIntentId, userId, sessionId, deliveryAddress, customerInfo } = req.body;

    // Retrieve the payment info from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Start transaction
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Get cart items
      const query = userId ? 'SELECT * FROM cart_items WHERE user_id = ?' : 'SELECT * FROM cart_items WHERE session_id = ?';
const [cartItems] = await connection.execute(query, [userId || sessionId]);


      if (cartItems.length === 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'Cart is empty' });
      }

      // Calculate total
      const total_amount = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

      // Insert order
      const [orderResult] = await connection.execute(
        `INSERT INTO orders (user_id, total_amount, status, payment_status, payment_intent_id, 
          delivery_address, customer_name, customer_phone, customer_email, created_at)
         VALUES (?, ?, 'confirmed', 'paid', ?, ?, ?, ?, ?, NOW())`,
        [
          userId || null,
          total_amount,
          paymentIntent.id,
          deliveryAddress || 'Not specified',
          customerInfo?.name || 'Guest',
          customerInfo?.phone || 'Not provided',
          customerInfo?.email || 'Not provided'
        ]
      );

      const orderId = orderResult.insertId;

      // Insert order items
      for (const item of cartItems) {
        await connection.execute(
          `INSERT INTO order_items (order_id, menu_item_id, quantity, price)
           VALUES (?, ?, ?, ?)`,
          [orderId, item.menu_item_id, item.quantity, item.price]
        );
      }

      // Clear cart
      await connection.execute(
        `DELETE FROM cart_items WHERE ${userId ? 'user_id = ?' : 'session_id = ?'}`,
        [userId || sessionId]
      );

      await connection.commit();

      res.json({ success: true, message: 'Payment successful and order saved!', orderId });

    } catch (err) {
      await connection.rollback();
      console.error('❌ Error saving order after payment:', err);
      res.status(500).json({ error: 'Failed to save order' });
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('❌ Payment success handler error:', error);
    res.status(500).json({ error: 'Failed to process payment success' });
  }
});

module.exports = router;
