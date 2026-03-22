const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const Restaurant = require('./models/Restaurant');
const MenuItem = require('./models/MenuItem');
const User = require('./models/User');
const Order = require('./models/Order');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('📦 MongoDB Connected for Test Data Seeding...'))
  .catch(err => console.log(err));

const seedTestData = async () => {
  try {
    // Clear existing data
    await Restaurant.deleteMany();
    await MenuItem.deleteMany();
    await User.deleteMany();
    await Order.deleteMany();
    console.log('🧹 Cleared old database records...\n');

    // 1. CREATE USERS (Customer, Restaurant Owner, Delivery Drivers)
    console.log('👥 Creating Users...');
    
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Customer
    const customer = await User.create({
      name: 'John Customer',
      email: 'customer@test.com',
      phone: '9876543210',
      password: hashedPassword,
      role: 'customer',
      isVerified: true
    });
    console.log('✅ Customer created:', customer.email);

    // Restaurant Owner
    const restaurantOwner = await User.create({
      name: 'Restaurant Owner',
      email: 'owner@test.com',
      phone: '9876543211',
      password: hashedPassword,
      role: 'restaurant',
      isVerified: true
    });
    console.log('✅ Restaurant Owner created:', restaurantOwner.email);

    // Delivery Drivers (Multiple)
    const driver1 = await User.create({
      name: 'Driver One',
      email: 'driver1@test.com',
      phone: '9876543212',
      password: hashedPassword,
      role: 'delivery',
      isVerified: true,
      isOnline: true,
      currentLocation: {
        type: 'Point',
        coordinates: [76.2673, 9.9312]
      }
    });
    console.log('✅ Driver 1 created (ONLINE):', driver1.email);

    const driver2 = await User.create({
      name: 'Driver Two',
      email: 'driver2@test.com',
      phone: '9876543213',
      password: hashedPassword,
      role: 'delivery',
      isVerified: true,
      isOnline: false,
      currentLocation: {
        type: 'Point',
        coordinates: [76.2700, 9.9350]
      }
    });
    console.log('✅ Driver 2 created (OFFLINE):', driver2.email);

    const driver3 = await User.create({
      name: 'Driver Three',
      email: 'driver3@test.com',
      phone: '9876543214',
      password: hashedPassword,
      role: 'delivery',
      isVerified: true,
      isOnline: true,
      currentLocation: {
        type: 'Point',
        coordinates: [76.2650, 9.9300]
      }
    });
    console.log('✅ Driver 3 created (ONLINE):', driver3.email);

    // 2. CREATE RESTAURANTS (Within 10km range)
    console.log('\n🏪 Creating Restaurants...');

    const restaurant1 = await Restaurant.create({
      owner: restaurantOwner._id,
      name: 'Sulaimani Restaurant',
      address: 'MG Road, Kochi, Kerala',
      imageUrl: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=500',
      location: {
        type: 'Point',
        coordinates: [76.2673, 9.9312] // Within 10km
      },
      isSubscribed: true,
      subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    console.log('✅ Restaurant 1 created:', restaurant1.name);

    const restaurant2 = await Restaurant.create({
      owner: restaurantOwner._id,
      name: 'Spice Garden',
      address: 'Fort Kochi, Kerala',
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=500',
      location: {
        type: 'Point',
        coordinates: [76.2750, 9.9400] // Within 10km
      },
      isSubscribed: true,
      subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    console.log('✅ Restaurant 2 created:', restaurant2.name);

    const restaurant3 = await Restaurant.create({
      owner: restaurantOwner._id,
      name: 'Far Away Restaurant',
      address: 'Trivandrum, Kerala',
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=500',
      location: {
        type: 'Point',
        coordinates: [76.9366, 8.5241] // Far away (>10km)
      },
      isSubscribed: true,
      subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    console.log('✅ Restaurant 3 created (FAR AWAY):', restaurant3.name);

    // Link restaurant to owner
    await User.findByIdAndUpdate(restaurantOwner._id, { restaurantId: restaurant1._id });

    // 3. CREATE MENU ITEMS (More than 15 to test no limit)
    console.log('\n🍽️  Creating Menu Items...');

    const menuItems = [
      // Restaurant 1 - 20 items (testing no 15-item limit)
      { restaurant: restaurant1._id, name: 'Malabar Biryani', description: 'Authentic Kerala biryani', price: 180, category: 'Biryani', isAvailable: true },
      { restaurant: restaurant1._id, name: 'Chicken Shawarma', description: 'Juicy roasted chicken', price: 150, category: 'Snacks', isAvailable: true },
      { restaurant: restaurant1._id, name: 'Sulaimani Tea', description: 'Black tea with spices', price: 30, category: 'Drinks', isAvailable: true },
      { restaurant: restaurant1._id, name: 'Beef Fry', description: 'Kerala style beef fry', price: 200, category: 'Main Course', isAvailable: true },
      { restaurant: restaurant1._id, name: 'Porotta', description: 'Layered flatbread', price: 20, category: 'Bread', isAvailable: true },
      { restaurant: restaurant1._id, name: 'Fish Curry', description: 'Traditional Kerala fish curry', price: 220, category: 'Main Course', isAvailable: true },
      { restaurant: restaurant1._id, name: 'Chicken 65', description: 'Spicy fried chicken', price: 180, category: 'Snacks', isAvailable: true },
      { restaurant: restaurant1._id, name: 'Appam', description: 'Rice pancake', price: 15, category: 'Bread', isAvailable: true },
      { restaurant: restaurant1._id, name: 'Prawn Curry', description: 'Coconut based prawn curry', price: 250, category: 'Main Course', isAvailable: true },
      { restaurant: restaurant1._id, name: 'Masala Dosa', description: 'Crispy dosa with potato filling', price: 80, category: 'Breakfast', isAvailable: true },
      { restaurant: restaurant1._id, name: 'Idli', description: 'Steamed rice cakes', price: 40, category: 'Breakfast', isAvailable: true },
      { restaurant: restaurant1._id, name: 'Vada', description: 'Fried lentil donuts', price: 35, category: 'Breakfast', isAvailable: true },
      { restaurant: restaurant1._id, name: 'Sambar', description: 'Lentil vegetable stew', price: 30, category: 'Sides', isAvailable: true },
      { restaurant: restaurant1._id, name: 'Coconut Chutney', description: 'Fresh coconut chutney', price: 20, category: 'Sides', isAvailable: true },
      { restaurant: restaurant1._id, name: 'Lime Juice', description: 'Fresh lime soda', price: 40, category: 'Drinks', isAvailable: true },
      { restaurant: restaurant1._id, name: 'Mango Lassi', description: 'Yogurt mango drink', price: 60, category: 'Drinks', isAvailable: true },
      { restaurant: restaurant1._id, name: 'Payasam', description: 'Traditional dessert', price: 70, category: 'Dessert', isAvailable: true },
      { restaurant: restaurant1._id, name: 'Banana Fritters', description: 'Fried banana snack', price: 50, category: 'Dessert', isAvailable: true },
      { restaurant: restaurant1._id, name: 'Egg Roast', description: 'Spicy egg curry', price: 90, category: 'Main Course', isAvailable: true },
      { restaurant: restaurant1._id, name: 'Puttu', description: 'Steamed rice cake', price: 45, category: 'Breakfast', isAvailable: true },

      // Restaurant 2 - 10 items
      { restaurant: restaurant2._id, name: 'Paneer Tikka', description: 'Grilled cottage cheese', price: 160, category: 'Starters', isAvailable: true },
      { restaurant: restaurant2._id, name: 'Butter Chicken', description: 'Creamy tomato chicken', price: 220, category: 'Main Course', isAvailable: true },
      { restaurant: restaurant2._id, name: 'Naan', description: 'Tandoor bread', price: 30, category: 'Bread', isAvailable: true },
      { restaurant: restaurant2._id, name: 'Dal Makhani', description: 'Creamy black lentils', price: 140, category: 'Main Course', isAvailable: true },
      { restaurant: restaurant2._id, name: 'Veg Biryani', description: 'Vegetable biryani', price: 150, category: 'Biryani', isAvailable: true },
      { restaurant: restaurant2._id, name: 'Raita', description: 'Yogurt side dish', price: 40, category: 'Sides', isAvailable: true },
      { restaurant: restaurant2._id, name: 'Gulab Jamun', description: 'Sweet milk balls', price: 60, category: 'Dessert', isAvailable: true },
      { restaurant: restaurant2._id, name: 'Masala Chai', description: 'Spiced tea', price: 25, category: 'Drinks', isAvailable: true },
      { restaurant: restaurant2._id, name: 'Samosa', description: 'Fried pastry', price: 30, category: 'Snacks', isAvailable: true },
      { restaurant: restaurant2._id, name: 'Tandoori Chicken', description: 'Clay oven chicken', price: 240, category: 'Main Course', isAvailable: true }
    ];

    await MenuItem.insertMany(menuItems);
    console.log(`✅ Created ${menuItems.length} menu items (20 for Restaurant 1 - testing no limit!)`);

    // 4. CREATE ORDERS (Testing different scenarios)
    console.log('\n📦 Creating Test Orders...');

    // Order 1 - Pending with COD
    const order1 = await Order.create({
      customer: customer._id,
      restaurant: restaurant1._id,
      items: [
        { name: 'Malabar Biryani', quantity: 2, price: 180 },
        { name: 'Sulaimani Tea', quantity: 1, price: 30 }
      ],
      totalAmount: 390,
      deliveryCharge: 30,
      distanceKm: 2.5,
      deliveryAddress: 'Marine Drive, Kochi',
      deliveryLocation: {
        type: 'Point',
        coordinates: [76.2750, 9.9400]
      },
      status: 'Pending',
      paymentMethod: 'COD',
      paymentStatus: 'Pending'
    });
    console.log('✅ Order 1 created: Pending with COD');

    // Order 2 - Out for Delivery with assigned driver
    const order2 = await Order.create({
      customer: customer._id,
      restaurant: restaurant1._id,
      deliveryAgent: driver1._id,
      items: [
        { name: 'Chicken Shawarma', quantity: 3, price: 150 }
      ],
      totalAmount: 450,
      deliveryCharge: 40,
      distanceKm: 3.8,
      deliveryAddress: 'Edappally, Kochi',
      deliveryLocation: {
        type: 'Point',
        coordinates: [76.3080, 10.0250]
      },
      status: 'Out for Delivery',
      paymentMethod: 'COD',
      paymentStatus: 'Pending'
    });
    console.log('✅ Order 2 created: Out for Delivery with Driver 1');

    // Order 3 - Delivered
    const order3 = await Order.create({
      customer: customer._id,
      restaurant: restaurant2._id,
      deliveryAgent: driver3._id,
      items: [
        { name: 'Butter Chicken', quantity: 1, price: 220 },
        { name: 'Naan', quantity: 2, price: 30 }
      ],
      totalAmount: 280,
      deliveryCharge: 20,
      distanceKm: 1.2,
      deliveryAddress: 'Fort Kochi',
      deliveryLocation: {
        type: 'Point',
        coordinates: [76.2650, 9.9650]
      },
      status: 'Delivered',
      paymentMethod: 'COD',
      paymentStatus: 'Paid'
    });
    console.log('✅ Order 3 created: Delivered');

    console.log('\n✨ TEST DATA SEEDING COMPLETE!\n');
    console.log('📊 Summary:');
    console.log(`   - Users: 1 Customer, 1 Owner, 3 Drivers (2 online, 1 offline)`);
    console.log(`   - Restaurants: 3 (2 within 10km, 1 far away)`);
    console.log(`   - Menu Items: ${menuItems.length} (20 items in Restaurant 1 - no limit!)`);
    console.log(`   - Orders: 3 (Pending, Out for Delivery, Delivered)`);
    console.log('\n🔑 Test Credentials:');
    console.log('   Customer: customer@test.com / password123');
    console.log('   Owner: owner@test.com / password123');
    console.log('   Driver 1: driver1@test.com / password123 (ONLINE)');
    console.log('   Driver 2: driver2@test.com / password123 (OFFLINE)');
    console.log('   Driver 3: driver3@test.com / password123 (ONLINE)');
    console.log('\n📍 Test Location (for 10km range): Lat: 9.9312, Lon: 76.2673');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    process.exit(1);
  }
};

seedTestData();
