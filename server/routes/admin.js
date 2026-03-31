import express from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Notification from '../models/Notification.js';
import MedicineReminder from '../models/MedicineReminder.js';
import Order from '../models/Order.js';
import PaymentTransaction from '../models/PaymentTransaction.js';
import DoctorReviewRequest from '../models/DoctorReviewRequest.js';
import Prescription from '../models/Prescription.js';
import PatientActivity from '../models/PatientActivity.js';
import SystemSetting from '../models/SystemSetting.js';
import MedicineInventory from '../models/MedicineInventory.js';

const router = express.Router();

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  return next();
};

const getOrCreateGlobalSettings = async () => {
  let settings = await SystemSetting.findOne({ key: 'global' });
  if (!settings) {
    settings = await SystemSetting.create({ key: 'global' });
  }
  return settings;
};

router.use(requireAuth, requireAdmin);

/**
 * @route GET /api/admin/analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalAppointments,
      totalPayments,
      totalOrders,
      totalSuccessfulPayments,
      totalRevenueAgg,
      usersByRoleAgg,
      appointmentsByStatusAgg,
      recentUsers,
      recentAppointments,
    ] = await Promise.all([
      User.countDocuments(),
      Appointment.countDocuments(),
      PaymentTransaction.countDocuments(),
      Order.countDocuments(),
      PaymentTransaction.countDocuments({ status: { $in: ['succeeded', 'captured'] } }),
      PaymentTransaction.aggregate([
        { $match: { status: { $in: ['succeeded', 'captured'] } } },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
      ]),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      Appointment.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Appointment.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    ]);

    const usersByRole = {
      patient: 0,
      doctor: 0,
      provider: 0,
      admin: 0,
    };

    usersByRoleAgg.forEach((row) => {
      const role = String(row._id || '').toLowerCase();
      if (role in usersByRole) {
        usersByRole[role] = row.count;
      }
    });

    const appointmentsByStatus = {
      pending: 0,
      approved: 0,
      completed: 0,
      rejected: 0,
      cancelled: 0,
    };

    appointmentsByStatusAgg.forEach((row) => {
      const status = String(row._id || '').toLowerCase();
      if (status in appointmentsByStatus) {
        appointmentsByStatus[status] = row.count;
      }
    });

    return res.json({
      success: true,
      data: {
        generatedAt: now.toISOString(),
        totals: {
          totalUsers,
          totalAppointments,
          totalPayments,
          totalOrders,
          totalSuccessfulPayments,
          totalRevenue: totalRevenueAgg?.[0]?.totalRevenue || 0,
        },
        usersByRole,
        appointmentsByStatus,
        trend7d: {
          newUsers: recentUsers,
          newAppointments: recentAppointments,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/admin/users
 */
