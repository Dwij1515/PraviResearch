const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { getDBStatus } = require('./config/db');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Route modules
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const auditRoutes = require('./routes/auditRoutes');
const assetRoutes = require('./routes/assetRoutes');
const inspectionRoutes = require('./routes/inspectionRoutes');
const workOrderRoutes = require('./routes/workOrderRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

// 1. Security Middleware
app.use(helmet());

// 2. CORS configuration
const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, server-to-server) or matching origin
      if (!origin || origin === allowedOrigin || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy blocked access from origin ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// 3. Request Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// 4. Body Parser with safe payload limit
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// 5. System Health Check Endpoint
app.get('/api/v1/health', (req, res) => {
  const dbStatus = getDBStatus();
  res.status(200).json({
    success: true,
    data: {
      service: 'iams-server',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: dbStatus
    }
  });
});

// 6. API Route Mounting
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/assets', assetRoutes);
app.use('/api/v1/inspections', inspectionRoutes);
app.use('/api/v1/work-orders', workOrderRoutes);
app.use('/api/v1/ai', aiRoutes);

// 7. Fallback & Centralized Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
