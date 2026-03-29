import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

function validateMongoUri(uri) {
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in .env file');
  }

  const placeholders = ['<username>', '<password>', '<cluster-host>', '<database>'];
  if (placeholders.some((token) => uri.includes(token))) {
    throw new Error(
      'MONGODB_URI contains template placeholders. Set a real Atlas URI in Render environment variables.'
    );
  }
}

let isConnected = false;

// Fail fast when DB is unavailable instead of buffering queries for 10s+
mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 0);

export const connectDB = async () => {
  try {
    if (isConnected && mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB already connected');
      return mongoose.connection;
    }
    
    validateMongoUri(MONGODB_URI);

    // Close existing connection if any
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      bufferCommands: false,
    });
    
    isConnected = true;
    console.log(`✅ Connected to MongoDB: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔗 Connection state: ${conn.connection.readyState === 1 ? 'Connected' : 'Not Connected'}`);
    
    return conn;
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    isConnected = false;
    throw err;
  }
};

export const disconnectDB = async () => {
  try {
    if (isConnected) {
      await mongoose.disconnect();
      isConnected = false;
      console.log('✅ MongoDB disconnected');
    }
  } catch (err) {
    console.error('❌ MongoDB Disconnection Error:', err.message);
    throw err;
  }
};

export default mongoose;
