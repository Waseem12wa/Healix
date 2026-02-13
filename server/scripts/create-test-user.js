/**
 * Script to create a test user in MongoDB
 * Run with: node scripts/create-test-user.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { connectDB, disconnectDB } from '../config/db.js';

dotenv.config();

async function createTestUser() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Test user credentials
    const testUsers = [
      {
        email: 'patient@healix.com',
        password: 'Patient123!',
        role: 'patient',
        userName: 'Test Patient'
      },
      {
        email: 'doctor@healix.com',
        password: 'Doctor123!',
        role: 'doctor',
        userName: 'Dr. Test'
      },
      {
        email: 'provider@healix.com',
        password: 'Provider123!',
        role: 'provider',
        userName: 'Test Provider'
      },
      {
        email: 'admin@healix.com',
        password: 'Admin123!',
        role: 'admin',
        userName: 'Test Admin'
      }
    ];

    console.log('\n📝 Creating test users...\n');

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists. Skipping...`);
        continue;
      }

      // Create new user
      const user = new User(userData);
      await user.save();
      
      console.log(`✅ Created user: ${userData.email} (${userData.role})`);
    }

    console.log('\n📊 Current users in database:');
    const allUsers = await User.find({}).select('email role userName');
    allUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.role})`);
    });

    console.log('\n✨ Test users created successfully!\n');
    console.log('Login credentials:');
    testUsers.forEach(user => {
      console.log(`   ${user.role}: ${user.email} / ${user.password}`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

createTestUser();

