// test-email.js
const { sendVerificationEmail } = require('./utils/emailService');
require('dotenv').config();

async function testEmail() {
  try {
    console.log('📧 Testing email sending...');
    const result = await sendVerificationEmail(
      'test@example.com', 
      'test-token-123', 
      'Test User'
    );
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
    } else {
      console.log('❌ Email failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testEmail();