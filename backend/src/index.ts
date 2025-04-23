import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import maliciousRequestRoutes from './routes/maliciousRequestRoutes';
import chatbotRoutes from './routes/chatbotRoutes';
import monitoringRoutes from './routes/monitoringRoutes';
import os from 'os';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/malicious-request-db';
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Health check at root route
app.get('/', async (_, res) => {
  try {
    // Check MongoDB connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    // System information
    const systemInfo = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      systemMemory: {
        total: os.totalmem(),
        free: os.freemem()
      },
      loadAverage: os.loadavg()
    };

    res.json({
      status: 'healthy',
      timestamp: new Date(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus
      },
      system: systemInfo,
      services: {
        monitoring: true,
        chatbot: true,
        authentication: true
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date(),
      error: error.message
    });
  }
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/reports', maliciousRequestRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/monitor', monitoringRoutes);

// Keeping the simple health check at /health as a quick alternative
app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});