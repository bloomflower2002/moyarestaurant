const db = require('./db');

// Function to create placeholder images
function createPlaceholderSVG(itemName, category) {
  const colors = {
    'Breakfast': '#FF6B6B',
    'Lunch': '#4ECDC4', 
    'Combination': '#45B7D1',
    'Vegetarian': '#96CEB4',
    'Sea Food': '#FFEAA7',
    'Kitfo': '#DDA0DD',
    'Side Dish': '#98D8C8',
    'Extra': '#F7DC6F',
    'Beverage': '#BB8FCE'
  };
  
  const color = colors[category] || '#6C757D';
  
  const svg = `<svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${color}" opacity="0.1"/>
    <rect x="10%" y="10%" width="80%" height="60%" fill="${color}" opacity="0.3" rx="5"/>
    <text x="50%" y="40%" font-family="Arial, sans-serif" font-size="12" 
          fill="${color}" text-anchor="middle" dominant-baseline="middle">
      ${category}
    </text>
    <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="14" 
          fill="#333" text-anchor="middle" dominant-baseline="middle" font-weight="bold">
      ${itemName}
    </text>
    <text x="50%" y="70%" font-family="Arial, sans-serif" font-size="10" 
          fill="#666" text-anchor="middle" dominant-baseline="middle">
      Menu Item
    </text>
  </svg>`;
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// Update your menuData to use data URIs instead of file paths
const menuDataWithPlaceholders = menuData.map(item => ({
  ...item,
  image_url: createPlaceholderSVG(item.name, item.category)
}));

// COMPLETE menu data with ALL 62 items
const menuData = [
  // Breakfast (10 items)
  { name: 'Ful', description: 'Fava beans cooked with minced onions and tomatoes', price: 10.99, image_url: 'image/ful.jpeg', category: 'Breakfast' },
  { name: 'Special Ful', description: 'Ful with egg', price: 15.99, image_url: 'image/specialful.jpeg', category: 'Breakfast' },
  { name: 'Chechebsa', description: 'Toasted flatbread pieces heated with berbere and spiced butter or olive oil. (Black teff +$1.99)', price: 10.99, image_url: 'image/Chechebsa.jpg', category: 'Breakfast' },
  { name: 'Special Chechebsa', description: 'Chechebsa with egg', price: 15.99, image_url: 'image/specialchechebsa.jpeg', category: 'Breakfast' },
  { name: 'Enkulal Firfir', description: 'Scrambled eggs sauced with tomatoes, onions and jalapeños', price: 11.99, image_url: 'image/enkulalfirifiri.jpeg', category: 'Breakfast' },
  { name: 'Enkulal Besiga', description: 'Scrambled eggs with minced meat, tomatoes, onions, garlic and jalapeños', price: 15.99, image_url: 'image/enkulalbesiga.jpeg', category: 'Breakfast' },
  { name: 'YetSom Firfir', description: 'Shredded injera tossed in a vegetable sauce', price: 12.99, image_url: 'image/yetsomfirfir.jpeg', category: 'Breakfast' },
  { name: 'Feta', description: 'Dabo firfir with tomato sauce, enkulal firfir, served with homemade yogurt', price: 15.99, image_url: 'image/feta.jpg', category: 'Breakfast' },
  { name: 'Pasta', description: 'Pasta made with intensely flavored sauce; gluten-free & vegan options available', price: 12.99, image_url: 'image/pasta.jpeg', category: 'Breakfast' },

  // Lunch (9 items)
  { name: 'Tibs', description: 'Tender tips of marinated beef with jalapeños, onions, garlic and rosemary', price: 17.99, image_url: 'image/tibs.jpg', category: 'Lunch' },
  { name: 'Derek Tibs', description: 'Tender shoulder cubes marinated in chef\'s blend, stir-fried with wine', price: 21.99, image_url: 'image/derektibs.jpeg', category: 'Lunch' },
  { name: 'Awaze Tibs', description: 'Beef tips with berbere, jalapeños, onions, garlic and rosemary', price: 19.99, image_url: 'image/awazetibs.jpg', category: 'Lunch' },
  { name: 'Kuanta Firfir', description: 'Beef jerky cooked in light berbere sauce and tossed with shredded injera', price: 18.99, image_url: 'image/kuantafirfir.jpeg', category: 'Lunch' },
  { name: 'Dulet', description: 'Chopped tripe, liver, and beef sautéed with spices and herbs', price: 17.99, image_url: 'image/dulet.jpg', category: 'Lunch' },
  { name: 'Key Wot', description: 'Spicy beef stew slow-cooked in berbere sauce and seasoned butter', price: 19.99, image_url: 'image/keywot.jpeg', category: 'Lunch' },
  { name: 'Shiro Bedist', description: 'Smooth spiced chickpea stew simmered in seasoned oil or butter', price: 15.99, image_url: 'image/shirobedst.jpeg', category: 'Lunch' },
  { name: 'Beyayinetu', description: 'Assorted platter of vegetarian dishes served with injera', price: 17.99, image_url: 'image/beyayinet.jpeg', category: 'Lunch' },
  { name: 'Moya Especial', description: 'Tibs, Gomen Besiga, Kitfo, Special Kitfo, Key Wot, and Ayib', price: 34.99, image_url: 'image/beyayinetu.jpg', category: 'Lunch' },

  // Combination (2 items) - FIXED: Make sure both are unique
  { name: 'Breakfast Combination', description: 'Breakfast choose Two for $17', price: 17.00, image_url: 'image/combobreakfast.jpg', category: 'Combination' },
  { name: 'Lunch Combination', description: 'Lunch choose Two for $25', price: 25.00, image_url: 'image/combolunch.webp', category: 'Combination' },

  // Vegetarian (8 items) - FIXED: Make sure all are unique
  { name: 'Misir Wot', description: 'Red split lentils stewed with onions, garlic, berbere and herbs', price: 14.99, image_url: 'image/misirwot.jpg', category: 'Vegetarian' },
  { name: 'Kik Alicha', description: 'Yellow split peas with garlic, onions and turmeric', price: 14.99, image_url: 'image/KikAlicha.jpg', category: 'Vegetarian' },
  { name: 'Shiro', description: 'Smooth, spiced chickpea stew simmered in seasoned oil or butter', price: 15.99, image_url: 'image/shiro.jpeg', category: 'Vegetarian' },
  { name: 'Atkilt Wot', description: 'Cabbage, potato and carrot cooked with onion, ginger and garlic', price: 12.99, image_url: 'image/atakiltwat.webp', category: 'Vegetarian' },
  { name: 'Gomen Wot', description: 'Sautéed collard greens cooked with onions, garlic, and spiced butter', price: 12.99, image_url: 'image/Gomenwot.jpg', category: 'Vegetarian' },
  { name: 'Suf Fitfit', description: 'Finely ground sunflower seeds tossed in shredded injera, olive oil and spices', price: 10.99, image_url: 'image/suffitfit.jpg', category: 'Vegetarian' },
  { name: 'Key Sir', description: 'Beets, carrots and potatoes cooked with onion and garlic', price: 12.99, image_url: 'image/keysir.jpeg', category: 'Vegetarian' },
  { name: 'Vegetarian Beyayinetu', description: 'Assorted vegetarian platter served with injera', price: 17.99, image_url: 'image/beyayinetu.jpg', category: 'Vegetarian' },

  // Sea Food (4 items)
  { name: 'Assa Dullet', description: 'Spiced, sautéed fish mixed with herbs and aromatic spices', price: 18.99, image_url: 'image/Assadulet.jpg', category: 'Sea Food' },
  { name: 'Assa Gulash', description: 'Fish simmered in a rich, spicy tomato-based sauce', price: 19.99, image_url: 'image/Assagulash.jpeg', category: 'Sea Food' },
  { name: 'Assa Kitfo', description: 'Red fish tuna finely chopped and mixed with olive oil, cardamom and mitmita', price: 20.99, image_url: 'image/assakitfo.jpeg', category: 'Sea Food' },
  { name: 'Yetashé Assa', description: 'Smoked fish served with cubed kocho, fresh ayib and sautéed gomen greens', price: 22.99, image_url: 'image/yetasheassa.jpg', category: 'Sea Food' },

  // Kitfo (6 items)
  { name: 'Kitfo', description: 'Minced prime beef mixed with spicy butter and mitmita; served with ayib', price: 20.99, image_url: 'image/kitfo.png', category: 'Kitfo' },
  { name: 'Kesem Zmamuchia', description: 'Red split lentils mixed with seasonings and spicy butter; served with ayib', price: 19.99, image_url: 'image/kesemzmamucha.jpeg', category: 'Kitfo' },
  { name: 'Yetashe Kitfo', description: 'Minced beef/fish mixed with spices, served with feta and kocho', price: 22.99, image_url: 'image/yetashekitfo.jpeg', category: 'Kitfo' },
  { name: 'Gomen Kitfo', description: 'Finely minced collard mixed with spices and served with ayib', price: 20.99, image_url: 'image/gomenkitfo.jpeg', category: 'Kitfo' },
  { name: 'Fish Kitfo', description: 'Red fish tuna mixed with olive oil, cardamom and mitmita', price: 20.99, image_url: 'image/assakitfo.jpeg', category: 'Kitfo' },
  { name: 'Tibit Kitfo', description: 'Extra-spiced minced beef slow-cooked with bold Ethiopian seasonings', price: 20.99, image_url: 'image/Tibitkitfo.jpg', category: 'Kitfo' },

  // Side Dish (9 items)
  { name: 'Boiled Egg', description: '', price: 4.99, image_url: 'image/boiledegg.webp', category: 'Side Dish' },
  { name: 'Cheese & Gomen Mix', description: '', price: 4.99, image_url: 'image/gomen&cheesemix.jpg', category: 'Side Dish' },
  { name: 'Spicy Ethiopian Cheese', description: '', price: 4.99, image_url: 'image/spicedEthiopiacheese.jpg', category: 'Side Dish' },
  { name: 'House-Style Collard', description: '', price: 4.99, image_url: 'image/housestylecollard.jpeg', category: 'Side Dish' },
  { name: 'Lentil Stew', description: '', price: 4.99, image_url: 'image/lentilstew.jpeg', category: 'Side Dish' },
  { name: 'Split Pea Stew', description: '', price: 4.99, image_url: 'image/splitpeasoup.jpeg', category: 'Side Dish' },
  { name: 'Shiro Wot/Chickpea', description: '', price: 4.99, image_url: 'image/shirowot.jpeg', category: 'Side Dish' },
  { name: 'Keysir/Beetroots', description: '', price: 4.99, image_url: 'image/keysirbeetroots.jpeg', category: 'Side Dish' },
  { name: 'Salad', description: 'Fresh garden salad', price: 4.99, image_url: 'image/Salad.jpeg', category: 'Side Dish' },

  // Extra (3 items)
  { name: 'Extra Injera', description: 'Extra injera', price: 2.99, image_url: 'image/extraenjera.jpeg', category: 'Extra' },
  { name: 'Extra Bread', description: 'Extra bread', price: 1.99, image_url: 'image/extrabread.webp', category: 'Extra' },
  { name: 'Extra Kocho', description: 'Extra kocho', price: 4.99, image_url: 'image/Extrakocho.jpg', category: 'Extra' },

  // Beverage (11 items)
  { name: 'Soda', description: 'Assorted soft drinks', price: 3.17, image_url: 'image/Soda.jpeg', category: 'Beverage' },
  { name: 'Gas Water', description: 'Sparkling water', price: 2.49, image_url: 'image/gas water.jpg', category: 'Beverage' },
  { name: 'Water', description: 'Bottled water', price: 1.50, image_url: 'image/water.jpeg', category: 'Beverage' },
  { name: 'Coffee', description: 'Fresh brewed coffee', price: 3.99, image_url: 'image/coffee.webp', category: 'Beverage' },
  { name: 'Macchiato', description: 'Espresso with steamed milk', price: 3.99, image_url: 'image/macchiato.jpg', category: 'Beverage' },
  { name: 'Special Tea', description: 'Special blended tea', price: 4.99, image_url: 'image/specialtea.jpeg', category: 'Beverage' },
  { name: 'Tea', description: 'Regular tea', price: 2.99, image_url: 'image/tea.jpeg', category: 'Beverage' },
  { name: 'Keshir Tea', description: 'Spiced tea', price: 4.00, image_url: 'image/keshirtea.jpeg', category: 'Beverage' },
  { name: 'Latte', description: 'Coffee latte', price: 3.99, image_url: 'image/latte.jpeg', category: 'Beverage' },
  { name: 'Small Ergo', description: 'Small homemade yogurt', price: 3.99, image_url: 'image/homemadeyogurt.jpeg', category: 'Beverage' },
  { name: 'Large Ergo', description: 'Large homemade yogurt', price: 6.99, image_url: 'image/homemadeyogurt.jpeg', category: 'Beverage' }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Test database connection
    console.log('🔌 Testing database connection...');
    const [test] = await db.execute('SELECT 1 as test');
    console.log('✅ Database connection OK');

    // Clear existing data first
    console.log('🗑️ Clearing existing data...');
    await db.execute('DELETE FROM cart_items');
    await db.execute('DELETE FROM menu_items');
    await db.execute('DELETE FROM categories');
    console.log('✅ All data cleared');

    // Create tables if they don't exist
    console.log('📋 Creating tables if needed...');
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        image_url VARCHAR(500),
        category_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);

    console.log('✅ Tables ready');

    // Insert ALL categories
    console.log('📝 Inserting categories...');
    const categories = ['Breakfast', 'Lunch', 'Combination', 'Vegetarian', 'Sea Food', 'Kitfo', 'Side Dish', 'Extra', 'Beverage'];
    const categoryMap = {};
    
    for (const categoryName of categories) {
      const [result] = await db.execute(
        'INSERT INTO categories (name, description) VALUES (?, ?)',
        [categoryName, `${categoryName} items`]
      );
      
      // Get the category ID
      const [categoryRows] = await db.execute('SELECT id FROM categories WHERE name = ?', [categoryName]);
      categoryMap[categoryName] = categoryRows[0].id;
    }
    console.log('✅ Categories inserted');

    // Insert ALL menu items - NO duplicate checking, just insert everything
    console.log('📝 Inserting ALL menu items...');
    let successCount = 0;

    for (const item of menuData) {
      try {
        const [result] = await db.execute(
          `INSERT INTO menu_items (name, description, price, image_url, category_id) 
           VALUES (?, ?, ?, ?, ?)`,
          [item.name, item.description, item.price, item.image_url, categoryMap[item.category]]
        );
        
        if (result.affectedRows > 0) {
          successCount++;
        }
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`   ⚠️  Skipped duplicate: ${item.name} in ${item.category}`);
        } else {
          console.log(`   ❌ Error inserting ${item.name}: ${error.message}`);
        }
      }
    }

    console.log(`🎉 Seeding completed!`);
    console.log(`✅ Items inserted: ${successCount}`);

    // Show final count by category
    const [finalCount] = await db.execute(`
      SELECT c.name as category, COUNT(mi.id) as count 
      FROM menu_items mi 
      JOIN categories c ON mi.category_id = c.id 
      GROUP BY c.name
      ORDER BY c.name
    `);
    
    console.log(`\n📊 Menu items by category:`);
    finalCount.forEach(row => {
      console.log(`   ${row.category}: ${row.count} items`);
    });

    const [total] = await db.execute('SELECT COUNT(*) as count FROM menu_items');
    console.log(`📊 Total menu items: ${total[0].count}`);

    // Verify we have 62 items
    if (total[0].count === 61) {
      console.log('✅ SUCCESS: All 61 items are in the database!');
    } else {
      console.log(`❌ WARNING: Expected 61 items but found ${total[0].count}`);
    }

  } catch (error) {
    console.log('💥 Seeding failed:', error.message);
    console.log('Error details:', error);
  } finally {
    process.exit();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;