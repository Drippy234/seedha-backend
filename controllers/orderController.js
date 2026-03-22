const mongoose = require('mongoose');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

// Helper function to calculate delivery charge based on distance
// Formula: ₹20 base fee + ₹5 per km (rounded to nearest rupee)
const calculateDeliveryCharge = (distanceKm) => {
  return Math.round(20 + distanceKm * 5);
};

const placeOrder = async (req, res) => {
  try {
    const { customerId, restaurantId, items, totalAmount, deliveryAddress, paymentMethod, paymentStatus, deliveryLatitude, deliveryLongitude } = req.body;

    // Get restaurant location to calculate distance
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    let deliveryCharge = 0;
    let distanceKm = 0;

    // Calculate distance and delivery charge if location provided
    if (deliveryLatitude && deliveryLongitude && restaurant.location && restaurant.location.coordinates) {
      const [restLon, restLat] = restaurant.location.coordinates;
      distanceKm = calculateDistance(restLat, restLon, deliveryLatitude, deliveryLongitude);
      deliveryCharge = calculateDeliveryCharge(distanceKm);
    }

    const newOrder = new Order({
      customer: customerId,
      restaurant: restaurantId,
      items: items,
      totalAmount: totalAmount,
      deliveryCharge: deliveryCharge,
      distanceKm: distanceKm.toFixed(2),
      deliveryAddress: deliveryAddress,
      deliveryLocation: {
        type: 'Point',
        coordinates: [deliveryLongitude || 0, deliveryLatitude || 0]
      },
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: paymentStatus || 'Pending'
    });

    await newOrder.save();

    // Notify all online drivers via socket.io
    const io = req.app.get('io');
    if (io) {
      const populated = await newOrder.populate('restaurant', 'name address location');
      io.emit('new_order_available', {
        orderId: populated._id,
        restaurantName: populated.restaurant?.name,
        pickupAddress: populated.restaurant?.address,
        dropoffAddress: populated.deliveryAddress,
        payout: deliveryCharge,
        status: 'Pending',
      });
    }

    res.status(201).json({ 
      message: 'Order placed successfully!', 
      order: newOrder,
      deliveryCharge: deliveryCharge,
      distanceKm: distanceKm.toFixed(2)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error processing your order.' });
  }
};

const getRestaurantOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const orders = await Order.find({ restaurant: id })
      .populate('customer', 'name email phone') // Get customer details too!
      .populate('deliveryAgent', 'name phone') // 🚨 NEW: Get Driver details!
      .sort({ createdAt: -1 }); // Newest first
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching orders.' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, role } = req.body;

    const validStatuses = ['Pending', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Only delivery agents can mark an order as Delivered
    if (status === 'Delivered' && role !== 'delivery') {
      return res.status(403).json({ message: 'Only the delivery agent can mark an order as Delivered' });
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, { status }, { new: true })
      .populate('customer', 'name phone')
      .populate('deliveryAgent', 'name phone');

    if (!updatedOrder) return res.status(404).json({ message: 'Order not found' });

    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating status.' });
  }
};

const getRestaurantStats = async (req, res) => {
  try {
    const { id } = req.params;

    // Get timestamps for today boundary
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const matchQuery = {
      restaurant: new mongoose.Types.ObjectId(id),
      createdAt: { $gte: startOfDay }
    };

    const stats = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      res.json({ totalRevenue: stats[0].totalRevenue, orderCount: stats[0].orderCount });
    } else {
      res.json({ totalRevenue: 0, orderCount: 0 });
    }
  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).json({ message: 'Error fetching stats.' });
  }
};

// --- NEW: DELIVERY ASSIGNMENT LOGIC ---
const getUnassignedOrders = async (req, res) => {
  try {
    // Find orders that have no driver assigned (handles both missing field and explicit null)
    const orders = await Order.find({
      $or: [
        { deliveryAgent: { $exists: false } },
        { deliveryAgent: null }
      ],
      status: { $in: ['Pending', 'Preparing', 'Ready for Pickup'] }
    })
      .populate('restaurant', 'name location address')
      .sort({ createdAt: 1 }); // Oldest first (FIFO)

    res.json(orders);
  } catch (error) {
    console.error("Error fetching unassigned orders:", error);
    res.status(500).json({ message: 'Error fetching unassigned orders.' });
  }
};

const assignOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId } = req.body;

    // Find the order first to check its current status
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // If already assigned to someone else, reject
    if (order.deliveryAgent) {
      return res.status(409).json({ message: 'Order already claimed by another rider' });
    }

    // Only move to Out for Delivery if food is ready, otherwise keep current status
    const newStatus = order.status === 'Ready for Pickup' ? 'Out for Delivery' : order.status;

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { deliveryAgent: driverId, status: newStatus },
      { new: true }
    ).populate('restaurant customer');

    res.json({ message: 'Order Assigned Successfully', order: updatedOrder });
  } catch (error) {
    console.error("Error assigning order:", error);
    res.status(500).json({ message: 'Error assigning order.' });
  }
};

