const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const dbMode = process.env.USE_SAFE_DB === 'true' ? 'SAFE_MODE' : 'PRODUCTION';
    const dbURI = process.env.USE_SAFE_DB === 'true'
      ? process.env.MONGODB_URI_SAFE
      : process.env.MONGODB_URI;

    console.log(`🛡️  Database running in: ${dbMode}`);
    if (dbMode === 'SAFE_MODE') {
      console.log(`📝 Using Database: ${process.env.MONGODB_URI_SAFE.split('/').pop().split('?')[0]}`);
    }

    const conn = await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('👋 MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;