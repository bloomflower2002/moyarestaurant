const db = require('./db');

async function checkSchema() {
  try {
    console.log('🔍 Checking current database schema...');
    
    // Check cart_items table structure
    const [columns] = await db.execute('DESCRIBE cart_items');
    console.log('📊 Cart table columns:');
    columns.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type} ${col.Key || ''}`);
    });
    
    // Check if there are any cart items
    const [cartItems] = await db.execute('SELECT * FROM cart_items LIMIT 5');
    console.log(`📦 Current cart items: ${cartItems.length}`);
    cartItems.forEach(item => {
      console.log(`   - ID: ${item.id}, Session: ${item.session_id}, Menu Item: ${item.menu_item_id}`);
    });
    
  } catch (error) {
    console.log('❌ Schema check failed:', error.message);
  } finally {
    process.exit();
  }
}

checkSchema();