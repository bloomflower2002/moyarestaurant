// utils/emailService.js
const { google } = require('googleapis');

async function sendVerificationEmail(userEmail, verificationToken) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const verificationLink = `https://yourapp.com/verify-email?token=${verificationToken}`;
  
  const emailContent = `
    <h2>Verify Your Email</h2>
    <p>Click the link to verify your email address:</p>
    <a href="${verificationLink}">Verify Email</a>
  `;

  const message = [
    'Content-Type: text/html; charset=utf-8',
    'From: "Your App Name" <befikirtassew89@gmail.com>',
    `To: ${userEmail}`,
    'Subject: Verify Your Email Address',
    '',
    emailContent
  ].join('\n');

  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encodedMessage }
  });
}

module.exports = { sendVerificationEmail };