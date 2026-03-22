const express = require('express');
const router = express.Router();
const { placeOrder, getRestaurantOrders, updateOrderStatus, getRestaurantStats, getUnassignedOrders, assignOrder, getCustomerOrders, getOrderById, getDriverHistory, generateDeliveryOtp, verifyDeliveryOtp, getActiveDriverOrder, cancelOrder } = require('../controllers/orderController');

router.post('/', placeOrder);
router.get('/unassigned', getUnassignedOrders);
router.get('/restaurant/:id/stats', getRestaurantStats);
router.get('/restaurant/:id', getRestaurantOrders);
router.get('/customer/:customerId', getCustomerOrders);
router.get('/driver/:driverId/history', getDriverHistory);
router.get('/driver/active/:driverId', getActiveDriverOrder);
router.get('/:id', getOrderById);
router.patch('/:id/assign', assignOrder);
router.patch('/:id/status', updateOrderStatus);
router.put('/cancel/:id', cancelOrder);
router.post('/:id/delivery-otp', generateDeliveryOtp);
router.post('/:id/verify-delivery-otp', verifyDeliveryOtp);

module.exports = router;