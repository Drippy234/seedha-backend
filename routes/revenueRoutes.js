const express = require('express');
const router = express.Router();
const { getTodayRevenue } = require('../controllers/revenueController');

// GET /api/revenue/today/:restaurantId
router.get('/today/:restaurantId', getTodayRevenue);

module.exports = router;
