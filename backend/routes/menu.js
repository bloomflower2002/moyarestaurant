const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all menu items with categories
router.get('/', async (req, res) => {
  try {
    const [items] = await db.execute(`
      SELECT mi.*, c.name as category_name 
      FROM menu_items mi 
      LEFT JOIN categories c ON mi.category_id = c.id 
      WHERE mi.is_available = TRUE 
      ORDER BY c.name, mi.name
    `);
    
    res.json(items);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// Get menu items by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    const [items] = await db.execute(`
      SELECT mi.*, c.name as category_name 
      FROM menu_items mi 
      LEFT JOIN categories c ON mi.category_id = c.id 
      WHERE c.name = ? AND mi.is_available = TRUE 
      ORDER BY mi.name
    `, [category]);
    
    res.json(items);
  } catch (error) {
    console.error('Error fetching menu items by category:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// Search menu items
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const [items] = await db.execute(`
      SELECT mi.*, c.name as category_name 
      FROM menu_items mi 
      LEFT JOIN categories c ON mi.category_id = c.id 
      WHERE (mi.name LIKE ? OR mi.description LIKE ?) 
      AND mi.is_available = TRUE 
      ORDER BY c.name, mi.name
    `, [`%${q}%`, `%${q}%`]);
    
    res.json(items);
  } catch (error) {
    console.error('Error searching menu items:', error);
    res.status(500).json({ error: 'Failed to search menu items' });
  }
});

// Get menu item by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [items] = await db.execute(`
      SELECT mi.*, c.name as category_name 
      FROM menu_items mi 
      LEFT JOIN categories c ON mi.category_id = c.id 
      WHERE mi.id = ?
    `, [id]);
    
    if (items.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    
    res.json(items[0]);
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({ error: 'Failed to fetch menu item' });
  }
});


// Add to your menu routes (routes/menu.js)

// Create new menu item
router.post('/', async (req, res) => {
    try {
        const { name, description, price, category_name, image_url, is_available = true } = req.body;
        
        // Get category ID
        const [category] = await db.execute('SELECT id FROM categories WHERE name = ?', [category_name]);
        if (!category.length) {
            return res.status(400).json({ error: 'Invalid category' });
        }
        
        const [result] = await db.execute(
            'INSERT INTO menu_items (name, description, price, image_url, category_id, is_available) VALUES (?, ?, ?, ?, ?, ?)',
            [name, description, price, image_url, category[0].id, is_available]
        );
        
        res.json({ id: result.insertId, message: 'Menu item created' });
    } catch (error) {
        console.error('Error creating menu item:', error);
        res.status(500).json({ error: 'Failed to create menu item' });
    }
});

// Update menu item
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, category_name, image_url, is_available } = req.body;
        
        // Get category ID
        const [category] = await db.execute('SELECT id FROM categories WHERE name = ?', [category_name]);
        if (!category.length) {
            return res.status(400).json({ error: 'Invalid category' });
        }
        
        await db.execute(
            'UPDATE menu_items SET name = ?, description = ?, price = ?, image_url = ?, category_id = ?, is_available = ? WHERE id = ?',
            [name, description, price, image_url, category[0].id, is_available, id]
        );
        
        res.json({ message: 'Menu item updated' });
    } catch (error) {
        console.error('Error updating menu item:', error);
        res.status(500).json({ error: 'Failed to update menu item' });
    }
});

// Delete menu item
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM menu_items WHERE id = ?', [id]);
        res.json({ message: 'Menu item deleted' });
    } catch (error) {
        console.error('Error deleting menu item:', error);
        res.status(500).json({ error: 'Failed to delete menu item' });
    }
});

module.exports = router;