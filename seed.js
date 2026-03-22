const mongoose = require('mongoose');
const dotenv = require('dotenv');

// 1. Load your environment variables (MongoDB URI)
dotenv.config();

// 2. Import your Models exactly as they are named
const Restaurant = require('./models/Restaurant');
const MenuItem = require('./models/MenuItem'); // <-- MATCHES YOUR FILE NOW

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('📦 MongoDB Connected for Seeding...'))
  .catch(err => console.log(err));

const seedDatabase = async () => {
  try {
    // 3. WIPE OUT THE OLD FAKE DATA
    await Restaurant.deleteMany();
    await MenuItem.deleteMany(); // <-- MATCHES YOUR EXPORT
    console.log('🧹 Cleared old database records...');

    // 4. CREATE SULAIMANI 
    const dummyOwnerId = new mongoose.Types.ObjectId();
    
    const sulaimani = await Restaurant.create({
      owner: dummyOwnerId,
      name: 'Sulaimani',
      address: 'MG Road, Kochi, Kerala',
      imageUrl: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=500&auto=format&fit=crop',
      location: {
        type: 'Point',
        coordinates: [76.2673, 9.9312] // Longitude first!
      },
      isSubscribed: true 
    });

    console.log(`✅ Restaurant Created: ${sulaimani.name}`);

    // 5. ADD REAL MENU ITEMS (Using 'restaurant' instead of 'restaurantId')
    const menuItems = [
      {
        restaurant: sulaimani._id, // <-- MATCHES YOUR SCHEMA EXACTLY
        name: 'Malabar Dum Biryani',
        description: 'Authentic Kerala style biryani cooked with fragrant kaima rice and tender chicken.',
        price: 180,
        category: 'Biryani',
        isAvailable: true
      },
      {
        restaurant: sulaimani._id, // <-- MATCHES YOUR SCHEMA EXACTLY
        name: 'Chicken Shawarma Plate',
        description: 'Juicy roasted chicken served with kuboos, garlic paste, and pickles.',
        price: 150,
        category: 'Snacks',
        isAvailable: true
      },
      {
        restaurant: sulaimani._id, // <-- MATCHES YOUR SCHEMA EXACTLY
        name: 'Cinnamon Sulaimani Tea',
        description: 'Signature black tea infused with cardamom, cinnamon, and a dash of lemon.',
        price: 30,
        category: 'Drinks',
        isAvailable: true
      }
    ];

    await MenuItem.insertMany(menuItems); // <-- MATCHES YOUR EXPORT
    console.log('✅ Real Menu Items Added!');

    console.log('🎉 SEEDING COMPLETE! You can now close this script.');
    process.exit();
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();