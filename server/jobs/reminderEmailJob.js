import MedicineReminder from '../models/MedicineReminder.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendMedicineReminderEmail } from '../utils/emailService.js';
import mongoose from 'mongoose';

/**
 * Background job to send medicine reminder emails
 * 
 * This job runs every minute via node-cron.
 * It finds all due reminders (sent=false and reminderDateTime <= now)
 * and sends email to each patient.
 */
export const reminderEmailJob = async () => {
    try {
        // Skip job when DB is unavailable to avoid noisy stack traces every minute
        if (mongoose.connection.readyState !== 1) {
            console.warn('⚠️ Reminder Job skipped: MongoDB is not connected');
            return;
        }

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
                let reminderRecipientEmail = reminder.reminderRecipientEmail || reminder.patientEmail;

                // Backfill legacy reminders that were created before reminderRecipientEmail existed
                if (!reminder.reminderRecipientEmail) {
                    const patient = await User.findById(reminder.patientId).select('reminderEmail email');
                    const resolvedRecipientEmail = patient?.reminderEmail || patient?.email || reminder.patientEmail;

                    if (resolvedRecipientEmail) {
                        reminderRecipientEmail = resolvedRecipientEmail;
                        await MedicineReminder.updateOne(
                            { _id: reminder._id },
                            {
                                $set: {
                                    reminderRecipientEmail: resolvedRecipientEmail,
                                    updatedAt: new Date()
                                }
                            }
                        );
                    }
                }

                // Create due-time in-app notification once, independent from email success
                if (!reminder.dueNotificationSent) {
                    try {
                        await Notification.create({
                            userId: reminder.patientId,
                            userEmail: reminder.patientEmail,
                            type: 'medication_reminder_due',
                            title: `Time to take ${reminder.medicineName}`,
                            message: `Reminder: Take ${reminder.medicineName} (${reminder.dose}) at ${timeFormatted} as prescribed by Dr. ${reminder.doctorName}.`,
                            read: false
                        });

                        await MedicineReminder.updateOne(
                            { _id: reminder._id },
                            {
                                $set: {
                                    dueNotificationSent: true,
                                    dueNotificationSentAt: new Date(),
                                    updatedAt: new Date()
                                }
                            }
                        );

                        console.log(`   🔔 Due notification created for ${reminder.patientName}`);
                    } catch (notifError) {
                        console.warn(`   ⚠️  Failed to create due notification:`, notifError.message);
                    }
                }

                if (!reminderRecipientEmail) {
                    throw new Error('No reminder recipient email found for this patient');
                }

                // Send email
                await sendMedicineReminderEmail(
                    reminderRecipientEmail,
                    reminder.patientName,
                    {
                        medicineName: reminder.medicineName,
                        dose: reminder.dose,
                        time: timeFormatted,
                        doctorName: reminder.doctorName
                    }
                );

                // Mark as sent
                await MedicineReminder.updateOne(
                    { _id: reminder._id },
                    {
                        $set: {
                            sent: true,
                            sentAt: new Date(),
                            error: null,
                            reminderRecipientEmail,
                            updatedAt: new Date()
                        }
                    }
                );

                successCount++;
                console.log(`   ✅ Sent reminder to ${reminder.patientName} for ${reminder.medicineName}`);

            } catch (error) {
                errorCount++;
                console.error(`   ❌ Failed to send reminder to ${reminder.patientName}:`, error.message);

                // Log error but don't mark as sent - will retry next run
                await MedicineReminder.updateOne(
                    { _id: reminder._id },
                    {
                        $set: {
                            error: error.message,
                            updatedAt: new Date()
                        }
                    }
                );
            }
        }

        console.log(`⏰ Reminder Job Complete: ${successCount} sent, ${errorCount} failed\n`);

    } catch (error) {
        console.error('❌ Error in reminder email job:', error);
    }
};

export default reminderEmailJob;
