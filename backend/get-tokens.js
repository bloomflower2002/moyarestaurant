// get-tokens.js (TEMPORARY - delete after use)
const { google } = require('googleapis');
require('dotenv').config();

async function setupSenderAccount() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/auth/google/callback' 
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.send'],
    prompt: 'consent'
  });

  console.log('🔗 COPY AND VISIT THIS URL in your browser:');
  console.log(authUrl);
  console.log('\n👉 Make sure you are logged into your NEW dedicated account!');
}

setupSenderAccount();