import stripeService from './stripeService.js';
import easyPaisaService from './easyPaisaService.js';
import jazzcashService from './jazzcashService.js';

/**
 * Payment Gateway Router
 * Routes payment requests to the appropriate payment service
 */
class PaymentGatewayRouter {
  /**
   * Create payment intent based on preferred gateway
   * @param {Object} orderData - Order information with paymentGateway field
   * @returns {Promise<Object>} Payment intent result
   */
  async createPaymentIntent(orderData) {
    const { paymentGateway = 'stripe' } = orderData;

    try {
      switch (paymentGateway.toLowerCase()) {
        case 'stripe':
          return await stripeService.createPaymentIntent(orderData);
        
        case 'easypaisa':
          return await easyPaisaService.createPaymentSession(orderData);
        
        case 'jazzcash':
          return await jazzcashService.createPaymentSession(orderData);
        
        default:
          // Fallback to Stripe if unknown gateway
          console.warn(`⚠️  Unknown gateway: ${paymentGateway}, falling back to Stripe`);
          return await stripeService.createPaymentIntent(orderData);
      }
    } catch (error) {
      console.error(`❌ Error creating payment intent for ${paymentGateway}:`, error.message);
      return {
        success: false,
        error: error.message,
        gateway: paymentGateway
      };
    }
  }

  /**
   * Confirm/verify payment with the appropriate gateway
   * @param {String} gateway - Payment gateway name
   * @param {Object} confirmationData - Data needed to confirm payment
   * @returns {Promise<Object>} Confirmation result
   */
  async confirmPayment(gateway, confirmationData) {
    try {
      switch (gateway.toLowerCase()) {
        case 'stripe':
          return await stripeService.confirmPayment(
            confirmationData.paymentIntentId,
            confirmationData.transactionId
          );
        
        case 'easypaisa':
          return await easyPaisaService.verifyPaymentResponse(confirmationData);
        
        case 'jazzcash':
          return await jazzcashService.verifyPaymentResponse(confirmationData);
        
        default:
          throw new Error(`Unknown gateway: ${gateway}`);
      }
    } catch (error) {
      console.error(`❌ Error confirming payment on ${gateway}:`, error.message);
      return {
        success: false,
        error: error.message,
        gateway
      };
    }
  }

  /**
   * Process refund with the appropriate gateway
   * @param {String} gateway - Payment gateway name
   * @param {Object} refundData - Data needed for refund
   * @returns {Promise<Object>} Refund result
   */
  async processRefund(gateway, refundData) {
    try {
      switch (gateway.toLowerCase()) {
        case 'stripe':
          return await stripeService.processRefund(
            refundData.paymentIntentId,
            refundData.transactionId,
            refundData.refundAmount
          );
        
        case 'easypaisa':
          return await easyPaisaService.processRefund(
            refundData.transactionId,
            refundData.gatewayTransactionId,
            refundData.refundAmount
          );
        
        case 'jazzcash':
          return await jazzcashService.processRefund(
            refundData.transactionId,
            refundData.gatewayTransactionId,
            refundData.refundAmount
          );
        
        default:
          throw new Error(`Unknown gateway: ${gateway}`);
      }
    } catch (error) {
      console.error(`❌ Error processing refund on ${gateway}:`, error.message);
      return {
        success: false,
        error: error.message,
        gateway
      };
    }
  }

  /**
   * Handle webhook events from payment gateway
   * @param {String} gateway - Payment gateway name
   * @param {Object} event - Webhook event data
   * @returns {Promise<Object>} Event handling result
   */
  async handleWebhook(gateway, event) {
    try {
      switch (gateway.toLowerCase()) {
        case 'stripe':
          return await stripeService.handleWebhookEvent(event);
        
        case 'easypaisa':
          // Easypaisa typically uses callback approach
          console.log('📨 Easypaisa webhook received');
          return { handled: true, gateway: 'easypaisa' };
        
        case 'jazzcash':
          // JazzCash also uses callback approach
          console.log('📨 JazzCash webhook received');
          return { handled: true, gateway: 'jazzcash' };
        
        default:
          console.warn(`⚠️  Unknown gateway webhook: ${gateway}`);
          return { handled: false, gateway };
      }
    } catch (error) {
      console.error(`❌ Error handling webhook for ${gateway}:`, error.message);
      return {
        success: false,
        error: error.message,
        gateway
      };
    }
  }

