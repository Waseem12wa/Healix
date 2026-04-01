import express from 'express';
import crypto from 'crypto';
import Order from '../models/Order.js';
import PaymentTransaction from '../models/PaymentTransaction.js';
import MedicineInventory from '../models/MedicineInventory.js';
import User from '../models/User.js';
import PatientActivity from '../models/PatientActivity.js';
import stripeService from '../services/stripeService.js';
import paymentGatewayRouter from '../services/paymentGatewayRouter.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const ensureOwnerOrForbidden = (req, res, targetUserId) => {
  if (String(req.user?.id) !== String(targetUserId)) {
    res.status(403).json({ success: false, error: 'Forbidden: access to another user data is not allowed' });
    return false;
  }
  return true;
};

// Middleware to parse raw body for Stripe webhooks
const express_json = express.json();
const express_raw = express.raw({ type: 'application/octet-stream' });

// ============================================
// PAYMENT GATEWAY MANAGEMENT
// ============================================

/**
 * GET /api/payments/gateways
 * Get list of available payment gateways
 */
router.get('/gateways', (req, res) => {
  try {
    const gateways = paymentGatewayRouter.getAvailableGateways();
    return res.json({
      success: true,
      gateways: gateways,
      message: `${gateways.length} payment gateways available`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// PAYMENT INITIATION
// ============================================

/**
 * POST /api/payments/create-intent
 * Create a payment intent for an order
 * Body: {
 *   orderId, userId, amount, currency, description,
 *   customerEmail, customerPhone, paymentGateway (optional)
 * }
 */
router.post('/create-intent', requireAuth, express_json, async (req, res) => {
  try {
    const {
      orderId: incomingOrderId,
      userId: incomingUserId,
      userEmail,
      amount,
      currency,
      description,
      customerEmail,
      customerPhone,
      paymentGateway,
      medicines = []
    } = req.body;

    let orderId = incomingOrderId;
    let userId = req.user.id;

    if (incomingUserId && String(incomingUserId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, error: 'Cannot create payment intent for another user' });
    }

    if (userEmail) {
      const account = await User.findOne({ email: String(userEmail).trim().toLowerCase() }).select('_id');
      if (!account || String(account._id) !== String(req.user.id)) {
        return res.status(403).json({ success: false, error: 'userEmail does not match authenticated user' });
      }
    }

    // Build a checkout order if caller did not provide one.
    if (!orderId) {
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID or user email is required to create checkout order'
        });
      }

      if (!Array.isArray(medicines) || medicines.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one medicine is required for checkout'
        });
      }

      const orderItems = [];
      const providerIds = new Set();
      for (const item of medicines) {
        const medicineDoc = await MedicineInventory.findById(item.medicineId)
          .select('medicineName sellingPrice quantity isExpired isActive providerId');

        if (!medicineDoc || !medicineDoc.isActive || medicineDoc.isExpired) {
          return res.status(400).json({
            success: false,
            error: `Medicine unavailable: ${item.medicineId}`
          });
        }

        const qty = Math.max(1, Number.parseInt(item.quantity || 1, 10));
        if (medicineDoc.quantity < qty) {
          return res.status(400).json({
            success: false,
            error: `Insufficient stock for ${medicineDoc.medicineName}`
          });
        }

        const unitPrice = Number(medicineDoc.sellingPrice || 0);
        if (medicineDoc.providerId) {
          providerIds.add(String(medicineDoc.providerId));
        }
        orderItems.push({
          medicineId: medicineDoc._id,
          medicineName: medicineDoc.medicineName,
          quantity: qty,
          unitPrice,
          subtotal: qty * unitPrice
        });
      }

      const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
      const newOrder = await Order.createOrder(userId, orderItems, paymentGateway || 'stripe');
      newOrder.currency = (currency || 'PKR').toUpperCase();
      newOrder.totalAmount = totalAmount;
      newOrder.finalAmount = totalAmount;
      if (providerIds.size === 1) {
        newOrder.providerId = [...providerIds][0];
      }
      await newOrder.save();
      orderId = newOrder._id;
    }

    // Validate input
    const validation = paymentGatewayRouter.validatePaymentData({
      orderId,
      userId,
      amount,
      currency,
      customerEmail,
      customerPhone
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    // Get primary gateway
    const gateway = paymentGateway || paymentGatewayRouter.getPrimaryGateway();

    // Create payment intent
    const result = await paymentGatewayRouter.createPaymentIntent({
      orderId,
      userId,
      amount,
      currency: currency || 'PKR',
      description: description || `Order ${orderId}`,
      customerEmail,
      customerPhone,
      paymentGateway: gateway
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    await PatientActivity.create({
      userId: userId,
      category: 'purchase',
      title: 'Checkout initiated',
      details: `Payment intent created for order ${orderId}`,
      metadata: {
        orderId,
        amount,
        currency: currency || 'PKR',
        paymentGateway: gateway,
        medicinesCount: Array.isArray(medicines) ? medicines.length : 0,
      }
    });

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Create Intent Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/payments/saved-methods/:userId
 * Fetch saved masked payment methods for a user
 */
router.get('/saved-methods/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!ensureOwnerOrForbidden(req, res, userId)) return;

    const user = await User.findById(userId).select('savedPaymentMethods');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({
      success: true,
      methods: (user.savedPaymentMethods || []).map((m) => ({
        paymentToken: m.paymentToken,
        type: m.type,
        provider: m.provider,
        holderName: m.holderName,
        last4: m.last4,
        expiryMonth: m.expiryMonth,
        expiryYear: m.expiryYear,
        walletIdMasked: m.walletIdMasked,
        isDefault: m.isDefault
      }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/payments/saved-methods
 * Save masked/tokenized payment method to user account (never store full card/CVC)
 */
router.post('/saved-methods', requireAuth, express_json, async (req, res) => {
  try {
    const {
      type,
      provider,
      holderName,
      last4,
      expiryMonth,
      expiryYear,
      walletIdMasked,
      setDefault = false,
    } = req.body;

    if (!type || !provider) {
      return res.status(400).json({ success: false, error: 'type and provider are required' });
    }

    const userId = req.user.id;

    if (!['card', 'paypal', 'nayapay'].includes(type)) {
      return res.status(400).json({ success: false, error: 'Invalid payment method type' });
    }

    if (type === 'card' && (!last4 || !expiryMonth || !expiryYear)) {
      return res.status(400).json({ success: false, error: 'Card methods require last4, expiryMonth, expiryYear' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const paymentToken = `pm_${crypto.randomBytes(10).toString('hex')}`;

    if (setDefault) {
      user.savedPaymentMethods = (user.savedPaymentMethods || []).map((m) => ({
        ...m.toObject(),
        isDefault: false
      }));
    }

    user.savedPaymentMethods.push({
      paymentToken,
      type,
      provider,
      holderName,
      last4,
      expiryMonth,
      expiryYear,
      walletIdMasked,
      isDefault: Boolean(setDefault)
    });

    await user.save();

    return res.json({
      success: true,
      message: 'Payment method saved securely',
      method: {
        paymentToken,
        type,
        provider,
        holderName,
        last4,
        expiryMonth,
        expiryYear,
        walletIdMasked,
        isDefault: Boolean(setDefault)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// STRIPE PAYMENT CONFIRMATION
// ============================================

/**
 * POST /api/payments/stripe/confirm
 * Confirm Stripe payment after client-side processing
 */
router.post('/stripe/confirm', express_json, async (req, res) => {
  try {
    const { paymentIntentId, transactionId } = req.body;

    if (!paymentIntentId || !transactionId) {
      return res.status(400).json({
        success: false,
        error: 'Payment Intent ID and Transaction ID are required'
      });
    }

    const result = await stripeService.confirmPayment(paymentIntentId, transactionId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('❌ Stripe Confirm Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/payments/nayapay-callback
 * Handle NayaPay callback
 */
router.post('/nayapay-callback', express_json, async (req, res) => {
  try {
    const result = await paymentGatewayRouter.confirmPayment('nayapay', req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json({
      success: true,
      message: 'NayaPay callback processed',
      orderId: result.transaction?.orderId
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// STRIPE WEBHOOK
// ============================================

/**
 * POST /api/payments/webhook/stripe
 * Handle Stripe webhook events
 */
router.post('/webhook/stripe', express_raw, async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ success: false, error: 'Missing signature' });
    }

    // Validate webhook signature
    const event = stripeService.validateWebhook(req.body, signature);

    if (!event) {
      return res.status(400).json({ success: false, error: 'Invalid signature' });
    }

    // Handle the event
    const result = await stripeService.handleWebhookEvent(event);

    return res.json({
      success: true,
      received: true,
      message: 'Webhook processed',
      eventType: event.type
    });
  } catch (error) {
    console.error('❌ Stripe Webhook Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// REFUND PROCESSING
// ============================================

/**
 * POST /api/payments/refund
 * Process a refund for a transaction
 * Body: { transactionId, refundAmount (optional) }
 */
router.post('/refund', requireAuth, express_json, async (req, res) => {
  try {
    const { transactionId, refundAmount } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        error: 'Transaction ID is required'
      });
    }

    // Get transaction details
    const transaction = await PaymentTransaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    if (!ensureOwnerOrForbidden(req, res, transaction.userId)) return;

    // Check if already refunded
    if (transaction.refundInfo?.isRefunded) {
      return res.status(400).json({
        success: false,
        error: 'Transaction already refunded'
      });
    }

    // Process refund with the appropriate gateway
    const result = await paymentGatewayRouter.processRefund(transaction.gateway, {
      transactionId,
      paymentIntentId: transaction.gatewayTransactionId,
      gatewayTransactionId: transaction.gatewayTransactionId,
      refundAmount: refundAmount || transaction.amount
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json({
      success: true,
      message: 'Refund processed successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ Refund Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// ORDER & TRANSACTION MANAGEMENT
// ============================================

/**
 * GET /api/payments/orders/:userId
 * Get all orders for a user
 */
router.get('/orders/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!ensureOwnerOrForbidden(req, res, userId)) return;
    const { status, limit = 10, page = 1 } = req.query;

    const query = { userId };
    if (status) query.paymentStatus = status;

    const orders = await Order.find(query)
      .populate('medicines.medicineId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Order.countDocuments(query);

    return res.json({
      success: true,
      orders: orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Get Orders Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/payments/order/:orderId
 * Get specific order details
 */
router.get('/order/:orderId', requireAuth, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('medicines.medicineId')
      .populate('userId', 'email userName')
      .populate('transactionId');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    if (!ensureOwnerOrForbidden(req, res, order.userId)) return;

    return res.json({
      success: true,
      order: order
    });
  } catch (error) {
    console.error('❌ Get Order Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/payments/transaction/:transactionId
 * Get transaction details
 */
router.get('/transaction/:transactionId', requireAuth, async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await PaymentTransaction.findById(transactionId)
      .populate('orderId')
      .populate('userId', 'email userName');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    if (!ensureOwnerOrForbidden(req, res, transaction.userId)) return;

    return res.json({
      success: true,
      transaction: transaction
    });
  } catch (error) {
    console.error('❌ Get Transaction Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// MEDICINE & INVENTORY ENDPOINTS
// ============================================

/**
 * GET /api/payments/medicines
 * Get available medicines for purchase
 */
router.get('/medicines', async (req, res) => {
  try {
    const {
      search,
      category,
      formula,
      medicineType,
      limit = 20,
      page = 1,
      sortBy = 'medicineName',
      sortOrder = 'asc'
    } = req.query;

    const query = {
      isActive: true,
      isExpired: false,
      quantity: { $gt: 0 }
    };

    if (search) {
      query.$or = [
        { medicineName: new RegExp(search, 'i') },
        { genericName: new RegExp(search, 'i') },
        { activeIngredients: new RegExp(search, 'i') }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (formula) {
      query.genericName = new RegExp(String(formula), 'i');
    }

    if (medicineType) {
      query.therapeuticUse = new RegExp(String(medicineType), 'i');
    }

    const allowedSort = ['medicineName', 'sellingPrice', 'quantity', 'category', 'genericName'];
    const sortField = allowedSort.includes(String(sortBy)) ? String(sortBy) : 'medicineName';
    const sortDirection = String(sortOrder).toLowerCase() === 'desc' ? -1 : 1;

    const medicines = await MedicineInventory.find(query)
      .select('medicineName genericName category therapeuticUse commonDosage sellingPrice quantity currency expiryDate batchNumber imageUrl supplier')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ [sortField]: sortDirection });

    const total = await MedicineInventory.countDocuments(query);

    return res.json({
      success: true,
      medicines: medicines,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Get Medicines Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/payments/medicines/filters
 * Get category and type filter options for medicine shop
 */
router.get('/medicines/filters', async (req, res) => {
  try {
    const [categories, medicineTypes] = await Promise.all([
      MedicineInventory.distinct('category', { isActive: true, isExpired: false }),
      MedicineInventory.aggregate([
        {
          $match: {
            isActive: true,
            isExpired: false,
            therapeuticUse: { $exists: true, $ne: '' }
          }
        },
        {
          $group: {
            _id: '$therapeuticUse',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 100 },
        {
          $project: {
            _id: 0,
            label: '$_id'
          }
        }
      ])
    ]);

    return res.json({
      success: true,
      filters: {
        categories: (categories || []).filter(Boolean).sort((a, b) => String(a).localeCompare(String(b))),
        medicineTypes: (medicineTypes || []).map((item) => item.label)
      }
    });
  } catch (error) {
    console.error('❌ Get Medicine Filters Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/payments/medicine/:medicineId
 * Get specific medicine details
 */
router.get('/medicine/:medicineId', async (req, res) => {
  try {
    const { medicineId } = req.params;

    const medicine = await MedicineInventory.findById(medicineId);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        error: 'Medicine not found'
      });
    }

    return res.json({
      success: true,
      medicine: medicine
    });
  } catch (error) {
    console.error('❌ Get Medicine Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// PAYMENT STATISTICS (Admin only)
// ============================================

/**
 * GET /api/payments/stats
 * Get payment statistics
 * Query params: startDate, endDate, gateway
 */
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate, gateway } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await PaymentTransaction.getTransactionSummary(start, end, gateway);

    return res.json({
      success: true,
      timeRange: { start, end },
      stats: stats
    });
  } catch (error) {
    console.error('❌ Get Stats Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
