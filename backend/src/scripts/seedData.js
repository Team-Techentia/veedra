const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Category = require('../models/Category');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

const seedUsers = async () => {
  try {
    console.log('🌱 Seeding users...');
    
    // Clear existing users
    await User.deleteMany({});
    
    // Create sample users with hashed passwords
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    const users = [
      {
        name: 'System Owner',
        email: 'owner@erp.com',
        password: hashedPassword,
        role: 'owner',
        phone: '+91-9876543210',
        isActive: true,
        employeeId: 'EMP001',
        address: {
          street: '123 Business Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        }
      },
      {
        name: 'Store Manager',
        email: 'manager@erp.com',
        password: hashedPassword,
        role: 'manager',
        phone: '+91-9876543211',
        isActive: true,
        employeeId: 'EMP002',
        salary: 50000,
        commissionRate: 2,
        address: {
          street: '456 Manager Lane',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400002'
        }
      },
      {
        name: 'Billing Staff',
        email: 'staff@erp.com',
        password: hashedPassword,
        role: 'staff',
        phone: '+91-9876543212',
        isActive: true,
        employeeId: 'EMP003',
        salary: 25000,
        commissionRate: 1,
        address: {
          street: '789 Staff Colony',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400003'
        }
      }
    ];
    
    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users`);
    
    return createdUsers;
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
};

const seedVendors = async (ownerId) => {
  try {
    console.log('🌱 Seeding vendors...');
    
    // Clear existing vendors
    await Vendor.deleteMany({});
    
    const vendors = [
      {
        name: 'ABC Suppliers',
        code: 'VEN001001',
        contact: {
          phone: '+91-9123456789',
          email: 'contact@abcsuppliers.com',
          address: {
            street: '123 Supplier Street',
            city: 'Delhi',
            state: 'Delhi',
            pincode: '110001',
            country: 'India'
          }
        },
        commissionRate: 5,
        paymentTerms: '30days',
        gstNumber: '07ABCDE1234F1Z5',
        panNumber: 'ABCDE1234F',
        createdBy: ownerId,
        isActive: true
      },
      {
        name: 'XYZ Distributors',
        code: 'VEN001002',
        contact: {
          phone: '+91-9234567890',
          email: 'info@xyzdist.com',
          address: {
            street: '456 Distribution Hub',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560001',
            country: 'India'
          }
        },
        commissionRate: 3,
        paymentTerms: '15days',
        gstNumber: '29XYZAB1234C1Z8',
        panNumber: 'XYZAB1234C',
        createdBy: ownerId,
        isActive: true
      }
    ];
    
    const createdVendors = await Vendor.insertMany(vendors);
    console.log(`✅ Created ${createdVendors.length} vendors`);
    
    return createdVendors;
  } catch (error) {
    console.error('❌ Error seeding vendors:', error);
    throw error;
  }
};

const seedCategories = async (ownerId) => {
  try {
    console.log('🌱 Seeding categories...');
    
    // Clear existing categories
    await Category.deleteMany({});
    
    const categories = [
      {
        name: 'Electronics',
        code: 'CATELE001',
        description: 'Electronic items and gadgets',
        level: 0,
        sortOrder: 1,
        createdBy: ownerId,
        isActive: true
      },
      {
        name: 'Clothing',
        code: 'CATCLO002',
        description: 'Apparel and fashion items',
        level: 0,
        sortOrder: 2,
        createdBy: ownerId,
        isActive: true
      },
      {
        name: 'Home & Garden',
        code: 'CATHOM003',
        description: 'Home improvement and garden items',
        level: 0,
        sortOrder: 3,
        createdBy: ownerId,
        isActive: true
      }
    ];
    
    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ Created ${createdCategories.length} categories`);
    
    return createdCategories;
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  }
};

const seedDatabase = async () => {
  try {
    console.log('🚀 Starting database seeding...');
    
    await connectDB();
    
    // Seed users first
    const users = await seedUsers();
    const owner = users.find(user => user.role === 'owner');
    
    // Seed vendors and categories
    await Promise.all([
      seedVendors(owner._id),
      seedCategories(owner._id)
    ]);
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📋 Demo Login Credentials:');
    console.log('Owner: owner@erp.com / password123');
    console.log('Manager: manager@erp.com / password123');
    console.log('Staff: staff@erp.com / password123');
    console.log('');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = {
  seedDatabase,
  seedUsers,
  seedVendors,
  seedCategories
};