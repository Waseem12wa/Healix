/**
 * Check and fix user password
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { connectDB, disconnectDB } from '../config/db.js';

dotenv.config();

async function checkAndFixPassword() {
  try {
    await connectDB();

    const email = 'faizan.learner@gmail.com';
    const correctPassword = 'F@izan412164'; // The password user is trying to use

    console.log('\n🔍 Checking user password...\n');
    console.log(`Email: ${email}`);
    console.log(`Expected password: ${correctPassword}\n`);

    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Password hash: ${user.password.substring(0, 20)}...`);
    console.log('');

    // Test current password
    console.log('🔐 Testing current password...');
    const currentMatch = await user.comparePassword(correctPassword);
    console.log(`   Current password match: ${currentMatch ? '✅ YES' : '❌ NO'}`);
    console.log('');

    if (!currentMatch) {
      console.log('⚠️  Password doesn\'t match. Updating password...');
      
      // Update password
      user.password = correctPassword;
      user.markModified('password');
      await user.save();
      
      console.log('✅ Password updated');
      console.log('');

      // Verify new password
      const updatedUser = await User.findOne({ email });
      const newMatch = await updatedUser.comparePassword(correctPassword);
      console.log('🔐 Testing updated password...');
      console.log(`   Updated password match: ${newMatch ? '✅ YES' : '❌ NO'}`);
      console.log('');

      if (newMatch) {
        console.log('✅✅✅ Password fixed successfully! ✅✅✅');
        console.log(`   You can now login with: ${email}`);
        console.log(`   Password: ${correctPassword}`);
      }
    } else {
      console.log('✅ Password is correct - no fix needed');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

checkAndFixPassword();

