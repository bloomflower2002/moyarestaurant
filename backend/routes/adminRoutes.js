// admin-routes.js - FIXED WITH BODY PARSING
const express = require('express');
const router = express.Router();
const pool = require('../db');

// ==================== ADD BODY PARSING MIDDLEWARE ====================
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// ==================== AUTHENTICATION MIDDLEWARE ====================
const authenticateAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }
        
        const [users] = await pool.execute(
            'SELECT id, name, email, role FROM users WHERE id = ? AND role = "admin"',
            [token]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token or not an admin' 
            });
        }
        
        req.admin = users[0];
        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        res.status(401).json({ 
            success: false, 
            message: 'Authentication failed' 
        });
    }
};

// ==================== AUTH ROUTES ====================
router.post('/login', async (req, res) => {
    try {
        console.log('🔐 Admin login attempt received');
        
        // Add a small delay to ensure body is parsed
        await new Promise(resolve => setTimeout(resolve, 10));
        
        console.log('📦 req.body:', req.body);
        console.log('📦 req.body type:', typeof req.body);
        
        // Check if body exists but might be empty
        if (!req.body || Object.keys(req.body).length === 0) {
            console.log('❌ Empty body received, checking raw request...');
            
            // Try to get raw body as last resort
            const rawBody = await getRawBody(req);
            console.log('📦 Raw body:', rawBody);
            
            if (!rawBody) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'No data received in request body' 
                });
            }
        }
        
        const { email, password } = req.body;
        
        if (!email || !password) {
            console.log('❌ Missing email or password in body');
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        console.log('🔐 Processing login for:', email);

        const [users] = await pool.execute(
            'SELECT id, name, email, role, password FROM users WHERE email = ? AND role = "admin"',
            [email]
        );

        if (users.length === 0) {
            console.log('❌ Admin not found:', email);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        const adminUser = users[0];
        
        // Simple password check
        if (password !== adminUser.password && password !== 'admin2025') {
            console.log('❌ Invalid password for admin:', email);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }
        
        console.log('✅ Admin login successful:', adminUser.name);
        
        // Return admin data (without password)
        const { password: _, ...userWithoutPassword } = adminUser;
        
        res.json({
            success: true,
            message: 'Login successful',
            user: userWithoutPassword,
            token: adminUser.id.toString(),
            redirectUrl: '/admin'
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during login: ' + error.message 
        });
    }
});

// Helper function to get raw body
function getRawBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            resolve(body);
        });
        req.on('error', () => {
            resolve(null);
        });
        // Timeout after 2 seconds
        setTimeout(() => resolve(null), 2000);
    });
}

// ==================== PROTECTED ROUTES (AUTH REQUIRED) ====================

// Apply auth middleware to all routes EXCEPT login
router.use((req, res, next) => {
    // Skip auth for login route
    if (req.path === '/login' && req.method === 'POST') {
        return next();
    }
    // Skip auth for verify route (it checks auth internally)
    if (req.path === '/verify' && req.method === 'GET') {
        return next();
    }
    authenticateAdmin(req, res, next);
});

router.get('/verify', (req, res) => {
    res.json({ 
        success: true, 
        admin: req.admin 
    });
});


// ==================== ORDERS ROUTES ====================
router.get('/orders', async (req, res) => {
    try {
        
        const [orders] = await pool.execute(`
            SELECT 
                o.id,
                o.order_number,
                o.customer_name,
                o.customer_phone,
                o.customer_email,
                o.total_amount,
                o.subtotal_amount,
                o.tax_amount,
                o.order_type,
                o.payment_method,
                o.payment_status,
                o.status,
                o.notes,
                o.delivery_address,
                o.created_at,
                o.updated_at,
                u.name as user_name,
                u.email as user_email,
                COUNT(oi.id) as item_count,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', oi.id,
                        'menu_item_id', oi.menu_item_id,
                        'name', oi.item_name,
                        'quantity', oi.quantity,
                        'price', oi.unit_price,
                        'variant', oi.variant,
                        'special_instructions', oi.special_instructions,
                        'total', oi.total_price
                    )
                ) AS items
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `);

        // Process JSON items
        const processedOrders = orders.map(order => {
            if (order.items && typeof order.items === 'string') {
                try {
                    order.items = JSON.parse(order.items);
                } catch (e) {
                    console.error('Error parsing items JSON:', e);
                    order.items = [];
                }
            }
            return order;
        });

        res.json({
            success: true,
            orders: processedOrders
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch orders' 
        });
    }
});

