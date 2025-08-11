import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authRoutes } from './routes/auth';
import { projectRoutes } from './routes/projects';
import { taskRoutes } from './routes/tasks';
import { userRoutes } from './routes/users';
import { workloadRoutes } from './routes/workload';
import { ganttRoutes } from './routes/gantt';
import { teamRoutes } from './routes/team';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { accessLogger, errorLogger } from './middleware/logger';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Access logging
app.use(accessLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test endpoint without auth
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', authMiddleware, projectRoutes);
app.use('/api/tasks', authMiddleware, taskRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/workload', authMiddleware, workloadRoutes);
app.use('/api/gantt', authMiddleware, ganttRoutes);
app.use('/api/team', authMiddleware, teamRoutes);



// Error handling
app.use(errorLogger);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.success(`🚀 Server running on port ${PORT}`);
  logger.info(`📦 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔐 OIDC Issuer: ${process.env.OIDC_ISSUER_URL}`);
  logger.info(`💾 DynamoDB: ${process.env.DYNAMODB_ENDPOINT}`);
});