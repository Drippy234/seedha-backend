const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Restaurant = require('./models/Restaurant');
const User = require('./models/User');
const Order = require('./models/Order');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('📦 MongoDB Connected...'))
  .catch(err => console.log(err));

async function checkDatabase() {
  try {
    console.log('🔍 Checking database contents...\n');

    const restaurants = await Restaurant.find({});
    console.log(`📍 Restaurants: ${restaurants.length}`);
    restaurants.forEach(r => {
      const coords = r.location?.coordinates || ['N/A', 'N/A'];
      console.log(`  - ${r.name}: [${coords[0]}, ${coords[1]}] (Subscribed: ${r.isSubscribed})`);
    });

    const users = await User.find({});
    console.log(`\n👥 Users: ${users.length}`);
    users.forEach(u => {
      console.log(`  - ${u.name} (${u.role}) - Online: ${u.isOnline || 'N/A'}`);
    });

    const orders = await Order.find({});
    console.log(`\n📦 Orders: ${orders.length}`);
    orders.forEach(o => {
      console.log(`  - Order ${o._id.toString().slice(-6)}: ${o.status} - ₹${o.totalAmount}`);
    });

    // Test geospatial query
    console.log('\n🗺️  Testing geospatial query...');
    const nearbyRestaurants = await Restaurant.find({
      isSubscribed: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [76.2673, 9.9312]
          },
          $maxDistance: 10000
        }
      }
    });
    console.log(`Found ${nearbyRestaurants.length} restaurants within 10km of test location`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDatabase();
