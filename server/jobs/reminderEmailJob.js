import MedicineReminder from '../models/MedicineReminder.js';
import { sendMedicineReminderEmail } from '../utils/emailService.js';

/**
 * Background job to send medicine reminder emails
 * 
 * This job runs every minute via node-cron.
 * It finds all due reminders (sent=false and reminderDateTime <= now)
 * and sends email to each patient.
 */
export const reminderEmailJob = async () => {
    try {
        const now = new Date();

        // Find all due reminders that haven't been sent yet
        const dueReminders = await MedicineReminder.find({
            sent: false,
            reminderDateTime: { $lte: now }
        }).sort({ reminderDateTime: 1 });

        if (dueReminders.length === 0) {
            // Don't log anything if no reminders - keeps console clean
            return;
        }

        console.log(`\n⏰ Reminder Job: Found ${dueReminders.length} due reminder(s) to send`);

        let successCount = 0;
        let errorCount = 0;

        for (const reminder of dueReminders) {
            try {
                // Format time nicely for email
                const timeFormatted = reminder.timeOfDay;

                // Send email
                await sendMedicineReminderEmail(
                    reminder.patientEmail,
                    reminder.patientName,
                    {
                        medicineName: reminder.medicineName,
                        dose: reminder.dose,
                        time: timeFormatted,
                        doctorName: reminder.doctorName
                    }
                );

                // Mark as sent
                reminder.sent = true;
                reminder.sentAt = new Date();
                reminder.error = null;
                await reminder.save();

                successCount++;
                console.log(`   ✅ Sent reminder to ${reminder.patientName} for ${reminder.medicineName}`);

            } catch (error) {
                errorCount++;
                console.error(`   ❌ Failed to send reminder to ${reminder.patientName}:`, error.message);

                // Log error but don't mark as sent - will retry next run
                reminder.error = error.message;
                await reminder.save();
            }
        }

        console.log(`⏰ Reminder Job Complete: ${successCount} sent, ${errorCount} failed\n`);

    } catch (error) {
        console.error('❌ Error in reminder email job:', error);
    }
};

export default reminderEmailJob;
