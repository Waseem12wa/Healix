import mongoose from 'mongoose';

/**
 * MedicineReminder Schema
 * 
 * Each document represents ONE reminder instance (one specific date/time to send an email).
 * If a patient needs to take medicine twice daily for 7 days, this creates 14 documents.
 * 
 * Access Control: Reminders are linked to approved appointments to ensure doctors
 * can only create reminders for their own approved patients.
 */
const medicineReminderSchema = new mongoose.Schema({
    // Doctor information (who created the reminder)
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Doctor ID is required']
    },
    doctorEmail: {
        type: String,
        required: [true, 'Doctor email is required'],
        index: true // Index for efficient queries by doctor
    },
    doctorName: {
        type: String,
        required: [true, 'Doctor name is required']
    },

    // Patient information (who receives the reminder)
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Patient ID is required']
    },
    patientEmail: {
        type: String,
        required: [true, 'Patient email is required'],
        index: true // Index for efficient queries by patient
    },
    patientName: {
        type: String,
        required: [true, 'Patient name is required']
    },

    // Appointment reference for access control
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: [true, 'Appointment ID is required'],
        index: true
    },

    // Medicine details
    medicineName: {
        type: String,
        required: [true, 'Medicine name is required']
    },
    dose: {
        type: String,
        required: [true, 'Dose is required']
    },
    frequency: {
        type: Number,
        enum: [1, 2, 3],
        required: [true, 'Frequency is required']
    },

    // Timing information
    reminderDateTime: {
        type: Date,
        required: [true, 'Reminder date/time is required'],
        index: true // Critical index for scheduler queries
    },
    startDate: {
        type: String, // Format: YYYY-MM-DD
        required: [true, 'Start date is required']
    },
    duration: {
        type: Number, // Number of days
        required: [true, 'Duration is required']
    },
    timeOfDay: {
        type: String, // Format: HH:MM (e.g., "09:00", "14:30")
        required: [true, 'Time of day is required']
    },

    // Email delivery status
    sent: {
        type: Boolean,
        default: false,
        index: true // Index for scheduler queries (sent=false)
    },
    sentAt: {
        type: Date,
        default: null
    },
    error: {
        type: String,
        default: null
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index for scheduler query optimization
// Query: Find unsent reminders that are due
medicineReminderSchema.index({ sent: 1, reminderDateTime: 1 });

// Compound index for doctor queries
medicineReminderSchema.index({ doctorEmail: 1, patientId: 1 });

// Update updatedAt before saving
medicineReminderSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const MedicineReminder = mongoose.model('MedicineReminder', medicineReminderSchema);

export default MedicineReminder;
