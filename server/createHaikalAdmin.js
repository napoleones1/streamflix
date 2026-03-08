import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const createHaikalAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    const adminData = {
      email: 'haikaladmin@streamflix.com',
      password: 'Haikal_1024', // Strong password
      username: 'Haikaladmin',
      role: 'admin',
      isVerified: true,
      isCreator: true,
      channelName: 'Haikal Admin',
      channelDescription: 'StreamFlix Super Administrator - Highest Authority',
      avatar: '' // Optional: bisa ditambahkan nanti
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: adminData.email },
        { username: adminData.username }
      ]
    });

    if (existingAdmin) {
      console.log('⚠️  Admin account already exists!');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Username:', existingAdmin.username);
      console.log('🔑 Role:', existingAdmin.role);
      console.log('✓ Verified:', existingAdmin.isVerified);
      
      // Update to ensure admin privileges
      if (existingAdmin.role !== 'admin' || !existingAdmin.isVerified) {
        existingAdmin.role = 'admin';
        existingAdmin.isVerified = true;
        existingAdmin.channelName = adminData.channelName;
        existingAdmin.channelDescription = adminData.channelDescription;
        await existingAdmin.save();
        console.log('✅ Updated existing user to Super Admin!');
      }
      
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create new super admin
    const admin = new User(adminData);
    await admin.save();

    console.log('\n🎉 ═══════════════════════════════════════════════════════');
    console.log('✅ SUPER ADMIN ACCOUNT CREATED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('🔐 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email     :', admin.email);
    console.log('👤 Username  :', admin.username);
    console.log('🔒 Password  : Haikal_1024');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('👑 Admin Privileges:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 Role      :', admin.role.toUpperCase());
    console.log('✓ Verified   :', admin.isVerified ? 'YES' : 'NO');
    console.log('🎬 Creator   :', admin.isCreator ? 'YES' : 'NO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📋 Channel Info:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📺 Name      :', admin.channelName);
    console.log('📝 Description:', admin.channelDescription);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('🎯 Access Rights:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Full Admin Dashboard Access');
    console.log('✅ Manage All Users');
    console.log('✅ Manage All Videos');
    console.log('✅ Verify/Unverify Creators');
    console.log('✅ Change User Roles');
    console.log('✅ Delete Users & Videos');
    console.log('✅ View Platform Statistics');
    console.log('✅ Monitor Activity Logs');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('🌐 Login URL: http://localhost:3000/login');
    console.log('🛡️  Admin Dashboard: http://localhost:3000/admin-dashboard\n');
    
    console.log('⚠️  SECURITY NOTES:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('• Keep credentials secure');
    console.log('• Do not share admin access');
    console.log('• Change password regularly');
    console.log('• Monitor admin activity logs');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR CREATING ADMIN:', error.message);
    if (error.code === 11000) {
      console.error('⚠️  Duplicate key error - User with this email or username already exists');
    }
    await mongoose.connection.close();
    process.exit(1);
  }
};

createHaikalAdmin();
