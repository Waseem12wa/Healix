import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
import PaymentTransaction from '../models/PaymentTransaction.js';
import Order from '../models/Order.js';

dotenv.config();

class EasyPaisaPaymentService {
  constructor() {
    this.apiURL = process.env.EASYPAISA_API_URL || 'https://sandbox.easypaisa.com.pk/api/v2';
    this.storeId = process.env.EASYPAISA_STORE_ID;
    this.merchantId = process.env.EASYPAISA_MERCHANT_ID;
    this.password = process.env.EASYPAISA_PASSWORD;
    this.successUrl = process.env.EASYPAISA_SUCCESS_URL || 'http://localhost:5173/payment/success';
    this.failureUrl = process.env.EASYPAISA_FAILURE_URL || 'http://localhost:5173/payment/failure';
  }

  /**
   * Create payment session/intent for Easypaisa
   * @param {Object} orderData - Order information
   * @returns {Promise<Object>} Payment session details
   */
  async createPaymentSession(orderData) {
    try {
      const { orderId, userId, amount, currency = 'PKR', description } = orderData;

      // Easypaisa requires amount in cents
      const amountInPaisa = Math.round(amount * 100);

      // Generate auth token
      const authToken = this._generateAuthToken();

      const paymentData = {
        storeId: this.storeId,
        authToken: authToken,
        amount: amountInPaisa,
        orderRefNum: orderId.toString(),
        orderDetails: description || `Order ${orderId}`,
        customerEmail: orderData.customerEmail,
        customerPhoneNumber: orderData.customerPhone,
        transactionType: 1, // 1 = Normal transaction
        notificationUrl: `${process.env.BACKEND_URL}/api/payments/easypaisa-webhook`,
        returnUrl: this.successUrl
      };

      // Create transaction record
      const transaction = await PaymentTransaction.create({
        orderId,
        userId,
        gateway: 'easypaisa',
        paymentMethod: 'mobile_wallet',
        amount,
        currency,
        status: 'initiated',
        requestData: {
          amount,
          currency,
          description
        },
        walletDetails: {
          phoneNumber: orderData.customerPhone
        }
      });

      // Generate payment URL for redirect
      const paymentURL = this._generatePaymentURL(paymentData);

      return {
        success: true,
        paymentURL: paymentURL,
        transactionId: transaction._id,
        gatewayTransactionId: paymentData.orderRefNum,
        message: 'Payment session created successfully'
      };
    } catch (error) {
      console.error('❌ Easypaisa Session Creation Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify payment response from Easypaisa
   * @param {Object} responseData - Data returned from Easypaisa
   * @returns {Promise<Object>} Verification result
   */
  async verifyPaymentResponse(responseData) {
    try {
      const { tranRef, storeId, amount, status, orderRefNum } = responseData;

      // Validate response signature
      const isValid = this._validateResponseSignature(responseData);

      if (!isValid) {
        throw new Error('Invalid response signature');
      }

      // Find transaction
      let transaction = await PaymentTransaction.findOne({
        'walletDetails.phoneNumber': responseData.customerPhone,
        gateway: 'easypaisa'
      }).sort({ createdAt: -1 });

      if (!transaction) {
        transaction = await PaymentTransaction.create({
          orderId: responseData.orderId,
          userId: responseData.userId,
          gateway: 'easypaisa',
          gatewayTransactionId: tranRef,
          gatewayReference: orderRefNum,
          paymentMethod: 'easypaisa',
          amount: amount / 100,
          currency: 'PKR',
          status: 'initiated'
        });
      }

      // Check payment status
      if (status === '1' || status === 1) {
        // Success
        transaction.status = 'succeeded';
        transaction.completedAt = new Date();
        transaction.responseData = {
          message: 'Payment successful',
          code: 'SUCCESS',
          rawResponse: responseData
        };
        
        transaction.walletDetails = {
          phoneNumber: responseData.customerPhone,
          walletName: 'Easypaisa'
        };

        await transaction.save();

        // Update order
        const order = await Order.findById(transaction.orderId);
        if (order) {
          await order.markPaymentComplete();
        }

        return {
          success: true,
          status: 'succeeded',
          message: 'Payment verified and confirmed',
          transaction: transaction
        };
      } else if (status === '0' || status === 0) {
        // Pending
        transaction.status = 'pending';
        await transaction.save();
        
        return {
          success: true,
          status: 'pending',
          message: 'Payment is pending',
          transaction: transaction
        };
      } else {
        // Failed
        transaction.status = 'failed';
        transaction.errorDetails = {
          message: 'Payment declined by gateway',
          code: status
        };
        await transaction.save();

        return {
          success: false,
          status: 'failed',
          message: 'Payment failed',
          transaction: transaction
        };
      }
    } catch (error) {
      console.error('❌ Easypaisa Response Verification Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Refund a payment
   * @param {String} transactionId - Our transaction ID
   * @param {String} originalTranRef - Original Easypaisa transaction reference
   * @param {Number} refundAmount - Amount to refund
   * @returns {Promise<Object>} Refund result
   */
  async processRefund(transactionId, originalTranRef, refundAmount = null) {
    try {
      const transaction = await PaymentTransaction.findById(transactionId);

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      const authToken = this._generateAuthToken();
      const amountInPaisa = refundAmount ? Math.round(refundAmount * 100) : (transaction.amount * 100);

      const refundData = {
        storeId: this.storeId,
        authToken: authToken,
        transactionRef: originalTranRef,
        amount: amountInPaisa
      };

      // Call Easypaisa refund API
      const response = await axios.post(
        `${this.apiURL}/refund`,
        refundData,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data.responseCode === '00') {
        // Refund successful
        await transaction.processRefund(refundAmount, 'Easypaisa refund processed');

        return {
          success: true,
          message: 'Refund processed successfully',
          refundId: response.data.transactionRef,
          amount: amountInPaisa / 100
        };
      } else {
        throw new Error(response.data.responseMessage || 'Refund failed');
      }
    } catch (error) {
      console.error('❌ Easypaisa Refund Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Query transaction status
   * @param {String} tranRef - Easypaisa transaction reference
   * @returns {Promise<Object>} Transaction status
   */
  async queryTransactionStatus(tranRef) {
    try {
      const authToken = this._generateAuthToken();

      const response = await axios.post(
        `${this.apiURL}/query`,
        {
          storeId: this.storeId,
          authToken: authToken,
          transactionRef: tranRef
        },
        {
          timeout: 10000
        }
      );

      return {
        success: true,
        status: response.data.status,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Easypaisa Query Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate auth token for Easypaisa
   * @private
   * @returns {String} Auth token
   */
  _generateAuthToken() {
    // Easypaisa uses MD5 hash for authentication
    const hashString = `${this.merchantId}${this.password}`;
    return crypto.createHash('md5').update(hashString).digest('hex');
  }

  /**
   * Validate response signature
   * @private
   * @param {Object} data - Response data
   * @returns {Boolean} Is signature valid
   */
  _validateResponseSignature(data) {
    try {
      // Create signature from data
      const signatureString = `${data.tranRef}${data.storeId}${this.password}`;
      const expectedSignature = crypto
        .createHash('md5')
        .update(signatureString)
        .digest('hex');

      return expectedSignature === data.signature;
    } catch (error) {
      console.error('Signature validation error:', error.message);
      return false;
    }
  }

  /**
   * Generate payment URL
   * @private
   * @param {Object} data - Payment data
   * @returns {String} Easypaisa payment URL
   */
  _generatePaymentURL(data) {
    // Build query string
    const params = new URLSearchParams({
      action: 'checkout',
      storeId: data.storeId,
      authToken: data.authToken,
      amount: data.amount,
      orderRefNum: data.orderRefNum,
      orderDetails: data.orderDetails,
      customerEmail: data.customerEmail,
      customerPhoneNumber: data.customerPhoneNumber,
      transactionType: data.transactionType,
      notificationUrl: data.notificationUrl,
      returnUrl: data.returnUrl
    });

    return `${this.apiURL}/checkout?${params.toString()}`;
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

export default new EasyPaisaPaymentService();
