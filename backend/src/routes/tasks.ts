import { Router } from 'express';
import { TaskService } from '../services/taskService';
import { UserService } from '../services/userService';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const taskService = new TaskService();
const userService = new UserService();

// Get tasks for current user
router.get('/user', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get database user from cognitoId
    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found in database' });
    }
    
    const tasks = await taskService.getUserTasks(currentUser.id);
    res.json({ tasks });
  } catch (error) {
    next(error);
  }
});

// Get tasks for a project
router.get('/project/:projectId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    const { projectId } = req.params;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get database user from cognitoId
    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found in database' });
    }
    
    const tasks = await taskService.getProjectTasks(projectId, currentUser.id);
    res.json({ tasks });
  } catch (error) {
    next(error);
  }
});

// Create new task
router.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get database user from cognitoId
    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found in database' });
    }
    
    const task = await taskService.createTask(req.body, currentUser.id);
    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
});

// Get task by ID
router.get('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    const taskId = req.params.id;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get database user from cognitoId
    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found in database' });
    }
    
    const task = await taskService.getTask(taskId, currentUser.id);
    res.json({ task });
  } catch (error) {
    next(error);
  }
});

// Update task
router.put('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    const taskId = req.params.id;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get database user from cognitoId
    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found in database' });
    }
    
    const task = await taskService.updateTask(taskId, req.body, currentUser.id);
    res.json({ task });
  } catch (error) {
    next(error);
  }
});

// Delete task
router.delete('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const cognitoId = req.user?.sub;
    const taskId = req.params.id;
    
    if (!cognitoId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get database user from cognitoId
    const currentUser = req.dbUser || await userService.getUserByCognitoId(cognitoId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found in database' });
    }
    
    await taskService.deleteTask(taskId, currentUser.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as taskRoutes };