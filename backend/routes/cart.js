const express = require('express');
const router = express.Router();
const db = require('../db');

// Add item to cart - COMPLETELY FIXED VERSION
// Add item to cart - FIXED PRICE CALCULATION
router.post('/add', async (req, res) => {
  console.log('🛒 Received add to cart request:', JSON.stringify(req.body, null, 2));
  
  const connection = await db.getConnection();
  
  try {
    const { menu_item_id, quantity } = req.body;
    
    // PROPERLY handle optional fields - convert undefined to null
    const user_id = req.body.user_id !== undefined ? req.body.user_id : null;
    const session_id = req.body.session_id !== undefined ? req.body.session_id : null;
    const variant = req.body.variant !== undefined ? req.body.variant : null;
    const special_instructions = req.body.special_instructions !== undefined ? req.body.special_instructions : null;
    const display_name = req.body.display_name !== undefined ? req.body.display_name : null;
    
    console.log('🛒 Processed data:', { 
      user_id, 
      session_id, 
      menu_item_id, 
      quantity, 
      variant, 
      display_name 
    });
    
    // Basic validation
    if (!menu_item_id || !quantity) {
      return res.status(400).json({ error: 'menu_item_id and quantity are required' });
    }
    
    if (!user_id && !session_id) {
      return res.status(400).json({ error: 'Either user_id or session_id is required' });
    }
    
    // Check if menu item exists
    const [menuItems] = await connection.execute(
      'SELECT id, name, price FROM menu_items WHERE id = ?',
      [menu_item_id]
    );
    
    if (menuItems.length === 0) {
      return res.status(400).json({ error: `Menu item with ID ${menu_item_id} not found` });
    }
    
    console.log('✅ Menu item found:', menuItems[0].name, 'Base price:', menuItems[0].price);
    
    // FIXED: Calculate UNIT price (not total)
    let unitPrice = parseFloat(menuItems[0].price);
    console.log('💰 Unit price:', unitPrice);
    
    // Handle Chechebsa price adjustment for Black Teff variant
    if (variant && variant.includes('Black Teff')) {
      unitPrice += 1.99;
      console.log('💰 Price adjusted for Black Teff - Unit price:', unitPrice);
    }
    
    // Round unit price to 2 decimal places
    unitPrice = Math.round(unitPrice * 100) / 100;
    console.log('💰 Final unit price:', unitPrice);
    
    // Check if item already exists in cart with same variant
    let whereClause = '';
    let params = [];
    
    if (user_id) {
      whereClause = 'user_id = ? AND menu_item_id = ?';
      params = [user_id, menu_item_id];
    } else {
      whereClause = 'session_id = ? AND menu_item_id = ?';
      params = [session_id, menu_item_id];
    }
    
    // Add variant to check
    if (variant) {
      whereClause += ' AND variant = ?';
      params.push(variant);
    } else {
      whereClause += ' AND (variant IS NULL OR variant = ?)';
      params.push(null);
    }
    
    const [existingItems] = await connection.execute(
      `SELECT * FROM cart_items WHERE ${whereClause}`,
      params
    );
    
    if (existingItems.length > 0) {
      // Update quantity if item exists - DO NOT update custom_price
      const existingItem = existingItems[0];
      const newQuantity = existingItem.quantity + quantity;
      
      console.log(`🔄 Updating existing item: ${existingItem.quantity} + ${quantity} = ${newQuantity}`);
      
      await connection.execute(
        `UPDATE cart_items SET quantity = ? WHERE ${whereClause}`,
        [newQuantity, ...params]
      );
      
      console.log('✅ Quantity updated for existing item');
      
      res.json({ 
        success: true, 
        message: 'Item quantity updated in cart',
        item_name: menuItems[0].name,
        new_quantity: newQuantity
      });
      
    } else {
      // Insert new item - Store UNIT price in custom_price
      // The total price will be calculated as: custom_price * quantity
      await connection.execute(
        'INSERT INTO cart_items (user_id, session_id, menu_item_id, quantity, variant, special_instructions, display_name, custom_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [user_id, session_id, menu_item_id, quantity, variant, special_instructions, display_name, unitPrice]
      );
      
      console.log('✅ New item added to cart with unit price:', unitPrice);
      
      res.json({ 
        success: true, 
        message: 'Item added to cart',
        item_name: menuItems[0].name,
        unit_price: unitPrice
      });
    }
    
  } catch (error) {
    console.error('❌ CART ADD ERROR:', error.message);
    console.error('❌ Error details:', error);
    
    res.status(500).json({ 
      error: 'Failed to add item to cart',
      details: error.message
    });
  } finally {
    connection.release();
  }
});

