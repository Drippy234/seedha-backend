const { exec } = require('child_process');
const mongoose = require('mongoose');

console.log('🔍 Checking MongoDB status...\n');

// Check if MongoDB is installed
exec('mongod --version', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ MongoDB is not installed or not in PATH');
    console.log('\n📥 Please install MongoDB:');
    console.log('   Windows: https://www.mongodb.com/try/download/community');
    console.log('   Or use Docker: docker run -d -p 27017:27017 mongo:latest\n');
    process.exit(1);
  }
  
  console.log('✅ MongoDB is installed');
  console.log(stdout.split('\n')[0]);
  
  // Try to connect
  console.log('\n🔌 Attempting to connect to MongoDB...');
  
  mongoose.connect('mongodb://127.0.0.1:27017/seedha_order', {
    serverSelectionTimeoutMS: 3000
  })
  .then(() => {
    console.log('✅ MongoDB is running and accessible!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    mongoose.connection.close();
    process.exit(0);
  })
  .catch((err) => {
    console.log('❌ Cannot connect to MongoDB');
    console.log('   Error:', err.message);
    console.log('\n💡 To start MongoDB:');
    console.log('   Windows Service: net start MongoDB');
    console.log('   Manual: mongod --dbpath="C:\\data\\db"');
    console.log('   Docker: docker start mongodb\n');
    process.exit(1);
  });
});