  /**
   * Get transaction details from appropriate gateway
   * @param {String} gateway - Payment gateway name
   * @param {String} transactionId - Transaction ID
   * @returns {Promise<Object>} Transaction details
   */
  async getTransactionDetails(gateway, transactionId) {
    try {
      switch (gateway.toLowerCase()) {
        case 'stripe':
          return await stripeService.getTransactionDetails(transactionId);
        
        case 'easypaisa':
          return await easyPaisaService.getTransactionDetails(transactionId);
        
        case 'jazzcash':
          return await jazzcashService.getTransactionDetails(transactionId);
        
        default:
          throw new Error(`Unknown gateway: ${gateway}`);
      }
    } catch (error) {
      console.error(`❌ Error fetching transaction details from ${gateway}:`, error.message);
      return {
        success: false,
        error: error.message,
        gateway
      };
    }
  }

  /**
   * Get list of available payment gateways
   * @returns {Array} Available gateways
   */
  getAvailableGateways() {
    return [
      {
        name: 'stripe',
        displayName: 'Stripe',
        description: 'International card payments',
        type: 'card',
        priority: 1,
        isActive: Boolean(process.env.STRIPE_SECRET_KEY)
      },
      {
        name: 'easypaisa',
        displayName: 'Easypaisa',
        description: 'Pakistan mobile wallet',
        type: 'mobile_wallet',
        priority: 2,
        isActive: Boolean(process.env.EASYPAISA_STORE_ID && process.env.EASYPAISA_MERCHANT_ID)
      },
      {
        name: 'jazzcash',
        displayName: 'JazzCash',
        description: 'Pakistan mobile wallet',
        type: 'mobile_wallet',
        priority: 3,
        isActive: Boolean(process.env.JAZZCASH_MERCHANT_ID)
      }
    ].filter(gateway => gateway.isActive);
  }

  /**
   * Get primary/fallback gateway for an order
   * @param {String} userPreference - User's preferred gateway (optional)
   * @returns {String} Gateway to use
   */
  getPrimaryGateway(userPreference = null) {
    const availableGateways = this.getAvailableGateways();

    if (!availableGateways.length) {
      throw new Error('No payment gateways configured');
    }

    // If user has preference and it's available, use it
    if (userPreference) {
      const preferred = availableGateways.find(g => g.name === userPreference.toLowerCase());
      if (preferred) return preferred.name;
    }

    // Otherwise, return highest priority gateway
    return availableGateways.sort((a, b) => a.priority - b.priority)[0].name;
  }

  /**
   * Validate payment data before processing
   * @param {Object} paymentData - Payment data to validate
   * @returns {Object} Validation result
   */
  validatePaymentData(paymentData) {
    const errors = [];

    // Check required fields
    if (!paymentData.orderId) errors.push('Order ID is required');
    if (!paymentData.userId) errors.push('User ID is required');
    if (!paymentData.amount || paymentData.amount <= 0) errors.push('Amount must be greater than 0');
    if (!paymentData.currency) errors.push('Currency is required');

    // Validate email format if provided
    if (paymentData.customerEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(paymentData.customerEmail)) {
        errors.push('Invalid email format');
      }
    }

    // Validate phone format if provided
    if (paymentData.customerPhone) {
      const phoneRegex = /^[0-9\+\-\s\(\)]+$/;
      if (!phoneRegex.test(paymentData.customerPhone) || paymentData.customerPhone.length < 10) {
        errors.push('Invalid phone number format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}

export default new PaymentGatewayRouter();
