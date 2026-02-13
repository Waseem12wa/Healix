/**
 * Script to check users and fix if needed
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';

dotenv.config();

async function checkAndFixUsers() {
  try {
    await connectDB();

    console.log('\n📊 Checking users in database...\n');

    const allUsers = await User.find({});
    console.log(`Found ${allUsers.length} users in database:\n`);

    if (allUsers.length === 0) {
      console.log('⚠️  No users found! Creating test users...\n');
      
      const testUsers = [
        { email: 'patient@healix.com', password: 'Patient123!', role: 'patient', userName: 'Test Patient' },
        { email: 'doctor@healix.com', password: 'Doctor123!', role: 'doctor', userName: 'Dr. Test' },
        { email: 'provider@healix.com', password: 'Provider123!', role: 'provider', userName: 'Test Provider' },
        { email: 'admin@healix.com', password: 'Admin123!', role: 'admin', userName: 'Test Admin' }
      ];

      for (const userData of testUsers) {
        const user = new User(userData);
        await user.save();
        console.log(`✅ Created: ${userData.email} (${userData.role})`);
      }
    } else {
      allUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.role})`);
      });

      // Test password for first user
      if (allUsers.length > 0) {
        const testUser = allUsers[0];
        console.log(`\n🧪 Testing password for ${testUser.email}...`);
        
        // Try to verify password
        const testPassword = testUser.role === 'patient' ? 'Patient123!' : 
                            testUser.role === 'doctor' ? 'Doctor123!' :
                            testUser.role === 'provider' ? 'Provider123!' : 'Admin123!';
        
        const isValid = await testUser.comparePassword(testPassword);
        console.log(`Password test result: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
        
        if (!isValid) {
          console.log('\n⚠️  Password verification failed! Recreating user with correct password...');
          // Delete and recreate
          await User.deleteOne({ _id: testUser._id });
          const newUser = new User({
            email: testUser.email,
            password: testPassword,
            role: testUser.role,
            userName: testUser.userName
          });
          await newUser.save();
          console.log(`✅ Recreated user: ${newUser.email}`);
        }
      }
    }

    console.log('\n📋 Final user list:');
    const finalUsers = await User.find({}).select('email role userName');
    finalUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.role})`);
    });

    console.log('\n✨ Done!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

checkAndFixUsers();

