import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Parse env values defensively (trimmed) to avoid mode mismatches from whitespace.
const toBool = (value) => String(value || '').trim().toLowerCase() === 'true';
const RESEND_API_KEY = String(process.env.RESEND_API_KEY || '').trim();
const EMAIL_USER = String(process.env.EMAIL_USER || '').trim();
const EMAIL_PASSWORD = String(process.env.EMAIL_PASSWORD || '').trim();

// Initialize Resend if API key is provided
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
const USE_RESEND = toBool(process.env.USE_RESEND) || !!RESEND_API_KEY;

// Development mode - prints reset link to console instead of sending email
const DEVELOPMENT_MODE = !USE_RESEND &&
  (toBool(process.env.EMAIL_DEV_MODE) ||
    (!EMAIL_USER || !EMAIL_PASSWORD));

/**
 * Send password reset email using Resend API
 */
const sendEmailViaResend = async (email, resetToken, userName = 'User') => {
  if (!resend) {
    throw new Error('Resend API key is not configured');
  }

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  const { data, error } = await resend.emails.send({
    from: 'Healix <onboarding@resend.dev>', // You can change this after verifying your domain
    to: email,
    subject: 'Password Reset Request - Healix',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - Healix</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Healix Healthcare</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
          <p>Hello ${userName},</p>
          <p>We received a request to reset your password for your Healix account. If you didn't make this request, you can safely ignore this email.</p>
          <p>To reset your password, click the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            <strong>Important:</strong> This link will expire in 1 hour for security reasons.
          </p>
          <p style="color: #666; font-size: 14px;">
            If you didn't request a password reset, please ignore this email or contact support if you have concerns.
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} Healix Healthcare. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `,
  });

  if (error) {
    throw error;
  }

  console.log('✅ Password reset email sent via Resend:', data?.id);
  return { success: true, messageId: data?.id };
};

// Create transporter for sending emails (for nodemailer/SMTP)
const createTransporter = () => {
  // If in development mode, return null (we'll handle it differently)
  if (DEVELOPMENT_MODE) {
    return null;
  }

  // Check if email is configured
  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    throw new Error('Email configuration is missing. Please set EMAIL_USER and EMAIL_PASSWORD in .env file');
  }

  // Gmail configuration (requires app password)
  if (process.env.EMAIL_SERVICE === 'gmail') {
    console.log('📧 Using Gmail service for email');
    console.log('   Email user:', EMAIL_USER);
    console.log('   Password length:', EMAIL_PASSWORD?.length || 0);

    // Remove spaces from App Password (Gmail App Passwords sometimes have spaces)
    const appPassword = EMAIL_PASSWORD.replace(/\s/g, '');

    if (appPassword.length !== 16) {
      console.warn('⚠️  Warning: App Password should be 16 characters (without spaces)');
    }

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: appPassword, // App password, not regular password
      },
    });
  }

  // Generic SMTP configuration
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  console.log(`📧 Using SMTP: ${smtpHost}:${smtpPort}`);

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
    },
  });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email, resetToken, userName = 'User') => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  // Use Resend if configured
  if (USE_RESEND && resend) {
    try {
      console.log('📧 Using Resend API for email');
      return await sendEmailViaResend(email, resetToken, userName);
    } catch (error) {
      console.error('❌ Error sending email via Resend:', error);
      throw error;
    }
  }

  // Development mode: Print reset link to console instead of sending email
  if (DEVELOPMENT_MODE) {
    console.log('\n' + '='.repeat(70));
    console.log('📧 PASSWORD RESET LINK (Development Mode - No Email Sent)');
    console.log('='.repeat(70));
    console.log(`👤 User: ${userName}`);
    console.log(`📬 Email: ${email}`);
    console.log(`🔗 Reset Link: ${resetUrl}`);
    console.log(`⏰ Expires: 1 hour from now`);
    console.log('='.repeat(70));
    console.log('💡 Copy the link above and open it in your browser to reset password');
    console.log('💡 To enable real email sending, configure RESEND_API_KEY or EMAIL_USER/EMAIL_PASSWORD in .env');
    console.log('='.repeat(70) + '\n');

    // Return success so the flow continues
    return { success: true, messageId: 'dev-mode-console' };
  }

  // Use nodemailer/SMTP
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Healix Healthcare" <${EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request - Healix',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset - Healix</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Healix Healthcare</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
            <p>Hello ${userName},</p>
            <p>We received a request to reset your password for your Healix account. If you didn't make this request, you can safely ignore this email.</p>
            <p>To reset your password, click the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              <strong>Important:</strong> This link will expire in 1 hour for security reasons.
            </p>
            <p style="color: #666; font-size: 14px;">
              If you didn't request a password reset, please ignore this email or contact support if you have concerns.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} Healix Healthcare. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request - Healix
        
        Hello ${userName},
        
        We received a request to reset your password for your Healix account.
        
        To reset your password, visit this link:
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you didn't request this, please ignore this email.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending password reset email:');
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);
    console.error('   Error response:', error.response);
    console.error('   Full error:', error);

    // Provide more helpful error messages
    if (error.code === 'EAUTH') {
      throw new Error('Email authentication failed. Please check your EMAIL_USER and EMAIL_PASSWORD in .env file');
    } else if (error.code === 'ECONNECTION') {
      throw new Error('Could not connect to email server. Please check your SMTP settings.');
    } else if (error.message && error.message.includes('configuration')) {
      throw error; // Re-throw configuration errors as-is
    } else {
      throw new Error(`Email sending failed: ${error.message || 'Unknown error'}`);
    }
  }
};

/**
 * Send password reset confirmation email
 */
export const sendPasswordResetConfirmation = async (email, userName = 'User') => {
  // Development mode: Just log to console
  if (DEVELOPMENT_MODE) {
    console.log(`✅ Password reset confirmed for: ${email} (${userName})`);
    return { success: true };
  }

  // Use Resend if configured
  if (USE_RESEND && resend) {
    try {
      await resend.emails.send({
        from: 'Healix <onboarding@resend.dev>',
        to: email,
        subject: 'Password Reset Successful - Healix',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset Successful - Healix</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Healix Healthcare</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Password Reset Successful</h2>
              <p>Hello ${userName},</p>
              <p>Your password has been successfully reset.</p>
              <p>If you didn't make this change, please contact our support team immediately.</p>
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                For security reasons, if you didn't reset your password, please change it immediately.
              </p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              <p style="color: #999; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} Healix Healthcare. All rights reserved.
              </p>
            </div>
          </body>
          </html>
        `,
      });
      console.log('✅ Password reset confirmation email sent via Resend');
      return { success: true };
    } catch (error) {
      console.error('❌ Error sending confirmation email via Resend:', error);
      return { success: false };
    }
  }

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Healix Healthcare" <${EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Successful - Healix',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Successful - Healix</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Healix Healthcare</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Password Reset Successful</h2>
            <p>Hello ${userName},</p>
            <p>Your password has been successfully reset.</p>
            <p>If you didn't make this change, please contact our support team immediately.</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              For security reasons, if you didn't reset your password, please change it immediately.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} Healix Healthcare. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Password reset confirmation email sent');
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending confirmation email:', error);
    // Don't throw - this is not critical
    return { success: false };
  }
};

