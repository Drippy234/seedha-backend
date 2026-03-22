const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB Connected Successfully!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    console.error('\n🔍 Troubleshooting tips:');
    console.error('   1. Make sure MongoDB is installed and running locally');
    console.error('   2. Run: mongod --dbpath="C:\\data\\db"');
    console.error('   3. Or install MongoDB from: https://www.mongodb.com/try/download/community');
    console.error('   4. Current connection string:', process.env.MONGO_URI);
    console.error('\n⚠️  Server will continue running without database connection\n');
  }
};

module.exports = connectDB;