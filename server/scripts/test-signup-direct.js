/**
 * Direct test of signup functionality
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { validatePassword, validateEmail, validateRole } from '../utils/validation.js';

dotenv.config();

async function testSignup() {
  try {
    await connectDB();

    const testEmail = 'faizan.learner@gmail.com';
    const testPassword = 'F@izan4121';
    const testRole = 'patient';

    console.log('\n🧪 Testing Signup Process\n');
    console.log('Test data:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   Role: ${testRole}\n`);

    // Step 1: Validate inputs
    console.log('📋 Step 1: Validating inputs...');
    const emailValidation = validateEmail(testEmail);
    console.log('   Email validation:', emailValidation.isValid ? '✅' : '❌');
    
    const passwordValidation = validatePassword(testPassword);
    console.log('   Password validation:', passwordValidation.isValid ? '✅' : '❌');
    if (!passwordValidation.isValid) {
      console.log('   Password errors:', passwordValidation.errors);
    }
    
    const roleValidation = validateRole(testRole);
    console.log('   Role validation:', roleValidation.isValid ? '✅' : '❌');
    console.log('');

    if (!emailValidation.isValid || !passwordValidation.isValid || !roleValidation.isValid) {
      console.log('❌ Validation failed, cannot proceed');
      return;
    }

    // Step 2: Check if user exists
    console.log('🔍 Step 2: Checking if user exists...');
    const existingUser = await User.findOne({ email: testEmail.toLowerCase().trim() });
    if (existingUser) {
      console.log('   ⚠️  User already exists, deleting for test...');
      await User.deleteOne({ _id: existingUser._id });
      console.log('   ✅ Old user deleted');
    } else {
      console.log('   ✅ User does not exist, proceeding...');
    }
    console.log('');

    // Step 3: Create user
    console.log('📝 Step 3: Creating new user...');
    const user = new User({
      email: testEmail.toLowerCase().trim(),
      password: String(testPassword).trim(),
      role: roleValidation.role,
      userName: testEmail.split('@')[0]
    });

    user.markModified('password');

    console.log('   User object created');
    console.log('   Attempting to save...');
    
    await user.save();
    
    console.log('   ✅ User saved successfully');
    console.log('   User ID:', user._id);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Password hash length:', user.password?.length);
    console.log('');

    // Step 4: Verify user exists
    console.log('🔍 Step 4: Verifying user in database...');
    const verifyById = await User.findById(user._id);
    console.log('   Found by ID:', verifyById ? '✅' : '❌');
    
    const verifyByEmail = await User.findOne({ email: testEmail.toLowerCase().trim() });
    console.log('   Found by email:', verifyByEmail ? '✅' : '❌');
    
    if (verifyByEmail) {
      console.log('   Verified email:', verifyByEmail.email);
      console.log('   Verified role:', verifyByEmail.role);
    }
    console.log('');

    // Step 5: Test password
    if (verifyByEmail) {
      console.log('🔐 Step 5: Testing password...');
      const passwordMatch = await verifyByEmail.comparePassword(testPassword);
      console.log('   Password match:', passwordMatch ? '✅ YES' : '❌ NO');
      console.log('');
    }

    // Step 6: List all users
    console.log('📊 Step 6: All users in database:');
    const allUsers = await User.find({}).select('email role');
    allUsers.forEach(u => {
      console.log(`   - ${u.email} (${u.role})`);
    });
    console.log('');

    if (verifyByEmail) {
      console.log('✅✅✅ SIGNUP TEST PASSED! ✅✅✅');
    } else {
      console.log('❌ SIGNUP TEST FAILED - User not found after save');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error('   Name:', error.name);
    console.error('   Code:', error.code);
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

testSignup();