/**
 * Send medicine reminder email to patient
 * @param {string} patientEmail - Patient's email address
 * @param {string} patientName - Patient's name
 * @param {object} medicineDetails - Object containing { medicineName, dose, time, doctorName }
 */
export const sendMedicineReminderEmail = async (patientEmail, patientName, medicineDetails) => {
  const { medicineName, dose, time, doctorName } = medicineDetails;

  // Development mode: Print reminder to console instead of sending email
  if (DEVELOPMENT_MODE) {
    console.log('\n' + '='.repeat(70));
    console.log('💊 MEDICINE REMINDER (Development Mode - No Email Sent)');
    console.log('='.repeat(70));
    console.log(`👤 Patient: ${patientName}`);
    console.log(`📬 Email: ${patientEmail}`);
    console.log(`💊 Medicine: ${medicineName}`);
    console.log(`📏 Dose: ${dose}`);
    console.log(`⏰ Time: ${time}`);
    console.log(`👨‍⚕️ Prescribed by: Dr. ${doctorName}`);
    console.log('='.repeat(70));
    console.log('💡 In production, this would send an email to the patient');
    console.log('='.repeat(70) + '\n');

    return { success: true, messageId: 'dev-mode-console' };
  }

  // Use Resend if configured
  if (USE_RESEND && resend) {
    try {
      console.log(`📧 Sending medicine reminder via Resend to: ${patientEmail}`);
      const { data, error } = await resend.emails.send({
        from: 'Healix <onboarding@resend.dev>',
        to: patientEmail,
        subject: `Medicine Reminder: ${medicineName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Medicine Reminder - Healix</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #06D6A0 0%, #10b981 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">💊 Healix Healthcare</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Medicine Reminder</h2>
              <p>Hello ${patientName},</p>
              <p>This is a friendly reminder to take your medication:</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #06D6A0;">
                <h3 style="margin: 0 0 15px 0; color: #06D6A0;">📋 Medication Details</h3>
                <p style="margin: 8px 0;"><strong>Medicine:</strong> ${medicineName}</p>
                <p style="margin: 8px 0;"><strong>Dosage:</strong> ${dose}</p>
                <p style="margin: 8px 0;"><strong>Time:</strong> ${time}</p>
                <p style="margin: 8px 0;"><strong>Prescribed by:</strong> Dr. ${doctorName}</p>
              </div>
              
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #ffc107;">
                <p style="margin: 0; color: #856404;">
                  <strong>⚠️ Important:</strong> Please take your medication as prescribed. If you have any questions or concerns, please contact your doctor.
                </p>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                This is an automated reminder set by your doctor to help you stay on track with your medication schedule.
              </p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              <p style="color: #999; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} Healix Healthcare. All rights reserved.
              </p>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        throw error;
      }

      console.log('✅ Medicine reminder email sent via Resend:', data?.id);
      return { success: true, messageId: data?.id };
    } catch (error) {
      console.error('❌ Error sending reminder via Resend:', error);
      throw error;
    }
  }

  // Use nodemailer/SMTP
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Healix Healthcare" <${EMAIL_USER}>`,
      to: patientEmail,
      subject: `Medicine Reminder: ${medicineName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Medicine Reminder - Healix</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #06D6A0 0%, #10b981 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">💊 Healix Healthcare</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Medicine Reminder</h2>
            <p>Hello ${patientName},</p>
            <p>This is a friendly reminder to take your medication:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #06D6A0;">
              <h3 style="margin: 0 0 15px 0; color: #06D6A0;">📋 Medication Details</h3>
              <p style="margin: 8px 0;"><strong>Medicine:</strong> ${medicineName}</p>
              <p style="margin: 8px 0;"><strong>Dosage:</strong> ${dose}</p>
              <p style="margin: 8px 0;"><strong>Time:</strong> ${time}</p>
              <p style="margin: 8px 0;"><strong>Prescribed by:</strong> Dr. ${doctorName}</p>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #ffc107;">
              <p style="margin: 0; color: #856404;">
                <strong>⚠️ Important:</strong> Please take your medication as prescribed. If you have any questions or concerns, please contact your doctor.
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This is an automated reminder set by your doctor to help you stay on track with your medication schedule.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} Healix Healthcare. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Medicine Reminder - Healix Healthcare
        
        Hello ${patientName},
        
        This is a reminder to take your medication:
        
        Medicine: ${medicineName}
        Dosage: ${dose}
        Time: ${time}
        Prescribed by: Dr. ${doctorName}
        
        Please take your medication as prescribed.
        
        This is an automated reminder from your doctor.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Medicine reminder email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending medicine reminder email:', error);
    throw new Error(`Failed to send medicine reminder: ${error.message || 'Unknown error'}`);
  }
};

  /**
   * Send appointment reminder email to patient
   */
  export const sendAppointmentReminderEmail = async (
    patientEmail,
    patientName,
    doctorName,
    appointmentDate,
    appointmentTime,
    consultationType,
    meetingLink,
    locationDetails,
    doctorComments
  ) => {
    // Development mode: Print reminder to console instead of sending email
    if (DEVELOPMENT_MODE) {
      console.log('\n' + '='.repeat(70));
      console.log('📅 APPOINTMENT REMINDER (Development Mode - No Email Sent)');
      console.log('='.repeat(70));
      console.log(`👤 Patient: ${patientName}`);
      console.log(`📬 Email: ${patientEmail}`);
      console.log(`👨‍⚕️ Doctor: Dr. ${doctorName}`);
      console.log(`📅 Date: ${appointmentDate}`);
      console.log(`⏰ Time: ${appointmentTime}`);
      console.log(`📱 Type: ${consultationType}`);
      if (meetingLink) console.log(`🔗 Meeting Link: ${meetingLink}`);
      if (locationDetails) console.log(`📍 Location: ${locationDetails}`);
      if (doctorComments) console.log(`💬 Comments: ${doctorComments}`);
      console.log('='.repeat(70));
      console.log('💡 In production, this would send an email to the patient');
      console.log('='.repeat(70) + '\n');

      return { success: true, messageId: 'dev-mode-console' };
    }

    // Use Resend if configured
    if (USE_RESEND && resend) {
      try {
        console.log(`📧 Sending appointment reminder via Resend to: ${patientEmail}`);
        const { data, error } = await resend.emails.send({
          from: 'Healix <onboarding@resend.dev>',
          to: patientEmail,
          subject: `Appointment Reminder: Consultation with Dr. ${doctorName}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Appointment Reminder - Healix</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">📅 Healix Healthcare</h1>
              </div>
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">Appointment Reminder</h2>
                <p>Hello ${patientName},</p>
                <p>This is a reminder that you have an upcoming appointment:</p>
              
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                  <h3 style="margin: 0 0 15px 0; color: #667eea;">📋 Appointment Details</h3>
                  <p style="margin: 8px 0;"><strong>Doctor:</strong> Dr. ${doctorName}</p>
                  <p style="margin: 8px 0;"><strong>Date:</strong> ${appointmentDate}</p>
                  <p style="margin: 8px 0;"><strong>Time:</strong> ${appointmentTime}</p>
                  <p style="margin: 8px 0;"><strong>Type:</strong> ${consultationType === 'online' ? '🌐 Online Consultation' : '📍 In-Person Visit'}</p>
                  ${
                    consultationType === 'online' && meetingLink
                      ? `<p style="margin: 8px 0;"><strong>Meeting Link:</strong> <a href="${meetingLink}" style="color: #667eea; text-decoration: none;">${meetingLink}</a></p>`
                      : ''
                  }
                  ${
                    consultationType === 'in-person' && locationDetails
                      ? `<p style="margin: 8px 0;"><strong>Location:</strong> ${locationDetails}</p>`
                      : ''
                  }
                </div>
              
                ${
                  doctorComments
                    ? `
                  <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #2196F3;">
                    <h4 style="margin: 0 0 10px 0; color: #1976D2;">💬 Doctor's Comments</h4>
                    <p style="margin: 0; color: #0d47a1;">${doctorComments}</p>
                  </div>
                `
                    : ''
                }
              
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #ffc107;">
                  <p style="margin: 0; color: #856404;">
                    <strong>⏰ Important:</strong> Please be on time for your appointment. If you need to cancel or reschedule, please contact us as soon as possible.
                  </p>
                </div>
              
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                  If you have any questions or concerns, please don't hesitate to contact your doctor or our support team.
                </p>
              
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">
                  © ${new Date().getFullYear()} Healix Healthcare. All rights reserved.
                </p>
              </div>
            </body>
            </html>
          `,
        });

        if (error) {
          throw error;
        }

        console.log('✅ Appointment reminder email sent via Resend:', data?.id);
        return { success: true, messageId: data?.id };
      } catch (error) {
        console.error('❌ Error sending appointment reminder via Resend:', error);
        throw error;
      }
    }

    // Use nodemailer/SMTP
    try {
      const transporter = createTransporter();

      const mailOptions = {
        from: `"Healix Healthcare" <${EMAIL_USER}>`,
        to: patientEmail,
        subject: `Appointment Reminder: Consultation with Dr. ${doctorName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Appointment Reminder - Healix</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">📅 Healix Healthcare</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Appointment Reminder</h2>
              <p>Hello ${patientName},</p>
              <p>This is a reminder that you have an upcoming appointment:</p>
            
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                <h3 style="margin: 0 0 15px 0; color: #667eea;">📋 Appointment Details</h3>
                <p style="margin: 8px 0;"><strong>Doctor:</strong> Dr. ${doctorName}</p>
                <p style="margin: 8px 0;"><strong>Date:</strong> ${appointmentDate}</p>
                <p style="margin: 8px 0;"><strong>Time:</strong> ${appointmentTime}</p>
                <p style="margin: 8px 0;"><strong>Type:</strong> ${consultationType === 'online' ? '🌐 Online Consultation' : '📍 In-Person Visit'}</p>
                ${
                  consultationType === 'online' && meetingLink
                    ? `<p style="margin: 8px 0;"><strong>Meeting Link:</strong> <a href="${meetingLink}" style="color: #667eea; text-decoration: none;">${meetingLink}</a></p>`
                    : ''
                }
                ${
                  consultationType === 'in-person' && locationDetails
                    ? `<p style="margin: 8px 0;"><strong>Location:</strong> ${locationDetails}</p>`
                    : ''
                }
              </div>
            
              ${
                doctorComments
                  ? `
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #2196F3;">
                  <h4 style="margin: 0 0 10px 0; color: #1976D2;">💬 Doctor's Comments</h4>
                  <p style="margin: 0; color: #0d47a1;">${doctorComments}</p>
                </div>
              `
                  : ''
              }
            
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #ffc107;">
                <p style="margin: 0; color: #856404;">
                  <strong>⏰ Important:</strong> Please be on time for your appointment. If you need to cancel or reschedule, please contact us as soon as possible.
                </p>
              </div>
            
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                If you have any questions or concerns, please don't hesitate to contact your doctor or our support team.
              </p>
            
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              <p style="color: #999; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} Healix Healthcare. All rights reserved.
              </p>
            </div>
          </body>
          </html>
        `,
        text: `
          Appointment Reminder - Healix Healthcare
        
          Hello ${patientName},
        
          This is a reminder that you have an upcoming appointment:
        
          Doctor: Dr. ${doctorName}
          Date: ${appointmentDate}
          Time: ${appointmentTime}
          Type: ${consultationType === 'online' ? 'Online Consultation' : 'In-Person Visit'}
          ${consultationType === 'online' && meetingLink ? `Meeting Link: ${meetingLink}` : ''}
          ${consultationType === 'in-person' && locationDetails ? `Location: ${locationDetails}` : ''}
        
          ${doctorComments ? `Doctor's Comments: ${doctorComments}` : ''}
        
          Please be on time for your appointment.
        
          If you have any questions, please contact your doctor or our support team.
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Appointment reminder email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error sending appointment reminder email:', error);
      throw new Error(`Failed to send appointment reminder: ${error.message || 'Unknown error'}`);
    }
  };

