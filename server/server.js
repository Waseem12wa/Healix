import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import axios from 'axios';
import path from 'path';
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
import reviewRoutes from './routes/reviews.js';
import medicalRecordRoutes from './routes/medicalRecord.js';
import { reminderEmailJob } from './jobs/reminderEmailJob.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server, health checks, and non-browser tools without Origin header.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

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
app.use('/api/medical-record', medicalRecordRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);

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

const REQUIRED_MICROSERVICES = new Set(
  (process.env.REQUIRED_MICROSERVICES || 'DDI,DFI,ALT,SIDE,HEALTH,MEDREC')
    .split(',')
    .map(s => s.trim().toUpperCase())
    .filter(Boolean)
);

/**
 * Check if a microservice is healthy
 * @param {string} name - Service name
 * @param {number} port - Service port
 * @param {string} endpoint - Health check endpoint
 * @returns {Promise<boolean>} - True if service is healthy
 */
async function checkServiceHealth(name, port, endpoint) {
  try {
    const response = await axios.get(`http://127.0.0.1:${port}${endpoint}`, {
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
    let allRequiredHealthy = true;
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
          if (REQUIRED_MICROSERVICES.has(service.name)) {
            allRequiredHealthy = false;
          }
        }
      }
      
      if (results[service.name].healthy) {
        readyCount++;
      }
    }
    
    if (allRequiredHealthy) {
      console.log(`\n✅ All required microservices are ready!\n`);
      return results;
    }
    
    if (retry < maxRetries - 1) {
      const waitTime = delayMs / 1000;
      const requiredReady = Object.entries(results)
        .filter(([name, status]) => REQUIRED_MICROSERVICES.has(name) && status.healthy)
        .length;
      console.log(`⏳ Waiting for services... (${requiredReady}/${REQUIRED_MICROSERVICES.size} required, ${readyCount}/${MICROSERVICES.length} total ready) - retrying in ${waitTime}s...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.log(`\n⚠️  Timeout waiting for required microservices after ${maxRetries * delayMs / 1000}s`);
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
  let dbConnected = false;
  let reminderJobStarted = false;

  const startReminderJobIfNeeded = () => {
    if (reminderJobStarted) return;
    cron.schedule('* * * * *', reminderEmailJob);
    reminderJobStarted = true;
    console.log('⏰ Reminder email job scheduled (runs every minute)\n');
  };

  const scheduleMongoReconnect = () => {
    const retryMs = 5000;
    const timer = setInterval(async () => {
      if (dbConnected) {
        clearInterval(timer);
        return;
      }

      try {
        await connectDB();
        dbConnected = true;
        console.log('✅ MongoDB connection restored. DB-backed routes are now available.');
        startReminderJobIfNeeded();
        clearInterval(timer);
      } catch (error) {
        console.log(`⏳ Retrying MongoDB connection in ${retryMs / 1000}s... (${error.message})`);
      }
    }, retryMs);
  };

  // Try DB first, but do not hard-exit if unavailable.
  try {
    await connectDB();
    dbConnected = true;
  } catch (error) {
    console.error(`⚠️ MongoDB unavailable at startup: ${error.message}`);
    console.error('⚠️ Continuing API startup in degraded mode (DB-backed routes may fail).');
    scheduleMongoReconnect();
  }

  // Start Server immediately; microservice readiness checks run in background.
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 API Endpoint: /api`);
    console.log(dbConnected ? `✅ MongoDB authentication enabled` : `⚠️ MongoDB unavailable (degraded mode)`);
    console.log(`🌐 Allowed CORS origins: ${allowedOrigins.join(', ')}`);
    console.log(`\n💡 Use /api/auth/signup to create new users`);
    console.log(`💡 Use /api/auth/login to authenticate users\n`);

    // Start reminder email cron job only when DB is available
    if (dbConnected) {
      startReminderJobIfNeeded();
    } else {
      console.log('⚠️ Reminder email job disabled until MongoDB is available\n');
    }
  });

  // Report microservice status asynchronously without blocking API availability.
  waitForMicroservices(60, 2000)
    .then((serviceStatus) => {
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
        console.log('   Some features may fail until services finish loading.\n');
      }
    })
    .catch((error) => {
      console.error(`⚠️ Microservice readiness check failed: ${error.message}`);
    });
};

startServer();

