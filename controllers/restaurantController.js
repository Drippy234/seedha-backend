const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const User = require('../models/User'); // 🚨 1. ADDED THIS IMPORT

// 1. Setup a new restaurant (The one that went missing!)
const setupRestaurant = async (req, res) => {
  try {
    console.log("🚀 SETUP RESTAURANT HIT ===>");
    console.log(req.body);

    const { ownerId, name, address, latitude, longitude, imageUrl } = req.body;

    if (!ownerId || !name || !address || !latitude || !longitude) {
      return res.status(400).json({ message: 'Please provide all required fields, including GPS location.' });
    }

    // Prevent duplicate restaurants for the same owner
    const existing = await Restaurant.findOne({ owner: ownerId });
    if (existing) {
      return res.status(400).json({ message: 'You already have a restaurant registered. Please manage it from your dashboard.' });
    }

    const newRestaurant = new Restaurant({
      owner: ownerId,
      name: name,
      address: address,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=500&auto=format&fit=crop',
      location: {
        type: 'Point',
        coordinates: [longitude, latitude] // Longitude MUST be first in MongoDB!
      },
      isSubscribed: false // 🚨 Changed: New stores must pay first to go live
    });

    await newRestaurant.save();

    // 🚨 2. NEW: Link this new restaurant back to the Owner's user account!
    await User.findByIdAndUpdate(ownerId, { restaurantId: newRestaurant._id });

    res.status(201).json({
      message: 'Restaurant successfully registered on the map!',
      restaurant: newRestaurant
    });

  } catch (error) {
    console.error('Error saving restaurant:', error);
    res.status(500).json({ message: 'Server error while saving restaurant profile.' });
  }
};

// 2. Get all subscribed (live) restaurants for the Customer Home Feed
const getLiveRestaurants = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 10000 } = req.query; // maxDistance in meters (10km = 10000m)

    let query = { isSubscribed: true };
    
    // If user provides location, filter by 10km range
    if (latitude && longitude) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance) // 10km radius
        }
      };
    }

    const liveRestaurants = await Restaurant.find(query);
    res.json(liveRestaurants);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching live restaurants' });
  }
};

// 3. Get the specific menu for a restaurant when clicked
const getRestaurantMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const menu = await MenuItem.find({ restaurant: id, isAvailable: true });
    res.json(menu);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching menu' });
  }
};

// 4. Get a single restaurant's details (For the Dashboard)
const getSingleRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
    res.json(restaurant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching restaurant details' });
  }
};

// 5. Add a new menu item to a restaurant
const addMenuItem = async (req, res) => {
  try {
    const { id } = req.params; // restaurant ID
    const { name, price, category, imageUrl, description } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ message: 'Name, price, and category are required' });
    }

    const newItem = new MenuItem({
      restaurant: id,
      name,
      price,
      category,
      imageUrl,
      description
    });

    await newItem.save();
    res.status(201).json({ message: 'Menu item added successfully', item: newItem });
  } catch (error) {
    console.error('Error adding menu item:', error);
    res.status(500).json({ message: 'Failed to add menu item' });
  }
};

// 6. Get a restaurant by its owner ID (For login restoration)
const getRestaurantByOwner = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const restaurant = await Restaurant.findOne({ owner: ownerId });
    if (!restaurant) return res.status(404).json({ message: 'No store found for this owner.' });
    res.json(restaurant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching owner store' });
  }
};

// 7. Activate Subscription
const activateSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    // Calculate 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      id,
      { isSubscribed: true, subscriptionExpiresAt: expiresAt },
      { new: true }
    );

    if (!updatedRestaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.json({ message: 'Subscription activated', restaurant: updatedRestaurant });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to activate subscription' });
  }
};

// 8. Delete a menu item
const deleteMenuItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const deleted = await MenuItem.findByIdAndDelete(itemId);
    if (!deleted) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Menu item removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete menu item' });
  }
};

// Export ALL functions safely!
module.exports = { setupRestaurant, getLiveRestaurants, getRestaurantMenu, getSingleRestaurant, addMenuItem, getRestaurantByOwner, activateSubscription, deleteMenuItem };