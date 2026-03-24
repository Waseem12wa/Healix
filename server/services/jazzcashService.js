import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
import PaymentTransaction from '../models/PaymentTransaction.js';
import Order from '../models/Order.js';

dotenv.config();

class JazzCashPaymentService {
  constructor() {
    this.apiURL = process.env.JAZZCASH_API_URL || 'https://sandbox.jazzcash.com.pk/applicationapi/api';
    this.merchantId = process.env.JAZZCASH_MERCHANT_ID;
    this.merchantPassword = process.env.JAZZCASH_MERCHANT_PASSWORD;
    this.integrationType = process.env.JAZZCASH_INTEGRATION_TYPE || 'MERCHANT_DIRECT'; // or MOBILE_ACCOUNT
    this.successUrl = process.env.JAZZCASH_SUCCESS_URL || 'http://localhost:5173/payment/success';
    this.failureUrl = process.env.JAZZCASH_FAILURE_URL || 'http://localhost:5173/payment/failure';
  }

  /**
   * Create payment session for JazzCash
   * @param {Object} orderData - Order information
   * @returns {Promise<Object>} Payment session details
   */
  async createPaymentSession(orderData) {
    try {
      const { orderId, userId, amount, currency = 'PKR', description } = orderData;

      // Generate reference number
      const referenceNumber = this._generateReferenceNumber();

      // Create payment data
      const paymentData = {
        pp_Version: '1.1',
        pp_TxnType: 'MWALLET',
        pp_Language: 'en',
        pp_MerchantID: this.merchantId,
        pp_SubMerchantID: '',
        pp_Password: this._hashPassword(this.merchantPassword),
        pp_BankID: '',
        pp_ProductID: '',
        pp_TxnRefNo: referenceNumber,
        pp_Amount: Math.round(amount * 100).toString(), // In paisa
        pp_TxnCurrency: currency,
        pp_TxnDateTime: this._getCurrentDateTime(),
        pp_BillReference: 'REF' + orderId.toString(),
        pp_Description: description || `Order ${orderId}`,
        pp_TxnExpiryDateTime: this._getExpiryDateTime(),
        pp_ReturnURL: `${process.env.BACKEND_URL}/api/payments/jazzcash-callback`,
        pp_NotificationURL: `${process.env.BACKEND_URL}/api/payments/jazzcash-webhook`,
        pp_CustomerEmail: orderData.customerEmail,
        pp_CustomerMobile: orderData.customerPhone,
        pp_CustomerID: userId.toString()
      };

      // Sign the request
      paymentData.pp_SecureHash = this._generateSecureHash(paymentData);

      // Create transaction record
      const transaction = await PaymentTransaction.create({
        orderId,
        userId,
        gateway: 'jazzcash',
        gatewayTransactionId: referenceNumber,
        paymentMethod: 'mobile_wallet',
        amount,
        currency,
        status: 'initiated',
        requestData: {
          amount,
          currency,
          description,
          referenceNumber
        },
        walletDetails: {
          phoneNumber: orderData.customerPhone,
          walletName: 'JazzCash'
        }
      });

      // Generate payment URL
      const paymentURL = this._generatePaymentURL(paymentData);

      return {
        success: true,
        paymentURL: paymentURL,
        transactionId: transaction._id,
        gatewayTransactionId: referenceNumber,
        message: 'Payment session created successfully'
      };
    } catch (error) {
      console.error('❌ JazzCash Session Creation Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify payment response from JazzCash
   * @param {Object} responseData - Data returned from JazzCash
   * @returns {Promise<Object>} Verification result
   */
  async verifyPaymentResponse(responseData) {
    try {
      const { pp_TxnRefNo, pp_ResponseCode, pp_ResponseMessage, pp_Amount } = responseData;

      // Validate response signature
      const isValid = this._validateResponseSignature(responseData);

      if (!isValid) {
        throw new Error('Invalid response signature');
      }

      // Find transaction
      let transaction = await PaymentTransaction.findOne({
        gatewayTransactionId: pp_TxnRefNo,
        gateway: 'jazzcash'
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Check payment status
      if (pp_ResponseCode === '000') {
        // Success
        transaction.status = 'succeeded';
        transaction.completedAt = new Date();
        transaction.responseData = {
          message: pp_ResponseMessage || 'Payment successful',
          code: pp_ResponseCode,
          rawResponse: responseData
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
      } else {
        // Failed
        transaction.status = 'failed';
        transaction.errorDetails = {
          message: pp_ResponseMessage || 'Payment failed',
          code: pp_ResponseCode
        };
        await transaction.save();

        return {
          success: false,
          status: 'failed',
          message: pp_ResponseMessage || 'Payment could not be completed',
          transaction: transaction
        };
      }
    } catch (error) {
      console.error('❌ JazzCash Response Verification Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process refund request
   * @param {String} transactionId - Our transaction ID
   * @param {String} originalRefNum - Original JazzCash reference number
   * @param {Number} refundAmount - Amount to refund
   * @returns {Promise<Object>} Refund result
   */
  async processRefund(transactionId, originalRefNum, refundAmount = null) {
    try {
      const transaction = await PaymentTransaction.findById(transactionId);

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Generate refund reference
      const refundReferenceNumber = `REFUND-${originalRefNum}`;

      const refundData = {
        pp_Version: '1.1',
        pp_TxnType: 'MWALLET_REVERSAL',
        pp_Language: 'en',
        pp_MerchantID: this.merchantId,
        pp_Password: this._hashPassword(this.merchantPassword),
        pp_TxnRefNo: refundReferenceNumber,
        pp_OriginalTxnRefNo: originalRefNum,
        pp_Amount: refundAmount ? Math.round(refundAmount * 100).toString() : (transaction.amount * 100).toString(),
        pp_TxnDateTime: this._getCurrentDateTime()
      };

      // Sign the refund request
      refundData.pp_SecureHash = this._generateSecureHash(refundData);

      // Call JazzCash refund API
      const response = await axios.post(
        `${this.apiURL}/Transaction/DoReversal`,
        refundData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 15000
        }
      );

      if (response.data.pp_ResponseCode === '000') {
        // Refund successful
        await transaction.processRefund(
          refundAmount,
          'JazzCash refund processed successfully'
        );

        return {
          success: true,
          message: 'Refund processed successfully',
          transactionRef: refundReferenceNumber,
          amount: refundAmount || transaction.amount,
          response: response.data
        };
      } else {
        throw new Error(response.data.pp_ResponseMessage || 'Refund failed');
      }
    } catch (error) {
      console.error('❌ JazzCash Refund Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check balance (for MOBILE_ACCOUNT integration)
   * @param {String} mobileNumber - Mobile number to check balance
   * @returns {Promise<Object>} Balance information
   */
  async checkBalance(mobileNumber) {
    try {
      const balanceData = {
        pp_Version: '1.1',
        pp_TxnType: 'GET_BALANCE',
        pp_Language: 'en',
        pp_MerchantID: this.merchantId,
        pp_Password: this._hashPassword(this.merchantPassword),
        pp_CustomerMobile: mobileNumber,
        pp_TxnDateTime: this._getCurrentDateTime()
      };

      balanceData.pp_SecureHash = this._generateSecureHash(balanceData);

      const response = await axios.post(
        `${this.apiURL}/Account/GetBalance`,
        balanceData,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 10000
        }
      );

      if (response.data.pp_ResponseCode === '000') {
        return {
          success: true,
          balance: response.data.pp_Balance,
          currency: response.data.pp_Currency
        };
      } else {
        throw new Error(response.data.pp_ResponseMessage || 'Failed to check balance');
      }
    } catch (error) {
      console.error('❌ JazzCash Balance Check Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Hash password for JazzCash
   * @private
   * @param {String} password - Raw password
   * @returns {String} Hashed password
   */
  _hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  /**
   * Generate secure hash for JazzCash request
   * @private
   * @param {Object} data - Data object to hash
   * @returns {String} Secure hash
   */
  _generateSecureHash(data) {
    // JazzCash uses specific field order for hash generation
    let hashString = '';

    if (data.pp_TxnType === 'MWALLET') {
      hashString = `${data.pp_MerchantID}${data.pp_Password}${data.pp_TxnType}${data.pp_Language}${data.pp_MerchantID}${data.pp_SubMerchantID}${data.pp_Password}${data.pp_BankID}${data.pp_ProductID}${data.pp_TxnRefNo}${data.pp_Amount}${data.pp_TxnCurrency}${data.pp_TxnDateTime}${data.pp_BillReference}${data.pp_Description}${data.pp_TxnExpiryDateTime}${data.pp_ReturnURL}${data.pp_NotificationURL}${data.pp_CustomerEmail}${data.pp_CustomerMobile}${data.pp_CustomerID}`;
    } else if (data.pp_TxnType === 'MWALLET_REVERSAL') {
      hashString = `${data.pp_MerchantID}${data.pp_Password}${data.pp_TxnType}${data.pp_Language}${data.pp_MerchantID}${data.pp_Password}${data.pp_TxnRefNo}${data.pp_OriginalTxnRefNo}${data.pp_Amount}${data.pp_TxnDateTime}`;
    }

    return crypto.createHash('sha256').update(hashString).digest('hex');
  }

  /**
   * Validate response signature
   * @private
   * @param {Object} data - Response data
   * @returns {Boolean} Is signature valid
   */
  _validateResponseSignature(data) {
    try {
      const expectedHash = this._generateSecureHash(data);
      return expectedHash === data.pp_SecureHash;
    } catch (error) {
      console.error('Signature validation error:', error.message);
      return false;
    }
  }

  /**
   * Generate reference number
   * @private
   * @returns {String} Reference number
   */
  _generateReferenceNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `JCH${timestamp}${random}`;
  }

  /**
   * Get current date time in JazzCash format
   * @private
   * @returns {String} Formatted datetime
   */
  _getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${date}${month}${year}${hours}${minutes}${seconds}`;
  }

  /**
   * Get expiry datetime (24 hours from now)
   * @private
   * @returns {String} Formatted expiry datetime
   */
  _getExpiryDateTime() {
    const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const year = expiryDate.getFullYear();
    const month = String(expiryDate.getMonth() + 1).padStart(2, '0');
    const date = String(expiryDate.getDate()).padStart(2, '0');
    const hours = String(expiryDate.getHours()).padStart(2, '0');
    const minutes = String(expiryDate.getMinutes()).padStart(2, '0');
    const seconds = String(expiryDate.getSeconds()).padStart(2, '0');

    return `${date}${month}${year}${hours}${minutes}${seconds}`;
  }

  /**
   * Generate payment URL
   * @private
   * @param {Object} data - Payment data
   * @returns {String} JazzCash payment URL
   */
  _generatePaymentURL(data) {
    const params = new URLSearchParams(data);
    return `${this.apiURL}/Payment/DoTransaction?${params.toString()}`;
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

export default new JazzCashPaymentService();
