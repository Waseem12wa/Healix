import cron from 'node-cron';
import Appointment from '../models/Appointment.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendAppointmentReminderEmail } from '../utils/emailService.js';

/**
 * Appointment Reminder Job
 * Runs every minute to check for appointments within the reminder window
 * Sends notifications and emails at appropriate times
 */
export function scheduleAppointmentReminderJob() {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const appointmentWindowStart = new Date(now.getTime() - 60 * 1000); // 1 minute ago
      const appointmentWindowEnd = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now

      // Find appointments that are approved and scheduled for upcoming times
      const appointments = await Appointment.find({
        status: 'approved',
        reminderSent: false,
      }).populate('patientId doctorId');

      for (const appointment of appointments) {
        try {
          // Parse appointment date and time
          const [day, month, year] = appointment.date.split('/').map(Number);
          const [hours, minutes] = appointment.time.split(':').map(Number);

          const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);

          // Check if appointment is within reminder window (within next 15 minutes)
          if (appointmentDateTime > appointmentWindowStart && appointmentDateTime <= appointmentWindowEnd) {
            console.log(
              `⏰ Appointment reminder triggered for ${appointment.patientName} - ${appointment.date} at ${appointment.time}`
            );

            // Create notification for patient
            const patientNotification = new Notification({
              userId: appointment.patientId,
              userEmail: appointment.patientEmail,
              type: 'appointment_reminder_patient',
              title: 'Appointment Reminder',
              message: `Your appointment with Dr. ${appointment.doctorName} is scheduled in 15 minutes (${appointment.date} at ${appointment.time}). ${
                appointment.consultationType === 'online' && appointment.meetingLink
                  ? `Meeting link: ${appointment.meetingLink}`
                  : appointment.consultationType === 'in-person' && appointment.appointmentLocationDetails
                    ? `Location: ${appointment.appointmentLocationDetails}`
                    : ''
              }`,
              appointmentId: appointment._id,
            });
            await patientNotification.save();

            // Create notification for doctor
            const doctorNotification = new Notification({
              userId: appointment.doctorId,
              userEmail: appointment.doctorEmail,
              type: 'appointment_reminder_doctor',
              title: 'Appointment Reminder',
              message: `You have an appointment with ${appointment.patientName} in 15 minutes (${appointment.date} at ${appointment.time}). ${
                appointment.consultationType === 'online' && appointment.meetingLink
                  ? `Meeting link: ${appointment.meetingLink}`
                  : appointment.consultationType === 'in-person' && appointment.appointmentLocationDetails
                    ? `Location: ${appointment.appointmentLocationDetails}`
                    : ''
              }`,
              appointmentId: appointment._id,
            });
            await doctorNotification.save();

            // Get patient's reminder email preference
            const patient = await User.findById(appointment.patientId);
            const reminderEmail = patient?.reminderEmail || appointment.patientEmail;

            // Send email to patient
            try {
              await sendAppointmentReminderEmail(
                reminderEmail,
                appointment.patientName,
                appointment.doctorName,
                appointment.date,
                appointment.time,
                appointment.consultationType,
                appointment.meetingLink,
                appointment.appointmentLocationDetails,
                appointment.doctorComments
              );
              console.log(`✅ Appointment reminder email sent to: ${reminderEmail}`);
            } catch (emailError) {
              console.error(
                `❌ Error sending appointment reminder email to ${reminderEmail}:`,
                emailError.message
              );
            }

            // Mark reminder as sent
            appointment.reminderSent = true;
            await appointment.save();

            console.log(
              `✅ Appointment reminder notifications sent for: ${appointment._id} (${appointment.patientName})`
            );
          }
        } catch (appointmentError) {
          console.error(
            `❌ Error processing appointment reminder for ${appointment._id}:`,
            appointmentError.message
          );
        }
      }
    } catch (error) {
      console.error('❌ Error in appointment reminder job:', error.message);
    }
  });

  console.log('⏰ Appointment reminder job scheduled (runs every minute)');
}