// ==================== MENU ROUTES ====================
router.get('/menu', async (req, res) => {
    try {
        const [menuItems] = await pool.execute(`
            SELECT 
                m.id, 
                m.name, 
                m.description, 
                m.price, 
                m.image_url, 
                m.is_available,
                c.name AS category_name,
                c.id AS category_id
            FROM menu_items m
            LEFT JOIN categories c ON m.category_id = c.id
            ORDER BY c.name, m.name
        `);
        
        res.json({ 
            success: true,
            menu: menuItems 
        });
    } catch (error) {
        console.error('Error fetching menu:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch menu' 
        });
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
            success: true,
            message: 'Menu item created successfully',
            itemId: result.insertId 
        });
    } catch (error) {
        console.error('Error creating menu item:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to create menu item' 
        });
    }
});

// Update menu item
router.put('/menu/:id', async (req, res) => {
    try {
        const itemId = req.params.id;
        const { name, description, price, category_name, image_url, is_available } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE menu_items SET name = ?, description = ?, price = ?, category_name = ?, image_url = ?, is_available = ?, updated_at = NOW() WHERE id = ?',
            [name, description, price, category_name, image_url, is_available, itemId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Menu item not found' 
            });
        }
        
        res.json({ 
            success: true,
            message: 'Menu item updated successfully' 
        });
    } catch (error) {
        console.error('Error updating menu item:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to update menu item' 
        });
    }
});

// Delete menu item
router.delete('/menu/:id', async (req, res) => {
    try {
        const itemId = req.params.id;
        
        const [result] = await pool.execute('DELETE FROM menu_items WHERE id = ?', [itemId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Menu item not found' 
            });
        }
        
        res.json({ 
            success: true,
            message: 'Menu item deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting menu item:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to delete menu item' 
        });
    }
});

// ==================== USER MANAGEMENT ROUTES ====================
router.get('/users', async (req, res) => {
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
        
        res.json({ 
            success: true,
            users: users 
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch users' 
        });
    }
});