router.get('/users', async (req, res) => {
  try {
    const { role, search } = req.query;
    const query = {};

    if (role && ['patient', 'doctor', 'provider', 'admin'].includes(String(role))) {
      query.role = String(role);
    }

    if (search) {
      query.$or = [
        { userName: { $regex: String(search), $options: 'i' } },
        { email: { $regex: String(search), $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('_id userName email role createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean();

    const data = users.map((user) => ({
      id: String(user._id),
      name: user.userName || user.email.split('@')[0],
      email: user.email,
      role: user.role,
      status: 'active',
      joinedDate: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return res.json({ success: true, data, count: data.length });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route DELETE /api/admin/users/:id
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    if (String(req.user.id) === String(id)) {
      return res.status(400).json({ success: false, message: 'Admin cannot delete their own account from this endpoint' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
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

    return res.json({ success: true, message: 'User and linked data deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/admin/appointments
 */
router.get('/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find({})
      .sort({ createdAt: -1 })
      .lean();

    const data = appointments.map((item) => ({
      id: String(item._id),
      patientId: String(item.patientId),
      patientName: item.patientName,
      patientEmail: item.patientEmail,
      doctorId: String(item.doctorId),
      doctorName: item.doctorName,
      doctorEmail: item.doctorEmail,
      specialization: item.specialization,
      date: item.date,
      time: item.time,
      consultationType: item.consultationType,
      fee: item.fee,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return res.json({ success: true, data, count: data.length });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route DELETE /api/admin/appointments/:id
 */
router.delete('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment id' });
    }

    const deleted = await Appointment.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    await Notification.deleteMany({ appointmentId: deleted._id });

    return res.json({ success: true, message: 'Appointment deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/admin/medicines
 */
router.get('/medicines', async (req, res) => {
  try {
    const medicines = await MedicineInventory.find({})
      .select('medicineName genericName category therapeuticUse commonDosage sellingPrice quantity currency imageUrl isActive createdAt updatedAt')
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    const data = medicines.map((item) => ({
      id: String(item._id),
      medicineName: item.medicineName || '',
      genericName: item.genericName || '',
      category: item.category || '',
      therapeuticUse: item.therapeuticUse || '',
      commonDosage: item.commonDosage || '',
      sellingPrice: Number(item.sellingPrice || 0),
      quantity: Number(item.quantity || 0),
      currency: item.currency || 'PKR',
      imageUrl: item.imageUrl || '',
      isActive: item.isActive !== false,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return res.json({ success: true, data, count: data.length });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route DELETE /api/admin/medicines/:id
 */
router.delete('/medicines/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid medicine id' });
    }

    const deleted = await MedicineInventory.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    return res.json({ success: true, message: 'Medicine removed successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/admin/payments
 */
router.get('/payments', async (req, res) => {
  try {
    const transactions = await PaymentTransaction.find({})
      .sort({ createdAt: -1 })
      .populate('userId', 'userName email role')
      .populate('orderId', 'orderNumber finalAmount paymentStatus orderStatus')
      .lean();

    const data = transactions.map((item) => ({
      id: String(item._id),
      transactionId: item.transactionId,
      gateway: item.gateway,
      gatewayTransactionId: item.gatewayTransactionId,
      amount: item.amount,
      currency: item.currency,
      status: item.status,
      paymentMethod: item.paymentMethod,
      orderId: item.orderId ? String(item.orderId._id || item.orderId) : null,
      orderNumber: item.orderId?.orderNumber || '',
      userId: item.userId ? String(item.userId._id || item.userId) : null,
      userName: item.userId?.userName || '',
      userEmail: item.userId?.email || '',
      userRole: item.userId?.role || '',
      createdAt: item.createdAt,
      completedAt: item.completedAt,
    }));

    return res.json({ success: true, data, count: data.length });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route GET /api/admin/settings
 */
router.get('/settings', async (req, res) => {
  try {
    const settings = await getOrCreateGlobalSettings();
    return res.json({ success: true, data: settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route PUT /api/admin/settings
 */
router.put('/settings', async (req, res) => {
  try {
    const payload = req.body || {};

    const updates = {
      platformName: String(payload.platformName || 'Healix').trim(),
      supportEmail: String(payload.supportEmail || '').trim().toLowerCase(),
      maintenanceMode: Boolean(payload.maintenanceMode),
      allowNewRegistrations: payload.allowNewRegistrations !== false,
      enableEmailNotifications: payload.enableEmailNotifications !== false,
      appointmentReminderLeadMinutes: Number(payload.appointmentReminderLeadMinutes) || 15,
      defaultThemeMode: payload.defaultThemeMode === 'dark' ? 'dark' : 'light',
      defaultBlackAndWhiteMode: Boolean(payload.defaultBlackAndWhiteMode),
      updatedBy: req.user.id,
    };

    if (updates.appointmentReminderLeadMinutes < 5 || updates.appointmentReminderLeadMinutes > 120) {
      return res.status(400).json({ success: false, message: 'appointmentReminderLeadMinutes must be between 5 and 120' });
    }

    if (updates.supportEmail && !/^\S+@\S+\.\S+$/.test(updates.supportEmail)) {
      return res.status(400).json({ success: false, message: 'Invalid supportEmail' });
    }

    const settings = await SystemSetting.findOneAndUpdate(
      { key: 'global' },
      { $set: updates },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.json({ success: true, message: 'Settings updated successfully', data: settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
