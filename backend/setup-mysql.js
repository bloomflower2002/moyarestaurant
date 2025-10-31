const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  multipleStatements: true // Allow multiple SQL statements
});

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database...');
    
    // Connect to MySQL
    await connection.promise().execute('SELECT 1');
    console.log('✅ Connected to MySQL');
    
    // Create database if not exists
    await connection.promise().execute('CREATE DATABASE IF NOT EXISTS moya_cafe');
    console.log('✅ Database "moya_cafe" created/verified');
    
    console.log('🎉 Database setup complete!');
    console.log('💡 Now run: npm run seed');
    
  } catch (error) {
    console.log('❌ Database setup failed:');
    console.log('Error:', error.message);
    console.log('\n💡 Make sure:');
    console.log('1. MySQL is running');
    console.log('2. DB credentials in .env are correct');
    console.log('3. You have permission to create databases');
  } finally {
    connection.end();
  }
}

setupDatabase();