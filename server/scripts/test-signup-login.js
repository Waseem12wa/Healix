/**
 * Script to test signup and then login with the newly created user
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { connectDB, disconnectDB } from '../config/db.js';

dotenv.config();

async function testSignupAndLogin() {
  try {
    await connectDB();

    const testEmail = `testuser${Date.now()}@healix.com`;
    const testPassword = 'TestUser123!';
    const testRole = 'patient';

    console.log('\n🧪 Testing Signup and Login Flow\n');
    console.log('Test credentials:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   Role: ${testRole}\n`);

    // Step 1: Create user (simulating signup)
    console.log('📝 Step 1: Creating new user...');
    const user = new User({
      email: testEmail,
      password: testPassword,
      role: testRole,
      userName: 'Test User'
    });

    await user.save();
    console.log('✅ User created successfully');
    console.log(`   ID: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Password hash length: ${user.password.length}`);
    console.log('');

    // Step 2: Test password comparison
    console.log('🔐 Step 2: Testing password verification...');
    const isValid = await user.comparePassword(testPassword);
    console.log(`   Password match: ${isValid ? '✅ YES' : '❌ NO'}`);
    console.log('');

    if (!isValid) {
      console.log('❌ Password verification failed!');
      console.log('   This means the password was not hashed correctly during signup.');
      return;
    }

    // Step 3: Test finding user and logging in
    console.log('🔍 Step 3: Testing user lookup and login...');
    const foundUser = await User.findOne({ email: testEmail });
    
    if (!foundUser) {
      console.log('❌ User not found in database!');
      return;
    }

    console.log('✅ User found in database');
    const loginValid = await foundUser.comparePassword(testPassword);
    console.log(`   Login password match: ${loginValid ? '✅ YES' : '❌ NO'}`);
    console.log('');

    if (loginValid) {
      console.log('✅✅✅ ALL TESTS PASSED! ✅✅✅');
      console.log('   Signup and login flow is working correctly.');
    } else {
      console.log('❌ Login test failed!');
      console.log('   Password comparison failed after user creation.');
    }

    // Cleanup: Delete test user
    console.log('\n🧹 Cleaning up test user...');
    await User.deleteOne({ _id: user._id });
    console.log('✅ Test user deleted');

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('   Stack:', error.stack);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

testSignupAndLogin();

