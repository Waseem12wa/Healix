import express from 'express';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import MedicineReminder from '../models/MedicineReminder.js';
import PatientActivity from '../models/PatientActivity.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isSideEffectSignal = (activity) => {
  const text = `${activity.title || ''} ${activity.details || ''}`.toLowerCase();
  return /side effect|adverse/.test(text);
};

const isHealthSummarySignal = (activity) => {
  const text = `${activity.title || ''} ${activity.details || ''}`.toLowerCase();
  return /summary|record|upload|medical/.test(text);
};

const getPathFromActivity = (activity) => {
  const metadata = activity.metadata || {};
  if (typeof metadata.path === 'string') {
    return metadata.path;
  }
  const details = String(activity.details || '');
  const pathMatch = details.match(/\/(doctor|tools|shop)[^\s]*/i);
  return pathMatch ? pathMatch[0] : '';
};

const isModuleFromPath = (activity, matcher) => {
  const path = getPathFromActivity(activity).toLowerCase();
  return matcher(path);
};

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

/**
 * @route   GET /api/doctors/dashboard-live
 * @desc    Real-time doctor dashboard analytics
 * @access  Private (Doctor only)
 */
router.get('/dashboard-live', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can access dashboard analytics',
      });
    }

    const doctor = await User.findById(req.user.id).select('email userName doctorProfile');
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);

    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(now.getDate() + 7);

    const [appointments, doctorActivities, remindersCreated, pendingReminders] = await Promise.all([
      Appointment.find({ doctorEmail: req.user.email })
        .select('patientId patientName status createdAt updatedAt')
        .sort({ createdAt: -1 })
        .limit(5000),
      PatientActivity.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .limit(1000),
      MedicineReminder.countDocuments({ doctorEmail: req.user.email }),
      MedicineReminder.countDocuments({
        doctorEmail: req.user.email,
        sent: false,
        reminderDateTime: { $gte: now, $lte: sevenDaysLater },
      }),
    ]);

    const patientIdSet = new Set(
      appointments
        .map((a) => (a.patientId ? String(a.patientId) : ''))
        .filter(Boolean)
    );

    const patientIds = Array.from(patientIdSet);

    const patientActivities = patientIds.length > 0
      ? await PatientActivity.find({ userId: { $in: patientIds } })
          .sort({ createdAt: -1 })
          .limit(4000)
      : [];

    let approvedCount = 0;
    let rejectedCount = 0;
    let pendingCount = 0;

    appointments.forEach((appointment) => {
      if (appointment.status === 'approved') approvedCount += 1;
      else if (appointment.status === 'rejected') rejectedCount += 1;
      else if (appointment.status === 'pending') pendingCount += 1;
    });

    const moduleUsage = {
      ddi: 0,
      dfi: 0,
      sideEffects: 0,
      medicationShop: 0,
      healthSummary: 0,
      aiAssistant: 0,
      appointments: 0,
      reminders: 0,
      profileUpdates: 0,
      total: 0,
    };

    patientActivities.forEach((activity) => {
      const category = activity.category || 'other';
      moduleUsage.total += 1;

      if (category === 'drug-interaction') moduleUsage.ddi += 1;
      if (category === 'food-interaction') moduleUsage.dfi += 1;
      if (category === 'ai-assistant') moduleUsage.aiAssistant += 1;
      if (category === 'profile-update') moduleUsage.profileUpdates += 1;
      if (category === 'purchase' || category === 'cart-update') moduleUsage.medicationShop += 1;

      if (isSideEffectSignal(activity) || isModuleFromPath(activity, (path) => path.includes('/tools/side-effects'))) {
        moduleUsage.sideEffects += 1;
      }

      if (
        isHealthSummarySignal(activity) ||
        isModuleFromPath(activity, (path) => path.includes('/tools/health-summary'))
      ) {
        moduleUsage.healthSummary += 1;
      }

      if (isModuleFromPath(activity, (path) => path.includes('/tools/appointments'))) {
        moduleUsage.appointments += 1;
      }

      if (isModuleFromPath(activity, (path) => path.includes('/tools/medication-reminder'))) {
        moduleUsage.reminders += 1;
      }
    });

    const actionOutcomes = {
      approvals: approvedCount,
      rejections: rejectedCount,
      recommendationsGiven: remindersCreated,
      actionsTaken: doctorActivities.length,
    };

    const dayBuckets = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      dayBuckets.push({
        key: toDateKey(d),
        day: DAY_LABELS[d.getDay()],
        doctorActions: 0,
        patientRequests: 0,
        approvals: 0,
        rejections: 0,
      });
    }
    const dayIndex = new Map(dayBuckets.map((bucket, idx) => [bucket.key, idx]));

    doctorActivities.forEach((activity) => {
      if (!activity.createdAt) return;
      const date = new Date(activity.createdAt);
      if (date < weekAgo) return;

      const idx = dayIndex.get(toDateKey(date));
      if (idx === undefined) return;

      dayBuckets[idx].doctorActions += 1;
      const text = `${activity.title || ''} ${activity.details || ''}`.toLowerCase();
      if (/approve|approved/.test(text)) dayBuckets[idx].approvals += 1;
      if (/reject|rejected/.test(text)) dayBuckets[idx].rejections += 1;
    });

    patientActivities.forEach((activity) => {
      if (!activity.createdAt) return;
      const date = new Date(activity.createdAt);
      if (date < weekAgo) return;

      const idx = dayIndex.get(toDateKey(date));
      if (idx === undefined) return;

      dayBuckets[idx].patientRequests += 1;
    });

    const recentDoctorActions = doctorActivities.slice(0, 10).map((item) => ({
      id: String(item._id),
      title: item.title,
      details: item.details,
      category: item.category,
      createdAt: item.createdAt,
    }));

    const recentPatientSignals = patientActivities.slice(0, 10).map((item) => ({
      id: String(item._id),
      title: item.title,
      details: item.details,
      category: item.category,
      createdAt: item.createdAt,
    }));

    res.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        doctor: {
          email: doctor.email,
          name: doctor.doctorProfile?.fullName || doctor.userName || 'Doctor',
          specialization: doctor.doctorProfile?.specialization || '',
        },
        appointments: {
          total: appointments.length,
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
        },
        monitoring: {
          assignedPatients: patientIds.length,
          trackedPatientActivities: patientActivities.length,
          moduleUsage,
        },
        outcomes: actionOutcomes,
        reminders: {
          created: remindersCreated,
          upcomingNext7Days: pendingReminders,
        },
        trend7d: dayBuckets,
        recentDoctorActions,
        recentPatientSignals,
      },
    });
  } catch (error) {
    console.error('❌ Error generating doctor dashboard analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating dashboard analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * @route   GET /api/doctors/assigned-patients
 * @desc    Get patients assigned to authenticated doctor
 * @access  Private (Doctor only)
 */
router.get('/assigned-patients', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can access assigned patients',
      });
    }

    const doctor = await User.findById(req.user.id).select('_id');
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    const assignedPatients = await User.find({
      role: 'patient',
      'patientProfile.assignedDoctorId': doctor._id,
    })
      .select('email userName patientProfile.age patientProfile.gender patientProfile.mobileNumber patientProfile.bio')
      .sort({ updatedAt: -1, createdAt: -1 });

    const data = assignedPatients.map((patient) => ({
      id: String(patient._id),
      patientName: patient.userName || patient.email,
      email: patient.email,
      age: patient.patientProfile?.age ?? null,
      gender: patient.patientProfile?.gender || '',
      mobileNumber: patient.patientProfile?.mobileNumber || '',
      bio: patient.patientProfile?.bio || '',
    }));

    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error('❌ Error fetching assigned patients:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching assigned patients',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;

