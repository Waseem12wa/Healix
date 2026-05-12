import Stripe from 'stripe';
import dotenv from 'dotenv';
import PaymentTransaction from '../models/PaymentTransaction.js';
import Order from '../models/Order.js';
import MedicineInventory from '../models/MedicineInventory.js';
import User from '../models/User.js';
import { sendOrderConfirmationEmail } from '../utils/emailService.js';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Side effects to run exactly once when an order's payment turns into "success":
 *   1. Decrement medicine inventory.
 *   2. Send the customer a confirmation email.
 *
 * Safe to call multiple times - guarded by `order._fulfilled` in-memory flag and
 * by paymentStatus === 'success' check before mutating stock.
 */
async function fulfillOrder(order, transaction) {
  if (!order) return;

  // Decrement inventory (best-effort, non-blocking semantics for stock errors).
  try {
    for (const line of order.medicines || []) {
      if (!line.medicineId) continue;
      await MedicineInventory.updateOne(
        { _id: line.medicineId, quantity: { $gte: line.quantity } },
        { $inc: { quantity: -Math.abs(line.quantity || 0) } }
      );
    }
  } catch (stockError) {
    console.error('⚠️  Stock decrement error (continuing):', stockError.message);
  }

  // Send confirmation email to the patient's real email.
  try {
    const user = await User.findById(order.userId).select('email userName fullName');
    const email = user?.email;
    const userName = user?.fullName || user?.userName || 'Customer';
    if (email) {
      await sendOrderConfirmationEmail({ email, userName, order, transaction });
    } else {
      console.warn('⚠️  Cannot send order email: user email missing for order', order._id);
    }
  } catch (mailError) {
    console.error('⚠️  Confirmation email error (continuing):', mailError.message);
  }
}

class StripePaymentService {
  /**
   * Create a payment intent for order
   * @param {Object} orderData - Order information
   * @returns {Promise<Object>} Payment intent details
   */
  async createPaymentIntent(orderData) {
    try {
      const { orderId, userId, amount, currency = 'pkr', description, metadata = {} } = orderData;

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        description: description || `Order ${orderId}`,
        metadata: {
          orderId: orderId.toString(),
          userId: userId.toString(),
          ...metadata
        },
        automatic_payment_methods: {
          enabled: true
        }
      });

