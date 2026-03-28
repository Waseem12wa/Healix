import mongoose from 'mongoose';

const doctorReviewRequestSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  patientName: {
    type: String,
    default: '',
  },
  patientEmail: {
    type: String,
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  doctorEmail: {
    type: String,
    required: true,
  },
  feature: {
    type: String,
    enum: ['ddi', 'dfi', 'alternatives', 'side-effects', 'ai-assistant', 'medication-pharmacy', 'health-summary'],
    required: true,
    index: true,
  },
  patientQuery: {
    type: String,
    default: '',
  },
  aiResultText: {
    type: String,
    required: true,
  },
  aiResultData: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'modified'],
    default: 'pending',
    index: true,
  },
  doctorActionMessage: {
    type: String,
    default: '',
  },
  modifiedResultText: {
    type: String,
    default: '',
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

doctorReviewRequestSchema.index({ doctorId: 1, status: 1, createdAt: -1 });
doctorReviewRequestSchema.index({ patientId: 1, createdAt: -1 });

const DoctorReviewRequest = mongoose.model('DoctorReviewRequest', doctorReviewRequestSchema);

export default DoctorReviewRequest;
