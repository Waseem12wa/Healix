import express from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import MedicineInventory from '../models/MedicineInventory.js';
import PaymentTransaction from '../models/PaymentTransaction.js';
import Notification from '../models/Notification.js';

const router = express.Router();

const PROVIDER_SHARE = 0.75;
const ADMIN_SHARE = 0.25;

const requireProvider = (req, res, next) => {
  if (req.user?.role !== 'provider') {
    return res.status(403).json({ success: false, message: 'Provider access required' });
  }
  return next();
};

router.use(requireAuth, requireProvider);

router.get('/overview', async (req, res) => {
  try {
    const providerId = new mongoose.Types.ObjectId(req.user.id);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Backward compatibility for older seeded inventories that were not tagged with providerId.
    const legacyInventoryQuery = {
      $or: [{ providerId }, { providerId: { $exists: false } }, { providerId: null }],
      isActive: true,
    };

    const [
      totalMedicines,
      lowStockMedicines,
      totalOrders,
      completedOrders,
      pendingApprovals,
      recentOrders,
      notifications,
      monthlyTrend,
      earningsAgg,
    ] = await Promise.all([
      MedicineInventory.countDocuments(legacyInventoryQuery),
      MedicineInventory.countDocuments({
        ...legacyInventoryQuery,
        isActive: true,
        $expr: { $lte: ['$quantity', '$reorderLevel'] },
      }),
      Order.countDocuments({ providerId }),
      Order.countDocuments({ providerId, orderStatus: { $in: ['delivered'] } }),
      Order.countDocuments({ providerId, orderStatus: { $in: ['pending', 'confirmed', 'processing'] } }),
      Order.find({ providerId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('orderNumber finalAmount orderStatus paymentStatus createdAt'),
      Notification.find({ userId: providerId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('title message type read createdAt'),
      Order.aggregate([
        { $match: { providerId, createdAt: { $gte: monthStart } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' },
            },
            totalSales: { $sum: '$finalAmount' },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]),
      PaymentTransaction.aggregate([
        { $match: { status: { $in: ['succeeded', 'captured'] } } },
        {
          $lookup: {
            from: 'orders',
            localField: 'orderId',
            foreignField: '_id',
            as: 'order',
          },
        },
        { $unwind: '$order' },
        { $match: { 'order.providerId': providerId } },
        {
          $group: {
            _id: null,
            gross: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const gross = earningsAgg?.[0]?.gross || 0;
    const providerEarnings = gross * PROVIDER_SHARE;
    const adminCommission = gross * ADMIN_SHARE;

    return res.json({
      success: true,
      data: {
        metrics: {
          totalMedicines,
          totalOrders,
          completedOrders,
          pendingApprovals,
          lowStockMedicines,
          totalEarnings: Number(providerEarnings.toFixed(2)),
          adminCommission: Number(adminCommission.toFixed(2)),
          grossRevenue: Number(gross.toFixed(2)),
        },
        monthlyTrend: monthlyTrend.map((row) => ({
          date: `${row._id.year}-${String(row._id.month).padStart(2, '0')}-${String(row._id.day).padStart(2, '0')}`,
          totalSales: row.totalSales,
          orderCount: row.orderCount,
        })),
        recentOrders,
        notifications,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/medicines', async (req, res) => {
  try {
    const providerId = req.user.id;
    const { search = '', category = '', status = 'all' } = req.query;

    const query = { providerId };

    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (category) query.category = String(category);

    if (search) {
      const regex = new RegExp(String(search), 'i');
      query.$or = [
        { medicineName: regex },
        { genericName: regex },
        { category: regex },
      ];
    }

    const medicines = await MedicineInventory.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: medicines, count: medicines.length });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/medicines', async (req, res) => {
  try {
    const {
      medicineName,
      genericName,
      category,
      quantity,
      reorderLevel,
      costPrice,
      sellingPrice,
      expiryDate,
      imageUrl,
      description,
      isPrescriptionRequired,
    } = req.body || {};

    if (!medicineName || !sellingPrice || costPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: 'medicineName, costPrice and sellingPrice are required',
      });
    }

    const provider = await User.findById(req.user.id).select('userName email');
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    const created = await MedicineInventory.create({
      medicineName,
      genericName,
      category,
      quantity: Number(quantity || 0),
      reorderLevel: Number(reorderLevel || 50),
      costPrice: Number(costPrice),
      sellingPrice: Number(sellingPrice),
      expiryDate: expiryDate || null,
      imageUrl: imageUrl || '',
      description: description || '',
      isPrescriptionRequired: Boolean(isPrescriptionRequired),
      providerId: provider._id,
      providerName: provider.userName || provider.email,
      isActive: true,
    });

    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/medicines/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid medicine id' });
    }

    const medicine = await MedicineInventory.findOne({ _id: id, providerId: req.user.id });
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    const updatableFields = [
      'medicineName',
      'genericName',
      'category',
      'quantity',
      'reorderLevel',
      'costPrice',
      'sellingPrice',
      'expiryDate',
      'imageUrl',
      'description',
      'isPrescriptionRequired',
      'isActive',
    ];

    updatableFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
        medicine[field] = req.body[field];
      }
    });

    await medicine.save();

    return res.json({ success: true, data: medicine });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/medicines/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid medicine id' });
    }

    const medicine = await MedicineInventory.findOne({ _id: id, providerId: req.user.id });
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    medicine.isActive = false;
    await medicine.save();

    return res.json({ success: true, message: 'Medicine deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const { status = 'all' } = req.query;
    const query = { providerId: req.user.id };

    if (status !== 'all') {
      query.orderStatus = String(status);
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'userName email')
      .populate('medicines.medicineId', 'medicineName imageUrl')
      .lean();

    const data = orders.map((order) => ({
      id: String(order._id),
      orderNumber: order.orderNumber,
      patientName: order.userId?.userName || order.userId?.email || 'Patient',
      patientEmail: order.userId?.email || '',
      medicines: (order.medicines || []).map((m) => ({
        medicineId: String(m.medicineId?._id || m.medicineId || ''),
        medicineName: m.medicineName || m.medicineId?.medicineName || 'Medicine',
        quantity: m.quantity,
        unitPrice: m.unitPrice,
        subtotal: m.subtotal,
      })),
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      totalAmount: order.totalAmount,
      finalAmount: order.finalAmount,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    return res.json({ success: true, data, count: data.length });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }

    const order = await Order.findOne({ _id: id, providerId: req.user.id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (action === 'approve') {
      order.orderStatus = 'confirmed';
      order.providerApprovedAt = new Date();
    } else if (action === 'reject') {
      order.orderStatus = 'cancelled';
      if (order.paymentStatus === 'pending' || order.paymentStatus === 'processing') {
        order.paymentStatus = 'cancelled';
      }
      order.providerRejectedAt = new Date();
    } else if (action === 'complete') {
      order.orderStatus = 'delivered';
      order.deliveredAt = new Date();
      if (order.paymentStatus === 'processing') {
        order.paymentStatus = 'success';
      }
    } else {
      return res.status(400).json({ success: false, message: 'Action must be approve, reject, or complete' });
    }

    await order.save();

    const patient = await User.findById(order.userId).select('_id email');
    if (patient) {
      await Notification.create({
        userId: patient._id,
        userEmail: patient.email,
        type: 'provider_order_update',
        title: `Order ${order.orderNumber} ${action}d`,
        message: `Your order ${order.orderNumber} status has been updated to ${order.orderStatus}.`,
      });
    }

    return res.json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/payments/summary', async (req, res) => {
  try {
    const providerId = new mongoose.Types.ObjectId(req.user.id);

    const rows = await PaymentTransaction.aggregate([
      { $match: { status: { $in: ['succeeded', 'captured'] } } },
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'order',
        },
      },
      { $unwind: '$order' },
      { $match: { 'order.providerId': providerId } },
      {
        $group: {
          _id: null,
          gross: { $sum: '$amount' },
          transactions: { $sum: 1 },
        },
      },
    ]);

    const gross = rows?.[0]?.gross || 0;
    const transactions = rows?.[0]?.transactions || 0;

    return res.json({
      success: true,
      data: {
        transactions,
        grossRevenue: Number(gross.toFixed(2)),
        providerEarnings: Number((gross * PROVIDER_SHARE).toFixed(2)),
        adminCommission: Number((gross * ADMIN_SHARE).toFixed(2)),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/payments/transactions', async (req, res) => {
  try {
    const providerId = new mongoose.Types.ObjectId(req.user.id);

    const rows = await PaymentTransaction.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'order',
        },
      },
      { $unwind: '$order' },
      { $match: { 'order.providerId': providerId } },
      { $sort: { createdAt: -1 } },
      { $limit: 100 },
      {
        $project: {
          _id: 1,
          transactionId: 1,
          status: 1,
          amount: 1,
          currency: 1,
          createdAt: 1,
          gateway: 1,
          orderId: '$order._id',
          orderNumber: '$order.orderNumber',
          providerAmount: { $round: [{ $multiply: ['$amount', PROVIDER_SHARE] }, 2] },
          adminCommission: { $round: [{ $multiply: ['$amount', ADMIN_SHARE] }, 2] },
        },
      },
    ]);

    return res.json({ success: true, data: rows, count: rows.length });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/payments/account', async (req, res) => {
  try {
    const provider = await User.findById(req.user.id).select('providerProfile.paymentDetails');
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    return res.json({
      success: true,
      data: provider.providerProfile?.paymentDetails || {
        accountHolderName: '',
        bankName: '',
        bankAccountNumber: '',
        iban: '',
        walletProvider: '',
        walletNumber: '',
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/payments/account', async (req, res) => {
  try {
    const provider = await User.findById(req.user.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    const payload = req.body || {};
    const paymentDetails = {
      accountHolderName: String(payload.accountHolderName || '').trim(),
      bankName: String(payload.bankName || '').trim(),
      bankAccountNumber: String(payload.bankAccountNumber || '').trim(),
      iban: String(payload.iban || '').trim(),
      walletProvider: String(payload.walletProvider || '').trim(),
      walletNumber: String(payload.walletNumber || '').trim(),
    };

    provider.providerProfile = {
      ...(provider.providerProfile || {}),
      paymentDetails,
    };

    await provider.save();

    return res.json({ success: true, data: paymentDetails, message: 'Payout details updated' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/support', async (req, res) => {
  try {
    const { subject, message, priority = 'normal' } = req.body || {};

    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'subject and message are required' });
    }

    const provider = await User.findById(req.user.id).select('email userName');
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    const admins = await User.find({ role: 'admin' }).select('_id email');

    if (admins.length) {
      await Notification.insertMany(
        admins.map((admin) => ({
          userId: admin._id,
          userEmail: admin.email,
          type: 'provider_support_message',
          title: `Provider support request: ${String(subject).trim()}`,
          message: `${provider.userName || provider.email} reported an issue (priority: ${String(priority)}): ${String(message).trim()}`,
        }))
      );
    }

    return res.json({ success: true, message: 'Support request submitted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
