// controllers/authController.js
const { sendVerificationEmail } = require('../utils/emailService');

async function registerUser(req, res) {
  try {
    const { email, password } = req.body;
    
    // 1. Create user in database
    const user = await User.create({ email, password });
    
    // 2. Generate verification token
    const verificationToken = generateToken();
    
    // 3. Send verification email
    await sendVerificationEmail(email, verificationToken);
    
    res.json({ 
      success: true, 
      message: 'Registration successful! Check your email for verification.' 
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { registerUser };