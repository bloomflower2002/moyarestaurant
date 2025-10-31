// config/passport-google.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mysql = require('mysql2/promise');
require('dotenv').config();

// Database connection
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'BeTa-@1234',
  database: 'moyadb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const callbackURL = process.env.GOOGLE_CALLBACK || 'http://localhost:3000/auth/google/callback';

console.log('🔐 Google OAuth Config:', {
  clientID: clientID ? '✅ Set' : '❌ Missing',
  clientSecret: clientSecret ? '✅ Set' : '❌ Missing',
  callbackURL: callbackURL
});

passport.use(new GoogleStrategy({
  clientID,
  clientSecret,
  callbackURL,
  scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('📨 Google OAuth profile received:', profile.displayName, profile.emails[0].value);

    // Check if user already exists in database
    const [existingUsers] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [profile.emails[0].value]
    );

    if (existingUsers.length > 0) {
      console.log('✅ Existing user found:', existingUsers[0].email);
      
      // Update user info if needed
      await pool.execute(
        'UPDATE users SET name = ?, avatar_url = ?, is_verified = TRUE WHERE email = ?',
        [profile.displayName, profile.photos[0].value, profile.emails[0].value]
      );
      
      return done(null, existingUsers[0]);
    }

    // Create new user
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password, is_verified, avatar_url, verification_token) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        profile.displayName,
        profile.emails[0].value,
        'google-oauth-no-password',
        true,
        profile.photos[0].value,
        null
      ]
    );

    const newUser = {
      id: result.insertId,
      name: profile.displayName,
      email: profile.emails[0].value,
      is_verified: true,
      avatar_url: profile.photos[0].value
    };

    console.log('✅ New Google user created:', newUser.email);
    return done(null, newUser);

  } catch (error) {
    console.error('❌ Google OAuth database error:', error);
    return done(error, null);
  }
}));

// Serialize/deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const [users] = await pool.execute('SELECT id, name, email, is_verified, avatar_url FROM users WHERE id = ?', [id]);
    if (users.length > 0) {
      done(null, users[0]);
    } else {
      done(new Error('User not found'), null);
    }
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;