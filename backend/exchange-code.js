// exchange-code.js (NEW FILE)
const { google } = require('googleapis');
require('dotenv').config();

async function getTokens() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/auth/google/callback'
  );

  // ⚠️ REPLACE THIS WITH THE ACTUAL CODE FROM YOUR URL ⚠️
  const code = 'PASTE_THE_CODE_FROM_URL_HERE';
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('✅ SUCCESS! Save this in your .env file:');
    console.log('GMAIL_REFRESH_TOKEN=' + tokens.refresh_token);
    console.log('\n🎉 Your app can now send automated emails!');
    
  } catch (error) {
    console.error('Error getting tokens:', error);
  }
}

getTokens();