import express from 'express';
import MedicineReminder from '../models/MedicineReminder.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * @route   GET /api/reminders/approved-patients
 * @desc    Get list of patients with approved appointments for the logged-in doctor
 * @access  Private (Doctor only)
 * 
 * Access Control: Only returns patients who have approved appointments with this doctor
 */
router.get('/approved-patients', async (req, res) => {
    try {
        const doctorEmail = req.query.doctorEmail || req.headers['x-doctor-email'];

        if (!doctorEmail) {
            return res.status(400).json({
                success: false,
                message: 'Doctor email is required'
            });
        }

        console.log('\n📋 Fetching approved patients for doctor:', doctorEmail);

        // Find all approved appointments for this doctor
        const approvedAppointments = await Appointment.find({
            doctorEmail: doctorEmail,
            status: 'approved'
        }).select('patientId patientEmail patientName _id');

        // Remove duplicate patients (same patient may have multiple appointments)
        const uniquePatients = [];
        const seenPatientIds = new Set();

        for (const apt of approvedAppointments) {
            const patientIdStr = apt.patientId.toString();
            if (!seenPatientIds.has(patientIdStr)) {
                seenPatientIds.add(patientIdStr);
                uniquePatients.push({
                    patientId: apt.patientId,
                    patientEmail: apt.patientEmail,
                    patientName: apt.patientName,
                    appointmentId: apt._id // Include for reference
                });
            }
        }

        console.log(`   ✅ Found ${uniquePatients.length} unique approved patients`);

        res.json({
            success: true,
            data: uniquePatients
        });

    } catch (error) {
        console.error('❌ Error fetching approved patients:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch approved patients',
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
router.post('/create', async (req, res) => {
    try {
        const {
            doctorEmail,
            doctorName,
            patientId,
            patientEmail,
            patientName,
            appointmentId,
            medicineName,
            dose,
            frequency,
            times, // Array of time strings ["09:00", "14:00", "21:00"]
            startDate, // Format: YYYY-MM-DD
            duration // Number of days
        } = req.body;

        console.log('\n💊 Creating medicine reminders:');
        console.log('   Doctor:', doctorName, '(' + doctorEmail + ')');
        console.log('   Patient:', patientName, '(' + patientEmail + ')');
        console.log('   Medicine:', medicineName, '-', dose);
        console.log('   Frequency:', frequency, 'times/day');
        console.log('   Duration:', duration, 'days');
        console.log('   Times:', times);

        // Validation
        if (!doctorEmail || !patientId || !appointmentId || !medicineName || !dose || !frequency || !times || !startDate || !duration) {
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

        // Verify appointment exists and is approved for this doctor
        const appointment = await Appointment.findOne({
            _id: appointmentId,
            doctorEmail: doctorEmail,
            patientId: patientId,
            status: 'approved'
        });

        if (!appointment) {
            console.log('   ❌ Access denied: No approved appointment found');
            return res.status(403).json({
                success: false,
                message: 'Access denied: No approved appointment found for this patient'
            });
        }

        console.log('   ✅ Appointment verified');

        // Get doctor details if not provided
        let finalDoctorName = doctorName;
        if (!finalDoctorName) {
            const doctor = await User.findOne({ email: doctorEmail });
            finalDoctorName = doctor?.userName || 'Doctor';
        }

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
                        doctorId: appointment.doctorId,
                        doctorEmail: doctorEmail,
                        doctorName: finalDoctorName,
                        patientId: patientId,
                        patientEmail: patientEmail,
                        patientName: patientName,
                        appointmentId: appointmentId,
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

export default router;
