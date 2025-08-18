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
import { teamsRoutes } from './routes/teams';
import { taskCommentRoutes } from './routes/taskComments';
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

// Enhanced health check for ECR deployment
app.get('/health', async (req, res) => {
  try {
    const healthCheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        database: 'connected', // TODO: Add actual DB health check
        oidc: process.env.OIDC_ISSUER_URL ? 'configured' : 'not configured',
      },
      container: {
        imageTag: process.env.IMAGE_TAG || 'unknown',
        region: process.env.AWS_REGION || 'unknown',
      }
    };
    
    res.json(healthCheck);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test endpoint without auth
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working', timestamp: new Date().toISOString() });
});

// Debug endpoints without auth (temporary)
app.get('/api/debug/users/all', async (req, res) => {
  try {
    const { UserService } = await import('./services/userService');
    const userService = new UserService();
    const users = await userService.getAllUsers();
    res.json({ users, count: users.length });
  } catch (error) {
    console.error('Debug all users error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/debug/users/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const { UserService } = await import('./services/userService');
    const userService = new UserService();
    const users = await userService.searchUsers(q);
    
    res.json({ users, count: users.length, query: q });
  } catch (error) {
    console.error('Debug search error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', authMiddleware, projectRoutes);
app.use('/api/tasks', authMiddleware, taskRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/workload', authMiddleware, workloadRoutes);
app.use('/api/gantt', authMiddleware, ganttRoutes);
app.use('/api/team', authMiddleware, teamRoutes);
app.use('/api/teams', authMiddleware, teamsRoutes);
app.use('/api/comments', authMiddleware, taskCommentRoutes);



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