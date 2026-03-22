const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  deliveryAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // 🚨 NEW: Links order to rider
  items: [{
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    name: String,
    quantity: Number,
    price: Number
  }],
  totalAmount: { type: Number, required: true },
  deliveryCharge: { type: Number, default: 0 },
  distanceKm: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Pending', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  deliveryAddress: { type: String, default: 'College Campus' },
  deliveryLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },

  // --- DELIVERY OTP FIELDS ---
  deliveryOtp: { type: String },
  deliveryOtpExpires: { type: Date },

  // --- NEW PAYMENT FIELDS ---
  paymentMethod: {
    type: String,
    enum: ['COD', 'ONLINE'],
    default: 'COD'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);