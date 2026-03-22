const express = require('express');
const router = express.Router();
const { updateLocation, getActiveAgent, toggleOnlineStatus, getOnlineDrivers, getDriverOrders, getDeliveryLocation, subscribeDriver } = require('../controllers/deliveryController');

router.post('/update-location', updateLocation);
router.get('/active-agent/:orderId', getActiveAgent);
router.patch('/toggle-status/:agentId', toggleOnlineStatus); // Toggle online/offline
router.get('/online-drivers', getOnlineDrivers); // Get all online drivers
router.get('/driver-orders/:driverId', getDriverOrders); // Get driver's assigned orders
router.get('/track/:orderId', getDeliveryLocation); // Real-time delivery tracking
router.patch('/:agentId/subscribe', subscribeDriver); // Dummy payment gateway

module.exports = router;