      // Create transaction record
      const transaction = await PaymentTransaction.create({
        orderId,
        userId,
        gateway: 'stripe',
        gatewayTransactionId: paymentIntent.id,
        amount,
        currency,
        paymentMethod: 'card',
        status: 'initiated',
        requestData: {
          amount,
          currency,
          description
        }
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        transactionId: transaction._id,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      console.error('❌ Stripe Intent Creation Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Confirm and process payment
   * @param {String} paymentIntentId - Stripe payment intent ID
   * @param {String} transactionId - Our transaction record ID
   * @returns {Promise<Object>} Payment result
   */
  async confirmPayment(paymentIntentId, transactionId) {
    try {
      // Retrieve payment intent status from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      let transaction = await PaymentTransaction.findById(transactionId);

      if (!transaction) {
        throw new Error('Transaction record not found');
      }

      // Check payment status
      if (paymentIntent.status === 'succeeded') {
        const wasAlreadySucceeded = transaction.status === 'succeeded';

        transaction.status = 'succeeded';
        transaction.completedAt = new Date();
        transaction.responseData = {
          message: 'Payment successful',
          code: 'SUCCESS',
          rawResponse: {
            id: paymentIntent.id,
            status: paymentIntent.status,
            amount_received: paymentIntent.amount_received
          }
        };

        // Extract card details if available. Newer Stripe API versions (>=2022-11-15)
        // do not expand `charges` on PaymentIntent, so retrieve via latest_charge.
        try {
          let charge = paymentIntent.charges?.data?.[0];
          if (!charge && paymentIntent.latest_charge) {
            charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
          }
          if (charge && charge.payment_method_details?.card) {
            transaction.cardDetails = {
              last4Digits: charge.payment_method_details.card.last4,
              cardBrand: charge.payment_method_details.card.brand,
              expiryMonth: charge.payment_method_details.card.exp_month,
              expiryYear: charge.payment_method_details.card.exp_year
            };
          }
        } catch (cardErr) {
          console.warn('⚠️  Could not extract card details:', cardErr.message);
        }

        await transaction.save();

        // Update order status (idempotent: only fulfil on first transition).
        const order = await Order.findById(transaction.orderId);
        let alreadyPaid = false;
        if (order) {
          alreadyPaid = order.paymentStatus === 'success';
          if (!alreadyPaid) {
            order.paymentIntentId = paymentIntent.id;
            order.transactionId = transaction._id;
            await order.markPaymentComplete();
          }
        }

        // Fire post-payment side-effects only on the first successful confirmation
        // (prevents duplicate emails / double stock decrement on refresh).
        if (order && !alreadyPaid && !wasAlreadySucceeded) {
          await fulfillOrder(order, transaction);
        }

        // Re-load the order populated so callers can render a confirmation page.
        const populatedOrder = order
          ? await Order.findById(order._id).populate('medicines.medicineId').lean()
          : null;

        return {
          success: true,
          status: 'succeeded',
          message: 'Payment confirmed successfully',
          transaction: transaction,
          order: populatedOrder,
          orderId: populatedOrder?._id
        };
      } else if (paymentIntent.status === 'processing') {
        transaction.status = 'pending';
        await transaction.save();
        return {
          success: true,
          status: 'processing',
          message: 'Payment is being processed',
          transaction: transaction
        };
      } else {
        transaction.status = 'failed';
        transaction.errorDetails = {
          message: 'Payment failed or incomplete',
          code: paymentIntent.status
        };
        await transaction.save();
        return {
          success: false,
          status: 'failed',
          message: 'Payment could not be completed',
          transaction: transaction
        };
      }
    } catch (error) {
      console.error('❌ Stripe Payment Confirmation Error:', error.message);
      
      // Update transaction with error
      if (transactionId) {
        try {
          const transaction = await PaymentTransaction.findById(transactionId);
          if (transaction) {
            transaction.status = 'failed';
            transaction.errorDetails = {
              message: error.message,
              code: 'CONFIRMATION_ERROR'
            };
            await transaction.save();
          }
        } catch (dbError) {
          console.error('Error updating transaction:', dbError.message);
        }
      }

      return {
        success: false,
        error: error.message,
        message: 'Failed to confirm payment'
      };
    }
  }

  /**
   * Process refund
   * @param {String} paymentIntentId - Original payment intent ID
   * @param {String} transactionId - Transaction record ID
   * @param {Number} refundAmount - Amount to refund (optional, full refund if not provided)
   * @returns {Promise<Object>} Refund result
   */
  async processRefund(paymentIntentId, transactionId, refundAmount = null) {
    try {
      const transaction = await PaymentTransaction.findById(transactionId);

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Get the charge from payment intent
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const chargeId = paymentIntent.charges.data[0]?.id;

      if (!chargeId) {
        throw new Error('Charge not found for refund');
      }

      // Create refund
      const refund = await stripe.refunds.create({
        charge: chargeId,
        amount: refundAmount ? Math.round(refundAmount * 100) : undefined,
        reason: 'requested_by_customer'
      });

      // Update transaction
      await transaction.processRefund(refundAmount, 'Stripe refund processed');

      return {
        success: true,
        message: 'Refund processed successfully',
        refundId: refund.id,
        amount: refund.amount / 100
      };
    } catch (error) {
      console.error('❌ Stripe Refund Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate webhook signature
   * @param {String} body - Raw request body
   * @param {String} signature - Stripe signature header
   * @returns {Object} Event object (or null if invalid)
   */
  validateWebhook(body, signature) {
    try {
      const event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      return event;
    } catch (error) {
      console.error('❌ Webhook Signature Verification Failed:', error.message);
      return null;
    }
  }

  /**
   * Handle webhook events
   * @param {Object} event - Stripe event
   * @returns {Promise<Object>} Result
   */
  async handleWebhookEvent(event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          return await this._handlePaymentSucceeded(event.data.object);
        
        case 'payment_intent.payment_failed':
          return await this._handlePaymentFailed(event.data.object);
        
        case 'charge.refunded':
          return await this._handleRefund(event.data.object);
        
        default:
          console.log(`ℹ️  Unhandled event type: ${event.type}`);
          return { handled: false };
      }
    } catch (error) {
      console.error('❌ Webhook Handler Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async _handlePaymentSucceeded(paymentIntent) {
    try {
      const transaction = await PaymentTransaction.findOne({
        gatewayTransactionId: paymentIntent.id,
        gateway: 'stripe'
      });

      if (!transaction) {
        console.log('⚠️  Transaction not found for payment intent:', paymentIntent.id);
        return { handled: false };
      }

      await transaction.markSuccessful({
        message: 'Payment succeeded',
        code: 'SUCCESS',
        rawResponse: paymentIntent
      });

      // Update order
      const order = await Order.findById(transaction.orderId);
      if (order) {
        await order.markPaymentComplete();
      }

      return { success: true, message: 'Payment succeeded webhook processed' };
    } catch (error) {
      console.error('Error handling payment succeeded:', error.message);
      return { success: false, error: error.message };
    }
  }

  async _handlePaymentFailed(paymentIntent) {
    try {
      const transaction = await PaymentTransaction.findOne({
        gatewayTransactionId: paymentIntent.id,
        gateway: 'stripe'
      });

      if (!transaction) return { handled: false };

      await transaction.markFailed(
        paymentIntent.last_payment_error?.message || 'Payment failed',
        paymentIntent.last_payment_error?.code || 'PAYMENT_FAILED'
      );

      return { success: true, message: 'Payment failed webhook processed' };
    } catch (error) {
      console.error('Error handling payment failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async _handleRefund(charge) {
    try {
      const transaction = await PaymentTransaction.findOne({
        gatewayTransactionId: charge.payment_intent,
        gateway: 'stripe'
      });

      if (!transaction) return { handled: false };

      transaction.refundInfo = {
        isRefunded: true,
        refundAmount: charge.amount_refunded / 100,
        refundDate: new Date(),
        refundReason: 'Gateway refund processed',
        refundGatewayId: charge.refunds?.data[0]?.id
      };

      await transaction.save();
      return { success: true, message: 'Refund webhook processed' };
    } catch (error) {
      console.error('Error handling refund:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get transaction details
   * @param {String} transactionId - Our transaction ID
   * @returns {Promise<Object>} Transaction details
   */
  async getTransactionDetails(transactionId) {
    try {
      const transaction = await PaymentTransaction.findById(transactionId)
        .populate('orderId')
        .populate('userId', 'email userName');

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      return { success: true, data: transaction };
    } catch (error) {
      console.error('Error fetching transaction:', error.message);
      return { success: false, error: error.message };
    }
  }
}

export default new StripePaymentService();
