const express = require('express');
const nodemailer= require ('nodemailer');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const { google } = require('googleapis'); // Added googleapis
const passport = require('passport');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

require('dotenv').config();
require('./auth');

const app = express();
const db = require('./db');

const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

// ==================== STRIPE CONFIGURATION ====================
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_51SKqaCCb8bUrtyvzIE5VWDZHmuqlL4GTn05Jzq9QXN32KSTbdf0CET9p6OkdqAD2uLiiOkHmRCOgJoEhbTrQ163C00LE12LpPJ');

// Test Stripe connection on startup
async function testStripeConnection() {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 1000, // $10.00
            currency: 'usd',
        });
        console.log('✅ Stripe connected successfully. Test PaymentIntent ID:', paymentIntent.id);
        return true;
    } catch (error) {
        console.error('❌ Stripe connection failed:', error.message);
        return false;
    }
}

testStripeConnection();

// ==================== MIDDLEWARE ====================
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      'http://localhost:3000',
      'null',
      'file://'
    ];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log('🔄 CORS Request from:', origin);
      return callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));



// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-key-change-this',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());
console.log('✅ Passport initialized');

// ==================== STATIC FILES - FIXED VERSION ====================
// Serve frontend files from root
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve admin files from /admin path - CORRECTED
app.use('/admin', express.static(path.join(__dirname, '../admin'), {
  index: false, // Don't serve index automatically
  extensions: ['html', 'css', 'js'] // Allow these extensions
}));

// Serve admin CSS files directly
app.use('/admin/css', express.static(path.join(__dirname, '../admin/css')));

// Serve admin JS files directly  
app.use('/admin/js', express.static(path.join(__dirname, '../admin/js')));

// Serve admin images directly
app.use('/admin/images', express.static(path.join(__dirname, '../admin/images')));

// Serve root-level images for logo
app.use('/image', express.static(path.join(__dirname, '../frontend/image')));


// ==================== EXPLICIT ADMIN ROUTES ====================
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/admin.html'));
});

app.get('/admin-login', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/admin-login.html'));
});

console.log('✅ Static files configured:');
console.log('   - Frontend:', path.join(__dirname, '../frontend'));
console.log('   - Admin:', path.join(__dirname, '../admin'));
console.log('   - Admin CSS:', path.join(__dirname, '../admin/css'));
console.log('   - Admin JS:', path.join(__dirname, '../admin/js'));


