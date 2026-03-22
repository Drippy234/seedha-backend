const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  // Links this restaurant to the specific user account that owns it
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  name: { type: String, required: true },
  address: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },
  
  // --- THE SUBSCRIPTION MODEL ---
  isSubscribed: { type: Boolean, default: false },
  subscriptionExpiresAt: { type: Date }, // Tells us when they need to pay again
  
}, { timestamps: true });

// Create geospatial index for location-based queries
restaurantSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Restaurant', restaurantSchema);