// Get cart items - UPDATED to use custom_price
router.get('/:identifier', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { identifier } = req.params;
    
    console.log('📦 Fetching cart for:', identifier);
    
    // Determine if identifier is user_id (numeric) or session_id (string)
    let whereClause = '';
    let params = [];
    
    if (/^\d+$/.test(identifier)) {
      // It's a user_id (numeric)
      whereClause = 'ci.user_id = ?';
      params = [identifier];
    } else {
      // It's a session_id
      whereClause = 'ci.session_id = ?';
      params = [identifier];
    }
    
   // FIXED Cart Retrieval Query
const [cartItems] = await connection.execute(
  `SELECT ci.*, 
          mi.name, 
          mi.price as base_price,
          -- Calculate total price: unit price * quantity
          COALESCE(ci.custom_price, mi.price) * ci.quantity as total_price,
          -- Also include unit price for display
          COALESCE(ci.custom_price, mi.price) as unit_price,
          -- Individual item price (for display)
          COALESCE(ci.custom_price, mi.price) as price,
          mi.image_url, 
          mi.description
   FROM cart_items ci 
   JOIN menu_items mi ON ci.menu_item_id = mi.id 
   WHERE ${whereClause}
   ORDER BY ci.created_at DESC`,
  params
);
    console.log(`✅ Found ${cartItems.length} items in cart`);
    
    // Log prices for debugging
    cartItems.forEach(item => {
      console.log(`🛒 Cart item: ${item.name} | Variant: ${item.variant} | Price: $${item.price} | Custom Price: $${item.custom_price}`);
    });
    
    res.json(cartItems);
    
  } catch (error) {
    console.error('❌ Error fetching cart:', error);
    
    // If table doesn't exist, return empty array
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('📋 cart_items table does not exist yet');
      res.json([]);
    } else {
      res.status(500).json({ error: 'Failed to fetch cart items' });
    }
  } finally {
    connection.release();
  }
});

// Update cart item quantity
router.put('/update', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { user_id, session_id, menu_item_id, quantity, variant = null } = req.body;
    
    console.log('🔄 Updating cart quantity:', { user_id, session_id, menu_item_id, quantity, variant });
    
    if (!menu_item_id || quantity === undefined) {
      return res.status(400).json({ error: 'menu_item_id and quantity are required' });
    }
    
    // Convert undefined to null
    const finalUserId = user_id !== undefined ? user_id : null;
    const finalSessionId = session_id !== undefined ? session_id : null;
    
    // Build WHERE clause based on user/session
    let whereClause = '';
    let params = [];
    
    if (finalUserId) {
      whereClause = 'user_id = ? AND menu_item_id = ?';
      params = [finalUserId, menu_item_id];
    } else if (finalSessionId) {
      whereClause = 'session_id = ? AND menu_item_id = ?';
      params = [finalSessionId, menu_item_id];
    } else {
      return res.status(400).json({ error: 'Either user_id or session_id is required' });
    }
    
    // Add variant to WHERE clause if provided
    if (variant) {
      whereClause += ' AND variant = ?';
      params.push(variant);
    } else {
      whereClause += ' AND (variant IS NULL OR variant = ?)';
      params.push(null);
    }
    
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      await connection.execute(
        `DELETE FROM cart_items WHERE ${whereClause}`,
        params
      );
      console.log('🗑️ Item removed from cart');
    } else {
      // Update quantity
      await connection.execute(
        `UPDATE cart_items SET quantity = ? WHERE ${whereClause}`,
        [quantity, ...params]
      );
      console.log('✅ Quantity updated to:', quantity);
    }
    
    res.json({ success: true, message: 'Cart updated' });
    
  } catch (error) {
    console.error('❌ Error updating cart:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  } finally {
    connection.release();
  }
});

// Remove item from cart
router.delete('/remove', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { user_id, session_id, menu_item_id, variant = null } = req.body;
    
    console.log('🗑️ Removing from cart:', { user_id, session_id, menu_item_id, variant });
    
    if (!menu_item_id) {
      return res.status(400).json({ error: 'menu_item_id is required' });
    }
    
    // Convert undefined to null
    const finalUserId = user_id !== undefined ? user_id : null;
    const finalSessionId = session_id !== undefined ? session_id : null;
    
    // Build WHERE clause based on user/session
    let whereClause = '';
    let params = [];
    
    if (finalUserId) {
      whereClause = 'user_id = ? AND menu_item_id = ?';
      params = [finalUserId, menu_item_id];
    } else if (finalSessionId) {
      whereClause = 'session_id = ? AND menu_item_id = ?';
      params = [finalSessionId, menu_item_id];
    } else {
      return res.status(400).json({ error: 'Either user_id or session_id is required' });
    }
    
    // Add variant to WHERE clause if provided
    if (variant) {
      whereClause += ' AND variant = ?';
      params.push(variant);
    } else {
      whereClause += ' AND (variant IS NULL OR variant = ?)';
      params.push(null);
    }
    
    await connection.execute(
      `DELETE FROM cart_items WHERE ${whereClause}`,
      params
    );
    
    console.log('✅ Item removed from cart');
    res.json({ success: true, message: 'Item removed from cart' });
    
  } catch (error) {
    console.error('❌ Error removing cart item:', error);
    res.status(500).json({ error: 'Failed to remove cart item' });
  } finally {
    connection.release();
  }
});

// Remove item from cart by ID
router.delete('/remove/:itemId', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { itemId } = req.params;
    
    await connection.execute(
      'DELETE FROM cart_items WHERE id = ?',
      [itemId]
    );
    
    res.json({ success: true, message: 'Item removed from cart' });
    
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({ error: 'Failed to remove cart item' });
  } finally {
    connection.release();
  }
});

// Clear cart for user or session
router.delete('/clear', async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { user_id, session_id } = req.body;

    if (!user_id && !session_id) {
      return res.status(400).json({ error: 'Either user_id or session_id is required' });
    }

    let query = 'DELETE FROM cart_items WHERE ';
    let params = [];

    if (user_id) {
      query += 'user_id = ?';
      params.push(user_id);
    } else if (session_id) {
      query += 'session_id = ?';
      params.push(session_id);
    }

    await connection.execute(query, params);
    res.json({ success: true, message: 'Cart cleared' });

  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  } finally {
    connection.release();
  }
});

module.exports = router;