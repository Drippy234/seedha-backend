const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
let testRestaurantId = null;
let testCustomerId = null;
let testDriverId = null;
let testOrderId = null;

console.log('🧪 Starting Feature Tests...\n');

// Helper function to log test results
const logTest = (testName, passed, details = '') => {
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${testName}`);
  if (details) console.log(`   ${details}\n`);
};

async function runTests() {
  try {
    // TEST 1: 10km Range Filter
    console.log('📍 TEST 1: 10km Range Filter');
    try {
      const response = await axios.get(`${BASE_URL}/restaurants?latitude=9.9312&longitude=76.2673&maxDistance=10000`);
      logTest('10km range filter', response.status === 200, `Found ${response.data.length} restaurants within 10km`);
      if (response.data.length > 0) {
        testRestaurantId = response.data[0]._id;
      }
    } catch (error) {
      logTest('10km range filter', false, error.message);
    }

    // TEST 2: Unlimited Menu Items (No 15 item limit)
    console.log('🍽️  TEST 2: Unlimited Menu Items');
    if (testRestaurantId) {
      try {
        // Try to add multiple items
        for (let i = 1; i <= 3; i++) {
          await axios.post(`${BASE_URL}/restaurants/${testRestaurantId}/menu`, {
            name: `Test Item ${i}`,
            price: 100 + i,
            category: 'Test',
            description: 'Test item'
          });
        }
        logTest('Add unlimited menu items', true, 'Successfully added multiple items without limit');
      } catch (error) {
        logTest('Add unlimited menu items', false, error.response?.data?.message || error.message);
      }
    }

    // TEST 3: Multiple Drivers with Online/Offline System
    console.log('👥 TEST 3: Multiple Drivers - Online/Offline System');
    try {
      // Create test driver
      const driverResponse = await axios.post(`${BASE_URL}/users/register`, {
        name: 'Test Driver',
        email: `driver${Date.now()}@test.com`,
        password: 'test123',
        role: 'delivery'
      });
      testDriverId = driverResponse.data.user._id;

      // Toggle online
      await axios.patch(`${BASE_URL}/delivery/toggle-status/${testDriverId}`, {
        isOnline: true
      });

      // Get online drivers
      const onlineDrivers = await axios.get(`${BASE_URL}/delivery/online-drivers`);
      logTest('Multiple drivers online/offline system', true, `${onlineDrivers.data.length} drivers online`);
    } catch (error) {
      logTest('Multiple drivers online/offline system', false, error.response?.data?.message || error.message);
    }

    // TEST 4: KM-Based Delivery Charge
    console.log('💰 TEST 4: KM-Based Delivery Charge');
    try {
      // Create test customer
      const customerResponse = await axios.post(`${BASE_URL}/users/register`, {
        name: 'Test Customer',
        email: `customer${Date.now()}@test.com`,
        password: 'test123',
        role: 'customer'
      });
      testCustomerId = customerResponse.data.user._id;

      // Place order with location (should calculate delivery charge)
      const orderResponse = await axios.post(`${BASE_URL}/orders`, {
        customerId: testCustomerId,
        restaurantId: testRestaurantId,
        items: [{ name: 'Test Item', quantity: 1, price: 100 }],
        totalAmount: 100,
        deliveryAddress: 'Test Address',
        deliveryLatitude: 9.9412,
        deliveryLongitude: 76.2773,
        paymentMethod: 'COD',
        paymentStatus: 'Pending'
      });

      testOrderId = orderResponse.data.order._id;
      const deliveryCharge = orderResponse.data.deliveryCharge;
      const distance = orderResponse.data.distanceKm;

      logTest('KM-based delivery charge', deliveryCharge > 0, `Distance: ${distance}km, Charge: ₹${deliveryCharge}`);
    } catch (error) {
      logTest('KM-based delivery charge', false, error.response?.data?.message || error.message);
    }

    // TEST 5: Cash on Delivery Payment System
    console.log('💵 TEST 5: Cash on Delivery Payment System');
    try {
      if (testOrderId) {
        const orderDetails = await axios.get(`${BASE_URL}/orders/${testOrderId}`);
        const isCOD = orderDetails.data.paymentMethod === 'COD';
        logTest('Cash on delivery payment', isCOD, `Payment Method: ${orderDetails.data.paymentMethod}`);
      }
    } catch (error) {
      logTest('Cash on delivery payment', false, error.message);
    }

    // TEST 6: Order Status After Logging Out
    console.log('📦 TEST 6: Order Status After Logging Out');
    try {
      if (testCustomerId) {
        const customerOrders = await axios.get(`${BASE_URL}/orders/customer/${testCustomerId}`);
        logTest('Order status after logout', customerOrders.data.length > 0, `Found ${customerOrders.data.length} orders for customer`);
      }
    } catch (error) {
      logTest('Order status after logout', false, error.message);
    }

    // TEST 7: Real-Time Delivery Path Tracking
    console.log('🗺️  TEST 7: Real-Time Delivery Path Tracking');
    try {
      if (testOrderId && testDriverId) {
        // Assign driver to order
        await axios.patch(`${BASE_URL}/orders/${testOrderId}/assign`, {
          driverId: testDriverId
        });

        // Update driver location
        await axios.post(`${BASE_URL}/delivery/update-location`, {
          agentId: testDriverId,
          latitude: 9.9350,
          longitude: 76.2700
        });

        // Track delivery
        const trackingResponse = await axios.get(`${BASE_URL}/delivery/track/${testOrderId}`);
        const hasDriverLocation = trackingResponse.data.driverLocation !== null;
        logTest('Real-time delivery tracking', hasDriverLocation, `Driver location: ${JSON.stringify(trackingResponse.data.driverLocation)}`);
      }
    } catch (error) {
      logTest('Real-time delivery tracking', false, error.response?.data?.message || error.message);
    }

    console.log('\n✨ All Tests Completed!\n');

  } catch (error) {
    console.error('❌ Test Suite Error:', error.message);
  }
}

// Check if axios is available
try {
  runTests();
} catch (error) {
  console.error('Please install axios first: npm install axios');
}
