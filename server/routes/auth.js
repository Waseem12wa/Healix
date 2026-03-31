import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import User from '../models/User.js';
import PatientActivity from '../models/PatientActivity.js';
import Appointment from '../models/Appointment.js';
import Notification from '../models/Notification.js';
import MedicineReminder from '../models/MedicineReminder.js';
import Order from '../models/Order.js';
import PaymentTransaction from '../models/PaymentTransaction.js';
import DoctorReviewRequest from '../models/DoctorReviewRequest.js';
import Prescription from '../models/Prescription.js';
import { requireAuth, signAuthToken } from '../middleware/auth.js';
import { uploadProfileImageObject } from '../services/objectStorage.js';
import { validatePassword, validateEmail, validateRole, validateUserName } from '../utils/validation.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
});

const sanitizeProfilePayload = (payload = {}) => {
  const next = {};

  if (typeof payload.userName === 'string') {
    next.userName = payload.userName.trim();
  }
  if (typeof payload.email === 'string') {
    next.email = payload.email.trim().toLowerCase();
  }

  const patientProfile = payload.patientProfile && typeof payload.patientProfile === 'object'
    ? payload.patientProfile
    : payload;

  const profileUpdate = {};
  if (typeof patientProfile.profileImage === 'string') profileUpdate.profileImage = patientProfile.profileImage;
  if (typeof patientProfile.assignedDoctorId === 'string' || patientProfile.assignedDoctorId === null) {
    profileUpdate.assignedDoctorId = patientProfile.assignedDoctorId;
  }
  if (typeof patientProfile.age === 'number' || typeof patientProfile.age === 'string') {
    const age = Number(patientProfile.age);
    if (Number.isFinite(age)) profileUpdate.age = age;
  }
  if (typeof patientProfile.gender === 'string') profileUpdate.gender = patientProfile.gender;
  if (typeof patientProfile.mobileNumber === 'string') profileUpdate.mobileNumber = patientProfile.mobileNumber.trim();
  if (typeof patientProfile.bio === 'string') profileUpdate.bio = patientProfile.bio.trim();

  next.patientProfile = profileUpdate;
  return next;
};

const isPatientProfileCompleted = (user) => {
  const profile = user?.patientProfile || {};
  const age = Number(profile.age);

  return Boolean(
    String(user?.userName || '').trim() &&
    String(user?.email || '').trim() &&
    Number.isFinite(age) &&
    age > 0 &&
    Boolean(profile.assignedDoctorId) &&
    String(profile.gender || '').trim() &&
    String(profile.mobileNumber || '').trim()
  );
};

const isProfileCompletedForUser = (user) => {
  if (!user) return false;

  if (user.role === 'doctor') {
    return Boolean(user.doctorProfile?.profileCompleted);
  }

  if (user.role === 'patient') {
    return isPatientProfileCompleted(user);
  }

  if (user.role === 'admin') {
    const hasName = Boolean(String(user.userName || '').trim());
    const hasProfileImage = Boolean(String(user?.patientProfile?.profileImage || '').trim());
    return hasName && hasProfileImage;
  }

  return true;
};

const serializeUserForClient = (user) => ({
  
  id: String(user._id),
  email: user.email,
  role: user.role,
  userName: user.userName,
  createdAt: user.createdAt,
  patientProfile: {
    ...(user.patientProfile || {}),
    assignedDoctorId: user?.patientProfile?.assignedDoctorId
      ? String(user.patientProfile.assignedDoctorId)
      : null,
  },
  profileCompleted: isProfileCompletedForUser(user),
});

