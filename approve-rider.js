/**
 * Usage:
 *   node approve-rider.js <userId> [approved|rejected]
 *
 * Examples:
 *   node approve-rider.js 64f1a2b3c4d5e6f7a8b9c0d1
 *   node approve-rider.js 64f1a2b3c4d5e6f7a8b9c0d1 rejected
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./models/User');

const userId = process.argv[2];
const status = process.argv[3] || 'approved';

if (!userId) {
  console.error('❌ Please provide a userId.\n   Usage: node approve-rider.js <userId> [approved|rejected]');
  process.exit(1);
}

if (!['approved', 'rejected'].includes(status)) {
  console.error('❌ Status must be "approved" or "rejected"');
  process.exit(1);
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findByIdAndUpdate(userId, { verificationStatus: status }, { new: true });
  if (!user) {
    console.error('❌ User not found:', userId);
  } else {
    console.log(`✅ Rider "${user.name}" (${user.email}) has been ${status}.`);
  }
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
