import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { validatePassword, validateEmail, validateRole, validateUserName } from '../utils/validation.js';

const router = express.Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post('/signup', async (req, res) => {
  try {
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
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
        userName: user.userName,
        createdAt: user.createdAt
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
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
        userName: userName,
        createdAt: user.createdAt
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

export default router;
