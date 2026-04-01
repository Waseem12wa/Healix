import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, '../.env') });

async function fixEmails() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Find all users with @helix.com
    const users = await db.collection('users').find({ email: /.*@helix\.com$/ }).toArray();
    console.log(`\n📧 Found ${users.length} users with @helix.com emails\n`);
    
    let updatedCount = 0;
    
    for (let user of users) {
      const newEmail = user.email.replace('@helix.com', '@healix.com');
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { email: newEmail } }
      );
      console.log(`  ✓ ${user.email} → ${newEmail}`);
      updatedCount++;
    }
    
    console.log(`\n✅ Successfully updated ${updatedCount} email addresses\n`);
    
    // Verify the updates
    const verifyCount = await db.collection('users').countDocuments({ email: /.*@healix\.com$/ });
    console.log(`📊 Total accounts with @healix.com: ${verifyCount}`);
    
    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

fixEmails();
