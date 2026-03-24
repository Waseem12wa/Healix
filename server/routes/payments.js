import express from 'express';
import Order from '../models/Order.js';
import PaymentTransaction from '../models/PaymentTransaction.js';
import MedicineInventory from '../models/MedicineInventory.js';
import stripeService from '../services/stripeService.js';
import easyPaisaService from '../services/easyPaisaService.js';
import jazzcashService from '../services/jazzcashService.js';
import paymentGatewayRouter from '../services/paymentGatewayRouter.js';

const router = express.Router();

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
router.post('/create-intent', express_json, async (req, res) => {
  try {
    const { orderId, userId, amount, currency, description, customerEmail, customerPhone, paymentGateway } = req.body;

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

// ============================================
// EASYPAISA PAYMENT CALLBACK
// ============================================

/**
 * POST /api/payments/easypaisa-callback
 * Handle Easypaisa payment callback
 */
router.post('/easypaisa-callback', express_json, async (req, res) => {
  try {
    const callbackData = req.body;

    console.log('📨 Easypaisa Callback Received:', callbackData);

    const result = await easyPaisaService.verifyPaymentResponse(callbackData);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json({
      success: true,
      message: 'Easypaisa callback processed',
      orderId: result.transaction?.orderId
    });
  } catch (error) {
    console.error('❌ Easypaisa Callback Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// JAZZCASH PAYMENT CALLBACK
// ============================================

/**
 * GET /api/payments/jazzcash-callback
 * Handle JazzCash payment callback (GET or POST)
 */
router.get('/jazzcash-callback', async (req, res) => {
  try {
    const callbackData = req.query;

    console.log('📨 JazzCash Callback Received:', callbackData);

    const result = await jazzcashService.verifyPaymentResponse(callbackData);

    if (!result.success) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failure?error=${encodeURIComponent(result.message)}`);
    }

    return res.redirect(`${process.env.FRONTEND_URL}/payment/success?orderId=${result.transaction?.orderId}`);
  } catch (error) {
    console.error('❌ JazzCash Callback Error:', error.message);
    return res.redirect(`${process.env.FRONTEND_URL}/payment/failure?error=callback_error`);
  }
});

router.post('/jazzcash-callback', express_json, async (req, res) => {
  try {
    const callbackData = req.body;
    const result = await jazzcashService.verifyPaymentResponse(callbackData);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json({
      success: true,
      message: 'JazzCash callback processed',
      orderId: result.transaction?.orderId
    });
  } catch (error) {
    console.error('❌ JazzCash Callback Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
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
router.post('/refund', express_json, async (req, res) => {
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
router.get('/orders/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
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
router.get('/order/:orderId', async (req, res) => {
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
router.get('/transaction/:transactionId', async (req, res) => {
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
    const { search, category, limit = 20, page = 1 } = req.query;

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

    const medicines = await MedicineInventory.find(query)
      .select('medicineName genericName category therapeuticUse commonDosage sellingPrice quantity')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ medicineName: 1 });

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
