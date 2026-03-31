import express from 'express';
import mongoose from 'mongoose';
import MedicineReminder from '../models/MedicineReminder.js';
import Prescription from '../models/Prescription.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/reminders/approved-patients
 * @desc    Get list of patients assigned to the logged-in doctor
 * @access  Private (Doctor only)
 * 
 * Access Control: Only returns patients assigned to this doctor
 */
router.get('/approved-patients', requireAuth, async (req, res) => {
    try {
        const doctorEmail = req.user?.email || req.query.doctorEmail || req.headers['x-doctor-email'];

        if (req.user?.role !== 'doctor') {
            return res.status(403).json({
                success: false,
                message: 'Only doctors can access assigned patients'
            });
        }

        if (!doctorEmail) {
            return res.status(400).json({
                success: false,
                message: 'Doctor email is required'
            });
        }

        console.log('\n👨‍⚕️ Fetching assigned patients for doctor:', doctorEmail);

        // Get the doctor's ID from email
        const doctor = await User.findOne({ 
            email: { $regex: `^${doctorEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } 
        }).select('_id');

        if (!doctor) {
            console.log('   ❌ Doctor not found');
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        console.log(`   ℹ️  Doctor ID: ${doctor._id}`);

        // Find all patients assigned to this doctor
        const assignedPatients = await User.find({
            role: 'patient',
            'patientProfile.assignedDoctorId': doctor._id
        }).select('email userName reminderEmail patientProfile._id');

        console.log(`   ✅ Found ${assignedPatients.length} patient(s) assigned to this doctor`);

        const patientList = assignedPatients.map(patient => ({
            patientId: patient._id,
            patientEmail: patient.email,
            patientName: patient.userName || 'Patient',
            reminderEmail: patient.reminderEmail || null
        }));

        res.json({
            success: true,
            data: patientList
        });

    } catch (error) {
        console.error('❌ Error fetching assigned patients:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch assigned patients',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   POST /api/reminders/create
 * @desc    Create medicine reminders for a patient
 * @access  Private (Doctor only)
 * 
 * Creates individual reminder documents for each scheduled time
 */
router.post('/create', requireAuth, async (req, res) => {
    try {
        const {
            doctorName,
            patientId,
            patientName,
            medicineName,
            dose,
            frequency,
            times, // Array of time strings ["09:00", "14:00", "21:00"]
            startDate, // Format: YYYY-MM-DD
            duration // Number of days
        } = req.body;

        if (req.user?.role !== 'doctor') {
            return res.status(403).json({
                success: false,
                message: 'Only doctors can create reminders'
            });
        }

        const doctorEmail = req.user?.email;

        console.log('\n💊 Creating medicine reminders:');
        console.log('   Doctor:', doctorName, '(' + doctorEmail + ')');
        console.log('   Patient ID:', patientId);
        console.log('   Medicine:', medicineName, '-', dose);
        console.log('   Frequency:', frequency, 'times/day');
        console.log('   Duration:', duration, 'days');
        console.log('   Times:', times);

        // Validation - appointmentId is now optional
        if (!doctorEmail || !patientId || !medicineName || !dose || !frequency || !times || !startDate || !duration) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        if (!Array.isArray(times) || times.length !== frequency) {
            return res.status(400).json({
                success: false,
                message: `Number of times must match frequency (${frequency})`
            });
        }

        // Get doctor's ID
        const doctor = await User.findOne({ 
            email: { $regex: `^${doctorEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } 
        }).select('_id userName');

        if (!doctor) {
            console.log('   ❌ Doctor not found');
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        // Verify patient is assigned to this doctor
        const patient = await User.findOne({
            _id: patientId,
            role: 'patient',
            'patientProfile.assignedDoctorId': doctor._id
        }).select('email userName reminderEmail');

        if (!patient) {
            console.log('   ❌ Access denied: Patient is not assigned to this doctor');
            return res.status(403).json({
                success: false,
                message: 'Access denied: Patient is not assigned to this doctor'
            });
        }

        console.log('   ✅ Patient verified as assigned to this doctor');

        // Get doctor details if not provided
        let finalDoctorName = doctorName;
        if (!finalDoctorName) {
            finalDoctorName = doctor.userName || 'Doctor';
        }

        const finalPatientName = patientName || patient.userName || 'Patient';
        const reminderRecipientEmail = patient.reminderEmail || patient.email;

        // Generate reminder documents
        const reminders = [];
        const start = new Date(startDate);

        for (let day = 0; day < duration; day++) {
            const currentDate = new Date(start);
            currentDate.setDate(start.getDate() + day);

            for (const timeStr of times) {
                const [hours, minutes] = timeStr.split(':').map(Number);
                const reminderDateTime = new Date(currentDate);
                reminderDateTime.setHours(hours, minutes, 0, 0);

                // Only create reminders for future times
                if (reminderDateTime > new Date()) {
                    reminders.push({
                        doctorId: doctor._id,
                        doctorEmail: doctorEmail,
                        doctorName: finalDoctorName,
                        patientId: patientId,
                        patientEmail: patient.email,
                        reminderRecipientEmail: reminderRecipientEmail,
                        patientName: finalPatientName,
                        medicineName: medicineName,
                        dose: dose,
                        frequency: frequency,
                        reminderDateTime: reminderDateTime,
                        startDate: startDate,
                        duration: duration,
                        timeOfDay: timeStr,
                        sent: false
                    });
                }
            }
        }

        if (reminders.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No future reminder times found. Please select future dates/times.'
            });
        }

        // Insert all reminders
        const result = await MedicineReminder.insertMany(reminders);

        console.log(`   ✅ Created ${result.length} reminder documents`);

        // Create notification for patient
        try {
            if (patient) {
                await Notification.create({
                    userId: patientId,
                    userEmail: patient.email,
                    type: 'medication_reminder_set',
                    title: 'New Medication Reminder',
                    message: `Dr. ${finalDoctorName} has set up reminders for ${medicineName} (${dose}). You will receive ${result.length} reminders starting from ${startDate}.`,
                    read: false
                });
                console.log(`   📧 Notification sent to patient: ${patient.email}`);
            }
        } catch (notificationError) {
            console.warn('   ⚠️  Failed to create notification:', notificationError.message);
            // Don't fail the reminder creation if notification fails
        }

        res.json({
            success: true,
            message: `Successfully created ${result.length} reminders`,
            data: {
                count: result.length,
                reminders: result
            }
        });

    } catch (error) {
        console.error('❌ Error creating reminders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create reminders',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   GET /api/reminders/patient/:patientId
 * @desc    Get all reminders for a specific patient
 * @access  Private (Doctor only)
 */
router.get('/patient/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        const doctorEmail = req.query.doctorEmail || req.headers['x-doctor-email'];

        if (!doctorEmail) {
            return res.status(400).json({
                success: false,
                message: 'Doctor email is required'
            });
        }

        // Only return reminders created by this doctor
        const reminders = await MedicineReminder.find({
            patientId: patientId,
            doctorEmail: doctorEmail
        }).sort({ reminderDateTime: 1 });

        res.json({
            success: true,
            data: reminders
        });

    } catch (error) {
        console.error('❌ Error fetching patient reminders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reminders',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   GET /api/reminders/upcoming
 * @desc    Get upcoming reminders for all patients of this doctor
 * @access  Private (Doctor only)
 */
router.get('/upcoming', async (req, res) => {
    try {
        const doctorEmail = req.query.doctorEmail || req.headers['x-doctor-email'];

        if (!doctorEmail) {
            return res.status(400).json({
                success: false,
                message: 'Doctor email is required'
            });
        }

        const now = new Date();
        const reminders = await MedicineReminder.find({
            doctorEmail: doctorEmail,
            sent: false,
            reminderDateTime: { $gt: now }
        })
            .sort({ reminderDateTime: 1 })
            .limit(10);

        res.json({
            success: true,
            data: reminders
        });

    } catch (error) {
        console.error('❌ Error fetching upcoming reminders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch upcoming reminders',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   GET /api/reminders/all
 * @desc    Get all reminders created by this doctor (for debugging/admin)
 * @access  Private (Doctor only)
 */
router.get('/all', async (req, res) => {
    try {
        const doctorEmail = req.query.doctorEmail || req.headers['x-doctor-email'];

        if (!doctorEmail) {
            return res.status(400).json({
                success: false,
                message: 'Doctor email is required'
            });
        }

        const reminders = await MedicineReminder.find({
            doctorEmail: doctorEmail
        }).sort({ reminderDateTime: -1 });

        res.json({
            success: true,
            data: reminders
        });

    } catch (error) {
        console.error('❌ Error fetching all reminders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reminders',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   POST /api/reminders/patient-email-preference
 * @desc    Save patient's reminder email preference
 * @access  Private (Patient only)
 */
router.post('/patient-email-preference', requireAuth, async (req, res) => {
    try {
        const { reminderEmail } = req.body;
        const patientEmail = req.user?.email || req.body.patientEmail;

        if (req.user?.role !== 'patient') {
            return res.status(403).json({
                success: false,
                message: 'Only patients can set reminder email preference'
            });
        }

        if (!patientEmail || !reminderEmail) {
            return res.status(400).json({
                success: false,
                message: 'Patient email and reminder email are required'
            });
        }

        // Update or create user's reminder email preference
        const user = await User.findOneAndUpdate(
            { email: patientEmail },
            { reminderEmail: reminderEmail },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        console.log(`\n✅ Patient ${patientEmail} set reminder email to: ${reminderEmail}`);

        // Keep pending reminders aligned with latest patient preference.
        await MedicineReminder.updateMany(
            {
                patientEmail: patientEmail,
                sent: false,
                $or: [
                    { reminderRecipientEmail: { $exists: false } },
                    { reminderRecipientEmail: null },
                    { reminderRecipientEmail: '' }
                ]
            },
            {
                $set: {
                    reminderRecipientEmail: reminderEmail,
                    updatedAt: new Date()
                }
            }
        );

        res.json({
            success: true,
            message: 'Email preference saved successfully',
            data: { reminderEmail: user.reminderEmail }
        });
    } catch (error) {
        console.error('❌ Error saving email preference:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save email preference',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   GET /api/reminders/patient-email-preference
 * @desc    Get patient's reminder email preference
 * @access  Private (Patient only)
 */
router.get('/patient-email-preference', requireAuth, async (req, res) => {
    try {
        const patientEmail = req.user?.email || req.query.patientEmail || req.headers['x-patient-email'];

        if (req.user?.role !== 'patient') {
            return res.status(403).json({
                success: false,
                message: 'Only patients can access reminder email preference'
            });
        }

        if (!patientEmail) {
            return res.status(400).json({
                success: false,
                message: 'Patient email is required'
            });
        }

        const user = await User.findOne({ email: patientEmail }).select('reminderEmail');

        res.json({
            success: true,
            data: {
                reminderEmail: user?.reminderEmail || null,
                isSet: !!user?.reminderEmail
            }
        });
    } catch (error) {
        console.error('❌ Error fetching email preference:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch email preference',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   GET /api/reminders/patient-reminders
 * @desc    Get all reminders set by doctors for a patient
 * @access  Private (Patient only)
 */
router.get('/patient-reminders', requireAuth, async (req, res) => {
    try {
        const patientEmail = req.user?.email || req.query.patientEmail || req.headers['x-patient-email'];

        if (req.user?.role !== 'patient') {
            return res.status(403).json({
                success: false,
                message: 'Only patients can access reminders'
            });
        }

        if (!patientEmail) {
            return res.status(400).json({
                success: false,
                message: 'Patient email is required'
            });
        }

        // Get active future reminders for this patient, grouped by reminder set
        const reminders = await MedicineReminder.aggregate([
            {
                $match: {
                    patientEmail: patientEmail,
                    sent: false,
                    reminderDateTime: { $gte: new Date() }
                }
            },
            {
                $group: {
                    _id: {
                        medicineName: '$medicineName',
                        dose: '$dose',
                        frequency: '$frequency',
                        doctorEmail: '$doctorEmail',
                        startDate: '$startDate',
                        duration: '$duration'
                    },
                    medicine: { $first: '$medicineName' },
                    dose: { $first: '$dose' },
                    frequency: { $first: '$frequency' },
                    doctorName: { $first: '$doctorName' },
                    doctorEmail: { $first: '$doctorEmail' },
                    startDate: { $first: '$startDate' },
                    duration: { $first: '$duration' },
                    reminderCount: { $sum: 1 },
                    firstReminder: { $min: '$reminderDateTime' },
                    lastReminder: { $max: '$reminderDateTime' }
                }
            },
            {
                $addFields: {
                    _id: {
                        $concat: [
                            '$doctorEmail',
                            '|',
                            '$medicine',
                            '|',
                            '$dose',
                            '|',
                            '$startDate',
                            '|',
                            { $toString: '$duration' },
                            '|',
                            { $toString: '$frequency' }
                        ]
                    }
                }
            },
            {
                $sort: { firstReminder: 1 }
            }
        ]);

        res.json({
            success: true,
            data: reminders
        });
    } catch (error) {
        console.error('❌ Error fetching patient reminders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reminders',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   GET /api/reminders/patient-medicine-history
 * @desc    Get unique medicine names from the logged-in patient's prescription history
 * @access  Private (Patient only)
 */
router.get('/patient-medicine-history', requireAuth, async (req, res) => {
    try {
        if (req.user?.role !== 'patient') {
            return res.status(403).json({
                success: false,
                message: 'Only patients can access medicine history'
            });
        }

        const patientId = req.user?.id;
        const patientObjectId = new mongoose.Types.ObjectId(patientId);
        const medicines = await Prescription.aggregate([
            { $match: { patientId: patientObjectId } },
            { $unwind: '$medicines' },
            { $group: { _id: { $toLower: '$medicines.name' }, medicineName: { $first: '$medicines.name' } } },
            { $project: { _id: 0, medicineName: 1 } },
            { $sort: { medicineName: 1 } }
        ]);

        return res.json({
            success: true,
            data: medicines.map((item) => item.medicineName).filter(Boolean)
        });
    } catch (error) {
        console.error('❌ Error fetching patient medicine history:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch medicine history',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   GET /api/reminders/patient-medicine-history/:patientId
 * @desc    Get unique medicine names from prescription history of a doctor-assigned patient
 * @access  Private (Doctor only)
 */
router.get('/patient-medicine-history/:patientId', requireAuth, async (req, res) => {
    try {
        if (req.user?.role !== 'doctor') {
            return res.status(403).json({
                success: false,
                message: 'Only doctors can access patient medicine history'
            });
        }

        const { patientId } = req.params;

        const doctor = await User.findOne({
            email: { $regex: `^${req.user.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
            role: 'doctor'
        }).select('_id');

        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        const patient = await User.findOne({
            _id: patientId,
            role: 'patient',
            'patientProfile.assignedDoctorId': doctor._id
        }).select('_id');

        if (!patient) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Patient is not assigned to this doctor'
            });
        }

        const medicines = await Prescription.aggregate([
            { $match: { patientId: patient._id } },
            { $unwind: '$medicines' },
            { $group: { _id: { $toLower: '$medicines.name' }, medicineName: { $first: '$medicines.name' } } },
            { $project: { _id: 0, medicineName: 1 } },
            { $sort: { medicineName: 1 } }
        ]);

        return res.json({
            success: true,
            data: medicines.map((item) => item.medicineName).filter(Boolean)
        });
    } catch (error) {
        console.error('❌ Error fetching doctor patient medicine history:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch patient medicine history',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   DELETE /api/reminders/patient-reminders
 * @desc    Delete an active reminder set for the logged-in patient
 * @access  Private (Patient only)
 */
router.delete('/patient-reminders', requireAuth, async (req, res) => {
    try {
        if (req.user?.role !== 'patient') {
            return res.status(403).json({
                success: false,
                message: 'Only patients can delete reminders'
            });
        }

        const patientEmail = req.user?.email;
        const { medicineName, dose, doctorEmail, startDate, duration, frequency } = req.body;

        if (!patientEmail || !medicineName || !dose || !doctorEmail || !startDate || !duration || !frequency) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields to delete reminder set'
            });
        }

        const deletionResult = await MedicineReminder.deleteMany({
            patientEmail,
            medicineName,
            dose,
            doctorEmail,
            startDate,
            duration,
            frequency,
            sent: false,
            reminderDateTime: { $gte: new Date() }
        });

        return res.json({
            success: true,
            message: deletionResult.deletedCount > 0
                ? `Deleted ${deletionResult.deletedCount} reminder(s)`
                : 'No active reminders found to delete',
            data: {
                deletedCount: deletionResult.deletedCount
            }
        });
    } catch (error) {
        console.error('❌ Error deleting patient reminder set:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete reminder set',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default router;
