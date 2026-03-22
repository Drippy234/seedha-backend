const Order = require('../models/Order');
const User = require('../models/User');

// Temporary in-memory store for active agents (since this is a test environment)
// In a real app with thousands of agents, we would use Redis or MongoDB for geospatial queries.
const activeAgents = {};

// Update driver location and online status
const updateLocation = async (req, res) => {
    try {
        const { agentId, latitude, longitude } = req.body;

        if (!agentId || !latitude || !longitude) {
            return res.status(400).json({ message: 'Missing location data' });
        }

        // Update in-memory location
        activeAgents[agentId] = {
            latitude,
            longitude,
            lastUpdated: new Date()
        };

        // Update in database
        await User.findByIdAndUpdate(agentId, {
            currentLocation: {
                type: 'Point',
                coordinates: [longitude, latitude]
            }
        });

        res.status(200).json({ message: 'Location updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating location' });
    }
};

// Get active agent location for an order
const getActiveAgent = async (req, res) => {
    try {
        const { orderId } = req.params;

        // 1. Find the order to see WHO was assigned to it
        const order = await Order.findById(orderId).populate('deliveryAgent', 'name phone');

        if (!order || !order.deliveryAgent) {
            return res.status(404).json({ message: 'No agent assigned to this order yet' });
        }

        const agentId = order.deliveryAgent._id.toString();

        // 2. See if that specific agent is currently broadcasting GPS
        const location = activeAgents[agentId];

        // We always return the agent's name/phone, even if their GPS drops
        res.json({
            agent: order.deliveryAgent,
            location: location || null
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching agent' });
    }
};

// Toggle driver online/offline status
const toggleOnlineStatus = async (req, res) => {
    try {
        const { agentId } = req.params;
        const { isOnline } = req.body;

        const agent = await User.findById(agentId);
        if (!agent) {
            return res.status(404).json({ message: 'Agent not found' });
        }

        // The Gatekeeper: Verify subscription before allowing the driver to go online
        if (isOnline === true) {
            if (!agent.subscriptionStatus || !agent.subscriptionExpiry || new Date(agent.subscriptionExpiry) < new Date()) {
                return res.status(402).json({ 
                    message: 'Please renew your monthly subscription to start receiving orders.',
                    requiresSubscription: true
                });
            }
        }

        agent.isOnline = isOnline;
        const updatedAgent = await agent.save();

        // If going offline, remove from active agents
        if (!isOnline && activeAgents[agentId]) {
            delete activeAgents[agentId];
        }

        res.json({ 
            message: `Driver is now ${isOnline ? 'online' : 'offline'}`,
            agent: updatedAgent 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating online status' });
    }
};

// Get all online drivers
const getOnlineDrivers = async (req, res) => {
    try {
        const onlineDrivers = await User.find({ 
            role: 'delivery', 
            isOnline: true 
        }).select('name phone currentLocation');

        res.json(onlineDrivers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching online drivers' });
    }
};

// Get driver's assigned orders
const getDriverOrders = async (req, res) => {
    try {
        const { driverId } = req.params;
        
        const orders = await Order.find({ 
            deliveryAgent: driverId,
            status: { $in: ['Out for Delivery', 'Preparing'] }
        })
        .populate('restaurant', 'name address location')
        .populate('customer', 'name phone')
        .sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching driver orders' });
    }
};

// Real-time delivery path tracking - get current delivery location
const getDeliveryLocation = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId)
            .populate('deliveryAgent', 'name phone currentLocation')
            .populate('restaurant', 'name location');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Get real-time location from in-memory store if available
        let driverLocation = null;
        if (order.deliveryAgent) {
            const agentId = order.deliveryAgent._id.toString();
            driverLocation = activeAgents[agentId] || null;
        }

        res.json({
            orderId: order._id,
            status: order.status,
            restaurantLocation: order.restaurant.location,
            deliveryLocation: order.deliveryLocation,
            driverLocation: driverLocation,
            driver: order.deliveryAgent
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching delivery location' });
    }
};

// Dummy subscribe driver
const subscribeDriver = async (req, res) => {
    try {
        const { agentId } = req.params;
        const agent = await User.findById(agentId);
        if (!agent) {
            return res.status(404).json({ message: 'Agent not found' });
        }

        agent.subscriptionStatus = true;
        // 30 days from now
        agent.subscriptionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        
        agent.paymentHistory.push({
            amount: 500,
            date: new Date(),
            status: 'success',
            plan: 'Monthly Driver Subscription'
        });

        await agent.save();
        res.json({ message: 'Subscription activated', subscriptionExpiry: agent.subscriptionExpiry });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error activating subscription' });
    }
};

module.exports = { 
    updateLocation, 
    getActiveAgent, 
    toggleOnlineStatus, 
    getOnlineDrivers,
    getDriverOrders,
    getDeliveryLocation,
    subscribeDriver
};
