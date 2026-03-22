const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: false, // Optional for now so we don't break existing data
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['customer', 'restaurant', 'delivery'],
    default: 'customer',
  },
  // --- OTP VERIFICATION FIELDS ---
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },

  // 🚨 NEW: Links the owner directly to their Restaurant! 🚨
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },

  // --- DELIVERY DRIVER FIELDS ---
  isOnline: { type: Boolean, default: false },
  verificationStatus: { type: String, enum: ['unverified', 'pending', 'approved', 'rejected'], default: 'unverified' },
  verificationIdImageUrl: { type: String },
  verificationVehicleImageUrl: { type: String },
  currentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },
  isAvailable: { type: Boolean, default: true },
  currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  
  // --- DRIVER SUBSCRIPTION ---
  subscriptionStatus: { type: Boolean, default: false },
  subscriptionExpiry: { type: Date },
  paymentHistory: { type: Array, default: [] },

  // --- PASSWORD RESET FIELDS ---
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date }

}, {
  timestamps: true
});

// Create geospatial index for driver location tracking
userSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.model('User', userSchema);