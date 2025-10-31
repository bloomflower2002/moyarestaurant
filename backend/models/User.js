const db = require('../db');

const User = {
  // Create new user - UPDATED to match auth routes
  create: async (userData) => {
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [userData.name, userData.email, userData.password]
    );
    return result;
  },

  // Find user by email
  findByEmail: async (email) => {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  },

  // Find user by username (if you still need it)
  findByUsername: async (username) => {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    return rows[0];
  },

  // Find user by ID
  findById: async (id) => {
    const [rows] = await db.execute(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  },

  // Add verification update method
  updateVerification: async (userId, isVerified) => {
    const [result] = await db.execute(
      'UPDATE users SET email_verified = ? WHERE id = ?',
      [isVerified ? 1 : 0, userId] // MySQL uses 1/0 for booleans
    );
    return result;
  },

  // ADD THESE TWO NEW METHODS:
  updateProfile: async (userId, profileData) => {
    const [result] = await db.execute(
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
      [profileData.name, profileData.email, userId]
    );
    return result;
  },

  updatePassword: async (userId, hashedPassword) => {
    const [result] = await db.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );
    return result;
  },

  // ADD THIS METHOD: Transfer session cart to user cart
  transferSessionCart: async (sessionId, userId) => {
    const connection = await db.getConnection();
    try {
      console.log(`🔄 Transferring cart: session ${sessionId} → user ${userId}`);
      
      // Update cart items from session to user
      const [result] = await connection.execute(
        'UPDATE cart_items SET user_id = ?, session_id = NULL WHERE session_id = ? AND user_id IS NULL',
        [userId, sessionId]
      );
      
      console.log(`✅ Transferred ${result.affectedRows} cart items to user ${userId}`);
      return result.affectedRows;
      
    } catch (error) {
      console.error('❌ Cart transfer error:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
};

module.exports = User;