/**
 * Script to test login functionality
 * Run with: node scripts/test-login.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { connectDB, disconnectDB } from '../config/db.js';

dotenv.config();

async function testLogin() {
  try {
    // Connect to MongoDB
    await connectDB();

    const testEmail = 'patient@healix.com';
    const testPassword = 'Patient123!';

    console.log('\n🧪 Testing Login Functionality\n');
    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${testPassword}\n`);

    // Find user
    const user = await User.findOne({ email: testEmail });
    
    if (!user) {
      console.log('❌ User not found in database');
      console.log('\n📊 All users in database:');
      const allUsers = await User.find({}).select('email role');
      allUsers.forEach(u => console.log(`   - ${u.email} (${u.role})`));
      return;
    }

    console.log('✅ User found:', {
      email: user.email,
      role: user.role,
      userName: user.userName,
      hasPassword: !!user.password,
      passwordLength: user.password?.length
    });

    // Test password comparison
    console.log('\n🔐 Testing password comparison...');
    const isValid = await user.comparePassword(testPassword);
    console.log(`Password match: ${isValid ? '✅ YES' : '❌ NO'}`);

    // Test with wrong password
    console.log('\n🔐 Testing with wrong password...');
    const isWrongValid = await user.comparePassword('WrongPassword123!');
    console.log(`Wrong password match: ${isWrongValid ? '✅ YES (ERROR!)' : '✅ NO (Correct)'}`);

    // Show password hash (first 20 chars for debugging)
    console.log('\n🔍 Password hash (first 20 chars):', user.password.substring(0, 20) + '...');

    if (isValid) {
      console.log('\n✅ Login test PASSED - Password comparison works correctly!');
    } else {
      console.log('\n❌ Login test FAILED - Password comparison failed!');
      console.log('\n💡 Possible issues:');
      console.log('   1. Password was not hashed correctly when user was created');
      console.log('   2. Password in database is different from expected');
      console.log('   3. Bcrypt comparison is failing');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

testLogin();

