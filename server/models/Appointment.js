import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient ID is required']
  },
  patientEmail: {
    type: String,
    required: [true, 'Patient email is required']
  },
  patientName: {
    type: String,
    required: [true, 'Patient name is required']
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor ID is required']
  },
  doctorEmail: {
    type: String,
    required: [true, 'Doctor email is required']
  },
  doctorName: {
    type: String,
    required: [true, 'Doctor name is required']
  },
  specialization: {
    type: String,
    required: [true, 'Specialization is required']
  },
  date: {
    type: String,
    required: [true, 'Date is required']
  },
  time: {
    type: String,
    required: [true, 'Time is required']
  },
  location: {
    type: String,
    required: [true, 'Location is required']
  },
  consultationType: {
    type: String,
    enum: ['in-person', 'online'],
    default: 'in-person'
  },
  fee: {
    type: Number,
    required: [true, 'Fee is required']
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt before saving
appointmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;