const ensureDatabaseConnected = (res) => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  return res.status(503).json({
    success: false,
    message: 'Database is currently unavailable. Please start MongoDB and try again.',
    code: 'DB_UNAVAILABLE',
  });
};

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post('/signup', async (req, res) => {
  try {
    if (!ensureDatabaseConnected(res)) {
      return;
    }

    const { email, password, role, userName } = req.body;

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: emailValidation.error,
        field: 'email'
      });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password validation failed',
        errors: passwordValidation.errors,
        field: 'password'
      });
    }

    // Validate role
    const roleValidation = validateRole(role);
    if (!roleValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: roleValidation.error,
        field: 'role'
      });
    }

    // Validate username (optional)
    let finalUserName = null;
    if (userName) {
      const userNameValidation = validateUserName(userName);
      if (!userNameValidation.isValid) {
        return res.status(400).json({ 
          success: false, 
          message: userNameValidation.error,
          field: 'userName'
        });
      }
      finalUserName = userNameValidation.userName;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'An account with this email already exists. Please use a different email or try logging in.',
        field: 'email'
      });
    }

    // Create new user
    const normalizedEmail = email.toLowerCase().trim();
    const userPassword = String(password).trim(); // Ensure password is a string and trimmed
    
    console.log('\n📝 Creating new user:');
    console.log('   Email:', normalizedEmail);
    console.log('   Role:', roleValidation.role);
    console.log('   Password length (before hash):', userPassword.length);
    console.log('   UserName:', finalUserName || normalizedEmail.split('@')[0]);

    const user = new User({
      email: normalizedEmail,
      password: userPassword, // Plain password - will be hashed in pre-save hook
      role: roleValidation.role,
      userName: finalUserName || normalizedEmail.split('@')[0]
    });

    // Mark password as modified to ensure it gets hashed
    user.markModified('password');

    // Save user (password will be hashed in pre-save hook)
    try {
      await user.save();
      console.log('✅ User saved to database');
      console.log('   User ID:', user._id);
      console.log('   Stored email:', user.email);
      console.log('   Stored role:', user.role);
      console.log('   Password hash length:', user.password?.length || 0);
      console.log('   Password hash starts with:', user.password?.substring(0, 7) || 'N/A');
    } catch (saveError) {
      console.error('❌ Error saving user to database:', saveError);
      console.error('   Error name:', saveError.name);
      console.error('   Error code:', saveError.code);
      console.error('   Error message:', saveError.message);
      throw saveError; // Re-throw to be caught by outer catch
    }

    // CRITICAL: Verify user was actually saved to database by ID
    console.log('\n🔍 Verifying user exists in database (by ID)...');
    const verifyUserById = await User.findById(user._id);
    if (!verifyUserById) {
      console.error('❌ CRITICAL ERROR: User was not saved to database (ID lookup failed)!');
      console.error('   User ID:', user._id);
      console.error('   Email:', normalizedEmail);
      return res.status(500).json({
        success: false,
        message: 'Failed to save user to database. Please try again.',
        error: 'User not persisted'
      });
    }
    console.log('✅ User found by ID');

    // CRITICAL: Verify user can be found by email (same way login will search)
    console.log('🔍 Verifying user exists in database (by email)...');
    const verifyUserByEmail = await User.findOne({ email: normalizedEmail });
    if (!verifyUserByEmail) {
      console.error('❌ CRITICAL ERROR: User was not found by email (login will fail)!');
      console.error('   Searched email:', normalizedEmail);
      console.error('   User ID from save:', user._id);
      
      // List all users for debugging
      const allUsers = await User.find({}).select('email');
      console.error('   All users in database:', allUsers.map(u => u.email));
      
      return res.status(500).json({
        success: false,
        message: 'User was created but cannot be found. Please contact support.',
        error: 'User not findable by email'
      });
    }
    console.log('✅ User found by email');
    console.log('   Verified email:', verifyUserByEmail.email);
    console.log('   Verified role:', verifyUserByEmail.role);
    console.log('');

    // Verify the password was hashed correctly by testing it immediately
    const testPasswordMatch = await verifyUserByEmail.comparePassword(userPassword);
    console.log('🔐 Password verification test (immediate):', testPasswordMatch ? '✅ PASSED' : '❌ FAILED');
    
    if (!testPasswordMatch) {
      console.error('❌ CRITICAL: Password verification failed immediately after signup!');
      console.error('   This indicates a problem with password hashing.');
      // Don't return error here, just log it - user is still created
    }
    console.log('');

    // Return user without password
    res.status(201).json({ 
      success: true, 
      message: 'Account created successfully! You can now log in.',
      token: signAuthToken(user),
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
        userName: user.userName,
        createdAt: user.createdAt,
        profileCompleted: isProfileCompletedForUser(user),
      }
    });

  } catch (error) {
    console.error('\n❌ Signup error occurred:');
    console.error('   Error name:', error.name);
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    console.error('');
    
    // Handle duplicate key error (MongoDB)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      console.error('   Duplicate key error on field:', field);
      return res.status(409).json({ 
        success: false, 
        message: `An account with this ${field} already exists.`,
        field: field
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors || {}).map(err => err.message);
      console.error('   Validation errors:', errors);
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error',
        errors: errors
      });
    }

    // Handle other MongoDB errors
    if (error.name === 'MongoServerError' || error.name === 'MongoError') {
      console.error('   MongoDB error:', error.message);
      return res.status(500).json({ 
        success: false, 
        message: 'Database error occurred. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while creating your account. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and login
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    if (!ensureDatabaseConnected(res)) {
      return;
    }

    const { email, password, role } = req.body;

    // Log the incoming request
    console.log('\n🔐 Login attempt received:');
    console.log('   Email:', email);
    console.log('   Role:', role);
    console.log('   Has Password:', !!password);
    console.log('   Request Body:', JSON.stringify(req.body));

    // Validate required fields
    if (!email || !password) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required',
        field: !email ? 'email' : 'password'
      });
    }

    // Normalize email - ensure it's lowercase and trimmed
    const normalizedEmail = String(email).toLowerCase().trim();
    console.log('   Normalized Email:', normalizedEmail);

    // Validate email format
    const emailValidation = validateEmail(normalizedEmail);
    if (!emailValidation.isValid) {
      console.log('❌ Invalid email format');
      return res.status(400).json({ 
        success: false, 
        message: emailValidation.error,
        field: 'email'
      });
    }

    // Find user by email (case-insensitive)
    console.log('🔍 Searching for user in database...');
    console.log('   Search query:', { email: normalizedEmail });
    console.log('   MongoDB connection state:', mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected');
    
    // Try multiple query methods to ensure we find the user
    let user = await User.findOne({ 
      email: normalizedEmail
    });
    
    // If not found, try case-insensitive regex search as fallback
    if (!user) {
      console.log('   ⚠️  Exact match not found, trying case-insensitive search...');
      user = await User.findOne({ 
        email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
      });
    }
    
    // If still not found, list all users for debugging
    if (!user) {
      const allUsers = await User.find({}).select('email role').limit(10);
      console.log('   All users in database:', allUsers.map(u => u.email));
    }

    if (!user) {
      console.log('❌ User not found in database');
      console.log('   Searched for:', normalizedEmail);
      
      // List all users for debugging
      const allUsers = await User.find({}).select('email');
      console.log('   Available users:', allUsers.map(u => u.email));
      
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password. Please check your credentials and try again.',
        field: 'credentials'
      });
    }

    console.log('✅ User found:', {
      email: user.email,
      role: user.role,
      userName: user.userName
    });

    // Compare password using bcrypt
    console.log('🔐 Verifying password...');
    const isPasswordValid = await user.comparePassword(String(password));

    console.log('   Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ Password does not match');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password. Please check your credentials and try again.',
        field: 'credentials'
      });
    }

    // If role is provided, verify it matches
    if (role) {
      const roleValidation = validateRole(role);
      if (roleValidation.isValid) {
        const expectedRole = roleValidation.role;
        if (user.role !== expectedRole) {
          console.log(`❌ Role mismatch: expected ${expectedRole}, got ${user.role}`);
          return res.status(403).json({ 
            success: false, 
            message: `Access denied. This account is registered as ${user.role}, not ${expectedRole}.`,
            field: 'role'
          });
        }
      }
    }

    // Extract username
    const userName = user.userName || normalizedEmail.split('@')[0];

    console.log('✅ Login successful!');
    console.log('   User:', user.email);
    console.log('   Role:', user.role);
    console.log('');

    // Success - return user data
    res.json({ 
      success: true, 
      message: 'Login successful',
      token: signAuthToken(user),
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
        userName: userName,
        createdAt: user.createdAt,
        profileCompleted: isProfileCompletedForUser(user),
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    console.error('   Stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred during login. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/auth/test
 * @desc    Test authentication API and database connection
 * @access  Public
 */
router.get('/test', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get list of all users (without passwords)
    const allUsers = await User.find({}).select('email role userName createdAt');

    res.json({ 
      success: true, 
      message: 'Authentication API is working',
      database: 'MongoDB',
      stats: {
        totalUsers: userCount,
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      users: allUsers
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Database connection error',
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/auth/check-email
 * @desc    Check if email is already registered
 * @access  Public
 */
router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: emailValidation.error 
      });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });

  res.json({ 
    success: true, 
      available: !user,
      message: user ? 'This email is already registered' : 'This email is available'
    });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred. Please try again later.' 
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user with profile
 * @access  Private
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      data: serializeUserForClient(user),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   DELETE /api/auth/me
 * @desc    Delete currently authenticated account (with password confirmation)
 * @access  Private
 */
router.delete('/me', requireAuth, async (req, res) => {
  try {
    const { password, confirmText } = req.body || {};

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Current password is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const normalizedConfirm = String(confirmText || '').trim();
    const isDeleteKeyword = normalizedConfirm.toUpperCase() === 'DELETE';
    const isRegisteredEmail = normalizedConfirm.toLowerCase() === String(user.email || '').toLowerCase();
    if (!isDeleteKeyword && !isRegisteredEmail) {
      return res.status(400).json({
        success: false,
        message: 'Type DELETE or your registered email to confirm account deletion',
      });
    }

    const passwordMatched = await user.comparePassword(password);
    if (!passwordMatched) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const userId = user._id;
    const userEmail = user.email;

    const userOrders = await Order.find({ userId }).select('_id').lean();
    const orderIds = userOrders.map((order) => order._id);

    await Promise.all([
      Appointment.deleteMany({
        $or: [
          { patientId: userId },
          { doctorId: userId },
          { patientEmail: userEmail },
          { doctorEmail: userEmail },
        ],
      }),
      Notification.deleteMany({
        $or: [{ userId }, { userEmail }],
      }),
      MedicineReminder.deleteMany({
        $or: [
          { patientId: userId },
          { doctorId: userId },
          { patientEmail: userEmail },
          { doctorEmail: userEmail },
          { reminderRecipientEmail: userEmail },
        ],
      }),
      PatientActivity.deleteMany({ userId }),
      DoctorReviewRequest.deleteMany({
        $or: [
          { patientId: userId },
          { doctorId: userId },
          { patientEmail: userEmail },
          { doctorEmail: userEmail },
        ],
      }),
      Prescription.deleteMany({
        $or: [
          { patientId: userId },
          { doctorId: userId },
          { patientEmail: userEmail },
          { doctorEmail: userEmail },
        ],
      }),
      Order.deleteMany({ userId }),
      PaymentTransaction.deleteMany({
        $or: [
          { userId },
          ...(orderIds.length ? [{ orderId: { $in: orderIds } }] : []),
        ],
      }),
    ]);

    await User.deleteOne({ _id: userId });

    return res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/auth/doctors/available
 * @desc    Get list of available doctors for patient assignment
 * @access  Private (Patient)
 */
router.get('/doctors/available', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ success: false, message: 'Only patients can access doctor assignment list' });
    }

    const doctors = await User.find({
      role: 'doctor',
      'doctorProfile.profileCompleted': true,
    })
      .select('_id email userName doctorProfile.fullName doctorProfile.specialization doctorProfile.city')
      .sort({ 'doctorProfile.fullName': 1, userName: 1, email: 1 });

    const data = doctors.map((doctor) => ({
      id: String(doctor._id),
      name: doctor.doctorProfile?.fullName || doctor.userName || doctor.email,
      email: doctor.email,
      specialization: doctor.doctorProfile?.specialization || '',
      city: doctor.doctorProfile?.city || '',
    }));

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/auth/me/profile
 * @desc    Update patient profile fields and persist permanently
 * @access  Private
 */
router.put('/me/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const incoming = sanitizeProfilePayload(req.body || {});

    if (Object.prototype.hasOwnProperty.call(incoming.patientProfile || {}, 'assignedDoctorId')) {
      const nextAssignedDoctorId = incoming.patientProfile.assignedDoctorId;

      if (nextAssignedDoctorId === '' || nextAssignedDoctorId === null) {
        incoming.patientProfile.assignedDoctorId = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(String(nextAssignedDoctorId))) {
          return res.status(400).json({ success: false, message: 'Invalid doctor selection', field: 'assignedDoctorId' });
        }

        const doctor = await User.findOne({
          _id: String(nextAssignedDoctorId),
          role: 'doctor',
          'doctorProfile.profileCompleted': true,
        }).select('_id');

        if (!doctor) {
          return res.status(400).json({ success: false, message: 'Selected doctor is not available', field: 'assignedDoctorId' });
        }

        incoming.patientProfile.assignedDoctorId = doctor._id;
      }
    }

    if (incoming.userName) {
      const validation = validateUserName(incoming.userName);
      if (!validation.isValid) {
        return res.status(400).json({ success: false, message: validation.error, field: 'userName' });
      }
      user.userName = validation.userName;
    }

    if (incoming.email && incoming.email !== user.email) {
      const emailValidation = validateEmail(incoming.email);
      if (!emailValidation.isValid) {
        return res.status(400).json({ success: false, message: emailValidation.error, field: 'email' });
      }

      const existing = await User.findOne({ email: incoming.email, _id: { $ne: user._id } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Email is already in use by another account', field: 'email' });
      }

      user.email = incoming.email;
    }

    user.patientProfile = {
      ...(user.patientProfile || {}),
      ...(incoming.patientProfile || {}),
    };

    await user.save();

    await PatientActivity.create({
      userId: user._id,
      category: 'profile-update',
      title: 'Profile updated',
      details: 'Patient profile information updated',
      metadata: {
        updatedFields: Object.keys(incoming.patientProfile || {}),
      },
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: serializeUserForClient(user),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/auth/me/profile-image
 * @desc    Upload profile image to object storage and persist URL
 * @access  Private
 */
router.post('/me/profile-image', requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image file is required' });
    }

    const uploaded = await uploadProfileImageObject({
      userId: req.user.id,
      fileBuffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
    });

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.patientProfile = {
      ...(user.patientProfile || {}),
      profileImage: uploaded.url,
    };

    await user.save();

    await PatientActivity.create({
      userId: user._id,
      category: 'profile-update',
      title: 'Profile image updated',
      details: 'Patient uploaded a new profile image',
      metadata: {
        provider: uploaded.provider,
        key: uploaded.key,
      },
    });

    return res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        profileImage: uploaded.url,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/auth/me/cart
 * @desc    Retrieve persistent cart for authenticated user
 * @access  Private
 */
router.get('/me/cart', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('patientCart');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const cart = (user.patientCart || []).reduce((acc, entry) => {
      acc[entry.medicineId] = {
        medicine: entry.medicine,
        quantity: entry.quantity,
      };
      return acc;
    }, {});

    return res.json({ success: true, cart });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/auth/me/cart
 * @desc    Persist authenticated user's cart
 * @access  Private
 */
router.put('/me/cart', requireAuth, async (req, res) => {
  try {
    const cart = req.body?.cart;
    if (!cart || typeof cart !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid cart payload' });
    }

    const cartEntries = Object.entries(cart)
      .filter(([_, value]) => value && typeof value === 'object')
      .map(([medicineId, value]) => ({
        medicineId,
        medicine: value.medicine,
        quantity: Math.max(1, Number.parseInt(value.quantity || 1, 10)),
      }));

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { patientCart: cartEntries } },
      { new: true }
    ).select('patientCart');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await PatientActivity.create({
      userId: req.user.id,
      category: 'cart-update',
      title: 'Cart updated',
      details: `Cart synchronized with ${cartEntries.length} items`,
      metadata: { items: cartEntries.length },
    });

    return res.json({ success: true, message: 'Cart saved successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/auth/activity
 * @desc    Save a user activity entry
 * @access  Private
 */
router.post('/activity', requireAuth, async (req, res) => {
  try {
    const { category = 'other', title, details = '', metadata = {} } = req.body || {};

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ success: false, message: 'Activity title is required' });
    }

    const activity = await PatientActivity.create({
      userId: req.user.id,
      category,
      title: title.trim(),
      details: typeof details === 'string' ? details.trim() : '',
      metadata: typeof metadata === 'object' && metadata !== null ? metadata : {},
    });

    return res.status(201).json({ success: true, activity });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/auth/activity
 * @desc    Get authenticated user's activities
 * @access  Private
 */
router.get('/activity', requireAuth, async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(200, Number.parseInt(String(req.query.limit || '50'), 10)));
    const category = req.query.category ? String(req.query.category) : null;

    const query = { userId: req.user.id };
    if (category) query.category = category;

    const activities = await PatientActivity.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.json({ success: true, activities });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
