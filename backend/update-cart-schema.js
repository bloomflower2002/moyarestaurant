const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true
});

const updateSchema = `
-- Drop the existing cart_items table
DROP TABLE IF EXISTS cart_items;

-- Recreate cart_items without user_id foreign key constraint
CREATE TABLE cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    menu_item_id INT,
    quantity INT NOT NULL DEFAULT 1,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

-- Add index for better performance
CREATE INDEX idx_session_id ON cart_items(session_id);
`;

async function updateCartSchema() {
  try {
    console.log('🔄 Updating cart schema for guest users...');
    
    await connection.promise().query(updateSchema);
    console.log('✅ Cart schema updated successfully!');
    console.log('🎉 Users can now add items without signing in');
    
  } catch (error) {
    console.log('❌ Error updating schema:', error.message);
  } finally {
    connection.end();
  }
}

updateCartSchema();