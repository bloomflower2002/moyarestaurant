// auth-api.js - Authentication API endpoints
const express = require('express');
const router = express.Router();
const pool = require('./db'); // Your database connection


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

        // Simple password comparison (use bcrypt in production)
        if (password !== adminUser.password) {
            console.log(`❌ Invalid password for admin: ${email}`);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        console.log(`✅ Admin login successful: ${adminUser.name}`);
        
        // Return admin data (without password)
        const { password: _, ...userWithoutPassword } = adminUser;
        
        res.json({
            success: true,
            message: 'Login successful',
            admin: userWithoutPassword,
            token: adminUser.id.toString() // Simple token
        });

    } catch (error) {
        console.error('❌ Admin login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during login' 
        });
    }
});

// Admin registration endpoint
router.post('/admin/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        console.log(`👤 Admin registration attempt: ${email}`);
        
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name, email and password are required' 
            });
        }

        // Check if user already exists
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            console.log(`❌ User already exists: ${email}`);
            return res.status(400).json({ 
                success: false, 
                message: 'User already exists with this email' 
            });
        }

        // Create new admin user
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, "admin", NOW())',
            [name, email, password] // Note: role is hardcoded to "admin"
        );

        console.log(`✅ Admin registered successfully: ${email}`);
        
        res.json({
            success: true,
            message: 'Admin account created successfully',
            adminId: result.insertId
        });

    } catch (error) {
        console.error('❌ Admin registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create admin account' 
        });
    }
});

// Verify admin token
router.get('/admin/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }
        
        // Verify token (using user ID as token)
        const [users] = await pool.execute(
            'SELECT id, name, email, role FROM users WHERE id = ? AND role = "admin"',
            [token]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token' 
            });
        }
        
        res.json({ 
            success: true, 
            admin: users[0] 
        });
    } catch (error) {
        console.error('❌ Token verification error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Token verification failed' 
        });
    }
});

// Create default admin account
router.post('/admin/setup', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        
        // Check if any admin exists
        const [existingAdmins] = await pool.execute(
            'SELECT id FROM users WHERE role = "admin"'
        );

        if (existingAdmins.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Admin account already exists' 
            });
        }

        // Create default admin
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, "admin", NOW())',
            [name || 'Administrator', email, password]
        );

        console.log(`✅ Default admin account created: ${email}`);
        
        res.json({
            success: true,
            message: 'Default admin account created successfully',
            adminId: result.insertId
        });

    } catch (error) {
        console.error('❌ Error creating admin account:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create admin account' 
        });
    }
});

module.exports = router;