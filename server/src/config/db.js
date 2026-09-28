const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/iams_amc_db';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    });

    isConnected = true;
    console.log(`[MongoDB] Connected to database: ${conn.connection.name} at ${conn.connection.host}:${conn.connection.port}`);

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Connection error event:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.warn('[MongoDB] Disconnected from database.');
    });

    return conn;
  } catch (error) {
    isConnected = false;
    console.error(`[MongoDB] FATAL: Failed to connect to MongoDB at ${uri}`);
    console.error(`[MongoDB] Error message: ${error.message}`);
    // Fail clearly as required: The server MUST fail clearly if MongoDB cannot connect.
    process.exit(1);
  }
};

const disconnectDB = async () => {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
    console.log('[MongoDB] Connection closed gracefully.');
  }
};

const getDBStatus = () => {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    databaseName: mongoose.connection.name || 'none'
  };
};

module.exports = {
  connectDB,
  disconnectDB,
  getDBStatus
};
