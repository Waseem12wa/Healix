import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      required: true,
      default: 'global',
      index: true,
    },
    platformName: {
      type: String,
      default: 'Healix',
      trim: true,
    },
    supportEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    allowNewRegistrations: {
      type: Boolean,
      default: true,
    },
    enableEmailNotifications: {
      type: Boolean,
      default: true,
    },
    appointmentReminderLeadMinutes: {
      type: Number,
      default: 15,
      min: 5,
      max: 120,
    },
    defaultThemeMode: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light',
    },
    defaultBlackAndWhiteMode: {
      type: Boolean,
      default: false,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('SystemSetting', systemSettingSchema);