// Get customer orders (for order tracking after logout)
const getCustomerOrders = async (req, res) => {
  try {
    const { customerId } = req.params;
    const orders = await Order.find({ customer: customerId })
      .populate('restaurant', 'name address imageUrl')
      .populate('deliveryAgent', 'name phone')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching customer orders.' });
  }
};

// Get single order details (for tracking)
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate('restaurant', 'name address imageUrl location')
      .populate('customer', 'name phone')
      .populate('deliveryAgent', 'name phone');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching order details.' });
  }
};

// Get driver order history — active + past
const getDriverHistory = async (req, res) => {
  try {
    const { driverId } = req.params;
    const orders = await Order.find({ deliveryAgent: driverId })
      .populate('restaurant', 'name address')
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 });

    const activeOrder = orders.find(o => ['Out for Delivery', 'Preparing', 'Ready for Pickup'].includes(o.status)) || null;
    const pastOrders = orders.filter(o => ['Delivered', 'Cancelled'].includes(o.status));

    res.json({ activeOrder, pastOrders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching driver history.' });
  }
};

// Generate and send delivery OTP to customer
const generateDeliveryOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate('customer', 'name email')
      .populate('restaurant', 'name');

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status === 'Delivered') return res.status(400).json({ message: 'Order already delivered' });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    order.deliveryOtp = otp;
    order.deliveryOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
    await order.save();

    // Send OTP to customer email
    const sendEmail = require('../utils/sendEmail');
    await sendEmail({
      email: order.customer.email,
      subject: 'Your Delivery OTP - Seedha Order',
      message: `Your delivery confirmation OTP is: ${otp}\n\nShare this with the delivery rider to confirm your order has been delivered.\n\nThis OTP expires in 10 minutes.\n\nOrder: #ORDER-${order._id.toString().slice(-5).toUpperCase()}\nRestaurant: ${order.restaurant?.name}`,
    });

    res.json({ message: 'OTP sent to customer email' });
  } catch (error) {
    console.error('OTP generation error:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

// Verify delivery OTP and mark as Delivered
const verifyDeliveryOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    const order = await Order.findById(id)
      .populate('customer', 'name phone')
      .populate('deliveryAgent', 'name phone');

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status === 'Delivered') return res.status(400).json({ message: 'Order already delivered' });
    if (!order.deliveryOtp) return res.status(400).json({ message: 'No OTP generated. Request a new one.' });
    if (new Date() > order.deliveryOtpExpires) return res.status(400).json({ message: 'OTP has expired. Request a new one.' });
    if (order.deliveryOtp !== otp) return res.status(400).json({ message: 'Incorrect OTP' });

    order.status = 'Delivered';
    order.deliveryOtp = undefined;
    order.deliveryOtpExpires = undefined;
    await order.save();

    res.json({ message: 'Delivery confirmed', order });
  } catch (error) {
    console.error('OTP verify error:', error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
};// Get active driver order for resume
const getActiveDriverOrder = async (req, res) => {
  try {
    const { driverId } = req.params;
    const order = await Order.findOne({
      deliveryAgent: driverId,
      status: { $nin: ['Delivered', 'Cancelled'] }
    })
      .populate('restaurant', 'name address location')
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 });
    
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching active driver order.' });
  }
};

// Cancel order within 5 minutes
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate('deliveryAgent');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Check time diff
    const currentTime = new Date();
    const diffMs = currentTime - order.createdAt;
    const diffMins = diffMs / 1000 / 60;
    
    if (diffMins > 5) {
      return res.status(403).json({ message: 'Cancellation window has closed. The restaurant has started preparing your food.' });
    }
    
    // Update order status
    order.status = 'Cancelled';
    await order.save();
    
    // If driver assigned, update driver status
    if (order.deliveryAgent) {
      await User.findByIdAndUpdate(order.deliveryAgent._id, {
        isAvailable: true,
        currentOrder: null
      });
    }

    // Emit socket event to restaurant and driver
    const io = req.app.get('io');
    if (io) {
      io.emit('order_cancelled', {
        orderId: order._id,
        restaurantId: order.restaurant?.toString(),
        driverId: order.deliveryAgent?._id?.toString()
      });
    }

    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error cancelling order.' });
  }
};

module.exports = { 
  placeOrder, 
  getRestaurantOrders, 
  updateOrderStatus, 
  getRestaurantStats, 
  getUnassignedOrders, 
  assignOrder,
  getCustomerOrders,
  getOrderById,
  getDriverHistory,
  generateDeliveryOtp,
  verifyDeliveryOtp,
  getActiveDriverOrder,
  cancelOrder,
};