const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// ==================== COMPLEMENTARY ROUTES ==================== //

// Cookie-based logout
router.post('/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.json({ success: true, message: 'Logged out successfully' });
});

// Cookie-based auth status check
router.get('/me', async (req, res) => {
    try {
        const token = req.cookies.auth_token;
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Not authenticated' 
            });
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Get user from database
        const user = await User.findById(decoded.userId);

        if (!user) {
            res.clearCookie('auth_token');
            return res.status(401).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            success: true,
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Auth check error:', error);
        res.clearCookie('auth_token');
        res.status(401).json({ 
            success: false, 
            message: 'Invalid token' 
        });
    }
});

// Additional profile routes
router.put('/profile', async (req, res) => {
    try {
        const token = req.cookies.auth_token;
        if (!token) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const { name, email } = req.body;

        // Update user profile - This requires the updateProfile method in User model
        await User.updateProfile(decoded.userId, { name, email });

        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Change password route
router.put('/change-password', async (req, res) => {
    try {
        const token = req.cookies.auth_token;
        if (!token) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const { currentPassword, newPassword } = req.body;

        // Verify current password
        const user = await User.findById(decoded.userId);
        const isValid = await bcrypt.compare(currentPassword, user.password);
        
        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        // Update to new password - This requires the updatePassword method in User model
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await User.updatePassword(decoded.userId, hashedPassword);

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Make sure to export the router directly
module.exports = router;