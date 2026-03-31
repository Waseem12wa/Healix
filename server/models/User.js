import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters']
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: ['patient', 'doctor', 'provider', 'admin', 'stakeholder'],
    lowercase: true
  },
  userName: {
    type: String,
    trim: true
  },
  patientProfile: {
    profileImage: {
      type: String,
      default: ''
    },
    assignedDoctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    age: {
      type: Number,
      min: 0,
      max: 130,
      default: null
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say', ''],
      default: ''
    },
    mobileNumber: {
      type: String,
      trim: true,
      default: ''
    },
    bio: {
      type: String,
      trim: true,
      default: ''
    }
  },
  patientCart: {
    type: [
      {
        medicineId: {
          type: String,
          required: true
        },
        medicine: {
          type: mongoose.Schema.Types.Mixed,
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
          default: 1
        }
      }
    ],
    default: []
  },
  // Doctor Profile Fields
  doctorProfile: {
    // Personal Information
    fullName: String,
    phoneNumber: String,
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other']
    },
    // Professional Details
    specialization: String,
    subSpecialization: String,
    education: [String], // Array of degrees
    pmdcNumber: String,
    yearsOfExperience: Number,
    professionalBio: String,
    languagesSpoken: [String],
    // Clinic/Practice Details
    clinicName: String,
    clinicAddress: String,
    city: String,
    mapLocation: String, // Optional - can be coordinates or address
    // Availability
    workingDays: [String], // e.g., ['Monday', 'Tuesday', 'Wednesday']
    startTime: String, // e.g., '09:00'
    endTime: String, // e.g., '17:00'
    slotDuration: {
      type: Number,
      enum: [10, 15, 30] // minutes
    },
    // Fee Structure
    inPersonFee: Number,
    onlineFee: Number,
    // Profile Completion Status
    profileCompleted: {
      type: Boolean,
      default: false
    }
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  savedPaymentMethods: [{
    paymentToken: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['card', 'paypal', 'nayapay'],
      required: true
    },
    provider: {
      type: String,
      required: true
    },
    holderName: String,
    last4: String,
    expiryMonth: Number,
    expiryYear: Number,
    walletIdMasked: String,
    isDefault: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Patient Reminder Email Preference
  reminderEmail: {
    type: String,
    default: null,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
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

// Hash password before saving (must be first to ensure password is hashed)
userSchema.pre('save', async function(next) {
  // Only hash if password is modified and not already hashed
  if (!this.isModified('password')) {
    return next();
  }
  
  // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
  if (this.password && this.password.startsWith('$2')) {
    console.log('⚠️  Password appears to already be hashed, skipping hash');
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(String(this.password), salt);
    console.log('✅ Password hashed successfully');
    next();
  } catch (error) {
    console.error('❌ Error hashing password:', error);
    next(error);
  }
});

// Normalize role before saving (map 'stakeholder' to 'provider')
userSchema.pre('save', function(next) {
  if (this.role === 'stakeholder') {
    this.role = 'provider';
  }
  next();
});

// Update updatedAt before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user without password
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const User = mongoose.model('User', userSchema);

export default User;

