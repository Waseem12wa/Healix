import mongoose from 'mongoose';

const medicineInventorySchema = new mongoose.Schema({
  // Basic Information
  medicineName: {
    type: String,
    required: true,
    index: true,
    lowercase: true,
    trim: true
  },
  genericName: String,
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    default: null
  },
  providerName: {
    type: String,
    default: ''
  },
  
  // Medicine Details (from existing system)
  activeIngredients: [String],
  category: String,
  therapeuticUse: String,
  commonDosage: String,
  
  // Inventory Management
  quantity: {
    type: Number,
    default: 0,
    min: 0
  },
  reorderLevel: {
    type: Number,
    default: 50,
    description: 'Alert when quantity falls below this'
  },
  reorderQuantity: {
    type: Number,
    default: 500,
    description: 'Default quantity to reorder'
  },
  
  // Pricing
  costPrice: {
    type: Number,
    required: true,
    description: 'Cost to acquire from supplier'
  },
  sellingPrice: {
    type: Number,
    required: true,
    description: 'Price charged to customers'
  },
  currency: {
    type: String,
    default: 'PKR',
    enum: ['PKR', 'USD']
  },
  
  // Supplier Information
  supplier: {
    name: String,
    contactPerson: String,
    phone: String,
    email: String,
    address: String
  },
  
  // Regulatory & Safety
  batchNumber: String,
  manufacturingDate: Date,
  expiryDate: {
    type: Date,
    index: true
  },
  isExpired: {
    type: Boolean,
    default: false,
    index: true
  },
  storageConditions: String, // e.g., "Room temperature", "Refrigerated"
  sideEffects: [String],
  contraindications: [String],
  interactions: [String],
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isPrescriptionRequired: {
    type: Boolean,
    default: false
  },
  
  // Tracking
  totalSales: {
    type: Number,
    default: 0
  },
  lastRestockDate: Date,
  lastSoldDate: Date,
  
  // Images & Documentation
  imageUrl: String,
  description: {
    type: String,
    default: ''
  },
  documentUrl: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to mark as expired
medicineInventorySchema.pre('save', function(next) {
  if (this.expiryDate && this.expiryDate < new Date()) {
    this.isExpired = true;
  }
  this.updatedAt = Date.now();
  next();
});

// Index for common queries
medicineInventorySchema.index({ medicineName: 1, isActive: 1 });
medicineInventorySchema.index({ expiryDate: 1, isActive: 1 });
medicineInventorySchema.index({ quantity: 1, reorderLevel: 1 });
medicineInventorySchema.index({ providerId: 1, isActive: 1, createdAt: -1 });

// Instance method to check stock availability
medicineInventorySchema.methods.isInStock = function(requestedQuantity = 1) {
  return this.quantity >= requestedQuantity && !this.isExpired && this.isActive;
};

// Instance method to reduce stock
medicineInventorySchema.methods.reduceStock = function(quantity) {
  if (this.quantity >= quantity) {
    this.quantity -= quantity;
    this.lastSoldDate = new Date();
    return this.save();
  }
  throw new Error('Insufficient stock');
};

// Instance method to increase stock
medicineInventorySchema.methods.increaseStock = function(quantity) {
  this.quantity += quantity;
  this.lastRestockDate = new Date();
  return this.save();
};

// Instance method to get stock status
medicineInventorySchema.methods.getStockStatus = function() {
  if (this.isExpired) return 'expired';
  if (this.quantity === 0) return 'out_of_stock';
  if (this.quantity <= this.reorderLevel) return 'low_stock';
  return 'in_stock';
};

// Static method to find low stock items
medicineInventorySchema.statics.findLowStock = function() {
  return this.find({
    $expr: { $lte: ['$quantity', '$reorderLevel'] },
    isActive: true,
    isExpired: false
  });
};

// Static method to find expired medicines
medicineInventorySchema.statics.findExpired = function() {
  return this.find({
    expiryDate: { $lt: new Date() },
    isExpired: false
  });
};

// Static method to search medicines
medicineInventorySchema.statics.searchMedicines = function(searchTerm) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    $or: [
      { medicineName: regex },
      { genericName: regex },
      { activeIngredients: regex }
    ],
    isActive: true,
    isExpired: false
  });
};

export default mongoose.model('MedicineInventory', medicineInventorySchema);
