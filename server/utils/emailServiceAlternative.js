/**
 * Alternative Email Service - Using Resend (easier setup)
 * Or you can use this as a template for other services
 */

import dotenv from 'dotenv';

dotenv.config();

/**
 * Option 1: Use Resend API (Recommended - No SMTP setup needed)
 * Sign up at: https://resend.com (free tier: 100 emails/day)
 * 
 * Install: npm install resend
 * Then uncomment the code below
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPasswordResetEmail = async (email, resetToken, userName = 'User') => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const { data, error } = await resend.emails.send({
      from: 'Healix <onboarding@resend.dev>', // Change to your verified domain
      to: email,
      subject: 'Password Reset Request - Healix',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${userName},</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link expires in 1 hour.</p>
      `,
    });

    if (error) {
      throw error;
    }

    console.log('✅ Password reset email sent via Resend:', data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};



export const sendPasswordResetConfirmation = async (email, userName = 'User') => {
  console.log(`✅ Password reset confirmed for: ${email}`);
  return { success: true };
};

