const express = require('express');
const router = express.Router();
const { setupRestaurant, getLiveRestaurants, getRestaurantMenu, getSingleRestaurant, addMenuItem, getRestaurantByOwner, activateSubscription, deleteMenuItem } = require('../controllers/restaurantController');

router.post('/setup', setupRestaurant);
router.get('/live', getLiveRestaurants);
router.get('/my-store/:ownerId', getRestaurantByOwner);
router.get('/:id/menu', getRestaurantMenu);
router.post('/:id/menu', addMenuItem);
router.delete('/:id/menu/:itemId', deleteMenuItem);
router.patch('/:id/subscribe', activateSubscription);
router.get('/:id', getSingleRestaurant);

module.exports = router;