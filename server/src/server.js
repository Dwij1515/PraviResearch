require('dotenv').config();
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  // Connect to MongoDB (fails fast and exits if connection fails)
  await connectDB();

  server = app.listen(PORT, () => {
    console.log(`[IAMS Server] Listening on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`[IAMS Server] Health check available at http://localhost:${PORT}/api/v1/health`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal) => {
    console.log(`\n[IAMS Server] ${signal} signal received. Closing HTTP server and database connection...`);
    if (server) {
      server.close(async () => {
        console.log('[IAMS Server] HTTP server closed.');
        await disconnectDB();
        process.exit(0);
      });
    } else {
      await disconnectDB();
      process.exit(0);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[IAMS Server] Unhandled Promise Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('[IAMS Server] Uncaught Exception thrown:', error);
    process.exit(1);
  });
};

startServer();
