import express from 'express';
import { sendContactMessageEmail } from '../utils/emailService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const firstName = String(req.body?.firstName || '').trim();
    const lastName = String(req.body?.lastName || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const subject = String(req.body?.subject || '').trim();
    const message = String(req.body?.message || '').trim();

    if (!firstName || !lastName || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    if (subject.length > 150) {
      return res.status(400).json({
        success: false,
        message: 'Subject is too long',
      });
    }

    if (message.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Message is too long',
      });
    }

    await sendContactMessageEmail({
      firstName,
      lastName,
      email,
      subject,
      message,
    });

    return res.json({
      success: true,
      message: 'Your message has been sent successfully',
    });
  } catch (error) {
    console.error('❌ Error sending contact message:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to send message',
    });
  }
});

export default router;
