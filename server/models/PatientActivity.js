import mongoose from 'mongoose';

const patientActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['purchase', 'ai-assistant', 'drug-interaction', 'food-interaction', 'profile-update', 'cart-update', 'other'],
      default: 'other',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    details: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

patientActivitySchema.index({ userId: 1, category: 1, createdAt: -1 });

const PatientActivity = mongoose.model('PatientActivity', patientActivitySchema);

export default PatientActivity;