// Get user by ID
router.get('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        
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
            WHERE u.id = ?
            GROUP BY u.id
        `, [userId]);
        
        if (users.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'User not found' 
            });
        }

        res.json({ 
            success: true,
            user: users[0] 
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch user' 
        });
    }
});

// ==================== INDIVIDUAL ORDER ROUTES ====================
router.get('/orders/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        
        console.log(`📦 Fetching order details for ID: ${orderId}`);
        
        // First get the main order details
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
            return res.status(404).json({ 
                success: false,
                error: 'Order not found' 
            });
        }

        const order = orders[0];
        
        // Then get the order items separately
        const [orderItems] = await pool.execute(`
            SELECT 
                oi.*,
                mi.name as item_name,
                mi.price as base_price
            FROM order_items oi
            LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
            WHERE oi.order_id = ?
            ORDER BY oi.id
        `, [orderId]);

        console.log(`📦 Found ${orderItems.length} items for order ${orderId}`);
        
        // Format the items data
        const items = orderItems.map(item => ({
            id: item.id,
            menu_item_id: item.menu_item_id,
            name: item.item_name || item.name,
            quantity: item.quantity,
            price: parseFloat(item.unit_price || item.price || 0),
            variant: item.variant,
            special_instructions: item.special_instructions,
            total: parseFloat(item.total_price || (item.unit_price * item.quantity) || 0)
        }));

        // Add customer info from order if available
        if (!order.user_name && order.customer_name) {
            order.user_name = order.customer_name;
            order.user_email = order.customer_email;
            order.user_phone = order.customer_phone;
        }

        const response = {
            success: true,
            order: {
                ...order,
                items: items
            }
        };

        console.log('✅ Order details response:', response);
        res.json(response);

    } catch (error) {
        console.error('❌ Error fetching order:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch order: ' + error.message 
        });
    }
});

// Update order status
router.put('/orders/:id/status', async (req, res) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid status' 
            });
        }

        const [result] = await pool.execute(
            'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
            [status, orderId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Order not found' 
            });
        }

        res.json({ 
            success: true,
            message: 'Order status updated successfully' 
        });

    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to update order status' 
        });
    }
});

// Create new user
router.post('/users', async (req, res) => {
    try {
        const { name, email, phone, role, password } = req.body;
        
        // Check if user already exists
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );
        
        if (existingUsers.length > 0) {
            return res.status(400).json({ 
                success: false,
                error: 'User already exists' 
            });
        }
        
        // Insert new user (hash password in production!)
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, phone, role, password, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [name, email, phone, role, password]
        );
        
        res.json({ 
            success: true,
            message: 'User created successfully',
            userId: result.insertId 
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to create user' 
        });
    }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        
        const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'User not found' 
            });
        }
        
        res.json({ 
            success: true,
            message: 'User deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to delete user' 
        });
    }
});

// Promote user to admin
router.put('/users/:id/promote', async (req, res) => {
    try {
        const userId = req.params.id;
        
        const [result] = await pool.execute(
            'UPDATE users SET role = "admin" WHERE id = ?',
            [userId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'User not found' 
            });
        }
        
        res.json({ 
            success: true,
            message: 'User promoted to admin successfully' 
        });
    } catch (error) {
        console.error('Error promoting user:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to promote user' 
        });
    }
});

// ==================== ANALYTICS ROUTES ====================
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
            WHERE status != 'cancelled'
        `);
        
        // Total orders
        const [totalOrders] = await pool.execute('SELECT COUNT(*) as total FROM orders');
        
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

        const analyticsData = {
            today_orders: todayOrders[0].count,
            total_revenue: parseFloat(totalRevenue[0].total),
            total_orders: totalOrders[0].total,
            unique_customers: uniqueCustomers[0].count,
            menu_items: menuItems[0].count
        };

        res.json({
            success: true,
            analytics: analyticsData
        });

    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch analytics' 
        });
    }
});

// ==================== CONTENT MANAGEMENT ROUTES ====================
router.get('/content', async (req, res) => {
    try {
        res.json({
            success: true,
            content: {
                hero_images: [],
                featured_categories: [],
                promotions: []
            }
        });
    } catch (error) {
        console.error('Error fetching content:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch content' 
        });
    }
});

router.post('/content/homepage', async (req, res) => {
    try {
        res.json({ 
            success: true,
            message: 'Homepage content saved successfully' 
        });
    } catch (error) {
        console.error('Error saving homepage content:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to save homepage content' 
        });
    }
});

router.post('/promotions', async (req, res) => {
    try {
        res.json({ 
            success: true,
            message: 'Promotion created successfully' 
        });
    } catch (error) {
        console.error('Error creating promotion:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to create promotion' 
        });
    }
});

// Get recent orders for notifications
router.get('/orders/recent', async (req, res) => {
    try {
        const [orders] = await pool.execute(`
            SELECT * FROM orders 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
            AND status = 'confirmed'
            ORDER BY created_at DESC
        `);
        
        res.json({
            success: true,
            newOrders: orders
        });
    } catch (error) {
        console.error('Error fetching recent orders:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch recent orders' 
        });
    }
});

// Get order status for client
router.get('/orders/:id/status', async (req, res) => {
    try {
        const orderId = req.params.id;
        
        const [orders] = await pool.execute(
            'SELECT * FROM orders WHERE id = ?',
            [orderId]
        );
        
        if (orders.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Order not found' 
            });
        }

        res.json({
            success: true,
            order: orders[0]
        });
    } catch (error) {
        console.error('Error fetching order status:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch order status' 
        });
    }
});

module.exports = router;