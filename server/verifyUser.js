import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Get username from command line argument
const username = process.argv[2];

if (!username) {
  console.log('❌ Please provide a username');
  console.log('Usage: node verifyUser.js <username>');
  console.log('Example: node verifyUser.js MuhamadHaikal');
  process.exit(1);
}

const verifyUser = async (targetUsername) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    const user = await User.findOne({ username: targetUsername });
    if (!user) {
      console.log('❌ User not found with username:', targetUsername);
      process.exit(1);
    }

    console.log('\n📋 Current User Info:');
    console.log('==================');
    console.log('📧 Email:', user.email);
    console.log('👤 Username:', user.username);
    console.log('🔑 Role:', user.role);
    console.log('✓ Verified:', user.isVerified);
    console.log('🎬 Creator:', user.isCreator);

    // Update to verified
    user.isVerified = true;
    await user.save();

    console.log('\n✅ User verified successfully!\n');
    console.log('📋 Updated User Info:');
    console.log('==================');
    console.log('📧 Email:', user.email);
    console.log('👤 Username:', user.username);
    console.log('🔑 Role:', user.role);
    console.log('✓ Verified:', user.isVerified);
    console.log('🎬 Creator:', user.isCreator);
    console.log('\n💙 Blue verified badge will now appear next to this user\'s name!\n');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying user:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

verifyUser(username);
