import express from 'express';
import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import Notification from '../models/Notification.js';
import Prescription from '../models/Prescription.js';
import User from '../models/User.js';
import PatientActivity from '../models/PatientActivity.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const parseAppointmentDateTime = (appointment) => {
  const datePart = String(appointment.date || '').trim();
  const timePart = String(appointment.time || '').trim();
  if (!datePart || !timePart) return null;

  const normalizedTime = timePart.length === 5 ? `${timePart}:00` : timePart;
  const parsed = new Date(`${datePart}T${normalizedTime}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * @route   POST /api/appointments
 * @desc    Create a new appointment (Patient)
 * @access  Private
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    console.log('📅 Appointment creation request received');
    console.log('   Request body:', JSON.stringify(req.body));
    
    const { doctorId, date, time, consultationType, notes } = req.body;
    const patientEmail = req.user.email;

    if (!patientEmail || !doctorId || !date || !time) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: doctorId, date, time'
      });
    }

    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can create appointments'
      });
    }

    console.log('   Patient Email:', patientEmail);
    console.log('   Doctor ID:', doctorId);
    console.log('   Date:', date);
    console.log('   Time:', time);

    // Get patient info
    const patient = await User.findOne({ email: patientEmail.toLowerCase().trim(), role: 'patient' });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Get doctor info
    console.log('🔍 Searching for doctor with ID:', doctorId);
    console.log('   ID type:', typeof doctorId);
    console.log('   Is valid ObjectId?', mongoose.Types.ObjectId.isValid(doctorId));
    
    let doctor = null;
    
    // Try to find doctor by ID
    if (mongoose.Types.ObjectId.isValid(doctorId)) {
      try {
        // Try direct findById first
        doctor = await User.findById(doctorId);
        console.log('   Found by findById:', doctor ? 'Yes' : 'No');
        
        // If not found, try with role filter
        if (!doctor) {
          doctor = await User.findOne({ 
            _id: new mongoose.Types.ObjectId(doctorId), 
            role: 'doctor' 
          });
          console.log('   Found by ObjectId with role filter:', doctor ? 'Yes' : 'No');
        }
      } catch (error) {
        console.error('   Error finding doctor:', error.message);
      }
    } else {
      console.log('❌ Invalid ObjectId format:', doctorId);
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor ID format'
      });
    }
    
    if (!doctor) {
      console.log('❌ Doctor not found with ID:', doctorId);
      // Try to find any doctor to debug
      const allDoctors = await User.find({ role: 'doctor' }).select('_id email doctorProfile.profileCompleted');
      console.log('   Available doctors:', allDoctors.map(d => ({ 
        id: d._id.toString(), 
        email: d.email, 
        profileCompleted: d.doctorProfile?.profileCompleted 
      })));
      return res.status(404).json({
        success: false,
        message: 'Doctor not found. Please ensure the doctor has completed their profile.'
      });
    }
    
    if (doctor.role !== 'doctor') {
      console.log('❌ User is not a doctor:', doctor.role);
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor account'
      });
    }
    
    console.log('✅ Doctor found:', doctor.email);

    if (!doctor.doctorProfile?.profileCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Doctor profile is not completed'
      });
    }

    // Determine fee based on consultation type
    const fee = consultationType === 'online' 
      ? (doctor.doctorProfile.onlineFee || doctor.doctorProfile.inPersonFee)
      : doctor.doctorProfile.inPersonFee;

    // Create appointment
    const appointment = new Appointment({
      patientId: patient._id,
      patientEmail: patient.email,
      patientName: patient.userName || patient.email.split('@')[0],
      doctorId: doctor._id,
      doctorEmail: doctor.email,
      doctorName: doctor.doctorProfile.fullName || doctor.userName || doctor.email.split('@')[0],
      specialization: doctor.doctorProfile.specialization,
      date,
      time,
      location: `${doctor.doctorProfile.clinicName}, ${doctor.doctorProfile.city}`,
      consultationType: consultationType || 'in-person',
      fee,
      notes: notes || '',
      status: 'pending'
    });

    await appointment.save();

    try {
      await PatientActivity.create({
        userId: patient._id,
        category: 'other',
        title: 'Appointment request submitted',
        details: `Requested appointment with ${doctor.doctorProfile?.fullName || doctor.userName || 'doctor'} on ${date} at ${time}`,
        metadata: {
          appointmentId: String(appointment._id),
          doctorId: String(doctor._id),
          doctorEmail: doctor.email,
        },
      });
    } catch (activityError) {
      console.warn('Patient activity log failed for appointment request:', activityError.message);
    }

    // Create notification for doctor
    const doctorNotification = new Notification({
      userId: doctor._id,
      userEmail: doctor.email,
      type: 'appointment_request',
      title: 'New Appointment Request',
      message: `${patient.userName || patient.email} has requested an appointment on ${date} at ${time}`,
      appointmentId: appointment._id
    });
    await doctorNotification.save();

    console.log(`✅ Appointment created: ${appointment._id}`);
    console.log(`📧 Notification sent to doctor: ${doctor.email}`);

    res.json({
      success: true,
      message: 'Appointment requested successfully. Waiting for doctor approval.',
      data: appointment
    });
  } catch (error) {
    console.error('❌ Error creating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating appointment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/appointments/patient
 * @desc    Get appointments for a patient
 * @access  Private
 */
router.get('/patient', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ success: false, message: 'Only patients can access this endpoint' });
    }

    const patient = await User.findById(req.user.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const appointments = await Appointment.find({ patientId: patient._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('❌ Error fetching patient appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/appointments/doctor
 * @desc    Get appointments for a doctor
 * @access  Private
 */
router.get('/doctor', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Only doctors can access this endpoint' });
    }

    const doctor = await User.findById(req.user.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const appointments = await Appointment.find({ doctorId: doctor._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('❌ Error fetching doctor appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/appointments/:id/status
 * @desc    Update appointment status (Doctor: approve/reject)
 * @access  Private
 */
router.put('/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, doctorComments, meetingLink, appointmentLocationDetails } = req.body;
    const doctorEmail = req.user.email;

    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can update appointment status'
      });
    }

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "approved" or "rejected"'
      });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify doctor owns this appointment
    if (appointment.doctorEmail.toLowerCase() !== doctorEmail.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only update your own appointments'
      });
    }

    if (status === 'approved') {
      const normalizedMeetingLink = String(meetingLink || '').trim();
      const normalizedLocationDetails = String(appointmentLocationDetails || '').trim();

      if (appointment.consultationType === 'online' && !normalizedMeetingLink) {
        return res.status(400).json({
          success: false,
          message: 'Meeting link is required to approve online appointments'
        });
      }

      if (appointment.consultationType === 'in-person' && !normalizedLocationDetails) {
        return res.status(400).json({
          success: false,
          message: 'Location details are required to approve in-person appointments'
        });
      }

      appointment.meetingLink = normalizedMeetingLink;
      appointment.appointmentLocationDetails = normalizedLocationDetails;
      appointment.doctorComments = String(doctorComments || '').trim();
    }

    // Update appointment status
    appointment.status = status;
    await appointment.save();

    // Get patient info for notification
    const patient = await User.findById(appointment.patientId);

    // Create notification for patient
    const notificationType = status === 'approved' ? 'appointment_approved' : 'appointment_rejected';
    const notificationTitle = status === 'approved' 
      ? 'Appointment Approved'
      : 'Appointment Rejected';
    const notificationMessage = status === 'approved'
      ? `Your appointment with ${appointment.doctorName} on ${appointment.date} at ${appointment.time} has been approved.`
      : `Your appointment with ${appointment.doctorName} on ${appointment.date} at ${appointment.time} has been rejected.`;

    const patientNotification = new Notification({
      userId: appointment.patientId,
      userEmail: appointment.patientEmail,
      type: notificationType,
      title: notificationTitle,
      message: notificationMessage,
      appointmentId: appointment._id
    });
    await patientNotification.save();

    try {
      await PatientActivity.create({
        userId: req.user.id,
        category: 'other',
        title: `${status === 'approved' ? 'Approved' : 'Rejected'} appointment request`,
        details: `${status === 'approved' ? 'Approved' : 'Rejected'} appointment for ${appointment.patientName} on ${appointment.date} at ${appointment.time}`,
        metadata: {
          appointmentId: String(appointment._id),
          patientId: String(appointment.patientId),
          patientEmail: appointment.patientEmail,
          status,
        },
      });
    } catch (activityError) {
      console.warn('Doctor activity log failed for appointment decision:', activityError.message);
    }

    try {
      await PatientActivity.create({
        userId: appointment.patientId,
        category: 'other',
        title: `Appointment ${status}`,
        details: `Your appointment with ${appointment.doctorName} on ${appointment.date} at ${appointment.time} was ${status}`,
        metadata: {
          appointmentId: String(appointment._id),
          doctorEmail: appointment.doctorEmail,
          status,
        },
      });
    } catch (activityError) {
      console.warn('Patient activity log failed for appointment outcome:', activityError.message);
    }

    console.log(`✅ Appointment ${status}: ${appointment._id}`);
    console.log(`📧 Notification sent to patient: ${appointment.patientEmail}`);

    res.json({
      success: true,
      message: `Appointment ${status} successfully`,
      data: appointment
    });
  } catch (error) {
    console.error('❌ Error updating appointment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating appointment status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   DELETE /api/appointments/:id
 * @desc    Cancel/delete an appointment
 * @access  Private
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user.email;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify user owns this appointment (patient or doctor)
    const isOwner = appointment.patientEmail.toLowerCase() === userEmail.toLowerCase() ||
                    appointment.doctorEmail.toLowerCase() === userEmail.toLowerCase();

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only cancel your own appointments'
      });
    }

    // Create cancellation notification for the other party
    const otherPartyEmail = appointment.patientEmail.toLowerCase() === userEmail.toLowerCase()
      ? appointment.doctorEmail
      : appointment.patientEmail;
    
    const otherParty = await User.findOne({ email: otherPartyEmail });
    if (otherParty) {
      const cancelNotification = new Notification({
        userId: otherParty._id,
        userEmail: otherPartyEmail,
        type: 'appointment_cancelled',
        title: 'Appointment Cancelled',
        message: `Appointment on ${appointment.date} at ${appointment.time} has been cancelled.`,
        appointmentId: appointment._id
      });
      await cancelNotification.save();
    }

    await Appointment.findByIdAndDelete(id);

    console.log(`✅ Appointment cancelled: ${id}`);

    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    console.error('❌ Error cancelling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling appointment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/appointments/:id/details
 * @desc    Add/update appointment details by doctor (meeting link, location, comments)
 * @access  Private
 */
router.put('/:id/details', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { doctorComments, meetingLink, appointmentLocationDetails } = req.body;
    const doctorEmail = req.user.email;

    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can update appointment details'
      });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify doctor owns this appointment
    if (appointment.doctorEmail.toLowerCase() !== doctorEmail.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only update your own appointments'
      });
    }

    // Verify appointment is approved before adding details
    if (appointment.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Appointment must be approved before adding details'
      });
    }

    // Update fields
    if (doctorComments !== undefined) appointment.doctorComments = doctorComments;
    if (meetingLink !== undefined) appointment.meetingLink = meetingLink;
    if (appointmentLocationDetails !== undefined) appointment.appointmentLocationDetails = appointmentLocationDetails;

    await appointment.save();

    // Create notification for patient about the details
    const notificationMessage = appointment.consultationType === 'online'
      ? `Your doctor has shared a meeting link for your appointment on ${appointment.date} at ${appointment.time}`
      : `Your doctor has provided location details for your appointment on ${appointment.date} at ${appointment.time}`;

    const patientNotification = new Notification({
      userId: appointment.patientId,
      userEmail: appointment.patientEmail,
      type: 'appointment_details_shared',
      title: 'Appointment Details Shared',
      message: notificationMessage,
      appointmentId: appointment._id
    });
    await patientNotification.save();

    console.log(`✅ Appointment details updated: ${appointment._id}`);
    console.log(`📧 Notification sent to patient: ${appointment.patientEmail}`);

    res.json({
      success: true,
      message: 'Appointment details updated successfully',
      data: appointment
    });
  } catch (error) {
    console.error('❌ Error updating appointment details:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating appointment details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/appointments/:id/complete
 * @desc    Mark an approved appointment as completed (Doctor)
 * @access  Private
 */
router.put('/:id/complete', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const doctorEmail = req.user.email;

    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can complete appointments'
      });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.doctorEmail.toLowerCase() !== doctorEmail.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only update your own appointments'
      });
    }

    if (appointment.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved appointments can be marked as completed'
      });
    }

    const appointmentDateTime = parseAppointmentDateTime(appointment);
    if (appointmentDateTime && appointmentDateTime.getTime() > Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Appointment can only be completed after its scheduled time'
      });
    }

    appointment.status = 'completed';
    appointment.completedAt = new Date();
    await appointment.save();

    await Notification.create({
      userId: appointment.patientId,
      userEmail: appointment.patientEmail,
      type: 'appointment_approved',
      title: 'Appointment Marked Completed',
      message: `${appointment.doctorName} marked your appointment on ${appointment.date} at ${appointment.time} as completed.`,
      appointmentId: appointment._id,
      read: false
    });

    try {
      await PatientActivity.create({
        userId: req.user.id,
        category: 'other',
        title: 'Completed appointment',
        details: `Marked appointment for ${appointment.patientName} as completed`,
        metadata: {
          appointmentId: String(appointment._id),
          patientId: String(appointment.patientId),
          patientEmail: appointment.patientEmail,
        },
      });
    } catch (activityError) {
      console.warn('Doctor activity log failed for appointment completion:', activityError.message);
    }

    return res.json({
      success: true,
      message: 'Appointment marked as completed',
      data: appointment
    });
  } catch (error) {
    console.error('❌ Error completing appointment:', error);
    return res.status(500).json({
      success: false,
      message: 'Error completing appointment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/appointments/:id/prescription
 * @desc    Save digital prescription for a completed appointment (Doctor)
 * @access  Private
 */
router.post('/:id/prescription', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const doctorEmail = req.user.email;
    const { conditionDescription, medicines } = req.body;

    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can add prescriptions'
      });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.doctorEmail.toLowerCase() !== doctorEmail.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only add prescriptions for your own appointments'
      });
    }

    if (appointment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Prescription can only be added after appointment is completed'
      });
    }

    const normalizedCondition = String(conditionDescription || '').trim();
    const normalizedMedicines = Array.isArray(medicines)
      ? medicines
        .map((item) => ({
          name: String(item?.name || '').trim(),
          dosage: String(item?.dosage || '').trim(),
          instructions: String(item?.instructions || '').trim(),
        }))
        .filter((item) => item.name)
      : [];

    if (!normalizedCondition) {
      return res.status(400).json({
        success: false,
        message: 'Condition description is required'
      });
    }

    if (normalizedMedicines.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one prescribed medicine is required'
      });
    }

    const prescription = await Prescription.create({
      appointmentId: appointment._id,
      patientId: appointment.patientId,
      patientEmail: appointment.patientEmail,
      doctorId: appointment.doctorId,
      doctorEmail: appointment.doctorEmail,
      conditionDescription: normalizedCondition,
      medicines: normalizedMedicines,
    });

    await Notification.create({
      userId: appointment.patientId,
      userEmail: appointment.patientEmail,
      type: 'prescription_added',
      title: 'New Digital Prescription',
      message: `${appointment.doctorName} added your digital prescription with ${normalizedMedicines.length} medicine(s).`,
      appointmentId: appointment._id,
      read: false
    });

    return res.status(201).json({
      success: true,
      message: 'Prescription saved successfully',
      data: prescription
    });
  } catch (error) {
    console.error('❌ Error saving prescription:', error);
    return res.status(500).json({
      success: false,
      message: 'Error saving prescription',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;

