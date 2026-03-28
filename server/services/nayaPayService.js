import PaymentTransaction from '../models/PaymentTransaction.js';

class NayaPayService {
  constructor() {
    this.successUrl = process.env.NAYAPAY_SUCCESS_URL || 'http://localhost:5173/shop/orders';
    this.failureUrl = process.env.NAYAPAY_FAILURE_URL || 'http://localhost:5173/shop/checkout?status=failed';
  }

  async createPaymentSession(orderData) {
    try {
      const { orderId, userId, amount, currency = 'PKR' } = orderData;

      const reference = `NAYA-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      const transaction = await PaymentTransaction.create({
        orderId,
        userId,
        gateway: 'nayapay',
        paymentMethod: 'nayapay',
        gatewayTransactionId: reference,
        amount,
        currency,
        status: 'initiated',
        requestData: {
          amount,
          currency,
          description: orderData.description || `Order ${orderId}`,
        },
        walletDetails: {
          walletName: 'NayaPay'
        }
      });

      // Placeholder hosted checkout URL format for local flow simulation.
      const redirectUrl = `${this.successUrl}?gateway=nayapay&transactionId=${transaction._id}&status=succeeded`;

      return {
        success: true,
        gateway: 'nayapay',
        redirectUrl,
        transactionId: transaction._id,
        gatewayTransactionId: reference,
        message: 'NayaPay payment session created'
      };
    } catch (error) {
      console.error('❌ NayaPay Session Creation Error:', error.message);
      return {
        success: false,
        gateway: 'nayapay',
        error: error.message,
      };
    }
  }

  async verifyPaymentResponse(responseData) {
    try {
      const { transactionId, status } = responseData;
      const transaction = await PaymentTransaction.findById(transactionId);

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      transaction.status = status === 'succeeded' ? 'succeeded' : 'failed';
      transaction.completedAt = new Date();
      transaction.responseData = {
        message: status === 'succeeded' ? 'NayaPay payment successful' : 'NayaPay payment failed',
        code: status || 'unknown',
        rawResponse: responseData,
      };
      await transaction.save();

      return {
        success: status === 'succeeded',
        gateway: 'nayapay',
        transaction
      };
    } catch (error) {
      return {
        success: false,
        gateway: 'nayapay',
        error: error.message
      };
    }
  }
}

export default new NayaPayService();
