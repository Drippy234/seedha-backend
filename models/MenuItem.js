const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  // Links this food item to a specific restaurant
  restaurant: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Restaurant', 
    required: true 
  },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String, required: true }, // e.g., 'Biryani', 'Pizza'
  isAvailable: { type: Boolean, default: true }, // So they can toggle it out of stock
  imageUrl: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);