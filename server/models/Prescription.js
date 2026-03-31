import mongoose from 'mongoose';

const prescribedMedicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
    },
    dosage: {
      type: String,
      default: '',
      trim: true,
    },
    instructions: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: [true, 'Appointment ID is required'],
    index: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient ID is required'],
    index: true,
  },
  patientEmail: {
    type: String,
    required: [true, 'Patient email is required'],
    trim: true,
    lowercase: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor ID is required'],
    index: true,
  },
  doctorEmail: {
    type: String,
    required: [true, 'Doctor email is required'],
    trim: true,
    lowercase: true,
  },
  conditionDescription: {
    type: String,
    required: [true, 'Condition description is required'],
    trim: true,
  },
  medicines: {
    type: [prescribedMedicineSchema],
    validate: {
      validator: (value) => Array.isArray(value) && value.length > 0,
      message: 'At least one prescribed medicine is required',
    },
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

prescriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

prescriptionSchema.index({ patientId: 1, createdAt: -1 });
prescriptionSchema.index({ doctorId: 1, createdAt: -1 });

const Prescription = mongoose.model('Prescription', prescriptionSchema);

export default Prescription;
