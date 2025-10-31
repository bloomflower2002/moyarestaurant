const db = require('../config/database');

// Get all menu items
const getMenuItems = (req, res) => {
  const query = 'SELECT * FROM menu_items';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
};

// Get single menu item by ID
const getMenuItemById = (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM menu_items WHERE id = ?';
  
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json(results[0]);
  });
};

// Add new menu item (for admin)
const addMenuItem = (req, res) => {
  const { name, description, price, image } = req.body;
  
  if (!name || !price) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  const query = 'INSERT INTO menu_items (name, description, price, image) VALUES (?, ?, ?, ?)';
  
  db.query(query, [name, description, price, image], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to add menu item' });
    }
    res.json({ 
      message: 'Menu item added successfully', 
      id: results.insertId 
    });
  });
};

module.exports = { getMenuItems, getMenuItemById, addMenuItem };