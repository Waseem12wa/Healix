import express from 'express';
import User from '../models/User.js';

const router = express.Router();

/**
 * @route   GET /api/doctors/profile
 * @desc    Get doctor's own profile
 * @access  Private (Doctor only)
 */
router.get('/profile', async (req, res) => {
  try {
    // Get email from query or body (in real app, use JWT token)
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim(), role: 'doctor' });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      data: {
        email: user.email,
        userName: user.userName,
        profile: user.doctorProfile || {},
        profileCompleted: user.doctorProfile?.profileCompleted || false
      }
    });
  } catch (error) {
    console.error('❌ Error fetching doctor profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/doctors/profile
 * @desc    Update doctor's profile
 * @access  Private (Doctor only)
 */
router.put('/profile', async (req, res) => {
  try {
    const { email, profile } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim(), role: 'doctor' });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Validate required fields
    const requiredFields = [
      'fullName',
      'phoneNumber',
      'gender',
      'specialization',
      'education',
      'pmdcNumber',
      'yearsOfExperience',
      'professionalBio',
      'languagesSpoken',
      'clinicName',
      'clinicAddress',
      'city',
      'workingDays',
      'startTime',
      'endTime',
      'slotDuration',
      'inPersonFee'
    ];

    const missingFields = requiredFields.filter(field => !profile[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields
      });
    }

    // Update doctor profile
    user.doctorProfile = {
      ...profile,
      profileCompleted: true // Mark as completed when saved
    };

    await user.save();

    console.log(`✅ Doctor profile updated for: ${user.email}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        email: user.email,
        profile: user.doctorProfile,
        profileCompleted: true
      }
    });
  } catch (error) {
    console.error('❌ Error updating doctor profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating doctor profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/doctors/search
 * @desc    Search for doctors (only returns doctors with completed profiles)
 * @access  Public (for patients)
 */
router.get('/search', async (req, res) => {
  try {
    const { specialization, city, name } = req.query;

    // Build query - only doctors with completed profiles
    const query = {
      role: 'doctor',
      'doctorProfile.profileCompleted': true
    };

    // Add filters if provided
    if (specialization) {
      query['doctorProfile.specialization'] = new RegExp(specialization, 'i');
    }

    if (city) {
      query['doctorProfile.city'] = new RegExp(city, 'i');
    }

    if (name) {
      query['doctorProfile.fullName'] = new RegExp(name, 'i');
    }

    const doctors = await User.find(query)
      .select('email userName doctorProfile')
      .sort({ 'doctorProfile.fullName': 1 });

    // Format response for patient view
    const formattedDoctors = doctors.map(doctor => ({
      id: doctor._id.toString(), // Convert ObjectId to string
      email: doctor.email,
      name: doctor.doctorProfile?.fullName || doctor.userName,
      specialization: doctor.doctorProfile?.specialization || 'Not specified',
      subSpecialization: doctor.doctorProfile?.subSpecialization,
      experience: doctor.doctorProfile?.yearsOfExperience || 0,
      inPersonFee: doctor.doctorProfile?.inPersonFee || 0,
      onlineFee: doctor.doctorProfile?.onlineFee,
      city: doctor.doctorProfile?.city || 'Not specified',
      clinicName: doctor.doctorProfile?.clinicName || 'Not specified',
      availability: {
        workingDays: doctor.doctorProfile?.workingDays || [],
        startTime: doctor.doctorProfile?.startTime || '',
        endTime: doctor.doctorProfile?.endTime || '',
        slotDuration: doctor.doctorProfile?.slotDuration || 30
      },
      languages: doctor.doctorProfile?.languagesSpoken || [],
      bio: doctor.doctorProfile?.professionalBio || ''
    }));

    res.json({
      success: true,
      count: formattedDoctors.length,
      data: formattedDoctors
    });
  } catch (error) {
    console.error('❌ Error searching doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching doctors',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;

