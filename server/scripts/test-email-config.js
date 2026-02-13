/**
 * Test email configuration
 * Run with: node scripts/test-email-config.js
 */

import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

async function testEmailConfig() {
  console.log('\n🧪 Testing Email Configuration\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('   EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'not set');
  console.log('   EMAIL_USER:', process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}***` : '❌ NOT SET');
  console.log('   EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***set***' : '❌ NOT SET');
  console.log('   SMTP_HOST:', process.env.SMTP_HOST || 'not set (will use default)');
  console.log('   SMTP_PORT:', process.env.SMTP_PORT || 'not set (will use default)');
  console.log('   FRONTEND_URL:', process.env.FRONTEND_URL || 'not set (will use default)');
  console.log('');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ Email configuration is incomplete!');
    console.error('\nPlease add these to your .env file:');
    console.error('   EMAIL_SERVICE=gmail');
    console.error('   EMAIL_USER=your-email@gmail.com');
    console.error('   EMAIL_PASSWORD=your-app-password');
    console.error('   FRONTEND_URL=http://localhost:5173');
    process.exit(1);
  }

  // Create transporter
  let transporter;
  try {
    if (process.env.EMAIL_SERVICE === 'gmail') {
      console.log('📧 Creating Gmail transporter...');
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    } else {
      const host = process.env.SMTP_HOST || 'smtp.gmail.com';
      const port = parseInt(process.env.SMTP_PORT || '587');
      console.log(`📧 Creating SMTP transporter (${host}:${port})...`);
      transporter = nodemailer.createTransport({
        host: host,
        port: port,
        secure: port === 465,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }
    console.log('✅ Transporter created');
  } catch (error) {
    console.error('❌ Error creating transporter:', error.message);
    process.exit(1);
  }

  // Verify connection
  console.log('\n🔍 Verifying email connection...');
  try {
    await transporter.verify();
    console.log('✅ Email server connection verified!');
  } catch (error) {
    console.error('❌ Email server verification failed:');
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);
    console.error('\n💡 Common issues:');
    console.error('   - For Gmail: Make sure you\'re using an App Password, not your regular password');
    console.error('   - Check that 2-Step Verification is enabled in your Google Account');
    console.error('   - Verify EMAIL_USER and EMAIL_PASSWORD are correct');
    process.exit(1);
  }

  // Try sending a test email
  console.log('\n📨 Sending test email...');
  try {
    const testEmail = process.env.EMAIL_USER; // Send to yourself
    const info = await transporter.sendMail({
      from: `"Healix Test" <${process.env.EMAIL_USER}>`,
      to: testEmail,
      subject: 'Test Email - Healix Password Reset',
      text: 'This is a test email from Healix. If you received this, your email configuration is working!',
      html: '<p>This is a test email from Healix. If you received this, your email configuration is working!</p>',
    });

    console.log('✅ Test email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log(`   Check your inbox at: ${testEmail}`);
    console.log('\n✨ Email configuration is working correctly!');
  } catch (error) {
    console.error('❌ Error sending test email:');
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);
    console.error('   Error response:', error.response);
    process.exit(1);
  }
}

testEmailConfig();

