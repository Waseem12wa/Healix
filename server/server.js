import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import axios from 'axios';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import passwordRoutes from './routes/password.js';
import doctorRoutes from './routes/doctors.js';
import appointmentRoutes from './routes/appointments.js';
import notificationRoutes from './routes/notifications.js';
import ddiRoutes from './routes/ddi.js';
import dfiRoutes from './routes/dfi.js';
import alternativeRoutes from './routes/alternative.js';
import sideEffectsRoutes from './routes/sideEffects.js';
import reminderRoutes from './routes/reminders.js';
import healthAssistantRoutes from './routes/healthAssistant.js';
import paymentRoutes from './routes/payments.js';
import { reminderEmailJob } from './jobs/reminderEmailJob.js';

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
app.use('/api/ddi', ddiRoutes);
app.use('/api/dfi', dfiRoutes);
app.use('/api/alternative', alternativeRoutes);
app.use('/api/side-effects', sideEffectsRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/assistant', healthAssistantRoutes);
app.use('/api/payments', paymentRoutes);

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

// Microservice health check configuration
const MICROSERVICES = [
  { name: 'DDI', port: 5001, endpoint: '/health' },
  { name: 'DFI', port: 5002, endpoint: '/health' },
  { name: 'ALT', port: 5003, endpoint: '/health' },
  { name: 'SIDE', port: 5004, endpoint: '/health' },
  { name: 'MEDREC', port: 5005, endpoint: '/health' },
  { name: 'HEALTH', port: 5006, endpoint: '/health' }
];

/**
 * Check if a microservice is healthy
 * @param {string} name - Service name
 * @param {number} port - Service port
 * @param {string} endpoint - Health check endpoint
 * @returns {Promise<boolean>} - True if service is healthy
 */
async function checkServiceHealth(name, port, endpoint) {
  try {
    const response = await axios.get(`http://localhost:${port}${endpoint}`, {
      timeout: 3000
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Wait for microservices to be ready with retries
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delayMs - Delay between retries in milliseconds
 * @returns {Promise<Object>} - Health status of all services
 */
async function waitForMicroservices(maxRetries = 60, delayMs = 2000) {
  const results = {};
  
  console.log('\n⏳ Checking microservice availability...\n');
  
  for (let retry = 0; retry < maxRetries; retry++) {
    let allHealthy = true;
    let readyCount = 0;
    
    for (const service of MICROSERVICES) {
      if (!results[service.name]) {
        results[service.name] = { healthy: false, attempts: 0 };
      }
      
      if (!results[service.name].healthy) {
        results[service.name].attempts++;
        const isHealthy = await checkServiceHealth(service.name, service.port, service.endpoint);
        
        if (isHealthy) {
          results[service.name].healthy = true;
          console.log(`✅ ${service.name} Service ready (port ${service.port})`);
        } else {
          allHealthy = false;
        }
      }
      
      if (results[service.name].healthy) {
        readyCount++;
      }
    }
    
    if (allHealthy) {
      console.log(`\n✅ All microservices are ready!\n`);
      return results;
    }
    
    if (retry < maxRetries - 1) {
      const waitTime = delayMs / 1000;
      console.log(`⏳ Waiting for services... (${readyCount}/${MICROSERVICES.length} ready) - retrying in ${waitTime}s...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.log(`\n⚠️  Timeout waiting for all microservices after ${maxRetries * delayMs / 1000}s`);
  console.log(`Ready services: ${Object.values(results).filter(r => r.healthy).length}/${MICROSERVICES.length}\n`);
  console.log('Status:');
  for (const [name, status] of Object.entries(results)) {
    const icon = status.healthy ? '✅' : '❌';
    console.log(`  ${icon} ${name}: ${status.healthy ? 'Ready' : `Not ready (${status.attempts} attempts)`}`);
  }
  console.log('\n⚠️  Some services may still be loading. Requests to unavailable services will fail.\n');
  
  return results;
}

// Connect to MongoDB and Start Server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Wait for microservices to be ready
    const serviceStatus = await waitForMicroservices(60, 2000); // 2s delay, max 120s total

    // Start Server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 API Endpoint: http://localhost:${PORT}/api`);
      console.log(`✅ MongoDB authentication enabled`);
      console.log(`\n💡 Use /api/auth/signup to create new users`);
      console.log(`💡 Use /api/auth/login to authenticate users\n`);

      // Start reminder email cron job (runs every minute)
      cron.schedule('* * * * *', reminderEmailJob);
      console.log('⏰ Reminder email job scheduled (runs every minute)\n');

      // Log service summary
      const readyServices = Object.entries(serviceStatus)
        .filter(([_, status]) => status.healthy)
        .map(([name, _]) => name);
      const unavailableServices = Object.entries(serviceStatus)
        .filter(([_, status]) => !status.healthy)
        .map(([name, _]) => name);

      if (readyServices.length > 0) {
        console.log(`✅ Ready services: ${readyServices.join(', ')}`);
      }
      if (unavailableServices.length > 0) {
        console.log(`⚠️  Unavailable services: ${unavailableServices.join(', ')}`);
        console.log(`   These services may still be initializing. Check logs for details.\n`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

