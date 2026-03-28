import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  // Order Identification
  orderNumber: {
    type: String,
    unique: true,
    required: true,
    index: true
    // Format: ORD-TIMESTAMP-RANDOMID
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Medicine Details
  medicines: [{
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicineInventory',
      required: true
    },
    medicineName: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true
    },
    subtotal: {
      type: Number,
      required: true
    }
  }],
  
  // Pricing
  totalAmount: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'PKR',
    enum: ['PKR', 'USD']
  },
  
  // Payment Information
  paymentGateway: {
    type: String,
    enum: ['stripe', 'paypal', 'nayapay', 'easypaisa', 'jazzcash'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'success', 'failed', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  paymentIntentId: String, // Stripe intent ID or gateway transaction ID
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentTransaction'
  },
  
  // Order Status
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Delivery Information
  deliveryAddress: {
    fullName: String,
    phone: String,
    address: String,
    city: String,
    postalCode: String,
    country: {
      type: String,
      default: 'Pakistan'
    }
  },
  
  // Additional Details
  notes: String,
  estimatedDeliveryDate: Date,
  actualDeliveryDate: Date,
  
  // Admin Fields
  processingNotes: String,
  assignedPharmacy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  paymentCompletedAt: Date,
  deliveredAt: Date
});

// Middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  this.updatedAt = Date.now();
  next();
});

// Update finalAmount when medicines or discount changes
orderSchema.pre('save', function(next) {
  if (this.isModified('medicines') || this.isModified('discount')) {
    this.totalAmount = this.medicines.reduce((sum, item) => sum + item.subtotal, 0);
    this.finalAmount = this.totalAmount + this.tax - this.discount;
  }
  next();
});

// Virtual to get user details (for populated responses)
orderSchema.virtual('userDetails', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Instance method to mark payment as complete
orderSchema.methods.markPaymentComplete = function() {
  this.paymentStatus = 'success';
  this.orderStatus = 'confirmed';
  this.paymentCompletedAt = new Date();
  return this.save();
};

// Instance method to cancel order
orderSchema.methods.cancelOrder = function(reason) {
  this.orderStatus = 'cancelled';
  this.paymentStatus = 'cancelled';
  this.notes = reason;
  return this.save();
};

// Static method to create new order
orderSchema.statics.createOrder = async function(userId, medicines, paymentGateway) {
  const totalAmount = medicines.reduce((sum, item) => sum + item.subtotal, 0);
  
  const order = new this({
    userId,
    medicines,
    totalAmount,
    finalAmount: totalAmount,
    paymentGateway,
    paymentStatus: 'pending',
    orderStatus: 'pending'
  });
  
  return await order.save();
};

export default mongoose.model('Order', orderSchema);