// ==================== GMAIL API CONFIGURATION ====================
// Gmail API email sending function
async function sendVerificationEmail(userEmail, verificationToken, name) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Use the refresh token from your dedicated sender account
  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
  
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to Moya Restaurant!</h2>
      <p>Hello ${name},</p>
      <p>Thank you for registering with Moya Restaurant. Please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Verify Email Address
        </a>
      </div>
      <p>Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 5px;">${verificationLink}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account, please ignore this email.</p>
      <hr style="margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">Moya Restaurant - Delicious food delivered to you</p>
    </div>
  `;

  const message = [
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    'From: "Moya Restaurant" <befikirtassew89@gmail.com>',
    `To: ${userEmail}`,
    'Subject: Verify Your Email Address - Moya Restaurant',
    '',
    emailContent
  ].join('\n');

  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  try {
    console.log('📧 Attempting to send verification email to:', userEmail);
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage }
    });
    console.log('✅ Verification email sent successfully to:', userEmail);
    console.log('📧 Message ID:', result.data.id);
    return { success: true, messageId: result.data.id };
  } catch (error) {
    console.error('❌ Error sending verification email:', error.message);
    return { success: false, error: error.message };
  }
}

console.log('✅ Gmail API configured for email sending');

// ==================== DEBUG EMAIL ENDPOINT ====================
app.post('/api/debug-email', async (req, res) => {
  try {
    const { toEmail = 'test@example.com' } = req.body;
    
    console.log('🔍 DEBUG: Testing Gmail API configuration...');
    
    // Test the Gmail API by sending a test email
    const testToken = 'debug-test-token';
    const result = await sendVerificationEmail(toEmail, testToken, 'Test User');
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Debug email sent successfully via Gmail API',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Debug email failed: ' + result.error
      });
    }
    
  } catch (error) {
    console.error('🔍 DEBUG: Gmail API email sending FAILED:', error);
    res.status(500).json({
      success: false,
      message: 'Debug email failed: ' + error.message
    });
  }
});

// ==================== PAYMENT ROUTES ====================
// Create Stripe payment intent
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', metadata = {} } = req.body;
    
    console.log('💰 Creating REAL PaymentIntent for amount:', amount, 'cents');

    if (!amount || amount < 50) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: metadata
    });

    console.log('✅ REAL PaymentIntent created:', paymentIntent.id);
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('❌ Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});
// ===== ORDER CREATION ENDPOINT =====
app.post('/api/orders', async (req, res) => {
  let connection;
  try {
    const {
      items,
      total,
      subtotal,
      tax,
      orderType,
      paymentMethod,
      paymentStatus,
      notes,
      user_id,
      session_id,
      deliveryAddress,
      customerName,   
      customerPhone,  
      customerEmail 
    } = req.body;

    console.log('📦 Received order request:', { customerName, customerPhone, total, items: items?.length });

    // Validate required fields
    if (!customerName || !customerPhone || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: customerName, customerPhone, and items are required'
      });
    }

    // Generate order number
    const orderNumber = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
   
    // ✅ ACTUALLY SAVE TO DATABASE
    console.log('💾 Saving order to database...');
    
    // Start transaction
    connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Insert the main order
      const [orderResult] = await connection.execute(
        `INSERT INTO orders (
          order_number, customer_name, customer_phone, customer_email, 
          total_amount, subtotal_amount, tax_amount, order_type, 
          payment_method, payment_status, notes, user_id, session_id,
          delivery_address, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', NOW(), NOW())`,
        [
          orderNumber,
          customerName,
          customerPhone,
          customerEmail || '',
          parseFloat(total),
          parseFloat(subtotal),
          parseFloat(tax),
          orderType || 'dine-in',
          paymentMethod || 'cash',
          paymentStatus || 'paid',
          notes || '',
          user_id || null,
          session_id || null,
          deliveryAddress ? JSON.stringify(deliveryAddress) : null
        ]
      );

      const orderId = orderResult.insertId;
      console.log('✅ Order saved to database with ID:', orderId);

      // 2. Insert order items
      for (const item of items) {
        await connection.execute(
          `INSERT INTO order_items (
            order_id, menu_item_id, item_name, quantity, unit_price, 
            variant, special_instructions, total_price, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            orderId,
            item.id || item.menu_item_id,
            item.name,
            parseInt(item.quantity),
            parseFloat(item.price),
            item.variant || null,
            item.specialInstructions || '',
            parseFloat(item.total || (item.price * item.quantity))
          ]
        );
        console.log(`✅ Saved order item: ${item.name} x ${item.quantity}`);
      }
     
      // Commit transaction
      await connection.commit();
      connection.release();

      console.log('✅ Order and items saved successfully');

      // 3. Get the complete order with items for response
      const [savedOrders] = await db.execute(`
        SELECT o.*, 
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
               ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.id = ?
        GROUP BY o.id
      `, [orderId]);

      const savedOrder = savedOrders[0];

      // Convert items from JSON string to object if needed
      if (savedOrder.items && typeof savedOrder.items === 'string') {
        savedOrder.items = JSON.parse(savedOrder.items);
      }

      console.log('✅ Order creation completed:', orderNumber);
      
      res.json({
        success: true,
        order: savedOrder
      });

    } catch (dbError) {
      // Rollback transaction on error
      if (connection) {
        await connection.rollback();
        connection.release();
      }
      console.error('❌ Database error during order creation:', dbError);
      throw dbError;
    }

  } catch (error) {
    console.error('❌ Order creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order: ' + error.message
    });
  }
});

// Handle successful payment
app.post('/api/payment-success', async (req, res) => {
  try {
    const { paymentIntentId, userId, cartItems, deliveryAddress, customerInfo } = req.body;
    
    console.log('✅ Payment successful:', paymentIntentId);
    
    let paymentIntent;
    
    if (paymentIntentId.startsWith('pi_mock_')) {
        console.log('💳 Processing mock payment');
        paymentIntent = {
            id: paymentIntentId,
            status: 'succeeded',
            amount: Math.round(parseFloat(req.body.amount || '20.00') * 100),
            currency: 'usd'
        };
    } else {
        paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    }
    
    const [orderResult] = await db.execute(
      `INSERT INTO orders (user_id, total_amount, status, payment_intent_id, payment_status, 
       delivery_address, customer_name, customer_phone, customer_email, created_at) 
       VALUES (?, ?, 'confirmed', ?, 'paid', ?, ?, ?, ?, NOW())`,
      [
        userId, 
        paymentIntent.amount / 100, 
        paymentIntentId,
        deliveryAddress || 'Not specified',
        customerInfo?.name || 'Guest',
        customerInfo?.phone || 'Not provided',
        customerInfo?.email || 'Not provided'
      ]
    );
    
    const orderIdDb = orderResult.insertId;
    
    for (const item of cartItems) {
      await db.execute(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, price, variant, special_instructions) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderIdDb, item.menu_item_id, item.quantity, item.price, item.variant, item.special_instructions]
      );
    }
    
    if (userId) {
      await db.execute('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    }
    
    res.json({
      success: true,
      message: 'Payment processed successfully',
      orderId: orderIdDb,
      paymentDetails: {
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        isMock: paymentIntentId.startsWith('pi_mock_')
      }
    });
    
  } catch (error) {
    console.error('❌ Error processing payment success:', error);
    res.status(500).json({ error: error.message });
  }
});

// Other payment routes...
app.get('/api/payment-status/:paymentIntentId', async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency
    });
  } catch (error) {
    console.error('❌ Error retrieving payment status:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/refund-payment', async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
    });
    
    await db.execute(
      'UPDATE orders SET status = "refunded", payment_status = "refunded" WHERE payment_intent_id = ?',
      [paymentIntentId]
    );
    
    res.json({
      success: true,
      message: 'Payment refunded successfully',
      refundId: refund.id
    });
  } catch (error) {
    console.error('❌ Error refunding payment:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stripe-config', (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    successUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/order-success.html`,
    cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cart.html`
  });
});

// ==================== GOOGLE OAUTH ROUTES ====================
app.get('/api/auth/google/config', (req, res) => {
    res.json({
        googleClientId: process.env.GOOGLE_CLIENT_ID ? '✅ Configured' : '❌ Missing',
        googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? '✅ Configured' : '❌ Missing',
        googleCallback: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
        status: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? 'Ready' : 'Not Configured'
    });
});

app.get('/auth/google', (req, res, next) => {
    console.log('🔐 Initiating Google OAuth flow');
    const state = req.query.returnUrl || '/';
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        state: state
    })(req, res, next);
});

app.get('/auth/google/callback', (req, res, next) => {
    console.log('🔄 Google OAuth callback received');
    
    passport.authenticate('google', { 
        failureRedirect: '/signin?error=google_auth_failed',
        session: false 
    }, async (err, user, info) => {
        try {
            if (err) {
                console.error('❌ Google OAuth error:', err);
                return res.redirect('/signin?error=oauth_error');
            }
            
            if (!user) {
                console.error('❌ Google OAuth failed: No user returned');
                return res.redirect('/signin?error=authentication_failed');
            }
            
            console.log('✅ Google OAuth successful for:', user.email);
            
            const token = jwt.sign(
                { 
                    userId: user.id, 
                    email: user.email 
                }, 
                process.env.JWT_SECRET || 'your-secret-key-123',
                { expiresIn: '7d' }
            );

            const userData = {
                id: user.id,
                name: user.name,
                email: user.email,
                is_verified: user.is_verified,
                avatar_url: user.avatar_url
            };

            const returnUrl = req.query.state || '/';
            const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/signin?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}&returnUrl=${encodeURIComponent(returnUrl)}`;
            
            console.log('🔗 Redirecting to:', redirectUrl);
            res.redirect(redirectUrl);

        } catch (error) {
            console.error('❌ Google callback processing error:', error);
            res.redirect('/signin?error=oauth_processing_error');
        }
    })(req, res, next);
});

