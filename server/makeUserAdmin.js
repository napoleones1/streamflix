import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('❌ Please provide an email address');
  console.log('Usage: node makeUserAdmin.js <email>');
  console.log('Example: node makeUserAdmin.js user@example.com');
  process.exit(1);
}

const makeUserAdmin = async (userEmail) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      console.log('❌ User not found with email:', userEmail);
      process.exit(1);
    }

    console.log('\n📋 Current User Info:');
    console.log('==================');
    console.log('📧 Email:', user.email);
    console.log('👤 Username:', user.username);
    console.log('🔑 Role:', user.role);
    console.log('✓ Verified:', user.isVerified);

    // Update to admin
    user.role = 'admin';
    user.isVerified = true;
    await user.save();

    console.log('\n✅ User updated to admin successfully!\n');
    console.log('📋 Updated User Info:');
    console.log('==================');
    console.log('📧 Email:', user.email);
    console.log('👤 Username:', user.username);
    console.log('🔑 Role:', user.role);
    console.log('✓ Verified:', user.isVerified);
    console.log('\n⚠️  User needs to logout and login again to see admin features!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating user:', error.message);
    process.exit(1);
  }
};

makeUserAdmin(email);
