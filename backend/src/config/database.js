const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 seconds to find a server
      socketTimeoutMS: 45000,          // 45 seconds for operations
      maxPoolSize: 10,                 // max 10 connections in pool
      minPoolSize: 2,                  // keep 2 connections warm
      connectTimeoutMS: 10000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Auto-reconnect on disconnect
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB disconnected — attempting reconnect in 5s...');
      setTimeout(() => {
        mongoose.connect(process.env.MONGODB_URI).catch(err => {
          console.error('❌ Reconnect failed:', err.message);
        });
      }, 5000);
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected successfully');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('👋 MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    // Retry after 5 seconds instead of immediately crashing
    console.log('🔁 Retrying DB connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
