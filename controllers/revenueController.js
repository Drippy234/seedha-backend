const mongoose = require('mongoose');
const Order = require('../models/Order');

const getTodayRevenue = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const restaurantObjId = new mongoose.Types.ObjectId(restaurantId);

    const result = await Order.aggregate([
      {
        $match: {
          restaurant: restaurantObjId,
          createdAt: { $gte: startOfDay },
        },
      },
      {
        $facet: {
          // Online: count only non-cancelled orders
          onlineOrders: [
            {
              $match: {
                paymentMethod: 'ONLINE',
                status: { $ne: 'Cancelled' },
              },
            },
          ],
          // COD: count only delivered orders
          codOrders: [
            {
              $match: {
                paymentMethod: 'COD',
                status: 'Delivered',
              },
            },
          ],
        },
      },
      {
        $project: {
          onlineOrders: 1,
          codOrders: 1,
          onlineRevenue: { $sum: '$onlineOrders.totalAmount' },
          codRevenue: { $sum: '$codOrders.totalAmount' },
          totalRevenue: {
            $add: [
              { $sum: '$onlineOrders.totalAmount' },
              { $sum: '$codOrders.totalAmount' },
            ],
          },
        },
      },
    ]);

    const data = result[0] || {
      onlineOrders: [],
      codOrders: [],
      onlineRevenue: 0,
      codRevenue: 0,
      totalRevenue: 0,
    };

    res.json(data);
  } catch (error) {
    console.error('Revenue aggregation error:', error);
    res.status(500).json({ message: 'Error fetching revenue data' });
  }
};

module.exports = { getTodayRevenue };
