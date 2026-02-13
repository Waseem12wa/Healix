import express from 'express';
import crypto from 'crypto';
import User from '../models/User.js';
import { validateEmail, validatePassword } from '../utils/validation.js';
import { sendPasswordResetEmail, sendPasswordResetConfirmation } from '../utils/emailService.js';

const router = express.Router();

/**
 * @route   POST /api/password/forgot
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;

    console.log('\n🔐 Forgot password request received:');
    console.log('   Email:', email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.error
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });

    // For security, don't reveal if user exists or not
    // Always return success message
    if (!user) {
      console.log('   User not found (but returning success for security)');
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    // Save reset token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(resetTokenExpiry);
    await user.save();

    console.log('   Reset token generated and saved');
    console.log('   Token expires at:', new Date(resetTokenExpiry).toISOString());

    // Send reset email
    try {
      await sendPasswordResetEmail(
        user.email,
        resetToken,
        user.userName || user.email.split('@')[0]
      );
      console.log('   ✅ Password reset email sent');
    } catch (emailError) {
      console.error('   ❌ Error sending email:', emailError);
      console.error('   Error details:', {
        message: emailError.message,
        code: emailError.code,
        response: emailError.response
      });
      
      // Clear the token if email fails
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      // Provide more specific error message in development
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? emailError.message || 'Failed to send reset email. Please check server logs and email configuration.'
        : 'Failed to send reset email. Please try again later.';

      return res.status(500).json({
        success: false,
        message: errorMessage
      });
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/password/reset
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset', async (req, res) => {
  try {
    const { token, password } = req.body;

    console.log('\n🔐 Password reset request received:');
    console.log('   Has token:', !!token);
    console.log('   Has password:', !!password);

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required'
      });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password validation failed',
        errors: passwordValidation.errors,
        field: 'password'
      });
    }

    // Find user by reset token and check if token is not expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() } // Token must not be expired
    });

    if (!user) {
      console.log('   ❌ Invalid or expired token');
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token. Please request a new password reset.'
      });
    }

    console.log('   ✅ Valid token found for user:', user.email);

    // Update password
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.markModified('password');
    
    await user.save();

    console.log('   ✅ Password updated successfully');

    // Send confirmation email (don't wait for it)
    sendPasswordResetConfirmation(
      user.email,
      user.userName || user.email.split('@')[0]
    ).catch(err => console.error('Failed to send confirmation email:', err));

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while resetting your password. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/password/verify-token
 * @desc    Verify if reset token is valid
 * @access  Public
 */
router.get('/verify-token', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.json({
        success: false,
        valid: false,
        message: 'Invalid or expired token'
      });
    }

    res.json({
      success: true,
      valid: true,
      message: 'Token is valid'
    });

  } catch (error) {
    console.error('❌ Verify token error:', error);
    res.status(500).json({
      success: false,
      valid: false,
      message: 'Error verifying token'
    });
  }
});

export default router;