app.get('/auth/google/success', (req, res) => {
    const token = req.query.token;
    const user = req.query.user;
    
    if (!token || !user) {
        return res.redirect('/signin?error=missing_auth_data');
    }
    
    try {
        const userData = JSON.parse(decodeURIComponent(user));
        res.json({
            success: true,
            message: 'Google authentication successful',
            token: token,
            user: userData
        });
    } catch (error) {
        console.error('Error parsing user data:', error);
        res.redirect('/signin?error=invalid_user_data');
    }
});

app.post('/auth/google/revoke', async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Google OAuth session ended'
        });
    } catch (error) {
        console.error('Error revoking Google OAuth:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to revoke Google OAuth'
        });
    }
});

// ==================== ADMIN AUTHENTICATION ROUTES ====================
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log(`🔐 Admin login attempt: ${email}`);
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    const [users] = await db.execute(
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
    const validPassword = await bcrypt.compare(password, adminUser.password);
    if (!validPassword) {
      console.log(`❌ Invalid password for admin: ${email}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    console.log(`✅ Admin login successful: ${adminUser.name}`);
    
    const token = jwt.sign(
      { 
        userId: adminUser.id, 
        email: adminUser.email,
        role: 'admin'
      }, 
      process.env.JWT_SECRET || 'your-secret-key-123',
      { expiresIn: '24h' }
    );
    
    const { password: _, ...userWithoutPassword } = adminUser;
    
    res.json({
      success: true,
      message: 'Login successful',
      admin: userWithoutPassword,
      token: token
    });

  } catch (error) {
    console.error('❌ Admin login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

app.post('/api/admin/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    console.log(`👤 Admin registration attempt: ${email}`);
    
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email and password are required' 
      });
    }

    const [existingUsers] = await db.execute(
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

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password, role, is_verified, created_at) VALUES (?, ?, ?, "admin", TRUE, NOW())',
      [name, email, hashedPassword]
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

app.get('/api/admin/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }
    
    console.log('🔐 Token verification attempt:', token);
    
    if (token.includes('.')) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-123');
        const [users] = await db.execute(
          'SELECT id, name, email, role FROM users WHERE id = ? AND role = "admin"',
          [decoded.userId]
        );
        
        if (users.length === 0) {
          return res.status(401).json({ 
            success: false, 
            message: 'Invalid token or not an admin' 
          });
        }
        
        console.log('✅ JWT token verified for:', users[0].email);
        res.json({ 
          success: true, 
          admin: users[0] 
        });
      } catch (jwtError) {
        console.error('❌ JWT verification failed:', jwtError.message);
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid or expired token' 
        });
      }
    } else {
      const [users] = await db.execute(
        'SELECT id, name, email, role FROM users WHERE id = ? AND role = "admin"',
        [token]
      );
      
      if (users.length === 0) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token or not an admin' 
        });
      }
      
      console.log('✅ Simple token verified for:', users[0].email);
      res.json({ 
        success: true, 
        admin: users[0] 
      });
    }
    
  } catch (error) {
    console.error('❌ Admin token verification error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Token verification failed' 
    });
  }
});

app.post('/api/admin/setup', async (req, res) => {
  try {
    const { email = 'admin@moyacafe.com', password = 'admin2025', name = 'Main Administrator' } = req.body;
    
    const [existingAdmins] = await db.execute(
      'SELECT id FROM users WHERE role = "admin"'
    );

    if (existingAdmins.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Admin account already exists' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password, role, is_verified, created_at) VALUES (?, ?, ?, "admin", TRUE, NOW())',
      [name, email, hashedPassword]
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

app.get('/api/admin/users', async (req, res) => {
  try {
    console.log('👥 Fetching all admin users...');
    
    const [users] = await db.execute(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.created_at,
        COUNT(o.id) as order_count
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.role = 'admin'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    
    console.log(`👥 Found ${users.length} admin users`);
    res.json({ users });
  } catch (error) {
    console.error('❌ Error fetching admin users:', error);
    res.status(500).json({ error: 'Failed to fetch admin users' });
  }
});



// ==================== ROUTE IMPORTS ====================
let cartRoutes, menuRoutes, orderRoutes, authRoutes, paymentRoutes;

try {
  cartRoutes = require('./routes/cart');
  console.log('✅ Cart routes loaded');
} catch (error) {
  console.log('❌ Cart routes not found, using fallback');
  cartRoutes = express.Router();
}

try {
  menuRoutes = require('./routes/menu');
  console.log('✅ Menu routes loaded');
} catch (error) {
  console.log('❌ Menu routes not found, using fallback');
  menuRoutes = express.Router();
}

try {
  orderRoutes = require('./routes/orders');
  console.log('✅ Order routes loaded');
} catch (error) {
  console.log('❌ Order routes not found, using fallback');
  orderRoutes = express.Router();
}

try {
  authRoutes = require('./routes/auth');
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.log('❌ Auth routes not found');
  authRoutes = express.Router();
}

try {
  paymentRoutes = require('./routes/payment');
  console.log('✅ Payment routes loaded');
} catch (error) {
  console.log('❌ Payment routes not found, using fallback');
  paymentRoutes = express.Router();

  // Basic fallback payment routes
  paymentRoutes.get('/api/payments/test', (req, res) => {
    res.json({ message: 'Payment API fallback is working!' });
  });
}
// Use the route files
app.use('/api/cart', cartRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);


// Test orders endpoint
app.get('/api/admin/test-orders', async (req, res) => {
  try {
    const [orders] = await db.execute('SELECT * FROM orders ORDER BY created_at DESC');
    const [orderItems] = await db.execute('SELECT * FROM order_items');
    
    console.log('📦 Orders in database:', orders.length);
    console.log('📦 Order items in database:', orderItems.length);
    
    res.json({
      orders: orders,
      orderItems: orderItems,
      counts: {
        orders: orders.length,
        orderItems: orderItems.length
      }
    });
  } catch (error) {
    console.error('❌ Test error:', error);
    res.status(500).json({ error: error.message });
  }
});
// ==================== TEST ENDPOINT ====================
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date() });
});

// ==================== AUTHENTICATION ROUTES ====================
app.get('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required' });
    }
    
    const [rows] = await db.execute(
      'SELECT id, email, name FROM users WHERE verification_token = ? AND is_verified = FALSE',
      [token]
    );
    
    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    }
    
    const user = rows[0];
    await db.execute(
      'UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = ?',
      [user.id]
    );
    
    console.log('✅ Email verified for:', user.email);
    
    const authToken = jwt.sign(
      { userId: user.id, email: user.email }, 
      process.env.JWT_SECRET || 'your-secret-key-123',
      { expiresIn: '7d' }
    );
    
    res.json({ 
      success: true, 
      message: 'Email verified successfully!',
      token: authToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('❌ Email verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/auth/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    const [rows] = await db.execute(
      'SELECT id, name, email, is_verified FROM users WHERE email = ?',
      [email]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const user = rows[0];
    if (user.is_verified) {
      return res.status(400).json({ success: false, message: 'Email is already verified' });
    }
    
    const newToken = generateToken();
    await db.execute(
      'UPDATE users SET verification_token = ? WHERE id = ?',
      [newToken, user.id]
    );
    
    const emailResult = await sendVerificationEmail(user.email, newToken, user.name);
    
    if (emailResult.success) {
      res.json({ success: true, message: 'Verification email sent successfully!' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send verification email: ' + emailResult.error });
    }
    
  } catch (error) {
    console.error('❌ Resend verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log('📝 Signup attempt for:', email);
    
    const [exists] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    
    if (exists.length > 0) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = generateToken();
    
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password, verification_token) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, verificationToken]
    );
    
    console.log('✅ New user created:', email, 'ID:', result.insertId);
    
    // Send REAL verification email with Gmail API
    const emailResult = await sendVerificationEmail(email, verificationToken, name);
    
    if (!emailResult.success) {
      console.log('⚠️ User created but verification email failed:', emailResult.error);
      return res.json({ 
        success: true, 
        message: 'Registration successful! However, we could not send the verification email. Please contact support.',
        requiresVerification: true,
        emailSent: false
      });
    }
    
    console.log('✅ Verification email sent successfully to:', email);
    
    res.json({ 
      success: true, 
      message: 'Registration successful! Please check your email to verify your account.',
      requiresVerification: true,
      emailSent: true
    });
    
  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 Login attempt for:', email);
    
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    
    if (rows.length === 0) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    
    const user = rows[0];
    
    if (!user.is_verified) {
      console.log('❌ Email not verified:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Please verify your email before logging in. Check your email for the verification link.',
        requiresVerification: true
      });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    
    const sessionId = req.sessionID;
    console.log('🛒 Session ID for cart transfer:', sessionId);
    
    const token = jwt.sign(
      { userId: user.id, email: user.email }, 
      process.env.JWT_SECRET || 'your-secret-key-123',
      { expiresIn: '7d' }
    );
    
    if (sessionId) {
      try {
        console.log(`🔄 Transferring cart: session ${sessionId} → user ${user.id}`);
        const [result] = await db.execute(
          'UPDATE cart_items SET user_id = ?, session_id = NULL WHERE session_id = ? AND user_id IS NULL',
          [user.id, sessionId]
        );
        console.log(`✅ Transferred ${result.affectedRows} cart items to user ${user.id}`);
      } catch (cartError) {
        console.error('⚠️ Cart transfer failed, but login continues:', cartError);
      }
    }
    
    console.log('✅ Login successful for:', user.email);
    
    res.json({ 
      success: true, 
      message: 'Login successful',
      token: token,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email 
      }
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/auth/verify', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-123');
    const [rows] = await db.execute(
      'SELECT id, name, email FROM users WHERE id = ?',
      [decoded.userId]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    const user = rows[0];
    console.log('✅ Auto-login successful for:', user.email);
    
    res.json({ 
      success: true, 
      user: user 
    });
    
  } catch (error) {
    console.error('❌ Token verification failed:', error);
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

// ==================== CART ENDPOINTS ====================
app.post('/api/cart/add', async (req, res) => {
  try {
    const { session_id, user_id, menu_item_id, quantity = 1, variant = null } = req.body;
    
    if ((!session_id && !user_id) || !menu_item_id) {
      return res.status(400).json({ error: 'Session ID or User ID and Menu Item ID are required' });
    }
    
    console.log('🛒 Adding to cart:', { session_id, user_id, menu_item_id, quantity, variant });
    
    try {
      await db.execute('SELECT 1 FROM cart_items LIMIT 1');
    } catch (error) {
      if (error.code === 'ER_NO_SUCH_TABLE') {
        console.log('📋 Creating cart_items table...');
        await db.execute(`
          CREATE TABLE cart_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            session_id VARCHAR(255) NULL,
            user_id INT NULL,
            menu_item_id INT NOT NULL,
            quantity INT NOT NULL DEFAULT 1,
            variant VARCHAR(500) NULL,
            special_instructions TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
      }
    }
    
    let existingItems;
    if (user_id) {
      [existingItems] = await db.execute(
        'SELECT * FROM cart_items WHERE user_id = ? AND menu_item_id = ? AND (variant = ? OR (variant IS NULL AND ? IS NULL))',
        [user_id, menu_item_id, variant, variant]
      );
    } else {
      [existingItems] = await db.execute(
        'SELECT * FROM cart_items WHERE session_id = ? AND menu_item_id = ? AND (variant = ? OR (variant IS NULL AND ? IS NULL))',
        [session_id, menu_item_id, variant, variant]
      );
    }
    
    if (existingItems.length > 0) {
      if (user_id) {
        await db.execute(
          'UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND menu_item_id = ? AND (variant = ? OR (variant IS NULL AND ? IS NULL))',
          [quantity, user_id, menu_item_id, variant, variant]
        );
      } else {
        await db.execute(
          'UPDATE cart_items SET quantity = quantity + ? WHERE session_id = ? AND menu_item_id = ? AND (variant = ? OR (variant IS NULL AND ? IS NULL))',
          [quantity, session_id, menu_item_id, variant, variant]
        );
      }
    } else {
      await db.execute(
        'INSERT INTO cart_items (session_id, user_id, menu_item_id, quantity, variant) VALUES (?, ?, ?, ?, ?)',
        [session_id, user_id, menu_item_id, quantity, variant]
      );
    }
    
    res.json({ 
      success: true, 
      message: 'Item added to cart'
    });
    
  } catch (error) {
    console.error('❌ Error adding to cart:', error.message);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

app.post('/api/cart/transfer', async (req, res) => {
  try {
    const { session_id, user_id } = req.body;
    console.log('🔄 Transferring cart from session:', session_id, 'to user:', user_id);
    await db.execute(
      'UPDATE cart_items SET user_id = ?, session_id = NULL WHERE session_id = ?',
      [user_id, session_id]
    );
    res.json({ success: true, message: 'Cart transferred successfully' });
  } catch (error) {
    console.error('Error transferring cart:', error);
    res.status(500).json({ error: 'Failed to transfer cart' });
  }
});

app.get('/api/cart/:identifier', async (req, res) => {
  try {
    const identifier = req.params.identifier;
    console.log('📦 Fetching cart for:', identifier);
    
    let cartItems;
    
    if (!isNaN(identifier)) {
      [cartItems] = await db.execute(`
        SELECT ci.*, mi.name, mi.price, mi.image_url, mi.description 
        FROM cart_items ci 
        LEFT JOIN menu_items mi ON ci.menu_item_id = mi.id 
        WHERE ci.user_id = ?
        ORDER BY ci.created_at DESC
      `, [identifier]);
    } else {
      [cartItems] = await db.execute(`
        SELECT ci.*, mi.name, mi.price, mi.image_url, mi.description 
        FROM cart_items ci 
        LEFT JOIN menu_items mi ON ci.menu_item_id = mi.id 
        WHERE ci.session_id = ?
        ORDER BY ci.created_at DESC
      `, [identifier]);
    }
    
    console.log(`✅ Found ${cartItems.length} items for identifier ${identifier}`);
    res.json(cartItems);
    
  } catch (error) {
    console.error('❌ Error fetching cart:', error.message);
    if (error.code === 'ER_NO_SUCH_TABLE') {
      res.json([]);
    } else {
      res.status(500).json({ error: 'Failed to fetch cart' });
    }
  }
});

app.put('/api/cart/update/:cartItemId', async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const { quantity } = req.body;
    
    if (quantity <= 0) {
      await db.execute('DELETE FROM cart_items WHERE id = ?', [cartItemId]);
    } else {
      await db.execute('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, cartItemId]);
    }
    
    res.json({ success: true, message: 'Cart updated' });
  } catch (error) {
    console.error('❌ Error updating cart:', error.message);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

app.delete('/api/cart/remove/:cartItemId', async (req, res) => {
  try {
    const { cartItemId } = req.params;
    await db.execute('DELETE FROM cart_items WHERE id = ?', [cartItemId]);
    res.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    console.error('❌ Error removing item:', error.message);
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

app.delete('/api/cart/clear/:identifier', async (req, res) => {
  try {
    const identifier = req.params.identifier;
    console.log('🧹 Clearing cart for:', identifier);

    if (!isNaN(identifier)) {
      await db.execute('DELETE FROM cart_items WHERE user_id = ?', [identifier]);
    } else {
      await db.execute('DELETE FROM cart_items WHERE session_id = ?', [identifier]);
    }

    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    console.error('❌ Error clearing cart:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

app.post('/api/cart/merge', async (req, res) => {
  try {
    const { session_id, user_id } = req.body;
    console.log('🔄 Merging cart from session:', session_id, 'to user:', user_id);
    await db.execute(
      'UPDATE cart_items SET user_id = ?, session_id = NULL WHERE session_id = ?',
      [user_id, session_id]
    );
    res.json({ success: true, message: 'Cart merged successfully' });
  } catch (error) {
    console.error('Error merging cart:', error);
    res.status(500).json({ error: 'Failed to merge cart' });
  }
});

app.get('/api/menu', async (req, res) => {
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
    console.error('Error fetching menu:', error);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// Serve menu images
app.use('/image', express.static(path.join(__dirname, 'images')));

app.use('/image/*', (req, res) => {
    const imageName = req.params[0];
    const svg = `<svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f8f9fa"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="12" 
              fill="#6c757d" text-anchor="middle" dominant-baseline="middle">
            ${imageName}
        </text>
    </svg>`;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
});

// ==================== PAGE ROUTES ====================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/order.html'));
});

app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/cart.html'));
});

app.get('/signin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/signin.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/about.html'));
});

app.get('/order', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/order.html'));
});

app.get('/admin-login', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/admin-login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/admin.html'));
});

// ==================== HELPER FUNCTIONS ====================
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ==================== CREATE DEFAULT ADMIN ACCOUNT ====================
async function createDefaultAdmin() {
  try {
    const [existingAdmins] = await db.execute(
      'SELECT id FROM users WHERE role = "admin"'
    );

    if (existingAdmins.length === 0) {
      const hashedPassword = await bcrypt.hash('admin2025', 10);
      await db.execute(
        'INSERT INTO users (name, email, password, role, is_verified, created_at) VALUES (?, ?, ?, "admin", TRUE, NOW())',
        ['Main Administrator', 'admin@moyacafe.com', hashedPassword]
      );
      console.log('✅ Default admin account created: admin@moyacafe.com / admin2025');
    } else {
      console.log('✅ Admin account already exists');
    }
  } catch (error) {
    console.error('❌ Error creating default admin:', error);
  }
}

// ==================== START SERVER ====================
const PORT = process.env.PORT || 3000;

createDefaultAdmin().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 WORKING Server running on http://localhost:${PORT}`);
    console.log(`✅ Test endpoint: http://localhost:${PORT}/api/test`);
    console.log(`🔐 Authentication: http://localhost:${PORT}/api/auth/signup`);
    console.log(`🔐 Admin login: http://localhost:${PORT}/api/admin/login`);
    console.log(`👨‍💼 Admin panel: http://localhost:${PORT}/admin`);
    console.log(`🔐 Admin login page: http://localhost:${PORT}/admin-login`);
    console.log(`💳 Stripe payments ready: http://localhost:${PORT}/api/stripe-config`);
    console.log(`🛒 Cart system ready`);
    console.log(`🍕 Menu system ready`);
    console.log(`📧 Gmail API email verification enabled`);
    console.log(`🔐 Google OAuth ready`);
    console.log(`\n📋 Default Admin Credentials:`);
    console.log(`   Email: admin@moyacafe.com`);
    console.log(`   Password: admin2025`);
  });
});