const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Restaurant = require('./models/Restaurant');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('📦 MongoDB Connected...'))
  .catch(err => console.log(err));

async function createIndexes() {
  try {
    console.log('🔧 Creating geospatial indexes...\n');

    // Create 2dsphere index for Restaurant location
    await Restaurant.collection.createIndex({ location: '2dsphere' });
    console.log('✅ Created 2dsphere index on Restaurant.location');

    // Create 2dsphere index for User currentLocation
    await User.collection.createIndex({ currentLocation: '2dsphere' });
    console.log('✅ Created 2dsphere index on User.currentLocation');

    console.log('\n✨ All indexes created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  }
}

createIndexes();
