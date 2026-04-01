import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  userEmail: {
    type: String,
    required: [true, 'User email is required']
  },
  type: {
    type: String,
    enum: [
      'appointment_request',
      'appointment_approved',
      'appointment_rejected',
      'appointment_cancelled',
      'appointment_details_shared',
      'appointment_reminder_patient',
      'appointment_reminder_doctor',
      'prescription_added',
      'doctor_review_request',
      'doctor_review_result',
      'medication_reminder_set',
      'medication_reminder_due',
      'provider_order_update',
      'provider_payment_update',
      'provider_support_message'
    ],
    required: [true, 'Notification type is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required']
  },
  message: {
    type: String,
    required: [true, 'Message is required']
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  },
  reviewRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DoctorReviewRequest',
    default: null,
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;

