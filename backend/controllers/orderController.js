const db = require('../config/database');

// Create a new order
const createOrder = (req, res) => {
  const { customer_name, customer_email, items } = req.body;
  
  // Validate required fields
  if (!customer_name || !customer_email || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ 
      error: 'Customer name, email, and at least one item are required' 
    });
  }

  // Calculate total price
  let total_price = 0;
  items.forEach(item => {
    total_price += (item.price || 0) * (item.quantity || 1);
  });

  // Start transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error('Transaction error:', err);
      return res.status(500).json({ error: 'Transaction failed' });
    }

    // 1. Insert into orders table
    const orderQuery = 'INSERT INTO orders (customer_name, customer_email, total_price) VALUES (?, ?, ?)';
    db.query(orderQuery, [customer_name, customer_email, total_price], (err, orderResults) => {
      if (err) {
        return db.rollback(() => {
          console.error('Order creation error:', err);
          res.status(500).json({ error: 'Failed to create order' });
        });
      }

      const orderId = orderResults.insertId;

      // 2. Insert all order items
      const orderItemsQuery = 'INSERT INTO order_items (order_id, item_name, item_price, quantity) VALUES ?';
      const orderItemsValues = items.map(item => [
        orderId,
        item.name,
        item.price,
        item.quantity || 1
      ]);

      db.query(orderItemsQuery, [orderItemsValues], (err, itemResults) => {
        if (err) {
          return db.rollback(() => {
            console.error('Order items error:', err);
            res.status(500).json({ error: 'Failed to add order items' });
          });
        }

        // Commit transaction
        db.commit((err) => {
          if (err) {
            return db.rollback(() => {
              console.error('Commit error:', err);
              res.status(500).json({ error: 'Transaction commit failed' });
            });
          }

          res.json({
            message: 'Order created successfully',
            orderId: orderId,
            total: total_price,
            customer: customer_name
          });
        });
      });
    });
  });
};

// Get all orders
const getOrders = (req, res) => {
  const query = `
    SELECT o.*, 
           GROUP_CONCAT(CONCAT(oi.quantity, 'x ', oi.item_name) SEPARATOR ', ') as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    GROUP BY o.id
    ORDER BY o.order_date DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
};

// Get single order by ID with items
const getOrderById = (req, res) => {
  const { id } = req.params;
  
  // Get order details
  const orderQuery = 'SELECT * FROM orders WHERE id = ?';
  db.query(orderQuery, [id], (err, orderResults) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (orderResults.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items
    const itemsQuery = 'SELECT * FROM order_items WHERE order_id = ?';
    db.query(itemsQuery, [id], (err, itemResults) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      const order = orderResults[0];
      order.items = itemResults;
      
      res.json(order);
    });
  });
};

module.exports = { createOrder, getOrders, getOrderById };