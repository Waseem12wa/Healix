import mongoose from 'mongoose';

const paymentTransactionSchema = new mongoose.Schema({
  // Transaction Identification
  transactionId: {
    type: String,
    unique: true,
    required: true,
    index: true
    // Format: TXN-TIMESTAMP-GATEWAY-RANDOM
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Payment Gateway Information
  gateway: {
    type: String,
    enum: ['stripe', 'paypal', 'nayapay', 'easypaisa', 'jazzcash'],
    required: true,
    index: true
  },
  gatewayTransactionId: {
    type: String,
    required: true,
    index: true
  },
  gatewayReference: String, // Additional reference from gateway
  
  // Amount Details
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'PKR',
    enum: ['PKR', 'USD']
  },
  
  // Transaction Status (detailed flow)
  status: {
    type: String,
    enum: [
      'initiated',
      'pending',
      'authorized',
      'captured',
      'succeeded',
      'failed',
      'declined',
      'expired',
      'cancelled',
      'refunded'
    ],
    default: 'initiated',
    index: true
  },
  
  // Payment Method
  paymentMethod: {
    type: String,
    enum: ['card', 'mobile_wallet', 'bank_transfer', 'paypal', 'nayapay', 'easypaisa', 'jazzcash'],
    required: true
  },
  
  // Card/Wallet Details (if applicable)
  cardDetails: {
    last4Digits: String,
    cardBrand: String, // Visa, Mastercard, etc.
    expiryMonth: Number,
    expiryYear: Number,
    cardHolderName: String
  },
  walletDetails: {
    phoneNumber: String,
    walletName: String // Easypaisa/JazzCash account info
  },
  
  // Request & Response Data
  requestData: {
    amount: Number,
    currency: String,
    description: String,
    clientIp: String,
    userAgent: String
  },
  responseData: {
    message: String,
    code: String,
    rawResponse: mongoose.Schema.Types.Mixed // Store full gateway response
  },
  
  // Error Handling
  errorDetails: {
    code: String,
    message: String,
    retryable: Boolean
  },
  
  // Refund Information
  refundInfo: {
    isRefunded: {
      type: Boolean,
      default: false
    },
    refundAmount: Number,
    refundDate: Date,
    refundReason: String,
    refundGatewayId: String
  },
  
  // Retry Attempt Tracking
  attemptNumber: {
    type: Number,
    default: 1
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  
  // Metadata
  metadata: {
    ipAddress: String,
    deviceType: String,
    location: String,
    userAgent: String
  },
  
  // Settlement Information
  settled: {
    type: Boolean,
    default: false
  },
  settlementDate: Date,
  settlementAmount: Number,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  initiatedAt: Date,
  completedAt: Date,
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to generate transaction ID
paymentTransactionSchema.pre('save', async function(next) {
  if (!this.transactionId) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.transactionId = `TXN-${timestamp}-${this.gateway.toUpperCase()}-${random}`;
  }
  this.updatedAt = Date.now();
  next();
});

// Index for common queries
paymentTransactionSchema.index({ transactionId: 1, gateway: 1 });
paymentTransactionSchema.index({ status: 1, createdAt: -1 });
paymentTransactionSchema.index({ userId: 1, createdAt: -1 });

// Instance method to mark as successful
paymentTransactionSchema.methods.markSuccessful = function(gatewayResponse) {
  this.status = 'succeeded';
  this.completedAt = new Date();
  this.responseData = gatewayResponse;
  return this.save();
};

// Instance method to mark as failed
paymentTransactionSchema.methods.markFailed = function(errorMessage, errorCode) {
  this.status = 'failed';
  this.completedAt = new Date();
  this.errorDetails = {
    message: errorMessage,
    code: errorCode,
    retryable: this.attemptNumber < this.maxRetries
  };
  return this.save();
};

// Instance method to process refund
paymentTransactionSchema.methods.processRefund = function(refundAmount, reason) {
  this.refundInfo = {
    isRefunded: true,
    refundAmount: refundAmount || this.amount,
    refundDate: new Date(),
    refundReason: reason
  };
  this.status = 'refunded';
  return this.save();
};

// Instance method to retry payment
paymentTransactionSchema.methods.canRetry = function() {
  return this.attemptNumber < this.maxRetries && this.errorDetails?.retryable;
};

// Static method to get transaction by reference
paymentTransactionSchema.statics.findByGatewayRef = function(gatewayId, gateway) {
  return this.findOne({
    gatewayTransactionId: gatewayId,
    gateway: gateway
  });
};

// Static method to get settlement pending transactions
paymentTransactionSchema.statics.findPendingSettlement = function() {
  return this.find({
    status: 'succeeded',
    settled: false,
    completedAt: { $exists: true }
  }).sort({ completedAt: 1 });
};

// Static method for transaction summary
paymentTransactionSchema.statics.getTransactionSummary = function(startDate, endDate, gateway) {
  const query = {
    createdAt: { $gte: startDate, $lte: endDate },
    status: 'succeeded'
  };
  
  if (gateway) {
    query.gateway = gateway;
  }
  
  return this.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$gateway',
        totalAmount: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
        averageAmount: { $avg: '$amount' }
      }
    }
  ]);
};

export default mongoose.model('PaymentTransaction', paymentTransactionSchema);
