import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import passwordRoutes from './routes/password.js';
import doctorRoutes from './routes/doctors.js';
import appointmentRoutes from './routes/appointments.js';
import notificationRoutes from './routes/notifications.js';
import reminderRoutes from './routes/reminders.js';
import reminderEmailJob from './jobs/reminderEmailJob.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reminders', reminderRoutes);

// Test endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Healix Backend API',
    status: 'Running',
    version: '1.0.0',
    database: 'MongoDB'
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Connect to MongoDB and Start Server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start the medicine reminder cron job (runs every minute)
    console.log('⏰ Starting medicine reminder scheduler...');
    cron.schedule('* * * * *', reminderEmailJob);
    console.log('✅ Medicine reminder scheduler started (runs every minute)');

    // Start Server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 API Endpoint: http://localhost:${PORT}/api`);
      console.log(`✅ MongoDB authentication enabled`);
      console.log(`\n💡 Use /api/auth/signup to create new users`);
      console.log(`💡 Use /api/auth/login to authenticate users\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

