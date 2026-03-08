import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    const adminData = {
      email: 'admin@streamflix.com',
      password: 'admin123', // Will be hashed automatically by User model
      username: 'admin',
      role: 'admin',
      isVerified: true,
      channelName: 'StreamFlix Admin',
      channelDescription: 'Official StreamFlix Administrator',
      isCreator: true
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('⚠️  Admin already exists!');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Username:', existingAdmin.username);
      console.log('🔑 Role:', existingAdmin.role);
      console.log('✓ Verified:', existingAdmin.isVerified);
      
      // Update to admin if not already
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        existingAdmin.isVerified = true;
        await existingAdmin.save();
        console.log('✅ Updated existing user to admin!');
      }
      
      process.exit(0);
    }

    // Create new admin
    const admin = new User(adminData);
    await admin.save();

    console.log('\n✅ Admin account created successfully!\n');
    console.log('Login Credentials:');
    console.log('==================');
    console.log('📧 Email:', admin.email);
    console.log('👤 Username:', admin.username);
    console.log('🔒 Password: admin123');
    console.log('🔑 Role:', admin.role);
    console.log('✓ Verified:', admin.isVerified);
    console.log('\n⚠️  Please change the password after first login!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();
