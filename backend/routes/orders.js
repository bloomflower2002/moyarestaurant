const express = require('express');
const router = express.Router();
const db = require('../db');

// Create new order from cart
router.post('/create', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { user_id, session_id, order_type = 'pickup', scheduled_time, special_instructions } = req.body;
    
    // Validate input
    if (!user_id && !session_id) {
      await connection.rollback();
      return res.status(400).json({ error: 'Either user_id or session_id is required' });
    }
    
    // Get cart items with proper variant handling
    const [cartItems] = await connection.execute(`
      SELECT ci.*, mi.price, mi.name 
      FROM cart_items ci 
      JOIN menu_items mi ON ci.menu_item_id = mi.id 
      WHERE ${user_id ? 'ci.user_id = ?' : 'ci.session_id = ?'}
    `, [user_id || session_id]);
    
    if (cartItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Cart is empty' });
    }
    
    // Calculate total
    const total_amount = cartItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
    
    // Handle guest/user orders
    const orderUserId = user_id || null;

    // Create order
    const [orderResult] = await connection.execute(
      'INSERT INTO orders (user_id, total_amount, order_type, scheduled_time, special_instructions) VALUES (?, ?, ?, ?, ?)',
      [orderUserId, total_amount, order_type, scheduled_time, special_instructions || null]
    );
    
    const orderId = orderResult.insertId;
    
    // Create order items with proper variant handling
    for (const item of cartItems) {
      await connection.execute(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, price, special_instructions, variant) VALUES (?, ?, ?, ?, ?, ?)',
        [orderId, item.menu_item_id, item.quantity, item.price, item.special_instructions || null, item.variant || null]
      );
    }
    
    // Clear cart
    await connection.execute(
      `DELETE FROM cart_items WHERE ${user_id ? 'user_id = ?' : 'session_id = ?'}`,
      [user_id || session_id]
    );
    
    await connection.commit();
    
    res.json({ 
      success: true, 
      message: 'Order created successfully', 
      orderId,
      total_amount,
      items: cartItems.length
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error creating order:', error);
    
    // Handle specific database errors
    if (error.code === 'ER_NO_REFERENCED_ROW') {
      return res.status(400).json({ error: 'Invalid menu item in cart' });
    }
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Order already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    connection.release();
  }
});

// Get user orders
router.get('/user/:userId', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { userId } = req.params;
    
    const [orders] = await connection.execute(`
      SELECT o.*, 
             COUNT(oi.id) as item_count,
             SUM(oi.quantity) as total_items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [userId]);
    
    res.json(orders);
  } catch (error) {
    console.error('❌ Error fetching user orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  } finally {
    connection.release();
  }
});

// Get order details
router.get('/details/:orderId', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { orderId } = req.params;
    
    const [order] = await connection.execute(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );
    
    if (order.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const [orderItems] = await connection.execute(`
      SELECT oi.*, mi.name, mi.image_url, mi.description, mi.category
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = ?
      ORDER BY oi.created_at ASC
    `, [orderId]);
    
    res.json({
      order: order[0],
      items: orderItems
    });
  } catch (error) {
    console.error('❌ Error fetching order details:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  } finally {
    connection.release();
  }
});

// Get all orders (for admin)
router.get('/all', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const [orders] = await connection.execute(`
      SELECT o.*, 
             u.name as user_name,
             u.email as user_email,
             COUNT(oi.id) as item_count,
             SUM(oi.quantity) as total_items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    
    res.json(orders);
  } catch (error) {
    console.error('❌ Error fetching all orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  } finally {
    connection.release();
  }
});

// Update order status
router.put('/status/:orderId', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    await connection.execute(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, orderId]
    );
    
    res.json({ success: true, message: `Order status updated to ${status}` });
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  } finally {
    connection.release();
  }
});

module.exports = router;