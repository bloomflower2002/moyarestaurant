import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session'; // ADD THIS
import menuRoutes from './routes/menuRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import cartRoutes from './routes/cart.js'; // ADD THIS
import authRoutes from './routes/authRoutes.js'; // ADD THIS
import loginRoutes from './routes/login.js'; // ADD THIS - we'll create this file

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // or your frontend URL
  credentials: true // IMPORTANT for cookies/sessions
}));
app.use(express.json());
app.use(express.static('../Frontend'));

// ADD SESSION MIDDLEWARE (this was missing)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-key-change-this',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Routes
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes); // ADD THIS
app.use('/api/auth', authRoutes); // ADD THIS
app.use('/api/auth', loginRoutes); // ADD THIS

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Moya Cafe API is running!' });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

export default app;