// backend/auth.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mysql = require('mysql2/promise');
require('dotenv').config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        'http://localhost:3000/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const connection = await mysql.createConnection({
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASS,
          database: process.env.DB_NAME,
        });

        // Check if user exists by google_id or email
        const [rows] = await connection.execute(
          'SELECT * FROM users WHERE google_id = ? OR email = ?',
          [profile.id, profile.emails[0].value]
        );

        if (rows.length > 0) {
          console.log('✅ Google user found:', rows[0].email);
          return done(null, rows[0]);
        }

        // Create a new user if not found
        const [result] = await connection.execute(
          'INSERT INTO users (name, email, google_id, is_verified) VALUES (?, ?, ?, ?)',
          [profile.displayName, profile.emails[0].value, profile.id, true]
        );

        const [newUser] = await connection.execute(
          'SELECT * FROM users WHERE id = ?',
          [result.insertId]
        );

        console.log('✅ New Google user created:', newUser[0].email);
        return done(null, newUser[0]);
      } catch (err) {
        console.error('❌ Google OAuth error:', err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => done(null, id));
