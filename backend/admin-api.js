// admin-api.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const pool = require('./db'); // Your database connection

// Get all orders - FIXED QUERY
router.get('/orders/all', async (req, res) => {
    try {
        const [orders] = await pool.execute(`
            SELECT 
                o.id,
                o.user_id,
                u.name as user_name,
                u.email as user_email,
                o.total_amount,
                o.status,
                o.order_type,
                o.created_at,
                COUNT(oi.id) as item_count
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `);
        res.json({ orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get order details - FIXED QUERY
router.get('/orders/details/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        
        // Get order basic info
        const [orders] = await pool.execute(`
            SELECT 
                o.*,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.id = ?
        `, [orderId]);
        
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        // Get order items
        const [items] = await pool.execute(`
            SELECT 
                oi.*,
                m.name,
                m.image_url
            FROM order_items oi
            LEFT JOIN menu_items m ON oi.menu_item_id = m.id
            WHERE oi.order_id = ?
        `, [orderId]);
        
        res.json({
            order: orders[0],
            items: items
        });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ error: 'Failed to fetch order details' });
    }
});

// Update order status
router.put('/orders/status/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;
        
        await pool.execute(
            'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
            [status, orderId]
        );
        
        res.json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// Admin login endpoint
router.post('/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log(`🔐 Admin login attempt: ${email}`);
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        // Find admin user by email
        const [users] = await pool.execute(
            'SELECT id, name, email, role, password FROM users WHERE email = ? AND role = "admin"',
            [email]
        );

        if (users.length === 0) {
            console.log(`❌ Admin not found: ${email}`);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        const adminUser = users[0];

        // In production, you should use bcrypt to compare hashed passwords
        // For now, using simple password comparison
        if (password !== adminUser.password) {
            console.log(`❌ Invalid password for admin: ${email}`);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        console.log(`✅ Admin login successful: ${adminUser.name}`);
        
        // Return admin data (without password)
        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: adminUser.id,
                name: adminUser.name,
                email: adminUser.email,
                role: adminUser.role
            },
            token: adminUser.id.toString() // Using user ID as simple token
        });

    } catch (error) {
        console.error('❌ Admin login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during login' 
        });
    }
});

// Get all users
router.get('/admin/users', async (req, res) => {
    try {
        const [users] = await pool.execute(`
            SELECT 
                u.id,
                u.name,
                u.email,
                u.phone,
                u.role,
                u.created_at,
                COUNT(o.id) as order_count
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `);
        res.json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Create new user
router.post('/admin/users', async (req, res) => {
    try {
        const { name, email, phone, role, password } = req.body;
        
        // Check if user already exists
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );
        
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Insert new user (you should hash the password in production)
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, phone, role, password, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [name, email, phone, role, password] // Hash password in production!
        );
        
        res.json({ 
            message: 'User created successfully',
            userId: result.insertId 
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Delete user
router.delete('/admin/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        
        await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
        
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Promote user to admin
router.put('/admin/users/:id/promote', async (req, res) => {
    try {
        const userId = req.params.id;
        
        await pool.execute(
            'UPDATE users SET role = "admin" WHERE id = ?',
            [userId]
        );
        
        res.json({ message: 'User promoted to admin successfully' });
    } catch (error) {
        console.error('Error promoting user:', error);
        res.status(500).json({ error: 'Failed to promote user' });
    }
});

// Get menu items
router.get('/menu', async (req, res) => {
    try {
        const [menuItems] = await pool.execute(`
            SELECT 
                m.*,
                c.name as category_name
            FROM menu_items m
            LEFT JOIN categories c ON m.category_id = c.id
            ORDER BY m.name
        `);
        res.json({ menu: menuItems });
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({ error: 'Failed to fetch menu items' });
    }
});

// Create menu item
router.post('/menu', async (req, res) => {
    try {
        const { name, description, price, category_name, image_url, is_available } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO menu_items (name, description, price, category_name, image_url, is_available, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [name, description, price, category_name, image_url, is_available]
        );
        
        res.json({ 
            message: 'Menu item created successfully',
            itemId: result.insertId 
        });
    } catch (error) {
        console.error('Error creating menu item:', error);
        res.status(500).json({ error: 'Failed to create menu item' });
    }
});

// Update menu item
router.put('/menu/:id', async (req, res) => {
    try {
        const itemId = req.params.id;
        const { name, description, price, category_name, image_url, is_available } = req.body;
        
        await pool.execute(
            'UPDATE menu_items SET name = ?, description = ?, price = ?, category_name = ?, image_url = ?, is_available = ?, updated_at = NOW() WHERE id = ?',
            [name, description, price, category_name, image_url, is_available, itemId]
        );
        
        res.json({ message: 'Menu item updated successfully' });
    } catch (error) {
        console.error('Error updating menu item:', error);
        res.status(500).json({ error: 'Failed to update menu item' });
    }
});

// Delete menu item
router.delete('/menu/:id', async (req, res) => {
    try {
        const itemId = req.params.id;
        
        await pool.execute('DELETE FROM menu_items WHERE id = ?', [itemId]);
        
        res.json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        console.error('Error deleting menu item:', error);
        res.status(500).json({ error: 'Failed to delete menu item' });
    }
});

// Dashboard analytics
router.get('/analytics/dashboard', async (req, res) => {
    try {
        // Today's orders count
        const [todayOrders] = await pool.execute(`
            SELECT COUNT(*) as count 
            FROM orders 
            WHERE DATE(created_at) = CURDATE()
        `);
        
        // Total revenue
        const [totalRevenue] = await pool.execute(`
            SELECT COALESCE(SUM(total_amount), 0) as total 
            FROM orders 
            WHERE status = 'completed'
        `);
        
        // Unique customers
        const [uniqueCustomers] = await pool.execute(`
            SELECT COUNT(DISTINCT user_id) as count 
            FROM orders
        `);
        
        // Total menu items
        const [menuItems] = await pool.execute(`
            SELECT COUNT(*) as count 
            FROM menu_items 
            WHERE is_available = true
        `);
        
        res.json({
            today_orders: todayOrders[0].count,
            total_revenue: totalRevenue[0].total,
            unique_customers: uniqueCustomers[0].count,
            menu_items: menuItems[0].count
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

module.exports = router;